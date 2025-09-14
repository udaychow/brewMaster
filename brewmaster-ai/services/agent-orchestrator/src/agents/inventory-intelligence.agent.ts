import { 
  AgentType, 
  AgentCapability,
  Task
} from '@brewmaster/shared-types';
import { BaseAgent } from './base.agent';
import { AgentExecutionContext, AgentResponse } from '../types';
import { prisma } from '@brewmaster/database';
import logger from '../utils/logger';

export class InventoryIntelligenceAgent extends BaseAgent {
  constructor() {
    const systemPrompt = `
You are an Inventory Intelligence Agent for a craft brewery. Your expertise includes:

1. INVENTORY OPTIMIZATION:
   - Managing optimal stock levels for all ingredients
   - Minimizing carrying costs while preventing stockouts
   - Analyzing usage patterns and seasonality
   - Optimizing reorder points and quantities

2. PROCUREMENT INTELLIGENCE:
   - Supplier performance analysis and recommendations
   - Cost optimization and negotiation support
   - Lead time management and risk mitigation
   - Quality assessment and supplier diversification

3. DEMAND FORECASTING:
   - Predicting ingredient requirements based on production plans
   - Seasonal adjustment and trend analysis
   - Integration with production scheduling
   - Emergency stock recommendations

4. COST MANAGEMENT:
   - Identifying cost-saving opportunities
   - Waste reduction and efficiency improvements
   - Price trend analysis and optimal purchasing timing
   - Inventory turnover optimization

5. SUPPLY CHAIN RISK:
   - Identifying potential disruptions and bottlenecks
   - Supplier risk assessment and contingency planning
   - Market volatility analysis and hedging strategies
   - Quality assurance and compliance monitoring

Always provide data-driven recommendations with specific quantities, timing, and cost implications. Consider brewery cash flow and storage capacity constraints.

Format your responses as JSON with clear action items, priorities, and financial impact.
`;

    super(
      AgentType.INVENTORY_INTELLIGENCE,
      'Inventory Intelligence Agent',
      'Optimizes inventory levels, procurement, and supply chain efficiency',
      systemPrompt,
      {
        temperature: 0.2, // Very low temperature for precise inventory calculations
        maxTokens: 3500
      }
    );
  }

  protected getCapabilities(): AgentCapability[] {
    return [
      {
        name: 'optimize_inventory_levels',
        description: 'Calculate optimal inventory levels based on usage patterns and constraints',
        parameters: {
          required: ['current_inventory', 'usage_history'],
          optional: ['storage_constraints', 'cash_flow_limits']
        }
      },
      {
        name: 'forecast_demand',
        description: 'Forecast ingredient demand based on production plans and historical data',
        parameters: {
          required: ['production_plan', 'historical_usage'],
          optional: ['seasonal_factors', 'market_trends']
        }
      },
      {
        name: 'analyze_supplier_performance',
        description: 'Analyze supplier reliability, quality, and cost effectiveness',
        parameters: {
          required: ['supplier_data', 'order_history'],
          optional: ['quality_metrics', 'benchmark_period']
        }
      },
      {
        name: 'identify_procurement_opportunities',
        description: 'Identify cost-saving and efficiency opportunities in procurement',
        parameters: {
          required: ['current_procurement', 'market_data'],
          optional: ['budget_constraints', 'quality_requirements']
        }
      },
      {
        name: 'assess_stock_risks',
        description: 'Assess stockout, overstock, and supply chain risks',
        parameters: {
          required: ['inventory_data', 'supply_chain_data'],
          optional: ['risk_tolerance', 'contingency_plans']
        }
      },
      {
        name: 'optimize_purchasing_timing',
        description: 'Optimize timing of purchases based on price trends and demand',
        parameters: {
          required: ['price_history', 'demand_forecast'],
          optional: ['storage_capacity', 'cash_flow']
        }
      }
    ];
  }

