import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, Sparkles, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import { XP_RULES, GROWTH_LEVELS } from '../../config/xpRules';

interface GrowthBreakdownModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentXP: number;
}

const GrowthBreakdownModal: React.FC<GrowthBreakdownModalProps> = ({ isOpen, onClose, currentXP }) => {
    const currentLevelInfo = (() => {
        for (let i = GROWTH_LEVELS.length - 1; i >= 0; i--) {
            if (currentXP >= GROWTH_LEVELS[i].minXP) {
                return {
                    ...GROWTH_LEVELS[i],
                    nextLevel: GROWTH_LEVELS[i + 1] || null,
                };
            }
        }
        return { ...GROWTH_LEVELS[0], nextLevel: GROWTH_LEVELS[1] };
    })();

    const progress = currentLevelInfo.nextLevel
        ? ((currentXP - currentLevelInfo.minXP) / (currentLevelInfo.nextLevel.minXP - currentLevelInfo.minXP)) * 100
        : 100;

    const xpRules = [
        { label: 'Log your mood', xp: XP_RULES.LOG_MOOD, icon: <Sparkles className="w-4 h-4 text-blue-400" /> },
        { label: 'Complete a task', xp: XP_RULES.COMPLETE_TASK, icon: <CheckCircle2 className="w-4 h-4 text-green-400" /> },
        { label: 'Task reflection', xp: XP_RULES.TASK_REFLECTION, icon: <Zap className="w-4 h-4 text-yellow-400" /> },
        { label: '7-day streak', xp: XP_RULES.WEEK_STREAK, icon: <TrendingUp className="w-4 h-4 text-purple-400" /> },
        { label: 'Deep journal', xp: XP_RULES.DEEP_REFLECTION, icon: <ShieldCheck className="w-4 h-4 text-indigo-400" /> },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-lg overflow-hidden bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-white">How Growth Works</h2>
                                <p className="text-sm text-white/60">Transparency in your emotional journey</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-white/60" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-8 space-y-8">
                            {/* Current Level Card */}
                            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl">{currentLevelInfo.icon}</span>
                                        <div>
                                            <h3 className="font-medium text-white text-lg">{currentLevelInfo.name}</h3>
                                            <p className="text-xs text-white/50 uppercase tracking-wider">Current Rank</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-2xl font-bold text-white">{currentXP}</span>
                                        <span className="text-sm text-white/40 ml-1">XP</span>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="space-y-2">
                                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                                        />
                                    </div>
                                    <div className="flex justify-between text-[11px] text-white/40">
                                        <span>{currentLevelInfo.minXP} XP</span>
                                        {currentLevelInfo.nextLevel ? (
                                            <span>{currentLevelInfo.nextLevel.minXP - currentXP} XP until {currentLevelInfo.nextLevel.name}</span>
                                        ) : (
                                            <span>Maximum Level Reached</span>
                                        )}
                                    </div>
                                </div>

                                <p className="mt-4 text-sm text-white/70 italic leading-relaxed">
                                    "{currentLevelInfo.message}"
                                </p>
                            </div>

                            {/* XP Breakdown */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-medium text-white/80 uppercase tracking-widest pl-1">Earning Points</h4>
                                <div className="grid grid-cols-1 gap-3">
                                    {xpRules.map((rule, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all hover:translate-x-1"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-white/5 rounded-lg">
                                                    {rule.icon}
                                                </div>
                                                <span className="text-sm text-white/90">{rule.label}</span>
                                            </div>
                                            <span className="text-sm font-semibold text-white">+{rule.xp} XP</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Motivation Footer */}
                            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-3">
                                <Sparkles className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                                <p className="text-sm text-blue-100/80 leading-relaxed">
                                    Growth at <span className="text-white font-medium italic underline underline-offset-4 decoration-blue-500/50">UNSAID</span> isn't a race. Every small action you take is a win for your emotional awareness. 🌿
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default GrowthBreakdownModal;
