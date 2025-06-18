import { Campaign, CampaignFilters } from '../types';

/**
 * Apply filters to campaign data
 */
export function applyCampaignFilters(campaigns: Campaign[], filters: CampaignFilters): Campaign[] {
  return campaigns.filter(campaign => {
    // Game filter
    if (filters.game && !campaign.game.toLowerCase().includes(filters.game.toLowerCase())) {
      return false;
    }

    // Network filter
    if (filters.network && !campaign.network.toLowerCase().includes(filters.network.toLowerCase())) {
      return false;
    }

    // Store filter
    if (filters.store && campaign.store !== filters.store) {
      return false;
    }

    // Campaign name filter
    if (filters.campaign_name && !campaign.campaign_name.toLowerCase().includes(filters.campaign_name.toLowerCase())) {
      return false;
    }

    // Date range filters
    if (filters.month_from || filters.month_to) {
      const campaignDate = new Date(campaign.month);
      
      if (filters.month_from) {
        const fromDate = new Date(filters.month_from);
        if (campaignDate < fromDate) return false;
      }
      
      if (filters.month_to) {
        const toDate = new Date(filters.month_to);
        if (campaignDate > toDate) return false;
      }
    }

    // CPI filters
    if (filters.min_cpi !== undefined && campaign.cpi < filters.min_cpi) {
      return false;
    }

    if (filters.max_cpi !== undefined && campaign.cpi > filters.max_cpi) {
      return false;
    }

    // ROAS filters
    if (filters.min_roas !== undefined || filters.max_roas !== undefined) {
      let roasValue: number;
      
      switch (filters.roas_day) {
        case 0:
          roasValue = parseFloat(campaign.roas["ROAS d0"]) || 0;
          break;
        case 7:
          roasValue = parseFloat(campaign.roas["ROAS d7"]) || 0;
          break;
        case 30:
          roasValue = parseFloat(campaign.roas["ROAS d30"]) || 0;
          break;
        case 365:
          roasValue = parseFloat(campaign.roas["ROAS d365"]) || 0;
          break;
        default:
          roasValue = parseFloat(campaign.roas["ROAS d7"]) || 0; // Default to d7
      }

      if (filters.min_roas !== undefined && roasValue < filters.min_roas) {
        return false;
      }

      if (filters.max_roas !== undefined && roasValue > filters.max_roas) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Apply pagination to data
 */
export function applyPagination<T>(data: T[], page: number = 1, pageSize: number = 50): {
  data: T[];
  pagination: {
    page: number;
    page_size: number;
    total_pages: number;
    total_records: number;
  };
} {
  const totalRecords = data.length;
  const totalPages = Math.ceil(totalRecords / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  
  const paginatedData = data.slice(startIndex, endIndex);

  return {
    data: paginatedData,
    pagination: {
      page,
      page_size: pageSize,
      total_pages: totalPages,
      total_records: totalRecords,
    },
  };
}

/**
 * Parse filter expression (basic implementation)
 * This is a placeholder for more complex filter parsing
 */
export function parseFilterExpression(filterExpression: string): any {
  if (!filterExpression) return {};
  
  try {
    // Basic implementation - could be extended to support complex expressions
    return JSON.parse(filterExpression);
  } catch (error) {
    console.warn('Failed to parse filter expression:', filterExpression);
    return {};
  }
}
