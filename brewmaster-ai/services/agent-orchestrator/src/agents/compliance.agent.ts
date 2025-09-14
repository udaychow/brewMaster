import { 
  AgentType, 
  AgentCapability,
  Task
} from '@brewmaster/shared-types';
import { BaseAgent } from './base.agent';
import { AgentExecutionContext, AgentResponse } from '../types';
import { prisma } from '@brewmaster/database';
import logger from '../utils/logger';

export class ComplianceAgent extends BaseAgent {
  constructor() {
    const systemPrompt = `
You are a Compliance Agent for a craft brewery. Your expertise includes:

1. REGULATORY COMPLIANCE:
   - TTB (Alcohol and Tobacco Tax and Trade Bureau) regulations
   - FDA food safety requirements and FSMA compliance
   - State and local licensing requirements
   - Environmental regulations and waste management
   - Occupational safety (OSHA) compliance

2. LICENSE MANAGEMENT:
   - Tracking renewal dates and requirements
   - Managing compliance documentation
   - Coordinating with regulatory bodies
   - Monitoring regulatory changes and updates

3. QUALITY ASSURANCE COMPLIANCE:
   - HACCP (Hazard Analysis Critical Control Points)
   - SQF (Safe Quality Food) standards
   - Allergen management and labeling
   - Traceability and recall procedures

4. REPORTING AND DOCUMENTATION:
   - Tax reporting and excise tax calculations
   - Production reporting to regulatory bodies
   - Compliance audit preparation
   - Record keeping and documentation standards

5. RISK MANAGEMENT:
   - Identifying compliance risks and gaps
   - Developing mitigation strategies
   - Crisis management and incident response
   - Training and awareness programs

Always prioritize legal compliance and public safety. Provide specific regulatory references and actionable steps. Flag high-risk situations requiring immediate attention.

Format your responses as JSON with clear priorities, deadlines, and regulatory references.
`;

    super(
      AgentType.COMPLIANCE,
      'Compliance Agent',
      'Monitors regulatory compliance, manages licenses, and ensures adherence to brewing regulations',
      systemPrompt,
      {
        temperature: 0.1, // Very low temperature for precise regulatory guidance
        maxTokens: 4000
      }
    );
  }

  protected getCapabilities(): AgentCapability[] {
    return [
      {
        name: 'monitor_license_status',
        description: 'Monitor license renewal dates and compliance status',
        parameters: {
          required: ['license_data'],
          optional: ['notification_thresholds', 'jurisdiction']
        }
      },
      {
        name: 'assess_regulatory_compliance',
        description: 'Assess current compliance status across all regulatory areas',
        parameters: {
          required: ['operational_data', 'regulatory_requirements'],
          optional: ['audit_scope', 'priority_areas']
        }
      },
      {
        name: 'generate_compliance_report',
        description: 'Generate comprehensive compliance reports for audits or reviews',
        parameters: {
          required: ['report_type', 'time_period'],
          optional: ['specific_regulations', 'audience']
        }
      },
      {
        name: 'calculate_excise_taxes',
        description: 'Calculate federal and state excise taxes on production',
        parameters: {
          required: ['production_data', 'tax_jurisdiction'],
          optional: ['exemptions', 'tax_year']
        }
      },
      {
        name: 'validate_labeling_compliance',
        description: 'Validate product labels for regulatory compliance',
        parameters: {
          required: ['label_data', 'product_specifications'],
          optional: ['target_markets', 'distribution_channels']
        }
      },
      {
        name: 'track_regulatory_changes',
        description: 'Monitor and assess impact of regulatory changes',
        parameters: {
          required: ['regulation_sources'],
          optional: ['impact_areas', 'implementation_timeline']
        }
      },
      {
        name: 'manage_recalls',
        description: 'Coordinate product recall procedures and compliance',
        parameters: {
          required: ['recall_trigger', 'affected_products'],
          optional: ['recall_scope', 'regulatory_notifications']
        }
      }
    ];
  }

