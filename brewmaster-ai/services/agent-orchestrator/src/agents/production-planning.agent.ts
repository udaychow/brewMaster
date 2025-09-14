import { 
  AgentType, 
  AgentCapability,
  Task
} from '@brewmaster/shared-types';
import { BaseAgent } from './base.agent';
import { AgentExecutionContext, AgentResponse } from '../types';
import { prisma } from '@brewmaster/database';
import logger from '../utils/logger';

export class ProductionPlanningAgent extends BaseAgent {
  constructor() {
    const systemPrompt = `
You are a Production Planning Agent for a craft brewery. Your expertise includes:

1. BREWING OPERATIONS:
   - Optimizing brewing schedules based on equipment availability
   - Managing fermentation timelines and capacity
   - Coordinating batch sizes and production volumes
   - Balancing recipe complexity with production efficiency

2. RESOURCE OPTIMIZATION:
   - Analyzing ingredient usage patterns
   - Optimizing water and energy consumption
   - Managing yeast propagation schedules
   - Coordinating equipment maintenance windows

3. DEMAND FORECASTING:
   - Analyzing seasonal patterns and market trends
   - Managing seasonal beer production planning
   - Coordinating with sales forecasts
   - Planning for special events and holidays

4. QUALITY ASSURANCE:
   - Scheduling quality checkpoints
   - Managing fermentation monitoring
   - Planning for conditioning and aging requirements
   - Coordinating packaging schedules

Always provide actionable recommendations with specific timelines, resource requirements, and risk assessments. Consider brewery capacity constraints and regulatory requirements in all planning decisions.

Format your responses as JSON with clear action items, timelines, and rationale.
`;

    super(
      AgentType.PRODUCTION_PLANNING,
      'Production Planning Agent',
      'Optimizes brewing schedules, resource allocation, and production efficiency',
      systemPrompt,
      {
        temperature: 0.3, // Lower temperature for more consistent planning
        maxTokens: 3000
      }
    );
  }

  protected getCapabilities(): AgentCapability[] {
    return [
      {
        name: 'optimize_brewing_schedule',
        description: 'Create optimal brewing schedules based on capacity and demand',
        parameters: {
          required: ['timeframe', 'recipes', 'capacity'],
          optional: ['constraints', 'priorities']
        }
      },
      {
        name: 'analyze_production_efficiency',
        description: 'Analyze current production efficiency and suggest improvements',
        parameters: {
          required: ['production_data'],
          optional: ['benchmark_period']
        }
      },
      {
        name: 'plan_batch_sequencing',
        description: 'Optimize the sequence of batches to minimize downtime',
        parameters: {
          required: ['planned_batches', 'equipment_availability'],
          optional: ['cleaning_requirements']
        }
      },
      {
        name: 'forecast_resource_needs',
        description: 'Forecast ingredient and resource requirements for production plan',
        parameters: {
          required: ['production_plan', 'current_inventory'],
          optional: ['lead_times']
        }
      },
      {
        name: 'assess_capacity_utilization',
        description: 'Analyze current capacity utilization and recommend optimizations',
        parameters: {
          required: ['capacity_data', 'production_history'],
          optional: ['growth_projections']
        }
      }
    ];
  }

