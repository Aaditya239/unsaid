'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquareQuote, Quote } from 'lucide-react';
import api from '@/lib/api';

export const MessageFromPastSelf = () => {
    const [message, setMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchMessage = async () => {
            try {
                const response = await api.get('/ai/past-self-message');
                setMessage(response.data.data);
            } catch (error) {
                console.error("Failed to fetch past self message:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMessage();
    }, []);

    if (isLoading) {
        return <div className="h-[120px] rounded-[24px] bg-white/[0.03] animate-pulse" />;
    }

    if (!message) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-gradient-to-br from-rose-500/[0.06] to-pink-500/[0.04] backdrop-blur-xl border border-white/[0.06] rounded-[28px] p-6 sm:p-8 relative overflow-hidden group"
        >
            <div className="absolute top-4 right-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Quote className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
            </div>

            <div className="flex items-center gap-2 sm:gap-3 mb-4 relative z-10">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-rose-500/20 flex items-center justify-center">
                    <MessageSquareQuote className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400" />
                </div>
                <span className="text-[13px] sm:text-[14px] font-medium text-white/60 tracking-wide">A Note From Before</span>
            </div>

            <p className="text-[16px] sm:text-[18px] text-white/80 leading-relaxed font-light relative z-10 italic">
                &ldquo;{message}&rdquo;
            </p>
        </motion.div>
    );
};
