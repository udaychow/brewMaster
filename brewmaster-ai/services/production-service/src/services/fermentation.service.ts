import { FermentationLog } from '@brewmaster/database';
import prisma from '../config/database';
import {
  CreateFermentationLogRequest,
  FermentationSummary,
  FermentationAlert,
  QueryOptions,
  NotFoundError
} from '../types';

export class FermentationService {
  /**
   * Create a new fermentation log entry
   */
  async createFermentationLog(data: CreateFermentationLogRequest): Promise<FermentationLog> {
    // Verify batch exists
    const batch = await prisma.batch.findUnique({
      where: { id: data.batchId }
    });

    if (!batch) {
      throw new NotFoundError('Batch', data.batchId);
    }

    const log = await prisma.fermentationLog.create({
      data: {
        batchId: data.batchId,
        temperature: data.temperature,
        gravity: data.gravity,
        pH: data.pH,
        notes: data.notes
      }
    });

    return log;
  }

  /**
   * Get fermentation logs for a batch
   */
  async getFermentationLogs(
    batchId: string,
    options: QueryOptions = {}
  ): Promise<{ logs: FermentationLog[]; total: number }> {
    const {
      page = 1,
      limit = 50,
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = options;

    const skip = (page - 1) * limit;

    // Verify batch exists
    const batch = await prisma.batch.findUnique({
      where: { id: batchId }
    });

    if (!batch) {
      throw new NotFoundError('Batch', batchId);
    }

    const [logs, total] = await Promise.all([
      prisma.fermentationLog.findMany({
        where: { batchId },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder }
      }),
      prisma.fermentationLog.count({ where: { batchId } })
    ]);

    return { logs, total };
  }

  /**
   * Get fermentation log by ID
   */
  async getFermentationLogById(id: string): Promise<FermentationLog> {
    const log = await prisma.fermentationLog.findUnique({
      where: { id }
    });

    if (!log) {
      throw new NotFoundError('FermentationLog', id);
    }

    return log;
  }

  /**
   * Update fermentation log
   */
  async updateFermentationLog(
    id: string,
    data: Partial<CreateFermentationLogRequest>
  ): Promise<FermentationLog> {
    const existingLog = await prisma.fermentationLog.findUnique({
      where: { id }
    });

    if (!existingLog) {
      throw new NotFoundError('FermentationLog', id);
    }

    const log = await prisma.fermentationLog.update({
      where: { id },
      data: {
        ...(data.temperature && { temperature: data.temperature }),
        ...(data.gravity !== undefined && { gravity: data.gravity }),
        ...(data.pH !== undefined && { pH: data.pH }),
        ...(data.notes !== undefined && { notes: data.notes })
      }
    });

    return log;
  }

  /**
   * Delete fermentation log
   */
  async deleteFermentationLog(id: string): Promise<void> {
    const log = await prisma.fermentationLog.findUnique({
      where: { id }
    });

    if (!log) {
      throw new NotFoundError('FermentationLog', id);
    }

    await prisma.fermentationLog.delete({
      where: { id }
    });
  }

  /**
   * Get fermentation summary for active batches
   */
  async getActiveFermentationSummary(): Promise<FermentationSummary[]> {
    const activeBatches = await prisma.batch.findMany({
      where: {
        status: {
          in: ['FERMENTING', 'CONDITIONING']
        }
      },
      include: {
        recipe: true,
        fermentationLogs: {
          orderBy: { timestamp: 'desc' },
          take: 1
        }
      }
    });

    const summaries: FermentationSummary[] = await Promise.all(
      activeBatches.map(async (batch) => {
        const daysInFermentation = this.calculateDaysInFermentation(
          batch.brewDate || batch.createdAt
        );

        const currentLog = batch.fermentationLogs[0];
        const alerts = await this.generateFermentationAlerts(batch.id);

        // Estimate completion based on recipe estimated days
        const estimatedCompletion = new Date(batch.brewDate || batch.createdAt);
        estimatedCompletion.setDate(
          estimatedCompletion.getDate() + batch.recipe.estimatedDays
        );

        return {
          batchId: batch.id,
          batchNumber: batch.batchNumber,
          recipe: batch.recipe.name,
          currentPhase: batch.status === 'FERMENTING' ? 'primary' : 'conditioning',
          daysInFermentation,
          currentTemperature: currentLog?.temperature || 0,
          currentGravity: currentLog?.gravity,
          targetGravity: batch.recipe.targetABV * 0.75, // Approximate target based on ABV
          estimatedCompletion,
          alerts
        };
      })
    );

    return summaries;
  }

