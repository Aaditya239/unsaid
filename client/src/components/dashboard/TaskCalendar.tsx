'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import dayjs from 'dayjs';
import { useTaskStore } from '@/stores/taskStore';

export const TaskCalendar = () => {
    const { selectedDate, setSelectedDate, fetchTasksForDate, calendarSummary, fetchCalendarSummary } = useTaskStore();

    React.useEffect(() => {
        fetchCalendarSummary(dayjs(selectedDate).format('YYYY-MM-DD'));
    }, [fetchCalendarSummary, selectedDate]);

    // Generate 7 days around selected date
    const days = Array.from({ length: 7 }, (_, i) => {
        return dayjs(selectedDate).subtract(3 - i, 'day');
    });

    const handleDateSelect = (date: dayjs.Dayjs) => {
        const newDate = date.toDate();
        newDate.setHours(0, 0, 0, 0);
        setSelectedDate(newDate);
        fetchTasksForDate(newDate);
    };

    const moodColor = (mood: string | null) => {
        if (!mood) return 'bg-white/20';
        if (['SAD', 'ANXIOUS', 'STRESSED'].includes(mood)) return 'bg-amber-300';
        if (['HAPPY', 'EXCITED', 'CALM', 'GRATEFUL'].includes(mood)) return 'bg-emerald-300';
        return 'bg-indigo-300';
    };

    return (
        <div className="bg-black/20 backdrop-blur-xl border border-white/[0.04] rounded-[24px] p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-[18px] font-medium text-white">
                        {dayjs(selectedDate).format('MMMM YYYY')}
                    </h3>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleDateSelect(dayjs(selectedDate).subtract(1, 'day'))}
                        className="p-2 rounded-full hover:bg-white/5 transition-colors text-white/40 hover:text-white"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleDateSelect(dayjs(selectedDate).add(1, 'day'))}
                        className="p-2 rounded-full hover:bg-white/5 transition-colors text-white/40 hover:text-white"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="flex justify-between items-center gap-2">
                {days.map((day, idx) => {
                    const isSelected = day.isSame(dayjs(selectedDate), 'day');
                    const isToday = day.isSame(dayjs(), 'day');
                    const key = day.format('YYYY-MM-DD');
                    const summary = calendarSummary.find((d) => d.date === key);

                    return (
                        <motion.button
                            key={idx}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDateSelect(day)}
                            className={`flex flex-col items-center gap-1 flex-1 py-3 rounded-[16px] transition-all duration-300 border
                                ${isSelected
                                    ? 'bg-indigo-500/20 border-indigo-500/40 text-white shadow-lg shadow-indigo-500/10'
                                    : 'bg-white/[0.02] border-white/[0.05] text-white/30 hover:border-white/10 hover:text-white/60'}
                            `}
                            title={summary
                                ? `Mood: ${summary.mood || 'None'} | Tasks: ${summary.completed}/${summary.total} | Energy used: ${summary.energyUsed}%`
                                : 'No data'}
                        >
                            <span className="text-[10px] font-bold uppercase tracking-widest">{day.format('ddd')}</span>
                            <span className="text-[18px] font-semibold">{day.format('D')}</span>
                            {summary && (
                                <>
                                    <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${moodColor(summary.mood)}`} />
                                    <span className="text-[10px] text-white/50">{summary.completionRatio}%</span>
                                    <span className="text-[10px] text-white/40">{summary.capacityPercentage}% cap</span>
                                </>
                            )}
                            {isToday && !isSelected && (
                                <div className="w-1 h-1 bg-indigo-400 rounded-full mt-1" />
                            )}
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
};
