# JWT Authorization Setup for Production

This guide explains how to enable JWT authorization for your MCP server in production on Railway.

## Overview

Your MCP server has JWT authorization built-in but disabled by default in development. To enable it in production, you need to configure the required environment variables.

## Step 1: Generate Secure Secrets

Run the secret generation script to create secure keys:

```bash
node scripts/generate-production-secrets.js
```

This will output environment variables like:
```
NODE_ENV=production
API_KEY=2832a2f7f3399d48c31d0311c31c8761
MCP_JWT_SECRET=e249b07f750738a72bda840a2d709ec9829cc8271e470ac6010760925687cad5
MCP_AUTH_ENABLED=true
MCP_TOKEN_EXPIRY=24h
MCP_ALLOWED_CLIENTS=claude,chatgpt,cursor,vscode,continue
MCP_CORS_ORIGIN=https://claude.ai,https://chat.openai.com,https://cursor.sh
```

## Step 2: Configure Railway Environment Variables

1. **Go to your Railway project dashboard**
2. **Navigate to the "Variables" tab**
3. **Add each environment variable:**

### Required Variables:
- `NODE_ENV=production`
- `API_KEY=your-generated-api-key`
- `MCP_JWT_SECRET=your-generated-jwt-secret`

### Optional Variables (recommended):
- `MCP_AUTH_ENABLED=true` (explicitly enable auth)
- `MCP_TOKEN_EXPIRY=24h` (token expiration time)
- `MCP_ALLOWED_CLIENTS=claude,chatgpt,cursor,vscode,continue`
- `MCP_CORS_ORIGIN=https://claude.ai,https://chat.openai.com,https://cursor.sh`

## Step 3: Deploy Your Application

After setting the environment variables, Railway will automatically redeploy your application with JWT authorization enabled.

## Step 4: Update Your MCP Clients

### Claude Desktop Client

The `claude-mcp-client.js` has been updated to handle JWT authentication automatically. It will:

1. Authenticate with the API using the API key
2. Receive a JWT token
3. Include the JWT token in all MCP requests

Make sure your client has the correct API key by setting it as an environment variable:

```bash
export API_KEY=your-generated-api-key
```

Or update the client file directly with your API key.

### Other MCP Clients

For other MCP clients, you'll need to:

1. **Get a JWT token** by calling the authentication endpoint:
   ```bash
   curl -X POST https://your-app.up.railway.app/api/v1/mcp/auth/token \
     -H "Content-Type: application/json" \
     -H "X-API-Key: your-api-key" \
     -d '{
       "client_id": "your-client-name",
       "scope": ["campaigns:read", "campaigns:export", "tools:call"]
     }'
   ```

2. **Include the token** in your MCP WebSocket requests:
   ```json
   {
     "jsonrpc": "2.0",
     "id": 1,
     "method": "tools/list",
     "params": {
       "auth": {
         "token": "your-jwt-token"
       }
     }
   }
   ```

## Step 5: Verify JWT Authorization

### Test Authentication Endpoint

```bash
curl -X POST https://your-app.up.railway.app/api/v1/mcp/auth/token \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "client_id": "test-client",
    "scope": ["campaigns:read"]
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 86400,
    "scope": ["campaigns:read"]
  }
}
```

### Test MCP Health Check

```bash
curl https://your-app.up.railway.app/api/v1/mcp/health
```

Should return server status and authentication configuration.

## Security Features

With JWT authorization enabled, your MCP server provides:

- **Token-based authentication**: Secure JWT tokens for client authentication
- **Permission-based access control**: Different scopes for different operations
- **Token expiration**: Configurable token lifetime (default 24 hours)
- **Client validation**: Only allowed clients can connect
- **CORS protection**: Restricted origins for web-based clients

## Troubleshooting

### "Authentication required" errors
- Verify environment variables are set correctly in Railway
- Check that `NODE_ENV=production` is set
- Ensure `MCP_JWT_SECRET` or `API_KEY` is configured

### "Invalid token" errors
- Check that the JWT token hasn't expired
- Verify the token is being sent in the correct format
- Ensure the JWT secret matches between token generation and validation

### Connection refused
- Verify the MCP server is running: `https://your-app.up.railway.app/api/v1/mcp/health`
- Check Railway deployment logs for errors
- Ensure WebSocket connections are allowed

## Environment Variable Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | development | Must be "production" to enable auth |
| `API_KEY` | Yes | - | API key for authentication endpoints |
| `MCP_JWT_SECRET` | Yes | - | Secret for signing JWT tokens |
| `MCP_AUTH_ENABLED` | No | true (in prod) | Explicitly enable/disable auth |
| `MCP_TOKEN_EXPIRY` | No | 24h | JWT token expiration time |
| `MCP_ALLOWED_CLIENTS` | No | claude,chatgpt,... | Comma-separated allowed client IDs |
| `MCP_CORS_ORIGIN` | No | claude.ai,... | Comma-separated allowed origins |

## Next Steps

After enabling JWT authorization:

1. **Test your MCP clients** to ensure they can authenticate
2. **Monitor the logs** for authentication events
3. **Update client configurations** with the new API key
4. **Consider implementing refresh tokens** for long-running clients
5. **Set up monitoring** for failed authentication attempts