  /**
   * Generate fermentation alerts for a batch
   */
  async generateFermentationAlerts(batchId: string): Promise<FermentationAlert[]> {
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        recipe: true,
        fermentationLogs: {
          orderBy: { timestamp: 'desc' },
          take: 10
        }
      }
    });

    if (!batch) {
      return [];
    }

    const alerts: FermentationAlert[] = [];
    const latestLog = batch.fermentationLogs[0];

    if (!latestLog) {
      alerts.push({
        type: 'temperature',
        severity: 'warning',
        message: 'No fermentation data recorded yet',
        timestamp: new Date()
      });
      return alerts;
    }

    // Temperature alerts
    const targetTemp = batch.recipe.fermentationTemp;
    const tempDifference = Math.abs(latestLog.temperature - targetTemp);

    if (tempDifference > 3) {
      alerts.push({
        type: 'temperature',
        severity: 'critical',
        message: `Temperature deviation: ${latestLog.temperature}°F (target: ${targetTemp}°F)`,
        timestamp: latestLog.timestamp
      });
    } else if (tempDifference > 1.5) {
      alerts.push({
        type: 'temperature',
        severity: 'warning',
        message: `Temperature slightly off: ${latestLog.temperature}°F (target: ${targetTemp}°F)`,
        timestamp: latestLog.timestamp
      });
    }

    // Gravity alerts (if we have multiple readings)
    if (batch.fermentationLogs.length >= 2) {
      const gravityTrend = this.analyzeGravityTrend(batch.fermentationLogs);
      
      if (gravityTrend === 'stuck') {
        alerts.push({
          type: 'gravity',
          severity: 'critical',
          message: 'Fermentation appears to be stuck - gravity unchanged for 3+ days',
          timestamp: latestLog.timestamp
        });
      } else if (gravityTrend === 'slow') {
        alerts.push({
          type: 'gravity',
          severity: 'warning',
          message: 'Slow fermentation progress detected',
          timestamp: latestLog.timestamp
        });
      }
    }

    // pH alerts
    if (latestLog.pH) {
      if (latestLog.pH < 3.8) {
        alerts.push({
          type: 'ph',
          severity: 'warning',
          message: `Low pH detected: ${latestLog.pH} (may affect yeast health)`,
          timestamp: latestLog.timestamp
        });
      } else if (latestLog.pH > 4.6) {
        alerts.push({
          type: 'ph',
          severity: 'warning',
          message: `High pH detected: ${latestLog.pH} (infection risk)`,
          timestamp: latestLog.timestamp
        });
      }
    }

    // Time-based alerts
    const daysInFermentation = this.calculateDaysInFermentation(
      batch.brewDate || batch.createdAt
    );
    
    if (daysInFermentation > batch.recipe.estimatedDays + 3) {
      alerts.push({
        type: 'time',
        severity: 'info',
        message: `Fermentation longer than expected: ${daysInFermentation} days (estimated: ${batch.recipe.estimatedDays} days)`,
        timestamp: new Date()
      });
    }

    return alerts;
  }

  /**
   * Get fermentation trends for a batch
   */
  async getFermentationTrends(batchId: string): Promise<{
    temperatureTrend: { timestamp: Date; value: number }[];
    gravityTrend: { timestamp: Date; value: number }[];
    phTrend: { timestamp: Date; value: number }[];
  }> {
    const logs = await prisma.fermentationLog.findMany({
      where: { batchId },
      orderBy: { timestamp: 'asc' }
    });

    return {
      temperatureTrend: logs.map(log => ({
        timestamp: log.timestamp,
        value: log.temperature
      })),
      gravityTrend: logs
        .filter(log => log.gravity !== null)
        .map(log => ({
          timestamp: log.timestamp,
          value: log.gravity!
        })),
      phTrend: logs
        .filter(log => log.pH !== null)
        .map(log => ({
          timestamp: log.timestamp,
          value: log.pH!
        }))
    };
  }

  /**
   * Calculate days in fermentation
   */
  private calculateDaysInFermentation(startDate: Date): number {
    const now = new Date();
    const start = new Date(startDate);
    const diffTime = Math.abs(now.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Analyze gravity trend to detect stuck or slow fermentation
   */
  private analyzeGravityTrend(logs: FermentationLog[]): 'normal' | 'slow' | 'stuck' {
    const gravityLogs = logs
      .filter(log => log.gravity !== null)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    if (gravityLogs.length < 2) {
      return 'normal';
    }

    // Check for stuck fermentation (no change in 3+ days)
    const latest = gravityLogs[gravityLogs.length - 1];
    const threeDaysAgo = new Date(latest.timestamp);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const recentLogs = gravityLogs.filter(log => log.timestamp >= threeDaysAgo);
    
    if (recentLogs.length >= 2) {
      const gravityVariation = Math.abs(
        recentLogs[recentLogs.length - 1].gravity! - recentLogs[0].gravity!
      );
      
      if (gravityVariation < 0.002) {
        return 'stuck';
      }
    }

    // Check for slow fermentation (less than expected gravity drop per day)
    if (gravityLogs.length >= 3) {
      const firstLog = gravityLogs[0];
      const lastLog = gravityLogs[gravityLogs.length - 1];
      const daysDiff = (lastLog.timestamp.getTime() - firstLog.timestamp.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysDiff > 1) {
        const gravityDrop = firstLog.gravity! - lastLog.gravity!;
        const dropPerDay = gravityDrop / daysDiff;
        
        // Expected drop is about 0.010-0.020 per day for normal fermentation
        if (dropPerDay < 0.005) {
          return 'slow';
        }
      }
    }

    return 'normal';
  }

  /**
   * Get fermentation efficiency for a batch
   */
  async getFermentationEfficiency(batchId: string): Promise<{
    apparentAttenuation: number | null;
    realAttenuation: number | null;
    efficiency: 'high' | 'normal' | 'low' | 'unknown';
  }> {
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        fermentationLogs: {
          orderBy: { timestamp: 'asc' }
        }
      }
    });

    if (!batch || !batch.originalGravity) {
      return {
        apparentAttenuation: null,
        realAttenuation: null,
        efficiency: 'unknown'
      };
    }

    const gravityLogs = batch.fermentationLogs.filter(log => log.gravity);
    
    if (gravityLogs.length === 0) {
      return {
        apparentAttenuation: null,
        realAttenuation: null,
        efficiency: 'unknown'
      };
    }

    const finalGravity = gravityLogs[gravityLogs.length - 1].gravity!;
    const originalGravity = batch.originalGravity;

    // Apparent attenuation calculation
    const apparentAttenuation = ((originalGravity - finalGravity) / (originalGravity - 1)) * 100;

    // Real attenuation (simplified calculation)
    const realAttenuation = (0.8114 * (originalGravity - finalGravity) / (originalGravity - 1)) * 100;

    // Determine efficiency
    let efficiency: 'high' | 'normal' | 'low';
    if (apparentAttenuation >= 80) {
      efficiency = 'high';
    } else if (apparentAttenuation >= 65) {
      efficiency = 'normal';
    } else {
      efficiency = 'low';
    }

    return {
      apparentAttenuation: Math.round(apparentAttenuation * 100) / 100,
      realAttenuation: Math.round(realAttenuation * 100) / 100,
      efficiency
    };
  }

  /**
   * Get latest fermentation reading for a batch
   */
  async getLatestReading(batchId: string): Promise<FermentationLog | null> {
    const log = await prisma.fermentationLog.findFirst({
      where: { batchId },
      orderBy: { timestamp: 'desc' }
    });

    return log;
  }

  /**
   * Bulk create fermentation logs (for sensor integration)
   */
  async bulkCreateLogs(logs: CreateFermentationLogRequest[]): Promise<FermentationLog[]> {
    const createdLogs = await prisma.fermentationLog.createMany({
      data: logs
    });

    // Return the created logs (Prisma createMany doesn't return data)
    const batchIds = [...new Set(logs.map(log => log.batchId))];
    const latestTimestamp = new Date(Math.max(...logs.map(log => new Date().getTime())));
    
    const result = await prisma.fermentationLog.findMany({
      where: {
        batchId: { in: batchIds },
        timestamp: { gte: latestTimestamp }
      },
      orderBy: { timestamp: 'desc' }
    });

    return result;
  }
}