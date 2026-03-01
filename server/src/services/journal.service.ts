import { Emotion, Prisma } from '@prisma/client';
import prisma from '../utils/prisma';
import { NotFoundError, ForbiddenError } from '../utils/appError';
import { analyzeReflection } from './ai.service';
import { updateReflectionStreak, awardXP } from './streak.service';
import { XP_RULES } from '../config/xpRules';

// ============================================
// TYPES
// ============================================

export interface CreateJournalInput {
  title?: string;
  content: string;
  emotion?: Emotion;
  intensity?: number;
  aiResponse?: string;
  mode?: 'QUICK' | 'GUIDED' | 'DEEP' | 'CHAT';
  tags?: string[];
  imageUrl?: string | null;
  musicTitle?: string | null;
  musicArtist?: string | null;
  musicThumbnail?: string | null;
  musicVideoId?: string | null;
  musicUrl?: string | null;
  musicPlatform?: string | null;
  affectedBy?: string | null;
  energyLevel?: string | null;
  drainedBy?: string[];
  need?: string | null;
}

export interface UpdateJournalInput {
  title?: string;
  content?: string;
  emotion?: Emotion | null;
  intensity?: number | null;
  aiResponse?: string | null;
  mode?: 'QUICK' | 'GUIDED' | 'DEEP' | 'CHAT';
  tags?: string[];
  imageUrl?: string | null;
  musicTitle?: string | null;
  musicArtist?: string | null;
  musicThumbnail?: string | null;
  musicVideoId?: string | null;
  musicUrl?: string | null;
  musicPlatform?: string | null;
  isPinned?: boolean;
  affectedBy?: string | null;
  energyLevel?: string | null;
  drainedBy?: string[];
  need?: string | null;
}

