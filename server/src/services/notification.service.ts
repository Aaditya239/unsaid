import webpush from 'web-push';
import prisma from '../utils/prisma';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Configure Web Push
webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:support@unsaid.app',
    process.env.VAPID_PUBLIC_KEY || '',
    process.env.VAPID_PRIVATE_KEY || ''
);

export const NotificationService = {
    /**
     * Register or update a push subscription
     */
    subscribe: async (userId: string, subscription: any) => {
        return prisma.pushSubscription.upsert({
            where: { endpoint: subscription.endpoint },
            create: {
                userId,
                endpoint: subscription.endpoint,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
            },
            update: {
                userId,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
            },
        });
    },

    /**
     * Unsubscribe a device
     */
    unsubscribe: async (endpoint: string) => {
        return prisma.pushSubscription.delete({
            where: { endpoint },
        });
    },

    /**
     * Send a notification to a specific user across all their devices
     * This is for Web Push
     */
    sendPush: async (userId: string, title: string, body: string, icon = '/icons/icon-192x192.png') => {
        const subscriptions = await prisma.pushSubscription.findMany({
            where: { userId },
        });

        const payload = JSON.stringify({
            title,
            body,
            icon,
            badge: '/icons/badge-72x72.png',
            timestamp: Date.now(),
        });

        const results = await Promise.allSettled(
            subscriptions.map(sub =>
                webpush.sendNotification(
                    {
                        endpoint: sub.endpoint,
                        keys: {
                            p256dh: sub.p256dh,
                            auth: sub.auth,
                        }
                    },
                    payload
                ).catch(async (err) => {
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        // Subscription expired or no longer valid
                        await prisma.pushSubscription.delete({ where: { id: sub.id } });
                    }
                    throw err;
                })
            )
        );

        return results;
    },

    /**
     * Create an in-app notification
     */
    createInApp: async (userId: string, title: string, message: string) => {
        try {
            return await prisma.notification.create({
                data: {
                    userId,
                    title,
                    message,
                },
            });
        } catch (error) {
            console.error('Error creating in-app notification:', error);
            return null;
        }
    },

    /**
     * Helper to send both push and in-app notifications
     */
    notify: async (userId: string, title: string, message: string) => {
        await Promise.all([
            NotificationService.sendPush(userId, title, message),
            NotificationService.createInApp(userId, title, message)
        ]);
    },

    /**
     * Get or create notification preferences for a user
     */
    getPreferences: async (userId: string) => {
        let prefs = await prisma.notificationPreference.findUnique({
            where: { userId },
        });

        if (!prefs) {
            prefs = await prisma.notificationPreference.create({
                data: { userId },
            });
        }

        return prefs;
    },

    /**
     * Update notification preferences
     */
    updatePreferences: async (userId: string, data: any) => {
        return prisma.notificationPreference.upsert({
            where: { userId },
            create: { ...data, userId },
            update: data,
        });
    },

    /**
     * Get notifications for a user
     */
    getUserNotifications: async (userId: string, limit: number = 20) => {
        return await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    },

    /**
     * Get unread count for a user
     */
    getUnreadCount: async (userId: string) => {
        return await prisma.notification.count({
            where: {
                userId,
                isRead: false,
            },
        });
    },

    /**
     * Mark a notification as read
     */
    markAsRead: async (notificationId: string, userId: string) => {
        return await prisma.notification.updateMany({
            where: {
                id: notificationId,
                userId,
            },
            data: {
                isRead: true,
            },
        });
    },

    /**
     * Mark all notifications as read
     */
    markAllAsRead: async (userId: string) => {
        return await prisma.notification.updateMany({
            where: {
                userId,
                isRead: false,
            },
            data: {
                isRead: true,
            },
        });
    },

    /**
     * Generate a supportive nudge using Groq
     */
    generateAiNudge: async (mood?: string, userName?: string) => {
        try {
            const prompt = `Generate a short, gentle, and familiar emotional support notification for a user.
      User Name: ${userName || 'User'}
      Current/Recent Mood: ${mood || 'Not logged'}
      
      Requirements:
      - Max 120 characters.
      - Tone: Safe, familiar, supportive.
      - Avoid crisis language.
      - Return plain text only. No quotes.`;

            const response = await groq.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: 'llama-3.3-70b-versatile',
                max_tokens: 50,
            });

            return response.choices[0]?.message?.content?.trim() || "What's on your mind? I'm here to listen.";
        } catch (error) {
            console.error('AI Nudge Generation Error:', error);
            return "Taking a moment for yourself? I'm here if you want to chat.";
        }
    }
};

export default NotificationService;
