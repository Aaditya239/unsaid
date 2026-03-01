'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTaskStore } from '@/stores/taskStore';
import { CheckCircle2, Circle, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export const MindfulTaskPreview = () => {
    const { today, fetchTasksForDate, selectedDate, updateTaskStatus, isLoading } = useTaskStore();

    useEffect(() => {
        const todayZero = new Date();
        todayZero.setHours(0, 0, 0, 0);
        fetchTasksForDate(todayZero);
    }, [fetchTasksForDate]);

    // Show only first 3 incomplete high/medium priority tasks
    const previewTasks = today
        .filter(t => !t.isCompleted)
        .sort((a, b) => {
            const pMap = { HIGH: 3, MEDIUM: 2, LOW: 1 };
            return pMap[b.priority] - pMap[a.priority];
        })
        .slice(0, 3);

    const completedCount = today.filter(t => t.isCompleted).length;
    const totalCount = today.length;
    const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-[24px] p-6 hover:bg-white/[0.05] transition-all duration-500 group"
        >
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-[18px] font-semibold text-white group-hover:text-indigo-400 transition-colors">
                        Mindful Tasks 📅
                    </h3>
                    <p className="text-[13px] text-white/40">Visible progress, less noise.</p>
                </div>
                <Link
                    href="/tasks"
                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all active:scale-90"
                >
                    <ArrowRight className="w-4 h-4" />
                </Link>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
                <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-white/30 mb-2">
                    <span>{completedCount}/{totalCount} Completed</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/[0.02] rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                    />
                </div>
            </div>

            <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                    {previewTasks.length > 0 ? (
                        previewTasks.map((task) => (
                            <motion.div
                                key={task.id}
                                layout
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex items-center gap-3 p-3 rounded-[16px] bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors"
                            >
                                <button
                                    onClick={() => updateTaskStatus(task.id, true)}
                                    className="text-white/20 hover:text-emerald-400 transition-colors"
                                >
                                    <Circle className="w-5 h-5" />
                                </button>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[14px] font-medium text-white/80 truncate">
                                        {task.title}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <div
                                            className={cn(
                                                "w-1.5 h-1.5 rounded-full",
                                                task.priority === 'HIGH' ? 'bg-rose-400' :
                                                    task.priority === 'MEDIUM' ? 'bg-amber-400' : 'bg-indigo-400'
                                            )}
                                        />
                                        <span className="text-[10px] text-white/30 truncate capitalize">{task.category.toLowerCase()}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : totalCount > 0 && progress === 100 ? (
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                                <Sparkles className="w-6 h-6 text-emerald-400" />
                            </div>
                            <p className="text-[14px] font-medium text-white/80">Everything complete!</p>
                            <p className="text-[12px] text-white/40">You're aligned for today.</p>
                        </div>
                    ) : (
                        <div className="py-6 text-center">
                            <p className="text-[14px] text-white/30 italic">No tasks planned yet.</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {previewTasks.length > 0 && (
                <Link
                    href="/tasks"
                    className="w-full mt-6 py-3 rounded-[16px] bg-white/5 border border-white/[0.05] text-[13px] font-medium text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2 group/btn"
                >
                    Expand Mindful Tasks
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </Link>
            )}
        </motion.div>
    );
};
