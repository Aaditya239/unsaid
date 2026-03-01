'use client';

import { Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoopToggleProps {
  isLooping: boolean;
  onToggle: () => void;
  className?: string;
}

export const LoopToggle = ({ isLooping, onToggle, className }: LoopToggleProps) => {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 border',
        isLooping
          ? 'bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white border-transparent shadow-[0_0_15px_rgba(139,92,246,0.3)]'
          : 'bg-white/[0.03] text-white/60 border-white/[0.08] hover:bg-white/[0.08] hover:text-white/90',
        className
      )}
    >
      <Repeat className={cn('w-4 h-4')} />
      <span className="text-[13px] font-medium tracking-wide">Loop</span>
    </button>
  );
};

export default LoopToggle;
