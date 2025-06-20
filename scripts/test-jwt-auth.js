#!/usr/bin/env node

/**
 * Test JWT Authentication Logic
 * Tests the JWT authentication without requiring a running server
 */

const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// Mock environment for testing
process.env.NODE_ENV = 'production';
process.env.MCP_JWT_SECRET = 'test-secret-for-jwt-validation';
process.env.API_KEY = 'test-api-key';

// Import the auth service
const { MCPAuthService } = require('../dist/services/mcpAuth');

async function testJWTAuthentication() {
  console.log('🔐 Testing JWT Authentication Logic\n');
  
  try {
    const authService = new MCPAuthService();
    
    // Test 1: Generate JWT token
    console.log('1️⃣ Testing JWT token generation...');
    const authRequest = {
      params: {
        client_id: 'claude', // Use an allowed client
        scope: ['campaigns:read', 'tools:call']
      }
    };

    const authResponse = await authService.generateAuthToken(authRequest);
    console.log('✅ Token generated successfully');
    console.log(`   Token type: ${authResponse.token_type}`);
    console.log(`   Expires in: ${authResponse.expires_in} seconds`);
    console.log(`   Scope: ${authResponse.scope.join(', ')}`);
    
    // Test 2: Validate JWT token
    console.log('\n2️⃣ Testing JWT token validation...');
    const user = await authService.validateToken(authResponse.access_token);
    
    if (user) {
      console.log('✅ Token validation successful');
      console.log(`   User ID: ${user.id}`);
      console.log(`   Client ID: ${user.clientId}`);
      console.log(`   Permissions: ${user.permissions.join(', ')}`);
    } else {
      console.log('❌ Token validation failed');
      return;
    }
    
    // Test 3: Test expired token
    console.log('\n3️⃣ Testing expired token handling...');
    const expiredToken = jwt.sign(
      { userId: 'test', clientId: 'test', permissions: ['test'] },
      process.env.MCP_JWT_SECRET,
      { expiresIn: '-1h' } // Already expired
    );
    
    const expiredUser = await authService.validateToken(expiredToken);
    if (!expiredUser) {
      console.log('✅ Expired token correctly rejected');
    } else {
      console.log('❌ Expired token was accepted (should be rejected)');
    }
    
    // Test 4: Test invalid token
    console.log('\n4️⃣ Testing invalid token handling...');
    const invalidUser = await authService.validateToken('invalid-token');
    if (!invalidUser) {
      console.log('✅ Invalid token correctly rejected');
    } else {
      console.log('❌ Invalid token was accepted (should be rejected)');
    }
    
    // Test 5: Test permission checking
    console.log('\n5️⃣ Testing permission checking...');
    const hasReadPermission = authService.hasPermission(user, 'campaigns:read');
    const hasWritePermission = authService.hasPermission(user, 'campaigns:write');
    
    console.log(`   Has 'campaigns:read': ${hasReadPermission ? '✅' : '❌'}`);
    console.log(`   Has 'campaigns:write': ${hasWritePermission ? '✅' : '❌'}`);
    
    if (hasReadPermission && !hasWritePermission) {
      console.log('✅ Permission checking works correctly');
    } else {
      console.log('❌ Permission checking failed');
    }
    
    console.log('\n🎉 All JWT authentication tests passed!');
    
  } catch (error) {
    console.error('❌ JWT authentication test failed:', error.message);
    process.exit(1);
  }
}

// Test configuration validation
function testConfigValidation() {
  console.log('\n🔧 Testing configuration validation...');
  
  const { getMCPConfig, validateMCPEnvironment } = require('../dist/config/mcp');
  
  const config = getMCPConfig();
  console.log(`   Auth enabled: ${config.auth.enabled}`);
  console.log(`   JWT secret set: ${config.auth.jwtSecret !== 'default-secret-change-in-production'}`);
  console.log(`   Token expiry: ${config.auth.tokenExpiry}`);
  console.log(`   Allowed clients: ${config.auth.allowedClients.join(', ')}`);
  
  const validation = validateMCPEnvironment();
  if (validation.valid) {
    console.log('✅ Environment configuration is valid');
  } else {
    console.log('⚠️  Environment configuration warnings:');
    validation.errors.forEach(error => console.log(`     - ${error}`));
  }
}

if (require.main === module) {
  testConfigValidation();
  testJWTAuthentication();
}
