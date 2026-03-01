'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Repeat1,
  ChevronUp,
  Music,
  Youtube,
  X,
  Loader2,
} from 'lucide-react';
import { useFocusMusic } from '@/context/FocusMusicContext';
import { cn } from '@/lib/utils';

// ============================================
// PROGRESS BAR
// ============================================

function ProgressBar() {
  const { progress, duration, seek, isLoading } = useFocusMusic();
  const progressRef = useRef<HTMLDivElement>(null);

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressRef.current || duration === 0) return;
      const rect = progressRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      const newTime = percentage * duration;
      seek(Math.max(0, Math.min(newTime, duration)));
    },
    [duration, seek]
  );

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-3 w-full">
      <span className="text-white/40 text-[11px] font-mono w-10 text-right">
        {formatTime(progress)}
      </span>

      <div
        ref={progressRef}
        onClick={handleSeek}
        className="flex-1 h-1.5 bg-white/10 rounded-full cursor-pointer group relative overflow-hidden"
      >
        {/* Buffer indicator */}
        {isLoading && (
          <motion.div
            className="absolute inset-0 bg-white/10"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}

        {/* Progress fill */}
        <motion.div
          className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full relative"
          style={{ width: `${progressPercent}%` }}
        >
          {/* Knob */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.div>
      </div>

      <span className="text-white/40 text-[11px] font-mono w-10">
        {formatTime(duration)}
      </span>
    </div>
  );
}

// ============================================
// VOLUME CONTROL
// ============================================

function VolumeControl() {
  const { volume, setVolume } = useFocusMusic();
  const [showSlider, setShowSlider] = useState(false);
  const isMuted = volume === 0;

  const toggleMute = () => {
    setVolume(isMuted ? 0.7 : 0);
  };

  return (
    <div
      className="relative flex items-center"
      onMouseEnter={() => setShowSlider(true)}
      onMouseLeave={() => setShowSlider(false)}
    >
      <button
        onClick={toggleMute}
        className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
      >
        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>

      <AnimatePresence>
        {showSlider && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 80 }}
            exit={{ opacity: 0, width: 0 }}
            className="overflow-hidden"
          >
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-3
                [&::-webkit-slider-thumb]:h-3
                [&::-webkit-slider-thumb]:bg-white
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:cursor-pointer"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// REPEAT BUTTON
// ============================================

function RepeatButton() {
  const { repeat, cycleRepeat } = useFocusMusic();

  const getIcon = () => {
    if (repeat === 'one') return <Repeat1 className="w-5 h-5" />;
    return <Repeat className="w-5 h-5" />;
  };

  return (
    <button
      onClick={cycleRepeat}
      className={cn(
        'p-2 rounded-lg transition-colors',
        repeat !== 'off'
          ? 'bg-white/10 text-white'
          : 'text-white/40 hover:text-white hover:bg-white/5'
      )}
      title={`Repeat: ${repeat}`}
    >
      {getIcon()}
    </button>
  );
}

// ============================================
// MAIN MINI PLAYER
// ============================================

export function FocusMiniPlayer() {
  const {
    currentSource,
    currentLocalTrack,
    currentYouTubeTrack,
    isPlaying,
    isLoading,
    isMiniPlayerVisible,
    togglePlay,
    next,
    previous,
    stopAll,
  } = useFocusMusic();

  // Don't render if nothing is playing and not visible
  if (!isMiniPlayerVisible || (!currentLocalTrack && !currentYouTubeTrack)) {
    return null;
  }

  const trackTitle = currentLocalTrack?.title || currentYouTubeTrack?.title || 'Unknown';
  const sourceLabel = currentSource === 'youtube' ? 'YouTube' : 'Local';
  const isYouTube = currentSource === 'youtube';

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50"
    >
      <div className="bg-[#0a0a0f]/95 backdrop-blur-xl border-t border-white/[0.08] px-3 sm:px-4 py-2 sm:py-3">
        <div className="max-w-[1200px] mx-auto space-y-2">
          {/* Progress bar (only for local) - hidden on very small screens */}
          {!isYouTube && <div className="hidden xs:block"><ProgressBar /></div>}

          {/* Controls */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Track Info */}
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              {/* Icon */}
              <div
                className={cn(
                  'w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0',
                  isYouTube ? 'bg-red-500/20' : 'bg-purple-500/20'
                )}
              >
                {isYouTube ? (
                  <Youtube className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                ) : (
                  <Music className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                )}
              </div>

              {/* Title & Source */}
              <div className="min-w-0">
                <p className="text-white font-medium text-[12px] sm:text-[14px] truncate max-w-[120px] sm:max-w-none">{trackTitle}</p>
                <p className="text-white/40 text-[10px] sm:text-[12px]">{sourceLabel}</p>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Previous - hidden on small screens */}
              {!isYouTube && (
                <button
                  onClick={previous}
                  className="hidden sm:block p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <SkipBack className="w-5 h-5" />
                </button>
              )}

              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                disabled={isLoading}
                className={cn(
                  'w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all',
                  'bg-gradient-to-br from-purple-500 to-blue-500 text-white',
                  'hover:scale-105 active:scale-95',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" />
                )}
              </button>

              {/* Next - hidden on small screens */}
              {!isYouTube && (
                <button
                  onClick={next}
                  className="hidden sm:block p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-0.5 sm:gap-1">
              {/* Repeat - hidden on mobile */}
              {!isYouTube && <div className="hidden md:block"><RepeatButton /></div>}
              {/* Volume - hidden on mobile */}
              <div className="hidden sm:block"><VolumeControl /></div>
              
              {/* Close */}
              <button
                onClick={stopAll}
                className="p-1.5 sm:p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