  public async processTask(task: Task, context: AgentExecutionContext): Promise<AgentResponse> {
    try {
      switch (task.type) {
        case 'optimize_inventory_levels':
          return await this.optimizeInventoryLevels(task, context);
        case 'forecast_demand':
          return await this.forecastDemand(task, context);
        case 'analyze_supplier_performance':
          return await this.analyzeSupplierPerformance(task, context);
        case 'identify_procurement_opportunities':
          return await this.identifyProcurementOpportunities(task, context);
        case 'assess_stock_risks':
          return await this.assessStockRisks(task, context);
        case 'optimize_purchasing_timing':
          return await this.optimizePurchasingTiming(task, context);
        default:
          return {
            success: false,
            error: `Unknown task type: ${task.type}`
          };
      }
    } catch (error) {
      logger.error('Inventory Intelligence Agent error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private async optimizeInventoryLevels(task: Task, context: AgentExecutionContext): Promise<AgentResponse> {
    const { storageConstraints, cashFlowLimits } = task.input;

    const [currentInventory, usageHistory, upcomingOrders] = await Promise.all([
      prisma.ingredient.findMany({
        where: { isActive: true },
        include: { supplier: true }
      }),
      prisma.inventoryUsage.findMany({
        where: {
          usedAt: {
            gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) // Last 6 months
          }
        },
        include: {
          ingredient: true,
          batch: { include: { recipe: true } }
        }
      }),
      prisma.order.findMany({
        where: {
          status: { in: ['PENDING', 'CONFIRMED', 'SHIPPED'] }
        },
        include: {
          items: { include: { ingredient: true } }
        }
      })
    ]);

    const prompt = `
Optimize inventory levels for all ingredients based on usage patterns and constraints.

Current Inventory:
${JSON.stringify(currentInventory, null, 2)}

Usage History (6 months):
${JSON.stringify(usageHistory, null, 2)}

Upcoming Orders:
${JSON.stringify(upcomingOrders, null, 2)}

Constraints:
- Storage: ${JSON.stringify(storageConstraints || {})}
- Cash Flow: ${JSON.stringify(cashFlowLimits || {})}

Please provide:
1. Optimal stock levels for each ingredient
2. Reorder point recommendations
3. Safety stock calculations
4. Cost impact analysis
5. Storage optimization suggestions
6. Priority rankings for procurement
`;

    const response = await this.generateResponse(prompt, {
      currentInventory,
      usageHistory,
      upcomingOrders,
      constraints: { storageConstraints, cashFlowLimits }
    });

    // Store optimization results for tracking
    await this.storeInMemory('longTerm', `inventory_optimization_${Date.now()}`, {
      recommendations: response.content,
      ingredientsAnalyzed: currentInventory.length,
      createdAt: new Date()
    });

    return {
      success: true,
      data: {
        optimization: JSON.parse(response.content),
        metadata: {
          ingredientsAnalyzed: currentInventory.length,
          usageDataPoints: usageHistory.length,
          analysisTimeframe: '6 months'
        }
      },
      metadata: {
        tokensUsed: response.tokensUsed,
        confidence: 0.9
      }
    };
  }

  private async forecastDemand(task: Task, context: AgentExecutionContext): Promise<AgentResponse> {
    const { productionPlan, seasonalFactors, marketTrends } = task.input;

    const historicalUsage = await prisma.inventoryUsage.findMany({
      where: {
        usedAt: {
          gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) // Last year
        }
      },
      include: {
        ingredient: true,
        batch: { 
          include: { 
            recipe: true,
            fermentationLogs: true 
          } 
        }
      },
      orderBy: { usedAt: 'asc' }
    });

    const prompt = `
Forecast ingredient demand based on production plans and historical patterns.

Production Plan:
${JSON.stringify(productionPlan, null, 2)}

Historical Usage (12 months):
${JSON.stringify(historicalUsage, null, 2)}

Seasonal Factors:
${JSON.stringify(seasonalFactors || {}, null, 2)}

Market Trends:
${JSON.stringify(marketTrends || {}, null, 2)}

Please provide:
1. Detailed demand forecast by ingredient and time period
2. Seasonal adjustments and variations
3. Confidence intervals and risk assessment
4. Key assumptions and sensitivity analysis
5. Early warning indicators for demand changes
6. Procurement timeline recommendations
`;

    const response = await this.generateResponse(prompt, {
      productionPlan,
      historicalUsage,
      seasonalFactors,
      marketTrends
    });

    return {
      success: true,
      data: {
        forecast: JSON.parse(response.content),
        metadata: {
          historicalDataPoints: historicalUsage.length,
          forecastTimeframe: 'Based on production plan',
          analysisDepth: '12 months historical'
        }
      },
      metadata: {
        tokensUsed: response.tokensUsed,
        confidence: 0.85
      }
    };
  }

