import { 
  AgentType, 
  AgentCapability,
  Task
} from '@brewmaster/shared-types';
import { BaseAgent } from './base.agent';
import { AgentExecutionContext, AgentResponse } from '../types';
import { prisma } from '@brewmaster/database';
import logger from '../utils/logger';

export class FinancialOperationsAgent extends BaseAgent {
  constructor() {
    const systemPrompt = `
You are a Financial Operations Agent for a craft brewery. Your expertise includes:

1. COST ANALYSIS AND OPTIMIZATION:
   - Product cost analysis (COGS) by recipe and batch
   - Production cost optimization and efficiency analysis
   - Overhead allocation and cost center management
   - Raw material cost tracking and variance analysis
   - Labor cost analysis and productivity metrics

2. PROFITABILITY ANALYSIS:
   - Product-level profitability assessment
   - Customer and channel profitability analysis
   - Margin analysis and pricing optimization
   - Break-even analysis for products and operations
   - ROI analysis for investments and initiatives

3. FINANCIAL PLANNING AND BUDGETING:
   - Cash flow forecasting and management
   - Budget planning and variance analysis
   - Capital expenditure planning and justification
   - Seasonal financial planning and adjustments
   - Growth scenario modeling and financial projections

4. PRICING STRATEGY:
   - Competitive pricing analysis
   - Value-based pricing recommendations
   - Dynamic pricing strategies for different channels
   - Promotional pricing impact analysis
   - Price elasticity and demand response modeling

5. FINANCIAL RISK MANAGEMENT:
   - Financial risk assessment and mitigation
   - Working capital optimization
   - Credit and collection management
   - Currency and commodity risk hedging
   - Financial compliance and audit preparation

Always provide data-driven insights with clear financial metrics, actionable recommendations, and quantified business impact. Consider brewery-specific factors like seasonal variations, regulatory costs, and craft beer market dynamics.

Format your responses as JSON with specific metrics, recommendations, and financial projections.
`;

    super(
      AgentType.FINANCIAL_OPERATIONS,
      'Financial Operations Agent',
      'Analyzes costs, profitability, and financial performance while optimizing brewery operations',
      systemPrompt,
      {
        temperature: 0.1, // Very low temperature for precise financial calculations
        maxTokens: 4000
      }
    );
  }

  protected getCapabilities(): AgentCapability[] {
    return [
      {
        name: 'analyze_product_costs',
        description: 'Analyze product costs and margins by recipe or batch',
        parameters: {
          required: ['production_data', 'cost_data'],
          optional: ['time_period', 'cost_categories']
        }
      },
      {
        name: 'assess_profitability',
        description: 'Assess profitability across products, customers, and channels',
        parameters: {
          required: ['revenue_data', 'cost_data'],
          optional: ['analysis_dimensions', 'benchmark_period']
        }
      },
      {
        name: 'forecast_cash_flow',
        description: 'Forecast cash flow and working capital requirements',
        parameters: {
          required: ['financial_data', 'forecast_horizon'],
          optional: ['scenario_assumptions', 'seasonal_factors']
        }
      },
      {
        name: 'optimize_pricing_strategy',
        description: 'Optimize pricing strategy based on costs, competition, and demand',
        parameters: {
          required: ['product_data', 'market_data'],
          optional: ['pricing_objectives', 'constraints']
        }
      },
      {
        name: 'analyze_financial_performance',
        description: 'Analyze overall financial performance and key metrics',
        parameters: {
          required: ['financial_statements', 'period'],
          optional: ['benchmark_data', 'analysis_focus']
        }
      },
      {
        name: 'evaluate_investment_opportunities',
        description: 'Evaluate capital investments and expansion opportunities',
        parameters: {
          required: ['investment_proposal', 'financial_criteria'],
          optional: ['risk_factors', 'strategic_alignment']
        }
      },
      {
        name: 'manage_working_capital',
        description: 'Optimize working capital and cash conversion cycle',
        parameters: {
          required: ['balance_sheet_data', 'operational_data'],
          optional: ['industry_benchmarks', 'improvement_targets']
        }
      }
    ];
  }

