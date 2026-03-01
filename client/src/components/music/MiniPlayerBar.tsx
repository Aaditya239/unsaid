'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  ChevronUp,
  ListMusic,
  X,
  Music2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMusicStore } from '@/stores/musicStore';
import { ProgressBar } from './ProgressBar';
import { VolumeControl } from './VolumeControl';
import { getCategoryIcon } from '@/data/playlists';

export function MiniPlayerBar() {
  const {
    currentTrack,
    currentPlaylist,
    isPlaying,
    volume,
    loop,
    shuffle,
    progress,
    duration,
    queue,
    isMiniPlayerVisible,
    isExpandedPlayer,
    togglePlay,
    nextTrack,
    prevTrack,
    setVolume,
    toggleLoop,
    toggleShuffle,
    seek,
    toggleExpandedPlayer,
    setMiniPlayerVisible,
  } = useMusicStore();

  const [showQueue, setShowQueue] = useState(false);

  // Don't render if no track or not visible
  if (!currentTrack || !isMiniPlayerVisible) {
    return null;
  }

  const categoryIcon = currentPlaylist ? getCategoryIcon(currentPlaylist.category) : '🎵';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-[900px] -translate-x-1/2"
      >
        <div className="relative rounded-[20px] border border-white/[0.12] bg-black/50 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden">
          {/* Progress Bar (top) */}
          <div className="absolute top-0 left-0 right-0 h-1">
            <ProgressBar
              progress={progress}
              duration={duration}
              onSeek={seek}
              showTime={false}
              size="sm"
            />
          </div>

          {/* Main Content */}
          <div className="px-4 py-3 pt-4">
            <div className="flex items-center gap-4">
              {/* Track Info */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Album Art / Category Icon */}
                <div className="relative shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                  {isPlaying && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20"
                      animate={{ opacity: [0.4, 0.8, 0.4] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                  <span className="text-xl relative z-10">{categoryIcon}</span>
                </div>

                {/* Song Info */}
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium text-white truncate">
                    {currentTrack.title}
                  </p>
                  <p className="text-[12px] text-white/50 truncate">
                    {currentTrack.artist}
                    {currentPlaylist && (
                      <span className="text-white/30"> • {currentPlaylist.title}</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Playback Controls */}
              <div className="flex items-center gap-1">
                {/* Shuffle */}
                <button
                  type="button"
                  onClick={toggleShuffle}
                  className={cn(
                    'hidden sm:flex p-2 rounded-full transition-all duration-200',
                    shuffle
                      ? 'text-blue-400 bg-blue-500/20'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  )}
                  aria-label="Toggle shuffle"
                >
                  <Shuffle className="w-4 h-4" />
                </button>

                {/* Previous */}
                <button
                  type="button"
                  onClick={prevTrack}
                  className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200"
                  aria-label="Previous track"
                >
                  <SkipBack className="w-5 h-5" />
                </button>

                {/* Play/Pause */}
                <motion.button
                  type="button"
                  onClick={togglePlay}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    'p-3 rounded-full transition-all duration-200',
                    isPlaying
                      ? 'bg-white text-black'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  )}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5 ml-0.5" />
                  )}
                </motion.button>

                {/* Next */}
                <button
                  type="button"
                  onClick={nextTrack}
                  className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200"
                  aria-label="Next track"
                >
                  <SkipForward className="w-5 h-5" />
                </button>

                {/* Loop */}
                <button
                  type="button"
                  onClick={toggleLoop}
                  className={cn(
                    'hidden sm:flex p-2 rounded-full transition-all duration-200',
                    loop
                      ? 'text-blue-400 bg-blue-500/20'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  )}
                  aria-label="Toggle loop"
                >
                  <Repeat className="w-4 h-4" />
                </button>
              </div>

              {/* Right Controls */}
              <div className="hidden md:flex items-center gap-2">
                {/* Volume */}
                <VolumeControl
                  volume={volume}
                  onVolumeChange={setVolume}
                />

                {/* Queue Button */}
                {queue.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowQueue(!showQueue)}
                    className={cn(
                      'relative p-2 rounded-full transition-all duration-200',
                      showQueue
                        ? 'text-blue-400 bg-blue-500/20'
                        : 'text-white/60 hover:text-white hover:bg-white/10'
                    )}
                    aria-label="Show queue"
                  >
                    <ListMusic className="w-4 h-4" />
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white">
                      {queue.length}
                    </span>
                  </button>
                )}

                {/* Expand Button */}
                <button
                  type="button"
                  onClick={toggleExpandedPlayer}
                  className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200"
                  aria-label="Expand player"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setMiniPlayerVisible(false)}
                  className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200"
                  aria-label="Close player"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Progress Time (Mobile) */}
            <div className="mt-2 flex items-center justify-between text-[11px] text-white/40 tabular-nums md:hidden">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Helper function
function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
