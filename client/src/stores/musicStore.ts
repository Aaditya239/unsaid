// ============================================
// GLOBAL MUSIC STORE (ZUSTAND)
// Production-Ready Audio State Management
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Playlist, Song, MusicCategory } from '@/data/playlists';

// ============================================
// TYPES
// ============================================

interface RecentlyPlayed {
  song: Song;
  playlistId: string;
  timestamp: number;
}

interface MusicState {
  // Playback State
  currentPlaylist: Playlist | null;
  currentTrackIndex: number;
  currentTrack: Song | null;
  isPlaying: boolean;
  volume: number;
  loop: boolean;
  shuffle: boolean;
  progress: number;
  duration: number;
  isExpandedPlayer: boolean;
  isMiniPlayerVisible: boolean;

  // Queue
  queue: Song[];

  // History
  recentlyPlayed: RecentlyPlayed[];

  // Focus Timer Lock
  isTimerLocked: boolean;
  lockedPlaylistId: string | null;

  // Crossfade
  crossfadeEnabled: boolean;
  crossfadeDuration: number;

  // Persistence markers
  lastPlaylistId: string | null;
  lastTrackIndex: number;
  lastTimePosition: number;
}

interface MusicActions {
  // Playlist Actions
  setPlaylist: (playlist: Playlist, autoPlay?: boolean) => void;
  clearPlaylist: () => void;

  // Track Actions
  playTrack: (index: number) => void;
  togglePlay: () => void;
  play: () => void;
  pause: () => void;
  nextTrack: () => void;
  prevTrack: () => void;

  // Audio Controls
  setVolume: (volume: number) => void;
  toggleLoop: () => void;
  toggleShuffle: () => void;
  seek: (time: number) => void;
  setProgress: (progress: number) => void;
  setDuration: (duration: number) => void;

  // Queue Management
  addToQueue: (song: Song) => void;
  removeFromQueue: (songId: string) => void;
  clearQueue: () => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;

  // UI State
  toggleExpandedPlayer: () => void;
  setMiniPlayerVisible: (visible: boolean) => void;

  // Timer Integration
  lockForTimer: (playlistId: string) => void;
  unlockTimer: () => void;

  // Recently Played
  addToRecentlyPlayed: (song: Song, playlistId: string) => void;
  clearRecentlyPlayed: () => void;

  // Crossfade
  toggleCrossfade: () => void;
  setCrossfadeDuration: (duration: number) => void;

  // Persistence
  savePosition: (position: number) => void;
  restoreSession: () => void;

  // Reset
  reset: () => void;
}

type MusicStore = MusicState & MusicActions;

// ============================================
// INITIAL STATE
// ============================================

const initialState: MusicState = {
  currentPlaylist: null,
  currentTrackIndex: 0,
  currentTrack: null,
  isPlaying: false,
  volume: 0.7,
  loop: false,
  shuffle: false,
  progress: 0,
  duration: 0,
  isExpandedPlayer: false,
  isMiniPlayerVisible: false,
  queue: [],
  recentlyPlayed: [],
  isTimerLocked: false,
  lockedPlaylistId: null,
  crossfadeEnabled: false,
  crossfadeDuration: 2,
  lastPlaylistId: null,
  lastTrackIndex: 0,
  lastTimePosition: 0,
};

// ============================================
// STORE CREATION
// ============================================

