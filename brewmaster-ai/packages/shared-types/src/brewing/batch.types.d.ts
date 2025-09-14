export interface Batch {
    id: string;
    recipeId: string;
    batchNumber: string;
    status: BatchStatus;
    startDate: Date;
    expectedCompletionDate: Date;
    actualCompletionDate?: Date;
    volume: number;
    targetGravity: number;
    currentGravity?: number;
    fermentationLogs: FermentationLog[];
    qualityChecks: QualityCheck[];
    createdAt: Date;
    updatedAt: Date;
}
export declare enum BatchStatus {
    PLANNED = "planned",
    BREWING = "brewing",
    FERMENTING = "fermenting",
    CONDITIONING = "conditioning",
    PACKAGING = "packaging",
    COMPLETED = "completed",
    QUALITY_HOLD = "quality_hold"
}
export interface FermentationLog {
    id: string;
    batchId: string;
    timestamp: Date;
    temperature: number;
    gravity: number;
    ph: number;
    notes?: string;
}
export interface QualityCheck {
    id: string;
    batchId: string;
    checkDate: Date;
    checkType: QualityCheckType;
    result: QualityResult;
    notes?: string;
    checkedBy: string;
}
export declare enum QualityCheckType {
    VISUAL = "visual",
    TASTE = "taste",
    AROMA = "aroma",
    GRAVITY = "gravity",
    PH = "ph",
    MICROBIOLOGICAL = "microbiological"
}
export declare enum QualityResult {
    PASS = "pass",
    FAIL = "fail",
    CONDITIONAL = "conditional"
}
