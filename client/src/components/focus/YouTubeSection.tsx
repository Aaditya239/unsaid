'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Youtube,
  Eye,
  EyeOff,
  AlertCircle,
  Music,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { useFocusMusic } from '@/context/FocusMusicContext';
import { indianPlaylists, IndianPlaylist, IndianPlaylistMood } from '@/data/indianPlaylists';
import { cn } from '@/lib/utils';

// ============================================
// MOOD CONFIG
// ============================================

const MOOD_COLORS: Record<IndianPlaylistMood, { gradient: string; glow: string }> = {
  happy: { gradient: 'from-yellow-500/20 to-orange-500/20', glow: 'rgba(234, 179, 8, 0.3)' },
  energy: { gradient: 'from-red-500/20 to-orange-500/20', glow: 'rgba(239, 68, 68, 0.3)' },
  sad: { gradient: 'from-blue-500/20 to-indigo-500/20', glow: 'rgba(59, 130, 246, 0.3)' },
  calm: { gradient: 'from-teal-500/20 to-cyan-500/20', glow: 'rgba(20, 184, 166, 0.3)' },
  spiritual: { gradient: 'from-purple-500/20 to-violet-500/20', glow: 'rgba(147, 51, 234, 0.3)' },
  focus: { gradient: 'from-emerald-500/20 to-green-500/20', glow: 'rgba(16, 185, 129, 0.3)' },
};

// ============================================
// PLAYLIST CARD
// ============================================

interface PlaylistCardProps {
  playlist: IndianPlaylist;
  isSelected: boolean;
  onSelect: (playlist: IndianPlaylist) => void;
}

function PlaylistCard({ playlist, isSelected, onSelect }: PlaylistCardProps) {
  const colors = MOOD_COLORS[playlist.mood];

  return (
    <motion.button
      onClick={() => onSelect(playlist)}
      className={cn(
        'relative w-full text-left p-5 rounded-2xl transition-all duration-300',
        'bg-white/[0.04] backdrop-blur-sm border',
        isSelected
          ? 'border-white/20 shadow-lg'
          : 'border-white/[0.06] hover:border-white/10 hover:bg-white/[0.06]'
      )}
      style={{
        boxShadow: isSelected ? `0 8px 32px ${colors.glow}` : undefined,
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Background gradient */}
      <div
        className={cn(
          'absolute inset-0 rounded-2xl opacity-50 bg-gradient-to-br',
          colors.gradient
        )}
      />

      <div className="relative flex items-center gap-4">
        {/* YouTube Icon */}
        <div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center',
            'bg-gradient-to-br',
            colors.gradient
          )}
        >
          <Youtube className="w-6 h-6 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-[15px]">{playlist.title}</h3>
          <p className="text-white/50 text-[13px] truncate">{playlist.description}</p>
        </div>

        {/* Mood badge */}
        <span
          className={cn(
            'px-2.5 py-1 rounded-full text-[11px] font-medium capitalize',
            'bg-white/10 text-white/70'
          )}
        >
          {playlist.mood}
        </span>
      </div>
    </motion.button>
  );
}

// ============================================
// YOUTUBE PLAYER
// ============================================

interface YouTubePlayerProps {
  playlist: IndianPlaylist | null;
  showVideo: boolean;
  onToggleVideo: () => void;
  onClose: () => void;
}

