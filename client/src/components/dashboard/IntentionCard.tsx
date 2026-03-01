'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Compass, Wind, Target, Sun, Moon, Heart } from 'lucide-react';

const INTENTIONS = [
    { id: 'calm', label: 'Calm', icon: <Wind className="w-5 h-5" />, color: 'text-teal-400', bg: 'bg-teal-400/10', border: 'border-teal-400/30', message: 'inviting stillness' },
    { id: 'focus', label: 'Focus', icon: <Target className="w-5 h-5" />, color: 'text-indigo-400', bg: 'bg-indigo-400/10', border: 'border-indigo-400/30', message: 'sharpening your attention' },
    { id: 'light', label: 'Light', icon: <Sun className="w-5 h-5" />, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30', message: 'welcoming lightness' },
    { id: 'rest', label: 'Rest', icon: <Moon className="w-5 h-5" />, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/30', message: 'honoring your need for rest' },
    { id: 'connect', label: 'Connect', icon: <Heart className="w-5 h-5" />, color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/30', message: 'opening to connection' },
];

export const IntentionCard = () => {
    const [selected, setSelected] = useState<string | null>(null);

    // Load saved intention from localStorage
    useEffect(() => {
        const savedIntention = localStorage.getItem('dailyIntention');
        const savedDate = localStorage.getItem('intentionDate');
        const today = new Date().toDateString();
        
        if (savedIntention && savedDate === today) {
            setSelected(savedIntention);
        }
    }, []);

    const handleSelect = (id: string) => {
        setSelected(id);
        localStorage.setItem('dailyIntention', id);
        localStorage.setItem('intentionDate', new Date().toDateString());
    };

    const selectedIntention = INTENTIONS.find(i => i.id === selected);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="bg-gradient-to-br from-indigo-500/[0.06] to-purple-500/[0.04] backdrop-blur-xl border border-white/[0.06] rounded-[28px] p-6"
        >
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                    <Compass className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                    <h3 className="text-[17px] sm:text-[18px] font-medium text-white">Today's Energy</h3>
                    <p className="text-[12px] text-white/40">What do you want to invite in?</p>
                </div>
            </div>

            {/* Intention pills */}
            <div className="flex flex-wrap gap-2 sm:gap-3">
                {INTENTIONS.map((intention) => (
                    <motion.button
                        key={intention.id}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => handleSelect(intention.id)}
                        className={`flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-2.5 sm:py-3 rounded-full transition-all duration-300 border
                            ${selected === intention.id
                                ? `${intention.bg} ${intention.border} shadow-lg shadow-black/20`
                                : 'bg-white/[0.02] border-white/[0.05] hover:border-white/10'}
                        `}
                    >
                        <div className={`${selected === intention.id ? intention.color : 'text-white/40'} transition-colors`}>
                            {intention.icon}
                        </div>
                        <span className={`text-[14px] sm:text-[15px] font-medium tracking-tight transition-colors
                            ${selected === intention.id ? 'text-white' : 'text-white/40'}`}
                        >
                            {intention.label}
                        </span>
                    </motion.button>
                ))}
            </div>

            {/* Selected message */}
            <motion.p 
                key={selected || 'default'}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[12px] sm:text-[13px] text-white/30 mt-5 italic font-light"
            >
                {selectedIntention
                    ? `You're ${selectedIntention.message} today. A gentle promise to yourself.`
                    : "Choose the energy you want to cultivate today."}
            </motion.p>
        </motion.div>
    );
};
