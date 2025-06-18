import { AggregateFilters, AggregateResponse, Campaign } from '../types';
import { CampaignService } from './campaignService';
import { parseFilterExpression } from '../utils/filters';

export class MetricsService {
  private campaignService: CampaignService;

  constructor() {
    this.campaignService = new CampaignService();
  }

  /**
   * Get aggregated metrics grouped by dimensions
   */
  async getAggregatedMetrics(filters: AggregateFilters): Promise<AggregateResponse> {
    try {
      // Load all campaigns
      const allCampaigns = await this.campaignService.getAllCampaigns();

      // Apply additional filters if provided
      let filteredCampaigns = allCampaigns;
      if (filters.filters) {
        const additionalFilters = parseFilterExpression(filters.filters);
        filteredCampaigns = this.applyAdditionalFilters(allCampaigns, additionalFilters);
      }

      // Group campaigns by the specified dimension
      const groupedData = this.groupCampaigns(filteredCampaigns, filters.group_by);

      // Calculate aggregated metrics for each group
      const results = Object.entries(groupedData).map(([group, campaigns]) => {
        const value = this.calculateAggregatedMetric(campaigns, filters.metric, filters.aggregation);
        return { group, value };
      });

      return {
        group_by: filters.group_by,
        metric: filters.metric,
        aggregation: filters.aggregation,
        results,
      };
    } catch (error) {
      console.error('Error in MetricsService.getAggregatedMetrics:', error);
      throw new Error('Failed to calculate aggregated metrics');
    }
  }

  /**
   * Group campaigns by specified dimension
   */
  private groupCampaigns(campaigns: Campaign[], groupBy: string): Record<string, Campaign[]> {
    const grouped: Record<string, Campaign[]> = {};

    campaigns.forEach(campaign => {
      let groupKey: string;

      switch (groupBy) {
        case 'month':
          groupKey = campaign.month;
          break;
        case 'network':
          groupKey = campaign.network;
          break;
        case 'store':
          groupKey = campaign.store;
          break;
        case 'campaign_name':
          groupKey = campaign.campaign_name;
          break;
        default:
          groupKey = 'unknown';
      }

      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }
      grouped[groupKey].push(campaign);
    });

    return grouped;
  }

  /**
   * Calculate aggregated metric for a group of campaigns
   */
  private calculateAggregatedMetric(campaigns: Campaign[], metric: string, aggregation: string): number {
    const values = campaigns.map(campaign => this.extractMetricValue(campaign, metric)).filter(v => !isNaN(v));

    if (values.length === 0) return 0;

    switch (aggregation) {
      case 'sum':
        return values.reduce((sum, value) => sum + value, 0);
      case 'avg':
        return values.reduce((sum, value) => sum + value, 0) / values.length;
      case 'min':
        return Math.min(...values);
      case 'max':
        return Math.max(...values);
      default:
        return 0;
    }
  }

  /**
   * Extract metric value from campaign
   */
  private extractMetricValue(campaign: Campaign, metric: string): number {
    switch (metric) {
      case 'cpi':
        return campaign.cpi;
      case 'acquired_users':
        return campaign.acquired_users;
      case 'roas_d0':
        return parseFloat(campaign.roas["ROAS d0"]) || 0;
      case 'roas_d7':
        return parseFloat(campaign.roas["ROAS d7"]) || 0;
      case 'roas_d30':
        return parseFloat(campaign.roas["ROAS d30"]) || 0;
      case 'roas_d365':
        return parseFloat(campaign.roas["ROAS d365"]) || 0;
      case 'retention_d0':
        return parseFloat(campaign.retention["Retention d0"].replace('%', '')) || 0;
      case 'retention_d7':
        return parseFloat(campaign.retention["Retention d7"].replace('%', '')) || 0;
      case 'retention_d30':
        return parseFloat(campaign.retention["Retention d30"].replace('%', '')) || 0;
      case 'retention_d365':
        return parseFloat(campaign.retention["Retention d365"].replace('%', '')) || 0;
      default:
        return 0;
    }
  }

  /**
   * Apply additional filters (basic implementation)
   */
  private applyAdditionalFilters(campaigns: Campaign[], filters: any): Campaign[] {
    // This is a basic implementation - could be extended for complex filtering
    return campaigns.filter(campaign => {
      for (const [key, value] of Object.entries(filters)) {
        if (campaign[key as keyof Campaign] !== value) {
          return false;
        }
      }
      return true;
    });
  }
}
