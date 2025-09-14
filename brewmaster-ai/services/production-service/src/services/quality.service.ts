import { QualityCheck } from '@brewmaster/database';
import prisma from '../config/database';
import {
  CreateQualityCheckRequest,
  QualityMetrics,
  QualityTrend,
  QueryOptions,
  NotFoundError
} from '../types';

export class QualityService {
  /**
   * Create a new quality check
   */
  async createQualityCheck(data: CreateQualityCheckRequest): Promise<QualityCheck> {
    // Verify batch exists
    const batch = await prisma.batch.findUnique({
      where: { id: data.batchId }
    });

    if (!batch) {
      throw new NotFoundError('Batch', data.batchId);
    }

    // Verify inspector exists
    const inspector = await prisma.user.findUnique({
      where: { id: data.inspectorId }
    });

    if (!inspector) {
      throw new NotFoundError('User', data.inspectorId);
    }

    const qualityCheck = await prisma.qualityCheck.create({
      data: {
        batchId: data.batchId,
        inspectorId: data.inspectorId,
        checkType: data.checkType,
        passed: data.passed,
        parameters: data.parameters,
        notes: data.notes
      }
    });

    return qualityCheck;
  }

  /**
   * Get quality checks for a batch
   */
  async getQualityChecks(
    batchId: string,
    options: QueryOptions = {}
  ): Promise<{ checks: QualityCheck[]; total: number }> {
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

    const [checks, total] = await Promise.all([
      prisma.qualityCheck.findMany({
        where: { batchId },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          inspector: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      }),
      prisma.qualityCheck.count({ where: { batchId } })
    ]);

    return { checks, total };
  }

