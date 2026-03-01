'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useJournalStore } from '@/stores/journalStore';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Plus, Search, Trash2, X, User, Bell, Star, Lock, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { JournalEntry, Emotion } from '@/lib/journal';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import { useTheme } from '@/hooks/useTheme';

// ── Greeting rotation ─────────────────────────────────────────────────────────

const GREETINGS = [
  'Welcome back.',
  'Good to see you again.',
  'You\'re safe here.',
  'A quiet space for honest thoughts.',
  'Take your time.',
];

function getGreeting(userId?: string): string {
  const h = new Date().getHours();
  const timeGreeting = h < 12 ? 'Good morning.' : h < 17 ? 'Good afternoon.' : 'Good evening.';
  // Deterministically pick a phrase based on the day so it feels stable, not random
  const idx = Math.floor(new Date().getDate() % GREETINGS.length);
  return idx === 0 ? timeGreeting : GREETINGS[idx];
}

function lastWroteCopy(entries: JournalEntry[]): string | null {
  if (!entries.length) return null;
  const sorted = [...entries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const ms = Date.now() - new Date(sorted[0].createdAt).getTime();
  const days = Math.floor(ms / 86400000);
  if (days === 0) return 'You wrote today.';
  if (days === 1) return 'You last wrote yesterday.';
  return `You last wrote ${days} days ago.`;
}

function onThisDayEntry(entries: JournalEntry[]): JournalEntry | null {
  const now = new Date();
  const m = now.getMonth();
  const d = now.getDate();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return (
    entries.find((e) => {
      const dt = new Date(e.createdAt);
      return (
        dt.getFullYear() < now.getFullYear() ||
        (dt.getMonth() <= lastMonth.getMonth() && dt.getMonth() === m && dt.getDate() === d)
      );
    }) ?? null
  );
}

// ── Mood hex ──────────────────────────────────────────────────────────────────

const getMoodHex = (emotion: Emotion | null | undefined) => {
  const MAP: Record<string, string> = {
    HAPPY: '#FCD34D', SAD: '#60A5FA', ANXIOUS: '#C084FC', CALM: '#34D399',
    ANGRY: '#F87171', GRATEFUL: '#F472B6', HOPEFUL: '#FBBF24',
    CONFUSED: '#9CA3AF', EXCITED: '#FB923C', NEUTRAL: '#E5E7EB',
  };
  return emotion ? (MAP[emotion] ?? '#FFFFFF') : '#FFFFFF';
};

// ── Helper: emotional time of day ─────────────────────────────────────────────

function writtenAt(iso: string): string {
  const h = new Date(iso).getHours();
  if (h < 6) return 'written in the middle of the night';
  if (h < 12) return 'written in the morning';
  if (h < 17) return 'written in the afternoon';
  if (h < 21) return 'written in the evening';
  return 'written at night';
}

// ── Delete modal ──────────────────────────────────────────────────────────────

function DeleteConfirmModal({ isOpen, onClose, onConfirm }: { isOpen: boolean; onClose: () => void; onConfirm: () => void }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative bg-[#0A1020] border border-white/[0.07] w-full max-w-sm rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.7)] overflow-hidden"
          >
            <div className="p-7 text-center">
              <h3 className="text-[18px] font-medium text-white mb-2">Are you sure you want to let this go?</h3>
              <p className="text-[14px] text-white/40 mb-8 leading-relaxed">
                This moment will be permanently removed. It can't be brought back.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => { onConfirm(); onClose(); }}
                  className="w-full py-3 bg-red-500/10 border border-red-500/20 text-red-400 font-medium rounded-xl text-[14px] hover:bg-red-500/15 transition-all duration-250"
                >
                  Let it go
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-3 bg-white/[0.03] text-white/60 font-medium rounded-xl text-[14px] hover:bg-white/[0.06] transition-all duration-250"
                >
                  Keep it
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ── Entry card ────────────────────────────────────────────────────────────────

function EntryCard({
  entry, onDeleteRequest, onPinToggle,
}: {
  entry: JournalEntry;
  onDeleteRequest: (id: string, e: React.MouseEvent) => void;
  onPinToggle: (id: string, current: boolean, e: React.MouseEvent) => void;
}) {
  const router = useRouter();
  const [isPlaying, setIsPlaying] = useState(false);
  const dateObj = new Date(entry.createdAt);
  const dateStr = dateObj.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const hasMusic = !!(entry.musicVideoId && entry.musicTitle);

  const handlePlayToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying(prev => !prev);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      whileHover={{ y: -3, transition: { duration: 0.18 } }}
      onClick={() => router.push(`/journal/${entry.id}`)}
      className="group relative bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-[22px] p-6 hover:bg-white/[0.04] hover:border-white/[0.09] transition-all duration-250 cursor-pointer overflow-hidden flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-[17px] font-semibold text-white line-clamp-1 leading-tight mb-0.5">
            {entry.title || 'Untitled reflection'}
          </h3>
          <span className="text-[11px] text-white/25 uppercase tracking-wider font-medium">{dateStr}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {/* Pin star */}
          <button
            onClick={(e) => onPinToggle(entry.id, entry.isPinned, e)}
            className={`p-1.5 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 ${entry.isPinned ? 'opacity-100 text-amber-400/80' : 'text-white/20 hover:text-amber-400/60'}`}
          >
            <Star className="w-3.5 h-3.5" fill={entry.isPinned ? 'currentColor' : 'none'} />
          </button>
          {/* Delete */}
          <button
            onClick={(e) => onDeleteRequest(entry.id, e)}
            className="p-1.5 text-white/0 group-hover:text-red-400/60 opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-full hover:bg-red-400/10"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Content preview */}
      <p className="text-[14px] text-white/50 line-clamp-3 leading-[1.65]">
        {entry.content || <span className="italic opacity-50">Nothing written.</span>}
      </p>

      {/* Image */}
      {entry.imageUrl && (
        <div className="w-full rounded-[14px] overflow-hidden">
          <img
            src={entry.imageUrl}
            alt="attachment"
            className="w-full h-auto max-h-[240px] object-cover transition-transform duration-700 group-hover:scale-[1.02]"
          />
        </div>
      )}

      {/* ── YouTube Music Mini-Player ── */}
      {hasMusic && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full rounded-[16px] overflow-hidden border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm group/music"
        >
          <div className="flex items-center gap-3 p-3">
            {/* Thumbnail */}
            <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
              {entry.musicThumbnail && (
                <img
                  src={entry.musicThumbnail}
                  alt={entry.musicTitle || ''}
                  className="w-full h-full object-cover"
                />
              )}
              {/* Play overlay */}
              <button
                onClick={handlePlayToggle}
                className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/50 transition-colors"
              >
                {isPlaying ? (
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Track Info */}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-white truncate leading-tight"
                dangerouslySetInnerHTML={{ __html: entry.musicTitle || '' }}
              />
              <p className="text-[11px] text-white/40 truncate mt-0.5">{entry.musicArtist}</p>
            </div>

            {/* Playing animation */}
            {isPlaying && (
              <div className="flex items-end gap-[3px] h-4 mr-1 shrink-0">
                {[3, 5, 2.5, 4].map((h, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: [`${h * 2}px`, `${h * 4}px`, `${h * 2}px`] }}
                    transition={{ duration: 0.6 + i * 0.1, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-[3px] rounded-full bg-white/60"
                    style={{ height: `${h * 2}px` }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Hidden YouTube iframe — audio-only mode */}
          {isPlaying && entry.musicVideoId && (
            <div className="sr-only">
              <iframe
                width="1" height="1"
                src={`https://www.youtube.com/embed/${entry.musicVideoId}?autoplay=1&modestbranding=1&rel=0`}
                allow="autoplay"
                title={entry.musicTitle || 'music'}
              />
            </div>
          )}
        </div>
      )}

      {/* Emotional memory footer */}
      <div className="flex items-center gap-3 pt-1 border-t border-white/[0.04]">
        {entry.emotion && (
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getMoodHex(entry.emotion) }} />
            <span className="text-[11px] text-white/35">
              You were feeling {entry.emotion.charAt(0) + entry.emotion.slice(1).toLowerCase()}.
            </span>
          </div>
        )}
        {hasMusic && (
          <span className="text-[11px] text-white/25 flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
            {entry.musicTitle && (
              <span
                className="truncate max-w-[120px]"
                dangerouslySetInnerHTML={{ __html: entry.musicTitle }}
              />
            )}
          </span>
        )}
        {!entry.emotion && !hasMusic && (
          <span className="text-[11px] text-white/20">{writtenAt(entry.createdAt)}</span>
        )}
      </div>
    </motion.div>
  );
}

// ── Weekly reflection ─────────────────────────────────────────────────────────

function WeeklyReflection({ entries }: { entries: JournalEntry[] }) {
  const [reflection, setReflection] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tried, setTried] = useState(false);

  // Only show if user has at least 2 entries this week
  const thisWeekEntries = useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() - 7);
    return entries.filter(e => new Date(e.createdAt) >= start);
  }, [entries]);

  useEffect(() => {
    if (thisWeekEntries.length < 2 || tried) return;
    setTried(true);
    setLoading(true);
    const moodSummary = thisWeekEntries.map(e => e.emotion ?? 'NEUTRAL').join(', ');
    api.post('/journal/weekly-reflection', { moodSummary, count: thisWeekEntries.length })
      .then(r => setReflection(r.data?.data?.reflection ?? null))
      .catch(() => setReflection(null))
      .finally(() => setLoading(false));
  }, [thisWeekEntries, tried]);

  if (thisWeekEntries.length < 2) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="mt-16 mb-8"
    >
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-white/20" />
        <h2 className="text-[14px] font-medium text-white/30 uppercase tracking-widest">Your Week in Reflection</h2>
      </div>
      <div className="p-6 rounded-[20px] bg-white/[0.02] border border-white/[0.05]">
        {loading ? (
          <div className="flex items-center gap-3">
            <motion.div
              className="w-4 h-4 rounded-full border border-white/20 border-t-white/50"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <span className="text-[14px] text-white/30">Reflecting on your week…</span>
          </div>
        ) : reflection ? (
          <p className="text-[15px] text-white/50 leading-[1.8] font-light italic">"{reflection}"</p>
        ) : (
          <p className="text-[14px] text-white/25 italic">
            You've been writing. That's enough.
          </p>
        )}
      </div>
    </motion.section>
  );
}

