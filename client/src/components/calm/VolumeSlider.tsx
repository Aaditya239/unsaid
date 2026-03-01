'use client';

import { motion } from 'framer-motion';
import { Volume2, VolumeX, Volume1 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VolumeSliderProps {
  volume: number;
  onChange: (volume: number) => void;
  className?: string;
}

export const VolumeSlider = ({ volume, onChange, className }: VolumeSliderProps) => {
  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div className={cn('flex items-center gap-4 w-full', className)}>
      <button
        onClick={() => onChange(volume === 0 ? 0.7 : 0)}
        className="text-[#1D1D1F]/60 hover:text-[#1D1D1F] transition-colors focus:outline-none"
      >
        <VolumeIcon className="w-5 h-5" />
      </button>

      <div className="relative flex-1 h-[3px] bg-[#E5E5EA] rounded-full group cursor-pointer flex items-center">
        <motion.div
          className="absolute left-0 h-full bg-[#0A84FF] rounded-full"
          style={{ width: `${volume * 100}%` }}
          layout
        />

        {/* Thumb */}
        <div
          className="absolute w-3.5 h-3.5 bg-white rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.3)] border border-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          style={{ left: `calc(${volume * 100}% - 7px)` }}
        />

        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>

      <span className="text-[13px] font-medium text-[#1D1D1F]/60 w-8 text-right">
        {Math.round(volume * 100)}%
      </span>
    </div>
  );
};

export default VolumeSlider;