'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, SkipBack, SkipForward, Play, Pause, Repeat, Volume2 } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface YouTubePlaylistPlayerProps {
  playlistId: string | null;
  title?: string;
  onClose: () => void;
}

export function YouTubePlaylistPlayer({ playlistId, title, onClose }: YouTubePlaylistPlayerProps) {
  const [showVideo, setShowVideo] = useState(false);
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [visualPlayState, setVisualPlayState] = useState(true);
  const [visualVolume, setVisualVolume] = useState(65);

  return (
    <AnimatePresence>
      {playlistId ? (
        <>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-full rounded-[24px] border border-white/20 bg-white/10 backdrop-blur-xl p-4 sm:p-6 shadow-[0_18px_40px_rgba(15,23,42,0.45)]"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-[17px] sm:text-[19px] font-semibold text-white tracking-tight">
                {title ?? 'Now Playing'}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowVideo((value) => !value)}
                  className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs text-white/85 hover:text-white hover:bg-white/15 transition-all duration-300"
                >
                  {showVideo ? 'Hide Video' : 'Show Video'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 p-2 text-white/80 hover:text-white hover:bg-white/15 transition-all duration-300"
                  aria-label="Close playlist player"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>

            <div className="w-full overflow-hidden rounded-[18px] border border-white/15 bg-black/35">
              <motion.div
                initial={false}
                animate={{ height: showVideo ? 400 : 120 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="relative w-full"
              >
                {!showVideo && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center text-sm text-white/65">
                    Audio-first mode active • Use “Show Video” for full player
                  </div>
                )}
                <iframe
                  title={title ?? 'YouTube playlist player'}
                  src={`https://www.youtube.com/embed/videoseries?list=${playlistId}&modestbranding=1&rel=0`}
                  className={cn(
                    'absolute inset-0 h-[400px] w-full transition-opacity duration-300',
                    showVideo ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  )}
                  loading="lazy"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                />
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed bottom-4 left-1/2 z-40 w-[calc(100%-2rem)] max-w-[1100px] -translate-x-1/2 rounded-[20px] border-t border-white/10 bg-black/40 px-4 py-3 shadow-lg backdrop-blur-xl"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[12px] text-white/55">Now Playing from:</p>
                <p className="text-[14px] font-medium text-white">{title ?? 'Indian Playlist'}</p>
              </div>

              <div className="flex items-center justify-center gap-4 text-white/85">
                <button type="button" className="rounded-full p-2 hover:bg-white/10 transition-colors" aria-label="Previous track visual">
                  <SkipBack className="h-4.5 w-4.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setVisualPlayState((state) => !state)}
                  className="rounded-full border border-white/20 bg-white/10 p-2.5 hover:bg-white/15 transition-colors"
                  aria-label="Play pause visual"
                >
                  {visualPlayState ? <Pause className="h-4.5 w-4.5" /> : <Play className="h-4.5 w-4.5" />}
                </button>
                <button type="button" className="rounded-full p-2 hover:bg-white/10 transition-colors" aria-label="Next track visual">
                  <SkipForward className="h-4.5 w-4.5" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setRepeatEnabled((state) => !state)}
                  className={cn(
                    'rounded-full p-2 transition-colors',
                    repeatEnabled ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10'
                  )}
                  aria-label="Toggle repeat visual"
                >
                  <Repeat className="h-4.5 w-4.5" />
                </button>

                <div className="hidden sm:flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-white/70" />
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={visualVolume}
                    onChange={(event) => setVisualVolume(Number(event.target.value))}
                    className="h-1 w-24 accent-white"
                    aria-label="Volume visual"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setShowVideo((value) => !value)}
                  className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-white/90 hover:bg-white/15 transition-colors"
                >
                  {showVideo ? 'Hide Video' : 'Show Video'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
