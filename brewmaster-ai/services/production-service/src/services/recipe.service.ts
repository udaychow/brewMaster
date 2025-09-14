import { Recipe } from '@brewmaster/database';
import prisma from '../config/database';
import {
  CreateRecipeRequest,
  UpdateRecipeRequest,
  RecipeWithDetails,
  RecipeFilters,
  QueryOptions,
  NotFoundError,
  ConflictError
} from '../types';

export class RecipeService {
  /**
   * Create a new recipe
   */
  async createRecipe(data: CreateRecipeRequest): Promise<Recipe> {
    // Check if recipe name already exists
    const existingRecipe = await prisma.recipe.findUnique({
      where: { name: data.name }
    });

    if (existingRecipe) {
      throw new ConflictError(`Recipe with name '${data.name}' already exists`);
    }

    const recipe = await prisma.recipe.create({
      data: {
        name: data.name,
        style: data.style,
        description: data.description,
        targetVolume: data.targetVolume,
        targetABV: data.targetABV,
        targetIBU: data.targetIBU,
        grainBill: data.grainBill,
        hopSchedule: data.hopSchedule,
        yeastStrain: data.yeastStrain,
        fermentationTemp: data.fermentationTemp,
        estimatedDays: data.estimatedDays
      }
    });

    return recipe;
  }

  /**
   * Get all recipes with optional filtering and pagination
   */
  async getRecipes(
    filters: RecipeFilters = {},
    options: QueryOptions = {}
  ): Promise<{ recipes: RecipeWithDetails[]; total: number }> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (filters.style) {
      where.style = {
        contains: filters.style,
        mode: 'insensitive'
      };
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.targetABVMin !== undefined || filters.targetABVMax !== undefined) {
      where.targetABV = {};
      if (filters.targetABVMin !== undefined) {
        where.targetABV.gte = filters.targetABVMin;
      }
      if (filters.targetABVMax !== undefined) {
        where.targetABV.lte = filters.targetABVMax;
      }
    }

    if (filters.targetIBUMin !== undefined || filters.targetIBUMax !== undefined) {
      where.targetIBU = {};
      if (filters.targetIBUMin !== undefined) {
        where.targetIBU.gte = filters.targetIBUMin;
      }
      if (filters.targetIBUMax !== undefined) {
        where.targetIBU.lte = filters.targetIBUMax;
      }
    }

