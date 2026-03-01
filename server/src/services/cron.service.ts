import cron from 'node-cron';
import prisma from '../utils/prisma';
import NotificationService from './notification.service';
import { isToday, subHours, isBefore } from 'date-fns';
import { GrowthService } from './growth.service';

export class CronService {
    /**
     * Initialize all cron jobs
     */
    static init() {
        console.log('[CRON] Initializing notification cron jobs...');

        // 1. Daily Journal Reminder (Every 15 minutes, 8 PM - 11 PM)
        cron.schedule('*/15 20-23 * * *', async () => {
            try {
                console.log('[CRON] Running daily journal reminder check...');
                await CronService.handleJournalReminders();
            } catch (error) {
                console.error('[CRON] Journal reminder failed:', error);
            }
        });

        // 2. Mood Tracking Reminder (Every 2 hours, 9 AM - 9 PM)
        cron.schedule('0 9-21/2 * * *', async () => {
            try {
                console.log('[CRON] Running mood check-in check...');
                await CronService.handleMoodReminders();
            } catch (error) {
                console.error('[CRON] Mood reminder failed:', error);
            }
        });

        // 3. AI Emotional Support Nudge (Every 4 hours, 10 AM - 10 PM)
        cron.schedule('0 10-22/4 * * *', async () => {
            try {
                console.log('[CRON] Running AI support nudge check...');
                await CronService.handleAiNudges();
            } catch (error) {
                console.error('[CRON] AI nudge failed:', error);
            }
        });

        // 4. Weekly Emotional Growth Recalculation (Monday 00:00)
        cron.schedule('0 0 * * 1', async () => {
            console.log('[CRON] Running weekly emotional growth recalculation...');
            await CronService.handleWeeklyGrowthRecalculation();
        });
    }

    /**
     * Handle Daily Journal Reminders
     */
    private static async handleJournalReminders() {
        const now = new Date();
        const users = await prisma.user.findMany({
            where: { isActive: true },
            include: {
                notificationPreferences: true,
                journalEntries: {
                    where: {
                        createdAt: {
                            gte: new Date(new Date().setHours(0, 0, 0, 0))
                        }
                    },
                    take: 1
                }
            }
        });

        for (const user of users) {
            const prefs = user.notificationPreferences;
            if (!prefs || !prefs.journalReminderEnabled) continue;

            const [prefHour, prefMin] = prefs.journalReminderTime.split(':').map(Number);
            const reminderTime = new Date();
            reminderTime.setHours(prefHour, prefMin, 0, 0);

            // Trigger if:
            // 1. Preferred time has passed
            // 2. No journal entry today
            // 3. Haven't sent a reminder today
            if (now >= reminderTime && user.journalEntries.length === 0) {
                const lastSent = prefs.lastJournalReminderSent;
                if (!lastSent || !isToday(lastSent)) {
                    await NotificationService.notify(
                        user.id,
                        'Journal Reminder 🖋',
                        'Taking a few minutes to write can clear your mind. How was your day?'
                    );

                    await prisma.notificationPreference.update({
                        where: { userId: user.id },
                        data: { lastJournalReminderSent: now }
                    });
                }
            }
        }
    }

    /**
     * Handle Mood Reminders
     */
    private static async handleMoodReminders() {
        const now = new Date();
        const users = await prisma.user.findMany({
            where: { isActive: true },
            include: {
                notificationPreferences: true,
                moodEntries: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });

        for (const user of users) {
            const prefs = user.notificationPreferences;
            if (!prefs || !prefs.moodReminderEnabled) continue;

            // Trigger if:
            // 1. Last mood was logged more than X hours ago
            // 2. Haven't sent a reminder in the last X hours
            const lastLog = user.moodEntries[0]?.createdAt;
            const lastSent = prefs.lastMoodReminderSent;
            const intervalHours = prefs.moodIntervalHours || 2;

            const shouldRemind = (!lastLog || isBefore(lastLog, subHours(now, intervalHours))) &&
                (!lastSent || isBefore(lastSent, subHours(now, intervalHours)));

            if (shouldRemind) {
                await NotificationService.notify(
                    user.id,
                    'Mood Check-in ✨',
                    'Quick moment for yourself. How are you feeling right now?'
                );

                await prisma.notificationPreference.update({
                    where: { userId: user.id },
                    data: { lastMoodReminderSent: now }
                });
            }
        }
    }

    /**
     * Handle AI Support Nudges
     */
    private static async handleAiNudges() {
        const now = new Date();
        const users = await prisma.user.findMany({
            where: { isActive: true },
            include: {
                notificationPreferences: true,
                moodEntries: {
                    where: {
                        createdAt: {
                            gte: subHours(now, 24)
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        for (const user of users) {
            const prefs = user.notificationPreferences;
            if (!prefs || !prefs.aiSupportEnabled) continue;

            // Trigger if:
            // 1. No AI nudge sent today
            // 2. User has logged "heavy" moods recently (Anxious, Sad, Stressed)
            const lastSent = prefs.lastAiSupportSent;
            if (lastSent && isToday(lastSent)) continue;

            const recentMoods = user.moodEntries;
            const hasHeavyMoods = recentMoods.some(m =>
                ['ANXIOUS', 'SAD', 'STRESSED', 'ANGRY'].includes(m.mood)
            );

            if (hasHeavyMoods) {
                const latestMood = recentMoods[0]?.mood;
                const nudgeMessage = await NotificationService.generateAiNudge(latestMood, user.firstName || 'there');

                await NotificationService.notify(
                    user.id,
                    'Supportive Note 💙',
                    nudgeMessage
                );

                await prisma.notificationPreference.update({
                    where: { userId: user.id },
                    data: { lastAiSupportSent: now }
                });
            }
        }
    }

    /**
     * Precompute weekly emotional growth for all active users.
     * Growth rows are cached by (userId, weekStart), so each week is computed once.
     */
    private static async handleWeeklyGrowthRecalculation() {
        try {
            const result = await GrowthService.recalculateCurrentWeekForAllUsers();
            console.log(`[CRON] Weekly growth recalculated for ${result.processed} users.`);
        } catch (error) {
            console.error('[CRON] Weekly growth recalculation failed:', error);
        }
    }
}
