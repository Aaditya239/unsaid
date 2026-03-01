'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { User, Bell } from 'lucide-react';
import { TaskList } from '@/components/dashboard/TaskList';
import { TaskCalendar } from '@/components/dashboard/TaskCalendar';
import { useTaskStore } from '@/stores/taskStore';
import { useMoodStore } from '@/stores/moodStore';
import { useTheme } from '@/hooks/useTheme';

export default function TasksPage() {
    const router = useRouter();
    const t = useTheme();
    const { fetchTasksForDate, selectedDate, executionContext, dailyCapacity, today } = useTaskStore();
    const { fetchStreak, streak } = useMoodStore();

    useEffect(() => {
        fetchTasksForDate(selectedDate);
        fetchStreak();
    }, [fetchTasksForDate, fetchStreak, selectedDate]);

    const unfinished = today.filter(t => !t.isCompleted).length;

    const insightText = (() => {
        if ((dailyCapacity?.percentage ?? 100) < 30) {
            return "You're low on energy today. Completing one small task is enough.";
        }
        if ((streak?.streak ?? 0) >= 5) {
            return "You've been consistent this week. Momentum looks stable.";
        }
        if ((executionContext?.weeklyBurnoutLevel ?? 'LOW') === 'HIGH') {
            return "Your workload has been intense. A lighter plan can help you recover.";
        }
        if (unfinished === 0) {
            return "You cleared your list. Protect this calm momentum.";
        }
        return "Choose the next manageable step. Gentle progress still counts.";
    })();

    return (
        <div className="min-h-screen font-sans pb-24 relative overflow-x-hidden text-white" style={t.pageBg}>
            {/* Background gradient overlay — matches dashboard */}
            <div className="absolute inset-0 z-0 pointer-events-none" style={t.bgGradientStyle}></div>

            {/* Ambient glows — matches dashboard */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%] rounded-full blur-[150px] z-0 pointer-events-none" style={t.glow1Style}></div>

            {/* Navbar — same inline navbar as dashboard */}
            <nav className="relative z-20 sticky top-0 backdrop-blur-xl border-b px-4 md:px-8 py-4 flex items-center justify-between transition-all" style={t.navStyle}>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={t.accentDotStyle}></div>
                    <span className="text-white font-serif font-semibold tracking-wider text-[18px]">UNSAID</span>
                </div>

                <div className="hidden md:flex items-center gap-8">
                    <span className="text-white/60 hover:text-white transition-colors text-[14px] font-medium cursor-pointer" onClick={() => router.push('/dashboard')}>Dashboard</span>
                    <span className="text-white/60 hover:text-white transition-colors text-[14px] font-medium cursor-pointer" onClick={() => router.push('/journal')}>Journal</span>
                    <span className="text-white/60 hover:text-white transition-colors text-[14px] font-medium cursor-pointer" onClick={() => router.push('/mood')}>Mood</span>
                    <span className="text-white text-[14px] font-medium cursor-pointer">Mindful Tasks</span>
                    <span className="text-white/60 hover:text-white transition-colors text-[14px] font-medium cursor-pointer" onClick={() => router.push('/calm')}>Focus</span>
                </div>

                <div className="flex items-center gap-4 sm:gap-6">
                    <button className="text-white/60 hover:text-white transition-colors relative">
                        <Bell className="w-5 h-5" />
                    </button>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#3B82F6] to-[#8B5CF6] p-[2px] cursor-pointer" onClick={() => router.push('/settings')}>
                        <div className="w-full h-full rounded-full bg-[#050816] flex items-center justify-center">
                            <User className="w-4 h-4 text-white/80" />
                        </div>
                    </div>
                </div>
            </nav>

            <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-10">
                <header className="mb-8 sm:mb-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-[28px] sm:text-[32px] md:text-[40px] font-semibold text-white tracking-tight mb-2">
                            Mindful Tasks 📅
                        </h1>
                        <p className="text-[15px] sm:text-[17px] text-white/50 font-light max-w-2xl leading-relaxed">
                            Align your daily commitments with your emotional capacity.
                            Break things down, reflect on resistance, and stay intentional.
                        </p>
                    </motion.div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
                    {/* Left Column: Calendar & Controls */}
                    <div className="lg:col-span-4 space-y-4 sm:space-y-6">
                        <TaskCalendar />

                        <div className="rounded-[20px] p-6 backdrop-blur-md border" style={t.cardStyle}>
                            <h4 className="text-[14px] font-medium text-white/60 uppercase tracking-widest mb-4">
                                Mindful Insight
                            </h4>
                            <p className="text-[14px] text-white/55 leading-relaxed">
                                {insightText}
                            </p>
                            <div className="mt-4 pt-4 border-t border-white/[0.05] text-[12px] text-white/45 space-y-1">
                                <p>Mood: {executionContext?.moodType || 'NEUTRAL'}</p>
                                <p>Capacity: {dailyCapacity?.percentage ?? 100}%</p>
                                <p>Open tasks: {unfinished}</p>
                                <p>Streak: {streak?.streak ?? 0} day(s)</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Task List */}
                    <div className="lg:col-span-8">
                        <div className="rounded-[20px] p-6 sm:p-8 min-h-[600px] backdrop-blur-md border" style={t.cardStyle}>
                            <TaskList />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
