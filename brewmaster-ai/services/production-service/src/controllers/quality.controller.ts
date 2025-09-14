import { Request, Response } from 'express';
import { QualityService } from '../services/quality.service';
import { 
  CreateQualityCheckRequest,
  QueryOptions,
  ApiResponse,
  PaginatedResponse
} from '../types';
import { asyncHandler } from '../middleware/error.middleware';

export class QualityController {
  private qualityService: QualityService;

  constructor() {
    this.qualityService = new QualityService();
  }

  /**
   * Create a new quality check
   * POST /api/production/quality
   */
  createQualityCheck = asyncHandler(async (req: Request, res: Response) => {
    const checkData: CreateQualityCheckRequest = req.body;
    
    const check = await this.qualityService.createQualityCheck(checkData);

    const response: ApiResponse<typeof check> = {
      success: true,
      data: check,
      message: 'Quality check created successfully'
    };

    res.status(201).json(response);
  });

  /**
   * Get quality checks for a batch
   * GET /api/production/quality/batch/:batchId
   */
  getQualityChecks = asyncHandler(async (req: Request, res: Response) => {
    const { batchId } = req.params;

    const options: QueryOptions = {
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      sortBy: req.query.sortBy as string || 'timestamp',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc'
    };

    const { checks, total } = await this.qualityService.getQualityChecks(batchId, options);

    const response: PaginatedResponse<typeof checks[0]> = {
      success: true,
      data: checks,
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
   * Get quality check by ID
   * GET /api/production/quality/:id
   */
  getQualityCheckById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const check = await this.qualityService.getQualityCheckById(id);

    const response: ApiResponse<typeof check> = {
      success: true,
      data: check,
      message: 'Quality check retrieved successfully'
    };

    res.json(response);
  });

  /**
   * Update quality check
   * PATCH /api/production/quality/:id
   */
  updateQualityCheck = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    const check = await this.qualityService.updateQualityCheck(id, updateData);

    const response: ApiResponse<typeof check> = {
      success: true,
      data: check,
      message: 'Quality check updated successfully'
    };

    res.json(response);
  });

  /**
   * Delete quality check
   * DELETE /api/production/quality/:id
   */
  deleteQualityCheck = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    await this.qualityService.deleteQualityCheck(id);

    const response: ApiResponse<null> = {
      success: true,
      data: null,
      message: 'Quality check deleted successfully'
    };

    res.json(response);
  });

  /**
   * Get quality metrics for a batch
   * GET /api/production/quality/batch/:batchId/metrics
   */
  getQualityMetrics = asyncHandler(async (req: Request, res: Response) => {
    const { batchId } = req.params;

    const metrics = await this.qualityService.getQualityMetrics(batchId);

    const response: ApiResponse<typeof metrics> = {
      success: true,
      data: metrics,
      message: 'Quality metrics retrieved successfully'
    };

    res.json(response);
  });

  /**
   * Get quality trends
   * GET /api/production/quality/trends
   */
  getQualityTrends = asyncHandler(async (req: Request, res: Response) => {
    const recipeId = req.query.recipeId as string;
    const checkType = req.query.checkType as string;
    const days = req.query.days ? parseInt(req.query.days as string) : 30;

    const trends = await this.qualityService.getQualityTrends(recipeId, checkType, days);

    const response: ApiResponse<typeof trends> = {
      success: true,
      data: trends,
      message: 'Quality trends retrieved successfully'
    };

    res.json(response);
  });

  /**
   * Get quality statistics
   * GET /api/production/quality/statistics
   */
  getQualityStatistics = asyncHandler(async (req: Request, res: Response) => {
    const recipeId = req.query.recipeId as string;

    const statistics = await this.qualityService.getQualityStatistics(recipeId);

    const response: ApiResponse<typeof statistics> = {
      success: true,
      data: statistics,
      message: 'Quality statistics retrieved successfully'
    };

    res.json(response);
  });

  /**
   * Get failed quality checks requiring attention
   * GET /api/production/quality/failed
   */
  getFailedChecks = asyncHandler(async (req: Request, res: Response) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

    const checks = await this.qualityService.getFailedChecks(limit);

    const response: ApiResponse<typeof checks> = {
      success: true,
      data: checks,
      message: 'Failed quality checks retrieved successfully'
    };

    res.json(response);
  });

  /**
   * Perform automated quality check
   * POST /api/production/quality/automated
   */
  performAutomatedQualityCheck = asyncHandler(async (req: Request, res: Response) => {
    const { batchId, inspectorId, sensorData } = req.body;

    if (!batchId || !inspectorId || !sensorData) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'batchId, inspectorId, and sensorData are required'
      });
    }

    const checks = await this.qualityService.performAutomatedQualityCheck(
      batchId,
      inspectorId,
      sensorData
    );

    const response: ApiResponse<typeof checks> = {
      success: true,
      data: checks,
      message: `${checks.length} automated quality checks completed`
    };

    res.status(201).json(response);
  });

  /**
   * Generate quality control checklist for a batch
   * GET /api/production/quality/batch/:batchId/checklist
   */
  generateQualityChecklist = asyncHandler(async (req: Request, res: Response) => {
    const { batchId } = req.params;

    const checklist = await this.qualityService.generateQualityChecklist(batchId);

    const response: ApiResponse<typeof checklist> = {
      success: true,
      data: checklist,
      message: 'Quality control checklist generated successfully'
    };

    res.json(response);
  });

  /**
   * Get quality dashboard
   * GET /api/production/quality/dashboard
   */
  getQualityDashboard = asyncHandler(async (req: Request, res: Response) => {
    const { period = 'week' } = req.query;

    // Calculate date range
    let days: number;
    switch (period) {
      case 'day':
        days = 1;
        break;
      case 'week':
        days = 7;
        break;
      case 'month':
        days = 30;
        break;
      case 'quarter':
        days = 90;
        break;
      default:
        days = 7;
    }

    const [
      statistics,
      trends,
      failedChecks
    ] = await Promise.all([
      this.qualityService.getQualityStatistics(),
      this.qualityService.getQualityTrends(undefined, undefined, days),
      this.qualityService.getFailedChecks(10)
    ]);

    const dashboard = {
      summary: {
        ...statistics,
        period: period as string
      },
      trends: trends.slice(0, 5), // Top 5 trends
      recentFailures: failedChecks,
      alerts: {
        lowPassRate: statistics.passRate < 85,
        highFailureCount: statistics.failedChecks > 5,
        criticalFailures: failedChecks.filter(check => 
          check.checkType.toLowerCase().includes('microbiological') ||
          check.checkType.toLowerCase().includes('contamination')
        ).length
      }
    };

    const response: ApiResponse<typeof dashboard> = {
      success: true,
      data: dashboard,
      message: 'Quality dashboard retrieved successfully'
    };

    res.json(response);
  });

  /**
   * Export quality data for a batch
   * GET /api/production/quality/batch/:batchId/export
   */
  exportQualityData = asyncHandler(async (req: Request, res: Response) => {
    const { batchId } = req.params;
    const format = req.query.format as string || 'csv';

    const { checks } = await this.qualityService.getQualityChecks(batchId, { limit: 10000 });

    if (format === 'csv') {
      const csvData = this.convertToCSV(checks);
      
      res.set({
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="quality-checks-${batchId}.csv"`
      });
      
      res.send(csvData);
    } else if (format === 'json') {
      res.set({
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="quality-checks-${batchId}.json"`
      });
      
      res.json(checks);
    } else if (format === 'pdf') {
      // Generate quality report PDF
      res.status(501).json({
        success: false,
        error: 'NOT_IMPLEMENTED',
        message: 'PDF export not yet implemented'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'UNSUPPORTED_FORMAT',
        message: 'Supported formats: csv, json, pdf'
      });
    }
  });

  /**
   * Get quality check templates
   * GET /api/production/quality/templates
   */
  getQualityCheckTemplates = asyncHandler(async (req: Request, res: Response) => {
    const templates = {
      visual: {
        name: 'Visual Inspection',
        parameters: {
          color: { type: 'text', required: true },
          clarity: { type: 'select', options: ['Clear', 'Hazy', 'Cloudy'], required: true },
          foam: { type: 'select', options: ['Good', 'Fair', 'Poor'], required: true },
          sediment: { type: 'boolean', required: true }
        }
      },
      aroma: {
        name: 'Aroma Assessment',
        parameters: {
          intensity: { type: 'number', min: 1, max: 10, required: true },
          character: { type: 'text', required: true },
          offFlavors: { type: 'boolean', required: true },
          notes: { type: 'textarea', required: false }
        }
      },
      taste: {
        name: 'Taste Test',
        parameters: {
          sweetness: { type: 'number', min: 1, max: 10, required: true },
          bitterness: { type: 'number', min: 1, max: 10, required: true },
          acidity: { type: 'number', min: 1, max: 10, required: true },
          balance: { type: 'number', min: 1, max: 10, required: true },
          finish: { type: 'text', required: true },
          offFlavors: { type: 'boolean', required: true },
          overall: { type: 'number', min: 1, max: 10, required: true }
        }
      },
      gravity: {
        name: 'Gravity Check',
        parameters: {
          specificGravity: { type: 'number', min: 0.990, max: 1.200, required: true },
          temperature: { type: 'number', min: 32, max: 100, required: true },
          correctedGravity: { type: 'number', min: 0.990, max: 1.200, required: false }
        }
      },
      ph: {
        name: 'pH Measurement',
        parameters: {
          pH: { type: 'number', min: 3.0, max: 5.0, required: true },
          temperature: { type: 'number', min: 32, max: 100, required: true }
        }
      },
      microbiological: {
        name: 'Microbiological Check',
        parameters: {
          wildYeast: { type: 'boolean', required: true },
          bacteria: { type: 'boolean', required: true },
          contamination: { type: 'boolean', required: true },
          platingMethod: { type: 'text', required: true },
          incubationDays: { type: 'number', min: 1, max: 14, required: true }
        }
      }
    };

    const response: ApiResponse<typeof templates> = {
      success: true,
      data: templates,
      message: 'Quality check templates retrieved successfully'
    };

    res.json(response);
  });

  /**
   * Create quality check from template
   * POST /api/production/quality/from-template
   */
  createFromTemplate = asyncHandler(async (req: Request, res: Response) => {
    const { template, batchId, inspectorId, parameters } = req.body;

    if (!template || !batchId || !inspectorId || !parameters) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'template, batchId, inspectorId, and parameters are required'
      });
    }

    // Validate parameters based on template (simplified validation)
    let passed = true;
    let notes = '';

    switch (template) {
      case 'visual':
        passed = parameters.clarity === 'Clear' && !parameters.sediment;
        break;
      case 'gravity':
        // Add gravity validation logic
        passed = parameters.specificGravity >= 0.990 && parameters.specificGravity <= 1.200;
        break;
      case 'ph':
        passed = parameters.pH >= 3.8 && parameters.pH <= 4.6;
        break;
      case 'microbiological':
        passed = !parameters.wildYeast && !parameters.bacteria && !parameters.contamination;
        break;
      default:
        passed = true; // Default pass for unknown templates
    }

    const checkData: CreateQualityCheckRequest = {
      batchId,
      inspectorId,
      checkType: template,
      passed,
      parameters,
      notes
    };

    const check = await this.qualityService.createQualityCheck(checkData);

    const response: ApiResponse<typeof check> = {
      success: true,
      data: check,
      message: `Quality check created from ${template} template`
    };

    res.status(201).json(response);
  });

  /**
   * Helper method to convert checks to CSV
   */
  private convertToCSV(checks: any[]): string {
    if (checks.length === 0) {
      return 'timestamp,checkType,passed,inspector,notes\n';
    }

    const headers = 'timestamp,checkType,passed,inspector,notes,parameters\n';
    const rows = checks.map(check => {
      const inspector = check.inspector ? 
        `${check.inspector.firstName} ${check.inspector.lastName}` : 
        'Unknown';
      
      return [
        check.timestamp.toISOString(),
        check.checkType,
        check.passed ? 'Pass' : 'Fail',
        inspector,
        check.notes ? `"${check.notes.replace(/"/g, '""')}"` : '',
        JSON.stringify(check.parameters).replace(/"/g, '""')
      ].join(',');
    }).join('\n');

    return headers + rows;
  }
}