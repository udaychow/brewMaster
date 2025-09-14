import { Batch, BatchStatus } from '@brewmaster/database';
import prisma from '../config/database';
import {
  ProductionScheduleItem,
  ScheduleConflict,
  NotFoundError,
  ConflictError
} from '../types';

export class SchedulingService {
  /**
   * Get production schedule for a date range
   */
  async getProductionSchedule(
    startDate: Date,
    endDate: Date,
    brewerId?: string
  ): Promise<ProductionScheduleItem[]> {
    const where: any = {
      plannedDate: {
        gte: startDate,
        lte: endDate
      },
      status: {
        in: [BatchStatus.PLANNED, BatchStatus.BREWING, BatchStatus.FERMENTING]
      }
    };

    if (brewerId) {
      where.brewerId = brewerId;
    }

    const batches = await prisma.batch.findMany({
      where,
      include: {
        recipe: true,
        brewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { plannedDate: 'asc' }
    });

    const scheduleItems: ProductionScheduleItem[] = batches.map(batch => {
      const status = this.getBatchScheduleStatus(batch);
      const priority = this.calculatePriority(batch);
      const estimatedDuration = this.estimateBatchDuration(batch);

      return {
        id: `batch-${batch.id}`,
        batchId: batch.id,
        recipeId: batch.recipeId,
        recipeName: batch.recipe.name,
        scheduledDate: batch.plannedDate,
        estimatedDuration,
        status,
        priority,
        assignedBrewer: {
          id: batch.brewer.id,
          name: `${batch.brewer.firstName} ${batch.brewer.lastName}`
        }
      };
    });

    return scheduleItems;
  }

  /**
   * Schedule a new batch
   */
  async scheduleBatch(
    recipeId: string,
    brewerId: string,
    preferredDate: Date,
    volume: number
  ): Promise<{ batch: Batch; conflicts: ScheduleConflict[] }> {
    // Check for conflicts
    const conflicts = await this.checkScheduleConflicts(preferredDate, brewerId);
    
    // Find optimal date if conflicts exist
    let scheduledDate = preferredDate;
    if (conflicts.length > 0) {
      scheduledDate = await this.findOptimalScheduleDate(
        preferredDate,
        brewerId,
        7 // Look within 7 days
      );
    }

    // Create the batch (from batch service would be better, but for completeness)
    const batchNumber = await this.generateBatchNumber();
    
    const batch = await prisma.batch.create({
      data: {
        batchNumber,
        recipeId,
        brewerId,
        plannedDate: scheduledDate,
        volume,
        status: BatchStatus.PLANNED
      }
    });

    return { batch, conflicts };
  }

  /**
   * Reschedule a batch
   */
  async rescheduleBatch(
    batchId: string,
    newDate: Date,
    reason?: string
  ): Promise<{ batch: Batch; conflicts: ScheduleConflict[] }> {
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: { brewer: true }
    });

    if (!batch) {
      throw new NotFoundError('Batch', batchId);
    }

    if (batch.status !== BatchStatus.PLANNED) {
      throw new ConflictError('Can only reschedule PLANNED batches');
    }

    // Check for conflicts at new date
    const conflicts = await this.checkScheduleConflicts(newDate, batch.brewerId);

    // Update batch with new date and reason
    const notes = reason ? 
      `${batch.notes || ''}\nRescheduled to ${newDate.toDateString()}: ${reason}`.trim() :
      batch.notes;

    const updatedBatch = await prisma.batch.update({
      where: { id: batchId },
      data: {
        plannedDate: newDate,
        notes
      }
    });

