'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Info, Leaf, TrendingUp, Sparkles, Target, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMoodStore } from '@/stores/moodStore';
import { useTaskStore } from '@/stores/taskStore';
import api from '@/lib/api';
import { GROWTH_LEVELS } from '@/config/xpRules';
import GrowthBreakdownModal from './GrowthBreakdownModal';

export const TinyWinsCard = () => {
    const { streak, isLoadingStreak } = useMoodStore();
    const { tinyWins, fetchTinyWins } = useTaskStore();
    const [growthData, setGrowthData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Fetch weekly growth analytics
    useEffect(() => {
        let isMounted = true;
        const fetchGrowth = async () => {
            try {
                const response = await api.get('/growth/weekly');
                if (isMounted) {
                    setGrowthData(response.data);
                }
            } catch (error) {
                console.error('Failed to fetch growth data:', error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchGrowth();
        fetchTinyWins();
        return () => { isMounted = false; };
    }, [fetchTinyWins]);

    // Centralized XP and Level logic
    const xp = streak?.xp || 0;

    const currentLevelInfo = useMemo(() => {
        for (let i = GROWTH_LEVELS.length - 1; i >= 0; i--) {
            if (xp >= GROWTH_LEVELS[i].minXP) {
                return {
                    ...GROWTH_LEVELS[i],
                    nextLevel: GROWTH_LEVELS[i + 1] || null,
                };
            }
        }
        return { ...GROWTH_LEVELS[0], nextLevel: GROWTH_LEVELS[1] };
    }, [xp]);

    const xpProgress = useMemo(() => {
        if (!currentLevelInfo.nextLevel) return 100;
        const currentMin = currentLevelInfo.minXP;
        const nextMin = currentLevelInfo.nextLevel.minXP;
        return Math.min(100, Math.max(0, ((xp - currentMin) / (nextMin - currentMin)) * 100));
    }, [xp, currentLevelInfo]);

    // Daily awareness checkpoints
    const todayWins = useMemo(() => {
        if (tinyWins.length > 0) return tinyWins;
        return [
            { done: true, label: 'Showed up today', icon: '✨' },
            { done: streak?.isActive || false, label: 'Checked in', icon: '🧭' },
        ];
    }, [tinyWins, streak]);

    if (isLoadingStreak || loading) {
        return <div className="h-[280px] rounded-[28px] bg-white/[0.03] animate-pulse" />;
    }

    const delta = growthData?.delta || 0;
    const deltaClass = delta > 0 ? 'text-emerald-400' : delta < 0 ? 'text-amber-300' : 'text-white/50';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-gradient-to-br from-emerald-500/[0.08] to-teal-500/[0.04] backdrop-blur-xl border border-white/[0.06] rounded-[28px] p-6 h-full flex flex-col relative overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <Leaf className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="text-[17px] sm:text-[18px] font-medium text-white leading-tight">Your Growth</h3>
                        <p className="text-[12px] text-white/40">{currentLevelInfo.name} Level</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/5 transition-colors group"
                >
                    <Info className="w-4 h-4 text-white/30 group-hover:text-white/80 transition-colors" />
                </button>
            </div>

            {/* Growth Stat Card */}
            <div className="mb-5 rounded-2xl border border-white/[0.07] bg-white/5 p-4">
                <p className="text-[10px] uppercase tracking-[0.15em] text-white/40 mb-1">Emotional Growth</p>
                <div className="flex items-end justify-between">
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-bold text-white">{xp}</span>
                        <span className="text-xs text-white/30">XP Total</span>
                    </div>
                    <div className={`text-xs font-medium flex items-center gap-1 ${deltaClass}`}>
                        <TrendingUp className="w-3 h-3" />
                        {delta > 0 ? '+' : ''}{delta}%
                    </div>
                </div>
            </div>

            {/* Plant visualization */}
            <div className="flex-1 flex flex-col items-center justify-center py-2">
                <motion.div
                    key={currentLevelInfo.icon}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="text-6xl sm:text-7xl mb-2 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]"
                >
                    {currentLevelInfo.icon}
                </motion.div>

                <p className="text-lg font-semibold text-white">
                    {currentLevelInfo.name}
                </p>

                <p className="text-[13px] text-white/50 text-center italic max-w-[200px] mt-1 leading-relaxed px-2">
                    "{currentLevelInfo.message}"
                </p>
            </div>

            {/* Progress bar info */}
            <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                    <span className="text-white/40 uppercase tracking-wider font-medium">
                        {currentLevelInfo.nextLevel ? `Next: ${currentLevelInfo.nextLevel.name}` : 'Bloom Reached'}
                    </span>
                    <span className="text-emerald-400 font-semibold px-2 py-0.5 bg-emerald-500/10 rounded-full">
                        {currentLevelInfo.nextLevel ? `${currentLevelInfo.nextLevel.minXP - xp} XP to go` : 'Peak Growth'}
                    </span>
                </div>

                <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${xpProgress}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                    />
                </div>
            </div>

            {/* Wins Checkbox List */}
            <div className="mt-6 space-y-2 border-t border-white/[0.05] pt-4">
                {todayWins.map((win, idx) => (
                    <div key={idx} className="flex items-center gap-2.5">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${win.done ? 'bg-emerald-500/20 border-emerald-500/40' : 'bg-transparent border-white/10'
                            }`}>
                            {win.done && <Sparkles className="w-2.5 h-2.5 text-emerald-400" />}
                        </div>
                        <span className={`text-[12px] ${win.done ? 'text-white/80' : 'text-white/20'}`}>
                            {win.icon ? `${win.icon} ` : ''}{win.label}
                        </span>
                    </div>
                ))}
            </div>

            {/* Growth Breakdown Modal */}
            <GrowthBreakdownModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                currentXP={xp}
            />
        </motion.div>
    );
};
