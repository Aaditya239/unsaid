'use client';

import { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Volume1, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VolumeControlProps {
  volume: number;
  onVolumeChange: (volume: number) => void;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  showLabel?: boolean;
}

export function VolumeControl({
  volume,
  onVolumeChange,
  className,
  orientation = 'horizontal',
  showLabel = false,
}: VolumeControlProps) {
  const [showSlider, setShowSlider] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(0.7);
  const sliderRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  const handleVolumeChange = useCallback(
    (clientPos: number) => {
      if (!sliderRef.current) return;

      const rect = sliderRef.current.getBoundingClientRect();
      let percent: number;

      if (orientation === 'vertical') {
        const y = rect.bottom - clientPos;
        percent = Math.max(0, Math.min(y / rect.height, 1));
      } else {
        const x = clientPos - rect.left;
        percent = Math.max(0, Math.min(x / rect.width, 1));
      }

      onVolumeChange(percent);
    },
    [orientation, onVolumeChange]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    handleVolumeChange(orientation === 'vertical' ? e.clientY : e.clientX);

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        handleVolumeChange(orientation === 'vertical' ? e.clientY : e.clientX);
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleToggleMute = () => {
    if (volume > 0) {
      setPreviousVolume(volume);
      onVolumeChange(0);
    } else {
      onVolumeChange(previousVolume || 0.7);
    }
  };

  const percentage = volume * 100;

  return (
    <div
      className={cn(
        'relative flex items-center gap-2',
        orientation === 'vertical' && 'flex-col-reverse',
        className
      )}
      onMouseEnter={() => setShowSlider(true)}
      onMouseLeave={() => setShowSlider(false)}
    >
      {/* Volume Icon Button */}
      <button
        type="button"
        onClick={handleToggleMute}
        className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200"
        aria-label={volume === 0 ? 'Unmute' : 'Mute'}
      >
        <VolumeIcon className="w-4 h-4" />
      </button>

      {/* Slider */}
      <AnimatePresence>
        {(showSlider || orientation === 'horizontal') && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className={cn(
              orientation === 'vertical'
                ? 'absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-black/60 backdrop-blur-xl rounded-xl border border-white/10'
                : ''
            )}
          >
            <div
              ref={sliderRef}
              onMouseDown={handleMouseDown}
              className={cn(
                'relative cursor-pointer rounded-full bg-white/10 overflow-hidden',
                orientation === 'vertical' ? 'w-1.5 h-24' : 'w-20 h-1.5'
              )}
            >
              {/* Background */}
              <div className="absolute inset-0 bg-white/10" />

              {/* Fill */}
              <motion.div
                className={cn(
                  'absolute bg-gradient-to-r from-blue-500 to-purple-500',
                  orientation === 'vertical'
                    ? 'inset-x-0 bottom-0 rounded-full'
                    : 'inset-y-0 left-0 rounded-full'
                )}
                style={
                  orientation === 'vertical'
                    ? { height: `${percentage}%` }
                    : { width: `${percentage}%` }
                }
              />

              {/* Thumb */}
              <motion.div
                className="absolute w-2.5 h-2.5 bg-white rounded-full shadow-md"
                style={
                  orientation === 'vertical'
                    ? {
                        left: '50%',
                        bottom: `calc(${percentage}% - 5px)`,
                        transform: 'translateX(-50%)',
                      }
                    : {
                        top: '50%',
                        left: `calc(${percentage}% - 5px)`,
                        transform: 'translateY(-50%)',
                      }
                }
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Label */}
      {showLabel && (
        <span className="text-[11px] text-white/50 tabular-nums w-8">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
}
