import * as fs from 'fs/promises';
import * as path from 'path';
import { Campaign } from '../types';

export class DataService {
  private campaigns: Campaign[] | null = null;
  private lastLoadTime: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  /**
   * Load campaigns from JSON file with caching
   */
  async loadCampaigns(): Promise<Campaign[]> {
    const now = Date.now();
    
    // Return cached data if still valid
    if (this.campaigns && (now - this.lastLoadTime) < this.CACHE_DURATION) {
      return this.campaigns;
    }

    try {
      const dataFilePath = process.env.DATA_FILE_PATH || './data/campaigns.json';
      const absolutePath = path.resolve(dataFilePath);
      
      // Check if file exists
      try {
        await fs.access(absolutePath);
      } catch (error) {
        console.warn(`Data file not found at ${absolutePath}. Using sample data.`);
        return this.getSampleData();
      }

      // Read and parse JSON file
      const fileContent = await fs.readFile(absolutePath, 'utf-8');
      const data = JSON.parse(fileContent);

      // Validate data structure
      if (!Array.isArray(data)) {
        throw new Error('Data file must contain an array of campaigns');
      }

      // Validate each campaign object and generate IDs if missing
      const validatedCampaigns = data.map((item, index) => {
        if (!this.isValidCampaign(item)) {
          throw new Error(`Invalid campaign data at index ${index}`);
        }

        // Generate ID if missing
        const campaignWithId = {
          ...item,
          id: this.generateCampaignId(item)
        };

        return campaignWithId as Campaign;
      });

      // Cache the data
      this.campaigns = validatedCampaigns;
      this.lastLoadTime = now;

      console.log(`Loaded ${validatedCampaigns.length} campaigns from ${absolutePath}`);
      return validatedCampaigns;

    } catch (error) {
      console.error('Error loading campaigns data:', error);
      
      // Return cached data if available, otherwise sample data
      if (this.campaigns) {
        console.warn('Using cached data due to load error');
        return this.campaigns;
      }
      
      console.warn('Using sample data due to load error');
      return this.getSampleData();
    }
  }

  /**
   * Validate campaign object structure (ID is optional - will be generated if missing)
   */
  private isValidCampaign(obj: any): boolean {
    return (
      obj &&
      typeof obj.game === 'string' &&
      typeof obj.campaign_name === 'string' &&
      typeof obj.network === 'string' &&
      typeof obj.store === 'string' &&
      typeof obj.month === 'string' &&
      typeof obj.acquired_users === 'number' &&
      typeof obj.cpi === 'number' &&
      obj.roas &&
      typeof obj.roas === 'object' &&
      obj.retention &&
      typeof obj.retention === 'object'
    );
  }

  /**
   * Generate a unique ID for a campaign if it doesn't have one
   */
  private generateCampaignId(campaign: any): string {
    if (campaign.id && typeof campaign.id === 'string') {
      return campaign.id;
    }

    // Generate ID from campaign_name and month to ensure uniqueness
    const safeCampaignName = campaign.campaign_name.replace(/[^a-zA-Z0-9]/g, '_');
    const safeMonth = campaign.month.replace(/[^a-zA-Z0-9]/g, '_');
    return `${safeCampaignName}_${safeMonth}`;
  }

  /**
   * Get sample data for testing/development
   */
  private getSampleData(): Campaign[] {
    return [
      {
        id: "1",
        game: "Sample Game",
        campaign_name: "Sample Campaign 1",
        network: "Facebook",
        store: "ios",
        month: "2024-01",
        acquired_users: 1000,
        cpi: 2.50,
        roas: {
          "ROAS d0": "0.15",
          "ROAS d7": "0.45",
          "ROAS d30": "1.20",
          "ROAS d365": "3.50"
        },
        retention: {
          "Retention d0": "100%",
          "Retention d7": "25%",
          "Retention d30": "12%",
          "Retention d365": "5%"
        }
      },
      {
        id: "2",
        game: "Sample Game",
        campaign_name: "Sample Campaign 2",
        network: "Google",
        store: "android",
        month: "2024-01",
        acquired_users: 1500,
        cpi: 1.80,
        roas: {
          "ROAS d0": "0.20",
          "ROAS d7": "0.60",
          "ROAS d30": "1.50",
          "ROAS d365": "4.20"
        },
        retention: {
          "Retention d0": "100%",
          "Retention d7": "30%",
          "Retention d30": "15%",
          "Retention d365": "7%"
        }
      }
    ];
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.campaigns = null;
    this.lastLoadTime = 0;
  }
}
