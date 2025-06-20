# Claude Desktop MCP Configuration Guide

## Setting Up Campaign Performance MCP Server in Claude Desktop

This guide will walk you through configuring Claude Desktop to connect to your Campaign Performance MCP server, allowing Claude to directly access and analyze your campaign data.

## Prerequisites

Before starting, ensure you have:
- Claude Desktop installed on your Mac
- Node.js installed on your system
- The `ws` package installed globally: `npm install -g ws`

## Step 1: Prepare the MCP Client Script

The MCP client script (`claude-mcp-client.js`) has already been created in your project directory at:
```
/Users/sandroponticelli/Whatwapp/GPTAction-Demo/claude-mcp-client.js
```

This script acts as a bridge between Claude Desktop and your MCP server running on Railway.

## Step 2: Update Claude Desktop Configuration

You need to modify the `claude_desktop_config.json` file located at:
```
/Users/sandroponticelli/Library/Application Support/Claude/claude_desktop_config.json
```

Replace the entire contents with the following configuration:

```json
{
  "mcpServers": {
    "campaign-performance": {
      "command": "node",
      "args": ["/Users/sandroponticelli/Whatwapp/GPTAction-Demo/claude-mcp-client.js"]
    }
  }
}
```

### Configuration Explanation:
- **`mcpServers`**: The main configuration object for MCP servers
- **`"campaign-performance"`**: A unique identifier for your MCP server
- **`command`**: The command to run (Node.js in this case)
- **`args`**: The path to your MCP client script

## Step 3: Save and Restart Claude Desktop

1. **Save the configuration file** (Cmd+S)
2. **Completely quit Claude Desktop** (Cmd+Q) - don't just close the window
3. **Wait a few seconds** for the application to fully close
4. **Reopen Claude Desktop** from your Applications folder or Dock

## Step 4: Verify the Connection

After Claude Desktop restarts:

1. **Look for MCP indicators** in the Claude Desktop interface
2. **Check for any error messages** in the status area
3. **Test the connection** by asking Claude: *"What campaign performance tools do you have available?"*

If successful, Claude should respond with information about 5 available tools:
- `list_campaigns` - Query campaign data with filters
- `get_campaign` - Get specific campaign details
- `aggregate_metrics` - Aggregate metrics by dimensions
- `export_campaigns` - Export data as CSV/JSON
- `health_check` - Check API health

## Step 5: Test with Sample Queries

Once connected, try these example queries:

### Basic Campaign Queries:
- *"Show me the top 5 iOS campaigns with the lowest CPI"*
- *"List all campaigns for the chess game"*
- *"What campaigns are running on Apple Search Ads?"*

### Analytics Queries:
- *"What's the average ROAS for Facebook Ads campaigns?"*
- *"Compare retention rates between different advertising networks"*
- *"Which network has the best cost per install?"*

### Data Export:
- *"Export all campaigns from July 2024 as JSON"*
- *"Create a CSV export of all iOS campaigns"*

### Performance Analysis:
- *"Which game has the best performance metrics?"*
- *"Show me campaigns with ROAS above 10%"*
- *"What's the retention rate trend across different months?"*

## Troubleshooting

### Common Issues and Solutions:

**1. "MCP server not found" error:**
- Verify the file path in the configuration is correct
- Ensure the `claude-mcp-client.js` file exists at the specified location
- Check that Node.js is installed and accessible

**2. "Connection failed" error:**
- Verify your internet connection
- Check that the MCP server is running on Railway
- Test the server directly: https://gptaction-demo-production.up.railway.app/api/v1/mcp/health

**3. "Module not found" error:**
- Install the required package: `npm install -g ws`
- Restart your terminal and try again

**4. No tools available:**
- Check Claude Desktop logs for error messages
- Verify the MCP server is responding correctly
- Try restarting Claude Desktop

### Checking Logs:

If you encounter issues, you can check the MCP client logs by running the script manually:
```bash
cd /Users/sandroponticelli/Whatwapp/GPTAction-Demo
node claude-mcp-client.js
```

This will show connection status and any error messages.

## Advanced Configuration

### Custom Server URL:
If you need to connect to a different server, modify the script to change the `baseUrl` and `wsUrl` variables.

### Authentication:
The current setup uses the development configuration with authentication disabled. For production use with authentication enabled, you would need to modify the script to handle JWT tokens.

### Multiple MCP Servers:
You can add multiple MCP servers to the configuration:
```json
{
  "mcpServers": {
    "campaign-performance": {
      "command": "node",
      "args": ["/path/to/campaign-mcp-client.js"]
    },
    "another-server": {
      "command": "node",
      "args": ["/path/to/another-mcp-client.js"]
    }
  }
}
```

## What You Can Do Now

With the MCP server connected, Claude can:

1. **Query Campaign Data**: Access your complete campaign performance database
2. **Analyze Metrics**: Calculate averages, totals, and comparisons across different dimensions
3. **Filter and Search**: Find specific campaigns based on various criteria
4. **Export Data**: Generate CSV or JSON exports of filtered data
5. **Real-time Analysis**: Get up-to-date information from your live database

Claude will automatically use these tools when you ask questions about campaign performance, making data analysis as simple as having a conversation!

## Security Note

The current configuration connects to your production MCP server with authentication disabled for ease of use. In a production environment with sensitive data, you should enable authentication and use proper security measures.

## Server Information

- **Production URL**: https://gptaction-demo-production.up.railway.app
- **WebSocket Endpoint**: wss://gptaction-demo-production.up.railway.app/mcp
- **Health Check**: https://gptaction-demo-production.up.railway.app/api/v1/mcp/health
- **Available Tools**: https://gptaction-demo-production.up.railway.app/api/v1/mcp/tools

---

Your Campaign Performance MCP server is now ready to use with Claude Desktop! Start asking questions about your campaign data and let Claude help you analyze your marketing performance. 🚀
