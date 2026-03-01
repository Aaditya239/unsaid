'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Music, Play, Pause, Search, Heart, HeartOff,
    Volume2, X, RotateCcw, Layout, Sparkles,
    Disc, AlertCircle, ExternalLink, SkipForward,
    CloudRain, Wind, Waves, Trees, Flame,
    Maximize2, Minimize2, RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useYouTubeStore, YouTubeVideo, YouTubeError, YOUTUBE_ERROR_CODES } from '@/stores/youtubeStore';
import { useCalmStore } from '@/stores/calmStore';
import api from '@/lib/api';

// ── Ambient Presets ──────────────────────────────────────────────────────────

const AMBIENT = [
    { id: 'hBn_m67y580', name: 'Gentle Rain', emoji: '🌧️', icon: CloudRain, color: '#3B82F6' },
    { id: 'mX_mZ04vR8E', name: 'Forest Birds', emoji: '🌲', icon: Trees, color: '#10B981' },
    { id: 'L-W5YOf90E4', name: 'Ocean Waves', emoji: '🌊', icon: Waves, color: '#0EA5E9' },
    { id: 'L_LUpnjgPso', name: 'Fireplace', emoji: '🔥', icon: Flame, color: '#F59E0B' },
    { id: '2Vp8P5SgL6c', name: 'Light Wind', emoji: '🌬️', icon: Wind, color: '#94A3B8' },
];

type Tab = 'Recommended' | 'Search' | 'Favourites' | 'Ambient';

