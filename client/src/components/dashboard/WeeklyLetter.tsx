"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Feather, X } from "lucide-react";

interface LetterData {
    letter: string | null;
    date: string | null;
}

// Only show Sat (6) and Sun (0)
const isWeekendDisplay = () => {
    const day = new Date().getDay();
    return day === 0 || day === 6;
};

export const WeeklyLetter: React.FC = () => {
    const [data, setData] = useState<LetterData | null>(null);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        if (!isWeekendDisplay()) return;
        // Check if already dismissed this letter (by date stored in localStorage)
        const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
        const lastDismissed = typeof window !== "undefined" ? localStorage.getItem("weeklyLetterDismissed") : null;

        const fetchLetter = async () => {
            try {
                const res = await fetch("/api/tasks/weekly-letter", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) return;
                const json = await res.json();
                if (json.data?.letter) {
                    setData(json.data);
                    if (lastDismissed && json.data.date && lastDismissed === json.data.date) {
                        setDismissed(true);
                    }
                }
            } catch {
                // fail silently
            }
        };
        fetchLetter();
    }, []);

    const handleDismiss = () => {
        setDismissed(true);
        if (data?.date && typeof window !== "undefined") {
            localStorage.setItem("weeklyLetterDismissed", data.date);
        }
    };

    if (!data?.letter || dismissed || !isWeekendDisplay()) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="mt-6 relative rounded-[22px] p-[1px] overflow-hidden"
                style={{
                    background: "linear-gradient(135deg, rgba(79,124,255,0.25), rgba(156,107,255,0.25), rgba(79,124,255,0.1))",
                }}
            >
                {/* Inner card */}
                <div
                    className="relative rounded-[21px] p-6"
                    style={{
                        background: "linear-gradient(180deg, rgba(20,24,42,0.97), rgba(14,18,30,0.98))",
                    }}
                >
                    {/* Dismiss */}
                    <button
                        onClick={handleDismiss}
                        className="absolute top-4 right-4 p-1.5 rounded-full text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-all"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>

                    {/* Header */}
                    <div className="flex items-center gap-2.5 mb-4">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center bg-gradient-to-br from-[#4F7CFF]/20 to-[#9C6BFF]/20 border border-white/[0.06]">
                            <Feather className="w-3.5 h-3.5 text-[#9C6BFF]/80" />
                        </div>
                        <div>
                            <p className="text-[11px] text-white/30 uppercase tracking-widest">Your week</p>
                        </div>
                    </div>

                    {/* Letter body */}
                    <p
                        className="text-[14px] leading-[1.8] text-white/65"
                        style={{ fontStyle: "italic" }}
                    >
                        {data.letter}
                    </p>

                    {/* Subtle gradient fade at bottom */}
                    <div
                        className="absolute bottom-0 left-0 right-0 h-8 rounded-b-[21px] pointer-events-none"
                        style={{
                            background: "linear-gradient(to bottom, transparent, rgba(14,18,30,0.6))",
                        }}
                    />
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
