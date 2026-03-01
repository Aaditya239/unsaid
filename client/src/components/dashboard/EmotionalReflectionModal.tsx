'use client';
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTaskStore } from '@/stores/taskStore';

const OPTIONS = [
    { value: 'LIGHTER', emoji: '✨', label: 'Lighter' },
    { value: 'NEUTRAL', emoji: '🌿', label: 'Neutral' },
    { value: 'DRAINING', emoji: '🌊', label: 'Draining' },
] as const;

interface Props {
    taskId: string | null;
    onClose: () => void;
}

export const EmotionalReflectionModal: React.FC<Props> = ({ taskId, onClose }) => {
    const { saveEmotionalFeedback } = useTaskStore();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Auto-dismiss after 10 seconds
    useEffect(() => {
        if (!taskId) return;
        const timer = setTimeout(onClose, 10000);
        return () => clearTimeout(timer);
    }, [taskId, onClose]);

    const handleSelect = async (value: string) => {
        if (!taskId || isSubmitting) return;
        setIsSubmitting(true);
        await saveEmotionalFeedback(taskId, value);
        onClose();
    };

    return (
        <AnimatePresence>
            {taskId && (
                <motion.div
                    initial={{ opacity: 0, y: 12, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="fixed bottom-8 right-8 z-50 w-[320px] bg-[rgba(14,18,30,0.95)] border border-white/[0.08] rounded-[20px] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl"
                >
                    <p className="text-[13px] text-white/50 mb-1">Task completed</p>
                    <p className="text-[15px] font-medium text-white/90 mb-4">How did that feel?</p>
                    <div className="flex gap-2">
                        {OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => handleSelect(opt.value)}
                                disabled={isSubmitting}
                                className="flex-1 flex flex-col items-center gap-1.5 p-3 rounded-[14px] bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] hover:border-white/[0.12] transition-all active:scale-95 text-white/80 hover:text-white"
                            >
                                <span className="text-xl">{opt.emoji}</span>
                                <span className="text-[11px] font-medium">{opt.label}</span>
                            </button>
                        ))}
                    </div>
                    <button onClick={onClose} className="mt-3 w-full text-center text-[11px] text-white/30 hover:text-white/60 transition-colors">
                        Skip
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
