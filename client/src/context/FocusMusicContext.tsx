'use client';

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import { getTrackDisplayTitle, MusicCategory as TrackCategory } from '@/data/trackTitles';

// ============================================
// TYPES
// ============================================

export interface LocalTrack {
  id: string;
  title: string;
  subtitle?: string;
  src: string;
  category: string;
}

export interface YouTubeTrack {
  id: string;
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail: string | null;
  playlistId?: string;
}

export type MusicSource = 'local' | 'youtube' | null;
export type MusicCategory = 'calm' | 'focus' | 'energy' | 'emotional' | 'night' | 'youtube';

interface FocusMusicState {
  // Source tracking
  currentSource: MusicSource;
  
  // Local music state
  localTracks: Record<string, LocalTrack[]>;
  currentCategory: MusicCategory | null;
  currentLocalTrack: LocalTrack | null;
  currentTrackIndex: number;
  
  // YouTube state
  currentYouTubeTrack: YouTubeTrack | null;
  youtubePlaylistId: string | null;
  showYouTubeVideo: boolean;
  youtubeQuotaExceeded: boolean;
  
  // Playback state
  isPlaying: boolean;
  volume: number;
  loop: boolean;
  repeat: 'off' | 'one' | 'all';
  progress: number;
  duration: number;
  isLoading: boolean;
  error: string | null;
  
  // UI state
  isMiniPlayerVisible: boolean;
  isExpanded: boolean;
}

interface FocusMusicActions {
  // Local music actions
  loadCategory: (category: MusicCategory) => Promise<void>;
  playLocalTrack: (track: LocalTrack, index: number) => void;
  
  // YouTube actions
  playYouTubeTrack: (track: YouTubeTrack) => void;
  setYouTubePlaylist: (playlistId: string) => void;
  toggleYouTubeVideo: () => void;
  setYouTubeQuotaExceeded: (exceeded: boolean) => void;
  
  // Playback controls
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  next: () => void;
  previous: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleLoop: () => void;
  cycleRepeat: () => void;
  
  // Progress tracking
  setProgress: (progress: number) => void;
  setDuration: (duration: number) => void;
  
  // UI actions
  showMiniPlayer: () => void;
  hideMiniPlayer: () => void;
  toggleExpanded: () => void;
  
  // Cleanup
  stopAll: () => void;
  clearError: () => void;
  
  // Audio ref access (for AudioEngine)
  getAudioRef: () => HTMLAudioElement | null;
}

type FocusMusicContextType = FocusMusicState & FocusMusicActions;

// ============================================
// CONTEXT
// ============================================

const FocusMusicContext = createContext<FocusMusicContextType | null>(null);

// ============================================
// INITIAL STATE
// ============================================

const initialState: FocusMusicState = {
  currentSource: null,
  localTracks: {},
  currentCategory: null,
  currentLocalTrack: null,
  currentTrackIndex: -1,
  currentYouTubeTrack: null,
  youtubePlaylistId: null,
  showYouTubeVideo: false,
  youtubeQuotaExceeded: false,
  isPlaying: false,
  volume: 0.7,
  loop: false,
  repeat: 'off',
  progress: 0,
  duration: 0,
  isLoading: false,
  error: null,
  isMiniPlayerVisible: false,
  isExpanded: false,
};

// ============================================
// STORAGE KEYS
// ============================================

const STORAGE_KEY = 'unsaid.focusMusic';

interface PersistedState {
  lastCategory: MusicCategory | null;
  lastTrackId: string | null;
  lastSource: MusicSource;
  volume: number;
  repeat: 'off' | 'one' | 'all';
  loop: boolean;
}

// ============================================
// PROVIDER
// ============================================