// ── Trust signal ──────────────────────────────────────────────────────────────

function TrustSignal() {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-white/15">
      <Lock className="w-3 h-3" />
      <span className="text-[11px] tracking-wide">Your entries are private. Protected. Yours.</span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function JournalListPage() {
  return (
    <ProtectedRoute>
      <JournalListContent />
    </ProtectedRoute>
  );
}

function JournalListContent() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { entries, fetchEntries, deleteEntry, pinEntry } = useJournalStore();
  const t = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'All' | 'This Week' | 'This Month'>('All');
  const [emotionFilter, setEmotionFilter] = useState<'All' | 'Calm' | 'Anxious' | 'Happy' | 'Low' | 'Grateful'>('All');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);

  useEffect(() => { fetchEntries({ limit: 100 }); }, [fetchEntries]);

  const processedEntries = useMemo(() => {
    let result = [...entries];
    const now = new Date();
    if (filter === 'This Week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const startOfWeek = new Date(now.setDate(diff));
      startOfWeek.setHours(0, 0, 0, 0);
      result = result.filter(e => new Date(e.createdAt) >= startOfWeek);
    } else if (filter === 'This Month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      result = result.filter(e => new Date(e.createdAt) >= startOfMonth);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e =>
        e.title?.toLowerCase().includes(q) || e.content?.toLowerCase().includes(q) || e.emotion?.toLowerCase().includes(q)
      );
    }
    if (emotionFilter !== 'All') {
      result = result.filter(e => e.emotion === emotionFilter.toUpperCase() as Emotion);
    }
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return result;
  }, [entries, filter, emotionFilter, searchQuery]);

  const pinnedEntries = useMemo(() => entries.filter(e => e.isPinned), [entries]);

  const onThisDay = useMemo(() => onThisDayEntry(entries), [entries]);

  const requestDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEntryToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (entryToDelete) await deleteEntry(entryToDelete);
  };

  const handlePinToggle = (id: string, current: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    pinEntry(id, !current);
  };

  const greeting = getGreeting(user?.id);
  const lastWrote = lastWroteCopy(entries);

  return (
    <div className="min-h-screen font-sans pb-32 relative overflow-hidden" style={t.pageBg}>
      {/* Background gradient */}
      <div className="absolute inset-0 z-0 pointer-events-none" style={t.bgGradientStyle} />

      {/* Glow blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[130px] z-0 pointer-events-none" style={t.glow1Style} />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[160px] z-0 pointer-events-none" style={t.glow2Style} />

      {/* Navbar */}
      <nav className="relative z-20 sticky top-0 backdrop-blur-xl border-b px-4 md:px-8 py-4 flex items-center justify-between" style={t.navStyle}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={t.accentDotStyle} />
          <span className="text-white font-serif font-semibold tracking-wider text-[18px]">UNSAID</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          {[
            { label: 'Dashboard', path: '/dashboard' },
            { label: 'Journal', path: '/journal', active: true },
            { label: 'Mood', path: '/mood' },
            { label: 'Focus', path: '/calm' },
          ].map(item => (
            <span
              key={item.label}
              onClick={() => router.push(item.path)}
              style={item.active ? t.activeNavStyle : undefined}
              className={`text-[14px] font-medium cursor-pointer transition-colors ${item.active ? '' : 'text-white/40 hover:text-white/80'}`}
            >
              {item.label}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <button className="text-white/40 hover:text-white/70 transition-colors">
            <Bell className="w-4 h-4" />
          </button>
          <div className="w-8 h-8 rounded-full p-[2px] cursor-pointer" style={{ background: `linear-gradient(135deg, ${t.accent}, ${t.accent}99)` }} onClick={() => router.push('/settings')}>
            <div className="w-full h-full rounded-full flex items-center justify-center" style={{ backgroundColor: t.colors.bgPrimary }}>
              <User className="w-3.5 h-3.5 text-white/70" />
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-10 pb-12">

        {/* Personal welcome layer */}
        <motion.header
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6"
        >
          <div>
            <h1 className="text-[32px] sm:text-[38px] font-semibold text-white tracking-tight leading-tight mb-1">
              {greeting}
            </h1>
            {lastWrote && (
              <p className="text-[14px] text-white/30 font-light">{lastWrote}</p>
            )}
          </div>
          <button
            onClick={() => router.push('/journal/new')}
            className="flex items-center gap-2 bg-white/[0.06] border border-white/[0.09] text-white/80 px-5 py-2.5 rounded-full text-[14px] font-medium hover:bg-white/[0.1] hover:text-white transition-all duration-250 hover:-translate-y-[1px] active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            New entry
          </button>
        </motion.header>

        {/* Draft / blank page card */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-10"
        >
          <div
            onClick={() => router.push('/journal/new')}
            className="group flex items-center justify-between px-6 py-4 rounded-[16px] bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] hover:border-white/[0.09] transition-all duration-250 cursor-pointer"
          >
            <div>
              <p className="text-[14px] text-white/50 font-light group-hover:text-white/70 transition-colors">
                A blank page is waiting.
              </p>
            </div>
            <span className="text-[12px] text-white/25 group-hover:text-white/50 transition-colors">
              Begin →
            </span>
          </div>
        </motion.div>

        {/* On this day (last month) */}
        {onThisDay && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-10"
          >
            <p className="text-[11px] text-white/25 uppercase tracking-widest mb-3">On this day, a while back…</p>
            <div
              onClick={() => router.push(`/journal/${onThisDay.id}`)}
              className="group px-6 py-4 rounded-[16px] bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] hover:border-white/[0.08] cursor-pointer transition-all duration-250"
            >
              <h4 className="text-[14px] font-medium text-white/60 group-hover:text-white/80 transition-colors line-clamp-1">
                {onThisDay.title || 'Untitled reflection'}
              </h4>
              <p className="text-[12px] text-white/30 mt-1 line-clamp-2 leading-relaxed">
                {onThisDay.content?.slice(0, 100) || ''}…
              </p>
            </div>
          </motion.div>
        )}

        {/* Pinned — Meaningful Moments */}
        <AnimatePresence>
          {pinnedEntries.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-12"
            >
              <div className="flex items-center gap-2 mb-5">
                <Star className="w-3.5 h-3.5 text-amber-400/60" fill="currentColor" />
                <h2 className="text-[13px] font-medium text-white/35 uppercase tracking-widest">Meaningful Moments</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence>
                  {pinnedEntries.map((entry) => (
                    <EntryCard key={entry.id} entry={entry} onDeleteRequest={requestDelete} onPinToggle={handlePinToggle} />
                  ))}
                </AnimatePresence>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Search & filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="mb-8 space-y-4"
        >
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-white/50 transition-colors" />
            <input
              type="text"
              placeholder="Search your entries…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-[14px] py-3.5 pl-11 pr-11 text-[14px] text-white placeholder:text-white/25 focus:outline-none focus:border-white/[0.15] transition-all duration-250"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center p-1 bg-white/[0.02] border border-white/[0.05] rounded-xl self-start">
              {(['All', 'This Week', 'This Month'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-200 ${filter === f ? 'bg-white/[0.07] text-white' : 'text-white/35 hover:text-white/70'}`}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 overflow-x-auto">
              {(['All', 'Calm', 'Anxious', 'Happy', 'Low', 'Grateful'] as const).map(ef => (
                <button
                  key={ef}
                  onClick={() => setEmotionFilter(ef)}
                  className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all duration-200 shrink-0 border ${emotionFilter === ef ? 'bg-white/[0.06] border-white/[0.1] text-white/80' : 'bg-transparent border-white/[0.04] text-white/30 hover:text-white/60'}`}
                >
                  {ef}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Entries grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {processedEntries.map((entry) => (
              <EntryCard key={entry.id} entry={entry} onDeleteRequest={requestDelete} onPinToggle={handlePinToggle} />
            ))}
          </AnimatePresence>
        </div>

        {/* Empty state */}
        {processedEntries.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-14 h-14 rounded-full bg-white/[0.03] border border-white/[0.05] flex items-center justify-center mb-5">
              <Search className="w-5 h-5 text-white/20" />
            </div>
            <h3 className="text-[18px] font-light text-white/40 mb-2">
              {searchQuery ? 'Nothing found here.' : 'This space is waiting.'}
            </h3>
            <p className="text-[13px] text-white/25 max-w-xs leading-relaxed">
              {searchQuery
                ? 'Try adjusting your search or filters.'
                : 'Your first reflection is always the hardest. Take your time.'}
            </p>
          </motion.div>
        )}

        {/* Weekly reflection AI section */}
        <WeeklyReflection entries={entries} />

        {/* Trust signal */}
        <TrustSignal />

      </main>

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
