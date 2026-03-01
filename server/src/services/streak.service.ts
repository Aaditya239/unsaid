import prisma from '../utils/prisma';
import { startOfDay, subDays, isSameDay } from 'date-fns';
import { XP_RULES, GROWTH_LEVELS } from '../config/xpRules';

/**
 * Service to handle user engagement streaks (Self Awareness Streak)
 */
export const updateReflectionStreak = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { reflectionStreak: true, lastReflectionAt: true },
    });

    if (!user) return null;

    const today = startOfDay(new Date());
    const lastReflection = user.lastReflectionAt ? startOfDay(user.lastReflectionAt) : null;

    const yesterday = subDays(today, 1);
    let newStreak = 1;

    // If last reflection was today OR yesterday, increment streak
    // This allows multiple journals in a day to increase the "total awareness count"
    if (lastReflection && (isSameDay(today, lastReflection) || isSameDay(yesterday, lastReflection))) {
        newStreak = user.reflectionStreak + 1;
    }

    // Update user with new streak and timestamp
    await prisma.user.update({
        where: { id: userId },
        data: {
            reflectionStreak: newStreak,
            lastReflectionAt: new Date(),
        },
    });

    return newStreak;
};

export const todayDateStr = (): string => {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/**
 * Get current streak info for a user
 */
export const getStreakInfo = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { reflectionStreak: true, lastReflectionAt: true },
    });

    if (!user) return { streak: 0, isActive: false };

    const today = startOfDay(new Date());
    const yesterday = subDays(today, 1);
    const lastReflection = user.lastReflectionAt ? startOfDay(user.lastReflectionAt) : null;

    const isActive = lastReflection && (isSameDay(today, lastReflection) || isSameDay(yesterday, lastReflection));

    return {
        streak: isActive ? user.reflectionStreak : 0,
        isActive: !!isActive,
        lastReflectionAt: user.lastReflectionAt,
    };
};

/**
 * Award XP to a user
 */
export const awardXP = async (userId: string, amount: number) => {
    const user = await prisma.user.update({
        where: { id: userId },
        data: {
            xp: { increment: amount }
        },
        select: { xp: true }
    });
    return user.xp;
};

/**
 * Get Level details based on XP
 */
export const getLevelDetails = (xp: number) => {
    for (let i = GROWTH_LEVELS.length - 1; i >= 0; i--) {
        const level = GROWTH_LEVELS[i];
        if (xp >= level.minXP) {
            const nextLevel = GROWTH_LEVELS[i + 1] || null;
            return {
                name: level.name,
                icon: level.icon,
                nextLevelThreshold: nextLevel ? nextLevel.minXP : null,
                currentRange: nextLevel ? `${level.minXP}-${nextLevel.minXP - 1}` : `${level.minXP}+`
            };
        }
    }
    return { name: 'Seed', icon: '🌱', nextLevelThreshold: 100, currentRange: '0-99' };
};

export const awardConsistencyBonusIfEligible = async (userId: string, streak: number) => {
    if (streak < 7) return false;

    const date = todayDateStr();

    const row = await prisma.emotionalCapacityDay.upsert({
        where: { userId_date: { userId, date } },
        create: { userId, date, capacity: 100, energyUsed: 0, gentleModeActive: false, consistencyBonusAwarded: false },
        update: {},
        select: { consistencyBonusAwarded: true },
    });

    if (row.consistencyBonusAwarded) return false;

    await prisma.$transaction([
        prisma.user.update({
            where: { id: userId },
            data: { xp: { increment: XP_RULES.WEEK_STREAK } },
        }),
        prisma.emotionalCapacityDay.update({
            where: { userId_date: { userId, date } },
            data: { consistencyBonusAwarded: true },
        }),
    ]);

    return true;
};

export const getEngagementInfo = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { reflectionStreak: true, lastReflectionAt: true, xp: true },
    });

    if (!user) return { streak: 0, isActive: false, xp: 0, level: getLevelDetails(0) };

    const today = startOfDay(new Date());
    const yesterday = subDays(today, 1);
    const lastReflection = user.lastReflectionAt ? startOfDay(user.lastReflectionAt) : null;

    const isActive = lastReflection && (isSameDay(today, lastReflection) || isSameDay(yesterday, lastReflection));

    return {
        streak: isActive ? user.reflectionStreak : 0,
        isActive: !!isActive,
        lastReflectionAt: user.lastReflectionAt,
        xp: user.xp,
        level: getLevelDetails(user.xp)
    };
};
