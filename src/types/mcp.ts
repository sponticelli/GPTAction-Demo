/**
 * Model Context Protocol (MCP) Types
 * Based on the MCP specification for server-client communication
 */

// Base MCP message types
export interface MCPMessage {
  jsonrpc: '2.0';
  id?: string | number;
}

export interface MCPRequest extends MCPMessage {
  method: string;
  params?: any;
}

export interface MCPResponse extends MCPMessage {
  result?: any;
  error?: MCPError;
}

export interface MCPNotification extends MCPMessage {
  method: string;
  params?: any;
}

export interface MCPError {
  code: number;
  message: string;
  data?: any;
}

// MCP Server capabilities
export interface MCPServerCapabilities {
  tools?: {
    listChanged?: boolean;
  };
  resources?: {
    subscribe?: boolean;
    listChanged?: boolean;
  };
  prompts?: {
    listChanged?: boolean;
  };
  logging?: {};
}

// Tool definitions
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface MCPToolCall {
  name: string;
  arguments: Record<string, any>;
}

export interface MCPToolResult {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

// Authentication types
export interface MCPAuthRequest {
  method: 'auth/request';
  params: {
    client_id: string;
    redirect_uri?: string;
    scope?: string[];
  };
}

export interface MCPAuthResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in?: number;
  refresh_token?: string;
  scope?: string[];
}

// Server initialization
export interface MCPInitializeRequest extends MCPRequest {
  method: 'initialize';
  params: {
    protocolVersion: string;
    capabilities: MCPClientCapabilities;
    clientInfo: {
      name: string;
      version: string;
    };
  };
}

export interface MCPClientCapabilities {
  roots?: {
    listChanged?: boolean;
  };
  sampling?: {};
}

export interface MCPInitializeResponse {
  protocolVersion: string;
  capabilities: MCPServerCapabilities;
  serverInfo: {
    name: string;
    version: string;
  };
}

// Tool listing
export interface MCPListToolsRequest extends MCPRequest {
  method: 'tools/list';
  params?: {
    cursor?: string;
  };
}

export interface MCPListToolsResponse {
  tools: MCPTool[];
  nextCursor?: string;
}

// Tool calling
export interface MCPCallToolRequest extends MCPRequest {
  method: 'tools/call';
  params: {
    name: string;
    arguments: Record<string, any>;
  };
}

export interface MCPCallToolResponse {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

// Connection types
export interface MCPConnection {
  id: string;
  clientInfo?: {
    name: string;
    version: string;
  };
  capabilities?: MCPClientCapabilities;
  authenticated: boolean;
  userId?: string;
  permissions?: string[];
}

// Error codes
export enum MCPErrorCode {
  ParseError = -32700,
  InvalidRequest = -32600,
  MethodNotFound = -32601,
  InvalidParams = -32602,
  InternalError = -32603,
  Unauthorized = -32001,
  Forbidden = -32002,
  NotFound = -32003,
  Timeout = -32004,
}

// Server configuration
export interface MCPServerConfig {
  port: number;
  host: string;
  path: string;
  auth: {
    enabled: boolean;
    jwtSecret: string;
    tokenExpiry: string;
    allowedClients: string[];
  };
  cors: {
    origin: string | string[];
    credentials: boolean;
  };
  rateLimit: {
    windowMs: number;
    max: number;
  };
}
