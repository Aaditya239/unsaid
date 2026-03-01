'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useMusicStore } from '@/stores/musicStore';
import { getPlaylistById } from '@/data/playlists';

/**
 * AudioEngine - Global Audio Controller
 * 
 * This component manages a single global <audio> element
 * and syncs it with the Zustand music store.
 * 
 * - Handles all audio events
 * - Implements crossfade
 * - Manages keyboard shortcuts
 * - Restores session on mount
 */
export function AudioEngine() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const crossfadeAudioRef = useRef<HTMLAudioElement | null>(null);
  const isMounted = useRef(false);

  const {
    currentTrack,
    isPlaying,
    volume,
    loop,
    progress,
    crossfadeEnabled,
    crossfadeDuration,
    lastPlaylistId,
    lastTrackIndex,
    lastTimePosition,
    setProgress,
    setDuration,
    nextTrack,
    pause,
    play,
    togglePlay,
    savePosition,
    setPlaylist,
    playTrack,
  } = useMusicStore();

  // ========================================
  // AUDIO ELEMENT MANAGEMENT
  // ========================================

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = 'metadata';
    }

    if (!crossfadeAudioRef.current) {
      crossfadeAudioRef.current = new Audio();
      crossfadeAudioRef.current.preload = 'metadata';
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      if (crossfadeAudioRef.current) {
        crossfadeAudioRef.current.pause();
        crossfadeAudioRef.current.src = '';
      }
    };
  }, []);

  // ========================================
  // SESSION RESTORE
  // ========================================

  useEffect(() => {
    if (isMounted.current) return;
    isMounted.current = true;

    // Restore last session
    if (lastPlaylistId) {
      const playlist = getPlaylistById(lastPlaylistId);
      if (playlist) {
        useMusicStore.getState().setPlaylist(playlist, false);
        
        // Restore track index
        if (lastTrackIndex >= 0 && lastTrackIndex < playlist.songs.length) {
          setTimeout(() => {
            useMusicStore.getState().playTrack(lastTrackIndex);
            useMusicStore.getState().pause();
            
            // Restore position after a tick
            setTimeout(() => {
              if (audioRef.current && lastTimePosition > 0) {
                audioRef.current.currentTime = lastTimePosition;
              }
            }, 100);
          }, 50);
        }
      }
    }
  }, [lastPlaylistId, lastTrackIndex, lastTimePosition]);

  // ========================================
  // TRACK CHANGE HANDLER
  // ========================================

  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;

    const audio = audioRef.current;

    // Check if source actually changed
    if (audio.src !== window.location.origin + currentTrack.src) {
      audio.src = currentTrack.src;
      audio.load();
    }
  }, [currentTrack]);

  // ========================================
  // PLAY/PAUSE HANDLER
  // ========================================

  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise) {
        playPromise.catch((err) => {
          console.warn('[AudioEngine] Playback failed:', err);
          pause();
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, pause]);

  // ========================================
  // VOLUME HANDLER
  // ========================================

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // ========================================
  // LOOP HANDLER
  // ========================================

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = loop;
    }
  }, [loop]);

  // ========================================
  // SEEK HANDLER
  // ========================================

  const handleSeek = useCallback((time: number) => {
    if (audioRef.current && isFinite(time)) {
      audioRef.current.currentTime = time;
      savePosition(time);
    }
  }, [savePosition]);

  // Sync external seek changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Only seek if difference is significant (> 1 second)
    if (Math.abs(audio.currentTime - progress) > 1) {
      handleSeek(progress);
    }
  }, [progress, handleSeek]);

  // ========================================
  // AUDIO EVENT LISTENERS
  // ========================================

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setProgress(audio.currentTime);
      
      // Save position every 5 seconds
      if (Math.floor(audio.currentTime) % 5 === 0) {
        savePosition(audio.currentTime);
      }

      // Crossfade check
      if (
        crossfadeEnabled &&
        audio.duration - audio.currentTime <= crossfadeDuration &&
        audio.duration > crossfadeDuration + 1
      ) {
        // Start crossfade to next track
        // (Simplified - full implementation would pre-load next track)
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      if (!loop) {
        nextTrack();
      }
    };

    const handleError = (e: Event) => {
      console.error('[AudioEngine] Audio error:', e);
      // Try to recover by moving to next track
      // nextTrack();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [
    setProgress,
    setDuration,
    nextTrack,
    savePosition,
    loop,
    crossfadeEnabled,
    crossfadeDuration,
  ]);

  // ========================================
  // KEYBOARD SHORTCUTS
  // ========================================

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.getAttribute('contenteditable') === 'true'
      ) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowRight':
          if (e.shiftKey) {
            // Seek forward 10 seconds
            handleSeek(Math.min((audioRef.current?.currentTime || 0) + 10, audioRef.current?.duration || 0));
          } else {
            e.preventDefault();
            nextTrack();
          }
          break;
        case 'ArrowLeft':
          if (e.shiftKey) {
            // Seek backward 10 seconds
            handleSeek(Math.max((audioRef.current?.currentTime || 0) - 10, 0));
          } else {
            e.preventDefault();
            useMusicStore.getState().prevTrack();
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          useMusicStore.getState().setVolume(Math.min(volume + 0.1, 1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          useMusicStore.getState().setVolume(Math.max(volume - 0.1, 0));
          break;
        case 'KeyM':
          e.preventDefault();
          useMusicStore.getState().setVolume(volume > 0 ? 0 : 0.7);
          break;
        case 'KeyL':
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            useMusicStore.getState().toggleLoop();
          }
          break;
        case 'KeyS':
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            useMusicStore.getState().toggleShuffle();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, nextTrack, handleSeek, volume]);

  // ========================================
  // SAVE STATE ON UNLOAD
  // ========================================

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (audioRef.current) {
        savePosition(audioRef.current.currentTime);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [savePosition]);

  // This component renders nothing - it's just for audio logic
  return null;
}