  private async analyzeSupplierPerformance(task: Task, context: AgentExecutionContext): Promise<AgentResponse> {
    const { qualityMetrics, benchmarkPeriod = 365 } = task.input;

    const [suppliers, orderHistory, qualityData] = await Promise.all([
      prisma.supplier.findMany({
        where: { isActive: true },
        include: {
          ingredients: true,
          orders: {
            where: {
              orderDate: {
                gte: new Date(Date.now() - benchmarkPeriod * 24 * 60 * 60 * 1000)
              }
            },
            include: { items: true }
          }
        }
      }),
      prisma.order.findMany({
        where: {
          orderDate: {
            gte: new Date(Date.now() - benchmarkPeriod * 24 * 60 * 60 * 1000)
          }
        },
        include: {
          supplier: true,
          items: { include: { ingredient: true } }
        }
      }),
      this.getQualityMetrics(benchmarkPeriod)
    ]);

    const prompt = `
Analyze supplier performance across multiple dimensions.

Suppliers:
${JSON.stringify(suppliers, null, 2)}

Order History (${benchmarkPeriod} days):
${JSON.stringify(orderHistory, null, 2)}

Quality Metrics:
${JSON.stringify(qualityData, null, 2)}

Additional Quality Data:
${JSON.stringify(qualityMetrics || {}, null, 2)}

Please provide:
1. Comprehensive supplier performance ratings
2. On-time delivery analysis
3. Quality performance assessment
4. Cost competitiveness evaluation
5. Risk assessment for each supplier
6. Recommendations for supplier relationship management
7. Diversification opportunities and risks
`;

    const response = await this.generateResponse(prompt, {
      suppliers,
      orderHistory,
      qualityData,
      qualityMetrics
    });

    // Store supplier analysis for future reference
    await this.storeInMemory('longTerm', `supplier_analysis_${Date.now()}`, {
      analysis: response.content,
      suppliersAnalyzed: suppliers.length,
      benchmarkPeriod,
      createdAt: new Date()
    });

    return {
      success: true,
      data: {
        analysis: JSON.parse(response.content),
        metadata: {
          suppliersAnalyzed: suppliers.length,
          ordersAnalyzed: orderHistory.length,
          benchmarkPeriod
        }
      },
      metadata: {
        tokensUsed: response.tokensUsed,
        confidence: 0.88
      }
    };
  }

  private async identifyProcurementOpportunities(task: Task, context: AgentExecutionContext): Promise<AgentResponse> {
    const { marketData, budgetConstraints, qualityRequirements } = task.input;

    const [currentProcurement, priceHistory, marketAnalysis] = await Promise.all([
      this.getCurrentProcurementData(),
      this.getPriceHistory(180), // 6 months
      this.getMarketAnalysis()
    ]);

    const prompt = `
Identify procurement optimization opportunities.

Current Procurement:
${JSON.stringify(currentProcurement, null, 2)}

Price History (6 months):
${JSON.stringify(priceHistory, null, 2)}

Market Analysis:
${JSON.stringify(marketAnalysis, null, 2)}

External Market Data:
${JSON.stringify(marketData || {}, null, 2)}

Budget Constraints:
${JSON.stringify(budgetConstraints || {}, null, 2)}

Quality Requirements:
${JSON.stringify(qualityRequirements || {}, null, 2)}

Please provide:
1. Cost-saving opportunities with quantified impact
2. Supplier consolidation/diversification recommendations
3. Volume discount optimization
4. Alternative ingredient/supplier suggestions
5. Negotiation strategies and leverage points
6. Implementation timeline and risk mitigation
`;

    const response = await this.generateResponse(prompt, {
      currentProcurement,
      priceHistory,
      marketAnalysis,
      marketData,
      budgetConstraints,
      qualityRequirements
    });

    return {
      success: true,
      data: {
        opportunities: JSON.parse(response.content),
        metadata: {
          procurementCategoriesAnalyzed: Object.keys(currentProcurement).length,
          priceDataPoints: priceHistory.length
        }
      },
      metadata: {
        tokensUsed: response.tokensUsed,
        confidence: 0.8
      }
    };
  }

  private async assessStockRisks(task: Task, context: AgentExecutionContext): Promise<AgentResponse> {
    const { riskTolerance, contingencyPlans } = task.input;

    const [inventoryData, supplyChainData, demandVariability] = await Promise.all([
      prisma.ingredient.findMany({
        where: { isActive: true },
        include: {
          supplier: true,
          inventoryUsage: {
            where: {
              usedAt: {
                gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
              }
            }
          }
        }
      }),
      this.getSupplyChainRiskData(),
      this.getDemandVariabilityAnalysis(90)
    ]);

    const prompt = `
Assess inventory and supply chain risks comprehensively.

Inventory Data:
${JSON.stringify(inventoryData, null, 2)}

Supply Chain Risk Data:
${JSON.stringify(supplyChainData, null, 2)}

Demand Variability (90 days):
${JSON.stringify(demandVariability, null, 2)}

Risk Tolerance:
${JSON.stringify(riskTolerance || {}, null, 2)}

Existing Contingency Plans:
${JSON.stringify(contingencyPlans || {}, null, 2)}

Please provide:
1. Stockout risk assessment by ingredient
2. Overstock risk and carrying cost analysis
3. Supply chain disruption scenarios
4. Financial impact of various risk scenarios
5. Risk mitigation recommendations
6. Contingency plan improvements
7. Early warning system recommendations
`;

    const response = await this.generateResponse(prompt, {
      inventoryData,
      supplyChainData,
      demandVariability,
      riskTolerance,
      contingencyPlans
    });

    return {
      success: true,
      data: {
        riskAssessment: JSON.parse(response.content),
        metadata: {
          ingredientsAssessed: inventoryData.length,
          riskFactorsAnalyzed: Object.keys(supplyChainData).length
        }
      },
      metadata: {
        tokensUsed: response.tokensUsed,
        confidence: 0.85
      }
    };
  }

