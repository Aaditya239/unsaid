"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ChevronDown, ChevronUp, Atom, ArrowRight, X } from "lucide-react";
import { useTaskStore, Task } from "@/stores/taskStore";
import dayjs from "dayjs";

interface ResistTask extends Task {
    resistanceFlaggedAt?: string;
}

export const ResistancePanel: React.FC = () => {
    const [tasks, setTasks] = useState<ResistTask[]>([]);
    const [expanded, setExpanded] = useState(false);
    const [loading, setLoading] = useState(false);
    const { createTask, deleteTask, generateSubtasks } = useTaskStore();

    const fetchResistance = useCallback(async () => {
        try {
            const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
            const res = await fetch("/api/tasks/resistance", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) return;
            const json = await res.json();
            setTasks(json.data?.tasks || []);
        } catch {
            // fail silently
        }
    }, []);

    useEffect(() => {
        fetchResistance();
    }, [fetchResistance]);

    const handleAction = async (task: ResistTask, action: "today" | "breakdown" | "release") => {
        setLoading(true);
        try {
            const todayStr = dayjs().format("YYYY-MM-DD");
            if (action === "today") {
                await createTask({ title: task.title, taskDate: todayStr, priority: task.priority, energyLevelRequired: task.energyLevelRequired, category: task.category, recurring: "NONE" });
            } else if (action === "breakdown") {
                const steps = await generateSubtasks(task.title, task.description || undefined);
                for (const step of steps) {
                    await createTask({ title: step, taskDate: todayStr, priority: "LOW", energyLevelRequired: "LOW", category: task.category, recurring: "NONE" });
                }
                await deleteTask(task.id);
            } else {
                await deleteTask(task.id);
            }
            // Clear resistance flag
            const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
            await fetch(`/api/tasks/resistance/${task.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            setTasks((prev) => prev.filter((t) => t.id !== task.id));
        } finally {
            setLoading(false);
        }
    };

    if (tasks.length === 0) return null;

    const daysStuck = (task: ResistTask) => {
        if (!task.resistanceFlaggedAt) return "3+";
        return dayjs().diff(dayjs(task.resistanceFlaggedAt), "day") + "+";
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-[18px] border border-amber-500/15 bg-amber-500/[0.03] overflow-hidden"
        >
            <button
                onClick={() => setExpanded((p) => !p)}
                className="w-full flex items-center justify-between px-5 py-3.5 text-left"
            >
                <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400/60 shrink-0" />
                    <span className="text-[13px] font-medium text-amber-400/70">
                        Still waiting{" "}
                        <span className="text-amber-400/40 font-normal text-[12px]">
                            ({tasks.length} {tasks.length === 1 ? "task" : "tasks"})
                        </span>
                    </span>
                </div>
                {expanded ? (
                    <ChevronUp className="w-4 h-4 text-white/30" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-white/30" />
                )}
            </button>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                    >
                        <div className="px-5 pb-4 space-y-3 border-t border-amber-500/10">
                            {tasks.map((task) => (
                                <div
                                    key={task.id}
                                    className="flex items-start justify-between gap-3 pt-3"
                                >
                                    <div className="min-w-0">
                                        <p className="text-[13px] text-white/70 truncate">{task.title}</p>
                                        <p className="text-[11px] text-white/30 mt-0.5">
                                            Untouched for {daysStuck(task)} days
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <button
                                            disabled={loading}
                                            onClick={() => handleAction(task, "today")}
                                            title="Move to today"
                                            className="flex items-center gap-1 px-2 py-1 text-[11px] text-white/50 bg-white/[0.04] hover:bg-white/[0.08] rounded-full border border-white/[0.06] transition-all"
                                        >
                                            <ArrowRight className="w-3 h-3" /> Today
                                        </button>
                                        <button
                                            disabled={loading}
                                            onClick={() => handleAction(task, "breakdown")}
                                            title="Break into steps"
                                            className="flex items-center gap-1 px-2 py-1 text-[11px] text-[#9C6BFF]/70 bg-[#9C6BFF]/5 hover:bg-[#9C6BFF]/10 rounded-full border border-[#9C6BFF]/15 transition-all"
                                        >
                                            <Atom className="w-3 h-3" /> Steps
                                        </button>
                                        <button
                                            disabled={loading}
                                            onClick={() => handleAction(task, "release")}
                                            title="Release this task"
                                            className="p-1 text-white/30 hover:text-white/60 transition-colors rounded-full"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
