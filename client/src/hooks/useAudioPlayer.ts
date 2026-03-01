// ============================================
// useAudioPlayer Hook
// ============================================
// Central audio controller for Calm Space.
// Handles playback, volume, looping, and transitions.
// ============================================

import { useRef, useState, useCallback, useEffect } from 'react';

interface UseAudioPlayerOptions {
  fadeInDuration?: number;  // ms
  fadeOutDuration?: number; // ms
  initialVolume?: number;   // 0-1
}

interface UseAudioPlayerReturn {
  // State
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isLooping: boolean;
  currentSound: string | null;
  
  // Actions
  play: (soundUrl: string, soundId?: string) => Promise<void>;
  pause: () => void;
  stop: () => void;
  toggle: (soundUrl: string, soundId?: string) => void;
  setVolume: (volume: number) => void;
  setLoop: (loop: boolean) => void;
  fadeOut: () => Promise<void>;
  fadeIn: () => Promise<void>;
}

export const useAudioPlayer = (
  options: UseAudioPlayerOptions = {}
): UseAudioPlayerReturn => {
  const {
    fadeInDuration = 300,
    fadeOutDuration = 300,
    initialVolume = 0.7,
  } = options;

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(initialVolume);
  const [isLooping, setIsLooping] = useState(true);
  const [currentSound, setCurrentSound] = useState<string | null>(null);

  // Cleanup function for fade intervals
  const clearFadeInterval = useCallback(() => {
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
  }, []);

  // Initialize audio element
  const getOrCreateAudio = useCallback((): HTMLAudioElement => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = 'auto';
      
      // Update state on time updates
      audioRef.current.addEventListener('timeupdate', () => {
        setCurrentTime(audioRef.current?.currentTime || 0);
      });
      
      // Update duration when metadata loads
      audioRef.current.addEventListener('loadedmetadata', () => {
        setDuration(audioRef.current?.duration || 0);
      });
      
      // Handle audio ending
      audioRef.current.addEventListener('ended', () => {
        if (!audioRef.current?.loop) {
          setIsPlaying(false);
        }
      });
      
      // Handle load start
      audioRef.current.addEventListener('loadstart', () => {
        setIsLoading(true);
      });
      
      // Handle can play
      audioRef.current.addEventListener('canplay', () => {
        setIsLoading(false);
      });
    }
    return audioRef.current;
  }, []);

  // Fade out volume
  const fadeOut = useCallback(async (): Promise<void> => {
    return new Promise((resolve) => {
      const audio = audioRef.current;
      if (!audio || audio.volume === 0) {
        resolve();
        return;
      }

      clearFadeInterval();
      const startVolume = audio.volume;
      const steps = 20;
      const stepTime = fadeOutDuration / steps;
      const volumeStep = startVolume / steps;
      let currentStep = 0;

      fadeIntervalRef.current = setInterval(() => {
        currentStep++;
        const newVolume = Math.max(0, startVolume - volumeStep * currentStep);
        audio.volume = newVolume;
        setVolumeState(newVolume);

        if (currentStep >= steps) {
          clearFadeInterval();
          audio.pause();
          setIsPlaying(false);
          resolve();
        }
      }, stepTime);
    });
  }, [fadeOutDuration, clearFadeInterval]);

  // Fade in volume
  const fadeIn = useCallback(async (): Promise<void> => {
    return new Promise((resolve) => {
      const audio = audioRef.current;
      if (!audio) {
        resolve();
        return;
      }

      clearFadeInterval();
      audio.volume = 0;
      
      const targetVolume = volume;
      const steps = 20;
      const stepTime = fadeInDuration / steps;
      const volumeStep = targetVolume / steps;
      let currentStep = 0;

      fadeIntervalRef.current = setInterval(() => {
        currentStep++;
        const newVolume = Math.min(targetVolume, volumeStep * currentStep);
        audio.volume = newVolume;

        if (currentStep >= steps) {
          clearFadeInterval();
          setVolumeState(targetVolume);
          resolve();
        }
      }, stepTime);
    });
  }, [fadeInDuration, volume, clearFadeInterval]);

  // Play sound
  const play = useCallback(async (soundUrl: string, soundId?: string): Promise<void> => {
    const audio = getOrCreateAudio();

    // If different sound, load new one
    if (audio.src !== soundUrl) {
      // Fade out current sound if playing
      if (isPlaying) {
        await fadeOut();
      }
      
      audio.src = soundUrl;
      setCurrentSound(soundId || soundUrl);
    }

    audio.loop = isLooping;
    audio.volume = 0;
    
    try {
      await audio.play();
      setIsPlaying(true);
      await fadeIn();
    } catch (error) {
      console.error('Audio playback error:', error);
      setIsPlaying(false);
    }
  }, [getOrCreateAudio, isPlaying, isLooping, fadeOut, fadeIn]);

  // Pause playback
  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      setIsPlaying(false);
    }
  }, []);

  // Stop and reset
  const stop = useCallback(async () => {
    await fadeOut();
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = 0;
      setCurrentTime(0);
    }
    setCurrentSound(null);
  }, [fadeOut]);

  // Toggle playback
  const toggle = useCallback((soundUrl: string, soundId?: string) => {
    if (isPlaying && currentSound === soundId) {
      pause();
    } else {
      play(soundUrl, soundId);
    }
  }, [isPlaying, currentSound, pause, play]);

  // Set volume
  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);
    
    const audio = audioRef.current;
    if (audio) {
      audio.volume = clampedVolume;
    }
  }, []);

  // Set loop mode
  const setLoop = useCallback((loop: boolean) => {
    setIsLooping(loop);
    const audio = audioRef.current;
    if (audio) {
      audio.loop = loop;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearFadeInterval();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, [clearFadeInterval]);

  return {
    isPlaying,
    isLoading,
    currentTime,
    duration,
    volume,
    isLooping,
    currentSound,
    play,
    pause,
    stop,
    toggle,
    setVolume,
    setLoop,
    fadeOut,
    fadeIn,
  };
};

export default useAudioPlayer;