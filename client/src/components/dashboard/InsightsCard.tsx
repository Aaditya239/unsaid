'use client';
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, AlertTriangle } from 'lucide-react';
import { useTaskStore } from '@/stores/taskStore';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

export const InsightsCard: React.FC = () => {
    const { fetchInsights, checkBurnout, insights, burnoutData } = useTaskStore();

    useEffect(() => {
        fetchInsights();
        checkBurnout();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!insights) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="mt-5 rounded-[18px] bg-white/[0.025] border border-white/[0.05] p-5 space-y-4"
        >
            <div className="flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-[#9C6BFF]" />
                <span className="text-[12px] font-medium text-white/60 tracking-wide">Weekly Insights</span>
            </div>

            {/* Burnout nudge */}
            {burnoutData?.burnout && (
                <div className="flex items-start gap-2.5 bg-amber-500/5 border border-amber-500/10 rounded-[12px] p-3">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400/70 shrink-0 mt-0.5" />
                    <p className="text-[12px] text-amber-300/60 leading-relaxed">{burnoutData.message}</p>
                </div>
            )}

            {/* Insights text */}
            <div className="space-y-2">
                {insights.insights.map((line, i) => (
                    <p key={i} className="text-[13px] text-white/50 italic leading-relaxed">
                        &ldquo;{line}&rdquo;
                    </p>
                ))}
            </div>

            {/* Mood vs Productivity mini chart */}
            {insights.chartData.length > 0 && (
                <div>
                    <p className="text-[11px] text-white/30 mb-2">7-day completion rate</p>
                    <ResponsiveContainer width="100%" height={56}>
                        <LineChart data={insights.chartData}>
                            <Line
                                type="monotone"
                                dataKey="completionRate"
                                stroke="url(#insightGrad)"
                                strokeWidth={1.5}
                                dot={false}
                                activeDot={{ r: 3, fill: '#9C6BFF' }}
                            />
                            <defs>
                                <linearGradient id="insightGrad" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#4F7CFF" />
                                    <stop offset="100%" stopColor="#9C6BFF" />
                                </linearGradient>
                            </defs>
                            <Tooltip
                                contentStyle={{
                                    background: 'rgba(14,18,30,0.95)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: '10px',
                                    fontSize: '11px',
                                    color: 'rgba(255,255,255,0.6)',
                                }}
                                formatter={(v: number | undefined) => [`${v ?? 0}%`, 'Completion'] as [string, string]}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </motion.div>
    );
};
