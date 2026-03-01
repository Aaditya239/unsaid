'use client';

import { motion } from 'framer-motion';
import { Play, Pause, Square, SkipForward } from 'lucide-react';
import { cn } from '@/lib/utils';

type TimerState = 'idle' | 'running' | 'paused' | 'completed';

interface TimerDisplayProps {
  formattedTime: string;
  progress: number;
  state: TimerState;
  focusPhase: 'work' | 'break' | null;
  currentCycle: number;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  isAudioPlaying?: boolean;
}

export const TimerDisplay = ({
  formattedTime,
  progress,
  state,
  focusPhase,
  currentCycle,
  onStart,
  onPause,
  onResume,
  onReset,
  isAudioPlaying,
}: TimerDisplayProps) => {
  const isRunning = state === 'running';
  const isPaused = state === 'paused';
  const isIdle = state === 'idle';

  const circumference = 2 * Math.PI * 140;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const progressRatio = progress / 100;
  const blurRadius = 10 + (30 * progressRatio);
  const r = Math.round(59 + (109 * progressRatio));
  const g = Math.round(130 - (45 * progressRatio));
  const b = Math.round(246 + (1 * progressRatio));
  const a = 0.3 + (0.3 * progressRatio);

  const dynamicBoxShadow = `0 0 ${blurRadius}px rgba(${r},${g},${b},${a})`;

  return (
    <div className="relative flex flex-col items-center justify-center">
      {isAudioPlaying && (
        <style dangerouslySetInnerHTML={{
          __html: `
          @keyframes ambient-pulse {
            0% { transform: scale(1); opacity: 0.5; }
            50% { transform: scale(1.05); opacity: 0.8; }
            100% { transform: scale(1); opacity: 0.5; }
          }
        `}} />
      )}
      {focusPhase && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-12 flex flex-col items-center"
        >
          <span className="px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.1] text-white/80 text-[12px] font-medium uppercase tracking-wider mb-2">
            {focusPhase === 'work' ? 'Focus Session' : 'Short Break'}
          </span>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4].map((cycle) => (
              <div
                key={cycle}
                className={cn(
                  'w-2 h-2 rounded-full transition-all duration-300',
                  cycle < currentCycle
                    ? 'bg-[#3B82F6]'
                    : cycle === currentCycle
                      ? 'bg-[#8B5CF6] shadow-[0_0_8px_rgba(139,92,246,0.8)]'
                      : 'bg-white/20'
                )}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Timer Ring */}
      <div className="relative w-80 h-80 flex items-center justify-center">
        {/* Decorative Outer Glow */}
        <div
          className="absolute inset-0 rounded-full transition-all duration-300 ease-out pointer-events-none"
          style={{
            boxShadow: dynamicBoxShadow,
            background: 'radial-gradient(circle, rgba(139,92,246,0.2), transparent 60%)',
            opacity: 0.5 + (0.5 * progressRatio),
            animation: isAudioPlaying ? 'ambient-pulse 4s ease-in-out infinite' : 'none'
          }}
        />

        <svg className="absolute w-full h-full -rotate-90 pointer-events-none z-10 transition-all duration-300 ease-out" style={{ filter: `drop-shadow(${dynamicBoxShadow})` }}>
          <defs>
            <linearGradient id="timerNeonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <circle
            cx="160"
            cy="160"
            r="140"
            fill="transparent"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="4"
          />
          <motion.circle
            cx="160"
            cy="160"
            r="140"
            fill="transparent"
            stroke="url(#timerNeonGrad)"
            strokeWidth="6"
            strokeLinecap="round"
            filter="url(#glow)"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            style={{ strokeDasharray: circumference }}
          />
        </svg>

        {/* Center UI */}
        <div className="w-64 h-64 rounded-full bg-black/40 backdrop-blur-[20px] border border-white/[0.08] shadow-[0_20px_40px_rgba(0,0,0,0.4)] flex flex-col items-center justify-center relative overflow-hidden z-20">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#3B82F6]/5 to-[#8B5CF6]/5 pointer-events-none" />

          <motion.div
            key={formattedTime}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-[64px] font-semibold tracking-tight text-[#F8FAFC] tabular-nums"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {formattedTime}
          </motion.div>

          {focusPhase && !isIdle && (
            <div className="text-[13px] text-white/50 tracking-wide mt-2">
              Cycle {Math.min(currentCycle, 4)} of 4
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-center gap-4">
        {!isIdle && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onReset}
            className="w-12 h-12 rounded-full bg-white/[0.05] border border-white/[0.1] text-white flex flex-col items-center justify-center hover:bg-white/[0.1] backdrop-blur-md shadow-[0_10px_20px_rgba(0,0,0,0.3)] transition-colors"
          >
            <Square className="w-4 h-4 fill-current" />
          </motion.button>
        )}

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (isIdle) onStart();
            else if (isRunning) onPause();
            else onResume();
          }}
          className="w-16 h-16 rounded-full flex items-center justify-center text-white bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] shadow-[0_15px_30px_rgba(139,92,246,0.3)] border border-white/10 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          {isRunning ? (
            <Pause className="w-6 h-6 fill-current relative z-10" />
          ) : (
            <Play className="w-6 h-6 ml-1 fill-current relative z-10" />
          )}
        </motion.button>

        {focusPhase && !isIdle && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => { }}
            className="w-12 h-12 rounded-full bg-white/[0.05] border border-white/[0.1] text-white flex flex-col items-center justify-center hover:bg-white/[0.1] backdrop-blur-md shadow-[0_10px_20px_rgba(0,0,0,0.3)] opacity-50 cursor-not-allowed transition-colors"
            title="Skip phase (Coming Soon)"
            disabled
          >
            <SkipForward className="w-4 h-4 fill-current" />
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default TimerDisplay;