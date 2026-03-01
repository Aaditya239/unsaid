'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Music,
  Moon,
  Zap,
  Heart,
  Brain,
  Coffee,
  Play,
  Pause,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { useFocusMusic, MusicCategory, LocalTrack } from '@/context/FocusMusicContext';
import { cn } from '@/lib/utils';

// ============================================
// CATEGORY CONFIG
// ============================================

interface CategoryConfig {
  id: MusicCategory;
  label: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
  glowColor: string;
}

const CATEGORIES: CategoryConfig[] = [
  {
    id: 'calm',
    label: 'Calm',
    description: 'Peaceful ambient sounds',
    icon: Moon,
    gradient: 'from-blue-500/20 to-purple-500/20',
    glowColor: 'rgba(147, 51, 234, 0.3)',
  },
  {
    id: 'focus',
    label: 'Focus',
    description: 'Deep concentration music',
    icon: Brain,
    gradient: 'from-cyan-500/20 to-blue-500/20',
    glowColor: 'rgba(6, 182, 212, 0.3)',
  },
  {
    id: 'energy',
    label: 'Energy',
    description: 'Uplifting beats',
    icon: Zap,
    gradient: 'from-orange-500/20 to-yellow-500/20',
    glowColor: 'rgba(249, 115, 22, 0.3)',
  },
  {
    id: 'emotional',
    label: 'Emotional',
    description: 'Heartfelt melodies',
    icon: Heart,
    gradient: 'from-pink-500/20 to-rose-500/20',
    glowColor: 'rgba(236, 72, 153, 0.3)',
  },
  {
    id: 'night',
    label: 'Night',
    description: 'Sleep & relaxation',
    icon: Coffee,
    gradient: 'from-indigo-500/20 to-violet-500/20',
    glowColor: 'rgba(99, 102, 241, 0.3)',
  },
];

// ============================================
// CATEGORY CARD
// ============================================

interface CategoryCardProps {
  category: CategoryConfig;
  isActive: boolean;
  trackCount: number;
  onClick: () => void;
}

function CategoryCard({ category, isActive, trackCount, onClick }: CategoryCardProps) {
  const Icon = category.icon;

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'relative w-full text-left p-3 sm:p-5 rounded-xl sm:rounded-2xl transition-all duration-300',
        'bg-white/[0.04] backdrop-blur-sm border',
        isActive
          ? 'border-white/20 shadow-lg'
          : 'border-white/[0.06] hover:border-white/10 hover:bg-white/[0.06]'
      )}
      style={{
        boxShadow: isActive ? `0 8px 32px ${category.glowColor}` : undefined,
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Background gradient */}
      <div
        className={cn(
          'absolute inset-0 rounded-xl sm:rounded-2xl opacity-50 bg-gradient-to-br',
          category.gradient
        )}
      />

      <div className="relative flex items-center gap-3 sm:gap-4">
        <div
          className={cn(
            'w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center',
            'bg-gradient-to-br',
            category.gradient
          )}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-[13px] sm:text-[15px]">{category.label}</h3>
          <p className="text-white/50 text-[11px] sm:text-[13px] truncate hidden sm:block">{category.description}</p>
        </div>

        <div className="flex items-center gap-2">
          {trackCount > 0 && (
            <span className="text-white/40 text-[11px] sm:text-[12px] hidden sm:inline">{trackCount} tracks</span>
          )}
          <ChevronRight
            className={cn(
              'w-4 h-4 sm:w-5 sm:h-5 transition-transform',
              isActive ? 'text-white rotate-90' : 'text-white/30'
            )}
          />
        </div>
      </div>
    </motion.button>
  );
}

// ============================================
// TRACK LIST
// ============================================

interface TrackListProps {
  tracks: LocalTrack[];
  currentTrackId: string | null;
  isPlaying: boolean;
  onTrackSelect: (track: LocalTrack, index: number) => void;
}

