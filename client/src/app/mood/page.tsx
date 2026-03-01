'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useMoodStore } from '@/stores/moodStore';
import { useAuthStore } from '@/stores/authStore';
import { Mood } from '@/lib/mood';
import { User, Bell, Sparkles, History, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import EmotionalInsightsDashboard from '@/components/mood/EmotionalInsightsDashboard';

export default function MoodPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const {
    entries,
    stats,
    emotionalAnalysis,
    isLoading,
    isLogging,
    isLoadingAnalysis,
    fetchEntries,
    fetchStats,
    fetchEmotionalAnalysis,
    fetchStreak,
    logEntry,
    streak,
  } = useMoodStore();

  const t = useTheme();

  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [intensity, setIntensity] = useState(5);
  const [note, setNote] = useState('');
  const [contextTag, setContextTag] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const MOOD_META: Record<Mood, { emoji: string; color: string; bg: string; description: string }> = {
    HAPPY: { emoji: '😊', color: '#FACC15', bg: 'rgba(250, 204, 21, 0.15)', description: 'radiant & light' },
    SAD: { emoji: '😔', color: '#60A5FA', bg: 'rgba(96, 165, 250, 0.15)', description: 'quiet & heavy' },
    ANGRY: { emoji: '😤', color: '#F87171', bg: 'rgba(248, 113, 113, 0.15)', description: 'intense & sharp' },
    CALM: { emoji: '😌', color: '#4ADE80', bg: 'rgba(74, 222, 128, 0.15)', description: 'steady & clear' },
    ANXIOUS: { emoji: '😰', color: '#A78BFA', bg: 'rgba(167, 139, 250, 0.15)', description: 'fast & tight' },
    EXCITED: { emoji: '🤩', color: '#FB923C', bg: 'rgba(251, 146, 60, 0.15)', description: 'vibrant & loud' },
    TIRED: { emoji: '😴', color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.15)', description: 'slow & drained' },
    STRESSED: { emoji: '😫', color: '#F472B6', bg: 'rgba(244, 114, 182, 0.15)', description: 'pressured & noisy' },
    GRATEFUL: { emoji: '🙏', color: '#34D399', bg: 'rgba(52, 211, 153, 0.15)', description: 'warm & full' },
    NEUTRAL: { emoji: '😐', color: '#9CA3AF', bg: 'rgba(156, 163, 175, 0.15)', description: 'even & still' },
  };

  const CONTEXT_TAGS = [
    'Academic pressure', 'Family', 'Work', 'Overthinking', 'Health', 'Relationships', 'Other'
  ];

  const HEADER_TITLES = [
    "How's your inner weather today?",
    "What's the emotional temperature?",
    "What's sitting with you?",
    "Heavy or light today?",
    "How are you feeling right now?"
  ];

  const REFLECTION_PROMPTS = [
    "What drained you today?",
    "What helped, even a little?",
    "What do you need right now?",
    "What would tomorrow feel like if it went well?"
  ];

  const [headerTitle] = useState(() => HEADER_TITLES[Math.floor(Math.random() * HEADER_TITLES.length)]);
  const [reflectionPrompt] = useState(() => REFLECTION_PROMPTS[Math.floor(Math.random() * REFLECTION_PROMPTS.length)]);
  const [isFastMode, setIsFastMode] = useState(false);

  const getIntensityLabel = (val: number) => {
    if (val <= 3) return 'Light';
    if (val <= 6) return 'Steady';
    if (val <= 8) return 'Heavy';
    return 'Overwhelming';
  };

  const APPLE_MOODS: { label: string; value: Mood }[] = [
    { label: 'Happy', value: 'HAPPY' },
    { label: 'Sad', value: 'SAD' },
    { label: 'Angry', value: 'ANGRY' },
    { label: 'Calm', value: 'CALM' },
    { label: 'Anxious', value: 'ANXIOUS' },
    { label: 'Excited', value: 'EXCITED' },
    { label: 'Tired', value: 'TIRED' },
    { label: 'Stressed', value: 'STRESSED' },
    { label: 'Grateful', value: 'GRATEFUL' },
    { label: 'Neutral', value: 'NEUTRAL' },
  ];

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchEntries();
      fetchStats();
      fetchEmotionalAnalysis();
      fetchStreak();
    }
  }, [user, fetchEntries, fetchStats, fetchEmotionalAnalysis, fetchStreak]);

  const handleLogMood = async () => {
    if (!selectedMood) return;

    try {
      await logEntry({
        mood: selectedMood,
        intensity,
        note: note.trim() || undefined,
        contextTag: contextTag || undefined,
        entryType: 'MANUAL',
      });

      await fetchStats();
      await fetchEmotionalAnalysis();

      setShowConfirmation(true);

      // Auto-hide confirmation after 5 seconds or on next interaction
      setTimeout(() => setShowConfirmation(false), 8000);

      setSelectedMood(null);
      setContextTag(null);
      setIntensity(5);
      setNote('');
    } catch (error) {
      console.error('Failed to log mood:', error);
    }
  };

  const aiInsightMessage = useMemo(() => {
    if (!emotionalAnalysis) {
      return "I'm here with you. Keep checking in, and I'll share clearer insights as your pattern forms.";
    }

    const parts = [
      emotionalAnalysis.insightSentence,
      ...(emotionalAnalysis.supportiveSentences || []),
      emotionalAnalysis.suggestion,
    ].filter(Boolean);

    return parts.join(' ');
  }, [emotionalAnalysis]);

  if (authLoading || (!user && isLoading)) {
    return <div className="min-h-screen flex items-center justify-center" style={t.pageBg}></div>;
  }

  if (!user) return null;

  const glassCard = "bg-white/[0.03] backdrop-blur-[16px] border border-white/[0.06] rounded-[20px] shadow-[0_10px_40px_rgba(0,0,0,0.5)]";

  return (
    <div className="min-h-screen font-sans pb-24 relative xl:overflow-hidden text-white" style={t.pageBg}>
      {/* Deep Gradient Background */}
      <div className="absolute inset-0 z-0 pointer-events-none" style={t.bgGradientStyle}></div>
      {/* Subtle Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%] rounded-full blur-[150px] z-0 pointer-events-none" style={t.glow1Style}></div>

      {/* Top Navbar Matching Dashboard/Journal */}
      <nav className="relative z-20 sticky top-0 backdrop-blur-xl border-b px-4 md:px-8 py-4 flex items-center justify-between transition-all" style={t.navStyle}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={t.accentDotStyle}></div>
          <span className="text-white font-serif font-semibold tracking-wider text-[18px]">UNSAID</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <span className="text-white/60 hover:text-white transition-colors text-[14px] font-medium cursor-pointer" onClick={() => router.push('/dashboard')}>Dashboard</span>
          <span className="text-white/60 hover:text-white transition-colors text-[14px] font-medium cursor-pointer" onClick={() => router.push('/journal')}>Journal</span>
          <span className="text-white text-[14px] font-medium cursor-pointer" onClick={() => router.push('/mood')}>Mood</span>
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

        <header className="mb-12 text-center">
          <motion.div
            key={selectedMood || 'welcome'}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 10, stiffness: 100 }}
            className="text-[64px] mb-4 h-20 flex items-center justify-center pointer-events-none"
          >
            {selectedMood ? MOOD_META[selectedMood].emoji : '👋'}
          </motion.div>
          <h1 className="text-[32px] sm:text-[40px] font-medium text-white tracking-tight mb-2">{headerTitle}</h1>
          <p className="text-[18px] text-white/40 font-light italic">No judgment. Just honesty.</p>
        </header>

        {/* Dynamic Background Tone Shift */}
        <AnimatePresence>
          {selectedMood && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[-1] pointer-events-none transition-colors duration-1000"
              style={{ background: `radial-gradient(circle at 50% 50%, ${MOOD_META[selectedMood].bg}, transparent 70%)` }}
            />
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

          {/* LEFT COLUMN: Input */}
          <div className="md:col-span-5 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="space-y-8"
            >

              <section>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {Object.entries(MOOD_META).map(([m, meta]) => {
                    const isSelected = selectedMood === m;
                    return (
                      <motion.button
                        key={m}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95, y: 2 }}
                        onClick={() => setSelectedMood(m as Mood)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-[24px] transition-all duration-300 border 
                          ${isSelected
                            ? `bg-white/10 border-white/20 shadow-[0_0_25px_${meta.color}33] scale-105 ring-1 ring-white/10`
                            : 'bg-white/[0.03] border-white/[0.05] hover:bg-white/[0.06] hover:border-white/[0.1] opacity-60 hover:opacity-100'
                          }`}
                      >
                        <motion.span
                          animate={isSelected ? { scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] } : {}}
                          className="text-[28px]"
                        >
                          {meta.emoji}
                        </motion.span>
                        <span className={`text-[13px] font-medium ${isSelected ? 'text-white' : 'text-white/40'}`}>
                          {m.charAt(0) + m.slice(1).toLowerCase()}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </section>

              <section className={`${glassCard} p-6`}>
                <div className="flex items-center justify-between mb-8">
                  <span className="text-[15px] text-white/50 uppercase tracking-widest font-medium">Intensity</span>
                  <span className="text-[18px] text-white font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedMood ? MOOD_META[selectedMood].color : '#fff' }}></span>
                    {getIntensityLabel(intensity)}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={intensity}
                  onChange={(e) => setIntensity(Number(e.target.value))}
                  className="w-full h-1.5 bg-white/[0.05] rounded-full appearance-none outline-none
                             [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7
                             [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full
                             [&::-webkit-slider-thumb]:shadow-[0_0_20px_rgba(255,255,255,0.3)]
                             [&::-webkit-slider-thumb]:border-0 cursor-pointer relative z-10 transition-all hover:[&::-webkit-slider-thumb]:scale-110"
                  style={{
                    background: selectedMood
                      ? `linear-gradient(to right, ${MOOD_META[selectedMood].color}, ${MOOD_META[selectedMood].color} ${((intensity - 1) / 9) * 100}%, rgba(255,255,255,0.05) ${((intensity - 1) / 9) * 100}%)`
                      : `linear-gradient(to right, #3B82F6, #8B5CF6 ${((intensity - 1) / 9) * 100}%, rgba(255,255,255,0.05) ${((intensity - 1) / 9) * 100}%)`
                  }}
                />
              </section>

              <AnimatePresence>
                {selectedMood && (
                  <motion.section
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <span className="text-[13px] text-white/40 uppercase tracking-widest font-medium ml-1">Context</span>
                    <div className="flex flex-wrap gap-2">
                      {CONTEXT_TAGS.map(tag => (
                        <button
                          key={tag}
                          onClick={() => setContextTag(contextTag === tag ? null : tag)}
                          className={`px-4 py-2 rounded-full text-[13px] border transition-all duration-300
                            ${contextTag === tag
                              ? 'bg-white/10 border-white/30 text-white'
                              : 'bg-white/[0.03] border-white/[0.06] text-white/40 hover:text-white/60 hover:bg-white/[0.05]'
                            }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </motion.section>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {!isFastMode && (
                  <motion.section
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="relative overflow-hidden"
                  >
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder={reflectionPrompt}
                      className="w-full bg-white/[0.03] rounded-[24px] border border-white/[0.06] p-6 text-[16px] text-white placeholder:text-white/20 resize-none outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all h-40 backdrop-blur-md"
                    />

                    {/* Quick Reflection Prompts */}
                    {!note && (
                      <div className="mt-3 flex flex-wrap gap-2 px-2">
                        {REFLECTION_PROMPTS.slice(0, 3).map((p, i) => (
                          <button
                            key={i}
                            onClick={() => setNote(p)}
                            className="text-[11px] text-white/30 hover:text-white/60 bg-white/[0.02] hover:bg-white/[0.05] px-3 py-1.5 rounded-full border border-white/[0.05] transition-all"
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.section>
                )}
              </AnimatePresence>

              <div className="flex items-center justify-between px-4">
                <span className="text-[13px] text-white/30 font-medium">10-second check-in mode</span>
                <button
                  onClick={() => setIsFastMode(!isFastMode)}
                  className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${isFastMode ? 'bg-[#8B5CF6]' : 'bg-white/10'}`}
                >
                  <motion.div
                    animate={{ x: isFastMode ? 22 : 4 }}
                    className="absolute top-1 w-3 h-3 rounded-full bg-white shadow-sm"
                  />
                </button>
              </div>

              <button
                onClick={handleLogMood}
                disabled={!selectedMood || isLogging}
                className={`w-full py-4 rounded-full text-[16px] font-medium transition-all duration-300 active:scale-[0.98] ${selectedMood
                  ? 'bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white shadow-[0_8px_25px_rgba(59,130,246,0.4)] hover:brightness-110'
                  : 'bg-white/[0.05] text-white/30 cursor-not-allowed border border-white/[0.05]'
                  }`}
              >
                Log Mood
              </button>
            </motion.div>
          </div>

          {/* RIGHT COLUMN: Stats & Patterns */}
          <div className="md:col-span-7 space-y-8">
            <AnimatePresence mode="wait">
              {showConfirmation ? (
                <motion.div
                  key="confirmation"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className={`${glassCard} p-8 text-center bg-gradient-to-br from-white/10 to-transparent border-white/20`}
                >
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-[24px] font-medium mb-3 text-white">Mood logged — here is your AI insight</h3>
                  <p className="text-[16px] text-white/50 mb-8 leading-relaxed">
                    {aiInsightMessage}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={() => router.push('/journal/new')}
                      className="px-6 py-3 rounded-full bg-white text-black font-medium text-[15px] hover:bg-white/90 transition-all"
                    >
                      Explore deeper in Journal
                    </button>
                    <button
                      onClick={() => setShowConfirmation(false)}
                      className="px-6 py-3 rounded-full bg-white/5 border border-white/10 text-white font-medium text-[15px] hover:bg-white/10 transition-all"
                    >
                      Maybe later
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="stats"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
                  className="space-y-8"
                >
                  {/* Streak and Summary */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <motion.div
                      whileHover={{ scale: 1.02, boxShadow: '0 0 25px rgba(255,255,255,0.05)' }}
                      className={`${glassCard} flex-1 p-6 relative overflow-hidden group transition-all duration-500`}
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp className="w-12 h-12" />
                      </div>
                      <span className="text-[13px] text-white/40 uppercase tracking-widest font-medium mb-1 block">Your Awareness</span>
                      <div className="flex items-center gap-2">
                        <p className="text-[22px] text-white font-medium">
                          {streak?.streak || 0}-day streak
                        </p>
                        <motion.span
                          animate={{
                            scale: [1, 1.3, 1],
                            rotate: [0, 10, -10, 0],
                            filter: ['drop-shadow(0 0 2px rgba(74,222,128,0.2))', 'drop-shadow(0 0 10px rgba(74,222,128,0.6))', 'drop-shadow(0 0 2px rgba(74,222,128,0.2))']
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            repeatType: 'reverse',
                            ease: "easeInOut"
                          }}
                          className="text-[22px]"
                        >
                          🌱
                        </motion.span>
                      </div>
                      <p className="text-[14px] text-white/30 mt-1">
                        {streak?.streak && streak.streak > 0
                          ? "You're building a beautiful habit of self-witnessing."
                          : "Start your journey of self-discovery today."}
                      </p>
                      {streak?.isActive && (
                        <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></div>
                      )}
                    </motion.div>

                    <div className={`${glassCard} flex-1 p-6 border-white/10`}>
                      <span className="text-[13px] text-white/40 uppercase tracking-widest font-medium mb-1 block">Weekly Rhythm</span>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[22px] text-white font-medium">
                          {emotionalAnalysis?.moodShiftTrend || "Steady"}
                        </span>
                        <div className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[11px] text-white/40">
                          {emotionalAnalysis?.averageIntensity || 0}/10 intensity
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Emotional Insights Dashboard */}
                  <EmotionalInsightsDashboard />

                  {/* Enhanced Simple Logs */}
                  <div className={`${glassCard} overflow-hidden`}>
                    <div className="flex items-center gap-3 px-8 py-6 border-b border-white/[0.05]">
                      <History className="w-5 h-5 text-white/40" />
                      <h3 className="text-[15px] font-medium text-white tracking-wide uppercase">Moments You Logged</h3>
                    </div>
                    {entries.length > 0 ? (
                      <div className="divide-y divide-white/[0.03]">
                        {entries.slice(0, 4).map((entry) => (
                          <div key={entry.id} className="group px-8 py-5 hover:bg-white/[0.015] transition-all">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[20px]">{MOOD_META[entry.mood]?.emoji || '😶'}</span>
                                <div>
                                  <p className="text-[15px] text-white/90 font-medium">{entry.mood.charAt(0) + entry.mood.slice(1).toLowerCase()}</p>
                                  <p className="text-[11px] text-white/30 uppercase tracking-widest">{format(new Date(entry.createdAt), 'h:mm a • d MMM')}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-[14px] font-medium text-white/80">{getIntensityLabel(entry.intensity)}</div>
                                {entry.contextTag && (
                                  <div className="text-[10px] text-white/30 italic mt-0.5">{entry.contextTag}</div>
                                )}
                              </div>
                            </div>
                            {entry.note && (
                              <p className="text-[13px] text-white/40 font-light line-clamp-2 mt-2 leading-relaxed italic group-hover:text-white/60 transition-colors">
                                "{entry.note}"
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="px-8 py-10 text-center text-[14px] text-white/20 italic">Your emotional history begins today.</div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
