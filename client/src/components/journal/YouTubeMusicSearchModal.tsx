'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Music, X, Loader2, Plus, Play, Pause, AlertCircle, RefreshCw } from 'lucide-react';
import { searchYouTubeMusic, YouTubeMusic, YouTubeMusicSearchError } from '@/lib/journal';

interface YouTubeMusicSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (music: YouTubeMusic) => void;
}

interface SearchError {
    code: string;
    message: string;
    isRetryable: boolean;
}

// User-friendly error messages
const getErrorMessage = (code: string): string => {
    switch (code) {
        case 'YOUTUBE_QUOTA_EXCEEDED':
            return 'Daily search limit reached. Please try again tomorrow.';
        case 'YOUTUBE_PERMISSION_DENIED':
        case 'YOUTUBE_IP_BLOCKED':
        case 'YOUTUBE_INVALID_KEY':
        case 'YOUTUBE_MISSING_API_KEY':
            return 'Music search is temporarily unavailable. Please try again later.';
        case 'YOUTUBE_NETWORK_ERROR':
            return 'Connection error. Please check your internet and try again.';
        case 'RATE_LIMITED':
            return 'Too many searches. Please wait a moment.';
        case 'YOUTUBE_INVALID_QUERY':
            return 'Please enter at least 2 characters to search.';
        default:
            return 'Something went wrong. Please try again.';
    }
};

export default function YouTubeMusicSearchModal({
    isOpen,
    onClose,
    onSelect
}: YouTubeMusicSearchModalProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<YouTubeMusic[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchError, setSearchError] = useState<SearchError | null>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleSearch = async (q: string) => {
        if (!q.trim() || q.trim().length < 2) {
            setResults([]);
            setSearchError(null);
            return;
        }

        setIsLoading(true);
        setSearchError(null);

        try {
            const data = await searchYouTubeMusic(q);
            setResults(data);
            setSearchError(null);
        } catch (err) {
            console.error('[MusicSearch] Error:', err);
            
            if (err instanceof YouTubeMusicSearchError) {
                setSearchError({
                    code: err.code,
                    message: getErrorMessage(err.code),
                    isRetryable: err.isRetryable,
                });
            } else {
                setSearchError({
                    code: 'UNKNOWN',
                    message: 'Something went wrong. Please try again.',
                    isRetryable: true,
                });
            }
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

        if (query.length > 2) {
            searchTimeoutRef.current = setTimeout(() => {
                handleSearch(query);
            }, 500);
        } else {
            setResults([]);
            setSearchError(null);
        }

        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };
    }, [query]);

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setQuery('');
            setResults([]);
            setSearchError(null);
        }
    }, [isOpen]);

    // Prevent background scroll
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-2xl bg-[#0A1128]/95 border border-white/10 rounded-[28px] shadow-[0_32px_64px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[80vh]"
            >
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4F7CFF] to-[#9C6BFF] flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Music className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-white">Add Music</h2>
                            <p className="text-sm text-white/40">Search and attach a song to your journal</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Search Input */}
                <div className="p-6 pb-2">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-[#4F7CFF] transition-colors" />
                        <input
                            type="text"
                            autoFocus
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search for tracks or artists..."
                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 outline-none focus:border-[#4F7CFF]/40 focus:bg-white/[0.05] transition-all"
                        />
                    </div>
                </div>

                {/* Results Body */}
                <div className="flex-1 overflow-y-auto p-6 pt-2">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="w-10 h-10 text-[#4F7CFF] animate-spin" />
                            <p className="text-white/40 text-sm animate-pulse">Scanning the airwaves...</p>
                        </div>
                    ) : searchError ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
                                <AlertCircle className="w-7 h-7 text-red-400" />
                            </div>
                            <div>
                                <p className="text-red-400 text-sm mb-2 font-medium">{searchError.message}</p>
                                {searchError.code === 'YOUTUBE_QUOTA_EXCEEDED' && (
                                    <p className="text-white/30 text-xs">YouTube limits daily searches across all users.</p>
                                )}
                            </div>
                            {searchError.isRetryable && (
                                <button
                                    onClick={() => handleSearch(query)}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-white/5 hover:bg-white/10 rounded-full text-white/60 hover:text-white text-sm transition-all border border-white/10 hover:border-white/20"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Try Again
                                </button>
                            )}
                        </div>
                    ) : results.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3">
                            {results.map((track) => (
                                <button
                                    key={track.videoId}
                                    onClick={() => onSelect(track)}
                                    className="group flex items-center gap-4 p-3 bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05] hover:border-white/20 rounded-2xl transition-all text-left"
                                >
                                    <div className="relative w-16 h-16 rounded-xl overflow-hidden shadow-lg flex-shrink-0">
                                        <img src={track.thumbnail} alt={track.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Plus className="w-6 h-6 text-white" />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-white font-medium truncate mb-1" dangerouslySetInnerHTML={{ __html: track.title }}></h3>
                                        <p className="text-white/40 text-sm truncate">{track.channelTitle}</p>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity pr-2">
                                        <div className="px-4 py-1.5 bg-[#4F7CFF] text-white text-[12px] font-semibold rounded-full shadow-lg shadow-blue-500/20">
                                            ATTACH
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : query.length > 2 ? (
                        <div className="text-center py-20">
                            <p className="text-white/30 text-sm">No results found for "{query}"</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center px-10">
                            <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center mb-4">
                                <Music className="w-8 h-8 text-white/10" />
                            </div>
                            <p className="text-white/40 text-[15px] leading-relaxed">
                                Type something to find the perfect <br /> soundtrack for your entry
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 px-6 border-t border-white/5 text-[11px] text-white/20 flex justify-between uppercase tracking-widest bg-white/[0.01]">
                    <span>YouTube Music Search</span>
                    <span>Powered by UNSAID</span>
                </div>
            </motion.div>
        </div>
    );
}
