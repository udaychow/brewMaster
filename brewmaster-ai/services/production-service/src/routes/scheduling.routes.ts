import { Router } from 'express';
import { Request, Response } from 'express';
import { SchedulingService } from '../services/scheduling.service';
import { 
  validate,
  dateRangeSchema,
  uuidParamSchema
} from '../middleware/validation.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { ApiResponse } from '../types';

const router = Router();
const schedulingService = new SchedulingService();

// Get production schedule for date range
router.get('/',
  validate.query(dateRangeSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate, brewerId } = req.query;

    const schedule = await schedulingService.getProductionSchedule(
      new Date(startDate as string),
      new Date(endDate as string),
      brewerId as string
    );

    const response: ApiResponse<typeof schedule> = {
      success: true,
      data: schedule,
      message: 'Production schedule retrieved successfully'
    };

    res.json(response);
  })
);

// Get brewing capacity for a specific date
router.get('/capacity',
  asyncHandler(async (req: Request, res: Response) => {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Date parameter is required'
      });
    }

    const capacity = await schedulingService.getBrewingCapacity(new Date(date as string));

    const response: ApiResponse<typeof capacity> = {
      success: true,
      data: capacity,
      message: 'Brewing capacity retrieved successfully'
    };

    res.json(response);
  })
);

// Check schedule conflicts
router.post('/conflicts',
  asyncHandler(async (req: Request, res: Response) => {
    const { date, brewerId } = req.body;

    if (!date || !brewerId) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Date and brewerId are required'
      });
    }

    const conflicts = await schedulingService.checkScheduleConflicts(
      new Date(date),
      brewerId
    );

    const response: ApiResponse<typeof conflicts> = {
      success: true,
      data: conflicts,
      message: 'Schedule conflicts checked successfully'
    };

    res.json(response);
  })
);

// Find optimal schedule date
router.post('/optimal-date',
  asyncHandler(async (req: Request, res: Response) => {
    const { preferredDate, brewerId, daysToLook = 7 } = req.body;

    if (!preferredDate || !brewerId) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'PreferredDate and brewerId are required'
      });
    }

    const optimalDate = await schedulingService.findOptimalScheduleDate(
      new Date(preferredDate),
      brewerId,
      daysToLook
    );

    const response: ApiResponse<{ optimalDate: Date }> = {
      success: true,
      data: { optimalDate },
      message: 'Optimal schedule date found successfully'
    };

    res.json(response);
  })
);

// Get weekly production summary
router.get('/weekly-summary',
  asyncHandler(async (req: Request, res: Response) => {
    const { weekStart } = req.query;

    if (!weekStart) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'WeekStart parameter is required'
      });
    }

    const summary = await schedulingService.getWeeklyProductionSummary(
      new Date(weekStart as string)
    );

    const response: ApiResponse<typeof summary> = {
      success: true,
      data: summary,
      message: 'Weekly production summary retrieved successfully'
    };

    res.json(response);
  })
);

export default router;