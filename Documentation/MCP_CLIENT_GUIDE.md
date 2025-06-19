# Campaign Performance MCP Server - Client Guide

This guide explains how to connect and use the Campaign Performance MCP (Model Context Protocol) Server with various LLM applications.

## Overview

The Campaign Performance MCP Server provides standardized access to campaign performance data, metrics, and analytics through the Model Context Protocol. This allows LLM applications like Claude, ChatGPT, Cursor, and VS Code to directly query and analyze your campaign data.

## Server Information

- **Server Name**: Campaign Performance MCP Server
- **Version**: 1.0.0
- **Protocol Version**: 2024-11-05
- **Base URL**: `https://your-railway-app.up.railway.app`
- **WebSocket Endpoint**: `wss://your-railway-app.up.railway.app/mcp`

## Authentication

### Step 1: Obtain Access Token

Before connecting, you need to obtain an access token:

```bash
curl -X POST "https://your-railway-app.up.railway.app/api/v1/mcp/auth/token" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "claude",
    "scope": ["campaigns:read", "metrics:read", "exports:create"]
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 86400,
    "scope": ["campaigns:read", "metrics:read", "exports:create"]
  }
}
```

### Supported Client IDs

- `claude` - For Claude AI
- `chatgpt` - For ChatGPT
- `cursor` - For Cursor IDE
- `vscode` - For VS Code
- `continue` - For Continue extension

## Available Tools

### 1. list_campaigns

Retrieve paginated campaign performance records with optional filters.

**Parameters:**
- `game` (string, optional): Filter by game name
- `network` (string, optional): Filter by advertising network
- `store` (string, optional): Filter by app store ("ios" or "android")
- `campaign_name` (string, optional): Filter by campaign name
- `month_from` (string, optional): Start date filter (YYYY-MM format)
- `month_to` (string, optional): End date filter (YYYY-MM format)
- `min_cpi` (number, optional): Minimum cost per install
- `max_cpi` (number, optional): Maximum cost per install
- `roas_day` (integer, optional): ROAS day for filtering (0, 7, 30, or 365)
- `min_roas` (number, optional): Minimum ROAS value
- `max_roas` (number, optional): Maximum ROAS value
- `page` (integer, optional): Page number (default: 1)
- `page_size` (integer, optional): Records per page (default: 50)

### 2. get_campaign

Get detailed information about a specific campaign.

**Parameters:**
- `id` (string, required): Campaign ID

### 3. aggregate_metrics

Get aggregated campaign metrics grouped by dimensions.

**Parameters:**
- `group_by` (string, required): Dimension to group by ("month", "network", "store", "campaign_name")
- `metric` (string, required): Metric to aggregate ("cpi", "acquired_users", "roas_d0", "roas_d7", "roas_d30", "roas_d365", "retention_d0", "retention_d7", "retention_d30", "retention_d365")
- `aggregation` (string, required): Aggregation function ("sum", "avg", "min", "max")
- `filters` (string, optional): Filter expression

### 4. export_campaigns

Export filtered campaign data as CSV or JSON.

**Parameters:**
- `format` (string, required): Export format ("csv" or "json")
- `filters` (string, optional): Filter expression

### 5. health_check

Check the health status of the Campaign Performance API.

**Parameters:** None

## Client Configuration Examples

### Claude Desktop

Add to your Claude Desktop configuration file:

```json
{
  "mcpServers": {
    "campaign-performance": {
      "command": "node",
      "args": ["-e", "
        const WebSocket = require('ws');
        const ws = new WebSocket('wss://your-railway-app.up.railway.app/mcp', {
          headers: {
            'Authorization': 'Bearer YOUR_ACCESS_TOKEN'
          }
        });
        // MCP protocol implementation
      "]
    }
  }
}
```

### Cursor IDE

1. Install the MCP extension
2. Add server configuration:

```json
{
  "mcp.servers": [
    {
      "name": "campaign-performance",
      "url": "wss://your-railway-app.up.railway.app/mcp",
      "auth": {
        "type": "bearer",
        "token": "YOUR_ACCESS_TOKEN"
      }
    }
  ]
}
```

### VS Code with Continue

Add to your Continue configuration:

```json
{
  "mcpServers": [
    {
      "name": "campaign-performance",
      "serverUrl": "wss://your-railway-app.up.railway.app/mcp",
      "authToken": "YOUR_ACCESS_TOKEN"
    }
  ]
}
```

## Usage Examples

### Example 1: List Recent iOS Campaigns

```javascript
// Tool call
{
  "name": "list_campaigns",
  "arguments": {
    "store": "ios",
    "month_from": "2024-01",
    "page_size": 10
  }
}
```

### Example 2: Get Campaign Performance Metrics

```javascript
// Tool call
{
  "name": "aggregate_metrics",
  "arguments": {
    "group_by": "network",
    "metric": "roas_d30",
    "aggregation": "avg"
  }
}
```

### Example 3: Export Campaign Data

```javascript
// Tool call
{
  "name": "export_campaigns",
  "arguments": {
    "format": "csv",
    "filters": "store=ios AND month>=2024-01"
  }
}
```

## Error Handling

The MCP server returns standard MCP error responses:

```json
{
  "jsonrpc": "2.0",
  "id": "request-id",
  "error": {
    "code": -32001,
    "message": "Authentication required",
    "data": {
      "details": "Please provide a valid access token"
    }
  }
}
```

**Common Error Codes:**
- `-32001`: Unauthorized (invalid or missing token)
- `-32002`: Forbidden (insufficient permissions)
- `-32003`: Not Found (campaign/resource not found)
- `-32600`: Invalid Request (malformed request)
- `-32602`: Invalid Params (invalid parameters)

## Rate Limiting

- **Default Limit**: 100 requests per 15-minute window
- **Claude**: 200 requests per 15-minute window
- **ChatGPT**: 150 requests per 15-minute window
- **Other clients**: 100 requests per 15-minute window

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Request limit
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset time (Unix timestamp)

## Testing Your Connection

Use the test endpoint to verify your setup:

```bash
curl -X POST "https://your-railway-app.up.railway.app/api/v1/mcp/test-connection" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "claude",
    "test_tool": "health_check"
  }'
```

## Troubleshooting

### Connection Issues

1. **WebSocket Connection Failed**
   - Verify the server URL is correct
   - Check if the server is running (`/api/v1/mcp/health`)
   - Ensure your client supports WebSocket connections

2. **Authentication Failed**
   - Verify your access token is valid (`/api/v1/mcp/auth/validate`)
   - Check if your client_id is in the allowed clients list
   - Ensure the token hasn't expired

3. **Permission Denied**
   - Check if your token has the required permissions
   - Verify the tool you're calling matches your granted permissions

### Getting Help

- **Server Status**: `GET /api/v1/mcp/health`
- **Available Tools**: `GET /api/v1/mcp/tools`
- **Active Connections**: `GET /api/v1/mcp/connections`
- **Server Info**: `GET /api/v1/mcp/info`

## Security Considerations

1. **Token Security**: Store access tokens securely and rotate them regularly
2. **HTTPS Only**: Always use HTTPS/WSS in production
3. **Rate Limiting**: Respect rate limits to avoid being blocked
4. **Permissions**: Request only the permissions you need
5. **Monitoring**: Monitor your usage through the server endpoints

## Railway.com Deployment

### Environment Variables

Set these environment variables in your Railway project:

**Required:**
- `API_KEY`: Your API authentication key
- `MCP_JWT_SECRET`: Secret for JWT token signing

**Optional (with defaults):**
- `MCP_AUTH_ENABLED`: Enable authentication (default: true)
- `MCP_ALLOWED_CLIENTS`: Comma-separated list of allowed client IDs
- `MCP_CORS_ORIGIN`: Comma-separated list of allowed origins
- `MCP_TOKEN_EXPIRY`: Token expiration time (default: 24h)

### Deployment Steps

1. **Connect Repository**: Link your GitHub repository to Railway
2. **Set Environment Variables**: Configure the required environment variables
3. **Deploy**: Railway will automatically build and deploy your application
4. **Verify**: Check the health endpoint: `https://your-app.up.railway.app/api/v1/mcp/health`

### Custom Domain (Optional)

1. Go to your Railway project settings
2. Add a custom domain
3. Update your MCP client configurations with the new domain

## Support

For technical support or questions about the MCP server implementation, please refer to the main API documentation or contact the development team.
