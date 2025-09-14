import { Request, Response } from 'express';
import { RecipeService } from '../services/recipe.service';
import { 
  CreateRecipeRequest,
  UpdateRecipeRequest,
  RecipeFilters,
  QueryOptions,
  ApiResponse,
  PaginatedResponse
} from '../types';
import { asyncHandler } from '../middleware/error.middleware';

export class RecipeController {
  private recipeService: RecipeService;

  constructor() {
    this.recipeService = new RecipeService();
  }

  /**
   * Create a new recipe
   * POST /api/production/recipes
   */
  createRecipe = asyncHandler(async (req: Request, res: Response) => {
    const recipeData: CreateRecipeRequest = req.body;
    
    const recipe = await this.recipeService.createRecipe(recipeData);

    const response: ApiResponse<typeof recipe> = {
      success: true,
      data: recipe,
      message: 'Recipe created successfully'
    };

    res.status(201).json(response);
  });

  /**
   * Get all recipes with filtering and pagination
   * GET /api/production/recipes
   */
  getRecipes = asyncHandler(async (req: Request, res: Response) => {
    const filters: RecipeFilters = {
      style: req.query.style as string,
      isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
      targetABVMin: req.query.targetABVMin ? parseFloat(req.query.targetABVMin as string) : undefined,
      targetABVMax: req.query.targetABVMax ? parseFloat(req.query.targetABVMax as string) : undefined,
      targetIBUMin: req.query.targetIBUMin ? parseFloat(req.query.targetIBUMin as string) : undefined,
      targetIBUMax: req.query.targetIBUMax ? parseFloat(req.query.targetIBUMax as string) : undefined
    };

    const options: QueryOptions = {
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      sortBy: req.query.sortBy as string || 'createdAt',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc'
    };

    const { recipes, total } = await this.recipeService.getRecipes(filters, options);

    const response: PaginatedResponse<typeof recipes[0]> = {
      success: true,
      data: recipes,
      pagination: {
        page: options.page!,
        limit: options.limit!,
        total,
        totalPages: Math.ceil(total / options.limit!)
      }
    };

    res.json(response);
  });

  /**
   * Get recipe by ID
   * GET /api/production/recipes/:id
   */
  getRecipeById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const recipe = await this.recipeService.getRecipeById(id);

    const response: ApiResponse<typeof recipe> = {
      success: true,
      data: recipe,
      message: 'Recipe retrieved successfully'
    };

