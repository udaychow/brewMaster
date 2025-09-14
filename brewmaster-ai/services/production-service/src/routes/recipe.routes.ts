import { Router } from 'express';
import { RecipeController } from '../controllers/recipe.controller';
import { 
  validate,
  createRecipeSchema,
  updateRecipeSchema,
  uuidParamSchema,
  queryOptionsSchema,
  recipeFiltersSchema,
  validateBusinessRules
} from '../middleware/validation.middleware';

const router = Router();
const recipeController = new RecipeController();

// Recipe CRUD routes
router.post('/',
  validate.body(createRecipeSchema),
  validateBusinessRules.recipeGrainBill,
  validateBusinessRules.fermentationTemp,
  recipeController.createRecipe
);

router.get('/',
  validate.query(queryOptionsSchema.concat(recipeFiltersSchema)),
  recipeController.getRecipes
);

router.get('/popular',
  recipeController.getPopularRecipes
);

router.get('/styles',
  recipeController.getRecipeStyles
);

router.post('/import',
  recipeController.importRecipe
);

router.get('/:id',
  validate.params(uuidParamSchema),
  recipeController.getRecipeById
);

router.patch('/:id',
  validate.params(uuidParamSchema),
  validate.body(updateRecipeSchema),
  validateBusinessRules.recipeGrainBill,
  validateBusinessRules.fermentationTemp,
  recipeController.updateRecipe
);

router.delete('/:id',
  validate.params(uuidParamSchema),
  recipeController.deleteRecipe
);

// Recipe statistics and analytics
router.get('/:id/statistics',
  validate.params(uuidParamSchema),
  recipeController.getRecipeStatistics
);

router.get('/:id/costs',
  validate.params(uuidParamSchema),
  recipeController.calculateRecipeCosts
);

// Recipe operations
router.post('/:id/clone',
  validate.params(uuidParamSchema),
  recipeController.cloneRecipe
);

router.get('/:id/export',
  validate.params(uuidParamSchema),
  recipeController.exportRecipe
);

export default router;