# MCP Connection Error Fixes

## Issues Identified

Based on the log file `mcp-server-campaign-performance.log`, several issues were causing MCP connection problems:

### 1. Missing Method Support
**Problem**: Claude Desktop was calling methods that the server didn't support:
- `resources/list` 
- `prompts/list`

**Error Messages**:
```
"Unknown method: resources/list"
"Unknown method: prompts/list"
```

### 2. Zod Validation Error
**Problem**: A complex Zod validation error was occurring, likely due to malformed message structure:
- Missing required `id` field in error responses
- Unexpected `error` field in some messages
- Invalid union type validation

### 3. Notification Handling
**Problem**: The `notifications/initialized` method wasn't properly handled as a notification.

## Fixes Applied

### 1. Added Missing Method Handlers

**File**: `src/services/mcpServer.ts`

Added handlers for the missing methods:

```typescript
case 'resources/list':
  return await this.handleListResources(connection, request);
case 'prompts/list':
  return await this.handleListPrompts(connection, request);
```

Both methods now return proper error responses indicating they're not supported:

```typescript
private async handleListResources(connection: MCPConnection, request: MCPRequest): Promise<MCPResponse> {
  return {
    jsonrpc: '2.0',
    id: request.id,
    error: {
      code: MCPErrorCode.MethodNotFound,
      message: 'Unknown method: resources/list',
    },
  };
}
```

### 2. Fixed Error Response Structure

**Problem**: Error responses were missing the `id` field, causing validation issues.

**Fix**: Updated error handling to extract and include the message ID:

```typescript
// Try to extract id from the raw data if possible
let messageId: string | number | undefined;
try {
  const rawMessage = JSON.parse(data.toString());
  messageId = rawMessage.id;
} catch {
  // If we can't parse the message, we can't get the id
}

const errorResponse: MCPResponse = {
  jsonrpc: '2.0',
  id: messageId,  // Now includes the ID
  error: {
    code: MCPErrorCode.ParseError,
    message: 'Failed to parse message',
  },
};
```

### 3. Improved Notification Handling

**File**: `src/services/mcpServer.ts`

Enhanced the notification handler to properly handle `notifications/initialized`:

```typescript
private async handleNotification(connection: MCPConnection, notification: MCPNotification): Promise<void> {
  switch (notification.method) {
    case 'notifications/initialized':
      console.log(`🔗 Client ${connection.id} initialized successfully`);
      break;
    default:
      console.log(`Received notification: ${notification.method}`);
      break;
  }
}
```

### 4. Updated Server Capabilities

**File**: `src/config/mcp.ts`

Explicitly indicated that the server doesn't support resources and prompts:

```typescript
capabilities: {
  tools: {
    listChanged: false,
  },
  logging: {},
  // Explicitly indicate we don't support resources and prompts
  resources: undefined,
  prompts: undefined,
},
```

### 5. Enhanced Debugging

Added comprehensive message logging to help diagnose future issues:

```typescript
console.log(`📨 Received message from ${connectionId}:`, rawMessage);
console.log(`📤 Sending response to ${connectionId}:`, responseStr);
```

### 6. Fixed Method Responses (Additional Fix)

**Problem**: Returning error responses for `resources/list` and `prompts/list` was causing validation issues.

**Fix**: Changed to return proper empty result responses instead of errors:

```typescript
private async handleListResources(connection: MCPConnection, request: MCPRequest): Promise<MCPResponse> {
  return {
    jsonrpc: '2.0',
    id: request.id,
    result: {
      resources: []  // Empty array instead of error
    },
  };
}

private async handleListPrompts(connection: MCPConnection, request: MCPRequest): Promise<MCPResponse> {
  return {
    jsonrpc: '2.0',
    id: request.id,
    result: {
      prompts: []  // Empty array instead of error
    },
  };
}
```

### 7. Updated Server Capabilities

**File**: `src/config/mcp.ts`

Added proper capabilities declaration for resources and prompts:

```typescript
capabilities: {
  tools: {
    listChanged: false,
  },
  resources: {
    subscribe: false,
    listChanged: false,
  },
  prompts: {
    listChanged: false,
  },
  logging: {},
},
```

## Expected Results

After these fixes, the MCP server should:

1. ✅ Properly handle all methods that Claude Desktop calls
2. ✅ Return valid JSON-RPC 2.0 responses with correct structure
3. ✅ Handle notifications without errors
4. ✅ Provide better error messages and debugging information
5. ✅ Eliminate the Zod validation errors
6. ✅ Return proper empty results for unsupported methods instead of errors

## Testing

To test the fixes:

1. **Build the project**: `npm run build`
2. **Start the server**: `npm start`
3. **Connect from Claude Desktop** and monitor the logs
4. **Check for errors** in the console output

The server should now connect successfully without the previous validation errors.

## Next Steps

If issues persist:

1. Check the new debug logs for detailed message flow
2. Verify Claude Desktop configuration matches server settings
3. Ensure authentication tokens are properly configured
4. Monitor for any new error patterns in the logs
