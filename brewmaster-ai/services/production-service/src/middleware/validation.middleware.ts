import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from '../types';

// Recipe validation schemas
export const createRecipeSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  style: Joi.string().min(2).max(50).required(),
  description: Joi.string().max(500).optional(),
  targetVolume: Joi.number().positive().max(10000).required(),
  targetABV: Joi.number().min(0).max(20).required(),
  targetIBU: Joi.number().min(0).max(120).required(),
  grainBill: Joi.array().items(
    Joi.object({
      ingredientId: Joi.string().uuid().required(),
      name: Joi.string().required(),
      amount: Joi.number().positive().required(),
      unit: Joi.string().valid('lbs', 'kg', 'oz', 'g').required(),
      lovibond: Joi.number().min(0).optional(),
      potential: Joi.number().min(1.000).max(1.100).optional()
    })
  ).min(1).required(),
  hopSchedule: Joi.array().items(
    Joi.object({
      ingredientId: Joi.string().uuid().required(),
      name: Joi.string().required(),
      amount: Joi.number().positive().required(),
      unit: Joi.string().valid('oz', 'g', 'lbs', 'kg').required(),
      time: Joi.number().min(0).max(120).required(),
      usage: Joi.string().valid('boil', 'whirlpool', 'dry-hop').required(),
      alphaAcid: Joi.number().min(0).max(25).optional()
    })
  ).min(0).required(),
  yeastStrain: Joi.string().min(2).max(100).required(),
  fermentationTemp: Joi.number().min(32).max(85).required(),
  estimatedDays: Joi.number().integer().min(1).max(365).required()
});

export const updateRecipeSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  style: Joi.string().min(2).max(50).optional(),
  description: Joi.string().max(500).optional(),
  targetVolume: Joi.number().positive().max(10000).optional(),
  targetABV: Joi.number().min(0).max(20).optional(),
  targetIBU: Joi.number().min(0).max(120).optional(),
  grainBill: Joi.array().items(
    Joi.object({
      ingredientId: Joi.string().uuid().required(),
      name: Joi.string().required(),
      amount: Joi.number().positive().required(),
      unit: Joi.string().valid('lbs', 'kg', 'oz', 'g').required(),
      lovibond: Joi.number().min(0).optional(),
      potential: Joi.number().min(1.000).max(1.100).optional()
    })
  ).min(1).optional(),
  hopSchedule: Joi.array().items(
    Joi.object({
      ingredientId: Joi.string().uuid().required(),
      name: Joi.string().required(),
      amount: Joi.number().positive().required(),
      unit: Joi.string().valid('oz', 'g', 'lbs', 'kg').required(),
      time: Joi.number().min(0).max(120).required(),
      usage: Joi.string().valid('boil', 'whirlpool', 'dry-hop').required(),
      alphaAcid: Joi.number().min(0).max(25).optional()
    })
  ).min(0).optional(),
  yeastStrain: Joi.string().min(2).max(100).optional(),
  fermentationTemp: Joi.number().min(32).max(85).optional(),
  estimatedDays: Joi.number().integer().min(1).max(365).optional(),
  isActive: Joi.boolean().optional()
});

// Batch validation schemas
export const createBatchSchema = Joi.object({
  recipeId: Joi.string().uuid().required(),
  brewerId: Joi.string().uuid().required(),
  plannedDate: Joi.date().iso().min('now').required(),
  volume: Joi.number().positive().max(10000).required(),
  notes: Joi.string().max(1000).optional()
});

export const updateBatchSchema = Joi.object({
  status: Joi.string().valid('PLANNED', 'BREWING', 'FERMENTING', 'CONDITIONING', 'PACKAGING', 'COMPLETED', 'CANCELLED').optional(),
  brewDate: Joi.date().iso().optional(),
  volume: Joi.number().positive().max(10000).optional(),
  originalGravity: Joi.number().min(1.000).max(1.200).optional(),
  finalGravity: Joi.number().min(0.990).max(1.050).optional(),
  abv: Joi.number().min(0).max(20).optional(),
  ibu: Joi.number().min(0).max(120).optional(),
  notes: Joi.string().max(1000).optional()
});

