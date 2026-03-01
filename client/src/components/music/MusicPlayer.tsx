'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  History,
  Music2,
  ListMusic,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMusicStore } from '@/stores/musicStore';
import { playlists, getCategoryIcon } from '@/data/playlists';
import { LocalPlaylistCard } from './LocalPlaylistCard';
import { SongList } from './SongList';
import { ProgressBar } from './ProgressBar';
import { VolumeControl } from './VolumeControl';

export function MusicPlayer() {
  const {
    currentPlaylist,
    currentTrack,
    currentTrackIndex,
    isPlaying,
    volume,
    loop,
    shuffle,
    progress,
    duration,
    recentlyPlayed,
    setPlaylist,
    togglePlay,
    playTrack,
    nextTrack,
    prevTrack,
    setVolume,
    toggleLoop,
    toggleShuffle,
    seek,
    addToQueue,
  } = useMusicStore();

  const [showSongs, setShowSongs] = useState(false);
  const [showRecent, setShowRecent] = useState(false);

  const handlePlaylistSelect = (playlistId: string) => {
    const playlist = playlists.find((p) => p.id === playlistId);
    if (playlist) {
      if (currentPlaylist?.id === playlistId && isPlaying) {
        togglePlay();
      } else if (currentPlaylist?.id === playlistId) {
        togglePlay();
      } else {
        setPlaylist(playlist, true);
      }
    }
  };

  return (
    <div className="w-full space-y-8">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[24px] font-semibold text-white tracking-tight">
            Local Music
          </h2>
          <p className="mt-1 text-[14px] text-white/50">
            Premium audio experience with no API limits
          </p>
        </div>

        {/* Recently Played Toggle */}
        {recentlyPlayed.length > 0 && (
          <button
            type="button"
            onClick={() => setShowRecent(!showRecent)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-200',
              showRecent
                ? 'bg-white/10 border-white/20 text-white'
                : 'bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10'
            )}
          >
            <History className="w-4 h-4" />
            <span className="text-[13px] font-medium">Recently Played</span>
          </button>
        )}
      </div>

      {/* Recently Played Section */}
      <AnimatePresence>
        {showRecent && recentlyPlayed.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <h3 className="text-[14px] font-medium text-white/70 mb-3">
                Recent Tracks
              </h3>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10">
                {recentlyPlayed.map((item) => (
                  <motion.button
                    key={item.song.id + item.timestamp}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      const playlist = playlists.find((p) => p.id === item.playlistId);
                      if (playlist) {
                        const index = playlist.songs.findIndex((s) => s.id === item.song.id);
                        if (index >= 0) {
                          setPlaylist(playlist, false);
                          setTimeout(() => playTrack(index), 50);
                        }
                      }
                    }}
                    className="flex-shrink-0 flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                      <Music2 className="w-4 h-4 text-white/60" />
                    </div>
                    <div className="text-left">
                      <p className="text-[13px] font-medium text-white truncate max-w-[120px]">
                        {item.song.title}
                      </p>
                      <p className="text-[11px] text-white/50 truncate max-w-[120px]">
                        {item.song.artist}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Playlist Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {playlists.map((playlist) => (
          <LocalPlaylistCard
            key={playlist.id}
            playlist={playlist}
            isSelected={currentPlaylist?.id === playlist.id}
            isPlaying={currentPlaylist?.id === playlist.id && isPlaying}
            onSelect={() => handlePlaylistSelect(playlist.id)}
          />
        ))}
      </div>

      {/* Now Playing Section */}
      <AnimatePresence>
        {currentPlaylist && currentTrack && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
            className="p-6 rounded-[24px] bg-white/[0.06] backdrop-blur-xl border border-white/[0.12] shadow-[0_20px_50px_rgba(0,0,0,0.4)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getCategoryIcon(currentPlaylist.category)}</span>
                <div>
                  <h3 className="text-[18px] font-semibold text-white">
                    {currentPlaylist.title}
                  </h3>
                  <p className="text-[13px] text-white/50">
                    {currentPlaylist.songs.length} songs
                  </p>
                </div>
              </div>

              {/* Playback Mode Indicators */}
              <div className="flex items-center gap-2">
                {shuffle && (
                  <span className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 text-[11px] font-medium">
                    Shuffle
                  </span>
                )}
                {loop && (
                  <span className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-400 text-[11px] font-medium">
                    Loop
                  </span>
                )}
              </div>
            </div>

            {/* Current Track */}
            <div className="mb-6">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                {/* Album Art Placeholder */}
                <div className="relative w-16 h-16 rounded-xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center overflow-hidden">
                  {isPlaying && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-purple-500/30"
                      animate={{ opacity: [0.3, 0.7, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                  <Music2 className="w-6 h-6 text-white/60 relative z-10" />
                </div>

                {/* Track Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[16px] font-medium text-white truncate">
                    {currentTrack.title}
                  </p>
                  <p className="text-[13px] text-white/50 truncate">
                    {currentTrack.artist}
                  </p>
                </div>

                {/* Duration */}
                <span className="text-[13px] text-white/40 tabular-nums">
                  {currentTrack.duration}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <ProgressBar
                progress={progress}
                duration={duration}
                onSeek={seek}
                size="md"
              />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              {/* Left Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleShuffle}
                  className={cn(
                    'p-2.5 rounded-full transition-all duration-200',
                    shuffle
                      ? 'text-blue-400 bg-blue-500/20'
                      : 'text-white/50 hover:text-white hover:bg-white/10'
                  )}
                >
                  <Shuffle className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Center Controls */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={prevTrack}
                  className="p-3 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all"
                >
                  <SkipBack className="w-5 h-5" />
                </button>

                <motion.button
                  type="button"
                  onClick={togglePlay}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    'p-4 rounded-full transition-all duration-200',
                    isPlaying
                      ? 'bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.3)]'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  )}
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6 ml-0.5" />
                  )}
                </motion.button>

                <button
                  type="button"
                  onClick={nextTrack}
                  className="p-3 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleLoop}
                  className={cn(
                    'p-2.5 rounded-full transition-all duration-200',
                    loop
                      ? 'text-purple-400 bg-purple-500/20'
                      : 'text-white/50 hover:text-white hover:bg-white/10'
                  )}
                >
                  <Repeat className="w-4.5 h-4.5" />
                </button>

                <VolumeControl
                  volume={volume}
                  onVolumeChange={setVolume}
                />
              </div>
            </div>

            {/* Song List */}
            <div className="mt-6">
              <SongList
                songs={currentPlaylist.songs}
                currentTrackIndex={currentTrackIndex}
                isPlaying={isPlaying}
                isExpanded={showSongs}
                onToggleExpand={() => setShowSongs(!showSongs)}
                onPlayTrack={playTrack}
                onAddToQueue={addToQueue}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard Shortcuts Help */}
      <div className="text-center text-[12px] text-white/30">
        <span>Keyboard: </span>
        <span className="text-white/50">Space</span> Play/Pause •{' '}
        <span className="text-white/50">←/→</span> Prev/Next •{' '}
        <span className="text-white/50">↑/↓</span> Volume •{' '}
        <span className="text-white/50">L</span> Loop •{' '}
        <span className="text-white/50">S</span> Shuffle •{' '}
        <span className="text-white/50">M</span> Mute
      </div>
    </div>
  );
}
