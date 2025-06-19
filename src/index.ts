import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { createServer } from 'http';

import routes from './routes';
import mcpRoutes, { setMCPServer } from './routes/mcp';
import { errorHandler, notFoundHandler, requestLogger } from './middleware/errorHandler';
import { optionalAuth } from './middleware/auth';
import { loadConfig, getEnvironmentSettings } from './utils/config';
import { MCPServer } from './services/mcpServer';
import { validateMCPEnvironment } from './config/mcp';

// Load environment variables from .env file (only if not already set)
// This ensures Railway environment variables take precedence
dotenv.config();

// Override with Railway environment variables if they exist
if (process.env.RAILWAY_ENVIRONMENT) {
  // We're running on Railway, ensure production settings
  process.env.NODE_ENV = process.env.NODE_ENV || 'production';
}

// Load configuration
const config = loadConfig();
const envSettings = getEnvironmentSettings();

// Validate MCP environment
const mcpValidation = validateMCPEnvironment();
if (!mcpValidation.valid) {
  console.warn('⚠️  MCP Environment validation warnings:');
  mcpValidation.errors.forEach(error => console.warn(`   - ${error}`));
}

// Create Express application
const app = express();

// Create HTTP server for WebSocket support
const server = createServer(app);

// Security middleware
if (envSettings.enableHelmet) {
  app.use(helmet());
}

// CORS middleware
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));

// Request parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (envSettings.isDevelopment) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Custom request logging
app.use(requestLogger);

// Health check endpoint (public, no auth required)
app.get('/api/v1/health', (req, res) => {
  res.json({
    success: true,
    message: 'Campaign Performance API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Authentication middleware for all other API endpoints
app.use('/api/v1', optionalAuth);

// Static files for exports
app.use('/exports', express.static(path.join(process.cwd(), 'exports')));

// API routes
app.use('/api/v1', routes);

// MCP routes
app.use('/api/v1/mcp', mcpRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Campaign Performance API',
    version: '1.0.0',
    description: 'API for UA Managers to query, aggregate, and export campaign performance data',
    environment: config.nodeEnv,
    endpoints: {
      health: '/api/v1/health',
      campaigns: '/api/v1/campaigns',
      metrics: '/api/v1/metrics/aggregate',
      exports: '/api/v1/exports',
    },
    documentation: 'See OpenAPI specification in Documentation/ua_openapi.yml',
  });
});

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Initialize MCP Server
const mcpServer = new MCPServer();
mcpServer.initialize(server);
setMCPServer(mcpServer);

// Start server
server.listen(config.port, () => {
  console.log(`🚀 Campaign Performance API running on port ${config.port}`);
  console.log(`📝 Environment: ${config.nodeEnv}`);
  console.log(`🔗 Base URL: http://localhost:${config.port}`);
  console.log(`📊 Health check: http://localhost:${config.port}/api/v1/health`);
  console.log(`🔌 MCP Server: ws://localhost:${config.port}/mcp`);
  console.log(`🔑 MCP Auth: http://localhost:${config.port}/api/v1/mcp/auth/token`);
  console.log(`📋 MCP Tools: http://localhost:${config.port}/api/v1/mcp/tools`);

  if (envSettings.isDevelopment) {
    console.log(`🔧 Development mode: Authentication is optional`);
  }

  if (mcpValidation.valid) {
    console.log(`✅ MCP Server ready for client connections`);
  } else {
    console.log(`⚠️  MCP Server started with warnings (see above)`);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  mcpServer.shutdown();
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  mcpServer.shutdown();
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

export default app;
