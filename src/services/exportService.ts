import * as fs from 'fs/promises';
import * as path from 'path';
import { ExportFilters, ExportResponse, Campaign } from '../types';
import { CampaignService } from './campaignService';
import { parseFilterExpression } from '../utils/filters';

export class ExportService {
  private campaignService: CampaignService;

  constructor() {
    this.campaignService = new CampaignService();
  }

  /**
   * Export campaigns as CSV or JSON
   */
  async exportCampaigns(filters: ExportFilters): Promise<ExportResponse> {
    try {
      // Load all campaigns
      let campaigns = await this.campaignService.getAllCampaigns();

      // Apply additional filters if provided
      if (filters.filters) {
        const additionalFilters = parseFilterExpression(filters.filters);
        campaigns = this.applyAdditionalFilters(campaigns, additionalFilters);
      }

      // Generate export file
      const fileName = `campaigns_export_${Date.now()}.${filters.format}`;
      const filePath = path.join('./exports', fileName);

      // Ensure exports directory exists
      await this.ensureExportsDirectory();

      // Generate file based on format
      if (filters.format === 'csv') {
        await this.generateCSV(campaigns, filePath);
      } else {
        await this.generateJSON(campaigns, filePath);
      }

      // Return download URL (in a real deployment, this would be a proper URL)
      const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
      const downloadUrl = `${baseUrl}/exports/${fileName}`;

      return {
        url: downloadUrl,
      };
    } catch (error) {
      console.error('Error in ExportService.exportCampaigns:', error);
      throw new Error('Failed to export campaigns');
    }
  }

  /**
   * Generate CSV file
   */
  private async generateCSV(campaigns: Campaign[], filePath: string): Promise<void> {
    const headers = [
      'id',
      'game',
      'campaign_name',
      'network',
      'store',
      'month',
      'acquired_users',
      'cpi',
      'roas_d0',
      'roas_d7',
      'roas_d30',
      'roas_d365',
      'retention_d0',
      'retention_d7',
      'retention_d30',
      'retention_d365',
    ];

    const csvRows = [headers.join(',')];

    campaigns.forEach(campaign => {
      const row = [
        campaign.id,
        `"${campaign.game}"`,
        `"${campaign.campaign_name}"`,
        `"${campaign.network}"`,
        campaign.store,
        campaign.month,
        campaign.acquired_users,
        campaign.cpi,
        campaign.roas["ROAS d0"],
        campaign.roas["ROAS d7"],
        campaign.roas["ROAS d30"],
        campaign.roas["ROAS d365"],
        campaign.retention["Retention d0"],
        campaign.retention["Retention d7"],
        campaign.retention["Retention d30"],
        campaign.retention["Retention d365"],
      ];
      csvRows.push(row.join(','));
    });

    await fs.writeFile(filePath, csvRows.join('\n'), 'utf-8');
  }

  /**
   * Generate JSON file
   */
  private async generateJSON(campaigns: Campaign[], filePath: string): Promise<void> {
    const jsonData = {
      exported_at: new Date().toISOString(),
      total_records: campaigns.length,
      data: campaigns,
    };

    await fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), 'utf-8');
  }

  /**
   * Ensure exports directory exists
   */
  private async ensureExportsDirectory(): Promise<void> {
    const exportsDir = './exports';
    try {
      await fs.access(exportsDir);
    } catch (error) {
      await fs.mkdir(exportsDir, { recursive: true });
    }
  }

  /**
   * Apply additional filters (basic implementation)
   */
  private applyAdditionalFilters(campaigns: Campaign[], filters: any): Campaign[] {
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
