export interface Recipe {
    id: string;
    name: string;
    description: string;
    beerStyle: string;
    targetABV: number;
    targetIBU: number;
    targetSRM: number;
    batchSize: number;
    ingredients: RecipeIngredient[];
    instructions: BrewingInstruction[];
    fermentationProfile: FermentationProfile;
    expectedYield: number;
    estimatedCost: number;
    difficulty: RecipeDifficulty;
    isActive: boolean;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface RecipeIngredient {
    id: string;
    ingredientId: string;
    quantity: number;
    unit: string;
    additionTime: AdditionTime;
    purpose: string;
}
export declare enum AdditionTime {
    MASH = "mash",
    FIRST_WORT = "first_wort",
    BOIL_60 = "boil_60",
    BOIL_30 = "boil_30",
    BOIL_15 = "boil_15",
    BOIL_5 = "boil_5",
    FLAMEOUT = "flameout",
    WHIRLPOOL = "whirlpool",
    FERMENTATION = "fermentation",
    DRY_HOP = "dry_hop"
}
export interface BrewingInstruction {
    step: number;
    phase: BrewingPhase;
    instruction: string;
    duration?: number;
    temperature?: number;
    notes?: string;
}
export declare enum BrewingPhase {
    PREPARATION = "preparation",
    MASHING = "mashing",
    LAUTERING = "lautering",
    BOILING = "boiling",
    COOLING = "cooling",
    FERMENTATION = "fermentation",
    CONDITIONING = "conditioning",
    PACKAGING = "packaging"
}
export interface FermentationProfile {
    primaryTemp: number;
    primaryDuration: number;
    secondaryTemp?: number;
    secondaryDuration?: number;
    yeastStrain: string;
    targetFG: number;
}
export declare enum RecipeDifficulty {
    BEGINNER = "beginner",
    INTERMEDIATE = "intermediate",
    ADVANCED = "advanced",
    EXPERT = "expert"
}
export interface BrewingSchedule {
    id: string;
    recipeId: string;
    batchId?: string;
    scheduledDate: Date;
    estimatedDuration: number;
    assignedBrewers: string[];
    equipmentRequired: string[];
    status: ScheduleStatus;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum ScheduleStatus {
    SCHEDULED = "scheduled",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
    RESCHEDULED = "rescheduled"
}
export interface Equipment {
    id: string;
    name: string;
    type: EquipmentType;
    capacity: number;
    unit: string;
    status: EquipmentStatus;
    maintenanceSchedule: MaintenanceSchedule;
    lastMaintenance?: Date;
    nextMaintenance: Date;
    location: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum EquipmentType {
    MASH_TUN = "mash_tun",
    KETTLE = "kettle",
    FERMENTER = "fermenter",
    BRIGHT_TANK = "bright_tank",
    HEAT_EXCHANGER = "heat_exchanger",
    PUMP = "pump",
    FILTER = "filter",
    KEGERATOR = "kegerator"
}
export declare enum EquipmentStatus {
    AVAILABLE = "available",
    IN_USE = "in_use",
    MAINTENANCE = "maintenance",
    OUT_OF_SERVICE = "out_of_service"
}
export interface MaintenanceSchedule {
    frequency: MaintenanceFrequency;
    interval: number;
    tasks: string[];
}
export declare enum MaintenanceFrequency {
    DAILY = "daily",
    WEEKLY = "weekly",
    MONTHLY = "monthly",
    QUARTERLY = "quarterly",
    ANNUALLY = "annually"
}
