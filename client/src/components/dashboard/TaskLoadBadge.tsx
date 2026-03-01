"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTaskStore } from "@/stores/taskStore";
import dayjs from "dayjs";

interface LoadData {
    dailyLoadScore: number;
    loadLabel: "Balanced" | "Heavy" | "Overloaded";
    heavyDayStreak: number;
    focusScore: number;
}

const LABEL_CONFIG = {
    Balanced: {
        dot: "bg-emerald-400",
        text: "text-emerald-400/80",
        border: "border-emerald-500/15",
        bg: "bg-emerald-500/5",
        glow: "",
    },
    Heavy: {
        dot: "bg-amber-400",
        text: "text-amber-400/80",
        border: "border-amber-500/15",
        bg: "bg-amber-500/5",
        glow: "",
    },
    Overloaded: {
        dot: "bg-red-400 animate-pulse",
        text: "text-red-400/80",
        border: "border-red-500/15",
        bg: "bg-red-500/5",
        glow: "shadow-[0_0_10px_rgba(248,113,113,0.15)]",
    },
};

export const TaskLoadBadge: React.FC<{ dateStr?: string }> = ({ dateStr }) => {
    const { selectedDate } = useTaskStore();
    const [load, setLoad] = useState<LoadData | null>(null);
    const [showTooltip, setShowTooltip] = useState(false);
    const tooltipRef = useRef<HTMLDivElement>(null);

    const targetDate = dateStr || dayjs(selectedDate).format("YYYY-MM-DD");

    useEffect(() => {
        const fetchLoad = async () => {
            try {
                const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
                const res = await fetch(`/api/tasks/analytics/load?date=${targetDate}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) return;
                const json = await res.json();
                setLoad(json.data);
            } catch {
                // fail silently — badge is non-critical
            }
        };
        fetchLoad();
    }, [targetDate]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
                setShowTooltip(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    if (!load) return null;

    const config = LABEL_CONFIG[load.loadLabel] || LABEL_CONFIG.Balanced;
    const streakNote = load.heavyDayStreak >= 3
        ? ` — ${load.heavyDayStreak} heavy days in a row.`
        : "";

    return (
        <div className="relative" ref={tooltipRef}>
            <button
                onClick={() => setShowTooltip((p) => !p)}
                className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border transition-all text-[11px] font-medium",
                    config.text, config.border, config.bg, config.glow
                )}
            >
                <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", config.dot)} />
                {load.loadLabel}
            </button>

            <AnimatePresence>
                {showTooltip && (
                    <motion.div
                        initial={{ opacity: 0, y: 4, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full mt-2 right-0 w-[240px] bg-[rgba(14,18,30,0.97)] border border-white/[0.08] rounded-[14px] shadow-[0_12px_40px_rgba(0,0,0,0.5)] p-3.5 z-30"
                    >
                        <p className="text-[12px] text-white/70 leading-snug">
                            Cognitive load:{" "}
                            <span className={cn("font-semibold", config.text)}>
                                {Math.round(load.dailyLoadScore)}/100
                            </span>
                            {streakNote ? <span className="text-amber-400/70">{streakNote}</span> : ""}
                        </p>
                        <div className="mt-2.5 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                            <motion.div
                                className={cn("h-full rounded-full", load.loadLabel === "Balanced" ? "bg-emerald-400/60" : load.loadLabel === "Heavy" ? "bg-amber-400/60" : "bg-red-400/60")}
                                initial={{ width: 0 }}
                                animate={{ width: `${load.dailyLoadScore}%` }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                            />
                        </div>
                        {load.loadLabel === "Overloaded" && (
                            <p className="text-[11px] text-red-400/60 mt-2">
                                Consider moving one heavy task to tomorrow.
                            </p>
                        )}
                        {load.heavyDayStreak >= 3 && (
                            <p className="text-[11px] text-amber-400/60 mt-1.5">
                                You've been running heavy for {load.heavyDayStreak} days. A lighter day helps.
                            </p>
                        )}
                        <p className="text-[11px] text-white/30 mt-2">Focus score: {load.focusScore}/100</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
