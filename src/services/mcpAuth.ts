const jwt = require('jsonwebtoken');
import { v4 as uuidv4 } from 'uuid';
import { getMCPConfig, MCP_CLIENT_CONFIGS, DEFAULT_PERMISSIONS } from '../config/mcp';
import { MCPAuthRequest, MCPAuthResponse, MCPConnection } from '../types/mcp';

export interface MCPUser {
  id: string;
  clientId: string;
  permissions: string[];
  createdAt: Date;
  lastAccessAt: Date;
}

export interface MCPTokenPayload {
  userId: string;
  clientId: string;
  permissions: string[];
  iat: number;
  exp: number;
}

/**
 * MCP Authentication Service
 * Handles JWT token generation, validation, and user management for MCP clients
 */
export class MCPAuthService {
  private config = getMCPConfig();
  private users = new Map<string, MCPUser>();
  private connections = new Map<string, MCPConnection>();

  /**
   * Generate authentication token for MCP client
   */
  async generateAuthToken(authRequest: MCPAuthRequest): Promise<MCPAuthResponse> {
    const { client_id, scope } = authRequest.params;

    // Validate client
    if (!this.isAllowedClient(client_id)) {
      throw new Error(`Client '${client_id}' is not allowed`);
    }

    // Get client configuration
    const clientConfig = MCP_CLIENT_CONFIGS[client_id as keyof typeof MCP_CLIENT_CONFIGS];
    const permissions = scope && scope.length > 0 
      ? this.validatePermissions(scope, clientConfig?.permissions || DEFAULT_PERMISSIONS)
      : clientConfig?.permissions || DEFAULT_PERMISSIONS;

    // Create or update user
    const userId = uuidv4();
    const user: MCPUser = {
      id: userId,
      clientId: client_id,
      permissions,
      createdAt: new Date(),
      lastAccessAt: new Date(),
    };

    this.users.set(userId, user);

    // Generate JWT token
    const tokenPayload = {
      userId,
      clientId: client_id,
      permissions,
    };

    const token = jwt.sign(
      tokenPayload,
      this.config.auth.jwtSecret,
      { expiresIn: this.config.auth.tokenExpiry }
    );

    // Calculate expiry
    const decoded = jwt.decode(token) as MCPTokenPayload;
    const expiresIn = decoded.exp - decoded.iat;

    return {
      access_token: token,
      token_type: 'Bearer',
      expires_in: expiresIn,
      scope: permissions,
    };
  }

  /**
   * Validate JWT token and return user information
   */
  async validateToken(token: string): Promise<MCPUser | null> {
    try {
      const decoded = jwt.verify(token, this.config.auth.jwtSecret) as MCPTokenPayload;
      const user = this.users.get(decoded.userId);

      if (!user) {
        return null;
      }

      // Update last access time
      user.lastAccessAt = new Date();
      this.users.set(user.id, user);

      return user;
    } catch (error) {
      console.error('Token validation failed:', error);
      return null;
    }
  }

  /**
   * Create MCP connection
   */
  createConnection(connectionId: string, user?: MCPUser): MCPConnection {
    const connection: MCPConnection = {
      id: connectionId,
      authenticated: !!user,
      userId: user?.id,
      permissions: user?.permissions || [],
    };

    this.connections.set(connectionId, connection);
    return connection;
  }

  /**
   * Get connection by ID
   */
  getConnection(connectionId: string): MCPConnection | undefined {
    return this.connections.get(connectionId);
  }

  /**
   * Update connection with client info
   */
  updateConnection(connectionId: string, updates: Partial<MCPConnection>): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      Object.assign(connection, updates);
      this.connections.set(connectionId, connection);
    }
  }

  /**
   * Remove connection
   */
  removeConnection(connectionId: string): void {
    this.connections.delete(connectionId);
  }

  /**
   * Check if user has permission
   */
  hasPermission(user: MCPUser, permission: string): boolean {
    return user.permissions.includes(permission) || user.permissions.includes('*');
  }

  /**
   * Check if client is allowed
   */
  private isAllowedClient(clientId: string): boolean {
    return this.config.auth.allowedClients.includes(clientId) || 
           this.config.auth.allowedClients.includes('*');
  }

  /**
   * Validate requested permissions against allowed permissions
   */
  private validatePermissions(requested: string[], allowed: string[]): string[] {
    return requested.filter(permission => 
      allowed.includes(permission) || allowed.includes('*')
    );
  }

  /**
   * Get user by ID
   */
  getUser(userId: string): MCPUser | undefined {
    return this.users.get(userId);
  }

  /**
   * List all active connections
   */
  getActiveConnections(): MCPConnection[] {
    return Array.from(this.connections.values());
  }

  /**
   * Clean up expired tokens and inactive connections
   */
  cleanup(): void {
    const now = new Date();
    const maxInactiveTime = 24 * 60 * 60 * 1000; // 24 hours

    // Remove inactive users
    for (const [userId, user] of this.users.entries()) {
      if (now.getTime() - user.lastAccessAt.getTime() > maxInactiveTime) {
        this.users.delete(userId);
      }
    }

    // Remove connections for deleted users
    for (const [connectionId, connection] of this.connections.entries()) {
      if (connection.userId && !this.users.has(connection.userId)) {
        this.connections.delete(connectionId);
      }
    }
  }
}
