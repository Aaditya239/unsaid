import { Request, Response, NextFunction } from 'express';
import NotificationService from '../services/notification.service';
import { UnauthorizedError } from '../utils/appError';

export const getNotifications = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.user) throw UnauthorizedError('Authentication required');
        const userId = req.user.id;

        const notifications = await NotificationService.getUserNotifications(userId);
        const unreadCount = await NotificationService.getUnreadCount(userId);

        res.status(200).json({
            success: true,
            data: {
                notifications,
                unreadCount
            }
        });
    } catch (error) {
        next(error);
    }
};

export const markAsRead = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.user) throw UnauthorizedError('Authentication required');
        const { id } = req.params;
        const userId = req.user.id;

        await NotificationService.markAsRead(id, userId);

        res.status(200).json({
            success: true,
            message: 'Notification marked as read'
        });
    } catch (error) {
        next(error);
    }
};

export const markAllAsRead = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.user) throw UnauthorizedError('Authentication required');
        const userId = req.user.id;

        await NotificationService.markAllAsRead(userId);

        res.status(200).json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        next(error);
    }
};

export const getUnreadCount = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.user) throw UnauthorizedError('Authentication required');
        const userId = req.user.id;

        const unreadCount = await NotificationService.getUnreadCount(userId);

        res.status(200).json({
            success: true,
            data: { unreadCount }
        });
    } catch (error) {
        next(error);
    }
};