export interface JournalQueryOptions {
  search?: string;
  emotion?: Emotion;
  sortBy?: 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// ============================================
// SERVICE FUNCTIONS
// ============================================

/**
 * Create a new journal entry
 * 
 * @param userId - The ID of the user creating the entry
 * @param data - The journal entry data
 * @returns The created journal entry
 */
export const createJournalEntry = async (
  userId: string,
  data: CreateJournalInput
) => {
  // Generate AI Response for the reflection
  const aiResponse = await analyzeReflection(
    userId,
    data.content,
    data.emotion,
    data.intensity
  );

  const now = new Date();
  const startOfDay = new Date(now.setHours(0, 0, 0, 0));
  const endOfDay = new Date(now.setHours(23, 59, 59, 999));

  const select = {
    id: true,
    title: true,
    content: true,
    emotion: true,
    intensity: true,
    aiResponse: true,
    mode: true,
    tags: true,
    imageUrl: true,
    musicTitle: true,
    musicArtist: true,
    musicThumbnail: true,
    musicVideoId: true,
    musicUrl: true,
    musicPlatform: true,
    affectedBy: true,
    energyLevel: true,
    drainedBy: true,
    need: true,
    createdAt: true,
    updatedAt: true,
  };

  // Create new entry
  const entry = await prisma.journalEntry.create({
    data: {
      userId,
      title: data.title,
      content: data.content,
      emotion: data.emotion,
      intensity: data.intensity,
      aiResponse,
      mode: data.mode as any,
      tags: data.tags,
      imageUrl: data.imageUrl,
      musicTitle: data.musicTitle,
      musicArtist: data.musicArtist,
      musicThumbnail: data.musicThumbnail,
      musicVideoId: data.musicVideoId,
      musicUrl: data.musicUrl,
      musicPlatform: data.musicPlatform,
      affectedBy: data.affectedBy,
      energyLevel: data.energyLevel,
      drainedBy: data.drainedBy,
      need: data.need,
    },
    select,
  });

  // Update reflection streak
  await updateReflectionStreak(userId);

  // Award XP (25 for deep reflection, 10 otherwise)
  const xpAmount = data.mode === 'DEEP' ? XP_RULES.DEEP_REFLECTION : XP_RULES.LOG_MOOD;
  await awardXP(userId, xpAmount);

  return entry;
};

/**
 * Get all journal entries for a user with filtering and pagination
 * 
 * IMPORTANT: Always filters by userId to ensure users only see their own entries
 * 
 * @param userId - The ID of the user
 * @param options - Query options for filtering, sorting, and pagination
 * @returns Paginated list of journal entries
 */
export const getJournalEntries = async (
  userId: string,
  options: JournalQueryOptions = {}
) => {
  const {
    search,
    emotion,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 20,
  } = options;

  // Calculate pagination offset
  const skip = (page - 1) * limit;

  // Build where clause - ALWAYS include userId for security
  const where: Prisma.JournalEntryWhereInput = {
    userId, // Critical: ensures user can only access their own entries
  };

  // Add search filter (searches in title and content)
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Add emotion filter
  if (emotion) {
    where.emotion = emotion;
  }

  // Execute query with pagination
  const [entries, total] = await Promise.all([
    prisma.journalEntry.findMany({
      where,
      select: {
        id: true,
        title: true,
        content: true,
        emotion: true,
        intensity: true,
        aiResponse: true,
        mode: true,
        tags: true,
        imageUrl: true,
        musicTitle: true,
        musicArtist: true,
        musicThumbnail: true,
        musicVideoId: true,
        musicUrl: true,
        musicPlatform: true,
        affectedBy: true,
        energyLevel: true,
        drainedBy: true,
        need: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.journalEntry.count({ where }),
  ]);

  return {
    entries,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + entries.length < total,
    },
  };
};

/**
 * Get a single journal entry by ID
 * 
 * IMPORTANT: Verifies ownership before returning
 * 
 * @param entryId - The ID of the journal entry
 * @param userId - The ID of the user requesting the entry
 * @returns The journal entry if owned by user
 * @throws NotFoundError if entry doesn't exist
 * @throws ForbiddenError if user doesn't own the entry
 */
export const getJournalEntryById = async (
  entryId: string,
  userId: string
) => {
  const entry = await prisma.journalEntry.findUnique({
    where: { id: entryId },
    select: {
      id: true,
      title: true,
      content: true,
      emotion: true,
      intensity: true,
      aiResponse: true,
      mode: true,
      tags: true,
      imageUrl: true,
      musicTitle: true,
      musicArtist: true,
      musicThumbnail: true,
      musicVideoId: true,
      musicUrl: true,
      musicPlatform: true,
      affectedBy: true,
      energyLevel: true,
      drainedBy: true,
      need: true,
      userId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!entry) {
    throw NotFoundError('Journal entry not found');
  }

  // Security check: ensure user owns this entry
  if (entry.userId !== userId) {
    throw ForbiddenError('You do not have permission to access this entry');
  }

  // Remove userId from response (user already knows their own ID)
  const { userId: _, ...entryWithoutUserId } = entry;
  return entryWithoutUserId;
};

/**
 * Update a journal entry
 * 
 * IMPORTANT: Verifies ownership before updating
 * 
 * @param entryId - The ID of the entry to update
 * @param userId - The ID of the user making the update
 * @param data - The update data
 * @returns The updated journal entry
 */
export const updateJournalEntry = async (
  entryId: string,
  userId: string,
  data: UpdateJournalInput
) => {
  // First verify ownership
  const existingEntry = await prisma.journalEntry.findUnique({
    where: { id: entryId },
    select: { userId: true },
  });

  if (!existingEntry) {
    throw NotFoundError('Journal entry not found');
  }

  if (existingEntry.userId !== userId) {
    throw ForbiddenError('You do not have permission to update this entry');
  }

  // Perform update
  const entry = await prisma.journalEntry.update({
    where: { id: entryId },
    data: {
      ...data,
      updatedAt: new Date(),
    },
    select: {
      id: true,
      title: true,
      content: true,
      emotion: true,
      intensity: true,
      aiResponse: true,
      mode: true,
      tags: true,
      imageUrl: true,
      musicTitle: true,
      musicArtist: true,
      musicThumbnail: true,
      musicVideoId: true,
      musicUrl: true,
      musicPlatform: true,
      affectedBy: true,
      energyLevel: true,
      drainedBy: true,
      need: true,
      isPinned: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return entry;
};

/**
 * Delete a journal entry
 * 
 * IMPORTANT: Verifies ownership before deleting
 * 
 * @param entryId - The ID of the entry to delete
 * @param userId - The ID of the user requesting deletion
 */
export const deleteJournalEntry = async (
  entryId: string,
  userId: string
) => {
  // First verify ownership
  const existingEntry = await prisma.journalEntry.findUnique({
    where: { id: entryId },
    select: { userId: true },
  });

  if (!existingEntry) {
    throw NotFoundError('Journal entry not found');
  }

  if (existingEntry.userId !== userId) {
    throw ForbiddenError('You do not have permission to delete this entry');
  }

  // Perform deletion
  await prisma.journalEntry.delete({
    where: { id: entryId },
  });
};

/**
 * Get journal statistics for a user
 * 
 * @param userId - The ID of the user
 * @returns Statistics about the user's journal entries
 */
export const getJournalStats = async (userId: string) => {
  const [totalEntries, emotionCounts, recentActivity] = await Promise.all([
    // Total entry count
    prisma.journalEntry.count({ where: { userId } }),

    // Count by emotion
    prisma.journalEntry.groupBy({
      by: ['emotion'],
      where: { userId },
      _count: { emotion: true },
    }),

    // Recent activity (entries in last 7 days)
    prisma.journalEntry.count({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),
  ]);

  return {
    totalEntries,
    emotionCounts: emotionCounts.reduce((acc, item) => {
      if (item.emotion) {
        acc[item.emotion] = item._count.emotion;
      }
      return acc;
    }, {} as Record<string, number>),
    recentActivity,
  };
};

/**
 * Attach music metadata to a journal entry
 */
export const attachMusicToEntry = async (
  entryId: string,
  userId: string,
  musicData: {
    musicTitle: string;
    musicArtist: string;
    musicThumbnail?: string | null;
    musicVideoId: string;
    musicUrl: string;
    musicPlatform?: string;
  }
) => {
  // Verify ownership
  const entry = await prisma.journalEntry.findUnique({
    where: { id: entryId },
    select: { userId: true },
  });

  if (!entry) throw NotFoundError('Journal entry not found');
  if (entry.userId !== userId) throw ForbiddenError('Access denied');

  return prisma.journalEntry.update({
    where: { id: entryId },
    data: {
      ...musicData,
      musicPlatform: musicData.musicPlatform || 'YOUTUBE'
    },
  });
};

