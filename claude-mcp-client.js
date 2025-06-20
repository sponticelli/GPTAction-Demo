#!/usr/bin/env node

/**
 * Claude Desktop MCP Client for Campaign Performance API
 * This script acts as a bridge between Claude Desktop and your MCP server
 */

const WebSocket = require('ws');

class CampaignPerformanceMCP {
  constructor() {
    this.baseUrl = 'https://gptaction-demo-production.up.railway.app';
    this.wsUrl = 'wss://gptaction-demo-production.up.railway.app/mcp';
    this.ws = null;
    this.requestId = 0;
    this.pendingRequests = new Map();
    this.initialized = false;
    this.accessToken = null;
    this.apiKey = process.env.API_KEY; 
  }

  async connect() {
    try {
      // First, authenticate and get JWT token
      await this.authenticate();

      return new Promise((resolve, reject) => {
        console.error('Connecting to Campaign Performance MCP Server...');

        this.ws = new WebSocket(this.wsUrl);

        this.ws.on('open', () => {
          console.error('WebSocket connection established');
          this.initializeRemoteServer().then(() => {
            this.initialized = true;
            resolve();
          }).catch(reject);
        });

        this.ws.on('message', (data) => {
          this.handleRemoteMessage(JSON.parse(data.toString()));
        });

        this.ws.on('error', (error) => {
          console.error('WebSocket error:', error.message);
          reject(error);
        });

        this.ws.on('close', () => {
          console.error('WebSocket connection closed');
          process.exit(0);
        });
      });
    } catch (error) {
      console.error('Authentication failed:', error.message);
      throw error;
    }
  }

  async authenticate() {
    const fetch = require('node-fetch');

    try {
      console.error('Authenticating with MCP server...');

      const response = await fetch(`${this.baseUrl}/api/v1/mcp/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        },
        body: JSON.stringify({
          client_id: 'claude',
          scope: ['campaigns:read', 'campaigns:export', 'tools:call']
        })
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
      }

      const authData = await response.json();

      if (!authData.success) {
        throw new Error(`Authentication failed: ${authData.message}`);
      }

      this.accessToken = authData.data.access_token;
      console.error('Successfully authenticated with MCP server');

    } catch (error) {
      console.error('Failed to authenticate:', error.message);
      throw error;
    }
  }

  async initializeRemoteServer() {
    const response = await this.sendRemoteRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'Claude Desktop MCP Client',
        version: '1.0.0'
      }
    });

    console.error('Successfully connected to Campaign Performance MCP Server');
    return response;
  }

  async sendRemoteRequest(method, params) {
    return new Promise((resolve, reject) => {
      const id = ++this.requestId;
      const message = {
        jsonrpc: '2.0',
        id,
        method,
        params: {
          ...params,
          // Include authentication token for authenticated requests
          ...(this.accessToken && method !== 'initialize' ? {
            auth: { token: this.accessToken }
          } : {})
        }
      };

      this.pendingRequests.set(id, { resolve, reject });
      this.ws.send(JSON.stringify(message));

      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Request timeout for ${method}`));
        }
      }, 30000);
    });
  }

  handleRemoteMessage(message) {
    if (message.id && this.pendingRequests.has(message.id)) {
      const { resolve, reject } = this.pendingRequests.get(message.id);
      this.pendingRequests.delete(message.id);

      if (message.error) {
        reject(new Error(`${message.error.message} (${message.error.code})`));
      } else {
        resolve(message.result);
      }
    }
  }

  async handleClaudeMessage(message) {
    try {
      if (!this.initialized) {
        throw new Error('MCP server not initialized');
      }

      if (message.method === 'initialize') {
        // Respond to Claude's initialize request
        return {
          jsonrpc: '2.0',
          id: message.id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {}
            },
            serverInfo: {
              name: 'Campaign Performance MCP Server',
              version: '1.0.0'
            }
          }
        };
      } else if (message.method === 'tools/list') {
        // Forward tools/list request to remote server
        const response = await this.sendRemoteRequest('tools/list', message.params || {});
        return {
          jsonrpc: '2.0',
          id: message.id,
          result: response
        };
      } else if (message.method === 'tools/call') {
        // Forward tools/call request to remote server
        const response = await this.sendRemoteRequest('tools/call', message.params);
        return {
          jsonrpc: '2.0',
          id: message.id,
          result: response
        };
      } else {
        throw new Error(`Unknown method: ${message.method}`);
      }
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id: message.id,
        error: {
          code: -32603,
          message: error.message
        }
      };
    }
  }
}

// Initialize the MCP client
const client = new CampaignPerformanceMCP();

// Connect to the remote MCP server
client.connect().then(() => {
  console.error('MCP Client ready for Claude Desktop');
  
  // Handle messages from Claude Desktop
  process.stdin.on('data', async (data) => {
    try {
      const lines = data.toString().trim().split('\n');
      
      for (const line of lines) {
        if (line.trim()) {
          const message = JSON.parse(line);
          const response = await client.handleClaudeMessage(message);
          console.log(JSON.stringify(response));
        }
      }
    } catch (error) {
      console.error('Error processing message from Claude:', error.message);
    }
  });

  // Keep the process alive
  process.stdin.resume();
}).catch((error) => {
  console.error('Failed to connect to MCP server:', error.message);
  process.exit(1);
});
