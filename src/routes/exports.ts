import { Router, Request, Response } from 'express';
import { ExportFilters, ExportResponse, ApiResponse } from '../types';
import { ExportService } from '../services/exportService';
import { validateExportFilters } from '../middleware/validation';

const router = Router();
const exportService = new ExportService();

/**
 * GET /exports
 * Export filtered campaigns as CSV or JSON
 */
router.get('/', validateExportFilters, async (req: Request, res: Response): Promise<void> => {
  try {
    const filters: ExportFilters = {
      format: req.query.format as 'csv' | 'json',
      filters: req.query.filters as string,
    };

    const result: ExportResponse = await exportService.exportCampaigns(filters);

    const response: ApiResponse<ExportResponse> = {
      success: true,
      data: result,
    };

    res.json(response);
  } catch (error) {
    console.error('Error exporting campaigns:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
    res.status(500).json(response);
  }
});

export default router;
