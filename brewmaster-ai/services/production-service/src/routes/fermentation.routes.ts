import { Router } from 'express';
import { FermentationController } from '../controllers/fermentation.controller';
import { 
  validate,
  createFermentationLogSchema,
  updateFermentationLogSchema,
  uuidParamSchema,
  queryOptionsSchema
} from '../middleware/validation.middleware';

const router = Router();
const fermentationController = new FermentationController();

// Fermentation log CRUD routes
router.post('/',
  validate.body(createFermentationLogSchema),
  fermentationController.createFermentationLog
);

router.post('/bulk',
  fermentationController.bulkCreateLogs
);

router.get('/summary/active',
  fermentationController.getActiveFermentationSummary
);

router.get('/alerts',
  fermentationController.getFermentationAlerts
);

router.get('/statistics',
  fermentationController.getFermentationStatistics
);

router.get('/batch/:batchId',
  validate.query(queryOptionsSchema),
  fermentationController.getFermentationLogs
);

router.get('/batch/:batchId/trends',
  fermentationController.getFermentationTrends
);

router.get('/batch/:batchId/efficiency',
  fermentationController.getFermentationEfficiency
);

router.get('/batch/:batchId/latest',
  fermentationController.getLatestReading
);

router.get('/batch/:batchId/export',
  fermentationController.exportFermentationData
);

router.get('/:id',
  validate.params(uuidParamSchema),
  fermentationController.getFermentationLogById
);

router.patch('/:id',
  validate.params(uuidParamSchema),
  validate.body(updateFermentationLogSchema),
  fermentationController.updateFermentationLog
);

router.delete('/:id',
  validate.params(uuidParamSchema),
  fermentationController.deleteFermentationLog
);

export default router;