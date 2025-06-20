#!/usr/bin/env node

/**
 * Simple WebSocket Connection Test
 * Tests basic WebSocket connectivity to the MCP server
 */

const WebSocket = require('ws');

const WS_URL = process.env.WS_URL || 'wss://gptaction-demo-production.up.railway.app/mcp';

console.log('🧪 Testing WebSocket Connection');
console.log(`🔌 WebSocket URL: ${WS_URL}`);

function testWebSocket() {
  return new Promise((resolve, reject) => {
    console.log('🔌 Attempting WebSocket connection...');
    
    const ws = new WebSocket(WS_URL);
    
    ws.on('open', () => {
      console.log('✅ WebSocket connection opened successfully');
      
      // Send a simple ping message
      const pingMessage = {
        jsonrpc: '2.0',
        id: 1,
        method: 'ping',
        params: {}
      };
      
      console.log('📤 Sending ping message...');
      ws.send(JSON.stringify(pingMessage));
      
      // Close after a short delay
      setTimeout(() => {
        ws.close();
        resolve('Connection successful');
      }, 2000);
    });
    
    ws.on('message', (data) => {
      console.log('📥 Received message:', data.toString());
    });
    
    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error.message);
      reject(error);
    });
    
    ws.on('close', (code, reason) => {
      console.log(`🔌 WebSocket closed with code: ${code}, reason: ${reason}`);
    });
    
    // Timeout after 10 seconds
    setTimeout(() => {
      if (ws.readyState === WebSocket.CONNECTING) {
        ws.terminate();
        reject(new Error('Connection timeout'));
      }
    }, 10000);
  });
}

// Test different connection approaches
async function runTests() {
  try {
    // Test 1: Basic connection
    console.log('\n1️⃣ Testing basic WebSocket connection...');
    await testWebSocket();
    console.log('✅ Basic WebSocket test passed');
    
  } catch (error) {
    console.error('❌ WebSocket test failed:', error.message);
    
    // Additional debugging
    console.log('\n🔍 Debugging information:');
    console.log('- URL:', WS_URL);
    console.log('- Protocol:', WS_URL.startsWith('wss://') ? 'Secure WebSocket (WSS)' : 'WebSocket (WS)');
    console.log('- Error type:', error.constructor.name);
    console.log('- Error message:', error.message);
    
    if (error.message.includes('401')) {
      console.log('\n💡 401 Unauthorized suggests:');
      console.log('- Server is requiring authentication');
      console.log('- Check MCP_AUTH_ENABLED environment variable');
      console.log('- Verify CORS configuration');
    }
    
    if (error.message.includes('403')) {
      console.log('\n💡 403 Forbidden suggests:');
      console.log('- CORS policy blocking the connection');
      console.log('- Check MCP_CORS_ORIGIN configuration');
    }
    
    if (error.message.includes('timeout')) {
      console.log('\n💡 Timeout suggests:');
      console.log('- Server not responding');
      console.log('- Network connectivity issues');
      console.log('- WebSocket endpoint not available');
    }
  }
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test suite failed:', error.message);
  process.exit(1);
});
