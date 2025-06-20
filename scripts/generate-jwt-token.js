#!/usr/bin/env node

/**
 * Generate JWT Token for Claude Desktop Authentication
 * Creates a JWT token using your production secret and API key
 */

const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// Your production configuration
const JWT_SECRET = 'e249b07f750738a72bda840a2d709ec9829cc8271e470ac6010760925687cad5';
const API_KEY = '_9SOEyfYtzHQPGz_bKVMUNRf-y2Abt3QLBsNDsTCnHk';

function generateJWTToken() {
  console.log('🔐 Generating JWT Token for Claude Desktop\n');

  // Create user payload
  const userId = uuidv4();
  const tokenPayload = {
    userId: userId,
    clientId: 'claude',
    permissions: ['campaigns:read', 'campaigns:export', 'tools:call']
  };

  // Generate JWT token
  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

  console.log('Generated JWT Token:');
  console.log('===================');
  console.log(token);
  console.log('');

  console.log('Token Details:');
  console.log('==============');
  console.log(`User ID: ${userId}`);
  console.log(`Client ID: claude`);
  console.log(`Permissions: ${tokenPayload.permissions.join(', ')}`);
  const decoded = jwt.decode(token);
  console.log(`Expires: ${new Date(decoded.exp * 1000).toISOString()}`);
  console.log('');

  console.log('Environment Variables for Railway:');
  console.log('=================================');
  console.log(`NODE_ENV=production`);
  console.log(`API_KEY=${API_KEY}`);
  console.log(`MCP_JWT_SECRET=${JWT_SECRET}`);
  console.log(`MCP_AUTH_ENABLED=true`);
  console.log(`MCP_TOKEN_EXPIRY=24h`);
  console.log(`MCP_ALLOWED_CLIENTS=claude,chatgpt,cursor,vscode,continue`);
  console.log(`MCP_CORS_ORIGIN=https://claude.ai,https://chat.openai.com,https://cursor.sh`);
  console.log('');

  console.log('How to get a token via API (recommended):');
  console.log('=========================================');
  console.log('curl -X POST https://gptaction-demo-production.up.railway.app/api/v1/mcp/auth/token \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log(`  -H "X-API-Key: ${API_KEY}" \\`);
  console.log('  -d \'{\n    "client_id": "claude",\n    "scope": ["campaigns:read", "campaigns:export", "tools:call"]\n  }\'');
  console.log('');

  console.log('Manual token usage in WebSocket:');
  console.log('================================');
  console.log('```json');
  console.log('{');
  console.log('  "jsonrpc": "2.0",');
  console.log('  "id": 1,');
  console.log('  "method": "tools/list",');
  console.log('  "params": {');
  console.log('    "auth": {');
  console.log(`      "token": "${token}"`);
  console.log('    }');
  console.log('  }');
  console.log('}');
  console.log('```');
  console.log('');

  // Verify the token
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ Token verification successful');
    console.log('   Decoded payload:');
    console.log(`   - User ID: ${decoded.userId}`);
    console.log(`   - Client ID: ${decoded.clientId}`);
    console.log(`   - Permissions: ${decoded.permissions.join(', ')}`);
    console.log(`   - Issued at: ${new Date(decoded.iat * 1000).toISOString()}`);
    console.log(`   - Expires at: ${new Date(decoded.exp * 1000).toISOString()}`);
  } catch (error) {
    console.log('❌ Token verification failed:', error.message);
  }

  console.log('\n📋 Next Steps:');
  console.log('==============');
  console.log('1. Set the environment variables above in your Railway project');
  console.log('2. Deploy your application');
  console.log('3. Your Claude Desktop client will automatically authenticate');
  console.log('4. Or use the curl command above to get fresh tokens via API');
}

if (require.main === module) {
  generateJWTToken();
}

module.exports = { generateJWTToken };
