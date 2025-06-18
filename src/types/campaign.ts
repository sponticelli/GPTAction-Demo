// Campaign Performance API Types
// Based on the OpenAPI specification

export interface Campaign {
  id: string;
  game: string;
  campaign_name: string;
  network: string;
  store: string;
  month: string;
  acquired_users: number;
  cpi: number;
  roas: {
    "ROAS d0": string;
    "ROAS d7": string;
    "ROAS d30": string;
    "ROAS d365": string;
  };
  retention: {
    "Retention d0": string;
    "Retention d7": string;
    "Retention d30": string;
    "Retention d365": string;
  };
}

export interface CampaignListResponse {
  data: Campaign[];
  pagination: {
    page: number;
    page_size: number;
    total_pages: number;
    total_records: number;
  };
}

export interface AggregateResponse {
  group_by: string;
  metric: string;
  aggregation: string;
  results: Array<{
    group: string;
    value: number;
  }>;
}

// Query parameter types
export interface CampaignFilters {
  game?: string;
  network?: string;
  store?: 'ios' | 'android';
  campaign_name?: string;
  month_from?: string; // date format
  month_to?: string; // date format
  min_cpi?: number;
  max_cpi?: number;
  roas_day?: 0 | 7 | 30 | 365;
  min_roas?: number;
  max_roas?: number;
  page?: number;
  page_size?: number;
}

export interface AggregateFilters {
  group_by: 'month' | 'network' | 'store' | 'campaign_name';
  metric: 'cpi' | 'acquired_users' | 'roas_d0' | 'roas_d7' | 'roas_d30' | 'roas_d365' | 'retention_d0' | 'retention_d7' | 'retention_d30' | 'retention_d365';
  aggregation: 'sum' | 'avg' | 'min' | 'max';
  filters?: string; // Optional filter expression
}

export interface ExportFilters {
  format: 'csv' | 'json';
  filters?: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ExportResponse {
  url: string;
}

// Error types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}
