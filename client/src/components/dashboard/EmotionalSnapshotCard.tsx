'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Heart, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useMoodStore } from '@/stores/moodStore';
import { getMoodConfig } from '@/lib/mood';

export const EmotionalSnapshotCard = () => {
    const { stats, isLoadingStats } = useMoodStore();

    // Generate narrative text based on mood data
    const narrative = useMemo(() => {
        if (!stats) {
            return {
                title: "Your Emotional Story",
                body: "Start checking in to see your story unfold.",
                subtext: "Every feeling matters."
            };
        }

        const moodConfig = stats.mostFrequentMood ? getMoodConfig(stats.mostFrequentMood) : null;
        const moodLabel = moodConfig?.label || 'balanced';
        const totalEntries = stats.totalEntries || 0;
        const avgIntensity = stats.averageIntensity || 5;

        // Determine trend
        let trendText = '';
        if (stats.weeklyBreakdown && stats.weeklyBreakdown.length >= 2) {
            const recent = stats.weeklyBreakdown.slice(-3);
            const intensities = recent.map(d => d.averageIntensity);
            const trend = intensities[intensities.length - 1] - intensities[0];
            
            if (trend > 1) trendText = 'Your intensity is rising.';
            else if (trend < -1) trendText = 'Your intensity is softening.';
            else trendText = 'Your energy feels steady.';
        }

        // Generate personalized narrative
        let mainBody = '';
        if (totalEntries === 0) {
            mainBody = "Your story is waiting to begin.";
        } else if (totalEntries === 1) {
            mainBody = `You've taken your first step. That matters.`;
        } else {
            mainBody = `You've felt mostly ${moodLabel.toLowerCase()} this week.`;
            if (trendText) {
                mainBody += `\n${trendText}`;
            }
            mainBody += `\nYou've shown up ${totalEntries} time${totalEntries !== 1 ? 's' : ''} — that matters.`;
        }

        // Generate supportive subtext
        let subtext = '';
        if (['SAD', 'ANXIOUS', 'ANGRY'].includes(stats.mostFrequentMood || '')) {
            subtext = "Hard feelings need witnessing. You're doing that.";
        } else if (['HAPPY', 'GRATEFUL', 'CALM'].includes(stats.mostFrequentMood || '')) {
            subtext = "Notice what's working. Build on it.";
        } else {
            subtext = "Awareness is the first step to growth.";
        }

        return {
            title: "Your Emotional Story This Week",
            body: mainBody,
            subtext: subtext
        };
    }, [stats]);

    // Trend indicator
    const trend = useMemo(() => {
        if (!stats?.weeklyBreakdown || stats.weeklyBreakdown.length < 2) return 'steady';
        const last = stats.weeklyBreakdown[stats.weeklyBreakdown.length - 1].averageIntensity;
        const prev = stats.weeklyBreakdown[stats.weeklyBreakdown.length - 2].averageIntensity;

        if (last > prev + 1) return 'rising';
        if (last < prev - 1) return 'softening';
        return 'steady';
    }, [stats]);

    const dominantMoodConfig = useMemo(() => {
        if (!stats?.mostFrequentMood) return null;
        return getMoodConfig(stats.mostFrequentMood);
    }, [stats]);

    if (isLoadingStats) {
        return <div className="h-[280px] rounded-[24px] bg-white/[0.03] animate-pulse" />;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-gradient-to-br from-white/[0.04] to-white/[0.02] backdrop-blur-xl border border-white/[0.06] rounded-[28px] p-6 sm:p-8 h-full"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6 sm:mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500/20 to-pink-500/20 flex items-center justify-center">
                        <Heart className="w-5 h-5 text-rose-400" />
                    </div>
                    <h3 className="text-[17px] sm:text-[18px] font-medium text-white">{narrative.title}</h3>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] sm:text-[12px] font-medium border
                    ${trend === 'rising' ? 'text-amber-400 bg-amber-400/10 border-amber-400/20' :
                        trend === 'softening' ? 'text-blue-400 bg-blue-400/10 border-blue-400/20' :
                            'text-slate-400 bg-slate-400/10 border-slate-400/20'}
                `}>
                    {trend === 'rising' && <TrendingUp className="w-3.5 h-3.5" />}
                    {trend === 'softening' && <TrendingDown className="w-3.5 h-3.5" />}
                    {trend === 'steady' && <Minus className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">{trend.charAt(0).toUpperCase() + trend.slice(1)}</span>
                </div>
            </div>

            {/* Main Mood Indicator */}
            {dominantMoodConfig && (
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center gap-4 mb-6 sm:mb-8"
                >
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center">
                        <span className="text-[36px] sm:text-[44px]">{dominantMoodConfig.emoji}</span>
                    </div>
                    <div>
                        <p className="text-[12px] text-white/40 uppercase tracking-widest mb-1">Dominant Feeling</p>
                        <p className="text-[22px] sm:text-[26px] font-semibold text-white">{dominantMoodConfig.label}</p>
                    </div>
                </motion.div>
            )}

            {/* Narrative Body */}
            <div className="bg-white/[0.03] rounded-[20px] p-5 sm:p-6 border border-white/[0.05] mb-4">
                <p className="text-[16px] sm:text-[17px] text-white/80 leading-relaxed font-light whitespace-pre-line">
                    {narrative.body}
                </p>
            </div>

            {/* Supportive subtext */}
            <p className="text-[13px] sm:text-[14px] text-white/40 italic font-light text-center">
                "{narrative.subtext}"
            </p>
        </motion.div>
    );
};