export const YouTubeIntegration = ({
    onPlaybackStateChange,
}: {
    onPlaybackStateChange: (isPlaying: boolean) => void;
}) => {
    const {
        currentVideo, isPlaying, isLooping, volume, favorites, recommendations,
        searchResults, isLoading, error, fetchFavorites, fetchMoodRecommendations,
        searchVideos, toggleFavorite, isFavorite, playVideo, stopVideo, setIsPlaying,
        setIsLooping, setVolume, setSearchResults, clearError
    } = useYouTubeStore();

    const { moodSuggestion } = useCalmStore();

    const [activeTab, setActiveTab] = useState<Tab>('Recommended');
    const [searchQuery, setSearchQuery] = useState('');
    const [showVideo, setShowVideo] = useState(false);
    const searchDebounce = useRef<NodeJS.Timeout | null>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // ── Mood-based logic ──────────────────────────────────────────────────────

    useEffect(() => {
        if (moodSuggestion?.mood) {
            fetchMoodRecommendations(moodSuggestion.mood);
        } else {
            fetchMoodRecommendations('CALM');
        }
    }, [moodSuggestion?.mood, fetchMoodRecommendations]);

    useEffect(() => {
        fetchFavorites();
    }, [fetchFavorites]);

    useEffect(() => {
        onPlaybackStateChange(isPlaying);
    }, [isPlaying, onPlaybackStateChange]);

    // Clear error when switching tabs
    useEffect(() => {
        clearError();
    }, [activeTab, clearError]);

    // ── Search Logic ──────────────────────────────────────────────────────────

    const handleSearchChange = (q: string) => {
        setSearchQuery(q);
        clearError(); // Clear any previous errors
        
        if (searchDebounce.current) clearTimeout(searchDebounce.current);

        if (!q.trim()) {
            setSearchResults([]);
            return;
        }

        searchDebounce.current = setTimeout(() => {
            searchVideos(q);
        }, 500);
    };

    const handleRetrySearch = () => {
        clearError();
        if (searchQuery.trim().length >= 2) {
            searchVideos(searchQuery);
        }
    };

    // ── Playback Helpers ─────────────────────────────────────────────────────

    const togglePlay = () => setIsPlaying(!isPlaying);

    // YouTube Embed URL Builder
    const getEmbedUrl = (videoId: string) => {
        const params = new URLSearchParams({
            autoplay: '1',
            controls: '0',
            rel: '0',
            modestbranding: '1',
            iv_load_policy: '3',
            enablejsapi: '1'
        });

        if (isLooping) {
            params.append('loop', '1');
            params.append('playlist', videoId); // Required for looping fixed video
        }

        return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="flex flex-col gap-6 w-full max-w-full overflow-hidden">

            {/* Header / Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex bg-white/[0.03] border border-white/[0.08] p-1.5 rounded-[16px] backdrop-blur-xl">
                    {(['Recommended', 'Search', 'Favourites', 'Ambient'] as Tab[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                'px-5 py-2 rounded-[12px] text-[13px] font-medium transition-all relative',
                                activeTab === tab
                                    ? 'bg-white/[0.1] text-white shadow-xl'
                                    : 'text-white/40 hover:text-white/60'
                            )}
                        >
                            {tab}
                            {tab === 'Favourites' && favorites.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#4F7CFF] text-white text-[9px] flex items-center justify-center rounded-full animate-in zoom-in duration-300">
                                    {favorites.length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {isLoading && (
                    <div className="flex items-center gap-2 text-[12px] text-white/40 px-3 py-1 bg-white/[0.02] rounded-full border border-white/[0.05]">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-3 h-3 border border-white/20 border-t-white/60 rounded-full"
                        />
                        Loading...
                    </div>
                )}
            </div>

            {/* Tab Content */}
            <div className="min-h-[300px]">
                <AnimatePresence mode="wait">

                    {/* RECOMMENDED TAB */}
                    {activeTab === 'Recommended' && (
                        <motion.div
                            key="recommended"
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                            exit="hidden"
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                        >
                            {recommendations.length > 0 ? (
                                recommendations.map((video) => (
                                    <motion.div key={video.videoId} variants={itemVariants}>
                                        <MusicCard
                                            video={video}
                                            isActive={currentVideo?.videoId === video.videoId}
                                            isPlaying={isPlaying && currentVideo?.videoId === video.videoId}
                                            onPlay={() => playVideo(video)}
                                            onFavorite={() => toggleFavorite(video)}
                                            isFav={isFavorite(video.videoId)}
                                        />
                                    </motion.div>
                                ))
                            ) : (
                                <div className="col-span-full py-12 flex flex-col items-center justify-center gap-4 text-white/30 border border-dashed border-white/10 rounded-[24px]">
                                    <Sparkles className="w-8 h-8 opacity-20" />
                                    <p className="text-[14px]">Fetching mood-based music...</p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* SEARCH TAB */}
                    {activeTab === 'Search' && (
                        <motion.div
                            key="search"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex flex-col gap-6"
                        >
                            <div className="flex items-center gap-3 px-6 py-4 bg-white/[0.04] border border-white/[0.08] rounded-[24px] focus-within:border-white/20 focus-within:bg-white/[0.06] transition-all group">
                                <Search className="w-5 h-5 text-white/20 group-focus-within:text-white/60 transition-colors" />
                                <input
                                    value={searchQuery}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    placeholder="Search for focus music, lofi, ambient..."
                                    className="flex-1 bg-transparent text-[16px] text-white placeholder:text-white/20 focus:outline-none"
                                />
                                {searchQuery && (
                                    <button onClick={() => { setSearchQuery(''); setSearchResults([]); clearError(); }} className="p-1 hover:bg-white/10 rounded-full">
                                        <X className="w-4 h-4 text-white/40" />
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-8">
                                {/* Error State */}
                                {error && activeTab === 'Search' && (
                                    <div className="col-span-full py-12 flex flex-col items-center justify-center gap-4 text-center border border-dashed border-red-500/20 rounded-[24px] bg-red-500/[0.02]">
                                        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                                            <AlertCircle className="w-6 h-6 text-red-400" />
                                        </div>
                                        <div>
                                            <p className="text-red-400 text-[14px] font-medium mb-1">{error.message}</p>
                                            {error.code === YOUTUBE_ERROR_CODES.QUOTA_EXCEEDED && (
                                                <p className="text-white/30 text-[12px]">YouTube limits daily searches across all users.</p>
                                            )}
                                        </div>
                                        {error.isRetryable && (
                                            <button
                                                onClick={handleRetrySearch}
                                                className="flex items-center gap-2 px-5 py-2 bg-white/5 hover:bg-white/10 rounded-full text-white/50 hover:text-white/80 text-[13px] transition-all border border-white/10 hover:border-white/20"
                                            >
                                                <RefreshCw className="w-4 h-4" />
                                                Try Again
                                            </button>
                                        )}
                                    </div>
                                )}
                                
                                {/* Search Results */}
                                {!error && searchResults.map((video) => (
                                    <MusicRow
                                        key={video.videoId}
                                        video={video}
                                        isActive={currentVideo?.videoId === video.videoId}
                                        onPlay={() => playVideo(video)}
                                        onFavorite={() => toggleFavorite(video)}
                                        isFav={isFavorite(video.videoId)}
                                    />
                                ))}
                                
                                {/* No Results */}
                                {!error && searchQuery.length >= 2 && searchResults.length === 0 && !isLoading && (
                                    <div className="col-span-full py-12 text-center text-white/30">
                                        No results found for "{searchQuery}"
                                    </div>
                                )}
                                
                                {/* Loading State */}
                                {isLoading && (
                                    <div className="col-span-full py-12 flex flex-col items-center justify-center gap-4 text-white/30">
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                            className="w-8 h-8 border-2 border-white/10 border-t-[#4F7CFF] rounded-full"
                                        />
                                        <p className="text-[14px]">Searching...</p>
                                    </div>
                                )}
                                
                                {/* Empty State */}
                                {!error && !searchQuery && !isLoading && (
                                    <div className="col-span-full py-12 text-center flex flex-col items-center gap-4 text-white/20">
                                        <Disc className="w-12 h-12 opacity-5 animate-spin-slow" />
                                        <p className="text-[14px]">Find your sound</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* FAVOURITES TAB */}
                    {activeTab === 'Favourites' && (
                        <motion.div
                            key="favorites"
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                            exit="hidden"
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                        >
                            {favorites.length > 0 ? (
                                favorites.map((video) => (
                                    <motion.div key={video.videoId} variants={itemVariants}>
                                        <MusicCard
                                            video={video}
                                            isActive={currentVideo?.videoId === video.videoId}
                                            isPlaying={isPlaying && currentVideo?.videoId === video.videoId}
                                            onPlay={() => playVideo(video)}
                                            onFavorite={() => toggleFavorite(video)}
                                            isFav={true}
                                        />
                                    </motion.div>
                                ))
                            ) : (
                                <div className="col-span-full py-12 flex flex-col items-center justify-center gap-4 text-white/30 border border-dashed border-white/10 rounded-[24px]">
                                    <Heart className="w-8 h-8 opacity-20" />
                                    <p className="text-[14px]">Save music to see them here.</p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* AMBIENT TAB */}
                    {activeTab === 'Ambient' && (
                        <motion.div
                            key="ambient"
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                            exit="hidden"
                            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                        >
                            {AMBIENT.map((sound) => (
                                <motion.div key={sound.id} variants={itemVariants}>
                                    <AmbientCard
                                        sound={sound}
                                        isActive={currentVideo?.videoId === sound.id}
                                        isPlaying={isPlaying && currentVideo?.videoId === sound.id}
                                        onClick={() => playVideo({
                                            id: sound.id,
                                            videoId: sound.id,
                                            title: sound.name,
                                            channelTitle: 'UNSAID Ambient',
                                            thumbnail: null
                                        })}
                                    />
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Mini Player / Embedded Player ───────────────────────────────────── */}
            <AnimatePresence>
                {currentVideo && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: 100, x: '-50%' }}
                        className="fixed bottom-6 left-1/2 w-[calc(100%-2rem)] max-w-[650px] z-[100]"
                    >
                        <div className="relative group p-4 rounded-[32px] bg-[#0A0B0E]/80 backdrop-blur-[40px] border border-white/[0.08] shadow-[0_32px_80px_rgba(0,0,0,0.6)] flex items-center gap-4">

                            {/* Hidden/Popout Video Container */}
                            <div className={cn(
                                "absolute bottom-full left-0 right-0 mb-4 rounded-[28px] overflow-hidden bg-black aspect-video border border-white/[0.1] shadow-2xl transition-all duration-500 origin-bottom",
                                showVideo ? "scale-100 opacity-100 translate-y-0 pointer-events-auto" : "scale-75 opacity-0 translate-y-12 pointer-events-none"
                            )}>
                                {isPlaying && (
                                    <iframe
                                        id="youtube-player"
                                        ref={iframeRef}
                                        src={getEmbedUrl(currentVideo.videoId)}
                                        className="w-full h-full"
                                        allow="autoplay; encrypted-media"
                                        frameBorder="0"
                                    />
                                )}
                            </div>

                            {/* Thumbnail area */}
                            <div className="relative w-[64px] h-[64px] shrink-0 rounded-[20px] overflow-hidden shadow-2xl bg-white/[0.05] border border-white/10 group-hover:scale-[1.02] transition-transform">
                                {currentVideo.thumbnail ? (
                                    <img src={currentVideo.thumbnail} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-[#4F7CFF]/20 to-[#9C6BFF]/20">
                                        <Music className="w-6 h-6 text-white/40" />
                                    </div>
                                )}
                                {isPlaying && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                        <Waveform isPlaying={isPlaying} />
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0 pr-4">
                                <h4 className="text-[15px] font-semibold text-white truncate leading-tight mb-0.5">{currentVideo.title}</h4>
                                <p className="text-[12px] text-white/40 truncate flex items-center gap-2">
                                    {currentVideo.channelTitle}
                                    {isPlaying && <span className="w-1 h-1 rounded-full bg-[#4F7CFF] animate-pulse" />}
                                </p>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center gap-1.5 shrink-0 pr-2">
                                <PlayerBtn onClick={() => setShowVideo(!showVideo)} highlight={showVideo} tooltip="Toggle Video">
                                    <Layout className="w-4 h-4" />
                                </PlayerBtn>
                                <PlayerBtn onClick={() => setIsLooping(!isLooping)} highlight={isLooping} tooltip="Loop Mode">
                                    <RotateCcw className="w-4 h-4" />
                                </PlayerBtn>

                                <div className="mx-1 h-8 w-[1px] bg-white/[0.08]" />

                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={togglePlay}
                                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-[#4F7CFF] text-white shadow-[0_0_30px_rgba(79,124,255,0.4)] hover:shadow-[0_0_40px_rgba(79,124,255,0.6)] transition-all"
                                >
                                    {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current translate-x-0.5" />}
                                </motion.button>

                                <button onClick={stopVideo} className="w-9 h-9 flex items-center justify-center rounded-full text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors ml-1">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Progress / Glow Accent */}
                            <div className="absolute top-0 left-0 right-0 h-[2px] rounded-full overflow-hidden">
                                {isPlaying && (
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-transparent via-[#4F7CFF] to-transparent w-full"
                                        animate={{ x: ['-100%', '100%'] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                                    />
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Glowing audio waveform background (Optional effect request) */}
            <div className="fixed inset-0 pointer-events-none z-[-1] opacity-20">
                {isPlaying && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#4F7CFF]/10 rounded-full blur-[120px] animate-pulse" />}
            </div>
        </div>
    );
};

// ── Sub-components ────────────────────────────────────────────────────────────

function MusicCard({
    video, isActive, isPlaying, onPlay, onFavorite, isFav
}: {
    video: YouTubeVideo;
    isActive: boolean;
    isPlaying: boolean;
    onPlay: () => void;
    onFavorite: () => void;
    isFav: boolean;
}) {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className={cn(
                "group p-4 bg-white/[0.04] border border-white/[0.08] rounded-[24px] cursor-pointer hover:bg-white/[0.07] hover:border-white/[0.12] transition-all",
                isActive && "border-[#4F7CFF]/40 bg-[#4F7CFF]/[0.05]"
            )}
            onClick={onPlay}
        >
            <div className="relative aspect-video rounded-[16px] overflow-hidden mb-4 bg-black/40">
                {video.thumbnail && <img src={video.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="" />}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-2xl">
                        {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current translate-x-0.5" />}
                    </div>
                </div>
                {isActive && (
                    <div className="absolute bottom-3 right-3">
                        <Waveform isPlaying={isPlaying} />
                    </div>
                )}
            </div>
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <h4 className="text-[14px] font-medium text-white/90 truncate leading-snug">{video.title}</h4>
                    <p className="text-[11px] text-white/30 truncate mt-0.5">{video.channelTitle}</p>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); onFavorite(); }}
                    className={cn(
                        "w-9 h-9 flex items-center justify-center rounded-full transition-all shrink-0",
                        isFav ? "text-[#FF4F7C] bg-[#FF4F7C]/10" : "text-white/20 hover:text-white/60 hover:bg-white/10"
                    )}
                >
                    {isFav ? <Heart className="w-4 h-4 fill-current" /> : <HeartOff className="w-4 h-4" />}
                </button>
            </div>
        </motion.div>
    );
}

function MusicRow({
    video, isActive, onPlay, onFavorite, isFav
}: {
    video: YouTubeVideo;
    isActive: boolean;
    onPlay: () => void;
    onFavorite: () => void;
    isFav: boolean;
}) {
    return (
        <div
            onClick={onPlay}
            className={cn(
                "flex items-center gap-4 p-3 rounded-[20px] bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.06] hover:border-white/[0.1] transition-all cursor-pointer group",
                isActive && "border-[#4F7CFF]/30 bg-[#4F7CFF]/5"
            )}
        >
            <div className="relative w-20 h-14 shrink-0 rounded-[12px] overflow-hidden bg-black/20">
                {video.thumbnail && <img src={video.thumbnail} className="w-full h-full object-cover" alt="" />}
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-4 h-4 text-white fill-current" />
                </div>
            </div>
            <div className="flex-1 min-w-0 pr-4">
                <h4 className="text-[14px] font-medium text-white/80 truncate">{video.title}</h4>
                <p className="text-[11px] text-white/30 truncate">{video.channelTitle}</p>
            </div>
            <button
                onClick={(e) => { e.stopPropagation(); onFavorite(); }}
                className={cn(
                    "w-9 h-9 flex items-center justify-center rounded-full transition-all shrink-0",
                    isFav ? "text-[#FF4F7C] bg-[#FF4F7C]/10" : "text-white/10 hover:text-white/40 hover:bg-white/5"
                )}
            >
                {isFav ? <Heart className="w-4 h-4 fill-current" /> : <HeartOff className="w-4 h-4" />}
            </button>
        </div>
    );
}

function AmbientCard({ sound, isActive, isPlaying, onClick }: { sound: any, isActive: boolean, isPlaying: boolean, onClick: () => void }) {
    return (
        <motion.button
            whileHover={{ y: -3, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={cn(
                "group p-5 rounded-[24px] flex flex-col items-center gap-4 transition-all duration-300 relative overflow-hidden",
                isActive
                    ? "bg-[#4F7CFF]/10 border border-[#4F7CFF]/30 ring-4 ring-[#4F7CFF]/5"
                    : "bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12]"
            )}
        >
            <div
                className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 duration-500"
                style={{ backgroundColor: isActive ? sound.color : 'rgba(255,255,255,0.05)' }}
            >
                <sound.icon className={cn("w-6 h-6 leading-none", isActive ? "text-white" : "text-white/30 group-hover:text-white/60")} />
            </div>
            <div className="text-center">
                <p className={cn("text-[13px] font-medium transition-colors", isActive ? "text-white" : "text-white/40 group-hover:text-white/70")}>{sound.name}</p>
                {isActive && <div className="mt-1"><Waveform isPlaying={isPlaying} color={sound.color} /></div>}
            </div>

            {/* Subtle glow background */}
            {isActive && (
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-white/20 blur-[30px] rounded-full pointer-events-none" />
            )}
        </motion.button>
    );
}

function PlayerBtn({ children, onClick, highlight, tooltip }: { children: React.ReactNode; onClick: () => void; highlight?: boolean, tooltip?: string }) {
    return (
        <button
            onClick={onClick}
            title={tooltip}
            className={cn(
                'w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300',
                highlight
                    ? 'bg-white/[0.15] text-[#4F7CFF] border border-white/[0.1] shadow-inner'
                    : 'text-white/30 hover:text-white/80 hover:bg-white/[0.05] border border-transparent'
            )}
        >
            {children}
        </button>
    );
}

function Waveform({ isPlaying, color = "#4F7CFF" }: { isPlaying: boolean, color?: string }) {
    return (
        <div className="flex items-center gap-[2.5px] h-3">
            {[1, 2, 3, 4, 5].map((i) => (
                <motion.div
                    key={i}
                    className="w-[2.5px] rounded-full"
                    style={{ backgroundColor: color }}
                    animate={{
                        height: isPlaying ? [4, 12, 4] : 4,
                        opacity: isPlaying ? [0.6, 1, 0.6] : 0.3
                    }}
                    transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        delay: i * 0.1,
                        ease: "linear"
                    }}
                />
            ))}
        </div>
    );
}
