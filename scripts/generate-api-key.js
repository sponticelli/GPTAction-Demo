#!/usr/bin/env node

/**
 * Generate a secure API key for the Campaign Performance API
 * 
 * This script generates a cryptographically secure random API key
 * that can be used for authentication in production.
 */

const crypto = require('crypto');

function generateApiKey(length = 32) {
  // Generate random bytes and convert to base64url (URL-safe)
  const randomBytes = crypto.randomBytes(length);
  return randomBytes.toString('base64url');
}

function generateUUID() {
  return crypto.randomUUID();
}

function generateHexKey(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

console.log('🔐 API Key Generator for Campaign Performance API\n');

console.log('Generated API Keys (choose one):');
console.log('================================');
console.log(`1. Base64URL (recommended): ${generateApiKey()}`);
console.log(`2. Hexadecimal:             ${generateHexKey()}`);
console.log(`3. UUID format:             ${generateUUID()}`);
console.log(`4. Long Base64URL:          ${generateApiKey(48)}`);

console.log('\n📝 Instructions:');
console.log('1. Copy one of the keys above');
console.log('2. Set it as API_KEY environment variable in Railway');
console.log('3. Use it in the X-API-Key header when making requests');

console.log('\n🚀 Railway Deployment:');
console.log('railway variables set API_KEY=<your-chosen-key>');

console.log('\n🧪 Testing:');
console.log('curl -H "X-API-Key: <your-key>" https://your-app.railway.app/api/v1/health');