// Fermentation log validation schemas
export const createFermentationLogSchema = Joi.object({
  batchId: Joi.string().uuid().required(),
  temperature: Joi.number().min(32).max(100).required(),
  gravity: Joi.number().min(0.990).max(1.200).optional(),
  pH: Joi.number().min(3.0).max(5.0).optional(),
  notes: Joi.string().max(500).optional()
});

export const updateFermentationLogSchema = Joi.object({
  temperature: Joi.number().min(32).max(100).optional(),
  gravity: Joi.number().min(0.990).max(1.200).optional(),
  pH: Joi.number().min(3.0).max(5.0).optional(),
  notes: Joi.string().max(500).optional()
});

// Quality check validation schemas
export const createQualityCheckSchema = Joi.object({
  batchId: Joi.string().uuid().required(),
  inspectorId: Joi.string().uuid().required(),
  checkType: Joi.string().min(2).max(50).required(),
  passed: Joi.boolean().required(),
  parameters: Joi.object().required(),
  notes: Joi.string().max(1000).optional()
});

export const updateQualityCheckSchema = Joi.object({
  checkType: Joi.string().min(2).max(50).optional(),
  passed: Joi.boolean().optional(),
  parameters: Joi.object().optional(),
  notes: Joi.string().max(1000).optional()
});

// Query parameter schemas
export const queryOptionsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

export const recipeFiltersSchema = Joi.object({
  style: Joi.string().optional(),
  isActive: Joi.boolean().optional(),
  targetABVMin: Joi.number().min(0).max(20).optional(),
  targetABVMax: Joi.number().min(0).max(20).optional(),
  targetIBUMin: Joi.number().min(0).max(120).optional(),
  targetIBUMax: Joi.number().min(0).max(120).optional()
}).and('targetABVMin', 'targetABVMax').and('targetIBUMin', 'targetIBUMax');

export const batchFiltersSchema = Joi.object({
  status: Joi.alternatives().try(
    Joi.string().valid('PLANNED', 'BREWING', 'FERMENTING', 'CONDITIONING', 'PACKAGING', 'COMPLETED', 'CANCELLED'),
    Joi.array().items(Joi.string().valid('PLANNED', 'BREWING', 'FERMENTING', 'CONDITIONING', 'PACKAGING', 'COMPLETED', 'CANCELLED'))
  ).optional(),
  recipeId: Joi.string().uuid().optional(),
  brewerId: Joi.string().uuid().optional(),
  dateFrom: Joi.date().iso().optional(),
  dateTo: Joi.date().iso().optional()
}).and('dateFrom', 'dateTo');

// UUID parameter schema
export const uuidParamSchema = Joi.object({
  id: Joi.string().uuid().required()
});

// Date range schema
export const dateRangeSchema = Joi.object({
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
  brewerId: Joi.string().uuid().optional()
});

// Scheduling schemas
export const scheduleBatchSchema = Joi.object({
  recipeId: Joi.string().uuid().required(),
  brewerId: Joi.string().uuid().required(),
  preferredDate: Joi.date().iso().min('now').required(),
  volume: Joi.number().positive().max(10000).required()
});

export const rescheduleBatchSchema = Joi.object({
  newDate: Joi.date().iso().min('now').required(),
  reason: Joi.string().max(500).optional()
});

// Validation middleware factory
export const validateBody = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const validationError = new ValidationError(
        error.details.map(detail => detail.message).join(', ')
      );
      return next(validationError);
    }

    req.body = value;
    next();
  };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const validationError = new ValidationError(
        error.details.map(detail => detail.message).join(', ')
      );
      return next(validationError);
    }

    req.query = value;
    next();
  };
};

