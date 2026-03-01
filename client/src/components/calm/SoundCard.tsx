'use client';

import { motion } from 'framer-motion';
import { Play, Pause, CloudRain, Waves, Music, Flame, Wind, TreePine } from 'lucide-react';
import { SoundConfig } from '@/lib/calm';
import { cn } from '@/lib/utils';

interface SoundCardProps {
  sound: SoundConfig;
  isPlaying: boolean;
  isActive: boolean;
  isLoading?: boolean;
  onToggle: () => void;
  isSuggested?: boolean;
}

const iconMap: Record<string, React.ReactNode> = {
  'rain': <CloudRain className="w-8 h-8" />,
  'ocean': <Waves className="w-8 h-8" />,
  'soft-piano': <Music className="w-8 h-8" />,
  'fireplace': <Flame className="w-8 h-8" />,
  'wind': <Wind className="w-8 h-8" />,
  'forest': <TreePine className="w-8 h-8" />,
};

const AudioWaveform = ({ isPlaying }: { isPlaying: boolean }) => {
  return (
    <div className="flex items-end gap-[3px] h-6 justify-center w-full motion-reduce:hidden mt-4 mb-2">
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-1 bg-gradient-to-t from-[#3B82F6] to-[#8B5CF6] rounded-full origin-bottom will-change-transform",
            isPlaying ? "opacity-100" : "opacity-40"
          )}
          style={{
            animation: isPlaying ? `waveform ${0.6 + Math.random() * 0.6}s ease-in-out infinite alternate` : 'none',
            animationDelay: `${Math.random()}s`,
            boxShadow: isPlaying ? '0 0 10px rgba(139,92,246,0.4)' : 'none',
            height: '24px',
            transform: isPlaying ? undefined : 'scaleY(0.2)',
            transition: 'transform 0.4s ease, opacity 0.4s ease'
          }}
        />
      ))}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes waveform {
          0% { transform: scaleY(0.2); }
          100% { transform: scaleY(1); }
        }
      `}} />
    </div>
  );
};

export const SoundCard = ({
  sound,
  isPlaying,
  isActive,
  isLoading,
  onToggle,
  isSuggested,
}: SoundCardProps) => {
  const Icon = iconMap[sound.id] || <Music className="w-8 h-8" />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{
        y: -6,
        boxShadow: isActive ? '0 0 30px rgba(139,92,246,0.3)' : '0 0 20px rgba(59,130,246,0.25)'
      }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        'relative bg-white/[0.03] backdrop-blur-[20px] rounded-[20px] p-6 cursor-pointer border border-white/[0.08] transition-all duration-250 ease-out group flex flex-col items-center justify-center text-center',
        isActive ? 'shadow-[0_0_30px_rgba(139,92,246,0.3)] border-[#8B5CF6]/30' : 'shadow-[0_20px_40px_rgba(0,0,0,0.45)]'
      )}
      onClick={onToggle}
      style={{ minHeight: '220px' }}
    >
      {/* Icon Area */}
      <div className={cn(
        "mb-5 w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300",
        isActive ? "bg-gradient-to-tr from-[#3B82F6]/20 to-[#8B5CF6]/20 text-[#F8FAFC] shadow-[0_0_20px_rgba(139,92,246,0.4)]" : "bg-black/20 text-white/50 group-hover:text-white/80"
      )}>
        {Icon}
      </div>

      {isSuggested && (
        <div className="absolute top-4 right-4 px-2.5 py-1 bg-white/[0.05] text-[#F8FAFC] text-[10px] font-medium tracking-wider uppercase rounded-full border border-white/[0.1]">
          Suggested
        </div>
      )}

      {/* Detail Area */}
      <h3 className={cn("font-medium text-[16px] leading-tight mb-2 tracking-wide transition-colors duration-300", isActive ? "text-[#F8FAFC]" : "text-white/80 group-hover:text-[#F8FAFC]")}>
        {sound.name}
      </h3>
      <p className={cn("text-[13px] text-white/40", isActive ? "mb-0" : "mb-6")}>
        {sound.category}
      </p>

      {isActive && <AudioWaveform isPlaying={isPlaying} />}

      {/* Play Button Floating at bottom */}
      <motion.button
        className={cn(
          'w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 absolute -bottom-6 opacity-0 group-hover:opacity-100 group-hover:bottom-6',
          isActive
            ? 'opacity-100 bottom-6 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white shadow-[0_0_20px_rgba(139,92,246,0.5)]'
            : 'bg-white/[0.05] border border-white/[0.1] text-white backdrop-blur-md hover:bg-white/[0.1]'
        )}
        disabled={isLoading}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
      >
        {isLoading ? (
          <motion.div
            className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        ) : isActive && isPlaying ? (
          <Pause className="w-5 h-5 fill-current" />
        ) : (
          <Play className="w-5 h-5 ml-1 fill-current" />
        )}
      </motion.button>
    </motion.div>
  );
};

export default SoundCard;