    // Execute queries in parallel
    const [recipes, total] = await Promise.all([
      prisma.recipe.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          batches: {
            select: {
              id: true,
              batchNumber: true,
              status: true,
              plannedDate: true,
              brewDate: true,
              volume: true
            },
            orderBy: { createdAt: 'desc' },
            take: 5 // Only include last 5 batches
          }
        }
      }),
      prisma.recipe.count({ where })
    ]);

    return { recipes, total };
  }

  /**
   * Get recipe by ID
   */
  async getRecipeById(id: string): Promise<RecipeWithDetails> {
    const recipe = await prisma.recipe.findUnique({
      where: { id },
      include: {
        batches: {
          select: {
            id: true,
            batchNumber: true,
            status: true,
            plannedDate: true,
            brewDate: true,
            volume: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!recipe) {
      throw new NotFoundError('Recipe', id);
    }

    return recipe;
  }

  /**
   * Update recipe
   */
  async updateRecipe(id: string, data: UpdateRecipeRequest): Promise<Recipe> {
    // Check if recipe exists
    const existingRecipe = await prisma.recipe.findUnique({
      where: { id }
    });

    if (!existingRecipe) {
      throw new NotFoundError('Recipe', id);
    }

    // Check for name conflicts if name is being updated
    if (data.name && data.name !== existingRecipe.name) {
      const nameConflict = await prisma.recipe.findUnique({
        where: { name: data.name }
      });

      if (nameConflict) {
        throw new ConflictError(`Recipe with name '${data.name}' already exists`);
      }
    }

    const recipe = await prisma.recipe.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.style && { style: data.style }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.targetVolume && { targetVolume: data.targetVolume }),
        ...(data.targetABV && { targetABV: data.targetABV }),
        ...(data.targetIBU && { targetIBU: data.targetIBU }),
        ...(data.grainBill && { grainBill: data.grainBill }),
        ...(data.hopSchedule && { hopSchedule: data.hopSchedule }),
        ...(data.yeastStrain && { yeastStrain: data.yeastStrain }),
        ...(data.fermentationTemp && { fermentationTemp: data.fermentationTemp }),
        ...(data.estimatedDays && { estimatedDays: data.estimatedDays }),
        ...(data.isActive !== undefined && { isActive: data.isActive })
      }
    });

    return recipe;
  }

  /**
   * Delete recipe (soft delete by setting isActive to false)
   */
  async deleteRecipe(id: string): Promise<void> {
    const recipe = await prisma.recipe.findUnique({
      where: { id },
      include: {
        batches: {
          where: {
            status: {
              in: ['PLANNED', 'BREWING', 'FERMENTING', 'CONDITIONING']
            }
          }
        }
      }
    });

    if (!recipe) {
      throw new NotFoundError('Recipe', id);
    }

    // Check if recipe has active batches
    if (recipe.batches.length > 0) {
      throw new ConflictError('Cannot delete recipe with active batches');
    }

    await prisma.recipe.update({
      where: { id },
      data: { isActive: false }
    });
  }

  /**
   * Get recipe statistics
   */
  async getRecipeStatistics(id: string): Promise<{
    totalBatches: number;
    completedBatches: number;
    averageABV: number | null;
    averageIBU: number | null;
    successRate: number;
  }> {
    const recipe = await prisma.recipe.findUnique({
      where: { id },
      include: {
        batches: {
          include: {
            qualityChecks: true
          }
        }
      }
    });

    if (!recipe) {
      throw new NotFoundError('Recipe', id);
    }

    const totalBatches = recipe.batches.length;
    const completedBatches = recipe.batches.filter(b => b.status === 'COMPLETED').length;
    
    const avgABV = recipe.batches.length > 0 
      ? recipe.batches.reduce((sum, batch) => sum + (batch.abv || 0), 0) / recipe.batches.length
      : null;

    const avgIBU = recipe.batches.length > 0
      ? recipe.batches.reduce((sum, batch) => sum + (batch.ibu || 0), 0) / recipe.batches.length
      : null;

    // Calculate success rate based on quality checks
    let successfulBatches = 0;
    for (const batch of recipe.batches) {
      const qualityChecks = batch.qualityChecks;
      const allPassed = qualityChecks.length > 0 && qualityChecks.every(qc => qc.passed);
      if (allPassed) successfulBatches++;
    }

    const successRate = completedBatches > 0 ? (successfulBatches / completedBatches) * 100 : 0;

    return {
      totalBatches,
      completedBatches,
      averageABV: avgABV,
      averageIBU: avgIBU,
      successRate
    };
  }

  /**
   * Clone a recipe
   */
  async cloneRecipe(id: string, newName: string): Promise<Recipe> {
    const originalRecipe = await this.getRecipeById(id);

    // Check if new name already exists
    const existingRecipe = await prisma.recipe.findUnique({
      where: { name: newName }
    });

    if (existingRecipe) {
      throw new ConflictError(`Recipe with name '${newName}' already exists`);
    }

    const clonedRecipe = await prisma.recipe.create({
      data: {
        name: newName,
        style: originalRecipe.style,
        description: `Cloned from ${originalRecipe.name}`,
        targetVolume: originalRecipe.targetVolume,
        targetABV: originalRecipe.targetABV,
        targetIBU: originalRecipe.targetIBU,
        grainBill: originalRecipe.grainBill,
        hopSchedule: originalRecipe.hopSchedule,
        yeastStrain: originalRecipe.yeastStrain,
        fermentationTemp: originalRecipe.fermentationTemp,
        estimatedDays: originalRecipe.estimatedDays
      }
    });

    return clonedRecipe;
  }

  /**
   * Get popular recipes based on batch count
   */
  async getPopularRecipes(limit: number = 10): Promise<RecipeWithDetails[]> {
    const recipes = await prisma.recipe.findMany({
      where: { isActive: true },
      include: {
        batches: {
          select: {
            id: true,
            batchNumber: true,
            status: true,
            plannedDate: true,
            brewDate: true,
            volume: true
          }
        }
      },
      orderBy: {
        batches: {
          _count: 'desc'
        }
      },
      take: limit
    });

    return recipes;
  }
}