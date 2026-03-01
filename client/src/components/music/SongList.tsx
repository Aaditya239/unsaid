'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Music2, Clock, MoreHorizontal, Plus, ListMusic } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Song } from '@/data/playlists';

interface SongListProps {
  songs: Song[];
  currentTrackIndex: number;
  isPlaying: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onPlayTrack: (index: number) => void;
  onAddToQueue?: (song: Song) => void;
  className?: string;
}

export function SongList({
  songs,
  currentTrackIndex,
  isPlaying,
  isExpanded,
  onToggleExpand,
  onPlayTrack,
  onAddToQueue,
  className,
}: SongListProps) {
  return (
    <div className={cn('w-full', className)}>
      {/* Toggle Button */}
      <button
        type="button"
        onClick={onToggleExpand}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-300"
      >
        <div className="flex items-center gap-3">
          <ListMusic className="w-4 h-4 text-white/70" />
          <span className="text-[14px] font-medium text-white/90">
            {songs.length} Songs
          </span>
        </div>
        <motion.span
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-white/60"
        >
          ▼
        </motion.span>
      </button>

      {/* Song List */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-3 max-h-[320px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent rounded-xl border border-white/10 bg-white/[0.02]">
              {songs.map((song, index) => {
                const isCurrentTrack = index === currentTrackIndex;
                const isTrackPlaying = isCurrentTrack && isPlaying;

                return (
                  <motion.div
                    key={song.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={cn(
                      'group flex items-center gap-3 px-4 py-3 transition-all duration-200 cursor-pointer',
                      'hover:bg-white/[0.06]',
                      isCurrentTrack && 'bg-white/[0.08]',
                      index !== songs.length - 1 && 'border-b border-white/5'
                    )}
                    onClick={() => onPlayTrack(index)}
                  >
                    {/* Track Number / Play Button */}
                    <div className="w-8 h-8 flex items-center justify-center shrink-0">
                      <span
                        className={cn(
                          'text-[13px] tabular-nums group-hover:hidden',
                          isCurrentTrack ? 'text-blue-400' : 'text-white/40'
                        )}
                      >
                        {isTrackPlaying ? (
                          <motion.div
                            className="flex items-center gap-0.5"
                            initial={false}
                          >
                            {[0, 1, 2].map((i) => (
                              <motion.div
                                key={i}
                                className="w-0.5 bg-blue-400 rounded-full"
                                animate={{
                                  height: [4, 12, 4],
                                }}
                                transition={{
                                  duration: 0.5,
                                  repeat: Infinity,
                                  delay: i * 0.15,
                                }}
                              />
                            ))}
                          </motion.div>
                        ) : (
                          index + 1
                        )}
                      </span>
                      <button
                        type="button"
                        className="hidden group-hover:flex items-center justify-center w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPlayTrack(index);
                        }}
                      >
                        {isTrackPlaying ? (
                          <Pause className="w-3 h-3 text-white" />
                        ) : (
                          <Play className="w-3 h-3 text-white ml-0.5" />
                        )}
                      </button>
                    </div>

                    {/* Song Info */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          'text-[14px] font-medium truncate',
                          isCurrentTrack ? 'text-blue-400' : 'text-white/90'
                        )}
                      >
                        {song.title}
                      </p>
                      <p className="text-[12px] text-white/50 truncate">
                        {song.artist}
                      </p>
                    </div>

                    {/* Duration */}
                    <div className="flex items-center gap-2 text-white/40">
                      {song.duration && (
                        <span className="text-[12px] tabular-nums">
                          {song.duration}
                        </span>
                      )}

                      {/* Add to Queue Button */}
                      {onAddToQueue && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddToQueue(song);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 transition-all"
                          title="Add to queue"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
