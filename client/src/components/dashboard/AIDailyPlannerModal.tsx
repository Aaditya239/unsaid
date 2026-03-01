'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, ArrowUpDown } from 'lucide-react';
import { useTaskStore } from '@/stores/taskStore';
import { useMoodStore } from '@/stores/moodStore';
import { cn } from '@/lib/utils';

type PlanItem = { id: string; title: string; priority: string; suggestedIndex: number };

const PRIORITY_BADGE: Record<string, string> = {
    HIGH: 'text-[#F87171]/80',
    MEDIUM: 'text-[#FBBF24]/70',
    LOW: 'text-[#60A5FA]/70',
};

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

function deriveMoodContext(moodType: string, intensity: number): string {
    const t = moodType.toUpperCase();
    if (['SAD', 'OVERWHELMED'].includes(t) || intensity <= 3) return 'LOW';
    if (['ANXIOUS', 'STRESSED'].includes(t)) return 'ANXIOUS';
    if (['CALM', 'FOCUSED', 'HAPPY', 'EXCITED'].includes(t) && intensity >= 6) return 'FOCUSED';
    return 'NEUTRAL';
}

export const AIDailyPlannerModal: React.FC<Props> = ({ isOpen, onClose }) => {
    const { planDay, reorderTasks, today } = useTaskStore();
    const { entries } = useMoodStore();
    const [plan, setPlan] = useState<PlanItem[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const latestMood = entries[0];
    const moodCtx = latestMood ? deriveMoodContext(latestMood.mood, latestMood.intensity) : 'NEUTRAL';

    const handleGenerate = async () => {
        setIsLoading(true);
        try {
            const result = await planDay(moodCtx);
            setPlan(result);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApply = () => {
        if (!plan) return;
        // Map AI suggested order back to our today array and reorder
        const reordered = plan
            .map(p => today.find(t => t.id === p.id))
            .filter(Boolean) as typeof today;
        if (reordered.length > 0) {
            reorderTasks(reordered, 'today');
        }
        onClose();
        setPlan(null);
    };

    const handleClose = () => {
        onClose();
        setPlan(null);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                        onClick={handleClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 8 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-[420px] bg-[rgba(14,18,30,0.97)] border border-white/[0.08] rounded-[22px] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.6)] backdrop-blur-xl"
                    >
                        <button onClick={handleClose} className="absolute top-5 right-5 w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/[0.08] text-white/30 hover:text-white/70 transition-all">
                            <X className="w-4 h-4" />
                        </button>

                        <div className="flex items-center gap-2.5 mb-2">
                            <Sparkles className="w-4 h-4 text-[#9C6BFF]" />
                            <h3 className="text-[16px] font-semibold text-white">Plan my day</h3>
                        </div>
                        <p className="text-[12px] text-white/40 mb-5">
                            AI suggests the best task order based on your mood
                            {latestMood && <span className="text-[#9C6BFF]/70"> ({moodCtx.toLowerCase()} energy)</span>}.
                        </p>

                        {!plan ? (
                            <button
                                onClick={handleGenerate}
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-[14px] bg-[#4F7CFF]/10 border border-[#4F7CFF]/20 text-[#4F7CFF] hover:bg-[#4F7CFF]/20 text-[14px] font-medium transition-all active:scale-98 disabled:opacity-40"
                            >
                                {isLoading ? (
                                    <div className="w-4 h-4 border-2 border-[#4F7CFF]/30 border-t-[#4F7CFF] rounded-full animate-spin" />
                                ) : (
                                    <ArrowUpDown className="w-4 h-4" />
                                )}
                                {isLoading ? 'Analysing tasks…' : 'Generate suggestion'}
                            </button>
                        ) : (
                            <>
                                <div className="space-y-2 mb-5 max-h-[260px] overflow-y-auto pr-1">
                                    {plan.map((item, idx) => (
                                        <div key={item.id} className="flex items-center gap-3 p-3 rounded-[12px] bg-white/[0.03] border border-white/[0.04]">
                                            <span className="text-[12px] font-mono text-white/20 w-5 text-right">{idx + 1}</span>
                                            <span className="flex-1 text-[13px] text-white/80 truncate">{item.title}</span>
                                            <span className={cn('text-[11px] font-medium', PRIORITY_BADGE[item.priority] || 'text-white/30')}>
                                                {item.priority}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={handleClose} className="flex-1 py-2.5 rounded-[12px] bg-white/[0.04] border border-white/[0.08] text-[13px] text-white/50 hover:text-white hover:bg-white/[0.07] transition-all">
                                        Dismiss
                                    </button>
                                    <button onClick={handleApply} className="flex-1 py-2.5 rounded-[12px] bg-[#4F7CFF] text-[13px] font-medium text-white hover:bg-[#3d6be8] transition-all active:scale-98">
                                        Apply order
                                    </button>
                                </div>
                            </>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
