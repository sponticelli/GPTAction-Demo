#!/usr/bin/env node

/**
 * Simple MCP Client Example
 * Demonstrates how to connect to the Campaign Performance MCP Server
 * and execute various tools
 */

const WebSocket = require('ws');
const fetch = require('node-fetch');

class MCPClient {
  constructor(baseUrl, clientId = 'example-client') {
    this.baseUrl = baseUrl;
    this.wsUrl = baseUrl.replace('http', 'ws') + '/mcp';
    this.clientId = clientId;
    this.accessToken = null;
    this.ws = null;
    this.requestId = 0;
    this.pendingRequests = new Map();
  }

  async authenticate() {
    console.log('🔐 Authenticating with MCP server...');
    
    const response = await fetch(`${this.baseUrl}/api/v1/mcp/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: this.clientId })
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(`Authentication failed: ${data.message}`);
    }

    this.accessToken = data.data.access_token;
    console.log('✅ Authentication successful');
    return this.accessToken;
  }

  async connect() {
    if (!this.accessToken) {
      await this.authenticate();
    }

    console.log('🔌 Connecting to MCP server...');
    
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      this.ws.on('open', () => {
        console.log('✅ WebSocket connection established');
        this.initialize().then(resolve).catch(reject);
      });

      this.ws.on('message', (data) => {
        this.handleMessage(JSON.parse(data.toString()));
      });

      this.ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error.message);
        reject(error);
      });

      this.ws.on('close', () => {
        console.log('🔌 WebSocket connection closed');
      });
    });
  }

  async initialize() {
    const response = await this.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'MCP Example Client',
        version: '1.0.0'
      }
    });

    console.log('✅ MCP server initialized');
    console.log('📋 Server:', response.serverInfo.name, response.serverInfo.version);
    return response;
  }

  async listTools() {
    console.log('🔧 Listing available tools...');
    const response = await this.sendRequest('tools/list', {});
    console.log(`✅ Found ${response.tools.length} tools:`);
    response.tools.forEach(tool => {
      console.log(`   - ${tool.name}: ${tool.description}`);
    });
    return response.tools;
  }

  async callTool(name, args = {}) {
    console.log(`🛠️  Calling tool: ${name}`);
    const response = await this.sendRequest('tools/call', { name, arguments: args });
    
    if (response.isError) {
      console.error(`❌ Tool call failed: ${response.content[0].text}`);
    } else {
      console.log(`✅ Tool call successful`);
      if (response.content[0].type === 'text') {
        try {
          const result = JSON.parse(response.content[0].text);
          console.log('📊 Result:', JSON.stringify(result, null, 2));
        } catch {
          console.log('📊 Result:', response.content[0].text);
        }
      }
    }
    
    return response;
  }

  sendRequest(method, params) {
    return new Promise((resolve, reject) => {
      const id = ++this.requestId;
      const message = {
        jsonrpc: '2.0',
        id,
        method,
        params
      };

      this.pendingRequests.set(id, { resolve, reject });
      this.ws.send(JSON.stringify(message));

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Request timeout for ${method}`));
        }
      }, 30000);
    });
  }

  handleMessage(message) {
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

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Example usage
async function runExample() {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const client = new MCPClient(baseUrl, 'claude');

  try {
    // Connect and initialize
    await client.connect();

    // List available tools
    await client.listTools();

    // Example 1: Health check
    console.log('\n📋 Example 1: Health Check');
    await client.callTool('health_check');

    // Example 2: List campaigns
    console.log('\n📋 Example 2: List Campaigns (iOS, first 5)');
    await client.callTool('list_campaigns', {
      store: 'ios',
      page_size: 5
    });

    // Example 3: Aggregate metrics
    console.log('\n📋 Example 3: Aggregate Metrics (Average CPI by Network)');
    await client.callTool('aggregate_metrics', {
      group_by: 'network',
      metric: 'cpi',
      aggregation: 'avg'
    });

    // Example 4: Export campaigns
    console.log('\n📋 Example 4: Export Campaigns (JSON format)');
    await client.callTool('export_campaigns', {
      format: 'json'
    });

  } catch (error) {
    console.error('❌ Example failed:', error.message);
  } finally {
    client.disconnect();
  }
}

// Command line usage
if (require.main === module) {
  console.log('🚀 Starting MCP Client Example');
  console.log('📍 Server:', process.env.BASE_URL || 'http://localhost:3000');
  
  runExample().catch(error => {
    console.error('❌ Example failed:', error.message);
    process.exit(1);
  });
}

module.exports = MCPClient;
