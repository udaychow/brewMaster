import { Router } from 'express';
import { QualityController } from '../controllers/quality.controller';
import { 
  validate,
  createQualityCheckSchema,
  updateQualityCheckSchema,
  uuidParamSchema,
  queryOptionsSchema
} from '../middleware/validation.middleware';

const router = Router();
const qualityController = new QualityController();

// Quality check CRUD routes
router.post('/',
  validate.body(createQualityCheckSchema),
  qualityController.createQualityCheck
);

router.post('/automated',
  qualityController.performAutomatedQualityCheck
);

router.post('/from-template',
  qualityController.createFromTemplate
);

router.get('/statistics',
  qualityController.getQualityStatistics
);

router.get('/trends',
  qualityController.getQualityTrends
);

router.get('/failed',
  qualityController.getFailedChecks
);

router.get('/dashboard',
  qualityController.getQualityDashboard
);

router.get('/templates',
  qualityController.getQualityCheckTemplates
);

router.get('/batch/:batchId',
  validate.query(queryOptionsSchema),
  qualityController.getQualityChecks
);

router.get('/batch/:batchId/metrics',
  qualityController.getQualityMetrics
);

router.get('/batch/:batchId/checklist',
  qualityController.generateQualityChecklist
);

router.get('/batch/:batchId/export',
  qualityController.exportQualityData
);

router.get('/:id',
  validate.params(uuidParamSchema),
  qualityController.getQualityCheckById
);

router.patch('/:id',
  validate.params(uuidParamSchema),
  validate.body(updateQualityCheckSchema),
  qualityController.updateQualityCheck
);

router.delete('/:id',
  validate.params(uuidParamSchema),
  qualityController.deleteQualityCheck
);

export default router;