  public async processTask(task: Task, context: AgentExecutionContext): Promise<AgentResponse> {
    try {
      switch (task.type) {
        case 'monitor_license_status':
          return await this.monitorLicenseStatus(task, context);
        case 'assess_regulatory_compliance':
          return await this.assessRegulatoryCompliance(task, context);
        case 'generate_compliance_report':
          return await this.generateComplianceReport(task, context);
        case 'calculate_excise_taxes':
          return await this.calculateExciseTaxes(task, context);
        case 'validate_labeling_compliance':
          return await this.validateLabelingCompliance(task, context);
        case 'track_regulatory_changes':
          return await this.trackRegulatoryChanges(task, context);
        case 'manage_recalls':
          return await this.manageRecalls(task, context);
        default:
          return {
            success: false,
            error: `Unknown task type: ${task.type}`
          };
      }
    } catch (error) {
      logger.error('Compliance Agent error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private async monitorLicenseStatus(task: Task, context: AgentExecutionContext): Promise<AgentResponse> {
    const { notificationThresholds, jurisdiction } = task.input;

    const licenses = await prisma.license.findMany({
      where: jurisdiction ? {
        issuingAuthority: { contains: jurisdiction }
      } : {},
      orderBy: { expiryDate: 'asc' }
    });

    const currentDate = new Date();
    const defaultThresholds = {
      critical: 30, // 30 days
      warning: 90,  // 90 days
      notice: 180   // 180 days
    };
    const thresholds = { ...defaultThresholds, ...notificationThresholds };

    const prompt = `
Monitor license compliance status and renewal requirements.

Current Licenses:
${JSON.stringify(licenses, null, 2)}

Current Date: ${currentDate.toISOString()}

Notification Thresholds:
- Critical: ${thresholds.critical} days
- Warning: ${thresholds.warning} days
- Notice: ${thresholds.notice} days

Please provide:
1. License status summary with urgency levels
2. Upcoming renewal requirements and deadlines
3. Required documentation and application processes
4. Cost estimates for renewals
5. Risk assessment for expired/expiring licenses
6. Action plan with specific deadlines
7. Regulatory contact information where applicable
`;

    const response = await this.generateResponse(prompt, {
      licenses,
      currentDate,
      thresholds
    });

    // Store license monitoring results
    await this.storeInMemory('shortTerm', `license_status_${Date.now()}`, {
      results: response.content,
      monitoringDate: currentDate,
      licensesChecked: licenses.length
    });

    return {
      success: true,
      data: {
        licenseStatus: JSON.parse(response.content),
        metadata: {
          licensesMonitored: licenses.length,
          jurisdiction: jurisdiction || 'All',
          monitoringDate: currentDate.toISOString()
        }
      },
      metadata: {
        tokensUsed: response.tokensUsed,
        confidence: 0.95
      }
    };
  }

  private async assessRegulatoryCompliance(task: Task, context: AgentExecutionContext): Promise<AgentResponse> {
    const { regulatoryRequirements, auditScope, priorityAreas } = task.input;

    const [operationalData, recentBatches, qualityRecords, licenses] = await Promise.all([
      this.getOperationalData(),
      prisma.batch.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
          }
        },
        include: {
          recipe: true,
          qualityChecks: true,
          fermentationLogs: true
        }
      }),
      prisma.qualityCheck.findMany({
        where: {
          timestamp: {
            gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
          }
        },
        include: {
          batch: { include: { recipe: true } }
        }
      }),
      prisma.license.findMany({
        where: { status: 'ACTIVE' }
      })
    ]);

    const prompt = `
Assess comprehensive regulatory compliance across all operational areas.

Operational Data:
${JSON.stringify(operationalData, null, 2)}

Recent Production (90 days):
${JSON.stringify(recentBatches, null, 2)}

Quality Records:
${JSON.stringify(qualityRecords, null, 2)}

Active Licenses:
${JSON.stringify(licenses, null, 2)}

Regulatory Requirements:
${JSON.stringify(regulatoryRequirements || {}, null, 2)}

Audit Scope:
${JSON.stringify(auditScope || 'Comprehensive', null, 2)}

Priority Areas:
${JSON.stringify(priorityAreas || ['All'], null, 2)}

Please provide:
1. Comprehensive compliance assessment by regulatory area
2. Gap analysis with specific non-compliance issues
3. Risk assessment and impact analysis
4. Corrective action recommendations with timelines
5. Compliance score/rating with improvement metrics
6. Regulatory reporting requirements and status
7. Training and documentation needs
`;

    const response = await this.generateResponse(prompt, {
      operationalData,
      recentBatches,
      qualityRecords,
      licenses,
      regulatoryRequirements,
      auditScope,
      priorityAreas
    });

    return {
      success: true,
      data: {
        complianceAssessment: JSON.parse(response.content),
        metadata: {
          batchesReviewed: recentBatches.length,
          qualityRecordsAnalyzed: qualityRecords.length,
          activeLicenses: licenses.length,
          assessmentDate: new Date().toISOString()
        }
      },
      metadata: {
        tokensUsed: response.tokensUsed,
        confidence: 0.9
      }
    };
  }

  private async generateComplianceReport(task: Task, context: AgentExecutionContext): Promise<AgentResponse> {
    const { reportType, timePeriod, specificRegulations, audience } = task.input;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (timePeriod || 90));

    const [productionData, complianceRecords, incidentReports, auditFindings] = await Promise.all([
      prisma.batch.findMany({
        where: {
          createdAt: { gte: startDate, lte: endDate }
        },
        include: {
          recipe: true,
          qualityChecks: true,
          inventoryUsage: { include: { ingredient: true } }
        }
      }),
      this.getComplianceRecords(startDate, endDate),
      this.getIncidentReports(startDate, endDate),
      this.getAuditFindings(startDate, endDate)
    ]);

    const prompt = `
Generate a comprehensive compliance report.

Report Type: ${reportType}
Time Period: ${startDate.toISOString()} to ${endDate.toISOString()}
Audience: ${audience || 'Internal Management'}

Production Data:
${JSON.stringify(productionData, null, 2)}

Compliance Records:
${JSON.stringify(complianceRecords, null, 2)}

Incident Reports:
${JSON.stringify(incidentReports, null, 2)}

Audit Findings:
${JSON.stringify(auditFindings, null, 2)}

Specific Regulations Focus:
${JSON.stringify(specificRegulations || 'All applicable regulations', null, 2)}

Please provide:
1. Executive summary of compliance status
2. Detailed compliance metrics and KPIs
3. Production compliance analysis
4. Quality assurance compliance review
5. License and permit status
6. Incident analysis and corrective actions
7. Regulatory risk assessment
8. Recommendations and improvement plan
9. Appendices with supporting documentation
`;

    const response = await this.generateResponse(prompt, {
      reportType,
      timePeriod,
      productionData,
      complianceRecords,
      incidentReports,
      auditFindings,
      specificRegulations,
      audience
    });

    // Store report for future reference
    await this.storeInMemory('longTerm', `compliance_report_${Date.now()}`, {
      reportType,
      timePeriod: { startDate, endDate },
      report: response.content,
      generatedAt: new Date()
    });

    return {
      success: true,
      data: {
        complianceReport: JSON.parse(response.content),
        metadata: {
          reportType,
          timePeriod: `${startDate.toISOString()} to ${endDate.toISOString()}`,
          productionBatches: productionData.length,
          generatedAt: new Date().toISOString()
        }
      },
      metadata: {
        tokensUsed: response.tokensUsed,
        confidence: 0.92
      }
    };
  }

  private async calculateExciseTaxes(task: Task, context: AgentExecutionContext): Promise<AgentResponse> {
    const { productionData, taxJurisdiction, exemptions, taxYear } = task.input;

    const currentYear = taxYear || new Date().getFullYear();
    
    // Get production data for tax calculation
    const batchData = await prisma.batch.findMany({
      where: {
        status: { in: ['COMPLETED', 'PACKAGING'] },
        brewDate: {
          gte: new Date(currentYear, 0, 1),
          lte: new Date(currentYear, 11, 31)
        }
      },
      include: {
        recipe: true
      }
    });

    const taxRates = await this.getCurrentTaxRates(taxJurisdiction);

    const prompt = `
Calculate excise taxes on beer production for tax compliance.

Production Data:
${JSON.stringify(productionData || batchData, null, 2)}

Tax Jurisdiction: ${taxJurisdiction}
Tax Year: ${currentYear}

Current Tax Rates:
${JSON.stringify(taxRates, null, 2)}

Exemptions/Credits:
${JSON.stringify(exemptions || {}, null, 2)}

Please provide:
1. Detailed tax calculations by beer type and volume
2. Federal excise tax calculations (TTB)
3. State excise tax calculations
4. Local tax obligations
5. Available exemptions and credits applied
6. Tax payment schedule and deadlines
7. Required reporting forms and documentation
8. Total tax liability summary
`;

    const response = await this.generateResponse(prompt, {
      productionData: productionData || batchData,
      taxJurisdiction,
      taxYear: currentYear,
      taxRates,
      exemptions
    });

    return {
      success: true,
      data: {
        taxCalculation: JSON.parse(response.content),
        metadata: {
          taxYear: currentYear,
          jurisdiction: taxJurisdiction,
          batchesCalculated: (productionData || batchData).length,
          calculationDate: new Date().toISOString()
        }
      },
      metadata: {
        tokensUsed: response.tokensUsed,
        confidence: 0.95
      }
    };
  }

  private async validateLabelingCompliance(task: Task, context: AgentExecutionContext): Promise<AgentResponse> {
    const { labelData, productSpecifications, targetMarkets, distributionChannels } = task.input;

    const regulatoryRequirements = await this.getLabelingRequirements(targetMarkets);

    const prompt = `
Validate product label compliance with applicable regulations.

Label Data:
${JSON.stringify(labelData, null, 2)}

Product Specifications:
${JSON.stringify(productSpecifications, null, 2)}

Target Markets:
${JSON.stringify(targetMarkets || ['Domestic'], null, 2)}

Distribution Channels:
${JSON.stringify(distributionChannels || ['Retail'], null, 2)}

Regulatory Requirements:
${JSON.stringify(regulatoryRequirements, null, 2)}

Please provide:
1. Comprehensive label compliance analysis
2. Required information verification (ABV, ingredients, warnings)
3. Format and placement requirements
4. Font size and legibility requirements
5. Prohibited claims and terminology
6. Market-specific requirements
7. Non-compliance issues and corrections needed
8. Approval process requirements
`;

    const response = await this.generateResponse(prompt, {
      labelData,
      productSpecifications,
      targetMarkets,
      distributionChannels,
      regulatoryRequirements
    });

    return {
      success: true,
      data: {
        labelingValidation: JSON.parse(response.content),
        metadata: {
          labelsValidated: Array.isArray(labelData) ? labelData.length : 1,
          targetMarkets: targetMarkets || ['Domestic'],
          validationDate: new Date().toISOString()
        }
      },
      metadata: {
        tokensUsed: response.tokensUsed,
        confidence: 0.88
      }
    };
  }

  private async trackRegulatoryChanges(task: Task, context: AgentExecutionContext): Promise<AgentResponse> {
    const { regulationSources, impactAreas, implementationTimeline } = task.input;

    const recentChanges = await this.getRecentRegulatoryChanges(regulationSources);
    const currentCompliance = await this.getCurrentComplianceStatus();

    const prompt = `
Track and assess impact of regulatory changes.

Recent Regulatory Changes:
${JSON.stringify(recentChanges, null, 2)}

Current Compliance Status:
${JSON.stringify(currentCompliance, null, 2)}

Regulation Sources:
${JSON.stringify(regulationSources || ['TTB', 'FDA', 'State'], null, 2)}

Impact Areas:
${JSON.stringify(impactAreas || ['All operations'], null, 2)}

Implementation Timeline:
${JSON.stringify(implementationTimeline || {}, null, 2)}

Please provide:
1. Summary of recent regulatory changes
2. Impact assessment on current operations
3. Required compliance actions and timelines
4. Cost implications of regulatory changes
5. Implementation priority and resource requirements
6. Risk assessment for non-compliance
7. Stakeholder communication requirements
8. Monitoring and tracking recommendations
`;

    const response = await this.generateResponse(prompt, {
      recentChanges,
      currentCompliance,
      regulationSources,
      impactAreas,
      implementationTimeline
    });

    // Store regulatory tracking results
    await this.storeInMemory('longTerm', `regulatory_changes_${Date.now()}`, {
      changes: response.content,
      trackedSources: regulationSources,
      assessmentDate: new Date()
    });

    return {
      success: true,
      data: {
        regulatoryTracking: JSON.parse(response.content),
        metadata: {
          changesTracked: recentChanges.length,
          sources: regulationSources || ['TTB', 'FDA', 'State'],
          trackingDate: new Date().toISOString()
        }
      },
      metadata: {
        tokensUsed: response.tokensUsed,
        confidence: 0.85
      }
    };
  }

  private async manageRecalls(task: Task, context: AgentExecutionContext): Promise<AgentResponse> {
    const { recallTrigger, affectedProducts, recallScope, regulatoryNotifications } = task.input;

    const traceabilityData = await this.getTraceabilityData(affectedProducts);
    const distributionRecords = await this.getDistributionRecords(affectedProducts);

    const prompt = `
Coordinate product recall procedures and regulatory compliance.

Recall Trigger:
${JSON.stringify(recallTrigger, null, 2)}

Affected Products:
${JSON.stringify(affectedProducts, null, 2)}

Traceability Data:
${JSON.stringify(traceabilityData, null, 2)}

Distribution Records:
${JSON.stringify(distributionRecords, null, 2)}

Recall Scope:
${JSON.stringify(recallScope || 'To be determined', null, 2)}

Regulatory Notifications Required:
${JSON.stringify(regulatoryNotifications || {}, null, 2)}

Please provide:
1. Immediate action plan and priorities
2. Regulatory notification requirements and templates
3. Customer and distributor communication plan
4. Product retrieval and tracking procedures
5. Root cause analysis framework
6. Corrective action requirements
7. Documentation and record keeping requirements
8. Cost estimation and insurance considerations
9. Timeline for recall completion
10. Preventive measures for future
`;

    const response = await this.generateResponse(prompt, {
      recallTrigger,
      affectedProducts,
      traceabilityData,
      distributionRecords,
      recallScope,
      regulatoryNotifications
    });

    // Store recall management data for tracking
    await this.storeInMemory('longTerm', `recall_management_${Date.now()}`, {
      recallData: response.content,
      trigger: recallTrigger,
      affectedProducts,
      initiatedAt: new Date()
    });

    return {
      success: true,
      data: {
        recallManagement: JSON.parse(response.content),
        metadata: {
          affectedProductCount: Array.isArray(affectedProducts) ? affectedProducts.length : 1,
          recallInitiated: new Date().toISOString(),
          urgencyLevel: 'HIGH'
        }
      },
      metadata: {
        tokensUsed: response.tokensUsed,
        confidence: 0.92
      }
    };
  }

  // Helper methods for compliance data
  private async getOperationalData(): Promise<any> {
    return {
      facilityInfo: {
        permits: await prisma.license.findMany({ where: { status: 'ACTIVE' } }),
        capacity: 'To be determined',
        equipment: 'Equipment registry needed'
      },
      productionSummary: {
        currentMonth: await this.getProductionSummary(30),
        currentQuarter: await this.getProductionSummary(90),
        currentYear: await this.getProductionSummary(365)
      }
    };
  }

  private async getProductionSummary(days: number): Promise<any> {
    const batches = await prisma.batch.findMany({
      where: {
        brewDate: {
          gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        }
      },
      include: { recipe: true }
    });

    return {
      totalBatches: batches.length,
      totalVolume: batches.reduce((sum, batch) => sum + batch.volume, 0),
      styles: [...new Set(batches.map(b => b.recipe.style))]
    };
  }

  private async getComplianceRecords(startDate: Date, endDate: Date): Promise<any[]> {
    // This would integrate with compliance tracking system
    return [];
  }

  private async getIncidentReports(startDate: Date, endDate: Date): Promise<any[]> {
    // This would integrate with incident tracking system
    return [];
  }

  private async getAuditFindings(startDate: Date, endDate: Date): Promise<any[]> {
    // This would integrate with audit management system
    return [];
  }

  private async getCurrentTaxRates(jurisdiction: string): Promise<any> {
    // This would integrate with tax rate APIs or databases
    return {
      federal: {
        smallBrewerRate: 3.50, // per barrel for first 60,000 barrels
        standardRate: 18.00    // per barrel over 60,000 barrels
      },
      state: {
        rate: 'Varies by state',
        jurisdiction: jurisdiction
      }
    };
  }

  private async getLabelingRequirements(markets: string[] = ['Domestic']): Promise<any> {
    // This would integrate with regulatory requirements database
    return {
      ttbRequirements: {
        brandName: 'Required',
        alcoholContent: 'Required',
        classAndType: 'Required',
        healthWarning: 'Required'
      },
      fdaRequirements: {
        ingredients: 'Required if requested',
        allergens: 'Required',
        nutritionalInfo: 'Optional'
      }
    };
  }

  private async getRecentRegulatoryChanges(sources: string[] = []): Promise<any[]> {
    // This would integrate with regulatory monitoring APIs
    return [];
  }

  private async getCurrentComplianceStatus(): Promise<any> {
    const licenses = await prisma.license.findMany();
    return {
      licensesActive: licenses.filter(l => l.status === 'ACTIVE').length,
      licensesExpiring: licenses.filter(l => {
        const daysToExpiry = (new Date(l.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        return daysToExpiry <= 90;
      }).length
    };
  }

  private async getTraceabilityData(products: any[]): Promise<any> {
    // This would integrate with traceability system
    return {
      batchNumbers: [],
      ingredients: [],
      distributionPath: []
    };
  }

  private async getDistributionRecords(products: any[]): Promise<any> {
    // This would integrate with distribution management system
    return {
      retailers: [],
      distributors: [],
      shipmentRecords: []
    };
  }
}