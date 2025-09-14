import { Request, Response } from 'express';
import { FermentationService } from '../services/fermentation.service';
import { 
  CreateFermentationLogRequest,
  QueryOptions,
  ApiResponse,
  PaginatedResponse
} from '../types';
import { asyncHandler } from '../middleware/error.middleware';

export class FermentationController {
  private fermentationService: FermentationService;

  constructor() {
    this.fermentationService = new FermentationService();
  }

  /**
   * Create a new fermentation log entry
   * POST /api/production/fermentation
   */
  createFermentationLog = asyncHandler(async (req: Request, res: Response) => {
    const logData: CreateFermentationLogRequest = req.body;
    
    const log = await this.fermentationService.createFermentationLog(logData);

    const response: ApiResponse<typeof log> = {
      success: true,
      data: log,
      message: 'Fermentation log created successfully'
    };

    res.status(201).json(response);
  });

  /**
   * Get fermentation logs for a batch
   * GET /api/production/fermentation/batch/:batchId
   */
  getFermentationLogs = asyncHandler(async (req: Request, res: Response) => {
    const { batchId } = req.params;

    const options: QueryOptions = {
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      sortBy: req.query.sortBy as string || 'timestamp',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc'
    };

    const { logs, total } = await this.fermentationService.getFermentationLogs(batchId, options);

    const response: PaginatedResponse<typeof logs[0]> = {
      success: true,
      data: logs,
      pagination: {
        page: options.page!,
        limit: options.limit!,
        total,
        totalPages: Math.ceil(total / options.limit!)
      }
    };

    res.json(response);
  });

  /**
   * Get fermentation log by ID
   * GET /api/production/fermentation/:id
   */
  getFermentationLogById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const log = await this.fermentationService.getFermentationLogById(id);

    const response: ApiResponse<typeof log> = {
      success: true,
      data: log,
      message: 'Fermentation log retrieved successfully'
    };