export function FocusMusicProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FocusMusicState>(initialState);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const youtubePlayerRef = useRef<any>(null);
  const isInitialized = useRef(false);

  // ========================================
  // INITIALIZATION
  // ========================================

  useEffect(() => {
    // Create audio element
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = 'metadata';
    }

    // Load persisted state
    if (typeof window !== 'undefined' && !isInitialized.current) {
      isInitialized.current = true;
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const persisted: PersistedState = JSON.parse(stored);
          setState((prev) => ({
            ...prev,
            volume: persisted.volume ?? 0.7,
            repeat: persisted.repeat ?? 'off',
            loop: persisted.loop ?? false,
            currentCategory: persisted.lastCategory,
          }));
          
          // Load last category if it was local
          if (persisted.lastCategory && persisted.lastCategory !== 'youtube') {
            loadCategoryInternal(persisted.lastCategory);
          }
        } catch (e) {
          console.warn('[FocusMusic] Failed to load persisted state:', e);
        }
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  // ========================================
  // PERSISTENCE
  // ========================================

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const toStore: PersistedState = {
      lastCategory: state.currentCategory,
      lastTrackId: state.currentLocalTrack?.id || null,
      lastSource: state.currentSource,
      volume: state.volume,
      repeat: state.repeat,
      loop: state.loop,
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  }, [state.currentCategory, state.currentLocalTrack, state.currentSource, state.volume, state.repeat, state.loop]);

  // ========================================
  // AUDIO EVENT HANDLERS
  // ========================================

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setState((prev) => ({ ...prev, progress: audio.currentTime }));
    };

    const handleLoadedMetadata = () => {
      setState((prev) => ({ ...prev, duration: audio.duration, isLoading: false }));
    };

    const handleEnded = () => {
      const currentState = state;
      
      if (currentState.repeat === 'one') {
        audio.currentTime = 0;
        audio.play().catch(console.warn);
        return;
      }
      
      if (currentState.loop) {
        audio.currentTime = 0;
        audio.play().catch(console.warn);
        return;
      }
      
      // Auto-next if repeat all or there are more tracks
      const tracks = currentState.localTracks[currentState.currentCategory || ''] || [];
      const currentIndex = currentState.currentTrackIndex;
      
      if (currentIndex < tracks.length - 1) {
        const nextTrack = tracks[currentIndex + 1];
        playLocalTrackInternal(nextTrack, currentIndex + 1);
      } else if (currentState.repeat === 'all' && tracks.length > 0) {
        const firstTrack = tracks[0];
        playLocalTrackInternal(firstTrack, 0);
      } else {
        setState((prev) => ({ ...prev, isPlaying: false }));
      }
    };

    const handleError = (e: Event) => {
      console.error('[FocusMusic] Audio error:', e);
      setState((prev) => ({
        ...prev,
        isPlaying: false,
        isLoading: false,
        error: 'Failed to play track. Please check the file format.',
      }));
    };

    const handleCanPlay = () => {
      setState((prev) => ({ ...prev, isLoading: false }));
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [state.repeat, state.loop, state.currentCategory, state.currentTrackIndex, state.localTracks]);

  // Sync volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = state.volume;
    }
  }, [state.volume]);

  // ========================================
  // INTERNAL HELPERS
  // ========================================

  const loadCategoryInternal = async (category: MusicCategory) => {
    if (category === 'youtube') return;
    
    // Set currentCategory immediately so UI can show loading state
    setState((prev) => ({ ...prev, isLoading: true, error: null, currentCategory: category }));
    
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${baseUrl}/calm/local-music/${category}`);
      const data = await response.json();
      
      if (data.success) {
        // Map display titles to tracks
        const tracksWithTitles: LocalTrack[] = data.data.map((track: LocalTrack, index: number) => {
          const displayInfo = getTrackDisplayTitle(category as TrackCategory, index);
          return {
            ...track,
            title: displayInfo.title,
            subtitle: displayInfo.subtitle,
          };
        });
        
        setState((prev) => ({
          ...prev,
          localTracks: { ...prev.localTracks, [category]: tracksWithTitles },
          isLoading: false,
        }));
      } else {
        throw new Error(data.message || 'Failed to load music');
      }
    } catch (error) {
      console.error('[FocusMusic] Failed to load category:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load music. Please try again.',
      }));
    }
  };

  const playLocalTrackInternal = (track: LocalTrack, index: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    // Stop YouTube if playing
    if (youtubePlayerRef.current) {
      try {
        youtubePlayerRef.current.pauseVideo?.();
      } catch (e) {
        // Ignore
      }
    }

    setState((prev) => ({
      ...prev,
      currentSource: 'local',
      currentLocalTrack: track,
      currentTrackIndex: index,
      currentYouTubeTrack: null,
      isLoading: true,
      error: null,
      isMiniPlayerVisible: true,
    }));

    // Load and play
    audio.src = track.src;
    audio.load();
    
    audio.play().then(() => {
      setState((prev) => ({ ...prev, isPlaying: true, isLoading: false }));
    }).catch((err) => {
      console.error('[FocusMusic] Play failed:', err);
      setState((prev) => ({
        ...prev,
        isPlaying: false,
        isLoading: false,
        error: err.name === 'NotSupportedError' 
          ? 'Audio format not supported. Please use MP3 files.'
          : 'Failed to play track.',
      }));
    });
  };

  // ========================================
  // ACTIONS
  // ========================================

  const loadCategory = useCallback(async (category: MusicCategory) => {
    await loadCategoryInternal(category);
  }, []);

  const playLocalTrack = useCallback((track: LocalTrack, index: number) => {
    playLocalTrackInternal(track, index);
  }, []);

  const playYouTubeTrack = useCallback((track: YouTubeTrack) => {
    // Pause local audio
    if (audioRef.current) {
      audioRef.current.pause();
    }

    setState((prev) => ({
      ...prev,
      currentSource: 'youtube',
      currentYouTubeTrack: track,
      currentLocalTrack: null,
      isPlaying: true,
      isMiniPlayerVisible: true,
    }));
  }, []);

  const setYouTubePlaylist = useCallback((playlistId: string) => {
    setState((prev) => ({
      ...prev,
      youtubePlaylistId: playlistId,
      currentCategory: 'youtube',
    }));
  }, []);

  const toggleYouTubeVideo = useCallback(() => {
    setState((prev) => ({ ...prev, showYouTubeVideo: !prev.showYouTubeVideo }));
  }, []);

  const setYouTubeQuotaExceeded = useCallback((exceeded: boolean) => {
    setState((prev) => ({ ...prev, youtubeQuotaExceeded: exceeded }));
  }, []);

  const play = useCallback(() => {
    if (state.currentSource === 'local' && audioRef.current) {
      audioRef.current.play().catch(console.warn);
      setState((prev) => ({ ...prev, isPlaying: true }));
    } else if (state.currentSource === 'youtube' && youtubePlayerRef.current) {
      youtubePlayerRef.current.playVideo?.();
      setState((prev) => ({ ...prev, isPlaying: true }));
    }
  }, [state.currentSource]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (youtubePlayerRef.current) {
      youtubePlayerRef.current.pauseVideo?.();
    }
    setState((prev) => ({ ...prev, isPlaying: false }));
  }, []);

  const togglePlay = useCallback(() => {
    if (state.isPlaying) {
      pause();
    } else {
      play();
    }
  }, [state.isPlaying, play, pause]);

  const next = useCallback(() => {
    if (state.currentSource !== 'local') return;
    
    const tracks = state.localTracks[state.currentCategory || ''] || [];
    const nextIndex = state.currentTrackIndex + 1;
    
    if (nextIndex < tracks.length) {
      playLocalTrackInternal(tracks[nextIndex], nextIndex);
    } else if (state.repeat === 'all' && tracks.length > 0) {
      playLocalTrackInternal(tracks[0], 0);
    }
  }, [state.currentSource, state.localTracks, state.currentCategory, state.currentTrackIndex, state.repeat]);

  const previous = useCallback(() => {
    if (state.currentSource !== 'local') return;
    
    const tracks = state.localTracks[state.currentCategory || ''] || [];
    
    // If more than 3 seconds in, restart current track
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }
    
    const prevIndex = state.currentTrackIndex - 1;
    
    if (prevIndex >= 0) {
      playLocalTrackInternal(tracks[prevIndex], prevIndex);
    } else if (state.repeat === 'all' && tracks.length > 0) {
      playLocalTrackInternal(tracks[tracks.length - 1], tracks.length - 1);
    }
  }, [state.currentSource, state.localTracks, state.currentCategory, state.currentTrackIndex, state.repeat]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setState((prev) => ({ ...prev, progress: time }));
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    setState((prev) => ({ ...prev, volume: Math.max(0, Math.min(1, volume)) }));
  }, []);

  const toggleLoop = useCallback(() => {
    setState((prev) => ({ ...prev, loop: !prev.loop }));
  }, []);

  const cycleRepeat = useCallback(() => {
    setState((prev) => {
      const modes: ('off' | 'one' | 'all')[] = ['off', 'one', 'all'];
      const currentIndex = modes.indexOf(prev.repeat);
      const nextIndex = (currentIndex + 1) % modes.length;
      return { ...prev, repeat: modes[nextIndex] };
    });
  }, []);

  const setProgress = useCallback((progress: number) => {
    setState((prev) => ({ ...prev, progress }));
  }, []);

  const setDuration = useCallback((duration: number) => {
    setState((prev) => ({ ...prev, duration }));
  }, []);

  const showMiniPlayer = useCallback(() => {
    setState((prev) => ({ ...prev, isMiniPlayerVisible: true }));
  }, []);

  const hideMiniPlayer = useCallback(() => {
    setState((prev) => ({ ...prev, isMiniPlayerVisible: false }));
  }, []);

  const toggleExpanded = useCallback(() => {
    setState((prev) => ({ ...prev, isExpanded: !prev.isExpanded }));
  }, []);

  const stopAll = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (youtubePlayerRef.current) {
      youtubePlayerRef.current.pauseVideo?.();
    }
    setState((prev) => ({
      ...prev,
      isPlaying: false,
      currentSource: null,
      currentLocalTrack: null,
      currentYouTubeTrack: null,
      progress: 0,
    }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const getAudioRef = useCallback(() => audioRef.current, []);

  // ========================================
  // CONTEXT VALUE
  // ========================================

  const value: FocusMusicContextType = {
    ...state,
    loadCategory,
    playLocalTrack,
    playYouTubeTrack,
    setYouTubePlaylist,
    toggleYouTubeVideo,
    setYouTubeQuotaExceeded,
    play,
    pause,
    togglePlay,
    next,
    previous,
    seek,
    setVolume,
    toggleLoop,
    cycleRepeat,
    setProgress,
    setDuration,
    showMiniPlayer,
    hideMiniPlayer,
    toggleExpanded,
    stopAll,
    clearError,
    getAudioRef,
  };

  return (
    <FocusMusicContext.Provider value={value}>
      {children}
    </FocusMusicContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useFocusMusic() {
  const context = useContext(FocusMusicContext);
  if (!context) {
    throw new Error('useFocusMusic must be used within FocusMusicProvider');
  }
  return context;
}
