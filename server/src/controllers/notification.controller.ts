import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service';
import { AppError } from '../utils/appError';

export const subscribeUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { subscription } = req.body;
        if (!subscription) {
            throw new AppError('Subscription object is required', 400);
        }

        await NotificationService.subscribe(req.user!.id, subscription);

        res.status(200).json({
            status: 'success',
            message: 'Push subscription saved'
        });
    } catch (error) {
        next(error);
    }
};

export const getNotificationPreferences = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const preferences = await NotificationService.getPreferences(req.user!.id);

        res.status(200).json({
            status: 'success',
            data: preferences
        });
    } catch (error) {
        next(error);
    }
};

export const updateNotificationPreferences = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const preferences = await NotificationService.updatePreferences(req.user!.id, req.body);

        res.status(200).json({
            status: 'success',
            data: preferences
        });
    } catch (error) {
        next(error);
    }
};
