import { MCPTool, MCPToolResult, MCPCallToolRequest } from '../types/mcp';
import { CampaignService } from './campaignService';
import { MetricsService } from './metricsService';
import { ExportService } from './exportService';
import { CampaignFilters, AggregateFilters } from '../types';

/**
 * MCP Tools Service
 * Implements MCP tools that expose Campaign Performance API functionality
 */
export class MCPToolsService {
  private campaignService = new CampaignService();
  private metricsService = new MetricsService();
  private exportService = new ExportService();

  /**
   * Get all available MCP tools
   */
  getTools(): MCPTool[] {
    return [
      this.getListCampaignsTool(),
      this.getGetCampaignTool(),
      this.getAggregateMetricsTool(),
      this.getExportCampaignsTool(),
      this.getHealthCheckTool(),
    ];
  }

  /**
   * Execute a tool call
   */
  async callTool(request: MCPCallToolRequest): Promise<MCPToolResult> {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'list_campaigns':
          return await this.listCampaigns(args);
        case 'get_campaign':
          return await this.getCampaign(args);
        case 'aggregate_metrics':
          return await this.aggregateMetrics(args);
        case 'export_campaigns':
          return await this.exportCampaigns(args);
        case 'health_check':
          return await this.healthCheck(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error executing tool '${name}': ${error instanceof Error ? error.message : 'Unknown error'}`,
        }],
        isError: true,
      };
    }
  }

  /**
   * List Campaigns Tool
   */
  private getListCampaignsTool(): MCPTool {
    return {
      name: 'list_campaigns',
      description: 'Retrieve a paginated list of campaign performance records with optional filters',
      inputSchema: {
        type: 'object',
        properties: {
          game: {
            type: 'string',
            description: 'Filter by game name',
          },
          network: {
            type: 'string',
            description: 'Filter by advertising network',
          },
          store: {
            type: 'string',
            enum: ['ios', 'android'],
            description: 'Filter by app store',
          },
          campaign_name: {
            type: 'string',
            description: 'Filter by campaign name',
          },
          month_from: {
            type: 'string',
            format: 'date',
            description: 'Start date filter (YYYY-MM format)',
          },
          month_to: {
            type: 'string',
            format: 'date',
            description: 'End date filter (YYYY-MM format)',
          },
          min_cpi: {
            type: 'number',
            description: 'Minimum cost per install',
          },
          max_cpi: {
            type: 'number',
            description: 'Maximum cost per install',
          },
          roas_day: {
            type: 'integer',
            enum: [0, 7, 30, 365],
            description: 'ROAS day for filtering',
          },
          min_roas: {
            type: 'number',
            description: 'Minimum ROAS value',
          },
          max_roas: {
            type: 'number',
            description: 'Maximum ROAS value',
          },
          page: {
            type: 'integer',
            default: 1,
            description: 'Page number for pagination',
          },
          page_size: {
            type: 'integer',
            default: 50,
            description: 'Number of records per page',
          },
        },
      },
    };
  }

  /**
   * Get Campaign Tool
   */
  private getGetCampaignTool(): MCPTool {
    return {
      name: 'get_campaign',
      description: 'Get detailed information about a specific campaign by ID',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Campaign ID',
          },
        },
        required: ['id'],
      },
    };
  }

  /**
   * Aggregate Metrics Tool
   */
  private getAggregateMetricsTool(): MCPTool {
    return {
      name: 'aggregate_metrics',
      description: 'Get aggregated campaign metrics grouped by dimensions',
      inputSchema: {
        type: 'object',
        properties: {
          group_by: {
            type: 'string',
            enum: ['month', 'network', 'store', 'campaign_name'],
            description: 'Dimension to group by',
          },
          metric: {
            type: 'string',
            enum: ['cpi', 'acquired_users', 'roas_d0', 'roas_d7', 'roas_d30', 'roas_d365', 'retention_d0', 'retention_d7', 'retention_d30', 'retention_d365'],
            description: 'Metric to aggregate',
          },
          aggregation: {
            type: 'string',
            enum: ['sum', 'avg', 'min', 'max'],
            description: 'Aggregation function',
          },
          filters: {
            type: 'string',
            description: 'Optional filter expression',
          },
        },
        required: ['group_by', 'metric', 'aggregation'],
      },
    };
  }

  /**
   * Export Campaigns Tool
   */
  private getExportCampaignsTool(): MCPTool {
    return {
      name: 'export_campaigns',
      description: 'Export filtered campaign data as CSV or JSON',
      inputSchema: {
        type: 'object',
        properties: {
          format: {
            type: 'string',
            enum: ['csv', 'json'],
            description: 'Export format',
          },
          filters: {
            type: 'string',
            description: 'Optional filter expression',
          },
        },
        required: ['format'],
      },
    };
  }

  /**
   * Health Check Tool
   */
  private getHealthCheckTool(): MCPTool {
    return {
      name: 'health_check',
      description: 'Check the health status of the Campaign Performance API',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    };
  }

  /**
   * Implementation: List Campaigns
   */
  private async listCampaigns(args: any): Promise<MCPToolResult> {
    const filters: CampaignFilters = {
      game: args.game,
      network: args.network,
      store: args.store,
      campaign_name: args.campaign_name,
      month_from: args.month_from,
      month_to: args.month_to,
      min_cpi: args.min_cpi,
      max_cpi: args.max_cpi,
      roas_day: args.roas_day,
      min_roas: args.min_roas,
      max_roas: args.max_roas,
      page: args.page || 1,
      page_size: args.page_size || 50,
    };

    const result = await this.campaignService.getCampaigns(filters);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2),
      }],
    };
  }

  /**
   * Implementation: Get Campaign
   */
  private async getCampaign(args: any): Promise<MCPToolResult> {
    const campaign = await this.campaignService.getCampaignById(args.id);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(campaign, null, 2),
      }],
    };
  }

  /**
   * Implementation: Aggregate Metrics
   */
  private async aggregateMetrics(args: any): Promise<MCPToolResult> {
    const filters: AggregateFilters = {
      group_by: args.group_by,
      metric: args.metric,
      aggregation: args.aggregation,
      filters: args.filters,
    };

    const result = await this.metricsService.getAggregatedMetrics(filters);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2),
      }],
    };
  }

  /**
   * Implementation: Export Campaigns
   */
  private async exportCampaigns(args: any): Promise<MCPToolResult> {
    const exportFilters = {
      format: args.format,
      filters: args.filters,
    };
    const result = await this.exportService.exportCampaigns(exportFilters);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2),
      }],
    };
  }

  /**
   * Implementation: Health Check
   */
  private async healthCheck(args: any): Promise<MCPToolResult> {
    const health = {
      success: true,
      message: 'Campaign Performance API is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(health, null, 2),
      }],
    };
  }
}
