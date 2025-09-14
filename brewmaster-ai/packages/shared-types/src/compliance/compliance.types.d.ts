export interface License {
    id: string;
    type: LicenseType;
    licenseNumber: string;
    issuingAuthority: string;
    issueDate: Date;
    expirationDate: Date;
    status: LicenseStatus;
    renewalRequired: boolean;
    cost: number;
    documents: Document[];
    createdAt: Date;
    updatedAt: Date;
}
export declare enum LicenseType {
    BREWING_LICENSE = "brewing_license",
    LIQUOR_LICENSE = "liquor_license",
    FOOD_SERVICE = "food_service",
    RETAIL = "retail",
    DISTRIBUTION = "distribution",
    HEALTH_PERMIT = "health_permit",
    FIRE_PERMIT = "fire_permit",
    BUILDING_PERMIT = "building_permit"
}
export declare enum LicenseStatus {
    ACTIVE = "active",
    EXPIRED = "expired",
    PENDING_RENEWAL = "pending_renewal",
    SUSPENDED = "suspended",
    REVOKED = "revoked"
}
export interface Document {
    id: string;
    name: string;
    type: string;
    filePath: string;
    uploadDate: Date;
    expirationDate?: Date;
    isRequired: boolean;
}
export interface ComplianceReport {
    id: string;
    reportType: ReportType;
    reportingPeriod: ReportingPeriod;
    startDate: Date;
    endDate: Date;
    status: ReportStatus;
    data: Record<string, any>;
    submissionDate?: Date;
    dueDate: Date;
    submittedBy?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum ReportType {
    MONTHLY_PRODUCTION = "monthly_production",
    QUARTERLY_TAX = "quarterly_tax",
    ANNUAL_SUMMARY = "annual_summary",
    INVENTORY_REPORT = "inventory_report",
    SALES_REPORT = "sales_report",
    WASTE_REPORT = "waste_report"
}
export declare enum ReportingPeriod {
    DAILY = "daily",
    WEEKLY = "weekly",
    MONTHLY = "monthly",
    QUARTERLY = "quarterly",
    ANNUALLY = "annually"
}
export declare enum ReportStatus {
    DRAFT = "draft",
    PENDING_REVIEW = "pending_review",
    SUBMITTED = "submitted",
    APPROVED = "approved",
    REJECTED = "rejected",
    OVERDUE = "overdue"
}
export interface Inspection {
    id: string;
    inspectorName: string;
    inspectionDate: Date;
    inspectionType: InspectionType;
    status: InspectionStatus;
    score?: number;
    findings: InspectionFinding[];
    correctiveActions: CorrectiveAction[];
    nextInspectionDate?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum InspectionType {
    ROUTINE = "routine",
    FOLLOW_UP = "follow_up",
    COMPLAINT = "complaint",
    LICENSE_RENEWAL = "license_renewal"
}
export declare enum InspectionStatus {
    SCHEDULED = "scheduled",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    PASSED = "passed",
    FAILED = "failed"
}
export interface InspectionFinding {
    id: string;
    category: string;
    severity: FindingSeverity;
    description: string;
    location: string;
    isResolved: boolean;
}
export declare enum FindingSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export interface CorrectiveAction {
    id: string;
    findingId: string;
    description: string;
    assignedTo: string;
    dueDate: Date;
    status: ActionStatus;
    completedDate?: Date;
    notes?: string;
}
export declare enum ActionStatus {
    PENDING = "pending",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    OVERDUE = "overdue"
}
export interface ComplianceAlert {
    id: string;
    type: AlertType;
    severity: AlertSeverity;
    title: string;
    description: string;
    relatedEntityId: string;
    relatedEntityType: string;
    dueDate?: Date;
    isResolved: boolean;
    createdAt: Date;
    resolvedAt?: Date;
}
export declare enum AlertType {
    LICENSE_EXPIRING = "license_expiring",
    REPORT_OVERDUE = "report_overdue",
    INSPECTION_SCHEDULED = "inspection_scheduled",
    VIOLATION_DETECTED = "violation_detected",
    RENEWAL_REQUIRED = "renewal_required"
}
export declare enum AlertSeverity {
    INFO = "info",
    WARNING = "warning",
    ERROR = "error",
    CRITICAL = "critical"
}
