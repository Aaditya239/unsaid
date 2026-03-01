'use client';

import { useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  progress: number;
  duration: number;
  onSeek: (time: number) => void;
  className?: string;
  showTime?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const formatTime = (seconds: number): string => {
  if (!seconds || !isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export function ProgressBar({
  progress,
  duration,
  onSeek,
  className,
  showTime = true,
  size = 'md',
}: ProgressBarProps) {
  const progressRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const percentage = duration > 0 ? (progress / duration) * 100 : 0;

  const handleSeek = useCallback(
    (clientX: number) => {
      if (!progressRef.current || duration <= 0) return;

      const rect = progressRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const percent = x / rect.width;
      const newTime = percent * duration;

      onSeek(newTime);
    },
    [duration, onSeek]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isDragging.current = true;
      handleSeek(e.clientX);
    },
    [handleSeek]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      isDragging.current = true;
      handleSeek(e.touches[0].clientX);
    },
    [handleSeek]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        handleSeek(e.clientX);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging.current) {
        handleSeek(e.touches[0].clientX);
      }
    };

    const handleEnd = () => {
      isDragging.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [handleSeek]);

  const heights = {
    sm: 'h-1',
    md: 'h-1.5',
    lg: 'h-2',
  };

  return (
    <div className={cn('w-full', className)}>
      <div
        ref={progressRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className={cn(
          'relative w-full cursor-pointer rounded-full bg-white/10 overflow-hidden group',
          heights[size]
        )}
      >
        {/* Background track */}
        <div className="absolute inset-0 bg-white/10" />

        {/* Progress fill */}
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
          style={{ width: `${percentage}%` }}
          transition={{ duration: 0.1, ease: 'linear' }}
        />

        {/* Hover effect */}
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Draggable thumb */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `calc(${percentage}% - 6px)` }}
        />
      </div>

      {showTime && (
        <div className="flex justify-between mt-1.5">
          <span className="text-[11px] text-white/50 tabular-nums">
            {formatTime(progress)}
          </span>
          <span className="text-[11px] text-white/50 tabular-nums">
            {formatTime(duration)}
          </span>
        </div>
      )}
    </div>
  );
}
