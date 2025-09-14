import { Batch, BatchStatus } from '@brewmaster/database';
import prisma from '../config/database';
import {
  CreateBatchRequest,
  UpdateBatchRequest,
  BatchWithDetails,
  BatchFilters,
  QueryOptions,
  NotFoundError,
  ConflictError
} from '../types';

export class BatchService {
  /**
   * Generate unique batch number
   */
  private async generateBatchNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const monthDay = new Date().toISOString().slice(5, 10).replace('-', '');
    
    // Get the count of batches created today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const batchCount = await prisma.batch.count({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    const sequenceNumber = (batchCount + 1).toString().padStart(3, '0');
    return `B${year}${monthDay}${sequenceNumber}`;
  }

  /**
   * Create a new batch
   */
  async createBatch(data: CreateBatchRequest): Promise<BatchWithDetails> {
    // Verify recipe exists
    const recipe = await prisma.recipe.findUnique({
      where: { id: data.recipeId }
    });

    if (!recipe) {
      throw new NotFoundError('Recipe', data.recipeId);
    }

    // Verify brewer exists
    const brewer = await prisma.user.findUnique({
      where: { id: data.brewerId }
    });

    if (!brewer) {
      throw new NotFoundError('User', data.brewerId);
    }

    // Generate unique batch number
    const batchNumber = await this.generateBatchNumber();

    const batch = await prisma.batch.create({
      data: {
        batchNumber,
        recipeId: data.recipeId,
        brewerId: data.brewerId,
        plannedDate: new Date(data.plannedDate),
        volume: data.volume,
        notes: data.notes,
        status: BatchStatus.PLANNED
      },
      include: {
        recipe: true,
        brewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        fermentationLogs: {
          orderBy: { timestamp: 'desc' }
        },
        qualityChecks: {
          include: {
            inspector: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          orderBy: { timestamp: 'desc' }
        }
      }
    });

    return batch;
  }

  /**
   * Get all batches with optional filtering and pagination
   */
  async getBatches(
    filters: BatchFilters = {},
    options: QueryOptions = {}
  ): Promise<{ batches: BatchWithDetails[]; total: number }> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        where.status = { in: filters.status };
      } else {
        where.status = filters.status;
      }
    }

    if (filters.recipeId) {
      where.recipeId = filters.recipeId;
    }

    if (filters.brewerId) {
      where.brewerId = filters.brewerId;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.plannedDate = {};
      if (filters.dateFrom) {
        where.plannedDate.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.plannedDate.lte = new Date(filters.dateTo);
      }
    }

    // Execute queries in parallel
    const [batches, total] = await Promise.all([
      prisma.batch.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          recipe: true,
          brewer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          fermentationLogs: {
            orderBy: { timestamp: 'desc' },
            take: 5 // Only include last 5 logs
          },
          qualityChecks: {
            include: {
              inspector: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            },
            orderBy: { timestamp: 'desc' },
            take: 5 // Only include last 5 checks
          }
        }
      }),
      prisma.batch.count({ where })
    ]);

    return { batches, total };
  }

  /**
   * Get batch by ID
   */
  async getBatchById(id: string): Promise<BatchWithDetails> {
    const batch = await prisma.batch.findUnique({
      where: { id },
      include: {
        recipe: true,
        brewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        fermentationLogs: {
          orderBy: { timestamp: 'desc' }
        },
        qualityChecks: {
          include: {
            inspector: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          orderBy: { timestamp: 'desc' }
        }
      }
    });

    if (!batch) {
      throw new NotFoundError('Batch', id);
    }

    return batch;
  }

  /**
   * Update batch
   */
  async updateBatch(id: string, data: UpdateBatchRequest): Promise<BatchWithDetails> {
    // Check if batch exists
    const existingBatch = await prisma.batch.findUnique({
      where: { id }
    });

    if (!existingBatch) {
      throw new NotFoundError('Batch', id);
    }

    // Validate status transitions
    if (data.status && !this.isValidStatusTransition(existingBatch.status, data.status)) {
      throw new ConflictError(
        `Invalid status transition from ${existingBatch.status} to ${data.status}`
      );
    }

    const batch = await prisma.batch.update({
      where: { id },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.brewDate && { brewDate: new Date(data.brewDate) }),
        ...(data.volume && { volume: data.volume }),
        ...(data.originalGravity && { originalGravity: data.originalGravity }),
        ...(data.finalGravity && { finalGravity: data.finalGravity }),
        ...(data.abv && { abv: data.abv }),
        ...(data.ibu && { ibu: data.ibu }),
        ...(data.notes !== undefined && { notes: data.notes })
      },
      include: {
        recipe: true,
        brewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        fermentationLogs: {
          orderBy: { timestamp: 'desc' }
        },
        qualityChecks: {
          include: {
            inspector: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          orderBy: { timestamp: 'desc' }
        }
      }
    });

    return batch;
  }

  /**
   * Delete batch (only if status is PLANNED or CANCELLED)
   */
  async deleteBatch(id: string): Promise<void> {
    const batch = await prisma.batch.findUnique({
      where: { id }
    });

    if (!batch) {
      throw new NotFoundError('Batch', id);
    }

    if (batch.status !== BatchStatus.PLANNED && batch.status !== BatchStatus.CANCELLED) {
      throw new ConflictError('Can only delete batches that are PLANNED or CANCELLED');
    }

    await prisma.batch.delete({
      where: { id }
    });
  }

  /**
   * Start batch (transition from PLANNED to BREWING)
   */
  async startBatch(id: string): Promise<BatchWithDetails> {
    const batch = await this.getBatchById(id);

    if (batch.status !== BatchStatus.PLANNED) {
      throw new ConflictError('Can only start batches that are PLANNED');
    }

    return await this.updateBatch(id, {
      status: BatchStatus.BREWING,
      brewDate: new Date().toISOString()
    });
  }

  /**
   * Complete batch phase (advance to next status)
   */
  async completePhase(id: string): Promise<BatchWithDetails> {
    const batch = await this.getBatchById(id);
    let nextStatus: BatchStatus;

    switch (batch.status) {
      case BatchStatus.BREWING:
        nextStatus = BatchStatus.FERMENTING;
        break;
      case BatchStatus.FERMENTING:
        nextStatus = BatchStatus.CONDITIONING;
        break;
      case BatchStatus.CONDITIONING:
        nextStatus = BatchStatus.PACKAGING;
        break;
      case BatchStatus.PACKAGING:
        nextStatus = BatchStatus.COMPLETED;
        break;
      default:
        throw new ConflictError(`Cannot complete phase for batch with status ${batch.status}`);
    }

    return await this.updateBatch(id, { status: nextStatus });
  }

  /**
   * Cancel batch
   */
  async cancelBatch(id: string, reason?: string): Promise<BatchWithDetails> {
    const batch = await this.getBatchById(id);

    if (batch.status === BatchStatus.COMPLETED || batch.status === BatchStatus.CANCELLED) {
      throw new ConflictError(`Cannot cancel batch with status ${batch.status}`);
    }

    const notes = reason ? 
      `${batch.notes || ''}\nCancelled: ${reason}`.trim() : 
      batch.notes;

    return await this.updateBatch(id, {
      status: BatchStatus.CANCELLED,
      notes
    });
  }

  /**
   * Calculate ABV from gravities
   */
  calculateABV(originalGravity: number, finalGravity: number): number {
    // Standard ABV calculation: (OG - FG) * 131.25
    return (originalGravity - finalGravity) * 131.25;
  }

  /**
   * Get batch statistics
   */
  async getBatchStatistics(recipeId?: string): Promise<{
    totalBatches: number;
    activeBatches: number;
    completedBatches: number;
    averageVolume: number;
    averageABV: number | null;
    statusDistribution: Record<string, number>;
  }> {
    const where = recipeId ? { recipeId } : {};

    const [batches, statusDistribution] = await Promise.all([
      prisma.batch.findMany({ where }),
      prisma.batch.groupBy({
        by: ['status'],
        where,
        _count: true
      })
    ]);

    const totalBatches = batches.length;
    const activeBatches = batches.filter(b => 
      ['PLANNED', 'BREWING', 'FERMENTING', 'CONDITIONING', 'PACKAGING'].includes(b.status)
    ).length;
    const completedBatches = batches.filter(b => b.status === 'COMPLETED').length;

    const totalVolume = batches.reduce((sum, batch) => sum + batch.volume, 0);
    const averageVolume = totalBatches > 0 ? totalVolume / totalBatches : 0;

    const batchesWithABV = batches.filter(b => b.abv !== null);
    const averageABV = batchesWithABV.length > 0 
      ? batchesWithABV.reduce((sum, batch) => sum + (batch.abv || 0), 0) / batchesWithABV.length
      : null;

    const statusDist = statusDistribution.reduce((acc, item) => {
      acc[item.status] = item._count;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalBatches,
      activeBatches,
      completedBatches,
      averageVolume,
      averageABV,
      statusDistribution: statusDist
    };
  }

  /**
   * Validate status transitions
   */
  private isValidStatusTransition(current: BatchStatus, next: BatchStatus): boolean {
    const validTransitions: Record<BatchStatus, BatchStatus[]> = {
      [BatchStatus.PLANNED]: [BatchStatus.BREWING, BatchStatus.CANCELLED],
      [BatchStatus.BREWING]: [BatchStatus.FERMENTING, BatchStatus.CANCELLED],
      [BatchStatus.FERMENTING]: [BatchStatus.CONDITIONING, BatchStatus.CANCELLED],
      [BatchStatus.CONDITIONING]: [BatchStatus.PACKAGING, BatchStatus.CANCELLED],
      [BatchStatus.PACKAGING]: [BatchStatus.COMPLETED, BatchStatus.CANCELLED],
      [BatchStatus.COMPLETED]: [], // Final state
      [BatchStatus.CANCELLED]: [] // Final state
    };

    return validTransitions[current]?.includes(next) || false;
  }

  /**
   * Get batches by status
   */
  async getBatchesByStatus(status: BatchStatus): Promise<BatchWithDetails[]> {
    const batches = await prisma.batch.findMany({
      where: { status },
      include: {
        recipe: true,
        brewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        fermentationLogs: {
          orderBy: { timestamp: 'desc' },
          take: 1 // Only latest log
        },
        qualityChecks: {
          include: {
            inspector: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          orderBy: { timestamp: 'desc' },
          take: 1 // Only latest check
        }
      },
      orderBy: { plannedDate: 'asc' }
    });

    return batches;
  }
}