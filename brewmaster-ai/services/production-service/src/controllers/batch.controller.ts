import { Request, Response } from 'express';
import { BatchService } from '../services/batch.service';
import { SchedulingService } from '../services/scheduling.service';
import { 
  CreateBatchRequest,
  UpdateBatchRequest,
  BatchFilters,
  QueryOptions,
  ApiResponse,
  PaginatedResponse
} from '../types';
import { asyncHandler } from '../middleware/error.middleware';

export class BatchController {
  private batchService: BatchService;
  private schedulingService: SchedulingService;

  constructor() {
    this.batchService = new BatchService();
    this.schedulingService = new SchedulingService();
  }

  /**
   * Create a new batch
   * POST /api/production/batches
   */
  createBatch = asyncHandler(async (req: Request, res: Response) => {
    const batchData: CreateBatchRequest = req.body;
    
    const batch = await this.batchService.createBatch(batchData);

    const response: ApiResponse<typeof batch> = {
      success: true,
      data: batch,
      message: 'Batch created successfully'
    };

    res.status(201).json(response);
  });

  /**
   * Get all batches with filtering and pagination
   * GET /api/production/batches
   */
  getBatches = asyncHandler(async (req: Request, res: Response) => {
    const filters: BatchFilters = {
      status: req.query.status as any,
      recipeId: req.query.recipeId as string,
      brewerId: req.query.brewerId as string,
      dateFrom: req.query.dateFrom as string,
      dateTo: req.query.dateTo as string
    };

    const options: QueryOptions = {
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      sortBy: req.query.sortBy as string || 'createdAt',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc'
    };

    const { batches, total } = await this.batchService.getBatches(filters, options);

    const response: PaginatedResponse<typeof batches[0]> = {
      success: true,
      data: batches,
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
   * Get batch by ID
   * GET /api/production/batches/:id
   */
  getBatchById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const batch = await this.batchService.getBatchById(id);

    const response: ApiResponse<typeof batch> = {
      success: true,
      data: batch,
      message: 'Batch retrieved successfully'
    };

    res.json(response);
  });

  /**
   * Update batch
   * PATCH /api/production/batches/:id
   */
  updateBatch = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData: UpdateBatchRequest = req.body;

    const batch = await this.batchService.updateBatch(id, updateData);

    const response: ApiResponse<typeof batch> = {
      success: true,
      data: batch,
      message: 'Batch updated successfully'
    };

    res.json(response);
  });

  /**
   * Delete batch
   * DELETE /api/production/batches/:id
   */
  deleteBatch = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    await this.batchService.deleteBatch(id);

    const response: ApiResponse<null> = {
      success: true,
      data: null,
      message: 'Batch deleted successfully'
    };

    res.json(response);
  });

  /**
   * Start batch (transition from PLANNED to BREWING)
   * POST /api/production/batches/:id/start
   */
  startBatch = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const batch = await this.batchService.startBatch(id);

    const response: ApiResponse<typeof batch> = {
      success: true,
      data: batch,
      message: 'Batch started successfully'
    };

    res.json(response);
  });

  /**
   * Complete current batch phase
   * POST /api/production/batches/:id/complete-phase
   */
  completePhase = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const batch = await this.batchService.completePhase(id);

    const response: ApiResponse<typeof batch> = {
      success: true,
      data: batch,
      message: `Batch phase completed. Status updated to ${batch.status}`
    };

    res.json(response);
  });

  /**
   * Cancel batch
   * POST /api/production/batches/:id/cancel
   */
  cancelBatch = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;

    const batch = await this.batchService.cancelBatch(id, reason);

    const response: ApiResponse<typeof batch> = {
      success: true,
      data: batch,
      message: 'Batch cancelled successfully'
    };

    res.json(response);
  });

  /**
   * Get batches by status
   * GET /api/production/batches/status/:status
   */
  getBatchesByStatus = asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.params;

    const batches = await this.batchService.getBatchesByStatus(status as any);

    const response: ApiResponse<typeof batches> = {
      success: true,
      data: batches,
      message: `Batches with status ${status} retrieved successfully`
    };

    res.json(response);
  });

  /**
   * Get batch statistics
   * GET /api/production/batches/statistics
   */
  getBatchStatistics = asyncHandler(async (req: Request, res: Response) => {
    const recipeId = req.query.recipeId as string;

    const statistics = await this.batchService.getBatchStatistics(recipeId);

    const response: ApiResponse<typeof statistics> = {
      success: true,
      data: statistics,
      message: 'Batch statistics retrieved successfully'
    };

    res.json(response);
  });

  /**
   * Calculate ABV from gravities
   * POST /api/production/batches/calculate-abv
   */
  calculateABV = asyncHandler(async (req: Request, res: Response) => {
    const { originalGravity, finalGravity } = req.body;

    if (!originalGravity || !finalGravity) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Original gravity and final gravity are required'
      });
    }

    const abv = this.batchService.calculateABV(originalGravity, finalGravity);

    const response: ApiResponse<{ abv: number; originalGravity: number; finalGravity: number }> = {
      success: true,
      data: { abv, originalGravity, finalGravity },
      message: 'ABV calculated successfully'
    };

    res.json(response);
  });

  /**
   * Get batch timeline
   * GET /api/production/batches/:id/timeline
   */
  getBatchTimeline = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const timeline = await this.schedulingService.getBatchTimeline(id);

    const response: ApiResponse<typeof timeline> = {
      success: true,
      data: timeline,
      message: 'Batch timeline retrieved successfully'
    };

    res.json(response);
  });

  /**
   * Get active batches dashboard
   * GET /api/production/batches/dashboard/active
   */
  getActiveBatchesDashboard = asyncHandler(async (req: Request, res: Response) => {
    const activeBatches = await this.batchService.getBatchesByStatus('BREWING' as any);
    const fermentingBatches = await this.batchService.getBatchesByStatus('FERMENTING' as any);
    const conditioningBatches = await this.batchService.getBatchesByStatus('CONDITIONING' as any);
    const packagingBatches = await this.batchService.getBatchesByStatus('PACKAGING' as any);

    const dashboard = {
      brewing: {
        count: activeBatches.length,
        batches: activeBatches.slice(0, 5) // Latest 5
      },
      fermenting: {
        count: fermentingBatches.length,
        batches: fermentingBatches.slice(0, 5)
      },
      conditioning: {
        count: conditioningBatches.length,
        batches: conditioningBatches.slice(0, 5)
      },
      packaging: {
        count: packagingBatches.length,
        batches: packagingBatches.slice(0, 5)
      },
      totalActive: activeBatches.length + fermentingBatches.length + conditioningBatches.length + packagingBatches.length
    };

    const response: ApiResponse<typeof dashboard> = {
      success: true,
      data: dashboard,
      message: 'Active batches dashboard retrieved successfully'
    };

    res.json(response);
  });

  /**
   * Get batch production summary
   * GET /api/production/batches/summary
   */
  getBatchSummary = asyncHandler(async (req: Request, res: Response) => {
    const { period = 'week', recipeId } = req.query;

    let dateFrom: Date;
    const dateTo = new Date();

    switch (period) {
      case 'day':
        dateFrom = new Date();
        dateFrom.setHours(0, 0, 0, 0);
        break;
      case 'week':
        dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - 7);
        break;
      case 'month':
        dateFrom = new Date();
        dateFrom.setMonth(dateFrom.getMonth() - 1);
        break;
      case 'year':
        dateFrom = new Date();
        dateFrom.setFullYear(dateFrom.getFullYear() - 1);
        break;
      default:
        dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - 7);
    }

    const filters: BatchFilters = {
      dateFrom: dateFrom.toISOString(),
      dateTo: dateTo.toISOString()
    };

    if (recipeId) {
      filters.recipeId = recipeId as string;
    }

    const { batches } = await this.batchService.getBatches(filters, { limit: 1000 });

    // Calculate summary metrics
    const summary = {
      totalBatches: batches.length,
      totalVolume: batches.reduce((sum, batch) => sum + batch.volume, 0),
      averageVolume: batches.length > 0 ? batches.reduce((sum, batch) => sum + batch.volume, 0) / batches.length : 0,
      statusBreakdown: batches.reduce((acc, batch) => {
        acc[batch.status] = (acc[batch.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      topRecipes: this.getTopRecipes(batches, 5),
      topBrewers: this.getTopBrewers(batches, 5)
    };

    const response: ApiResponse<typeof summary> = {
      success: true,
      data: summary,
      message: 'Batch summary retrieved successfully'
    };

    res.json(response);
  });

  /**
   * Get overdue batches
   * GET /api/production/batches/overdue
   */
  getOverdueBatches = asyncHandler(async (req: Request, res: Response) => {
    const now = new Date();
    
    const filters: BatchFilters = {
      dateTo: now.toISOString(),
      status: ['PLANNED', 'BREWING', 'FERMENTING', 'CONDITIONING', 'PACKAGING']
    };

    const { batches } = await this.batchService.getBatches(filters, { limit: 100 });

    // Filter for truly overdue batches based on expected completion
    const overdueBatches = batches.filter(batch => {
      if (batch.status === 'PLANNED' && batch.plannedDate < now) {
        return true;
      }
      
      // More complex logic would check against expected durations
      const expectedDuration = batch.recipe.estimatedDays * 24 * 60 * 60 * 1000; // Convert to milliseconds
      const startDate = batch.brewDate || batch.plannedDate;
      const expectedCompletion = new Date(startDate.getTime() + expectedDuration);
      
      return expectedCompletion < now && batch.status !== 'COMPLETED';
    });

    const response: ApiResponse<typeof overdueBatches> = {
      success: true,
      data: overdueBatches,
      message: 'Overdue batches retrieved successfully'
    };

    res.json(response);
  });

  /**
   * Schedule a batch using scheduling service
   * POST /api/production/batches/schedule
   */
  scheduleBatch = asyncHandler(async (req: Request, res: Response) => {
    const { recipeId, brewerId, preferredDate, volume } = req.body;

    const { batch, conflicts } = await this.schedulingService.scheduleBatch(
      recipeId,
      brewerId,
      new Date(preferredDate),
      volume
    );

    const response: ApiResponse<{ batch: typeof batch; conflicts: typeof conflicts }> = {
      success: true,
      data: { batch, conflicts },
      message: conflicts.length > 0 
        ? 'Batch scheduled with conflicts detected' 
        : 'Batch scheduled successfully'
    };

    res.status(201).json(response);
  });

  /**
   * Reschedule a batch
   * PATCH /api/production/batches/:id/reschedule
   */
  rescheduleBatch = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { newDate, reason } = req.body;

    const { batch, conflicts } = await this.schedulingService.rescheduleBatch(
      id,
      new Date(newDate),
      reason
    );

    const response: ApiResponse<{ batch: typeof batch; conflicts: typeof conflicts }> = {
      success: true,
      data: { batch, conflicts },
      message: conflicts.length > 0 
        ? 'Batch rescheduled with conflicts detected' 
        : 'Batch rescheduled successfully'
    };

    res.json(response);
  });

  /**
   * Helper methods
   */
  private getTopRecipes(batches: any[], limit: number) {
    const recipeCounts = batches.reduce((acc, batch) => {
      const recipeName = batch.recipe.name;
      acc[recipeName] = (acc[recipeName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(recipeCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([name, count]) => ({ name, count }));
  }

  private getTopBrewers(batches: any[], limit: number) {
    const brewerCounts = batches.reduce((acc, batch) => {
      const brewerName = `${batch.brewer.firstName} ${batch.brewer.lastName}`;
      acc[brewerName] = (acc[brewerName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(brewerCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([name, count]) => ({ name, count }));
  }
}