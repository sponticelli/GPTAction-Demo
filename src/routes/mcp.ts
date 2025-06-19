import { Router, Request, Response } from 'express';
import { MCPAuthService } from '../services/mcpAuth';
import { MCPServer } from '../services/mcpServer';
import { getMCPConfig, MCP_SERVER_INFO, validateMCPEnvironment } from '../config/mcp';
import { MCPAuthRequest } from '../types/mcp';
import { ApiResponse } from '../types';

const router = Router();
const authService = new MCPAuthService();

// Global MCP server instance (will be set by main app)
let mcpServer: MCPServer | null = null;

export const setMCPServer = (server: MCPServer): void => {
  mcpServer = server;
};

/**
 * GET /mcp/info
 * Get MCP server information and capabilities
 */
router.get('/info', (req: Request, res: Response): void => {
  const config = getMCPConfig();
  const validation = validateMCPEnvironment();

  const response: ApiResponse<any> = {
    success: true,
    data: {
      serverInfo: MCP_SERVER_INFO,
      config: {
        path: config.path,
        authEnabled: config.auth.enabled,
        allowedClients: config.auth.allowedClients,
        corsOrigin: config.cors.origin,
      },
      validation,
      stats: mcpServer?.getStats() || null,
    },
  };

  res.json(response);
});

/**
 * POST /mcp/auth/token
 * Generate authentication token for MCP client
 */
router.post('/auth/token', async (req: Request, res: Response): Promise<void> => {
  try {
    const authRequest: MCPAuthRequest = {
      method: 'auth/request',
      params: {
        client_id: req.body.client_id,
        redirect_uri: req.body.redirect_uri,
        scope: req.body.scope,
      },
    };

    if (!authRequest.params.client_id) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Bad Request',
        message: 'client_id is required',
      };
      res.status(400).json(response);
      return;
    }

    const tokenResponse = await authService.generateAuthToken(authRequest);

    const response: ApiResponse<any> = {
      success: true,
      data: tokenResponse,
    };

    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Authentication Failed',
      message: error instanceof Error ? error.message : 'Failed to generate token',
    };
    res.status(400).json(response);
  }
});

/**
 * POST /mcp/auth/validate
 * Validate authentication token
 */
router.post('/auth/validate', async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.body.token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Bad Request',
        message: 'Token is required',
      };
      res.status(400).json(response);
      return;
    }

    const user = await authService.validateToken(token);

    if (!user) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      };
      res.status(401).json(response);
      return;
    }

    const response: ApiResponse<any> = {
      success: true,
      data: {
        valid: true,
        user: {
          id: user.id,
          clientId: user.clientId,
          permissions: user.permissions,
          createdAt: user.createdAt,
          lastAccessAt: user.lastAccessAt,
        },
      },
    };

    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Token validation failed',
    };
    res.status(500).json(response);
  }
});

/**
 * GET /mcp/connections
 * Get active MCP connections (admin endpoint)
 */
router.get('/connections', (req: Request, res: Response): void => {
  // This could be protected with admin authentication
  const connections = authService.getActiveConnections();

  const response: ApiResponse<any> = {
    success: true,
    data: {
      connections: connections.map(conn => ({
        id: conn.id,
        authenticated: conn.authenticated,
        clientInfo: conn.clientInfo,
        permissions: conn.permissions,
      })),
      total: connections.length,
    },
  };

  res.json(response);
});

/**
 * GET /mcp/tools
 * Get available MCP tools (for documentation/discovery)
 */
router.get('/tools', (req: Request, res: Response): void => {
  // Import tools service here to avoid circular dependencies
  const { MCPToolsService } = require('../services/mcpTools');
  const toolsService = new MCPToolsService();
  const tools = toolsService.getTools();

  const response: ApiResponse<any> = {
    success: true,
    data: {
      tools,
      total: tools.length,
    },
  };

  res.json(response);
});

/**
 * GET /mcp/health
 * MCP-specific health check
 */
router.get('/health', (req: Request, res: Response): void => {
  const config = getMCPConfig();
  const validation = validateMCPEnvironment();
  const stats = mcpServer?.getStats() || { activeConnections: 0 };

  const isHealthy = validation.valid && (mcpServer !== null);

  const response: ApiResponse<any> = {
    success: isHealthy,
    data: {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      server: MCP_SERVER_INFO,
      stats,
      validation,
    },
    ...(isHealthy ? {} : {
      error: 'Unhealthy',
      message: validation.errors.join('; '),
    }),
  };

  res.status(isHealthy ? 200 : 503).json(response);
});

/**
 * POST /mcp/test-connection
 * Test MCP connection (for debugging)
 */
router.post('/test-connection', async (req: Request, res: Response): Promise<void> => {
  try {
    const { client_id, test_tool } = req.body;

    if (!client_id) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Bad Request',
        message: 'client_id is required',
      };
      res.status(400).json(response);
      return;
    }

    // Generate test token
    const authRequest: MCPAuthRequest = {
      method: 'auth/request',
      params: { client_id },
    };

    const tokenResponse = await authService.generateAuthToken(authRequest);

    // Test tool call if requested
    let toolResult = null;
    if (test_tool) {
      const { MCPToolsService } = require('../services/mcpTools');
      const toolsService = new MCPToolsService();
      
      const toolRequest = {
        method: 'tools/call',
        params: {
          name: test_tool,
          arguments: {},
        },
      };

      toolResult = await toolsService.callTool(toolRequest);
    }

    const response: ApiResponse<any> = {
      success: true,
      data: {
        message: 'MCP connection test successful',
        token: tokenResponse,
        toolResult,
        serverInfo: MCP_SERVER_INFO,
      },
    };

    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Test Failed',
      message: error instanceof Error ? error.message : 'Connection test failed',
    };
    res.status(500).json(response);
  }
});

export default router;
