#!/usr/bin/env node

/**
 * MCP Server Test Script
 * Tests the MCP server functionality including authentication, tool listing, and tool execution
 */

const WebSocket = require('ws');
const fetch = require('node-fetch');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const WS_URL = BASE_URL.replace('http', 'ws') + '/mcp';
const CLIENT_ID = process.env.MCP_CLIENT_ID || 'claude';

console.log('🧪 Starting MCP Server Tests');
console.log(`📍 Base URL: ${BASE_URL}`);
console.log(`🔌 WebSocket URL: ${WS_URL}`);

async function testMCPServer() {
  try {
    // Test 1: Health Check
    console.log('\n1️⃣ Testing MCP Health Check...');
    const healthResponse = await fetch(`${BASE_URL}/api/v1/mcp/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.success ? 'PASSED' : 'FAILED');
    if (!healthData.success) {
      console.error('❌ Health check failed:', healthData.message);
      return;
    }

    // Test 2: Get Server Info
    console.log('\n2️⃣ Testing Server Info...');
    const infoResponse = await fetch(`${BASE_URL}/api/v1/mcp/info`);
    const infoData = await infoResponse.json();
    console.log('✅ Server info:', infoData.success ? 'PASSED' : 'FAILED');
    console.log('📋 Server:', infoData.data.serverInfo.name, infoData.data.serverInfo.version);

    // Test 3: Generate Authentication Token
    console.log('\n3️⃣ Testing Authentication...');
    const authResponse = await fetch(`${BASE_URL}/api/v1/mcp/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: CLIENT_ID })
    });
    const authData = await authResponse.json();
    
    if (!authData.success) {
      console.error('❌ Authentication failed:', authData.message);
      return;
    }
    
    const accessToken = authData.data.access_token;
    console.log('✅ Authentication: PASSED');
    console.log('🔑 Token generated successfully');

    // Test 4: Validate Token
    console.log('\n4️⃣ Testing Token Validation...');
    const validateResponse = await fetch(`${BASE_URL}/api/v1/mcp/auth/validate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ token: accessToken })
    });
    const validateData = await validateResponse.json();
    console.log('✅ Token validation:', validateData.success ? 'PASSED' : 'FAILED');

    // Test 5: List Available Tools
    console.log('\n5️⃣ Testing Tools Listing...');
    const toolsResponse = await fetch(`${BASE_URL}/api/v1/mcp/tools`);
    const toolsData = await toolsResponse.json();
    console.log('✅ Tools listing:', toolsData.success ? 'PASSED' : 'FAILED');
    console.log('🔧 Available tools:', toolsData.data.tools.map(t => t.name).join(', '));

    // Test 6: WebSocket Connection
    console.log('\n6️⃣ Testing WebSocket Connection...');
    await testWebSocketConnection(accessToken);

    console.log('\n🎉 All MCP tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

function testWebSocketConnection(accessToken) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL);

    let testsPassed = 0;
    const totalTests = 3;

    ws.on('open', () => {
      console.log('✅ WebSocket connection: PASSED');
      testsPassed++;

      // Test initialize
      const initMessage = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: {
            name: 'MCP Test Client',
            version: '1.0.0'
          }
        }
      };

      ws.send(JSON.stringify(initMessage));
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.id === 1) {
          // Initialize response
          console.log('✅ Initialize: PASSED');
          console.log('📋 Server capabilities:', Object.keys(message.result.capabilities).join(', '));
          testsPassed++;

          // Test tools/list
          const listToolsMessage = {
            jsonrpc: '2.0',
            id: 2,
            method: 'tools/list',
            params: {}
          };
          ws.send(JSON.stringify(listToolsMessage));
        } else if (message.id === 2) {
          // Tools list response
          console.log('✅ Tools list: PASSED');
          console.log('🔧 Tools via WebSocket:', message.result.tools.map(t => t.name).join(', '));
          testsPassed++;

          // Test tool call
          const callToolMessage = {
            jsonrpc: '2.0',
            id: 3,
            method: 'tools/call',
            params: {
              name: 'health_check',
              arguments: {}
            }
          };
          ws.send(JSON.stringify(callToolMessage));
        } else if (message.id === 3) {
          // Tool call response
          console.log('✅ Tool call: PASSED');
          console.log('🔧 Health check result:', JSON.parse(message.result.content[0].text).success ? 'HEALTHY' : 'UNHEALTHY');
          testsPassed++;
          
          ws.close();
        }
      } catch (error) {
        console.error('❌ WebSocket message error:', error.message);
        reject(error);
      }
    });

    ws.on('close', () => {
      if (testsPassed >= totalTests) {
        console.log('✅ WebSocket tests: PASSED');
        resolve();
      } else {
        reject(new Error(`WebSocket tests incomplete: ${testsPassed}/${totalTests} passed`));
      }
    });

    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error.message);
      reject(error);
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      reject(new Error('WebSocket test timeout'));
    }, 10000);
  });
}

// Test connection endpoint
async function testConnectionEndpoint() {
  console.log('\n7️⃣ Testing Connection Endpoint...');
  try {
    const response = await fetch(`${BASE_URL}/api/v1/mcp/test-connection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        client_id: CLIENT_ID,
        test_tool: 'health_check'
      })
    });
    const data = await response.json();
    console.log('✅ Connection test:', data.success ? 'PASSED' : 'FAILED');
    if (data.success) {
      console.log('🔧 Tool test result:', data.data.toolResult ? 'SUCCESS' : 'NO RESULT');
    }
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
  }
}

// Run tests
async function runAllTests() {
  await testMCPServer();
  await testConnectionEndpoint();
}

// Handle command line execution
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  });
}

module.exports = { testMCPServer, testWebSocketConnection, testConnectionEndpoint };
