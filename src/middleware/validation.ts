import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

/**
 * Validate campaign filters
 */
export const validateCampaignFilters = (req: Request, res: Response, next: NextFunction) => {
  const errors: string[] = [];

  // Validate store enum
  if (req.query.store && !['ios', 'android'].includes(req.query.store as string)) {
    errors.push('store must be either "ios" or "android"');
  }

  // Validate date formats (basic validation)
  if (req.query.month_from && !isValidDate(req.query.month_from as string)) {
    errors.push('month_from must be a valid date (YYYY-MM-DD)');
  }

  if (req.query.month_to && !isValidDate(req.query.month_to as string)) {
    errors.push('month_to must be a valid date (YYYY-MM-DD)');
  }

  // Validate numeric fields
  if (req.query.min_cpi && isNaN(Number(req.query.min_cpi))) {
    errors.push('min_cpi must be a valid number');
  }

  if (req.query.max_cpi && isNaN(Number(req.query.max_cpi))) {
    errors.push('max_cpi must be a valid number');
  }

  if (req.query.min_roas && isNaN(Number(req.query.min_roas))) {
    errors.push('min_roas must be a valid number');
  }

  if (req.query.max_roas && isNaN(Number(req.query.max_roas))) {
    errors.push('max_roas must be a valid number');
  }

  // Validate roas_day enum
  if (req.query.roas_day && ![0, 7, 30, 365].includes(Number(req.query.roas_day))) {
    errors.push('roas_day must be one of: 0, 7, 30, 365');
  }

  if (errors.length > 0) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Validation error',
      message: errors.join(', '),
    };
    res.status(400).json(response);
    return;
  }

  next();
};

/**
 * Validate pagination parameters
 */
export const validatePagination = (req: Request, res: Response, next: NextFunction) => {
  const errors: string[] = [];

  if (req.query.page) {
    const page = Number(req.query.page);
    if (isNaN(page) || page < 1) {
      errors.push('page must be a positive integer');
    }
  }

  if (req.query.page_size) {
    const pageSize = Number(req.query.page_size);
    if (isNaN(pageSize) || pageSize < 1 || pageSize > 1000) {
      errors.push('page_size must be between 1 and 1000');
    }
  }

  if (errors.length > 0) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Validation error',
      message: errors.join(', '),
    };
    return res.status(400).json(response);
  }

  next();
};

/**
 * Validate aggregate filters
 */
export const validateAggregateFilters = (req: Request, res: Response, next: NextFunction) => {
  const errors: string[] = [];

  // Required fields
  if (!req.query.group_by) {
    errors.push('group_by is required');
  } else if (!['month', 'network', 'store', 'campaign_name'].includes(req.query.group_by as string)) {
    errors.push('group_by must be one of: month, network, store, campaign_name');
  }

  if (!req.query.metric) {
    errors.push('metric is required');
  } else if (!['cpi', 'acquired_users', 'roas_d0', 'roas_d7', 'roas_d30', 'roas_d365', 'retention_d0', 'retention_d7', 'retention_d30', 'retention_d365'].includes(req.query.metric as string)) {
    errors.push('metric must be one of: cpi, acquired_users, roas_d0, roas_d7, roas_d30, roas_d365, retention_d0, retention_d7, retention_d30, retention_d365');
  }

  if (!req.query.aggregation) {
    errors.push('aggregation is required');
  } else if (!['sum', 'avg', 'min', 'max'].includes(req.query.aggregation as string)) {
    errors.push('aggregation must be one of: sum, avg, min, max');
  }

  if (errors.length > 0) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Validation error',
      message: errors.join(', '),
    };
    return res.status(400).json(response);
  }

  next();
};

/**
 * Validate export filters
 */
export const validateExportFilters = (req: Request, res: Response, next: NextFunction) => {
  const errors: string[] = [];

  if (!req.query.format) {
    errors.push('format is required');
  } else if (!['csv', 'json'].includes(req.query.format as string)) {
    errors.push('format must be either "csv" or "json"');
  }

  if (errors.length > 0) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Validation error',
      message: errors.join(', '),
    };
    return res.status(400).json(response);
  }

  next();
};

/**
 * Helper function to validate date format
 */
function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime()) && !!dateString.match(/^\d{4}-\d{2}-\d{2}$/);
}
