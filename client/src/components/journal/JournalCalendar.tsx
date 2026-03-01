'use client';

import { useState } from 'react';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    isToday,
    startOfWeek,
    endOfWeek,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { JournalEntry } from '@/lib/journal';
import { cn } from '@/lib/utils';

interface JournalCalendarProps {
    entries: JournalEntry[];
    selectedDate: Date;
    onSelectDate: (date: Date) => void;
    className?: string;
}

export default function JournalCalendar({
    entries,
    selectedDate,
    onSelectDate,
    className,
}: JournalCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(startOfMonth(selectedDate));

    // Calendar logic
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const daysInMonth = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    // Helper to get entries for a specific day
    const getEntriesForDay = (date: Date) => {
        return entries.filter((entry) => isSameDay(new Date(entry.createdAt), date));
    };

    // Extract a color based on emotion matching the pastel aesthetic
    const getDotColor = (entry: JournalEntry) => {
        if (!entry.emotion) return 'bg-warm-200 shadow-sm'; // Default

        // Elegant glow mapping
        const map: Record<string, string> = {
            HAPPY: 'bg-yellow-300 shadow-[0_0_6px_rgba(253,224,71,0.8)]', // Radiating Yellow
            CALM: 'bg-emerald-300 shadow-[0_0_6px_rgba(110,231,183,0.8)]', // Soft Green 
            HOPEFUL: 'bg-rose-300 shadow-[0_0_6px_rgba(253,164,175,0.8)]', // Warm Pink
            ANXIOUS: 'bg-orange-300 shadow-[0_0_6px_rgba(253,186,116,0.8)]', // Soft Orange
            SAD: 'bg-blue-300 shadow-[0_0_6px_rgba(147,197,253,0.8)]', // Soft Blue
            GRATEFUL: 'bg-purple-300 shadow-[0_0_6px_rgba(216,180,254,0.8)]', // Soft Purple
            EXCITED: 'bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.8)]', // Vibrant Red
        };
        return map[entry.emotion] || 'bg-warm-200 shadow-sm';
    };

    return (
        <div className={cn('w-full glass-card p-6 md:p-8', className)}>
            {/* Header Month/Year */}
            <div className="flex items-center justify-between mb-8 px-2 relative z-10">
                <button
                    onClick={prevMonth}
                    className="p-2 text-coffee-light hover:text-coffee hover:bg-white/40 rounded-full transition-all duration-300"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl md:text-2xl font-serif font-semibold tracking-wide hero-text-gradient bg-clip-text text-transparent drop-shadow-sm">
                    {format(currentMonth, 'MMMM yyyy')}
                </h2>
                <button
                    onClick={nextMonth}
                    className="p-2 text-coffee-light hover:text-coffee hover:bg-white/40 rounded-full transition-all duration-300"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            {/* Days of week header */}
            <div className="grid grid-cols-7 mb-4 px-2 relative z-10">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                    <div
                        key={i}
                        className="text-center text-[11px] md:text-xs font-semibold tracking-widest text-coffee-light/80 pb-2"
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-y-6 px-2 relative z-10">
                {daysInMonth.map((day, idx) => {
                    const isSelected = isSameDay(day, selectedDate);
                    const isCurrentMonthDay = isSameMonth(day, currentMonth);
                    const dayEntries = getEntriesForDay(day);

                    return (
                        <div
                            key={day.toISOString() + idx}
                            onClick={() => onSelectDate(day)}
                            className="relative flex flex-col items-center justify-start h-12 cursor-pointer group"
                        >
                            {/* Date Number Container */}
                            <div
                                className={cn(
                                    'w-10 h-10 flex items-center justify-center rounded-full text-base sm:text-[17px] transition-all duration-300',
                                    !isCurrentMonthDay && 'invisible', // Hide days outside current month to match minimal look
                                    isSelected
                                        ? 'bg-gradient-to-br from-rose-300 to-blush-400 text-white font-semibold shadow-[0_4px_16px_rgba(219,181,181,0.6)] scale-110' // Selected state 
                                        : isToday(day)
                                            ? 'border-[1.5px] border-rose-300 text-coffee-dark font-medium shadow-[inset_0_2px_8px_rgba(219,181,181,0.2)]'
                                            : 'text-coffee-light group-hover:bg-white/60 group-hover:text-coffee-dark font-medium'
                                )}
                            >
                                {format(day, 'd')}
                            </div>

                            {/* Colored Dots Container for Entries */}
                            {isCurrentMonthDay && dayEntries.length > 0 && (
                                <div className="absolute -bottom-2 flex gap-1.5 items-center justify-center w-full transition-transform group-hover:-translate-y-0.5">
                                    {dayEntries.slice(0, 3).map((entry, i) => (
                                        <span
                                            key={entry.id || i}
                                            className={cn(
                                                'w-[6px] h-[6px] rounded-full',
                                                getDotColor(entry)
                                            )}
                                        />
                                    ))}
                                    {dayEntries.length > 3 && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-coffee-light/40" />
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