  public async processTask(task: Task, context: AgentExecutionContext): Promise<AgentResponse> {
    try {
      switch (task.type) {
        case 'optimize_brewing_schedule':
          return await this.optimizeBrewingSchedule(task, context);
        case 'analyze_production_efficiency':
          return await this.analyzeProductionEfficiency(task, context);
        case 'plan_batch_sequencing':
          return await this.planBatchSequencing(task, context);
        case 'forecast_resource_needs':
          return await this.forecastResourceNeeds(task, context);
        case 'assess_capacity_utilization':
          return await this.assessCapacityUtilization(task, context);
        default:
          return {
            success: false,
            error: `Unknown task type: ${task.type}`
          };
      }
    } catch (error) {
      logger.error('Production Planning Agent error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private async optimizeBrewingSchedule(task: Task, context: AgentExecutionContext): Promise<AgentResponse> {
    const { timeframe, constraints } = task.input;

    // Fetch relevant data
    const [recipes, currentBatches, equipment] = await Promise.all([
      prisma.recipe.findMany({
        where: { isActive: true },
        include: { batches: { where: { status: { in: ['PLANNED', 'BREWING', 'FERMENTING'] } } } }
      }),
      prisma.batch.findMany({
        where: { 
          status: { in: ['PLANNED', 'BREWING', 'FERMENTING'] },
          plannedDate: {
            gte: new Date(),
            lte: new Date(Date.now() + (timeframe || 30) * 24 * 60 * 60 * 1000)
          }
        },
        include: { recipe: true }
      }),
      this.getEquipmentAvailability(timeframe)
    ]);

    const prompt = `
Optimize the brewing schedule for the next ${timeframe || 30} days.

Current Situation:
- Active Recipes: ${recipes.length}
- Current Planned/Active Batches: ${currentBatches.length}
- Equipment Availability: ${JSON.stringify(equipment)}

Constraints:
${JSON.stringify(constraints || {})}

Data:
Recipes: ${JSON.stringify(recipes, null, 2)}
Current Batches: ${JSON.stringify(currentBatches, null, 2)}

Please provide:
1. Optimal brewing schedule with specific dates and times
2. Resource allocation plan
3. Risk assessment and mitigation strategies
4. Expected efficiency gains
5. Recommendations for capacity optimization
`;

    const response = await this.generateResponse(prompt, {
      recipes,
      currentBatches,
      equipment,
      constraints
    });

    // Store the optimization in memory for future reference
    await this.storeInMemory('longTerm', `schedule_optimization_${Date.now()}`, {
      timeframe,
      recommendations: response.content,
      createdAt: new Date()
    });

    return {
      success: true,
      data: {
        schedule: JSON.parse(response.content),
        metadata: {
          recipesAnalyzed: recipes.length,
          batchesConsidered: currentBatches.length,
          timeframe: timeframe || 30
        }
      },
      metadata: {
        tokensUsed: response.tokensUsed,
        confidence: 0.85
      }
    };
  }

  private async analyzeProductionEfficiency(task: Task, context: AgentExecutionContext): Promise<AgentResponse> {
    const { benchmarkPeriod = 90 } = task.input;

    const productionData = await prisma.batch.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - benchmarkPeriod * 24 * 60 * 60 * 1000)
        },
        status: { in: ['COMPLETED', 'PACKAGING'] }
      },
      include: {
        recipe: true,
        fermentationLogs: true,
        qualityChecks: true,
        inventoryUsage: {
          include: { ingredient: true }
        }
      }
    });

    const prompt = `
Analyze production efficiency based on the following data:

Production Data (${benchmarkPeriod} days):
${JSON.stringify(productionData, null, 2)}

Please provide:
1. Key efficiency metrics and KPIs
2. Bottlenecks and inefficiencies identified
3. Comparison with industry benchmarks
4. Specific improvement recommendations
5. Resource optimization opportunities
6. Timeline for implementing improvements
`;

    const response = await this.generateResponse(prompt, {
      productionData,
      benchmarkPeriod
    });

    return {
      success: true,
      data: {
        analysis: JSON.parse(response.content),
        metadata: {
          batchesAnalyzed: productionData.length,
          benchmarkPeriod
        }
      },
      metadata: {
        tokensUsed: response.tokensUsed,
        confidence: 0.9
      }
    };
  }

  private async planBatchSequencing(task: Task, context: AgentExecutionContext): Promise<AgentResponse> {
    const { plannedBatches, cleaningRequirements } = task.input;

    const equipmentData = await this.getEquipmentAvailability(30);

    const prompt = `
Plan optimal batch sequencing to minimize downtime and maximize efficiency.

Planned Batches:
${JSON.stringify(plannedBatches, null, 2)}

Equipment Availability:
${JSON.stringify(equipmentData, null, 2)}

Cleaning Requirements:
${JSON.stringify(cleaningRequirements || {}, null, 2)}

Please provide:
1. Optimal batch sequence with timing
2. Equipment utilization plan
3. Cleaning and maintenance schedule
4. Risk factors and mitigation
5. Expected throughput improvements
`;

    const response = await this.generateResponse(prompt, {
      plannedBatches,
      equipmentData,
      cleaningRequirements
    });

    return {
      success: true,
      data: {
        sequencePlan: JSON.parse(response.content),
        metadata: {
          batchesPlanned: plannedBatches?.length || 0
        }
      },
      metadata: {
        tokensUsed: response.tokensUsed,
        confidence: 0.8
      }
    };
  }

  private async forecastResourceNeeds(task: Task, context: AgentExecutionContext): Promise<AgentResponse> {
    const { productionPlan, leadTimes } = task.input;

    const [currentInventory, historicalUsage] = await Promise.all([
      prisma.ingredient.findMany({
        where: { isActive: true }
      }),
      prisma.inventoryUsage.findMany({
        where: {
          usedAt: {
            gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
          }
        },
        include: {
          ingredient: true,
          batch: { include: { recipe: true } }
        }
      })
    ]);

    const prompt = `
Forecast resource requirements for the production plan.

Production Plan:
${JSON.stringify(productionPlan, null, 2)}

Current Inventory:
${JSON.stringify(currentInventory, null, 2)}

Historical Usage (90 days):
${JSON.stringify(historicalUsage, null, 2)}

Lead Times:
${JSON.stringify(leadTimes || {}, null, 2)}

Please provide:
1. Detailed resource requirements forecast
2. Inventory shortfall analysis
3. Procurement timeline and recommendations
4. Buffer stock recommendations
5. Cost optimization opportunities
`;

    const response = await this.generateResponse(prompt, {
      productionPlan,
      currentInventory,
      historicalUsage,
      leadTimes
    });

    return {
      success: true,
      data: {
        forecast: JSON.parse(response.content),
        metadata: {
          ingredientsAnalyzed: currentInventory.length,
          historicalDataPoints: historicalUsage.length
        }
      },
      metadata: {
        tokensUsed: response.tokensUsed,
        confidence: 0.85
      }
    };
  }

  private async assessCapacityUtilization(task: Task, context: AgentExecutionContext): Promise<AgentResponse> {
    const { capacityData, growthProjections } = task.input;

    const productionHistory = await prisma.batch.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) // Last 6 months
        }
      },
      include: {
        recipe: true
      }
    });

    const prompt = `
Assess current capacity utilization and recommend optimizations.

Capacity Data:
${JSON.stringify(capacityData, null, 2)}

Production History (6 months):
${JSON.stringify(productionHistory, null, 2)}

Growth Projections:
${JSON.stringify(growthProjections || {}, null, 2)}

Please provide:
1. Current capacity utilization analysis
2. Bottleneck identification
3. Expansion recommendations
4. Efficiency improvement opportunities
5. Investment priorities and ROI analysis
`;

    const response = await this.generateResponse(prompt, {
      capacityData,
      productionHistory,
      growthProjections
    });

    return {
      success: true,
      data: {
        assessment: JSON.parse(response.content),
        metadata: {
          historicalBatches: productionHistory.length,
          analysisTimeframe: '6 months'
        }
      },
      metadata: {
        tokensUsed: response.tokensUsed,
        confidence: 0.85
      }
    };
  }

  private async getEquipmentAvailability(days: number = 30): Promise<any> {
    // This would integrate with equipment management system
    // For now, return mock data structure
    return {
      fermentationTanks: {
        total: 8,
        available: 6,
        maintenanceSchedule: []
      },
      brewKettle: {
        total: 2,
        available: 2,
        maintenanceSchedule: []
      },
      packagingLine: {
        total: 1,
        available: 1,
        maintenanceSchedule: []
      }
    };
  }
}