    res.json(response);
  });

  /**
   * Update recipe
   * PATCH /api/production/recipes/:id
   */
  updateRecipe = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData: UpdateRecipeRequest = req.body;

    const recipe = await this.recipeService.updateRecipe(id, updateData);

    const response: ApiResponse<typeof recipe> = {
      success: true,
      data: recipe,
      message: 'Recipe updated successfully'
    };

    res.json(response);
  });

  /**
   * Delete recipe (soft delete)
   * DELETE /api/production/recipes/:id
   */
  deleteRecipe = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    await this.recipeService.deleteRecipe(id);

    const response: ApiResponse<null> = {
      success: true,
      data: null,
      message: 'Recipe deleted successfully'
    };

    res.json(response);
  });

  /**
   * Get recipe statistics
   * GET /api/production/recipes/:id/statistics
   */
  getRecipeStatistics = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const statistics = await this.recipeService.getRecipeStatistics(id);

    const response: ApiResponse<typeof statistics> = {
      success: true,
      data: statistics,
      message: 'Recipe statistics retrieved successfully'
    };

    res.json(response);
  });

  /**
   * Clone recipe
   * POST /api/production/recipes/:id/clone
   */
  cloneRecipe = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'New recipe name is required'
      });
    }

    const clonedRecipe = await this.recipeService.cloneRecipe(id, name);

    const response: ApiResponse<typeof clonedRecipe> = {
      success: true,
      data: clonedRecipe,
      message: 'Recipe cloned successfully'
    };

    res.status(201).json(response);
  });

  /**
   * Get popular recipes
   * GET /api/production/recipes/popular
   */
  getPopularRecipes = asyncHandler(async (req: Request, res: Response) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const recipes = await this.recipeService.getPopularRecipes(limit);

    const response: ApiResponse<typeof recipes> = {
      success: true,
      data: recipes,
      message: 'Popular recipes retrieved successfully'
    };

    res.json(response);
  });

  /**
   * Get recipe styles (unique styles from all recipes)
   * GET /api/production/recipes/styles
   */
  getRecipeStyles = asyncHandler(async (req: Request, res: Response) => {
    // This would typically be cached or stored separately
    const { recipes } = await this.recipeService.getRecipes({ isActive: true }, { limit: 1000 });
    
    const styles = [...new Set(recipes.map(recipe => recipe.style))].sort();

    const response: ApiResponse<string[]> = {
      success: true,
      data: styles,
      message: 'Recipe styles retrieved successfully'
    };

    res.json(response);
  });

  /**
   * Export recipe data
   * GET /api/production/recipes/:id/export
   */
  exportRecipe = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const format = req.query.format as string || 'json';

    const recipe = await this.recipeService.getRecipeById(id);

    if (format === 'beerxml') {
      // Convert to BeerXML format
      const beerXml = this.convertToBeerXML(recipe);
      
      res.set({
        'Content-Type': 'application/xml',
        'Content-Disposition': `attachment; filename="${recipe.name}.xml"`
      });
      
      res.send(beerXml);
    } else if (format === 'pdf') {
      // Generate PDF (would need PDF library)
      res.status(501).json({
        success: false,
        error: 'NOT_IMPLEMENTED',
        message: 'PDF export not yet implemented'
      });
    } else {
      // Default JSON export
      res.set({
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${recipe.name}.json"`
      });
      
      res.json(recipe);
    }
  });

  /**
   * Import recipe data
   * POST /api/production/recipes/import
   */
  importRecipe = asyncHandler(async (req: Request, res: Response) => {
    const { format, data } = req.body;

    if (!format || !data) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Format and data are required'
      });
    }

    let recipeData: CreateRecipeRequest;

    try {
      if (format === 'beerxml') {
        recipeData = this.parseFromBeerXML(data);
      } else if (format === 'json') {
        recipeData = typeof data === 'string' ? JSON.parse(data) : data;
      } else {
        return res.status(400).json({
          success: false,
          error: 'UNSUPPORTED_FORMAT',
          message: `Format '${format}' is not supported`
        });
      }

      const recipe = await this.recipeService.createRecipe(recipeData);

      const response: ApiResponse<typeof recipe> = {
        success: true,
        data: recipe,
        message: 'Recipe imported successfully'
      };

      res.status(201).json(response);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: 'IMPORT_ERROR',
        message: 'Failed to parse recipe data'
      });
    }
  });

  /**
   * Calculate recipe costs
   * GET /api/production/recipes/:id/costs
   */
  calculateRecipeCosts = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const volume = req.query.volume ? parseFloat(req.query.volume as string) : undefined;

    // This would integrate with inventory service for ingredient pricing
    const response: ApiResponse<any> = {
      success: false,
      error: 'NOT_IMPLEMENTED',
      message: 'Cost calculation requires integration with inventory service'
    };

    res.status(501).json(response);
  });

  /**
   * Helper methods for format conversion
   */
  private convertToBeerXML(recipe: any): string {
    // Simplified BeerXML conversion
    return `<?xml version="1.0" encoding="UTF-8"?>
<RECIPES>
  <RECIPE>
    <NAME>${recipe.name}</NAME>
    <VERSION>1</VERSION>
    <TYPE>All Grain</TYPE>
    <STYLE>
      <NAME>${recipe.style}</NAME>
    </STYLE>
    <BREWER>BrewMaster AI</BREWER>
    <BATCH_SIZE>${recipe.targetVolume}</BATCH_SIZE>
    <BOIL_SIZE>${recipe.targetVolume * 1.1}</BOIL_SIZE>
    <BOIL_TIME>60</BOIL_TIME>
    <EFFICIENCY>75</EFFICIENCY>
    <OG>${1.000 + (recipe.targetABV / 131.25) + 0.010}</OG>
    <FG>${1.000 + 0.010}</FG>
    <ABV>${recipe.targetABV}</ABV>
    <IBU>${recipe.targetIBU}</IBU>
    <FERMENTATION_TEMP>${recipe.fermentationTemp}</FERMENTATION_TEMP>
    <GRAINS>
      ${recipe.grainBill?.map((grain: any) => `
      <GRAIN>
        <NAME>${grain.name}</NAME>
        <AMOUNT>${grain.amount}</AMOUNT>
        <ORIGIN></ORIGIN>
        <TYPE>Grain</TYPE>
        <YIELD>80</YIELD>
        <COLOR>${grain.lovibond || 2}</COLOR>
      </GRAIN>`).join('') || ''}
    </GRAINS>
    <HOPS>
      ${recipe.hopSchedule?.map((hop: any) => `
      <HOP>
        <NAME>${hop.name}</NAME>
        <AMOUNT>${hop.amount}</AMOUNT>
        <ALPHA>${hop.alphaAcid || 5}</ALPHA>
        <USE>${hop.usage}</USE>
        <TIME>${hop.time}</TIME>
      </HOP>`).join('') || ''}
    </HOPS>
    <YEASTS>
      <YEAST>
        <NAME>${recipe.yeastStrain}</NAME>
        <VERSION>1</VERSION>
        <TYPE>Ale</TYPE>
        <FORM>Liquid</FORM>
        <AMOUNT>1</AMOUNT>
      </YEAST>
    </YEASTS>
  </RECIPE>
</RECIPES>`;
  }

  private parseFromBeerXML(xmlData: string): CreateRecipeRequest {
    // Simplified BeerXML parsing - in production, use proper XML parser
    throw new Error('BeerXML parsing not implemented - requires XML parser library');
  }
}