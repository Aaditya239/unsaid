'use client';
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Moon } from 'lucide-react';
import { useTaskStore } from '@/stores/taskStore';
import dayjs from 'dayjs';

export const EODSummaryCard: React.FC = () => {
    const { fetchEODSummary, eodSummary } = useTaskStore();
    const [dismissed, setDismissed] = useState(false);

    const hour = new Date().getHours();
    const isEODTime = hour >= 21;

    useEffect(() => {
        if (isEODTime) {
            fetchEODSummary(dayjs().format('YYYY-MM-DD'));
        }
    }, [isEODTime, fetchEODSummary]);

    if (!isEODTime || !eodSummary || dismissed) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.3 }}
                className="mt-5 rounded-[18px] p-5 relative overflow-hidden"
                style={{
                    background: 'linear-gradient(135deg, rgba(79,124,255,0.06), rgba(156,107,255,0.08))',
                    border: '1px solid rgba(156,107,255,0.15)',
                }}
            >
                <button
                    onClick={() => setDismissed(true)}
                    className="absolute top-4 right-4 w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/[0.08] text-white/30 hover:text-white/70 transition-all"
                >
                    <X className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center gap-2 mb-4">
                    <Moon className="w-4 h-4 text-[#9C6BFF]" />
                    <span className="text-[12px] font-medium text-[#9C6BFF] tracking-wide">End of Day</span>
                </div>

                <div className="space-y-1">
                    {eodSummary.summary.split('\n').map((line, i) => (
                        <p
                            key={i}
                            className="text-[14px] leading-relaxed"
                            style={{
                                color: i === eodSummary.summary.split('\n').length - 1
                                    ? 'rgba(156,107,255,0.8)'
                                    : 'rgba(255,255,255,0.6)',
                                fontStyle: i === eodSummary.summary.split('\n').length - 1 ? 'italic' : 'normal',
                            }}
                        >
                            {line}
                        </p>
                    ))}
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
