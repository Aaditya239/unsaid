'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Feather, ArrowRight, ChevronDown, Wind, BookOpen, Sun, Moon, Heart, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMoodStore } from '@/stores/moodStore';

// Gentle actions based on emotional state
const GENTLE_ACTIONS: Record<string, { title: string; description: string; icon: React.ReactNode; route: string; duration?: string }[]> = {
    SAD: [
        { title: "Step outside for 5 minutes", description: "Fresh air can shift your perspective", icon: <Sun className="w-5 h-5" />, route: '/calm', duration: '5 min' },
        { title: "Write what's weighing on you", description: "Sometimes words help us release", icon: <BookOpen className="w-5 h-5" />, route: '/journal/new' },
        { title: "Talk to someone who understands", description: "You don't have to carry this alone", icon: <Heart className="w-5 h-5" />, route: '/ai-support' },
    ],
    ANXIOUS: [
        { title: "Take 5 slow breaths", description: "Breathe in for 4, hold for 4, out for 6", icon: <Wind className="w-5 h-5" />, route: '/calm', duration: '2 min' },
        { title: "Ground yourself here", description: "Name 5 things you can see right now", icon: <Clock className="w-5 h-5" />, route: '/calm' },
        { title: "Let your thoughts flow out", description: "Writing can calm a racing mind", icon: <BookOpen className="w-5 h-5" />, route: '/journal/new' },
    ],
    ANGRY: [
        { title: "Pause before you react", description: "This feeling will pass", icon: <Clock className="w-5 h-5" />, route: '/calm', duration: '3 min' },
        { title: "Release it onto paper", description: "Write what you wish you could say", icon: <BookOpen className="w-5 h-5" />, route: '/journal/new' },
        { title: "Move your body", description: "Physical movement releases tension", icon: <Wind className="w-5 h-5" />, route: '/calm' },
    ],
    TIRED: [
        { title: "Close your eyes for 5 minutes", description: "Even micro-rest helps", icon: <Moon className="w-5 h-5" />, route: '/calm', duration: '5 min' },
        { title: "Drink a glass of water", description: "Dehydration amplifies fatigue", icon: <Heart className="w-5 h-5" />, route: '/calm' },
        { title: "Set one small intention", description: "You don't need to do everything today", icon: <BookOpen className="w-5 h-5" />, route: '/journal/new' },
    ],
    HAPPY: [
        { title: "Capture what made today good", description: "So you can return to it later", icon: <BookOpen className="w-5 h-5" />, route: '/journal/new' },
        { title: "Share your energy", description: "Reach out to someone you care about", icon: <Heart className="w-5 h-5" />, route: '/ai-support' },
        { title: "Build on this momentum", description: "What else could feel this good?", icon: <Sun className="w-5 h-5" />, route: '/journal/new' },
    ],
    CALM: [
        { title: "Savor this feeling", description: "Notice what brought you here", icon: <Heart className="w-5 h-5" />, route: '/journal/new' },
        { title: "Deepen your stillness", description: "A few minutes of quiet", icon: <Wind className="w-5 h-5" />, route: '/calm', duration: '10 min' },
        { title: "Reflect on your week", description: "What patterns do you notice?", icon: <BookOpen className="w-5 h-5" />, route: '/journal/new' },
    ],
    GRATEFUL: [
        { title: "Write a gratitude note", description: "Document what you're thankful for", icon: <BookOpen className="w-5 h-5" />, route: '/journal/new' },
        { title: "Extend this feeling", description: "Who else could you appreciate?", icon: <Heart className="w-5 h-5" />, route: '/ai-support' },
    ],
    DEFAULT: [
        { title: "Check in with yourself", description: "Just 30 seconds of awareness", icon: <Heart className="w-5 h-5" />, route: '/mood' },
        { title: "Write a few sentences", description: "What's on your mind right now?", icon: <BookOpen className="w-5 h-5" />, route: '/journal/new' },
        { title: "Find a moment of calm", description: "Even a minute makes a difference", icon: <Wind className="w-5 h-5" />, route: '/calm', duration: '1 min' },
    ]
};

export const AdaptiveSuggestionCard = () => {
    const router = useRouter();
    const { stats } = useMoodStore();
    const [showMore, setShowMore] = useState(false);

    const currentMood = stats?.mostFrequentMood || 'DEFAULT';
    
    const suggestions = useMemo(() => {
        return GENTLE_ACTIONS[currentMood] || GENTLE_ACTIONS.DEFAULT;
    }, [currentMood]);

    const primarySuggestion = suggestions[0];
    const additionalSuggestions = suggestions.slice(1);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-gradient-to-br from-amber-500/[0.08] to-orange-500/[0.04] backdrop-blur-xl border border-white/[0.06] rounded-[28px] p-6 h-full flex flex-col"
        >
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <Feather className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                    <h3 className="text-[17px] sm:text-[18px] font-medium text-white">One Gentle Step</h3>
                    <p className="text-[12px] text-white/40">Just one. That's enough.</p>
                </div>
            </div>

            {/* Primary suggestion */}
            <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => router.push(primarySuggestion.route)}
                className="flex-1 w-full text-left p-5 sm:p-6 rounded-[20px] bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.08] hover:border-white/15 transition-all duration-300 group mb-4"
            >
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 group-hover:bg-amber-500/30 transition-colors">
                        {primarySuggestion.icon}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-[16px] sm:text-[17px] font-medium text-white group-hover:text-amber-100 transition-colors">
                                {primarySuggestion.title}
                            </h4>
                            {primarySuggestion.duration && (
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/[0.08] text-white/50">
                                    {primarySuggestion.duration}
                                </span>
                            )}
                        </div>
                        <p className="text-[13px] sm:text-[14px] text-white/50 line-clamp-2">
                            {primarySuggestion.description}
                        </p>
                    </div>
                    <div className="text-white/20 group-hover:text-amber-400 group-hover:translate-x-1 transition-all">
                        <ArrowRight className="w-5 h-5" />
                    </div>
                </div>
            </motion.button>

            {/* Show more toggle */}
            {additionalSuggestions.length > 0 && (
                <>
                    <button
                        onClick={() => setShowMore(!showMore)}
                        className="flex items-center justify-center gap-2 text-[13px] text-white/40 hover:text-white/60 transition-colors py-2"
                    >
                        <span>{showMore ? 'Show less' : 'See more options'}</span>
                        <motion.div animate={{ rotate: showMore ? 180 : 0 }}>
                            <ChevronDown className="w-4 h-4" />
                        </motion.div>
                    </button>

                    <AnimatePresence>
                        {showMore && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-2 overflow-hidden"
                            >
                                {additionalSuggestions.map((suggestion, idx) => (
                                    <motion.button
                                        key={idx}
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        onClick={() => router.push(suggestion.route)}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] hover:border-white/10 transition-all group"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center text-white/40 group-hover:text-amber-400 transition-colors">
                                            {suggestion.icon}
                                        </div>
                                        <span className="text-[14px] text-white/60 group-hover:text-white/80 transition-colors flex-1 text-left">
                                            {suggestion.title}
                                        </span>
                                        <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors" />
                                    </motion.button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}
        </motion.div>
    );
};