    return { batch: updatedBatch, conflicts };
  }

  /**
   * Get brewing capacity for a date
   */
  async getBrewingCapacity(date: Date): Promise<{
    totalCapacity: number;
    usedCapacity: number;
    availableCapacity: number;
    scheduledBatches: number;
    brewers: {
      id: string;
      name: string;
      scheduledBatches: number;
      capacity: number;
    }[];
  }> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get scheduled batches for the date
    const scheduledBatches = await prisma.batch.findMany({
      where: {
        plannedDate: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: {
          in: [BatchStatus.PLANNED, BatchStatus.BREWING]
        }
      },
      include: {
        brewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Get all active brewers
    const brewers = await prisma.user.findMany({
      where: {
        role: {
          in: ['BREWER', 'MANAGER']
        },
        isActive: true
      }
    });

    // Calculate capacity (assuming each brewer can handle 2 batches per day max)
    const brewerCapacity = 2;
    const totalCapacity = brewers.length * brewerCapacity;
    const usedCapacity = scheduledBatches.length;
    const availableCapacity = totalCapacity - usedCapacity;

    // Group batches by brewer
    const batchesByBrewer = scheduledBatches.reduce((acc, batch) => {
      if (!acc[batch.brewerId]) {
        acc[batch.brewerId] = [];
      }
      acc[batch.brewerId].push(batch);
      return acc;
    }, {} as Record<string, typeof scheduledBatches>);

    const brewerStats = brewers.map(brewer => ({
      id: brewer.id,
      name: `${brewer.firstName} ${brewer.lastName}`,
      scheduledBatches: batchesByBrewer[brewer.id]?.length || 0,
      capacity: brewerCapacity
    }));

    return {
      totalCapacity,
      usedCapacity,
      availableCapacity,
      scheduledBatches: scheduledBatches.length,
      brewers: brewerStats
    };
  }

  /**
   * Get schedule conflicts for a date and brewer
   */
  async checkScheduleConflicts(
    date: Date,
    brewerId: string
  ): Promise<ScheduleConflict[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Check brewer's existing batches on this date
    const brewerBatches = await prisma.batch.findMany({
      where: {
        brewerId,
        plannedDate: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: {
          in: [BatchStatus.PLANNED, BatchStatus.BREWING, BatchStatus.FERMENTING]
        }
      }
    });

    const conflicts: ScheduleConflict[] = [];

    if (brewerBatches.length >= 2) { // Max 2 batches per brewer per day
      conflicts.push({
        date,
        conflicts: [{
          batch1: 'new-batch',
          batch2: brewerBatches[0].id,
          reason: `Brewer has ${brewerBatches.length} batches already scheduled`
        }]
      });
    }

    return conflicts;
  }

  /**
   * Find optimal schedule date
   */
  async findOptimalScheduleDate(
    preferredDate: Date,
    brewerId: string,
    daysToLook: number = 7
  ): Promise<Date> {
    for (let i = 0; i <= daysToLook; i++) {
      const testDate = new Date(preferredDate);
      testDate.setDate(testDate.getDate() + i);

      const conflicts = await this.checkScheduleConflicts(testDate, brewerId);
      if (conflicts.length === 0) {
        return testDate;
      }
    }

    // If no optimal date found, return original date + daysToLook
    const fallbackDate = new Date(preferredDate);
    fallbackDate.setDate(fallbackDate.getDate() + daysToLook);
    return fallbackDate;
  }

  /**
   * Get production timeline for a batch
   */
  async getBatchTimeline(batchId: string): Promise<{
    phases: {
      name: string;
      startDate: Date;
      endDate: Date;
      status: 'completed' | 'in_progress' | 'pending';
      duration: number;
    }[];
    totalDuration: number;
    completionDate: Date;
  }> {
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: { recipe: true }
    });

    if (!batch) {
      throw new NotFoundError('Batch', batchId);
    }

    const phases = [
      {
        name: 'Brewing',
        duration: 8, // hours
        status: batch.status
      },
      {
        name: 'Primary Fermentation',
        duration: batch.recipe.estimatedDays * 24 * 0.7, // 70% of total time
        status: batch.status
      },
      {
        name: 'Secondary Fermentation',
        duration: batch.recipe.estimatedDays * 24 * 0.2, // 20% of total time
        status: batch.status
      },
      {
        name: 'Conditioning',
        duration: batch.recipe.estimatedDays * 24 * 0.1, // 10% of total time
        status: batch.status
      },
      {
        name: 'Packaging',
        duration: 4, // hours
        status: batch.status
      }
    ];

    let currentDate = new Date(batch.brewDate || batch.plannedDate);
    const timeline = phases.map((phase, index) => {
      const startDate = new Date(currentDate);
      const endDate = new Date(currentDate.getTime() + phase.duration * 60 * 60 * 1000);
      
      // Determine phase status
      let phaseStatus: 'completed' | 'in_progress' | 'pending';
      if (index === 0 && batch.status === BatchStatus.BREWING) {
        phaseStatus = 'in_progress';
      } else if (index <= this.getPhaseIndex(batch.status)) {
        phaseStatus = 'completed';
      } else if (index === this.getPhaseIndex(batch.status) + 1) {
        phaseStatus = 'in_progress';
      } else {
        phaseStatus = 'pending';
      }

      currentDate = endDate;

      return {
        name: phase.name,
        startDate,
        endDate,
        status: phaseStatus,
        duration: phase.duration
      };
    });

    const totalDuration = phases.reduce((sum, phase) => sum + phase.duration, 0);
    const completionDate = new Date(
      (batch.brewDate || batch.plannedDate).getTime() + totalDuration * 60 * 60 * 1000
    );

    return {
      phases: timeline,
      totalDuration,
      completionDate
    };
  }

  /**
   * Get weekly production summary
   */
  async getWeeklyProductionSummary(weekStart: Date): Promise<{
    totalBatches: number;
    batchesByStatus: Record<string, number>;
    volumeByDay: { date: Date; volume: number }[];
    brewerWorkload: { brewerId: string; name: string; batchCount: number }[];
  }> {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const batches = await prisma.batch.findMany({
      where: {
        plannedDate: {
          gte: weekStart,
          lt: weekEnd
        }
      },
      include: {
        brewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    const totalBatches = batches.length;

    // Group by status
    const batchesByStatus = batches.reduce((acc, batch) => {
      acc[batch.status] = (acc[batch.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Volume by day
    const volumeByDay: { date: Date; volume: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      
      const dayBatches = batches.filter(batch => 
        batch.plannedDate.toDateString() === date.toDateString()
      );
      
      const volume = dayBatches.reduce((sum, batch) => sum + batch.volume, 0);
      
      volumeByDay.push({ date, volume });
    }

    // Brewer workload
    const brewerWorkload = Object.values(
      batches.reduce((acc, batch) => {
        const brewerId = batch.brewerId;
        if (!acc[brewerId]) {
          acc[brewerId] = {
            brewerId,
            name: `${batch.brewer.firstName} ${batch.brewer.lastName}`,
            batchCount: 0
          };
        }
        acc[brewerId].batchCount++;
        return acc;
      }, {} as Record<string, { brewerId: string; name: string; batchCount: number }>)
    );

    return {
      totalBatches,
      batchesByStatus,
      volumeByDay,
      brewerWorkload
    };
  }

  /**
   * Helper methods
   */
  private getBatchScheduleStatus(batch: Batch): 'scheduled' | 'in_progress' | 'completed' | 'delayed' {
    const now = new Date();
    
    switch (batch.status) {
      case BatchStatus.COMPLETED:
        return 'completed';
      case BatchStatus.BREWING:
      case BatchStatus.FERMENTING:
      case BatchStatus.CONDITIONING:
      case BatchStatus.PACKAGING:
        return 'in_progress';
      case BatchStatus.PLANNED:
        // Check if delayed
        if (batch.plannedDate < now) {
          return 'delayed';
        }
        return 'scheduled';
      default:
        return 'scheduled';
    }
  }

  private calculatePriority(batch: Batch): number {
    const now = new Date();
    const daysUntilPlanned = Math.ceil(
      (batch.plannedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Higher priority for batches that are overdue or due soon
    if (daysUntilPlanned < 0) return 10; // Overdue
    if (daysUntilPlanned <= 1) return 8; // Due today/tomorrow
    if (daysUntilPlanned <= 3) return 6; // Due this week
    return Math.max(1, 5 - Math.floor(daysUntilPlanned / 7)); // Lower priority for future batches
  }

  private estimateBatchDuration(batch: Batch): number {
    // Estimate total duration in hours
    // Brewing (8h) + Fermentation + Conditioning + Packaging (4h)
    const fermentationHours = batch.recipe ? batch.recipe.estimatedDays * 24 : 168; // Default 7 days
    return 8 + fermentationHours + 4;
  }

  private getPhaseIndex(status: BatchStatus): number {
    switch (status) {
      case BatchStatus.PLANNED: return -1;
      case BatchStatus.BREWING: return 0;
      case BatchStatus.FERMENTING: return 1;
      case BatchStatus.CONDITIONING: return 2;
      case BatchStatus.PACKAGING: return 3;
      case BatchStatus.COMPLETED: return 4;
      default: return -1;
    }
  }

  private async generateBatchNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const monthDay = new Date().toISOString().slice(5, 10).replace('-', '');
    
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
}