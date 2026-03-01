'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check } from 'lucide-react';
import { NotificationManager } from '@/lib/notifications';

export const NotificationPrompt = () => {
    const [show, setShow] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        // Check if we already asked or if permission is already granted/denied
        const hasAsked = localStorage.getItem('notification_prompt_asked');
        const permission = NotificationManager.checkPermission();

        if (!hasAsked && permission === 'default') {
            // Show prompt after a short delay
            const timer = setTimeout(() => setShow(true), 3000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleEnable = async () => {
        setIsProcessing(true);
        const success = await NotificationManager.requestPermission();
        localStorage.setItem('notification_prompt_asked', 'true');
        setIsProcessing(false);
        setShow(false);
    };

    const handleDismiss = () => {
        localStorage.setItem('notification_prompt_asked', 'true');
        setShow(false);
    };

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    className="fixed bottom-24 right-6 left-6 md:left-auto md:w-[400px] z-[100]"
                >
                    <div className="bg-[#0F172A]/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden relative">
                        {/* Ambient Background Glow */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#4F7CFF]/10 rounded-full blur-3xl pointer-events-none"></div>

                        <button
                            onClick={handleDismiss}
                            className="absolute top-3 right-3 p-1 text-white/30 hover:text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-[#4F7CFF]/10 rounded-full flex items-center justify-center shrink-0 border border-[#4F7CFF]/20">
                                <Bell className="w-6 h-6 text-[#4F7CFF]" />
                            </div>

                            <div className="flex-1 pr-4">
                                <h3 className="text-white font-medium text-[16px] mb-1">Enable Gentle Reminders?</h3>
                                <p className="text-white/50 text-[13px] leading-relaxed">
                                    Get subtle nudges to write in your journal or check in with your emotions throughout the day.
                                </p>

                                <div className="flex items-center gap-3 mt-5">
                                    <button
                                        onClick={handleEnable}
                                        disabled={isProcessing}
                                        className="flex-1 py-2.5 bg-[#4F7CFF] hover:bg-[#3D66E0] text-white rounded-xl text-[14px] font-semibold transition-all shadow-lg shadow-[#4F7CFF]/20 active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        {isProcessing ? (
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            <>
                                                <Check className="w-4 h-4" />
                                                Enable
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={handleDismiss}
                                        className="flex-1 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] text-white/70 border border-white/10 rounded-xl text-[14px] font-medium transition-all active:scale-95"
                                    >
                                        Maybe Later
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
