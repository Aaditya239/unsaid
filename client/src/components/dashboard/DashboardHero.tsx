'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { useMoodStore } from '@/stores/moodStore';
import { Mood, MOODS, getMoodConfig } from '@/lib/mood';
import { Check, Heart, MessageCircle, Wind, Sparkles, ListTodo } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Emotional reflections based on mood
const EMOTIONAL_REFLECTIONS: Record<string, { primary: string; secondary: string }> = {
    SAD: {
        primary: "You seem a little heavy today.",
        secondary: "That's okay. I'm here with you."
    },
    HAPPY: {
        primary: "You're carrying a light energy today.",
        secondary: "Let's build on it."
    },
    ANXIOUS: {
        primary: "Your mind feels active.",
        secondary: "Let's slow it down together."
    },
    CALM: {
        primary: "There's a stillness within you.",
        secondary: "Hold onto this peace."
    },
    ANGRY: {
        primary: "Something's stirring inside.",
        secondary: "Let's give it space to breathe."
    },
    NEUTRAL: {
        primary: "You're in a quiet space.",
        secondary: "Sometimes that's exactly what we need."
    },
    GRATEFUL: {
        primary: "Your heart feels open today.",
        secondary: "That's a beautiful place to be."
    },
    TIRED: {
        primary: "You might be running on empty.",
        secondary: "Rest isn't weakness — it's wisdom."
    },
    DEFAULT: {
        primary: "Let's understand today first.",
        secondary: "A moment of awareness can change everything."
    }
};

