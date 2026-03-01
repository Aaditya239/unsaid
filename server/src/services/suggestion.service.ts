// ============================================
// Suggestion Service
// ============================================
// Logic for emotion-based adaptive recommendations.
// ============================================

import { Mood } from '@prisma/client';

export interface Suggestion {
    id: string;
    title: string;
    description: string;
    actionLabel: string;
    actionRoute: string;
    icon: string;
}

const SUGGESTIONS_MAP: Record<Mood, Suggestion[]> = {
    ANXIOUS: [
        {
            id: 'anxious_1',
            title: 'Ground yourself',
            description: 'Find a quiet spot for a 5-minute breathing session.',
            actionLabel: 'Breathe',
            actionRoute: '/calm',
            icon: 'Wind'
        },
        {
            id: 'anxious_2',
            title: 'Unload your mind',
            description: "Write down everything that's worrying you.",
            actionLabel: 'Reflect',
            actionRoute: '/journal/new',
            icon: 'BookOpen'
        },
        {
            id: 'anxious_3',
            title: 'Listen to calm',
            description: 'Let these ambient sounds steady your pulse.',
            actionLabel: 'Play Music',
            actionRoute: '/calm',
            icon: 'Music'
        }
    ],
    SAD: [
        {
            id: 'sad_1',
            title: 'Express it',
            description: 'Set a timer for 5 minutes and just write.',
            actionLabel: 'Journal',
            actionRoute: '/journal/new',
            icon: 'BookOpen'
        },
        {
            id: 'sad_2',
            title: 'Find connection',
            description: 'Talk to your companion about what you’re feeling.',
            actionLabel: 'Talk',
            actionRoute: '/ai-support',
            icon: 'MessageCircle'
        },
        {
            id: 'sad_3',
            title: 'Uplifting notes',
            description: 'Listen to something that feels like a warm hug.',
            actionLabel: 'Play Music',
            actionRoute: '/calm',
            icon: 'Music'
        }
    ],
    HAPPY: [
        {
            id: 'happy_1',
            title: 'Savor the moment',
            description: 'Capture what exactly made you smile today.',
            actionLabel: 'Reflect',
            actionRoute: '/journal/new',
            icon: 'Sparkles'
        },
        {
            id: 'happy_2',
            title: 'Flow state',
            description: 'Use this energy to focus on something you love.',
            actionLabel: 'Focus',
            actionRoute: '/calm',
            icon: 'Activity'
        },
        {
            id: 'happy_3',
            title: 'Share the vibe',
            description: 'Tell your companion about your win.',
            actionLabel: 'Talk',
            actionRoute: '/ai-support',
            icon: 'MessageCircle'
        }
    ],
    TIRED: [
        {
            id: 'tired_1',
            title: 'Permit rest',
            description: 'Try a 10-minute deep relaxation session.',
            actionLabel: 'Relax',
            actionRoute: '/calm',
            icon: 'Wind'
        },
        {
            id: 'tired_2',
            title: 'Gentle release',
            description: 'Record a voice note about your day instead of typing.',
            actionLabel: 'Record',
            actionRoute: '/journal/new',
            icon: 'Mic'
        }
    ],
    CALM: [
        {
            id: 'calm_1',
            title: 'Deepen the peace',
            description: 'Perfect time for a guided meditation.',
            actionLabel: 'Meditate',
            actionRoute: '/calm',
            icon: 'Wind'
        },
        {
            id: 'calm_2',
            title: 'Introspective flow',
            description: 'Explore your thoughts while they are quiet.',
            actionLabel: 'Reflect',
            actionRoute: '/journal/new',
            icon: 'BookOpen'
        }
    ],
    ANGRY: [
        {
            id: 'angry_1',
            title: 'Release tension',
            description: 'A vigorous 5-minute movement or focus session.',
            actionLabel: 'Focus',
            actionRoute: '/calm',
            icon: 'Activity'
        },
        {
            id: 'angry_2',
            title: 'Raw reflection',
            description: 'Unfiltered writing can help clear the heat.',
            actionLabel: 'Journal',
            actionRoute: '/journal/new',
            icon: 'BookOpen'
        }
    ],
    GRATEFUL: [
        {
            id: 'grateful_1',
            title: 'Abundance check',
            description: 'List 3 specific things that felt good today.',
            actionLabel: 'Reflect',
            actionRoute: '/journal/new',
            icon: 'Heart'
        }
    ],
    NEUTRAL: [
        {
            id: 'neutral_1',
            title: 'Check in',
            description: 'A quick 2-minute scan of how you’re really doing.',
            actionLabel: 'Reflect',
            actionRoute: '/journal/new',
            icon: 'Activity'
        }
    ],
    STRESSED: [
        {
            id: 'stressed_1',
            title: 'Single focus',
            description: 'Pick ONE thing and focus on it for 15 minutes.',
            actionLabel: 'Focus',
            actionRoute: '/calm',
            icon: 'CheckCircle2'
        }
    ],
    EXCITED: [
        {
            id: 'excited_1',
            title: 'Channel the energy',
            description: 'Turn this momentum into a focused sprint.',
            actionLabel: 'Focus',
            actionRoute: '/calm',
            icon: 'TrendingUp'
        }
    ],
    CONFUSED: [
        {
            id: 'confused_1',
            title: 'Clarity session',
            description: 'Brainstorm with your companion to find the root.',
            actionLabel: 'Talk',
            actionRoute: '/ai-support',
            icon: 'MessageCircle'
        }
    ]
};

/**
 * Get adaptive suggestions based on mood
 */
export const getSuggestionsForMood = (mood: Mood | string | null): Suggestion[] => {
    if (!mood) {
        return [SUGGESTIONS_MAP.NEUTRAL[0]];
    }

    const moodKey = (typeof mood === 'string' ? mood.toUpperCase() : mood) as Mood;
    const suggestions = SUGGESTIONS_MAP[moodKey] || SUGGESTIONS_MAP.NEUTRAL;

    // Return top 2-3 suggestions
    return suggestions.slice(0, 3);
};