    res.json(response);
  });

  /**
   * Update fermentation log
   * PATCH /api/production/fermentation/:id
   */
  updateFermentationLog = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    const log = await this.fermentationService.updateFermentationLog(id, updateData);

    const response: ApiResponse<typeof log> = {
      success: true,
      data: log,
      message: 'Fermentation log updated successfully'
    };

    res.json(response);
  });

  /**
   * Delete fermentation log
   * DELETE /api/production/fermentation/:id
   */
  deleteFermentationLog = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    await this.fermentationService.deleteFermentationLog(id);

    const response: ApiResponse<null> = {
      success: true,
      data: null,
      message: 'Fermentation log deleted successfully'
    };

    res.json(response);
  });

  /**
   * Get active fermentation summary
   * GET /api/production/fermentation/summary/active
   */
  getActiveFermentationSummary = asyncHandler(async (req: Request, res: Response) => {
    const summary = await this.fermentationService.getActiveFermentationSummary();

    const response: ApiResponse<typeof summary> = {
      success: true,
      data: summary,
      message: 'Active fermentation summary retrieved successfully'
    };

    res.json(response);
  });

  /**
   * Get fermentation trends for a batch
   * GET /api/production/fermentation/batch/:batchId/trends
   */
  getFermentationTrends = asyncHandler(async (req: Request, res: Response) => {
    const { batchId } = req.params;

    const trends = await this.fermentationService.getFermentationTrends(batchId);

    const response: ApiResponse<typeof trends> = {
      success: true,
      data: trends,
      message: 'Fermentation trends retrieved successfully'
    };

    res.json(response);
  });

  /**
   * Get fermentation efficiency for a batch
   * GET /api/production/fermentation/batch/:batchId/efficiency
   */
  getFermentationEfficiency = asyncHandler(async (req: Request, res: Response) => {
    const { batchId } = req.params;

    const efficiency = await this.fermentationService.getFermentationEfficiency(batchId);

    const response: ApiResponse<typeof efficiency> = {
      success: true,
      data: efficiency,
      message: 'Fermentation efficiency retrieved successfully'
    };

    res.json(response);
  });

  /**
   * Get latest fermentation reading for a batch
   * GET /api/production/fermentation/batch/:batchId/latest
   */
  getLatestReading = asyncHandler(async (req: Request, res: Response) => {
    const { batchId } = req.params;

    const reading = await this.fermentationService.getLatestReading(batchId);

    const response: ApiResponse<typeof reading> = {
      success: true,
      data: reading,
      message: 'Latest fermentation reading retrieved successfully'
    };

    res.json(response);
  });

  /**
   * Bulk create fermentation logs (for sensor integration)
   * POST /api/production/fermentation/bulk
   */
  bulkCreateLogs = asyncHandler(async (req: Request, res: Response) => {
    const { logs } = req.body;

    if (!Array.isArray(logs) || logs.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Logs array is required and must contain at least one log entry'
      });
    }

    const createdLogs = await this.fermentationService.bulkCreateLogs(logs);

    const response: ApiResponse<typeof createdLogs> = {
      success: true,
      data: createdLogs,
      message: `${createdLogs.length} fermentation logs created successfully`
    };

    res.status(201).json(response);
  });

  /**
   * Get fermentation alerts dashboard
   * GET /api/production/fermentation/alerts
   */
  getFermentationAlerts = asyncHandler(async (req: Request, res: Response) => {
    const summary = await this.fermentationService.getActiveFermentationSummary();
    
    // Collect all alerts from active fermentation batches
    const allAlerts = summary.flatMap(batch => 
      batch.alerts.map(alert => ({
        ...alert,
        batchId: batch.batchId,
        batchNumber: batch.batchNumber,
        recipe: batch.recipe
      }))
    );

    // Group alerts by severity
    const alertsBySeverity = allAlerts.reduce((acc, alert) => {
      if (!acc[alert.severity]) {
        acc[alert.severity] = [];
      }
      acc[alert.severity].push(alert);
      return acc;
    }, {} as Record<string, typeof allAlerts>);

    // Sort each severity group by timestamp (newest first)
    Object.values(alertsBySeverity).forEach(alerts => {
      alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    });

    const alertsDashboard = {
      total: allAlerts.length,
      critical: alertsBySeverity.critical?.length || 0,
      warning: alertsBySeverity.warning?.length || 0,
      info: alertsBySeverity.info?.length || 0,
      alerts: alertsBySeverity,
      recentAlerts: allAlerts
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 10) // Most recent 10 alerts
    };

    const response: ApiResponse<typeof alertsDashboard> = {
      success: true,
      data: alertsDashboard,
      message: 'Fermentation alerts retrieved successfully'
    };

    res.json(response);
  });

  /**
   * Get fermentation statistics
   * GET /api/production/fermentation/statistics
   */
  getFermentationStatistics = asyncHandler(async (req: Request, res: Response) => {
    const { period = 'month' } = req.query;

    // Calculate date range
    let dateFrom: Date;
    const dateTo = new Date();

    switch (period) {
      case 'week':
        dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - 7);
        break;
      case 'month':
        dateFrom = new Date();
        dateFrom.setMonth(dateFrom.getMonth() - 1);
        break;
      case 'quarter':
        dateFrom = new Date();
        dateFrom.setMonth(dateFrom.getMonth() - 3);
        break;
      case 'year':
        dateFrom = new Date();
        dateFrom.setFullYear(dateFrom.getFullYear() - 1);
        break;
      default:
        dateFrom = new Date();
        dateFrom.setMonth(dateFrom.getMonth() - 1);
    }

    const activeSummary = await this.fermentationService.getActiveFermentationSummary();

    const statistics = {
      activeBatches: activeSummary.length,
      averageFermentationDays: activeSummary.length > 0 
        ? activeSummary.reduce((sum, batch) => sum + batch.daysInFermentation, 0) / activeSummary.length 
        : 0,
      temperatureAlerts: activeSummary.reduce((count, batch) => 
        count + batch.alerts.filter(alert => alert.type === 'temperature').length, 0
      ),
      gravityAlerts: activeSummary.reduce((count, batch) => 
        count + batch.alerts.filter(alert => alert.type === 'gravity').length, 0
      ),
      phAlerts: activeSummary.reduce((count, batch) => 
        count + batch.alerts.filter(alert => alert.type === 'ph').length, 0
      ),
      stuckFermentations: activeSummary.filter(batch => 
        batch.alerts.some(alert => alert.message.toLowerCase().includes('stuck'))
      ).length,
      batchesByPhase: activeSummary.reduce((acc, batch) => {
        acc[batch.currentPhase] = (acc[batch.currentPhase] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    const response: ApiResponse<typeof statistics> = {
      success: true,
      data: statistics,
      message: 'Fermentation statistics retrieved successfully'
    };

    res.json(response);
  });

  /**
   * Export fermentation data for a batch
   * GET /api/production/fermentation/batch/:batchId/export
   */
  exportFermentationData = asyncHandler(async (req: Request, res: Response) => {
    const { batchId } = req.params;
    const format = req.query.format as string || 'csv';

    const { logs } = await this.fermentationService.getFermentationLogs(batchId, { limit: 10000 });

    if (format === 'csv') {
      const csvData = this.convertToCSV(logs);
      
      res.set({
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="fermentation-${batchId}.csv"`
      });
      
      res.send(csvData);
    } else if (format === 'json') {
      res.set({
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="fermentation-${batchId}.json"`
      });
      
      res.json(logs);
    } else {
      res.status(400).json({
        success: false,
        error: 'UNSUPPORTED_FORMAT',
        message: 'Supported formats: csv, json'
      });
    }
  });

  /**
   * Helper method to convert logs to CSV
   */
  private convertToCSV(logs: any[]): string {
    if (logs.length === 0) {
      return 'timestamp,temperature,gravity,ph,notes\n';
    }

    const headers = 'timestamp,temperature,gravity,ph,notes\n';
    const rows = logs.map(log => {
      return [
        log.timestamp.toISOString(),
        log.temperature,
        log.gravity || '',
        log.pH || '',
        log.notes ? `"${log.notes.replace(/"/g, '""')}"` : ''
      ].join(',');
    }).join('\n');

    return headers + rows;
  }
}