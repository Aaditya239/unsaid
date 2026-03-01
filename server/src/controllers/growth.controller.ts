import { Request, Response, NextFunction } from 'express';
import { GrowthService } from '../services/growth.service';

export const getWeeklyGrowth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const growth = await GrowthService.getWeeklyGrowth(userId);

    res.status(200).json({
      score: growth.score,
      delta: growth.delta,
      breakdown: growth.breakdown,
    });
  } catch (error) {
    next(error);
  }
};
