#!/usr/bin/env node

const crypto = require('crypto');

/**
 * Generate secure secrets for production deployment
 */
function generateSecrets() {
  console.log('🔐 Generating secure secrets for production deployment\n');
  
  // Generate JWT Secret (256-bit)
  const jwtSecret = crypto.randomBytes(32).toString('hex');
  
  // Generate API Key (128-bit)
  const apiKey = crypto.randomBytes(16).toString('hex');
  
  console.log('Environment Variables for Railway:');
  console.log('=====================================');
  console.log(`NODE_ENV=production`);
  console.log(`API_KEY=${apiKey}`);
  console.log(`MCP_JWT_SECRET=${jwtSecret}`);
  console.log(`MCP_AUTH_ENABLED=true`);
  console.log(`MCP_TOKEN_EXPIRY=24h`);
  console.log(`MCP_ALLOWED_CLIENTS=claude,chatgpt,cursor,vscode,continue`);
  console.log(`MCP_CORS_ORIGIN=https://claude.ai,https://chat.openai.com,https://cursor.sh`);
  console.log('');
  
  console.log('📋 Copy these variables to your Railway project:');
  console.log('1. Go to your Railway project dashboard');
  console.log('2. Navigate to Variables tab');
  console.log('3. Add each variable above');
  console.log('4. Deploy your application');
  console.log('');
  
  console.log('🔒 Security Notes:');
  console.log('- Keep these secrets secure and never commit them to version control');
  console.log('- The JWT secret is used to sign authentication tokens');
  console.log('- The API key is used for general API authentication');
  console.log('- Tokens expire after 24 hours by default');
}

if (require.main === module) {
  generateSecrets();
}

module.exports = { generateSecrets };
