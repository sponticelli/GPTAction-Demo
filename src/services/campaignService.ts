import { Campaign, CampaignFilters, CampaignListResponse } from '../types';
import { DataService } from './dataService';
import { applyCampaignFilters, applyPagination } from '../utils/filters';

export class CampaignService {
  private dataService: DataService;

  constructor() {
    this.dataService = new DataService();
  }

  /**
   * Get campaigns with filters and pagination
   */
  async getCampaigns(filters: CampaignFilters): Promise<CampaignListResponse> {
    try {
      // Load all campaigns from data source
      const allCampaigns = await this.dataService.loadCampaigns();

      // Apply filters
      const filteredCampaigns = applyCampaignFilters(allCampaigns, filters);

      // Apply pagination
      const result = applyPagination(
        filteredCampaigns,
        filters.page || 1,
        filters.page_size || 50
      );

      return {
        data: result.data,
        pagination: result.pagination,
      };
    } catch (error) {
      console.error('Error in CampaignService.getCampaigns:', error);
      throw new Error('Failed to retrieve campaigns');
    }
  }

  /**
   * Get a single campaign by ID
   */
  async getCampaignById(id: string): Promise<Campaign | null> {
    try {
      const allCampaigns = await this.dataService.loadCampaigns();
      const campaign = allCampaigns.find(c => c.id === id);
      return campaign || null;
    } catch (error) {
      console.error('Error in CampaignService.getCampaignById:', error);
      throw new Error('Failed to retrieve campaign');
    }
  }

  /**
   * Get all campaigns (for internal use by other services)
   */
  async getAllCampaigns(): Promise<Campaign[]> {
    return this.dataService.loadCampaigns();
  }
}
