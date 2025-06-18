import { Config } from '../types';

/**
 * Load and validate configuration from environment variables
 */
export function loadConfig(): Config {
  const config: Config = {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    apiKey: process.env.API_KEY,
    corsOrigin: process.env.CORS_ORIGIN || '*',
    dataFilePath: process.env.DATA_FILE_PATH || './data/campaigns.json',
  };

  // Validate required configuration
  if (config.nodeEnv === 'production' && !config.apiKey) {
    console.warn('Warning: API_KEY not set in production environment');
  }

  if (isNaN(config.port) || config.port < 1 || config.port > 65535) {
    throw new Error('Invalid PORT configuration. Must be a number between 1 and 65535.');
  }

  return config;
}

/**
 * Get environment-specific settings
 */
export function getEnvironmentSettings() {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    isDevelopment,
    isProduction,
    logLevel: isDevelopment ? 'debug' : 'info',
    enableCors: true,
    enableHelmet: isProduction,
    enableCompression: isProduction,
  };
}