export const DashboardHero = () => {
    const { user } = useAuthStore();
    const { logEntry, isLogging, stats, streak } = useMoodStore();
    const [loggedMood, setLoggedMood] = useState<Mood | null>(null);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [showMoodPicker, setShowMoodPicker] = useState(false);
    const router = useRouter();

    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        const name = user?.firstName || 'Friend';

        if (hour < 12) return `Good morning, ${name}`;
        if (hour < 17) return `Good afternoon, ${name}`;
        return `Good evening, ${name}`;
    }, [user]);

    const greetingEmoji = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return '🌅';
        if (hour < 17) return '🌿';
        return '✨';
    }, []);

    // Get current emotional state from recent mood
    const currentMoodState = useMemo(() => {
        if (loggedMood) return loggedMood;
        if (stats?.mostFrequentMood) return stats.mostFrequentMood;
        return null;
    }, [loggedMood, stats]);

    const emotionalReflection = useMemo(() => {
        if (!currentMoodState) return EMOTIONAL_REFLECTIONS.DEFAULT;
        return EMOTIONAL_REFLECTIONS[currentMoodState] || EMOTIONAL_REFLECTIONS.DEFAULT;
    }, [currentMoodState]);

    const feedbackMessages = [
        "Logged.",
        "Thank you for checking in.",
        "Small step, big awareness.",
        "I'm here for you.",
        "Noted with care."
    ];

    const handleMoodSelect = async (mood: Mood) => {
        if (isLogging) return;

        setLoggedMood(mood);
        setShowMoodPicker(false);
        const randomFeedback = feedbackMessages[Math.floor(Math.random() * feedbackMessages.length)];
        setFeedback(randomFeedback);

        try {
            await logEntry({
                mood,
                intensity: 5,
                entryType: 'MANUAL'
            });

            setTimeout(() => {
                setFeedback(null);
            }, 3000);
        } catch (error) {
            console.error("Failed to log mood:", error);
            setFeedback("Something went wrong, but I'm still here.");
            setTimeout(() => setFeedback(null), 3000);
        }
    };

    const dashboardMoods = MOODS.filter(m =>
        ['HAPPY', 'SAD', 'CALM', 'ANXIOUS', 'ANGRY', 'NEUTRAL', 'GRATEFUL', 'TIRED'].includes(m.value)
    );

    const currentMoodConfig = currentMoodState ? getMoodConfig(currentMoodState) : null;

    // Determine primary action based on mood
    const getPrimaryAction = () => {
        if (!currentMoodState) return 'check-in';
        if (['SAD', 'ANXIOUS', 'ANGRY'].includes(currentMoodState)) return 'companion';
        if (['TIRED'].includes(currentMoodState)) return 'calm';
        return 'journal';
    };

    const primaryAction = getPrimaryAction();

    return (
        <div className="mb-8 sm:mb-12">
            {/* Emotional Hero Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center mb-8 sm:mb-10"
            >
                {/* Streak celebration (soft) */}
                {streak?.streak && streak.streak > 1 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[13px] font-medium mb-6"
                    >
                        <span className="text-[16px]">🌿</span>
                        {streak.streak} days of showing up
                    </motion.div>
                )}

                {/* Main greeting */}
                <h1 className="text-[28px] sm:text-[36px] md:text-[44px] font-semibold text-white tracking-tight mb-3">
                    {greeting} <span className="inline-block">{greetingEmoji}</span>
                </h1>

                {/* Emotional reflection */}
                <motion.div
                    key={currentMoodState || 'default'}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-md mx-auto"
                >
                    <p className="text-[18px] sm:text-[20px] text-white/70 font-light mb-1">
                        {emotionalReflection.primary}
                    </p>
                    <p className="text-[16px] sm:text-[18px] text-white/40 font-light italic">
                        {emotionalReflection.secondary}
                    </p>
                </motion.div>

                {/* Current mood indicator */}
                {currentMoodConfig && !showMoodPicker && (
                    <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => setShowMoodPicker(true)}
                        className="inline-flex items-center gap-3 mt-6 px-5 py-2.5 rounded-full bg-white/[0.05] border border-white/10 hover:bg-white/[0.08] hover:border-white/20 transition-all"
                    >
                        <span className="text-[24px]">{currentMoodConfig.emoji}</span>
                        <span className="text-[14px] text-white/60">
                            Feeling <span className="text-white font-medium">{currentMoodConfig.label}</span>
                        </span>
                        <span className="text-[12px] text-white/30">tap to update</span>
                    </motion.button>
                )}
            </motion.div>

            {/* Mood Picker (collapsible) */}
            <AnimatePresence>
                {(showMoodPicker || !currentMoodState) && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mb-8"
                    >
                        <p className="text-center text-[15px] text-white/50 mb-4">
                            {currentMoodState ? "How are you feeling now?" : "How's your emotional temperature today?"}
                        </p>
                        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 sm:gap-3 max-w-2xl mx-auto">
                            {dashboardMoods.map((moodConfig) => (
                                <motion.button
                                    key={moodConfig.value}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleMoodSelect(moodConfig.value)}
                                    className={`relative flex flex-col items-center justify-center p-3 sm:p-4 rounded-[16px] sm:rounded-[20px] transition-all duration-300 border backdrop-blur-md
                                        ${loggedMood === moodConfig.value
                                            ? 'bg-white/20 border-white/40 ring-2 ring-white/20 shadow-lg shadow-white/10'
                                            : 'bg-white/[0.03] border-white/[0.05] hover:bg-white/[0.08] hover:border-white/20'
                                        }
                                    `}
                                    disabled={isLogging && loggedMood !== moodConfig.value}
                                >
                                    <span className="text-[24px] sm:text-[28px] mb-1">{moodConfig.emoji}</span>
                                    <span className="text-[10px] sm:text-[11px] font-medium text-white/60 uppercase tracking-wider">
                                        {moodConfig.label}
                                    </span>

                                    <AnimatePresence>
                                        {loggedMood === moodConfig.value && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.5 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.5 }}
                                                className="absolute -top-1 -right-1 bg-emerald-500 rounded-full p-0.5 shadow-lg"
                                            >
                                                <Check className="w-3 h-3 text-white" />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.button>
                            ))}
                        </div>

                        {currentMoodState && (
                            <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                onClick={() => setShowMoodPicker(false)}
                                className="block mx-auto mt-4 text-[13px] text-white/40 hover:text-white/60 transition-colors"
                            >
                                Cancel
                            </motion.button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Feedback message */}
            <AnimatePresence>
                {feedback && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-center text-[14px] font-medium text-emerald-400/90 mb-6"
                    >
                        {feedback}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Primary CTAs */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
            >
                {/* Primary glowing action */}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                        if (primaryAction === 'check-in') setShowMoodPicker(true);
                        else if (primaryAction === 'companion') router.push('/ai-support');
                        else if (primaryAction === 'calm') router.push('/calm');
                        else router.push('/journal/new');
                    }}
                    className="relative px-6 py-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium text-[15px] shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
                >
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 blur-xl opacity-50" />
                    <span className="relative flex items-center gap-2">
                        {primaryAction === 'check-in' && <><Heart className="w-4 h-4" /> Take 30-sec Check-In</>}
                        {primaryAction === 'companion' && <><MessageCircle className="w-4 h-4" /> Talk to AI Companion</>}
                        {primaryAction === 'calm' && <><Wind className="w-4 h-4" /> Find Your Calm</>}
                        {primaryAction === 'journal' && <><Sparkles className="w-4 h-4" /> Start Guided Reflection</>}
                    </span>
                </motion.button>

                {/* Secondary actions */}
                <div className="flex items-center gap-3">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => router.push('/tasks')}
                        className="px-5 py-3 rounded-full bg-white/[0.05] border border-white/10 text-white/70 font-medium text-[14px] hover:bg-white/[0.08] hover:text-white transition-all"
                    >
                        <span className="flex items-center gap-2">
                            <ListTodo className="w-4 h-4" /> Gentle Plan
                        </span>
                    </motion.button>
                    {primaryAction !== 'journal' && (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => router.push('/journal/new')}
                            className="px-5 py-3 rounded-full bg-white/[0.05] border border-white/10 text-white/70 font-medium text-[14px] hover:bg-white/[0.08] hover:text-white transition-all"
                        >
                            <span className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4" /> Reflect
                            </span>
                        </motion.button>
                    )}
                    {primaryAction !== 'companion' && (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => router.push('/ai-support')}
                            className="px-5 py-3 rounded-full bg-white/[0.05] border border-white/10 text-white/70 font-medium text-[14px] hover:bg-white/[0.08] hover:text-white transition-all"
                        >
                            <span className="flex items-center gap-2">
                                <MessageCircle className="w-4 h-4" /> Talk
                            </span>
                        </motion.button>
                    )}
                </div>
            </motion.div>
        </div>
    );
};