  public async processTask(task: Task, context: AgentExecutionContext): Promise<AgentResponse> {
    try {
      switch (task.type) {
        case 'analyze_product_costs':
          return await this.analyzeProductCosts(task, context);
        case 'assess_profitability':
          return await this.assessProfitability(task, context);
        case 'forecast_cash_flow':
          return await this.forecastCashFlow(task, context);
        case 'optimize_pricing_strategy':
          return await this.optimizePricingStrategy(task, context);
        case 'analyze_financial_performance':
          return await this.analyzeFinancialPerformance(task, context);
        case 'evaluate_investment_opportunities':
          return await this.evaluateInvestmentOpportunities(task, context);
        case 'manage_working_capital':
          return await this.manageWorkingCapital(task, context);
        default:
          return {
            success: false,
            error: `Unknown task type: ${task.type}`
          };
      }
    } catch (error) {
      logger.error('Financial Operations Agent error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private async analyzeProductCosts(task: Task, context: AgentExecutionContext): Promise<AgentResponse> {
    const { productionData, costData, timePeriod = 90, costCategories } = task.input;

    const [batches, inventoryUsage, transactions] = await Promise.all([
      prisma.batch.findMany({
        where: {
          brewDate: {
            gte: new Date(Date.now() - timePeriod * 24 * 60 * 60 * 1000)
          },
          status: { in: ['COMPLETED', 'PACKAGING'] }
        },
        include: {
          recipe: true,
          inventoryUsage: {
            include: { ingredient: true }
          }
        }
      }),
      prisma.inventoryUsage.findMany({
        where: {
          usedAt: {
            gte: new Date(Date.now() - timePeriod * 24 * 60 * 60 * 1000)
          }
        },
        include: {
          ingredient: true,
          batch: { include: { recipe: true } }
        }
      }),
      prisma.transaction.findMany({
        where: {
          type: 'EXPENSE',
          date: {
            gte: new Date(Date.now() - timePeriod * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    const prompt = `
Analyze product costs and identify optimization opportunities.

Production Data (${timePeriod} days):
${JSON.stringify(productionData || batches, null, 2)}

Inventory Usage:
${JSON.stringify(inventoryUsage, null, 2)}

Cost Transactions:
${JSON.stringify(transactions, null, 2)}

Additional Cost Data:
${JSON.stringify(costData || {}, null, 2)}

Cost Categories Focus:
${JSON.stringify(costCategories || ['Materials', 'Labor', 'Overhead'], null, 2)}

Please provide:
1. Detailed cost breakdown by product/recipe
2. Cost per unit analysis (per barrel, per bottle, etc.)
3. Material cost variance analysis
4. Labor cost allocation and efficiency
5. Overhead cost distribution and allocation
6. Cost trend analysis and seasonality
7. Cost optimization opportunities with quantified impact
8. Benchmarking against industry standards
9. Cost control recommendations
10. Cost forecasting for future production
`;

    const response = await this.generateResponse(prompt, {
      productionData: productionData || batches,
      inventoryUsage,
      transactions,
      costData,
      timePeriod,
      costCategories
    });

    // Store cost analysis for trending
    await this.storeInMemory('longTerm', `cost_analysis_${Date.now()}`, {
      analysis: response.content,
      timePeriod,
      batchesAnalyzed: batches.length,
      analysisDate: new Date()
    });

    return {
      success: true,
      data: {
        costAnalysis: JSON.parse(response.content),
        metadata: {
          batchesAnalyzed: batches.length,
          timePeriod: `${timePeriod} days`,
          costTransactions: transactions.length,
          analysisDate: new Date().toISOString()
        }
      },
      metadata: {
        tokensUsed: response.tokensUsed,
        confidence: 0.92
      }
    };
  }

  private async assessProfitability(task: Task, context: AgentExecutionContext): Promise<AgentResponse> {
    const { revenueData, costData, analysisDimensions, benchmarkPeriod = 90 } = task.input;

    const [revenue, costs, customerData, productMix] = await Promise.all([
      this.getRevenueData(benchmarkPeriod),
      this.getCostData(benchmarkPeriod),
      prisma.customer.findMany({
        include: {
          visits: {
            where: {
              visitDate: {
                gte: new Date(Date.now() - benchmarkPeriod * 24 * 60 * 60 * 1000)
              }
            }
          }
        }
      }),
      this.getProductMixData(benchmarkPeriod)
    ]);

    const prompt = `
Assess profitability across multiple dimensions and identify improvement opportunities.

Revenue Data:
${JSON.stringify(revenueData || revenue, null, 2)}

Cost Data:
${JSON.stringify(costData || costs, null, 2)}

Customer Data:
${JSON.stringify(customerData, null, 2)}

Product Mix:
${JSON.stringify(productMix, null, 2)}

Analysis Dimensions:
${JSON.stringify(analysisDimensions || ['Product', 'Customer', 'Channel'], null, 2)}

Benchmark Period: ${benchmarkPeriod} days

Please provide:
1. Overall profitability analysis and key metrics
2. Product-level profitability ranking
3. Customer profitability segmentation
4. Channel profitability comparison
5. Margin analysis and improvement opportunities
6. Break-even analysis for products and operations
7. Profit driver identification and sensitivity analysis
8. Profitability trends and seasonal patterns
9. Strategic recommendations for profit optimization
10. Financial targets and improvement roadmap
`;

    const response = await this.generateResponse(prompt, {
      revenueData: revenueData || revenue,
      costData: costData || costs,
      customerData,
      productMix,
      analysisDimensions,
      benchmarkPeriod
    });

    return {
      success: true,
      data: {
        profitabilityAssessment: JSON.parse(response.content),
        metadata: {
          benchmarkPeriod: `${benchmarkPeriod} days`,
          customersAnalyzed: customerData.length,
          dimensions: analysisDimensions || ['Product', 'Customer', 'Channel'],
          assessmentDate: new Date().toISOString()
        }
      },
      metadata: {
        tokensUsed: response.tokensUsed,
        confidence: 0.88
      }
    };
  }

  private async forecastCashFlow(task: Task, context: AgentExecutionContext): Promise<AgentResponse> {
    const { financialData, forecastHorizon, scenarioAssumptions, seasonalFactors } = task.input;

    const [historicalTransactions, currentBalance, projectedRevenue, projectedExpenses] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          date: {
            gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) // Last year
          }
        },
        orderBy: { date: 'asc' }
      }),
      this.getCurrentFinancialPosition(),
      this.getProjectedRevenue(forecastHorizon),
      this.getProjectedExpenses(forecastHorizon)
    ]);

    const prompt = `
Forecast cash flow and working capital requirements.

Historical Transactions (12 months):
${JSON.stringify(historicalTransactions, null, 2)}

Current Financial Position:
${JSON.stringify(currentBalance, null, 2)}

Projected Revenue:
${JSON.stringify(projectedRevenue, null, 2)}

Projected Expenses:
${JSON.stringify(projectedExpenses, null, 2)}

Financial Data:
${JSON.stringify(financialData || {}, null, 2)}

Forecast Horizon: ${forecastHorizon} months

Scenario Assumptions:
${JSON.stringify(scenarioAssumptions || {}, null, 2)}

Seasonal Factors:
${JSON.stringify(seasonalFactors || {}, null, 2)}

Please provide:
1. Detailed cash flow forecast by month
2. Working capital requirements analysis
3. Cash flow scenario modeling (best/worst/likely)
4. Seasonal cash flow patterns and adjustments
5. Liquidity risk assessment and mitigation
6. Financing requirements and timing
7. Cash flow optimization recommendations
8. Key cash flow drivers and sensitivity analysis
9. Cash management strategy recommendations
10. Financial risk alerts and monitoring metrics
`;

    const response = await this.generateResponse(prompt, {
      historicalTransactions,
      currentBalance,
      projectedRevenue,
      projectedExpenses,
      financialData,
      forecastHorizon,
      scenarioAssumptions,
      seasonalFactors
    });

    // Store forecast for tracking accuracy
    await this.storeInMemory('longTerm', `cash_flow_forecast_${Date.now()}`, {
      forecast: response.content,
      forecastHorizon,
      forecastDate: new Date(),
      assumptions: scenarioAssumptions
    });

    return {
      success: true,
      data: {
        cashFlowForecast: JSON.parse(response.content),
        metadata: {
          forecastHorizon: `${forecastHorizon} months`,
          historicalDataPoints: historicalTransactions.length,
          forecastDate: new Date().toISOString()
        }
      },
      metadata: {
        tokensUsed: response.tokensUsed,
        confidence: 0.85
      }
    };
  }

  private async optimizePricingStrategy(task: Task, context: AgentExecutionContext): Promise<AgentResponse> {
    const { productData, marketData, pricingObjectives, constraints } = task.input;

    const [currentPricing, competitorPricing, demandData, costStructure] = await Promise.all([
      this.getCurrentPricing(),
      this.getCompetitorPricing(),
      this.getDemandAnalysis(),
      this.getCostStructure()
    ]);

    const prompt = `
Optimize pricing strategy based on costs, competition, and market dynamics.

Current Pricing:
${JSON.stringify(currentPricing, null, 2)}

Product Data:
${JSON.stringify(productData || {}, null, 2)}

Competitor Pricing:
${JSON.stringify(competitorPricing, null, 2)}

Market Data:
${JSON.stringify(marketData || {}, null, 2)}

Demand Data:
${JSON.stringify(demandData, null, 2)}

Cost Structure:
${JSON.stringify(costStructure, null, 2)}

Pricing Objectives:
${JSON.stringify(pricingObjectives || 'Profit maximization', null, 2)}

Constraints:
${JSON.stringify(constraints || {}, null, 2)}

Please provide:
1. Current pricing analysis and competitive positioning
2. Price elasticity analysis and demand response
3. Cost-plus vs. value-based pricing recommendations
4. Product portfolio pricing optimization
5. Channel-specific pricing strategies
6. Dynamic pricing opportunities and implementation
7. Promotional pricing strategy and impact analysis
8. Price testing and optimization framework
9. Revenue and margin impact projections
10. Implementation roadmap and monitoring plan
`;

    const response = await this.generateResponse(prompt, {
      currentPricing,
      productData,
      competitorPricing,
      marketData,
      demandData,
      costStructure,
      pricingObjectives,
      constraints
    });

    return {
      success: true,
      data: {
        pricingOptimization: JSON.parse(response.content),
        metadata: {
          productsAnalyzed: Object.keys(currentPricing).length,
          competitorsTracked: Object.keys(competitorPricing).length,
          optimizationDate: new Date().toISOString()
        }
      },
      metadata: {
        tokensUsed: response.tokensUsed,
        confidence: 0.83
      }
    };
  }

  private async analyzeFinancialPerformance(task: Task, context: AgentExecutionContext): Promise<AgentResponse> {
    const { financialStatements, period, benchmarkData, analysisFocus } = task.input;

    const [transactions, kpiData, industryBenchmarks] = await Promise.all([
      this.getFinancialTransactions(period),
      this.calculateKPIs(period),
      this.getIndustryBenchmarks()
    ]);

    const prompt = `
Analyze comprehensive financial performance and key metrics.

Financial Statements:
${JSON.stringify(financialStatements || {}, null, 2)}

Transaction Data:
${JSON.stringify(transactions, null, 2)}

Key Performance Indicators:
${JSON.stringify(kpiData, null, 2)}

Industry Benchmarks:
${JSON.stringify(industryBenchmarks, null, 2)}

Benchmark Data:
${JSON.stringify(benchmarkData || {}, null, 2)}

Analysis Period: ${period}

Analysis Focus:
${JSON.stringify(analysisFocus || 'Comprehensive analysis', null, 2)}

Please provide:
1. Financial performance summary and key metrics
2. Revenue analysis and growth trends
3. Cost structure and efficiency analysis
4. Profitability analysis and margin trends
5. Liquidity and cash flow analysis
6. Financial ratios and benchmark comparison
7. Performance drivers and variance analysis
8. Financial risk assessment
9. Improvement opportunities and action plan
10. Financial forecasting and scenario planning
`;

    const response = await this.generateResponse(prompt, {
      financialStatements,
      transactions,
      kpiData,
      industryBenchmarks,
      benchmarkData,
      period,
      analysisFocus
    });

    return {
      success: true,
      data: {
        financialPerformanceAnalysis: JSON.parse(response.content),
        metadata: {
          analysisPeriod: period,
          transactionsAnalyzed: transactions.length,
          analysisDate: new Date().toISOString()
        }
      },
      metadata: {
        tokensUsed: response.tokensUsed,
        confidence: 0.90
      }
    };
  }

  private async evaluateInvestmentOpportunities(task: Task, context: AgentExecutionContext): Promise<AgentResponse> {
    const { investmentProposal, financialCriteria, riskFactors, strategicAlignment } = task.input;

    const [financialCapacity, historicalROI, marketConditions] = await Promise.all([
      this.getFinancialCapacity(),
      this.getHistoricalROI(),
      this.getMarketConditions()
    ]);

    const prompt = `
Evaluate investment opportunities and provide financial analysis.

Investment Proposal:
${JSON.stringify(investmentProposal, null, 2)}

Financial Criteria:
${JSON.stringify(financialCriteria, null, 2)}

Current Financial Capacity:
${JSON.stringify(financialCapacity, null, 2)}

Historical ROI Data:
${JSON.stringify(historicalROI, null, 2)}

Market Conditions:
${JSON.stringify(marketConditions, null, 2)}

Risk Factors:
${JSON.stringify(riskFactors || {}, null, 2)}

Strategic Alignment:
${JSON.stringify(strategicAlignment || {}, null, 2)}

Please provide:
1. Investment financial analysis (NPV, IRR, Payback)
2. Risk-adjusted return calculations
3. Sensitivity analysis and scenario modeling
4. Cash flow impact and financing requirements
5. Strategic value assessment
6. Risk assessment and mitigation strategies
7. Implementation timeline and milestones
8. Monitoring and success metrics
9. Alternative investment comparison
10. Investment recommendation and rationale
`;

    const response = await this.generateResponse(prompt, {
      investmentProposal,
      financialCriteria,
      financialCapacity,
      historicalROI,
      marketConditions,
      riskFactors,
      strategicAlignment
    });

    // Store investment analysis for tracking
    await this.storeInMemory('longTerm', `investment_evaluation_${Date.now()}`, {
      proposal: investmentProposal,
      analysis: response.content,
      evaluationDate: new Date()
    });

    return {
      success: true,
      data: {
        investmentEvaluation: JSON.parse(response.content),
        metadata: {
          proposalType: investmentProposal?.type || 'Unknown',
          evaluationDate: new Date().toISOString(),
          investmentAmount: investmentProposal?.amount || 'Unknown'
        }
      },
      metadata: {
        tokensUsed: response.tokensUsed,
        confidence: 0.87
      }
    };
  }

  private async manageWorkingCapital(task: Task, context: AgentExecutionContext): Promise<AgentResponse> {
    const { balanceSheetData, operationalData, industryBenchmarks, improvementTargets } = task.input;

    const [currentAssets, currentLiabilities, cashConversionData, paymentTerms] = await Promise.all([
      this.getCurrentAssets(),
      this.getCurrentLiabilities(),
      this.getCashConversionData(),
      this.getPaymentTermsData()
    ]);

    const prompt = `
Optimize working capital and cash conversion cycle.

Balance Sheet Data:
${JSON.stringify(balanceSheetData || { currentAssets, currentLiabilities }, null, 2)}

Operational Data:
${JSON.stringify(operationalData || {}, null, 2)}

Cash Conversion Data:
${JSON.stringify(cashConversionData, null, 2)}

Payment Terms:
${JSON.stringify(paymentTerms, null, 2)}

Industry Benchmarks:
${JSON.stringify(industryBenchmarks || {}, null, 2)}

Improvement Targets:
${JSON.stringify(improvementTargets || {}, null, 2)}

Please provide:
1. Working capital analysis and key ratios
2. Cash conversion cycle analysis
3. Inventory management optimization
4. Accounts receivable management
5. Accounts payable optimization
6. Cash flow timing optimization
7. Working capital efficiency improvements
8. Benchmark comparison and gap analysis
9. Implementation roadmap and priorities
10. Monitoring metrics and targets
`;

    const response = await this.generateResponse(prompt, {
      balanceSheetData: balanceSheetData || { currentAssets, currentLiabilities },
      operationalData,
      cashConversionData,
      paymentTerms,
      industryBenchmarks,
      improvementTargets
    });

    return {
      success: true,
      data: {
        workingCapitalOptimization: JSON.parse(response.content),
        metadata: {
          currentRatio: currentAssets && currentLiabilities ? 
            (currentAssets.total / currentLiabilities.total).toFixed(2) : 'Unknown',
          analysisDate: new Date().toISOString()
        }
      },
      metadata: {
        tokensUsed: response.tokensUsed,
        confidence: 0.85
      }
    };
  }

  // Helper methods for financial data retrieval
  private async getRevenueData(days: number): Promise<any> {
    const visits = await prisma.visit.findMany({
      where: {
        visitDate: {
          gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        }
      }
    });

    return {
      totalRevenue: visits.reduce((sum, visit) => sum + visit.totalSpent, 0),
      averageTransaction: visits.length > 0 ? 
        visits.reduce((sum, visit) => sum + visit.totalSpent, 0) / visits.length : 0,
      transactionCount: visits.length
    };
  }

  private async getCostData(days: number): Promise<any> {
    const transactions = await prisma.transaction.findMany({
      where: {
        type: 'EXPENSE',
        date: {
          gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        }
      }
    });

    return {
      totalCosts: transactions.reduce((sum, t) => sum + t.amount, 0),
      costCategories: transactions.reduce((acc: any, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {})
    };
  }

  private async getProductMixData(days: number): Promise<any> {
    const batches = await prisma.batch.findMany({
      where: {
        brewDate: {
          gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        }
      },
      include: { recipe: true }
    });

    return batches.reduce((acc: any, batch) => {
      const style = batch.recipe.style;
      acc[style] = (acc[style] || 0) + batch.volume;
      return acc;
    }, {});
  }

  private async getCurrentFinancialPosition(): Promise<any> {
    // This would integrate with accounting systems
    return {
      cash: 50000,
      accountsReceivable: 15000,
      inventory: 25000,
      currentLiabilities: 30000
    };
  }

  private async getProjectedRevenue(months: number): Promise<any> {
    // This would integrate with sales forecasting
    return {
      monthly: Array.from({ length: months }, (_, i) => ({
        month: i + 1,
        revenue: 45000 + (Math.random() * 10000)
      }))
    };
  }

  private async getProjectedExpenses(months: number): Promise<any> {
    // This would integrate with budgeting systems
    return {
      monthly: Array.from({ length: months }, (_, i) => ({
        month: i + 1,
        expenses: 35000 + (Math.random() * 5000)
      }))
    };
  }

  private async getCurrentPricing(): Promise<any> {
    const recipes = await prisma.recipe.findMany({
      where: { isActive: true }
    });

    return recipes.reduce((acc: any, recipe) => {
      acc[recipe.name] = {
        pint: 6.50,
        flight: 12.00,
        growler: 18.00
      };
      return acc;
    }, {});
  }

  private async getCompetitorPricing(): Promise<any> {
    // This would integrate with market intelligence APIs
    return {
      'Competitor A': { pint: 6.00, flight: 11.00, growler: 17.00 },
      'Competitor B': { pint: 7.00, flight: 13.00, growler: 19.00 }
    };
  }

  private async getDemandAnalysis(): Promise<any> {
    const visits = await prisma.visit.findMany({
      where: {
        visitDate: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
        }
      }
    });

    return {
      averageSpend: visits.length > 0 ? 
        visits.reduce((sum, v) => sum + v.totalSpent, 0) / visits.length : 0,
      visitTrends: 'Stable',
      seasonalPatterns: 'Summer peak, winter low'
    };
  }

  private async getCostStructure(): Promise<any> {
    const ingredients = await prisma.ingredient.findMany({
      where: { isActive: true }
    });

    return {
      variableCosts: {
        ingredients: ingredients.reduce((sum, i) => sum + (i.currentStock * i.costPerUnit), 0)
      },
      fixedCosts: {
        rent: 8000,
        utilities: 2000,
        insurance: 1200
      }
    };
  }

  private async getFinancialTransactions(period: string): Promise<any[]> {
    const [value, unit] = period.split(' ');
    const days = unit === 'months' ? parseInt(value) * 30 : parseInt(value);

    return await prisma.transaction.findMany({
      where: {
        date: {
          gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        }
      }
    });
  }

  private async calculateKPIs(period: string): Promise<any> {
    // This would calculate key financial KPIs
    return {
      grossMargin: 0.65,
      operatingMargin: 0.15,
      currentRatio: 1.8,
      quickRatio: 1.2,
      inventoryTurnover: 6.5
    };
  }

  private async getIndustryBenchmarks(): Promise<any> {
    // This would integrate with industry benchmark databases
    return {
      averageGrossMargin: 0.70,
      averageOperatingMargin: 0.12,
      averageCurrentRatio: 1.5,
      averageInventoryTurnover: 8.0
    };
  }

  private async getFinancialCapacity(): Promise<any> {
    return {
      availableCash: 50000,
      creditCapacity: 100000,
      debtServiceCapacity: 5000,
      maxInvestmentCapacity: 75000
    };
  }

  private async getHistoricalROI(): Promise<any> {
    return {
      equipmentInvestments: 0.15,
      marketingInvestments: 0.08,
      facilityImprovements: 0.12
    };
  }

  private async getMarketConditions(): Promise<any> {
    return {
      interestRates: 0.065,
      marketGrowth: 0.05,
      competitionLevel: 'High',
      customerDemand: 'Strong'
    };
  }

  private async getCurrentAssets(): Promise<any> {
    return {
      cash: 50000,
      accountsReceivable: 15000,
      inventory: 25000,
      total: 90000
    };
  }

  private async getCurrentLiabilities(): Promise<any> {
    return {
      accountsPayable: 20000,
      shortTermDebt: 10000,
      accruedExpenses: 5000,
      total: 35000
    };
  }

  private async getCashConversionData(): Promise<any> {
    return {
      daysInventoryOutstanding: 45,
      daysSalesOutstanding: 30,
      daysPayableOutstanding: 35,
      cashConversionCycle: 40
    };
  }

  private async getPaymentTermsData(): Promise<any> {
    return {
      customerTerms: 'Net 30',
      supplierTerms: 'Net 30',
      averageCollectionPeriod: 28,
      averagePaymentPeriod: 35
    };
  }
}