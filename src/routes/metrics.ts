import { Router, Request, Response } from 'express';
import { AggregateFilters, AggregateResponse, ApiResponse } from '../types';
import { MetricsService } from '../services/metricsService';
import { validateAggregateFilters } from '../middleware/validation';

const router = Router();
const metricsService = new MetricsService();

/**
 * GET /metrics/aggregate
 * Get aggregated campaign metrics grouped by dimensions
 */
router.get('/aggregate', validateAggregateFilters, async (req: Request, res: Response): Promise<void> => {
  try {
    const filters: AggregateFilters = {
      group_by: req.query.group_by as 'month' | 'network' | 'store' | 'campaign_name',
      metric: req.query.metric as 'cpi' | 'acquired_users' | 'roas_d0' | 'roas_d7' | 'roas_d30' | 'roas_d365' | 'retention_d0' | 'retention_d7' | 'retention_d30' | 'retention_d365',
      aggregation: req.query.aggregation as 'sum' | 'avg' | 'min' | 'max',
      filters: req.query.filters as string,
    };

    const result: AggregateResponse = await metricsService.getAggregatedMetrics(filters);

    const response: ApiResponse<AggregateResponse> = {
      success: true,
      data: result,
    };

    res.json(response);
  } catch (error) {
    console.error('Error aggregating metrics:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
    res.status(500).json(response);
  }
});

export default router;
