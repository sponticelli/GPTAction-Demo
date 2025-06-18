import { Router, Request, Response } from 'express';
import { CampaignFilters, CampaignListResponse, Campaign, ApiResponse } from '../types';
import { CampaignService } from '../services/campaignService';
import { validateCampaignFilters, validatePagination } from '../middleware/validation';

const router = Router();
const campaignService = new CampaignService();

/**
 * GET /campaigns
 * Retrieve a paginated list of campaign performance records with filters
 */
router.get('/', validateCampaignFilters, validatePagination, async (req: Request, res: Response) => {
  try {
    const filters: CampaignFilters = {
      game: req.query.game as string,
      network: req.query.network as string,
      store: req.query.store as 'ios' | 'android',
      campaign_name: req.query.campaign_name as string,
      month_from: req.query.month_from as string,
      month_to: req.query.month_to as string,
      min_cpi: req.query.min_cpi ? Number(req.query.min_cpi) : undefined,
      max_cpi: req.query.max_cpi ? Number(req.query.max_cpi) : undefined,
      roas_day: req.query.roas_day ? Number(req.query.roas_day) as 0 | 7 | 30 | 365 : undefined,
      min_roas: req.query.min_roas ? Number(req.query.min_roas) : undefined,
      max_roas: req.query.max_roas ? Number(req.query.max_roas) : undefined,
      page: req.query.page ? Number(req.query.page) : 1,
      page_size: req.query.page_size ? Number(req.query.page_size) : 50,
    };

    const result: CampaignListResponse = await campaignService.getCampaigns(filters);

    const response: ApiResponse<CampaignListResponse> = {
      success: true,
      data: result,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
    res.status(500).json(response);
  }
});

/**
 * GET /campaigns/:id
 * Get a specific campaign record by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Bad request',
        message: 'Campaign ID is required',
      };
      return res.status(400).json(response);
    }

    const campaign: Campaign | null = await campaignService.getCampaignById(id);

    if (!campaign) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Not found',
        message: 'Campaign not found',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<Campaign> = {
      success: true,
      data: campaign,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching campaign:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
    res.status(500).json(response);
  }
});

export default router;