  /**
   * Get quality check by ID
   */
  async getQualityCheckById(id: string): Promise<QualityCheck> {
    const check = await prisma.qualityCheck.findUnique({
      where: { id },
      include: {
        inspector: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!check) {
      throw new NotFoundError('QualityCheck', id);
    }

    return check;
  }

  /**
   * Update quality check
   */
  async updateQualityCheck(
    id: string,
    data: Partial<CreateQualityCheckRequest>
  ): Promise<QualityCheck> {
    const existingCheck = await prisma.qualityCheck.findUnique({
      where: { id }
    });

    if (!existingCheck) {
      throw new NotFoundError('QualityCheck', id);
    }

    const check = await prisma.qualityCheck.update({
      where: { id },
      data: {
        ...(data.checkType && { checkType: data.checkType }),
        ...(data.passed !== undefined && { passed: data.passed }),
        ...(data.parameters && { parameters: data.parameters }),
        ...(data.notes !== undefined && { notes: data.notes })
      },
      include: {
        inspector: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    return check;
  }

  /**
   * Delete quality check
   */
  async deleteQualityCheck(id: string): Promise<void> {
    const check = await prisma.qualityCheck.findUnique({
      where: { id }
    });

    if (!check) {
      throw new NotFoundError('QualityCheck', id);
    }

    await prisma.qualityCheck.delete({
      where: { id }
    });
  }

  /**
   * Get quality metrics for a batch
   */
  async getQualityMetrics(batchId: string): Promise<QualityMetrics | null> {
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        qualityChecks: true
      }
    });

    if (!batch || batch.qualityChecks.length === 0) {
      return null;
    }

    const checks = batch.qualityChecks;
    
    // Calculate scores
    const visualChecks = checks.filter(c => c.checkType.toLowerCase().includes('visual'));
    const tasteChecks = checks.filter(c => c.checkType.toLowerCase().includes('taste'));
    const aromaChecks = checks.filter(c => c.checkType.toLowerCase().includes('aroma'));
    const gravityChecks = checks.filter(c => c.checkType.toLowerCase().includes('gravity'));
    const phChecks = checks.filter(c => c.checkType.toLowerCase().includes('ph'));
    const microChecks = checks.filter(c => c.checkType.toLowerCase().includes('microbiological'));

    const calculateScore = (checks: QualityCheck[]): number => {
      if (checks.length === 0) return 0;
      const passedCount = checks.filter(c => c.passed).length;
      return (passedCount / checks.length) * 100;
    };

    const visualScore = calculateScore(visualChecks);
    const tasteScore = calculateScore(tasteChecks);
    const aromaScore = calculateScore(aromaChecks);

    // Calculate gravity accuracy
    let gravityAccuracy = 0;
    if (gravityChecks.length > 0 && batch.originalGravity && batch.finalGravity) {
      const expectedFinalGravity = batch.originalGravity * 0.25; // Simplified target
      const actualFinalGravity = batch.finalGravity;
      const deviation = Math.abs(expectedFinalGravity - actualFinalGravity);
      gravityAccuracy = Math.max(0, (1 - deviation / expectedFinalGravity) * 100);
    }

    // Get pH level from latest check
    let phLevel = 0;
    if (phChecks.length > 0) {
      const latestPhCheck = phChecks.sort((a, b) => 
        b.timestamp.getTime() - a.timestamp.getTime()
      )[0];
      phLevel = (latestPhCheck.parameters as any)?.ph || 0;
    }

    // Check microbiological pass
    const microbiologicalPass = microChecks.length > 0 ? 
      microChecks.every(c => c.passed) : true;

    // Calculate overall score
    const scores = [visualScore, tasteScore, aromaScore, gravityAccuracy]
      .filter(score => score > 0);
    const overallScore = scores.length > 0 ? 
      scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;

    // Collect notes
    const notes = checks.filter(c => c.notes).map(c => c.notes!);

    return {
      batchId,
      overallScore: Math.round(overallScore * 100) / 100,
      visualScore,
      tasteScore,
      aromaScore,
      gravityAccuracy,
      phLevel,
      microbiologicalPass,
      notes
    };
  }

  /**
   * Get quality trends over time
   */
  async getQualityTrends(
    recipeId?: string,
    checkType?: string,
    days: number = 30
  ): Promise<QualityTrend[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const where: any = {
      timestamp: { gte: startDate }
    };

    if (recipeId) {
      where.batch = { recipeId };
    }

    if (checkType) {
      where.checkType = checkType;
    }

    const checks = await prisma.qualityCheck.findMany({
      where,
      include: {
        batch: true
      },
      orderBy: { timestamp: 'asc' }
    });

    // Group by check type
    const checksByType = checks.reduce((acc, check) => {
      if (!acc[check.checkType]) {
        acc[check.checkType] = [];
      }
      acc[check.checkType].push(check);
      return acc;
    }, {} as Record<string, QualityCheck[]>);

    const trends: QualityTrend[] = Object.entries(checksByType).map(([type, typeChecks]) => {
      const values = typeChecks.map(check => ({
        date: check.timestamp,
        value: check.passed ? 1 : 0,
        batchId: check.batchId
      }));

      // Calculate trend
      let trend: 'improving' | 'declining' | 'stable' = 'stable';
      if (values.length >= 3) {
        const recent = values.slice(-5);
        const earlier = values.slice(-10, -5);
        
        if (recent.length > 0 && earlier.length > 0) {
          const recentAvg = recent.reduce((sum, v) => sum + v.value, 0) / recent.length;
          const earlierAvg = earlier.reduce((sum, v) => sum + v.value, 0) / earlier.length;
          
          const difference = recentAvg - earlierAvg;
          if (difference > 0.1) {
            trend = 'improving';
          } else if (difference < -0.1) {
            trend = 'declining';
          }
        }
      }

      return {
        metric: type,
        values,
        trend
      };
    });

    return trends;
  }

  /**
   * Get quality statistics
   */
  async getQualityStatistics(recipeId?: string): Promise<{
    totalChecks: number;
    passedChecks: number;
    failedChecks: number;
    passRate: number;
    checksByType: Record<string, { total: number; passed: number; passRate: number }>;
  }> {
    const where = recipeId ? { batch: { recipeId } } : {};

    const checks = await prisma.qualityCheck.findMany({
      where,
      include: {
        batch: recipeId ? true : false
      }
    });

    const totalChecks = checks.length;
    const passedChecks = checks.filter(c => c.passed).length;
    const failedChecks = totalChecks - passedChecks;
    const passRate = totalChecks > 0 ? (passedChecks / totalChecks) * 100 : 0;

    // Group by check type
    const checksByType = checks.reduce((acc, check) => {
      if (!acc[check.checkType]) {
        acc[check.checkType] = { total: 0, passed: 0, passRate: 0 };
      }
      acc[check.checkType].total++;
      if (check.passed) {
        acc[check.checkType].passed++;
      }
      return acc;
    }, {} as Record<string, { total: number; passed: number; passRate: number }>);

    // Calculate pass rates
    Object.values(checksByType).forEach(stats => {
      stats.passRate = stats.total > 0 ? (stats.passed / stats.total) * 100 : 0;
    });

    return {
      totalChecks,
      passedChecks,
      failedChecks,
      passRate: Math.round(passRate * 100) / 100,
      checksByType
    };
  }

  /**
   * Get failed quality checks requiring attention
   */
  async getFailedChecks(limit: number = 20): Promise<QualityCheck[]> {
    const checks = await prisma.qualityCheck.findMany({
      where: { passed: false },
      include: {
        batch: {
          include: {
            recipe: true
          }
        },
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
      take: limit
    });

    return checks;
  }

  /**
   * Perform automated quality assessment
   */
  async performAutomatedQualityCheck(
    batchId: string,
    inspectorId: string,
    sensorData: {
      temperature?: number;
      gravity?: number;
      ph?: number;
      turbidity?: number;
      color?: number;
    }
  ): Promise<QualityCheck[]> {
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: { recipe: true }
    });

    if (!batch) {
      throw new NotFoundError('Batch', batchId);
    }

    const checks: QualityCheck[] = [];

    // Temperature check
    if (sensorData.temperature !== undefined) {
      const targetTemp = batch.recipe.fermentationTemp;
      const tempDiff = Math.abs(sensorData.temperature - targetTemp);
      const passed = tempDiff <= 2; // Within 2 degrees

      const tempCheck = await this.createQualityCheck({
        batchId,
        inspectorId,
        checkType: 'temperature_automated',
        passed,
        parameters: {
          measured: sensorData.temperature,
          target: targetTemp,
          deviation: tempDiff
        },
        notes: passed ? 
          'Temperature within acceptable range' : 
          `Temperature deviation: ${tempDiff}°F from target`
      });

      checks.push(tempCheck);
    }

    // Gravity check
    if (sensorData.gravity !== undefined) {
      // Expected gravity based on fermentation progress
      const daysInFermentation = batch.brewDate ? 
        Math.floor((new Date().getTime() - batch.brewDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      
      const expectedProgress = Math.min(daysInFermentation / batch.recipe.estimatedDays, 1);
      const expectedGravity = batch.originalGravity ? 
        batch.originalGravity - (batch.originalGravity * 0.75 * expectedProgress) : 1.000;
      
      const gravityDiff = Math.abs(sensorData.gravity - expectedGravity);
      const passed = gravityDiff <= 0.005; // Within 0.005 SG

      const gravityCheck = await this.createQualityCheck({
        batchId,
        inspectorId,
        checkType: 'gravity_automated',
        passed,
        parameters: {
          measured: sensorData.gravity,
          expected: expectedGravity,
          deviation: gravityDiff
        },
        notes: passed ? 
          'Gravity within expected range' : 
          `Gravity deviation: ${gravityDiff} SG from expected`
      });

      checks.push(gravityCheck);
    }

    // pH check
    if (sensorData.ph !== undefined) {
      const passed = sensorData.ph >= 3.8 && sensorData.ph <= 4.6;

      const phCheck = await this.createQualityCheck({
        batchId,
        inspectorId,
        checkType: 'ph_automated',
        passed,
        parameters: {
          measured: sensorData.ph,
          acceptableRange: '3.8-4.6'
        },
        notes: passed ? 
          'pH within acceptable range' : 
          `pH ${sensorData.ph} outside acceptable range (3.8-4.6)`
      });

      checks.push(phCheck);
    }

    return checks;
  }

  /**
   * Generate quality control checklist for a batch
   */
  async generateQualityChecklist(batchId: string): Promise<{
    required: string[];
    recommended: string[];
    automated: string[];
  }> {
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        recipe: true,
        qualityChecks: true
      }
    });

    if (!batch) {
      throw new NotFoundError('Batch', batchId);
    }

    const existingCheckTypes = batch.qualityChecks.map(c => c.checkType);

    const required = [
      'visual_inspection',
      'aroma_assessment',
      'taste_test',
      'final_gravity_check'
    ].filter(type => !existingCheckTypes.includes(type));

    const recommended = [
      'color_measurement',
      'carbonation_level',
      'clarity_assessment',
      'foam_stability'
    ].filter(type => !existingCheckTypes.includes(type));

    const automated = [
      'temperature_monitoring',
      'ph_measurement',
      'gravity_tracking'
    ];

    return { required, recommended, automated };
  }
}