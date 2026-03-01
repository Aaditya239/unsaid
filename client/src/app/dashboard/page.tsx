'use client';

import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { User, Bell } from 'lucide-react';
import { useMoodStore } from '@/stores/moodStore';
import { useJournalStore } from '@/stores/journalStore';
import { useTaskStore } from '@/stores/taskStore';
import { useTheme } from '@/hooks/useTheme';

import { DashboardHero } from '@/components/dashboard/DashboardHero';
import { EmotionalSnapshotCard } from '@/components/dashboard/EmotionalSnapshotCard';
import { TinyWinsCard } from '@/components/dashboard/TinyWinsCard';
import { IntentionCard } from '@/components/dashboard/IntentionCard';
import { AdaptiveSuggestionCard } from '@/components/dashboard/AdaptiveSuggestionCard';
import { EmotionalTimeline } from '@/components/dashboard/EmotionalTimeline';
import { MessageFromPastSelf } from '@/components/dashboard/MessageFromPastSelf';

// Mood-based background gradients
const MOOD_BACKGROUNDS: Record<string, { primary: string; secondary: string }> = {
  SAD: { primary: 'from-blue-900/20 via-slate-900/40', secondary: 'bg-blue-600/8' },
  ANXIOUS: { primary: 'from-purple-900/20 via-slate-900/40', secondary: 'bg-purple-600/8' },
  ANGRY: { primary: 'from-red-900/15 via-slate-900/40', secondary: 'bg-red-600/6' },
  HAPPY: { primary: 'from-amber-900/15 via-orange-900/10', secondary: 'bg-amber-600/8' },
  CALM: { primary: 'from-teal-900/20 via-cyan-900/10', secondary: 'bg-teal-600/8' },
  GRATEFUL: { primary: 'from-rose-900/15 via-pink-900/10', secondary: 'bg-rose-600/6' },
  TIRED: { primary: 'from-slate-900/30 via-gray-900/20', secondary: 'bg-slate-600/8' },
  NEUTRAL: { primary: 'from-indigo-900/15 via-slate-900/30', secondary: 'bg-indigo-600/6' },
  DEFAULT: { primary: 'from-indigo-900/15 via-purple-900/10', secondary: 'bg-indigo-600/6' }
};

export default function DashboardPage() {
  const router = useRouter();
  const t = useTheme();
  const { fetchStats, fetchStreak, fetchEmotionalAnalysis, stats } = useMoodStore();
  const { fetchEntries: fetchJournalEntries } = useJournalStore();
  const { fetchTasks } = useTaskStore();

  useEffect(() => {
    fetchStats('week');
    fetchStreak();
    fetchEmotionalAnalysis();
    fetchJournalEntries({ limit: 5 });
    fetchTasks();
  }, [fetchStats, fetchStreak, fetchEmotionalAnalysis, fetchJournalEntries, fetchTasks]);

  // Get background based on current mood
  const bgColors = useMemo(() => {
    const mood = stats?.mostFrequentMood || 'DEFAULT';
    return MOOD_BACKGROUNDS[mood] || MOOD_BACKGROUNDS.DEFAULT;
  }, [stats]);

  return (
    <div className="min-h-screen font-sans pb-24 relative overflow-x-hidden text-white" style={t.pageBg}>
      <div className="absolute inset-0 z-0 pointer-events-none" style={t.bgGradientStyle}></div>
      <motion.div
        key={bgColors.primary}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.1 }}
        className="absolute inset-0 z-0 pointer-events-none"
      >
        <div className={`absolute inset-0 bg-gradient-to-b ${bgColors.primary} to-transparent`} />
        <div className={`absolute top-[-15%] left-[-10%] w-[50%] h-[50%] ${bgColors.secondary} rounded-full blur-[150px] opacity-50`} />
        <div className={`absolute bottom-[5%] right-[-10%] w-[40%] h-[40%] ${bgColors.secondary} rounded-full blur-[130px] opacity-35`} />
      </motion.div>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%] rounded-full blur-[150px] z-0 pointer-events-none" style={t.glow1Style}></div>

      <nav className="relative z-20 sticky top-0 backdrop-blur-xl border-b px-4 md:px-8 py-4 flex items-center justify-between transition-all" style={t.navStyle}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={t.accentDotStyle}></div>
          <span className="text-white font-serif font-semibold tracking-wider text-[18px]">UNSAID</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <span className="text-white text-[14px] font-medium cursor-pointer" onClick={() => router.push('/dashboard')}>Dashboard</span>
          <span className="text-white/60 hover:text-white transition-colors text-[14px] font-medium cursor-pointer" onClick={() => router.push('/journal')}>Journal</span>
          <span className="text-white/60 hover:text-white transition-colors text-[14px] font-medium cursor-pointer" onClick={() => router.push('/mood')}>Mood</span>
          <span className="text-white/60 hover:text-white transition-colors text-[14px] font-medium cursor-pointer" onClick={() => router.push('/calm')}>Focus</span>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <button className="text-white/60 hover:text-white transition-colors relative">
            <Bell className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#3B82F6] to-[#8B5CF6] p-[2px] cursor-pointer" onClick={() => router.push('/settings')}>
            <div className="w-full h-full rounded-full bg-[#050816] flex items-center justify-center">
              <User className="w-4 h-4 text-white/80" />
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Hero Section — Emotional Center (35% visual weight) */}
        <section className="mb-8 sm:mb-10">
          <DashboardHero />
        </section>

        {/* Primary Grid — Emotional Story + Growth */}
        <section className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Emotional Story Card (wider) */}
          <div className="lg:col-span-3">
            <EmotionalSnapshotCard />
          </div>
          
          {/* Growth System */}
          <div className="lg:col-span-2">
            <TinyWinsCard />
          </div>
        </section>

        {/* Emotional Timeline — Visual Journey */}
        <section className="mb-6 sm:mb-8">
          <EmotionalTimeline />
        </section>

        {/* Secondary Grid — Intention + One Gentle Action */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <IntentionCard />
          <AdaptiveSuggestionCard />
        </section>

        {/* Companion Message — Warm Closure */}
        <section className="mb-6 sm:mb-8">
          <MessageFromPastSelf />
        </section>

        {/* Always Present — Soft Footer */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center py-8 sm:py-12"
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-[11px] sm:text-[12px] text-white/40 uppercase tracking-[0.2em] font-medium">
              Companion Active
            </span>
          </div>
          
          <p className="text-[15px] sm:text-[17px] text-white/40 font-light max-w-lg mx-auto leading-relaxed mb-2">
            "I'm here whenever you are."
          </p>
          <p className="text-[13px] sm:text-[14px] text-white/25 font-light italic">
            You showed up today. That matters.
          </p>
        </motion.section>
      </main>
    </div>
  );
}