function YouTubePlayer({ playlist, showVideo, onToggleVideo, onClose }: YouTubePlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { pause, currentSource, youtubeQuotaExceeded } = useFocusMusic();

  // Pause local audio when YouTube starts
  useEffect(() => {
    if (playlist && currentSource === 'local') {
      pause();
    }
  }, [playlist, currentSource, pause]);

  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  if (!playlist) {
    return null;
  }

  if (youtubeQuotaExceeded) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/[0.04] border border-yellow-500/20 rounded-2xl p-6 text-center"
      >
        <AlertCircle className="w-12 h-12 text-yellow-500/60 mx-auto mb-4" />
        <h3 className="text-white font-semibold text-[16px] mb-2">YouTube Limit Reached</h3>
        <p className="text-white/50 text-[14px]">
          Please try again later. YouTube API has a daily quota limit.
        </p>
      </motion.div>
    );
  }

  // YouTube embed URL with playlist
  const embedUrl = `https://www.youtube.com/embed/videoseries?list=${playlist.playlistId}&autoplay=0&rel=0&modestbranding=1`;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
            <Youtube className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-white font-medium text-[15px]">{playlist.title}</h3>
            <p className="text-white/40 text-[12px]">YouTube Playlist</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle Video */}
          <button
            onClick={onToggleVideo}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] transition-colors',
              showVideo
                ? 'bg-white/10 text-white'
                : 'bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08]'
            )}
          >
            {showVideo ? (
              <>
                <EyeOff className="w-4 h-4" />
                Hide Video
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                Show Video
              </>
            )}
          </button>

          {/* External link */}
          <a
            href={`https://www.youtube.com/playlist?list=${playlist.playlistId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-white/[0.04] text-white/50 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/[0.04] text-white/50 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            ×
          </button>
        </div>
      </div>

      {/* Player */}
      <div className="relative">
        {/* Audio-only mode */}
        <AnimatePresence mode="wait">
          {!showVideo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-8 flex flex-col items-center justify-center"
            >
              <div className="relative">
                <motion.div
                  className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Music className="w-10 h-10 text-white/60" />
                </motion.div>
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{ boxShadow: '0 0 40px rgba(239, 68, 68, 0.2)' }}
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <p className="text-white/50 text-[14px] mt-4">Audio-only mode</p>
              <p className="text-white/30 text-[12px]">Click "Show Video" to see the video</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Video iframe (hidden by default) */}
        <div className={cn('transition-all duration-300', showVideo ? 'block' : 'hidden')}>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          )}
          <div className="aspect-video w-full">
            <iframe
              ref={iframeRef}
              src={embedUrl}
              title={playlist.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoad={handleIframeLoad}
            />
          </div>
        </div>
      </div>

      {/* Mini controls when video hidden - just keeping iframe for audio */}
      {!showVideo && (
        <div className="p-4 border-t border-white/[0.06]">
          <p className="text-white/40 text-[12px] text-center">
            Use the YouTube player controls in the hidden iframe. Click "Show Video" to access full controls.
          </p>
        </div>
      )}
    </motion.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function YouTubeSection() {
  const [selectedPlaylist, setSelectedPlaylist] = useState<IndianPlaylist | null>(null);
  const {
    showYouTubeVideo,
    toggleYouTubeVideo,
    setYouTubePlaylist,
    currentCategory,
  } = useFocusMusic();

  const handlePlaylistSelect = (playlist: IndianPlaylist) => {
    if (selectedPlaylist?.id === playlist.id) {
      setSelectedPlaylist(null);
      return;
    }
    setSelectedPlaylist(playlist);
    setYouTubePlaylist(playlist.playlistId);
  };

  const handleClose = () => {
    setSelectedPlaylist(null);
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-semibold text-white flex items-center gap-2">
            <Youtube className="w-5 h-5 text-red-400" />
            YouTube Playlists
          </h2>
          <p className="text-white/50 text-[14px] mt-1">
            Curated Indian music playlists
          </p>
        </div>
      </div>

      {/* Playlist Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {indianPlaylists.map((playlist) => (
          <PlaylistCard
            key={playlist.id}
            playlist={playlist}
            isSelected={selectedPlaylist?.id === playlist.id}
            onSelect={handlePlaylistSelect}
          />
        ))}
      </div>

      {/* YouTube Player */}
      <AnimatePresence>
        {selectedPlaylist && (
          <YouTubePlayer
            playlist={selectedPlaylist}
            showVideo={showYouTubeVideo}
            onToggleVideo={toggleYouTubeVideo}
            onClose={handleClose}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
