import { 
  Recipe, 
  Batch, 
  FermentationLog, 
  QualityCheck, 
  BatchStatus,
  IngredientCategory 
} from '@brewmaster/database';

// Request/Response DTOs
export interface CreateRecipeRequest {
  name: string;
  style: string;
  description?: string;
  targetVolume: number;
  targetABV: number;
  targetIBU: number;
  grainBill: GrainBillItem[];
  hopSchedule: HopScheduleItem[];
  yeastStrain: string;
  fermentationTemp: number;
  estimatedDays: number;
}

export interface UpdateRecipeRequest {
  name?: string;
  style?: string;
  description?: string;
  targetVolume?: number;
  targetABV?: number;
  targetIBU?: number;
  grainBill?: GrainBillItem[];
  hopSchedule?: HopScheduleItem[];
  yeastStrain?: string;
  fermentationTemp?: number;
  estimatedDays?: number;
  isActive?: boolean;
}

export interface CreateBatchRequest {
  recipeId: string;
  brewerId: string;
  plannedDate: string;
  volume: number;
  notes?: string;
}

export interface UpdateBatchRequest {
  status?: BatchStatus;
  brewDate?: string;
  volume?: number;
  originalGravity?: number;
  finalGravity?: number;
  abv?: number;
  ibu?: number;
  notes?: string;
}

export interface CreateFermentationLogRequest {
  batchId: string;
  temperature: number;
  gravity?: number;
  pH?: number;
  notes?: string;
}

export interface CreateQualityCheckRequest {
  batchId: string;
  inspectorId: string;
  checkType: string;
  passed: boolean;
  parameters: Record<string, any>;
  notes?: string;
}

// Recipe Components
export interface GrainBillItem {
  ingredientId: string;
  name: string;
  amount: number;
  unit: string;
  lovibond?: number;
  potential?: number;
}

export interface HopScheduleItem {
  ingredientId: string;
  name: string;
  amount: number;
  unit: string;
  time: number; // minutes
  usage: 'boil' | 'whirlpool' | 'dry-hop';
  alphaAcid?: number;
}

// Extended Types with Relations
export interface RecipeWithDetails extends Recipe {
  batches?: BatchSummary[];
}

export interface BatchWithDetails extends Batch {
  recipe: Recipe;
  brewer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  fermentationLogs: FermentationLog[];
  qualityChecks: QualityCheckWithInspector[];
}

export interface QualityCheckWithInspector extends QualityCheck {
  inspector: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface BatchSummary {
  id: string;
  batchNumber: string;
  status: BatchStatus;
  plannedDate: Date;
  brewDate?: Date;
  volume: number;
}

// Production Schedule Types
export interface ProductionScheduleItem {
  id: string;
  batchId?: string;
  recipeId: string;
  recipeName: string;
  scheduledDate: Date;
  estimatedDuration: number; // hours
  status: 'scheduled' | 'in_progress' | 'completed' | 'delayed';
  priority: number;
  assignedBrewer?: {
    id: string;
    name: string;
  };
}

export interface ScheduleConflict {
  date: Date;
  conflicts: {
    batch1: string;
    batch2: string;
    reason: string;
  }[];
}

// Fermentation Tracking Types
export interface FermentationSummary {
  batchId: string;
  batchNumber: string;
  recipe: string;
  currentPhase: 'primary' | 'secondary' | 'conditioning';
  daysInFermentation: number;
  currentTemperature: number;
  currentGravity?: number;
  targetGravity: number;
  estimatedCompletion: Date;
  alerts: FermentationAlert[];
}

export interface FermentationAlert {
  type: 'temperature' | 'gravity' | 'time' | 'ph';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: Date;
}

// Quality Control Types
export interface QualityMetrics {
  batchId: string;
  overallScore: number;
  visualScore: number;
  tasteScore: number;
  aromaScore: number;
  gravityAccuracy: number;
  phLevel: number;
  microbiologicalPass: boolean;
  notes: string[];
}

export interface QualityTrend {
  metric: string;
  values: {
    date: Date;
    value: number;
    batchId: string;
  }[];
  trend: 'improving' | 'declining' | 'stable';
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Filter and Query Types
export interface RecipeFilters {
  style?: string;
  isActive?: boolean;
  targetABVMin?: number;
  targetABVMax?: number;
  targetIBUMin?: number;
  targetIBUMax?: number;
}

export interface BatchFilters {
  status?: BatchStatus | BatchStatus[];
  recipeId?: string;
  brewerId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface QueryOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Error Types
export class ProductionServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'ProductionServiceError';
  }
}

export class ValidationError extends ProductionServiceError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends ProductionServiceError {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends ProductionServiceError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409);
    this.name = 'ConflictError';
  }
}