export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const validationError = new ValidationError(
        error.details.map(detail => detail.message).join(', ')
      );
      return next(validationError);
    }

    req.params = value;
    next();
  };
};

// Combined validation middleware
export const validate = {
  body: validateBody,
  query: validateQuery,
  params: validateParams
};

// Custom validation functions
export const validateBatchStatusTransition = (currentStatus: string, newStatus: string): boolean => {
  const validTransitions: Record<string, string[]> = {
    'PLANNED': ['BREWING', 'CANCELLED'],
    'BREWING': ['FERMENTING', 'CANCELLED'],
    'FERMENTING': ['CONDITIONING', 'CANCELLED'],
    'CONDITIONING': ['PACKAGING', 'CANCELLED'],
    'PACKAGING': ['COMPLETED', 'CANCELLED'],
    'COMPLETED': [],
    'CANCELLED': []
  };

  return validTransitions[currentStatus]?.includes(newStatus) || false;
};

export const validateGravitySequence = (originalGravity: number, finalGravity: number): boolean => {
  return finalGravity < originalGravity && finalGravity >= 0.990;
};

export const validateABVCalculation = (originalGravity: number, finalGravity: number, abv: number): boolean => {
  const calculatedABV = (originalGravity - finalGravity) * 131.25;
  const tolerance = 0.5; // Allow 0.5% tolerance
  return Math.abs(calculatedABV - abv) <= tolerance;
};

// Sanitization functions
export const sanitizeString = (str: string): string => {
  return str.trim().replace(/[<>]/g, '');
};

export const sanitizeNumericString = (str: string): string => {
  return str.replace(/[^0-9.-]/g, '');
};

// Custom validation middleware for complex business rules
export const validateBusinessRules = {
  // Ensure recipe has valid grain bill ratios
  recipeGrainBill: (req: Request, res: Response, next: NextFunction) => {
    const { grainBill } = req.body;
    
    if (grainBill && Array.isArray(grainBill)) {
      const totalWeight = grainBill.reduce((sum: number, grain: any) => sum + grain.amount, 0);
      
      if (totalWeight === 0) {
        return next(new ValidationError('Grain bill must have at least one ingredient with positive weight'));
      }

      // Base malt should be at least 40% of total grain bill for most styles
      const baseMalts = grainBill.filter((grain: any) => 
        grain.name.toLowerCase().includes('base') || 
        grain.name.toLowerCase().includes('pale') ||
        grain.name.toLowerCase().includes('pilsner')
      );

      const baseMaltWeight = baseMalts.reduce((sum: number, grain: any) => sum + grain.amount, 0);
      const baseMaltPercentage = (baseMaltWeight / totalWeight) * 100;

      if (baseMaltPercentage < 30) {
        return next(new ValidationError('Recipe should have at least 30% base malt'));
      }
    }

    next();
  },

  // Ensure batch volume is within recipe capacity
  batchVolume: (req: Request, res: Response, next: NextFunction) => {
    const { volume } = req.body;
    
    // Add custom volume validation logic here
    if (volume > 1000) { // Example: no batches over 1000 gallons
      return next(new ValidationError('Batch volume cannot exceed 1000 gallons'));
    }

    next();
  },

  // Validate fermentation temperature for yeast strain
  fermentationTemp: (req: Request, res: Response, next: NextFunction) => {
    const { fermentationTemp, yeastStrain } = req.body;
    
    if (fermentationTemp && yeastStrain) {
      // Ale yeasts typically ferment at 60-75°F, lager yeasts at 45-55°F
      const isLager = yeastStrain.toLowerCase().includes('lager');
      
      if (isLager && (fermentationTemp > 58 || fermentationTemp < 45)) {
        return next(new ValidationError('Lager yeast temperature should be between 45-58°F'));
      }
      
      if (!isLager && (fermentationTemp > 78 || fermentationTemp < 60)) {
        return next(new ValidationError('Ale yeast temperature should be between 60-78°F'));
      }
    }

    next();
  }
};