'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, Flame, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useMoodStore } from '@/stores/moodStore';
import { Mood, MoodEntry, getMoodConfig } from '@/lib/mood';

interface DayPoint {
  date: Date;
  key: string;
  label: string;
  shortDate: string;
  entries: MoodEntry[];
  latestEntry: MoodEntry | null;
  dominantMood: Mood | null;
  averageIntensity: number | null;
}

const CHART_WIDTH = 720;
const CHART_HEIGHT = 180;
const CHART_PADDING_X = 26;
const CHART_PADDING_Y = 16;

const trendMeta = {
  improving: {
    icon: TrendingUp,
    label: 'Improving',
    tone: 'text-emerald-400',
    sentence: 'Your week started heavy but shows signs of lifting.',
  },
  dipping: {
    icon: TrendingDown,
    label: 'Energy dipping',
    tone: 'text-amber-400',
    sentence: 'There is a dip this week — maybe pause and reflect on it gently.',
  },
  steady: {
    icon: Minus,
    label: 'Emotionally steady',
    tone: 'text-sky-300',
    sentence: 'You have been emotionally steady this week.',
  },
} as const;

const moodFallbackHelp = 'Not shared in this check-in yet.';

const startOfWeek = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
};

const addDays = (date: Date, days: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const moodMode = (entries: MoodEntry[]): Mood | null => {
  if (!entries.length) return null;
  const counts = new Map<Mood, number>();
  entries.forEach((entry) => {
    counts.set(entry.mood, (counts.get(entry.mood) || 0) + 1);
  });
  let selected: Mood | null = null;
  let max = 0;
  counts.forEach((count, mood) => {
    if (count > max) {
      max = count;
      selected = mood;
    }
  });
  return selected;
};

const average = (values: number[]) => {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const makeSmoothPath = (points: Array<{ x: number; y: number }>) => {
  if (points.length < 2) return '';

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const midX = (prev.x + curr.x) / 2;
    const midY = (prev.y + curr.y) / 2;
    path += ` Q ${prev.x} ${prev.y}, ${midX} ${midY}`;
  }

  const last = points[points.length - 1];
  path += ` T ${last.x} ${last.y}`;
  return path;
};

export const EmotionalTimeline = () => {
  const { entries, streak, fetchEntries, isLoading } = useMoodStore();
  const [weekOffset, setWeekOffset] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchEntries({ range: 'all', limit: 200, page: 1 });
  }, [fetchEntries]);

  const weekStart = useMemo(() => {
    const now = new Date();
    const currentWeekStart = startOfWeek(now);
    return addDays(currentWeekStart, weekOffset * 7);
  }, [weekOffset]);

  const days = useMemo<DayPoint[]>(() => {
    const points: DayPoint[] = [];

    for (let i = 0; i < 7; i++) {
      const date = addDays(weekStart, i);
      const dayEntries = entries
        .filter((entry) => sameDay(new Date(entry.createdAt), date))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const latestEntry = dayEntries[0] || null;
      const avgIntensity = dayEntries.length
        ? Math.round(average(dayEntries.map((entry) => entry.intensity)) * 10) / 10
        : null;

      points.push({
        date,
        key: date.toISOString().slice(0, 10),
        label: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
        shortDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        entries: dayEntries,
        latestEntry,
        dominantMood: moodMode(dayEntries),
        averageIntensity: avgIntensity,
      });
    }

    return points;
  }, [entries, weekStart]);

  const points = useMemo(() => {
    const usable = days
      .map((day, index) => ({ day, index }))
      .filter(({ day }) => day.averageIntensity !== null)
      .map(({ day, index }) => {
        const x = CHART_PADDING_X + (index * (CHART_WIDTH - CHART_PADDING_X * 2)) / 6;
        const intensity = day.averageIntensity ?? 5;
        const y =
          CHART_HEIGHT -
          CHART_PADDING_Y -
          ((intensity - 1) / 9) * (CHART_HEIGHT - CHART_PADDING_Y * 2);
        return { x, y, index, day };
      });

    return usable;
  }, [days]);

  const curvePath = useMemo(() => makeSmoothPath(points.map((p) => ({ x: p.x, y: p.y }))), [points]);

  const analytics = useMemo(() => {
    const intensities = days
      .map((day) => day.averageIntensity)
      .filter((value): value is number => value !== null);

    const loggedDays = days.filter((day) => day.entries.length > 0).length;
    const missingDays = 7 - loggedDays;

    if (intensities.length === 0) {
      return {
        trend: 'steady' as const,
        summary: 'No mood logs this week yet. Start with one gentle check-in to begin your emotional story.',
        loggedDays,
        missingDays,
        mostFrequentMood: null as Mood | null,
        highestDay: null as DayPoint | null,
        lowestDay: null as DayPoint | null,
        microCelebration: null as string | null,
        gentleNudge: 'You have 2+ quiet days this week. A tiny check-in can help bring clarity.',
      };
    }

    const firstHalf = average(intensities.slice(0, Math.ceil(intensities.length / 2)));
    const secondHalf = average(intensities.slice(Math.floor(intensities.length / 2)));
    const delta = secondHalf - firstHalf;

    let trend: 'improving' | 'dipping' | 'steady' = 'steady';
    if (delta >= 0.7) trend = 'improving';
    else if (delta <= -0.7) trend = 'dipping';

    const moodCounts = new Map<Mood, number>();
    days.forEach((day) => {
      if (day.dominantMood) {
        moodCounts.set(day.dominantMood, (moodCounts.get(day.dominantMood) || 0) + 1);
      }
    });

    let mostFrequentMood: Mood | null = null;
    let mostCount = 0;
    moodCounts.forEach((count, mood) => {
      if (count > mostCount) {
        mostCount = count;
        mostFrequentMood = mood;
      }
    });

    const sortedByIntensity = [...days]
      .filter((day) => day.averageIntensity !== null)
      .sort((a, b) => (b.averageIntensity ?? 0) - (a.averageIntensity ?? 0));

    const highestDay = sortedByIntensity[0] || null;
    const lowestDay = sortedByIntensity[sortedByIntensity.length - 1] || null;

    const moodLabel = mostFrequentMood ? getMoodConfig(mostFrequentMood)?.label.toLowerCase() : 'mixed';

    const summary =
      trend === 'improving'
        ? `${trendMeta.improving.sentence} Your most frequent mood was ${moodLabel}.`
        : trend === 'dipping'
        ? `${trendMeta.dipping.sentence} Your most frequent mood was ${moodLabel}.`
        : `${trendMeta.steady.sentence} Your most frequent mood was ${moodLabel}.`;

    const today = new Date();
    const todayData = days.find((day) => sameDay(day.date, today));
    const yesterdayData = days.find((day) => sameDay(day.date, addDays(today, -1)));

    let microCelebration: string | null = null;
    if (
      todayData &&
      yesterdayData &&
      todayData.averageIntensity !== null &&
      yesterdayData.averageIntensity !== null &&
      todayData.averageIntensity > yesterdayData.averageIntensity
    ) {
      microCelebration = 'Small win: today feels a little lighter than yesterday. 🌱';
    }

    const gentleNudge =
      missingDays >= 2
        ? 'You have 2+ quiet days this week. A tiny check-in can help fill your emotional map.'
        : null;

    return {
      trend,
      summary,
      loggedDays,
      missingDays,
      mostFrequentMood,
      highestDay,
      lowestDay,
      microCelebration,
      gentleNudge,
    };
  }, [days]);

  const selectedDay = selectedIndex !== null ? days[selectedIndex] : null;

  const weekLabel = useMemo(() => {
    const weekEnd = addDays(weekStart, 6);
    const startLabel = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endLabel = weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${startLabel} – ${endLabel}`;
  }, [weekStart]);

  const TrendIcon = trendMeta[analytics.trend].icon;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.2 }}
      className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-[28px] p-5 sm:p-6 md:p-7"
    >
      <div className="flex flex-col gap-4 sm:gap-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-400/25 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="text-[18px] sm:text-[20px] font-semibold text-white">Your Journey — This Week</h3>
              <p className="text-[12px] sm:text-[13px] text-white/45">{weekLabel}</p>
              <p className="text-[14px] sm:text-[15px] text-white/75 mt-2 leading-relaxed">{analytics.summary}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start bg-white/[0.04] border border-white/[0.08] rounded-full p-1.5">
            <button
              onClick={() => {
                setWeekOffset((prev) => prev - 1);
                setSelectedIndex(null);
              }}
              className="p-1.5 rounded-full hover:bg-white/[0.1] text-white/70 hover:text-white transition-colors"
              aria-label="Previous week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setWeekOffset(0);
                setSelectedIndex(null);
              }}
              className="px-2 py-1 text-[11px] text-white/60 hover:text-white transition-colors"
            >
              This Week
            </button>
            <button
              onClick={() => {
                setWeekOffset((prev) => Math.min(prev + 1, 0));
                setSelectedIndex(null);
              }}
              disabled={weekOffset >= 0}
              className="p-1.5 rounded-full hover:bg-white/[0.1] text-white/70 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Next week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={weekOffset}
            initial={{ opacity: 0, x: weekOffset < 0 ? -22 : 22 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: weekOffset < 0 ? 22 : -22 }}
            transition={{ duration: 0.25 }}
            className="relative w-full overflow-x-auto"
          >
            <div className="min-w-[720px]">
              <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="w-full h-[210px]">
                <defs>
                  <linearGradient id="journeyLine" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor="rgba(99,102,241,0.3)" />
                    <stop offset="50%" stopColor="rgba(59,130,246,0.95)" />
                    <stop offset="100%" stopColor="rgba(168,85,247,0.6)" />
                  </linearGradient>
                </defs>

                {[2, 4, 6, 8, 10].map((level) => {
                  const y =
                    CHART_HEIGHT -
                    CHART_PADDING_Y -
                    ((level - 1) / 9) * (CHART_HEIGHT - CHART_PADDING_Y * 2);
                  return (
                    <line
                      key={level}
                      x1={CHART_PADDING_X}
                      x2={CHART_WIDTH - CHART_PADDING_X}
                      y1={y}
                      y2={y}
                      stroke="rgba(255,255,255,0.06)"
                      strokeDasharray="3 6"
                    />
                  );
                })}

                {curvePath && (
                  <path
                    d={curvePath}
                    fill="none"
                    stroke="url(#journeyLine)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {points.map((point) => {
                  const mood = point.day.dominantMood ? getMoodConfig(point.day.dominantMood) : null;
                  const isHovered = hoveredIndex === point.index;
                  const isSelected = selectedIndex === point.index;
                  return (
                    <g key={point.day.key}>
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r={isHovered || isSelected ? 18 : 14}
                        fill="rgba(59,130,246,0.18)"
                        stroke="rgba(255,255,255,0.35)"
                        strokeWidth="1.5"
                        className="transition-all duration-200"
                      />
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r={isHovered || isSelected ? 10 : 8}
                        fill="rgba(15,23,42,0.96)"
                        stroke="rgba(255,255,255,0.5)"
                        strokeWidth="1"
                      />
                      <foreignObject x={point.x - 12} y={point.y - 12} width={24} height={24}>
                        <div className="w-6 h-6 flex items-center justify-center text-[14px] leading-none">
                          {mood?.emoji || '•'}
                        </div>
                      </foreignObject>
                    </g>
                  );
                })}
              </svg>

              <div className="grid grid-cols-7 gap-2 mt-1">
                {days.map((day, index) => {
                  const moodConfig = day.dominantMood ? getMoodConfig(day.dominantMood) : null;
                  const isSelected = selectedIndex === index;
                  const isHovered = hoveredIndex === index;

                  return (
                    <button
                      key={day.key}
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      onClick={() => setSelectedIndex(index)}
                      className={`rounded-xl border px-2 py-2 text-center transition-all ${
                        isSelected
                          ? 'bg-white/[0.1] border-white/30 shadow-[0_0_30px_rgba(59,130,246,0.25)]'
                          : isHovered
                          ? 'bg-white/[0.07] border-white/20'
                          : 'bg-white/[0.03] border-white/[0.08]'
                      }`}
                    >
                      <div className="text-[11px] tracking-wider text-white/55 font-medium">{day.label}</div>
                      <div className="text-[11px] text-white/35">{day.shortDate}</div>
                      <div className="mt-1 text-[13px] text-white/80">
                        {moodConfig ? `${moodConfig.emoji} ${day.averageIntensity?.toFixed(1)}` : '—'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
            <p className="text-[12px] text-white/45">Consistency</p>
            <p className="text-[16px] text-white font-medium">Logged {analytics.loggedDays} / 7 days this week</p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
            <p className="text-[12px] text-white/45">Current Streak</p>
            <p className="text-[16px] text-white font-medium inline-flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              {streak?.streak || 0} day{(streak?.streak || 0) === 1 ? '' : 's'}
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
            <p className="text-[12px] text-white/45">Trend</p>
            <p className={`text-[16px] font-medium inline-flex items-center gap-2 ${trendMeta[analytics.trend].tone}`}>
              <TrendIcon className="w-4 h-4" />
              {trendMeta[analytics.trend].label}
            </p>
          </div>
        </div>

        {analytics.microCelebration && (
          <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-2 text-[13px] text-emerald-300">
            {analytics.microCelebration}
          </div>
        )}

        {analytics.gentleNudge && (
          <div className="rounded-xl border border-amber-300/20 bg-amber-500/10 px-4 py-2 text-[13px] text-amber-200">
            {analytics.gentleNudge}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedDay && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedIndex(null)}
              className="fixed inset-0 bg-black/55 backdrop-blur-[2px] z-40"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 24, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[24px] border-t border-white/10 bg-[#0f172a]/95 backdrop-blur-xl px-5 sm:px-7 py-5 sm:py-6 max-h-[70vh] overflow-y-auto"
            >
              <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div>
                    <p className="text-[12px] text-white/45 uppercase tracking-wider">{selectedDay.label}</p>
                    <h4 className="text-[20px] text-white font-semibold">{selectedDay.shortDate}</h4>
                  </div>
                  <button
                    onClick={() => setSelectedIndex(null)}
                    className="px-3 py-1.5 rounded-full text-[12px] bg-white/[0.08] text-white/80 hover:bg-white/[0.15]"
                  >
                    Close
                  </button>
                </div>

                {selectedDay.latestEntry ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
                      <p className="text-[12px] text-white/45">Mood selected</p>
                      <p className="text-[15px] text-white font-medium mt-1">
                        {getMoodConfig(selectedDay.latestEntry.mood)?.emoji} {getMoodConfig(selectedDay.latestEntry.mood)?.label}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
                      <p className="text-[12px] text-white/45">Intensity</p>
                      <p className="text-[15px] text-white font-medium mt-1">{selectedDay.latestEntry.intensity} / 10</p>
                    </div>
                    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
                      <p className="text-[12px] text-white/45">What drained you?</p>
                      <p className="text-[14px] text-white/85 mt-1">{selectedDay.latestEntry.contextTag || moodFallbackHelp}</p>
                    </div>
                    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
                      <p className="text-[12px] text-white/45">What helped?</p>
                      <p className="text-[14px] text-white/85 mt-1">{selectedDay.latestEntry.note || moodFallbackHelp}</p>
                    </div>
                    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 sm:col-span-2">
                      <p className="text-[12px] text-white/45">What you needed</p>
                      <p className="text-[14px] text-white/85 mt-1">{selectedDay.latestEntry.note || moodFallbackHelp}</p>
                    </div>
                    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 sm:col-span-2">
                      <p className="text-[12px] text-white/45">Time logged</p>
                      <p className="text-[14px] text-white/85 mt-1">
                        {new Date(selectedDay.latestEntry.createdAt).toLocaleString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 text-[14px] text-white/70">
                    No mood entry was logged on this day yet.
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {!isLoading && analytics.loggedDays === 0 && (
        <p className="text-center text-[13px] text-white/45 mt-5 italic">
          Your timeline will come alive after your first mood check-in this week.
        </p>
      )}
    </motion.section>
  );
};
