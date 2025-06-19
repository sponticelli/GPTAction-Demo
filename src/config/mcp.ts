import { MCPServerConfig } from '../types/mcp';

/**
 * MCP Server Configuration
 * Loads configuration from environment variables with sensible defaults
 */
export const getMCPConfig = (): MCPServerConfig => {
  return {
    port: parseInt(process.env.MCP_PORT || process.env.PORT || '3000'),
    host: process.env.MCP_HOST || '0.0.0.0',
    path: process.env.MCP_PATH || '/mcp',
    auth: {
      enabled: process.env.NODE_ENV === 'production' ? process.env.MCP_AUTH_ENABLED !== 'false' : false,
      jwtSecret: process.env.MCP_JWT_SECRET || process.env.API_KEY || 'default-secret-change-in-production',
      tokenExpiry: process.env.MCP_TOKEN_EXPIRY || '24h',
      allowedClients: process.env.MCP_ALLOWED_CLIENTS
        ? process.env.MCP_ALLOWED_CLIENTS.split(',').map(c => c.trim())
        : ['claude', 'chatgpt', 'cursor', 'vscode', 'continue'],
    },
    cors: {
      origin: process.env.NODE_ENV === 'development'
        ? '*'
        : process.env.MCP_CORS_ORIGIN
          ? process.env.MCP_CORS_ORIGIN.split(',').map(o => o.trim())
          : ['https://claude.ai', 'https://chat.openai.com', 'https://cursor.sh'],
      credentials: true,
    },
    rateLimit: {
      windowMs: parseInt(process.env.MCP_RATE_LIMIT_WINDOW || '900000'), // 15 minutes
      max: parseInt(process.env.MCP_RATE_LIMIT_MAX || '100'), // 100 requests per window
    },
  };
};

/**
 * MCP Server Information
 */
export const MCP_SERVER_INFO = {
  name: 'Campaign Performance MCP Server',
  version: '1.0.0',
  description: 'MCP server for Campaign Performance API - provides access to campaign data, metrics, and analytics',
  protocolVersion: '2024-11-05',
  capabilities: {
    tools: {
      listChanged: false,
    },
    logging: {},
  },
};

/**
 * Default MCP client permissions
 */
export const DEFAULT_PERMISSIONS = [
  'campaigns:read',
  'metrics:read',
  'exports:create',
  'health:read',
];

/**
 * MCP client configurations for known clients
 */
export const MCP_CLIENT_CONFIGS = {
  claude: {
    name: 'Claude',
    permissions: DEFAULT_PERMISSIONS,
    rateLimit: { windowMs: 900000, max: 200 }, // Higher limit for Claude
  },
  chatgpt: {
    name: 'ChatGPT',
    permissions: DEFAULT_PERMISSIONS,
    rateLimit: { windowMs: 900000, max: 150 },
  },
  cursor: {
    name: 'Cursor',
    permissions: DEFAULT_PERMISSIONS,
    rateLimit: { windowMs: 900000, max: 100 },
  },
  vscode: {
    name: 'VS Code',
    permissions: DEFAULT_PERMISSIONS,
    rateLimit: { windowMs: 900000, max: 100 },
  },
  continue: {
    name: 'Continue',
    permissions: DEFAULT_PERMISSIONS,
    rateLimit: { windowMs: 900000, max: 100 },
  },
};

/**
 * Environment validation
 */
export const validateMCPEnvironment = (): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const config = getMCPConfig();

  // Check required environment variables in production
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.MCP_JWT_SECRET && !process.env.API_KEY) {
      errors.push('MCP_JWT_SECRET or API_KEY must be set in production');
    }
    
    if (config.auth.jwtSecret === 'default-secret-change-in-production') {
      errors.push('Default JWT secret detected in production - please set MCP_JWT_SECRET');
    }
  }

  // Validate port
  if (isNaN(config.port) || config.port < 1 || config.port > 65535) {
    errors.push('Invalid MCP_PORT - must be a number between 1 and 65535');
  }

  // Validate rate limit settings
  if (isNaN(config.rateLimit.windowMs) || config.rateLimit.windowMs < 1000) {
    errors.push('Invalid MCP_RATE_LIMIT_WINDOW - must be at least 1000ms');
  }

  if (isNaN(config.rateLimit.max) || config.rateLimit.max < 1) {
    errors.push('Invalid MCP_RATE_LIMIT_MAX - must be at least 1');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
