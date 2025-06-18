// Re-export all types for easy importing
export * from './campaign';

// Additional utility types
export interface PaginationParams {
  page: number;
  page_size: number;
}

export interface SortParams {
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// Environment configuration
export interface Config {
  port: number;
  nodeEnv: string;
  apiKey?: string;
  corsOrigin: string;
  dataFilePath: string;
}

// Request context
export interface RequestContext {
  userId?: string;
  apiKey?: string;
  timestamp: Date;
}