export const useMusicStore = create<MusicStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ========================================
      // PLAYLIST ACTIONS
      // ========================================

      setPlaylist: (playlist, autoPlay = true) => {
        const state = get();
        
        // If timer locked, don't allow changing playlist
        if (state.isTimerLocked && state.lockedPlaylistId !== playlist.id) {
          console.warn('[MusicStore] Playlist locked by timer');
          return;
        }

        const firstTrack = playlist.songs[0] || null;
        
        set({
          currentPlaylist: playlist,
          currentTrackIndex: 0,
          currentTrack: firstTrack,
          isPlaying: autoPlay,
          isMiniPlayerVisible: true,
          lastPlaylistId: playlist.id,
          lastTrackIndex: 0,
          lastTimePosition: 0,
          progress: 0,
        });

        if (firstTrack) {
          get().addToRecentlyPlayed(firstTrack, playlist.id);
        }
      },

      clearPlaylist: () => {
        set({
          currentPlaylist: null,
          currentTrackIndex: 0,
          currentTrack: null,
          isPlaying: false,
          progress: 0,
          duration: 0,
          isMiniPlayerVisible: false,
        });
      },

      // ========================================
      // TRACK ACTIONS
      // ========================================

      playTrack: (index) => {
        const { currentPlaylist, queue } = get();
        
        // Check queue first
        if (queue.length > 0 && index === -1) {
          const nextSong = queue[0];
          set((state) => ({
            currentTrack: nextSong,
            isPlaying: true,
            progress: 0,
            queue: state.queue.slice(1),
          }));
          if (nextSong && currentPlaylist) {
            get().addToRecentlyPlayed(nextSong, currentPlaylist.id);
          }
          return;
        }

        if (!currentPlaylist || index < 0 || index >= currentPlaylist.songs.length) {
          return;
        }

        const track = currentPlaylist.songs[index];
        
        set({
          currentTrackIndex: index,
          currentTrack: track,
          isPlaying: true,
          progress: 0,
          lastTrackIndex: index,
          lastTimePosition: 0,
        });

        get().addToRecentlyPlayed(track, currentPlaylist.id);
      },

      togglePlay: () => {
        set((state) => ({ isPlaying: !state.isPlaying }));
      },

      play: () => {
        set({ isPlaying: true });
      },

      pause: () => {
        set({ isPlaying: false });
      },

      nextTrack: () => {
        const { currentPlaylist, currentTrackIndex, queue, shuffle, loop } = get();
        
        // Check queue first
        if (queue.length > 0) {
          get().playTrack(-1);
          return;
        }

        if (!currentPlaylist) return;

        let nextIndex: number;

        if (shuffle) {
          // Random track (excluding current)
          const availableIndices = currentPlaylist.songs
            .map((_, i) => i)
            .filter((i) => i !== currentTrackIndex);
          nextIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)] ?? 0;
        } else {
          nextIndex = currentTrackIndex + 1;
          
          // Handle end of playlist
          if (nextIndex >= currentPlaylist.songs.length) {
            if (loop) {
              nextIndex = 0;
            } else {
              set({ isPlaying: false });
              return;
            }
          }
        }

        get().playTrack(nextIndex);
      },

      prevTrack: () => {
        const { currentPlaylist, currentTrackIndex, progress } = get();
        
        if (!currentPlaylist) return;

        // If more than 3 seconds in, restart current track
        if (progress > 3) {
          set({ progress: 0 });
          return;
        }

        const prevIndex = currentTrackIndex - 1;
        
        if (prevIndex < 0) {
          // Go to last track if loop enabled
          if (get().loop) {
            get().playTrack(currentPlaylist.songs.length - 1);
          } else {
            set({ progress: 0 });
          }
          return;
        }

        get().playTrack(prevIndex);
      },

      // ========================================
      // AUDIO CONTROLS
      // ========================================

      setVolume: (volume) => {
        set({ volume: Math.max(0, Math.min(1, volume)) });
      },

      toggleLoop: () => {
        set((state) => ({ loop: !state.loop }));
      },

      toggleShuffle: () => {
        set((state) => ({ shuffle: !state.shuffle }));
      },

      seek: (time) => {
        set({ progress: Math.max(0, time), lastTimePosition: time });
      },

      setProgress: (progress) => {
        set({ progress });
      },

      setDuration: (duration) => {
        set({ duration });
      },

      // ========================================
      // QUEUE MANAGEMENT
      // ========================================

      addToQueue: (song) => {
        set((state) => ({
          queue: [...state.queue, song],
        }));
      },

      removeFromQueue: (songId) => {
        set((state) => ({
          queue: state.queue.filter((s) => s.id !== songId),
        }));
      },

      clearQueue: () => {
        set({ queue: [] });
      },

      reorderQueue: (fromIndex, toIndex) => {
        set((state) => {
          const newQueue = [...state.queue];
          const [removed] = newQueue.splice(fromIndex, 1);
          newQueue.splice(toIndex, 0, removed);
          return { queue: newQueue };
        });
      },

      // ========================================
      // UI STATE
      // ========================================

      toggleExpandedPlayer: () => {
        set((state) => ({ isExpandedPlayer: !state.isExpandedPlayer }));
      },

      setMiniPlayerVisible: (visible) => {
        set({ isMiniPlayerVisible: visible });
      },

      // ========================================
      // TIMER INTEGRATION
      // ========================================

      lockForTimer: (playlistId) => {
        set({
          isTimerLocked: true,
          lockedPlaylistId: playlistId,
        });
      },

      unlockTimer: () => {
        set({
          isTimerLocked: false,
          lockedPlaylistId: null,
        });
      },

      // ========================================
      // RECENTLY PLAYED
      // ========================================

      addToRecentlyPlayed: (song, playlistId) => {
        set((state) => {
          // Remove if already exists
          const filtered = state.recentlyPlayed.filter(
            (r) => r.song.id !== song.id
          );
          
          // Add to front, keep max 5
          const updated = [
            { song, playlistId, timestamp: Date.now() },
            ...filtered,
          ].slice(0, 5);

          return { recentlyPlayed: updated };
        });
      },

      clearRecentlyPlayed: () => {
        set({ recentlyPlayed: [] });
      },

      // ========================================
      // CROSSFADE
      // ========================================

      toggleCrossfade: () => {
        set((state) => ({ crossfadeEnabled: !state.crossfadeEnabled }));
      },

      setCrossfadeDuration: (duration) => {
        set({ crossfadeDuration: Math.max(0.5, Math.min(5, duration)) });
      },

      // ========================================
      // PERSISTENCE
      // ========================================

      savePosition: (position) => {
        set({ lastTimePosition: position });
      },

      restoreSession: () => {
        // This is handled by zustand persist middleware
        // The lastPlaylistId, lastTrackIndex, and lastTimePosition
        // are automatically restored on mount
      },

      // ========================================
      // RESET
      // ========================================

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'unsaid-music-store',
      partialize: (state) => ({
        volume: state.volume,
        loop: state.loop,
        shuffle: state.shuffle,
        crossfadeEnabled: state.crossfadeEnabled,
        crossfadeDuration: state.crossfadeDuration,
        recentlyPlayed: state.recentlyPlayed,
        lastPlaylistId: state.lastPlaylistId,
        lastTrackIndex: state.lastTrackIndex,
        lastTimePosition: state.lastTimePosition,
      }),
    }
  )
);

// ============================================
// SELECTORS (for optimized re-renders)
// ============================================

export const selectCurrentTrack = (state: MusicStore) => state.currentTrack;
export const selectIsPlaying = (state: MusicStore) => state.isPlaying;
export const selectVolume = (state: MusicStore) => state.volume;
export const selectProgress = (state: MusicStore) => state.progress;
export const selectDuration = (state: MusicStore) => state.duration;
export const selectCurrentPlaylist = (state: MusicStore) => state.currentPlaylist;
export const selectQueue = (state: MusicStore) => state.queue;
export const selectRecentlyPlayed = (state: MusicStore) => state.recentlyPlayed;
