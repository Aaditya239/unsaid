'use client';

// ============================================
// Emotion Selector Component - Premium Dark Theme
// ============================================

import { useState, useRef, useEffect } from 'react';
import { EMOTIONS, Emotion, getEmotionInfo } from '@/lib/journal';
import { cn } from '@/lib/utils';
import { ChevronDown, X } from 'lucide-react';

interface EmotionSelectorProps {
  value: Emotion | null;
  onChange: (emotion: Emotion | null) => void;
  className?: string;
  disabled?: boolean;
}

export default function EmotionSelector({
  value,
  onChange,
  className,
  disabled = false,
}: EmotionSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedEmotion = value ? getEmotionInfo(value) : null;

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'flex items-center justify-between gap-2 w-full px-5 py-4 rounded-2xl shadow-[0_4px_20px_rgba(152,112,112,0.06)]',
          'text-left text-sm transition-all duration-400 group',
          'focus:outline-none focus:ring-4 focus:ring-rose-200/50',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          isOpen
            ? 'bg-white/90 border border-rose-200 shadow-[0_8px_30px_rgba(219,181,181,0.2)]'
            : 'bg-white/60 backdrop-blur-md border border-white/80 hover:bg-white/80 hover:border-rose-100 hover:shadow-[0_8px_25px_rgba(152,112,112,0.1)]'
        )}
      >
        {selectedEmotion ? (
          <span className="flex items-center gap-2.5 text-coffee-dark font-medium">
            <span className="text-2xl drop-shadow-sm group-hover:scale-110 transition-transform duration-300">{selectedEmotion.emoji}</span>
            <span className="tracking-wide">{selectedEmotion.label}</span>
          </span>
        ) : (
          <span className="text-coffee-light font-medium tracking-wide">How are you feeling?</span>
        )}
        <div className="flex items-center gap-1">
          {value && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              className="p-1 rounded-full hover:bg-rose-50 text-coffee-light transition-colors"
            >
              <X className="h-4 w-4 hover:text-rose-500" />
            </button>
          )}
          <ChevronDown
            className={cn(
              'h-5 w-5 text-coffee-light transition-transform duration-500',
              isOpen && 'transform rotate-180 text-rose-500'
            )}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-20 mt-3 w-full glass-card p-3 shadow-glow animate-scale-in origin-top">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {EMOTIONS.map((emotion) => (
              <button
                key={emotion.value}
                type="button"
                onClick={() => {
                  onChange(emotion.value);
                  setIsOpen(false);
                }}
                className={cn(
                  'flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium',
                  'transition-all duration-300 border',
                  value === emotion.value
                    ? 'bg-gradient-to-r from-rose-100 to-blush-100 text-rose-700 border-white shadow-[0_4px_12px_rgba(219,181,181,0.3)] scale-[0.98]'
                    : 'text-coffee-light bg-transparent border-transparent hover:bg-white/60 hover:text-coffee hover:border-white hover:shadow-sm hover:-translate-y-0.5'
                )}
              >
                <span className="text-xl drop-shadow-sm">{emotion.emoji}</span>
                <span className="tracking-wide">{emotion.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
