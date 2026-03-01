'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useJournalStore } from '@/stores/journalStore';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useTheme } from '@/hooks/useTheme';
import { Emotion, uploadImageFile } from '@/lib/journal';
import { ArrowLeft, Save, Sparkles, Plus, Image as ImageIcon, Music, History, X, Mic, MicOff, Search, Play, Pause, ChevronRight, Check, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import YouTubeMusicSearchModal from '@/components/journal/YouTubeMusicSearchModal';
import { YouTubeMusic } from '@/lib/journal';

const MODES = [
  { id: 'QUICK', label: 'Quick Check-In', description: 'Low energy, just the basics.' },
  { id: 'GUIDED', label: 'Guided Reflection', description: 'Walk through your thoughts with prompts.' },
  { id: 'DEEP', label: 'Deep Reflection', description: 'A blank canvas for your deepest thoughts.' },
] as const;

type ReflectionMode = typeof MODES[number]['id'];

const QUICK_MOODS: { label: string; value: Emotion; emoji: string }[] = [
  { label: 'Happy', value: 'HAPPY', emoji: '😊' },
  { label: 'Sad', value: 'SAD', emoji: '😢' },
  { label: 'Anxious', value: 'ANXIOUS', emoji: '😰' },
  { label: 'Calm', value: 'CALM', emoji: '😌' },
  { label: 'Angry', value: 'ANGRY', emoji: '😠' },
  { label: 'Grateful', value: 'GRATEFUL', emoji: '🙏' },
  { label: 'Hopeful', value: 'HOPEFUL', emoji: '🌟' },
  { label: 'Confused', value: 'CONFUSED', emoji: '😕' },
  { label: 'Excited', value: 'EXCITED', emoji: '🎉' },
  { label: 'Neutral', value: 'NEUTRAL', emoji: '😐' },
];

const INTENSITY_LABELS: Record<number, string> = {
  1: 'Light', 2: 'Light', 3: 'Light',
  4: 'Moderate', 5: 'Moderate', 6: 'Moderate',
  7: 'Strong', 8: 'Strong',
  9: 'Intense', 10: 'Intense',
};

const GUIDED_PROMPTS = [
  "What made today feel this way?",
  "What drained your energy?",
  "What helped you cope?",
  "What do you need right now?",
];

const AFFECTED_BY_OPTIONS = [
  "Study", "Work", "Family", "Friends", "Health", "Myself", "Nothing specific"
];

const ENERGY_LEVELS = [
  "Very Low", "Low", "Balanced", "Good", "High"
];

const DRAINED_BY_OPTIONS = [
  "Overthinking", "Social pressure", "Workload", "Conflict", "Lack of sleep", "Nothing"
];

const NEEDS_OPTIONS = [
  "Rest", "Motivation", "Distraction", "Emotional support", "Clarity", "Focus"
];

const MOOD_COLORS: Record<Emotion, string> = {
  HAPPY: "#FBBF24",
  SAD: "#3B82F6",
  ANXIOUS: "#8B5CF6",
  CALM: "#10B981",
  ANGRY: "#EF4444",
  TIRED: "#94A3B8",
  GRATEFUL: "#EC4899",
  EXCITED: "#F97316",
  CONFUSED: "#64748B",
  NEUTRAL: "#475569",
  HOPEFUL: "#F59E0B"
};

export default function NewJournalEditorPage() {
  return (
    <ProtectedRoute>
      <NewJournalEditorContent />
    </ProtectedRoute>
  );
}

function NewJournalEditorContent() {
  const router = useRouter();
  const t = useTheme();

  const { isCreating, isSaving, error, createEntry, updateEntry, setLastSaved, stats, fetchStats } = useJournalStore();

  const [mode, setMode] = useState<ReflectionMode>('QUICK');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [emotion, setEmotion] = useState<Emotion | undefined>(undefined);
  const [intensity, setIntensity] = useState(5);
  const [tags, setTags] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [musicMetadata, setMusicMetadata] = useState<Partial<YouTubeMusic> | null>(null);

  // MCQ Step-by-Step Flow State
  const [step, setStep] = useState(1);
  const [affectedBy, setAffectedBy] = useState<string | null>(null);
  const [energyLevel, setEnergyLevel] = useState<string | null>(null);
  const [drainedBy, setDrainedBy] = useState<string[]>([]);
  const [need, setNeed] = useState<string | null>(null);

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showMusicModal, setShowMusicModal] = useState(false);
  const [savedEntryId, setSavedEntryId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [showInsight, setShowInsight] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isAILoading, setIsAILoading] = useState(false);

  // Auto-save debounce timer
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const isSavingRef = useRef(false);

  // Guided mode state
  const [currentPromptIdx, setCurrentPromptIdx] = useState(0);
  const [promptAnswers, setPromptAnswers] = useState<string[]>([]);

  useEffect(() => {
    setIsMounted(true);

    // Initialize Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript;
          }
        }
        if (transcript) {
          setContent(prev => {
            const newContent = prev + (prev ? ' ' : '') + transcript;
            setWordCount(newContent.trim().split(/\s+/).length);
            return newContent;
          });
          triggerAutoSave();
        }
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.size > 5 * 1024 * 1024) return;
    try {
      setIsUploadingImage(true);
      const url = await uploadImageFile(file);
      setImageUrl(url);
    } catch { } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSave = async (forceQuit: boolean = false) => {
    // Prevent overlapping saves
    if (isSavingRef.current) return;

    const savePayload: any = {
      title: title || (mode === 'QUICK' ? `Quick Check-in: ${emotion}` : ''),
      content: mode === 'GUIDED' ? promptAnswers.join('\n\n') : content,
      emotion: emotion || undefined,
      intensity,
      mode,
      tags,
      imageUrl: imageUrl || null,
      musicTitle: musicMetadata?.title,
      musicArtist: musicMetadata?.channelTitle,
      musicThumbnail: musicMetadata?.thumbnail,
      musicVideoId: musicMetadata?.videoId,
      musicUrl: musicMetadata?.url,
      musicPlatform: 'YOUTUBE' as const,
      affectedBy,
      energyLevel,
      drainedBy,
      need,
    };

    try {
      isSavingRef.current = true;
      if (forceQuit) {
        setIsAILoading(true);
        await fetchStats();
      }

      if (savedEntryId) {
        // Update existing entry in this session
        const entry = await updateEntry(savedEntryId, savePayload);
        setLastSaved(new Date());
        if (forceQuit && entry.aiResponse) {
          setAiInsight(entry.aiResponse);
          setShowInsight(true);
        } else if (forceQuit) {
          router.push('/journal');
        }
      } else {
        // First save for this session
        const entry = await createEntry(savePayload);
        setSavedEntryId(entry.id);
        setLastSaved(new Date());
        if (forceQuit && entry.aiResponse) {
          setAiInsight(entry.aiResponse);
          setShowInsight(true);
        } else if (forceQuit) {
          router.push('/journal');
        }
      }
    } catch (error) {
      console.error('Failed to save journal entry:', error);
    } finally {
      isSavingRef.current = false;
      if (forceQuit) setIsAILoading(false);
    }
  };

  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      handleSave();
    }, 2000);
  }, [content, title, emotion, intensity, mode, tags, imageUrl, musicMetadata, savedEntryId, affectedBy, energyLevel, drainedBy, need]);

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, []);

  const nextPrompt = () => {
    if (currentPromptIdx < GUIDED_PROMPTS.length - 1) {
      setCurrentPromptIdx(prev => prev + 1);
    } else {
      handleSave(true);
    }
  };

  const getMoodStyles = () => {
    if (!emotion) return {};
    const color = MOOD_COLORS[emotion] || "#4F7CFF";
    return {
      background: `radial-gradient(circle at 50% -20%, ${color}15, transparent 60%)`,
      transition: 'all 1.2s cubic-bezier(0.4, 0, 0.2, 1)'
    };
  };

  const glowStyle = (color: string) => ({
    backgroundColor: color,
    opacity: emotion ? 0.15 : 0.05,
    transition: 'all 1.5s ease'
  });

  if (!isMounted) return null;

  if (showInsight && aiInsight) {
    const sections = aiInsight.split('\n\n');
    const support = sections[0]?.split('\n') || [];
    const insightLine = sections[1] || '';
    const suggestionLine = sections[2] || '';

    // Logic for Tiny Wins
    const tinyWins = [];
    if (stats?.recentActivity && stats.recentActivity >= 3) {
      tinyWins.push({ icon: "🌱", text: `${stats.recentActivity} day streak! You're building a real habit.` });
    }
    if (emotion === 'GRATEFUL') {
      tinyWins.push({ icon: "🌸", text: "Finding gratitude is a superpower." });
    }
    if (energyLevel === 'High') {
      tinyWins.push({ icon: "⚡️", text: "High energy detected. A great time for a 'Tiny Win'." });
    }
    if (energyLevel === 'Very Low' || energyLevel === 'Low') {
      tinyWins.push({ icon: "☁️", text: "Even on low energy days, you showed up. That's a huge win." });
    }

    return (
      <div className="min-h-screen font-sans p-8 transition-colors duration-500 relative overflow-hidden flex items-center justify-center" style={t.pageBg}>
        <div className="absolute inset-0 z-0 pointer-events-none" style={{ ...t.bgGradientStyle, ...getMoodStyles() }}></div>

        {/* Ambient Glow Pulse */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[120px] z-0 pointer-events-none"
          style={{ backgroundColor: emotion ? MOOD_COLORS[emotion] : '#4F7CFF' }}
        />

        <div className="relative z-10 max-w-lg w-full space-y-12">
          {/* Streak Reward */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-2 mb-4"
          >
            <motion.span
              animate={{ y: [0, -10, 0], scale: [1, 1.2, 1] }}
              transition={{ delay: 0.5, duration: 1 }}
              className="text-[40px]"
            >
              🌱
            </motion.span>
            <span className="text-[12px] font-bold text-[#4F7CFF] uppercase tracking-[0.2em]">
              {stats?.recentActivity || 0} DAY STREAK
            </span>
          </motion.div>

          {/* Emotional Summary */}
          <div className="space-y-4">
            {support.map((line, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.4 + 1 }}
                className="text-[20px] md:text-[24px] font-medium text-white leading-relaxed text-center"
              >
                {line}
              </motion.p>
            ))}
          </div>

          {/* Tiny Win Card */}
          {tinyWins.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.5 }}
              className="p-6 rounded-[32px] bg-gradient-to-br from-white/[0.08] to-transparent border border-white/[0.1] backdrop-blur-md shadow-2xl relative overflow-hidden group"
            >
              <div className="flex items-start gap-4">
                <span className="text-[32px]">{tinyWins[0].icon}</span>
                <div className="space-y-1">
                  <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest">Tiny Win</p>
                  <p className="text-[15px] text-white/90 leading-relaxed font-medium">{tinyWins[0].text}</p>
                </div>
              </div>
              <motion.div
                className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </motion.div>
          )}

          {/* Insight Card */}
          <div className="space-y-4">
            {insightLine && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 3.5 }}
                className="p-6 rounded-[28px] bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-[#4F7CFF]" />
                  <p className="text-[12px] text-[#4F7CFF] font-bold uppercase tracking-widest">Pattern Insight</p>
                </div>
                <p className="text-[16px] text-white/80 leading-relaxed">{insightLine.replace('Insight:', '').trim()}</p>
              </motion.div>
            )}

            {suggestionLine && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 4 }}
                className="p-6 rounded-[28px] bg-[#4F7CFF]/10 border border-[#4F7CFF]/20 backdrop-blur-sm"
              >
                <p className="text-[12px] text-[#4F7CFF] font-bold uppercase tracking-widest mb-2">Reflect & Reset</p>
                <p className="text-[16px] text-[#4F7CFF] leading-relaxed font-medium">{suggestionLine.replace('Suggestion:', '').trim()}</p>
              </motion.div>
            )}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 5 }}
            className="flex justify-center"
          >
            <button
              onClick={() => router.push('/journal')}
              className="text-white/40 hover:text-white transition-colors text-[14px] font-medium flex items-center gap-2 group"
            >
              Back to Space <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans pb-32 transition-colors duration-500 relative overflow-hidden" style={t.pageBg}>
      <div className="absolute inset-0 z-0 pointer-events-none" style={{ ...t.bgGradientStyle, ...getMoodStyles() }}></div>
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] z-0 pointer-events-none" style={{ ...t.glow1Style, ...glowStyle(emotion ? MOOD_COLORS[emotion] : t.colors.bgGlow1) }}></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] z-0 pointer-events-none opacity-20" style={{ ...t.glow2Style, ...glowStyle(emotion ? MOOD_COLORS[emotion] : t.colors.bgGlow2) }}></div>

      <nav className="relative z-20 sticky top-0 backdrop-blur-xl border-b px-4 md:px-8 py-4 flex items-center justify-between" style={t.navStyle}>
        <div className="max-w-3xl mx-auto w-full flex items-center justify-between">
          <button onClick={() => router.push('/journal')} className="p-2 -ml-2 text-white/60 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1">
            <h1 className="text-[17px] font-medium text-white tracking-wide">Take 30 seconds</h1>
            {(isSaving || isCreating) && <span className="text-[12px] text-[#4F7CFF] ml-2 animate-pulse">Saving...</span>}
          </div>
          <button
            onClick={() => handleSave(true)}
            className="bg-gradient-to-r from-[#4F8CFF] to-[#8A5CFF] text-white px-5 py-1.5 rounded-full text-[14px] font-medium shadow-[0_0_15px_rgba(79,140,255,0.3)]"
          >
            Finish
          </button>
        </div>
      </nav>

      <main className="relative z-10 max-w-2xl mx-auto px-4 pt-12">
        {/* Mode Selector */}
        <div className="flex justify-center gap-2 mb-12">
          {MODES.map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-all ${mode === m.id ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60'}`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="space-y-12">
          {/* Quick Check-In (Multi-Step MCQ) */}
          {mode === 'QUICK' && (
            <div className="space-y-8">
              {/* Progress Indicator */}
              <div className="flex items-center gap-2 mb-8">
                {[1, 2, 3, 4].map(s => (
                  <div
                    key={s}
                    className={`h-1 flex-1 rounded-full transition-all duration-500 ${step >= s ? 'bg-[#4F7CFF]' : 'bg-white/10'}`}
                  />
                ))}
                <span className="text-[12px] text-white/40 ml-2 font-medium">Step {step} of 4</span>
              </div>

              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    <div className="text-center">
                      <h2 className="text-[24px] font-semibold text-white mb-2">How are you feeling right now?</h2>
                      <p className="text-[14px] text-white/40">No judgment. Just honesty.</p>
                    </div>
                    <div className="grid grid-cols-5 gap-4">
                      {QUICK_MOODS.map(m => (
                        <motion.button
                          key={m.value}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => { setEmotion(m.value); setStep(2); }}
                          className={`flex flex-col items-center gap-2 p-4 rounded-[24px] border transition-all ${emotion === m.value ? 'bg-white/10 border-[#4F7CFF] shadow-[0_0_20px_rgba(79,124,255,0.2)]' : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.05]'}`}
                        >
                          <span className="text-[28px]">{m.emoji}</span>
                          <span className="text-[11px] font-medium text-white/60">{m.label}</span>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    <div className="text-center">
                      <h2 className="text-[24px] font-semibold text-white mb-2">How intense is this emotion?</h2>
                      <p className="text-[14px] text-white/40">1 is a whisper, 10 is a shout.</p>
                    </div>
                    <div className="grid grid-cols-5 gap-3">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(val => (
                        <motion.button
                          key={val}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => { setIntensity(val); setStep(3); }}
                          className={`py-6 rounded-2xl border text-[18px] font-semibold transition-all ${intensity === val ? 'bg-[#4F7CFF] border-[#4F7CFF] text-white shadow-[0_0_20px_rgba(79,124,255,0.3)]' : 'bg-white/[0.02] border-white/[0.05] text-white/40 hover:text-white/80'}`}
                        >
                          {val}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-12"
                  >
                    {/* MCQ Q1: Affected By */}
                    <div className="space-y-4">
                      <p className="text-[13px] text-white/40 uppercase tracking-widest font-semibold px-2">What affected you most today?</p>
                      <div className="flex flex-wrap gap-2">
                        {AFFECTED_BY_OPTIONS.map(opt => (
                          <motion.button
                            key={opt}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setAffectedBy(opt)}
                            className={`px-4 py-2.5 rounded-xl border text-[14px] transition-all ${affectedBy === opt ? 'bg-white/10 border-white/20 text-white' : 'bg-white/[0.02] border-white/[0.05] text-white/40 hover:text-white/60'}`}
                          >
                            {opt}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* MCQ Q2: Energy Level */}
                    <div className="space-y-4">
                      <p className="text-[13px] text-white/40 uppercase tracking-widest font-semibold px-2">Energy level today?</p>
                      <div className="flex flex-wrap gap-2">
                        {ENERGY_LEVELS.map(opt => (
                          <motion.button
                            key={opt}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setEnergyLevel(opt)}
                            className={`px-4 py-2.5 rounded-xl border text-[14px] transition-all ${energyLevel === opt ? 'bg-white/10 border-white/20 text-white' : 'bg-white/[0.02] border-white/[0.05] text-white/40 hover:text-white/60'}`}
                          >
                            {opt}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* MCQ Q3: Drained By (Multi-select) */}
                    <div className="space-y-4">
                      <p className="text-[13px] text-white/40 uppercase tracking-widest font-semibold px-2">What drained you?</p>
                      <div className="flex flex-wrap gap-2">
                        {DRAINED_BY_OPTIONS.map(opt => (
                          <motion.button
                            key={opt}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setDrainedBy(prev => prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt]);
                            }}
                            className={`px-4 py-2.5 rounded-xl border text-[14px] transition-all ${drainedBy.includes(opt) ? 'bg-white/10 border-white/20 text-white' : 'bg-white/[0.02] border-white/[0.05] text-white/40 hover:text-white/60'}`}
                          >
                            {opt}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* MCQ Q4: Need */}
                    <div className="space-y-4">
                      <p className="text-[13px] text-white/40 uppercase tracking-widest font-semibold px-2">What do you need right now?</p>
                      <div className="flex flex-wrap gap-2">
                        {NEEDS_OPTIONS.map(opt => (
                          <motion.button
                            key={opt}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setNeed(opt)}
                            className={`px-4 py-2.5 rounded-xl border text-[14px] transition-all ${need === opt ? 'bg-white/10 border-white/20 text-white' : 'bg-white/[0.02] border-white/[0.05] text-white/40 hover:text-white/60'}`}
                          >
                            {opt}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-center pt-8">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setStep(4)}
                        className="bg-white/5 border border-white/10 text-white/60 hover:text-white px-8 py-3 rounded-2xl text-[15px] font-medium transition-all"
                      >
                        Continue
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {step === 4 && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    <div className="text-center">
                      <h2 className="text-[24px] font-semibold text-white mb-2">One short thought?</h2>
                      <p className="text-[14px] text-white/40">Optional. 120 characters max.</p>
                    </div>

                    <textarea
                      value={content}
                      onChange={(e) => {
                        if (e.target.value.length <= 120) {
                          setContent(e.target.value);
                          triggerAutoSave();
                        }
                      }}
                      placeholder="Today was..."
                      className="w-full h-32 bg-white/[0.02] border border-white/[0.05] rounded-[24px] p-6 text-white text-[16px] placeholder:text-white/20 focus:outline-none focus:border-[#4F7CFF]/30 transition-all resize-none"
                    />
                    <div className="flex justify-end px-2">
                      <span className={`text-[12px] ${content.length > 100 ? 'text-red-400' : 'text-white/20'}`}>
                        {content.length}/120
                      </span>
                    </div>

                    <div className="flex justify-center pt-8">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSave(true)}
                        className="bg-gradient-to-r from-[#4F7CFF] to-[#8A5CFF] text-white px-12 py-4 rounded-2xl text-[16px] font-semibold shadow-[0_0_30px_rgba(79,124,255,0.3)]"
                      >
                        Finish Check-In
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Guided Reflection */}
          {mode === 'GUIDED' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12 min-h-[400px] flex flex-col justify-center">
              <div className="space-y-8">
                <motion.h2
                  key={currentPromptIdx}
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  className="text-[28px] font-medium text-white leading-tight"
                >
                  {GUIDED_PROMPTS[currentPromptIdx]}
                </motion.h2>
                <textarea
                  autoFocus
                  placeholder="Type your answer..."
                  value={promptAnswers[currentPromptIdx] || ''}
                  onChange={(e) => {
                    const newAnswers = [...promptAnswers];
                    newAnswers[currentPromptIdx] = e.target.value;
                    setPromptAnswers(newAnswers);
                  }}
                  className="w-full bg-transparent border-none text-[18px] text-white placeholder:text-white/20 min-h-[150px] resize-none outline-none"
                />
              </div>
              <div className="flex justify-between items-center">
                <p className="text-[12px] text-white/30">Step {currentPromptIdx + 1} of {GUIDED_PROMPTS.length}</p>
                <button
                  onClick={nextPrompt}
                  className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-2xl text-[14px] font-medium transition-all"
                >
                  {currentPromptIdx === GUIDED_PROMPTS.length - 1 ? 'Finish reflection' : 'Next prompt →'}
                </button>
              </div>
            </motion.div>
          )}

          {/* Deep Reflection */}
          {mode === 'DEEP' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-20">
              <div className="flex justify-between items-center mb-2">
                <p className="text-[12px] text-white/30 italic font-serif tracking-wide">
                  "Don't worry about grammar, just let it flow."
                </p>
                <div className="flex items-center gap-4">
                  <div className="text-[11px] text-white/20 uppercase tracking-widest">{wordCount} words</div>
                  <button
                    onClick={toggleRecording}
                    className={`flex items-center gap-2 text-[11px] transition-all px-3 py-1 rounded-full border ${isRecording ? 'text-red-400 border-red-400/30 bg-red-400/10 animate-pulse' : 'text-[#4F7CFF]/60 border-[#4F7CFF]/20 hover:text-[#4F7CFF] hover:bg-[#4F7CFF]/10'}`}
                  >
                    {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    {isRecording ? 'Stop speaking' : 'Speak instead'}
                  </button>
                </div>
              </div>
              <input
                type="text" placeholder="Title your reflection..." value={title}
                onChange={(e) => { setTitle(e.target.value); triggerAutoSave(); }}
                className="w-full bg-transparent text-[32px] font-semibold text-white placeholder:text-white/20 outline-none"
              />
              <textarea
                placeholder="A blank page is waiting..."
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  setWordCount(e.target.value.trim() ? e.target.value.trim().split(/\s+/).length : 0);
                  triggerAutoSave();
                }}
                className="w-full bg-transparent text-[18px] text-white/80 placeholder:text-white/10 min-h-[500px] resize-none outline-none leading-relaxed"
              />
            </motion.div>
          )}
        </div>
      </main >
    </div >
  );
}