function TrackList({ tracks, currentTrackId, isPlaying, onTrackSelect }: TrackListProps) {
  if (tracks.length === 0) {
    return (
      <div className="py-12 text-center">
        <Music className="w-12 h-12 text-white/20 mx-auto mb-4" />
        <p className="text-white/50 text-[14px]">No tracks in this category yet</p>
        <p className="text-white/30 text-[12px] mt-1">
          Add MP3 files to /public/music/category/
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tracks.map((track, index) => {
        const isActive = track.id === currentTrackId;
        const isThisPlaying = isActive && isPlaying;

        return (
          <motion.button
            key={track.id}
            onClick={() => onTrackSelect(track, index)}
            className={cn(
              'w-full text-left p-3 sm:p-4 rounded-lg sm:rounded-xl transition-all duration-200',
              'flex items-center gap-3 sm:gap-4 group',
              isActive
                ? 'bg-white/10 border border-white/10'
                : 'bg-white/[0.02] border border-transparent hover:bg-white/[0.06]'
            )}
            whileHover={{ x: 4 }}
            layout
          >
            {/* Play indicator / number */}
            <div
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center text-[13px] font-medium',
                isActive ? 'bg-white/20 text-white' : 'bg-white/5 text-white/40'
              )}
            >
              {isThisPlaying ? (
                <motion.div
                  className="flex items-center gap-0.5"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <span className="w-0.5 h-3 bg-white rounded-full" />
                  <span className="w-0.5 h-4 bg-white rounded-full" />
                  <span className="w-0.5 h-2 bg-white rounded-full" />
                </motion.div>
              ) : isActive ? (
                <Pause className="w-4 h-4" />
              ) : (
                <span className="group-hover:hidden">{index + 1}</span>
              )}
              {!isActive && (
                <Play className="w-4 h-4 hidden group-hover:block" />
              )}
            </div>

            {/* Track info */}
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  'font-medium text-[14px] truncate',
                  isActive ? 'text-white' : 'text-white/80'
                )}
              >
                {track.title}
              </p>
              <p className="text-white/40 text-[12px]">{track.subtitle || track.category}</p>
            </div>

            {/* Active glow */}
            {isActive && (
              <motion.div
                className="absolute inset-0 rounded-xl pointer-events-none"
                style={{
                  boxShadow: '0 0 30px rgba(147, 51, 234, 0.15)',
                }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function PlaylistSection() {
  const {
    localTracks,
    currentCategory,
    currentLocalTrack,
    isPlaying,
    isLoading,
    currentSource,
    loadCategory,
    playLocalTrack,
    togglePlay,
  } = useFocusMusic();

  const handleCategoryClick = async (categoryId: MusicCategory) => {
    if (categoryId === 'youtube') return;
    await loadCategory(categoryId);
  };

  const handleTrackSelect = (track: LocalTrack, index: number) => {
    if (currentLocalTrack?.id === track.id && currentSource === 'local') {
      togglePlay();
    } else {
      playLocalTrack(track, index);
    }
  };

  const currentTracks = currentCategory ? localTracks[currentCategory] || [] : [];
  const isLocalPlaying = currentSource === 'local' && isPlaying;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[18px] sm:text-[20px] font-semibold text-white">Local Music</h2>
          <p className="text-white/50 text-[13px] sm:text-[14px] mt-1">
            Curated playlists for every mood
          </p>
        </div>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
        {CATEGORIES.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            isActive={currentCategory === category.id}
            trackCount={localTracks[category.id]?.length || 0}
            onClick={() => handleCategoryClick(category.id)}
          />
        ))}
      </div>

      {/* Track List */}
      <AnimatePresence mode="wait">
        {currentCategory && currentCategory !== 'youtube' && (
          <motion.div
            key={currentCategory}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-xl sm:rounded-2xl p-2 sm:p-4 overflow-hidden"
          >
            {isLoading ? (
              <div className="py-12 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white/40 animate-spin" />
              </div>
            ) : (
              <TrackList
                tracks={currentTracks}
                currentTrackId={currentLocalTrack?.id || null}
                isPlaying={isLocalPlaying}
                onTrackSelect={handleTrackSelect}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
