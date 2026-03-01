'use client';

import { motion } from 'framer-motion';
import { Sparkles, Play, RefreshCw, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SoundSuggestion, AISoundSuggestion, getSoundByName } from '@/lib/calm';

interface MoodSuggestionCardProps {
  suggestion: SoundSuggestion | null;
  isLoading: boolean;
  onPlay: (soundId: string) => void;
  onRefresh: () => void;
}

export const MoodSuggestionCard = ({
  suggestion,
  isLoading,
  onPlay,
  onRefresh,
}: MoodSuggestionCardProps) => {
  const sound = suggestion ? getSoundByName(suggestion.suggestedSound) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'p-6 rounded-[24px] bg-white/[0.03] backdrop-blur-[20px] border border-white/[0.08] shadow-[0_20px_40px_rgba(0,0,0,0.45)] transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]'
      )}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#3B82F6]" />
          <h3 className="font-medium text-[15px] text-white/90 tracking-wide">Based on your Mood</h3>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="text-white/40 hover:text-[#3B82F6] transition-colors focus:outline-none"
        >
          <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <motion.div
            className="w-5 h-5 border-2 border-white/20 border-t-[#3B82F6] rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      ) : suggestion && sound ? (
        <>
          <div className="mb-6">
            <p className="text-[17px] text-[#F8FAFC] font-semibold mb-1">
              Try {sound.name}
            </p>
            <p className="text-[15px] text-white/50 leading-relaxed">
              {suggestion.reason}
            </p>
          </div>

          <button
            onClick={() => onPlay(suggestion.soundId)}
            className="w-full py-3 rounded-[12px] bg-white/[0.05] border border-white/[0.1] text-white text-[15px] font-medium hover:bg-white/[0.1] transition-colors flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" />
            Play Routine
          </button>
        </>
      ) : (
        <p className="text-[15px] text-white/40 text-center py-6">
          Log a mood to get personalized suggestions.
        </p>
      )}
    </motion.div>
  );
};

interface AISuggestionCardProps {
  suggestion: AISoundSuggestion | null;
  isLoading: boolean;
  onPlay: (soundName: string) => void;
  onRefresh: () => void;
}

export const AISuggestionCard = ({
  suggestion,
  isLoading,
  onPlay,
  onRefresh,
}: AISuggestionCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'p-6 rounded-[24px] bg-white/[0.03] backdrop-blur-[20px] border border-white/[0.08] shadow-[0_20px_40px_rgba(0,0,0,0.45)] flex flex-col transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]'
      )}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-[#8B5CF6]" />
          <h3 className="font-medium text-[15px] text-white/90 tracking-wide">AI Recommendation</h3>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="text-white/40 hover:text-[#8B5CF6] transition-colors focus:outline-none"
        >
          <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <motion.div
            className="w-5 h-5 border-2 border-white/20 border-t-[#8B5CF6] rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      ) : suggestion ? (
        <div className="flex-1 flex flex-col">
          <p className="text-[14px] text-white/60 mb-5 leading-relaxed">
            {suggestion.suggestion}
          </p>

          <div className="flex flex-wrap gap-2 mt-auto">
            {suggestion.recommendedSounds.map((soundName) => {
              const sound = getSoundByName(soundName);
              if (!sound) return null;

              return (
                <button
                  key={sound.id}
                  onClick={() => onPlay(soundName)}
                  className={cn(
                    'px-4 py-2 rounded-full border border-white/[0.1]',
                    'bg-white/[0.03] text-white/80 text-[13px] font-medium',
                    'hover:bg-white/[0.1] hover:text-white',
                    'transition-all duration-200 flex items-center gap-1.5'
                  )}
                >
                  <Play className="w-3.5 h-3.5" />
                  {sound.name}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mt-auto flex justify-center py-6">
          <button
            onClick={onRefresh}
            className="py-2.5 px-6 rounded-full bg-white/[0.05] border border-white/[0.1] text-white text-[15px] font-medium hover:bg-white/[0.1] transition-colors"
          >
            Get Suggestion
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default MoodSuggestionCard;