  private async optimizePurchasingTiming(task: Task, context: AgentExecutionContext): Promise<AgentResponse> {
    const { priceHistory, demandForecast, storageCapacity, cashFlow } = task.input;

    const [currentPrices, seasonalPatterns, marketIndicators] = await Promise.all([
      this.getCurrentPrices(),
      this.getSeasonalPricePatterns(),
      this.getMarketIndicators()
    ]);

    const prompt = `
Optimize purchasing timing based on price trends, demand, and constraints.

Price History:
${JSON.stringify(priceHistory, null, 2)}

Demand Forecast:
${JSON.stringify(demandForecast, null, 2)}

Current Prices:
${JSON.stringify(currentPrices, null, 2)}

Seasonal Patterns:
${JSON.stringify(seasonalPatterns, null, 2)}

Market Indicators:
${JSON.stringify(marketIndicators, null, 2)}

Constraints:
- Storage Capacity: ${JSON.stringify(storageCapacity || {})}
- Cash Flow: ${JSON.stringify(cashFlow || {})}

Please provide:
1. Optimal purchasing timing for each ingredient category
2. Volume recommendations and price targets
3. Market timing strategies (buy now vs. wait)
4. Seasonal buying opportunities
5. Risk-adjusted recommendations
6. Expected cost savings and ROI
`;

    const response = await this.generateResponse(prompt, {
      priceHistory,
      demandForecast,
      currentPrices,
      seasonalPatterns,
      marketIndicators,
      constraints: { storageCapacity, cashFlow }
    });

    return {
      success: true,
      data: {
        timingOptimization: JSON.parse(response.content),
        metadata: {
          ingredientCategoriesAnalyzed: Object.keys(currentPrices).length,
          forecastHorizon: 'Based on demand forecast'
        }
      },
      metadata: {
        tokensUsed: response.tokensUsed,
        confidence: 0.75
      }
    };
  }

  // Helper methods for data retrieval
  private async getQualityMetrics(days: number): Promise<any> {
    // This would integrate with quality management system
    return {
      rejectionRates: {},
      qualityScores: {},
      defectCategories: {}
    };
  }

  private async getCurrentProcurementData(): Promise<any> {
    const recentOrders = await prisma.order.findMany({
      where: {
        orderDate: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
        }
      },
      include: {
        supplier: true,
        items: { include: { ingredient: true } }
      }
    });

    return recentOrders.reduce((acc: any, order) => {
      const category = order.items[0]?.ingredient?.category || 'OTHER';
      if (!acc[category]) acc[category] = [];
      acc[category].push(order);
      return acc;
    }, {});
  }

  private async getPriceHistory(days: number): Promise<any> {
    // This would integrate with price tracking system
    return [];
  }

  private async getMarketAnalysis(): Promise<any> {
    // This would integrate with market intelligence APIs
    return {
      trends: {},
      forecasts: {},
      volatility: {}
    };
  }

  private async getSupplyChainRiskData(): Promise<any> {
    return {
      supplierRisks: {},
      logisticsRisks: {},
      marketRisks: {},
      regulatoryRisks: {}
    };
  }

  private async getDemandVariabilityAnalysis(days: number): Promise<any> {
    const usage = await prisma.inventoryUsage.findMany({
      where: {
        usedAt: {
          gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        }
      },
      include: { ingredient: true }
    });

    return {
      coefficientOfVariation: {},
      seasonalityIndex: {},
      trendAnalysis: {}
    };
  }

  private async getCurrentPrices(): Promise<any> {
    const ingredients = await prisma.ingredient.findMany({
      where: { isActive: true }
    });

    return ingredients.reduce((acc: any, ingredient) => {
      acc[ingredient.id] = {
        currentPrice: ingredient.costPerUnit,
        currency: 'USD',
        lastUpdated: new Date()
      };
      return acc;
    }, {});
  }

  private async getSeasonalPricePatterns(): Promise<any> {
    // This would analyze historical price data for seasonal patterns
    return {
      grains: { peakMonths: [8, 9], lowMonths: [2, 3] },
      hops: { peakMonths: [9, 10], lowMonths: [5, 6] },
      yeast: { stable: true }
    };
  }

  private async getMarketIndicators(): Promise<any> {
    // This would integrate with commodity market APIs
    return {
      grainFutures: {},
      hopsPriceIndex: {},
      energyCosts: {},
      shippingCosts: {}
    };
  }
}