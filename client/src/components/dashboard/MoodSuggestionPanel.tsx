'use client';
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useTaskStore, Task } from '@/stores/taskStore';
import { useMoodStore } from '@/stores/moodStore';

type MoodCtx = 'LOW' | 'FOCUSED' | 'ANXIOUS' | 'NEUTRAL';

function deriveMoodContext(moodType: string, intensity: number): MoodCtx {
    const t = moodType.toUpperCase();
    if (['SAD', 'OVERWHELMED'].includes(t) || intensity <= 3) return 'LOW';
    if (['ANXIOUS', 'STRESSED'].includes(t)) return 'ANXIOUS';
    if (['CALM', 'FOCUSED', 'HAPPY', 'EXCITED'].includes(t) && intensity >= 6) return 'FOCUSED';
    return 'NEUTRAL';
}

const CTX_CONFIG: Record<MoodCtx, { headline: string; colour: string; taskFilter: (t: Task) => boolean; dimFilter: (t: Task) => boolean }> = {
    LOW: {
        headline: 'You seem low energy — start with something small.',
        colour: '#60A5FA',
        taskFilter: t => t.energyLevelRequired === 'LOW' || t.priority === 'LOW',
        dimFilter: t => t.energyLevelRequired === 'HIGH' || t.priority === 'HIGH',
    },
    ANXIOUS: {
        headline: "When anxious, small wins help — here's where to start.",
        colour: '#C084FC',
        taskFilter: t => (t.subTasks?.length ?? 0) > 0 || t.energyLevelRequired === 'LOW',
        dimFilter: t => t.energyLevelRequired === 'HIGH',
    },
    FOCUSED: {
        headline: "You're in the zone — tackle your highest priorities.",
        colour: '#34D399',
        taskFilter: t => t.priority === 'HIGH',
        dimFilter: t => t.priority === 'LOW',
    },
    NEUTRAL: {
        headline: "Here's a balanced starting point for today.",
        colour: '#9C6BFF',
        taskFilter: t => t.priority === 'MEDIUM',
        dimFilter: () => false,
    },
};

export const MoodSuggestionPanel: React.FC = () => {
    const { today } = useTaskStore();
    const { entries } = useMoodStore();

    const latestMood = entries[0];
    if (!latestMood) return null;

    const ctx = deriveMoodContext(latestMood.mood, latestMood.intensity);
    const cfg = CTX_CONFIG[ctx];

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const suggestions = useMemo(() =>
        today.filter(t => !t.isCompleted && cfg.taskFilter(t)).slice(0, 3),
        [today, cfg]
    );

    if (suggestions.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="mt-4 rounded-[16px] bg-white/[0.03] border border-white/[0.06] p-4"
        >
            <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-3.5 h-3.5" style={{ color: cfg.colour }} />
                <span className="text-[12px] font-medium" style={{ color: cfg.colour }}>
                    Suggested for your mood
                </span>
            </div>
            <p className="text-[12px] text-white/50 mb-3 italic">{cfg.headline}</p>
            <div className="space-y-2">
                {suggestions.map(task => (
                    <div key={task.id} className="flex items-center gap-2.5 text-[13px] text-white/70">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cfg.colour }} />
                        <span className="truncate">{task.title}</span>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};
