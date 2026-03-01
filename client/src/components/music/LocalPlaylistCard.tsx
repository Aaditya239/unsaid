'use client';

import { motion } from 'framer-motion';
import { Play, Pause, Music2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCategoryIcon } from '@/data/playlists';
import type { Playlist } from '@/data/playlists';

interface LocalPlaylistCardProps {
  playlist: Playlist;
  isSelected: boolean;
  isPlaying: boolean;
  onSelect: () => void;
  className?: string;
}

export function LocalPlaylistCard({
  playlist,
  isSelected,
  isPlaying,
  onSelect,
  className,
}: LocalPlaylistCardProps) {
  const isActive = isSelected && isPlaying;
  const icon = getCategoryIcon(playlist.category);
  const songCount = playlist.songs.length;
  const totalDuration = playlist.songs.reduce((acc, song) => {
    if (!song.duration) return acc;
    const [mins, secs] = song.duration.split(':').map(Number);
    return acc + mins * 60 + secs;
  }, 0);
  const formattedDuration = `${Math.floor(totalDuration / 60)} min`;

  return (
    <motion.button
      type="button"
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={cn(
        'group relative w-full text-left p-5 rounded-[20px] border shadow-lg overflow-hidden',
        'bg-white/[0.06] backdrop-blur-xl border-white/[0.12]',
        'transition-all duration-300 ease-out',
        'hover:bg-white/[0.09] hover:border-white/20 hover:shadow-[0_16px_30px_rgba(15,23,42,0.35)]',
        isSelected && 'border-white/30 bg-white/[0.10]',
        isActive && 'ring-1 ring-blue-500/30',
        className
      )}
    >
      {/* Background Gradient */}
      <div
        className={cn(
          'absolute inset-0 opacity-40 transition-opacity duration-300',
          `bg-gradient-to-br ${playlist.gradient}`,
          isSelected && 'opacity-60'
        )}
      />

      {/* Glow Effect when playing */}
      {isActive && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4">
          {/* Icon & Title */}
          <div className="flex items-center gap-3">
            <span className="text-2xl">{icon}</span>
            <div>
              <h3 className="text-[17px] font-semibold text-white tracking-tight">
                {playlist.title}
              </h3>
              <p className="mt-0.5 text-[13px] text-white/60 leading-relaxed line-clamp-1">
                {playlist.description}
              </p>
            </div>
          </div>

          {/* Play Button */}
          <motion.div
            className={cn(
              'shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300',
              isActive
                ? 'bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]'
                : 'bg-white/10 group-hover:bg-white/20'
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isActive ? (
              <Pause className="w-4 h-4 text-white" />
            ) : (
              <Play className="w-4 h-4 text-white ml-0.5" />
            )}
          </motion.div>
        </div>

        {/* Meta Info */}
        <div className="mt-4 flex items-center gap-4 text-[12px] text-white/50">
          <div className="flex items-center gap-1.5">
            <Music2 className="w-3.5 h-3.5" />
            <span>{songCount} songs</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{formattedDuration}</span>
          </div>
        </div>

        {/* Playing Indicator */}
        {isActive && (
          <motion.div
            className="mt-3 flex items-center gap-2"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-0.5">
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="w-0.5 bg-blue-400 rounded-full"
                  animate={{
                    height: [4, 14, 4],
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    delay: i * 0.12,
                  }}
                />
              ))}
            </div>
            <span className="text-[12px] text-blue-400 font-medium">
              Now Playing
            </span>
          </motion.div>
        )}
      </div>
    </motion.button>
  );
}
