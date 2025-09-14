import { Router } from 'express';
import { BatchController } from '../controllers/batch.controller';
import { 
  validate,
  createBatchSchema,
  updateBatchSchema,
  scheduleBatchSchema,
  rescheduleBatchSchema,
  uuidParamSchema,
  queryOptionsSchema,
  batchFiltersSchema,
  validateBusinessRules
} from '../middleware/validation.middleware';

const router = Router();
const batchController = new BatchController();

// Batch CRUD routes
router.post('/',
  validate.body(createBatchSchema),
  validateBusinessRules.batchVolume,
  batchController.createBatch
);

router.get('/',
  validate.query(queryOptionsSchema.concat(batchFiltersSchema)),
  batchController.getBatches
);

router.get('/statistics',
  batchController.getBatchStatistics
);

router.get('/summary',
  batchController.getBatchSummary
);

router.get('/overdue',
  batchController.getOverdueBatches
);

router.get('/dashboard/active',
  batchController.getActiveBatchesDashboard
);

router.post('/schedule',
  validate.body(scheduleBatchSchema),
  batchController.scheduleBatch
);

router.post('/calculate-abv',
  batchController.calculateABV
);

router.get('/status/:status',
  batchController.getBatchesByStatus
);

router.get('/:id',
  validate.params(uuidParamSchema),
  batchController.getBatchById
);

router.patch('/:id',
  validate.params(uuidParamSchema),
  validate.body(updateBatchSchema),
  batchController.updateBatch
);

router.delete('/:id',
  validate.params(uuidParamSchema),
  batchController.deleteBatch
);

// Batch operations
router.post('/:id/start',
  validate.params(uuidParamSchema),
  batchController.startBatch
);

router.post('/:id/complete-phase',
  validate.params(uuidParamSchema),
  batchController.completePhase
);

router.post('/:id/cancel',
  validate.params(uuidParamSchema),
  batchController.cancelBatch
);

router.get('/:id/timeline',
  validate.params(uuidParamSchema),
  batchController.getBatchTimeline
);

router.patch('/:id/reschedule',
  validate.params(uuidParamSchema),
  validate.body(rescheduleBatchSchema),
  batchController.rescheduleBatch
);

export default router;