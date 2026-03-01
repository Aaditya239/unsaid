// ============================================
// useTimer Hook
// ============================================
// Timer logic for Calm Space including
// countdown, pause/resume, and Focus Mode (Pomodoro).
// ============================================

import { useState, useCallback, useRef, useEffect } from 'react';

type TimerState = 'idle' | 'running' | 'paused' | 'completed';
type FocusPhase = 'work' | 'break' | null;

interface UseTimerOptions {
  onComplete?: () => void;
  onPhaseChange?: (phase: FocusPhase) => void;
}

interface UseTimerReturn {
  // State
  timeRemaining: number;
  totalTime: number;
  progress: number;
  state: TimerState;
  focusPhase: FocusPhase;
  currentCycle: number;
  
  // Actions
  start: (duration: number) => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  setDuration: (duration: number) => void;
  
  // Focus Mode
  startFocusMode: (workDuration?: number, breakDuration?: number, cycles?: number) => void;
  stopFocusMode: () => void;
  
  // Calculated values
  minutes: number;
  seconds: number;
  formattedTime: string;
}

export const useTimer = (options: UseTimerOptions = {}): UseTimerReturn => {
  const { onComplete, onPhaseChange } = options;

  // State
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [state, setState] = useState<TimerState>('idle');
  const [focusPhase, setFocusPhase] = useState<FocusPhase>(null);
  const [currentCycle, setCurrentCycle] = useState(0);

  // Focus mode config
  const focusConfigRef = useRef<{
    workDuration: number;
    breakDuration: number;
    totalCycles: number;
  } | null>(null);

  // Interval ref
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clear interval helper
  const clearTimerInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Handle phase completion in Focus Mode
  const handleFocusPhaseComplete = useCallback(() => {
    const config = focusConfigRef.current;
    if (!config) return;

    if (focusPhase === 'work') {
      // Work phase completed, start break
      setFocusPhase('break');
      onPhaseChange?.('break');
      setTimeRemaining(config.breakDuration * 60);
      setTotalTime(config.breakDuration * 60);
      setState('running');
    } else if (focusPhase === 'break') {
      // Break completed, check cycles
      const nextCycle = currentCycle + 1;
      
      if (nextCycle >= config.totalCycles) {
        // All cycles completed
        setState('completed');
        setFocusPhase(null);
        focusConfigRef.current = null;
        onComplete?.();
      } else {
        // Start next work phase
        setCurrentCycle(nextCycle);
        setFocusPhase('work');
        onPhaseChange?.('work');
        setTimeRemaining(config.workDuration * 60);
        setTotalTime(config.workDuration * 60);
        setState('running');
      }
    }
  }, [focusPhase, currentCycle, onComplete, onPhaseChange]);

  // Timer tick logic
  useEffect(() => {
    if (state !== 'running') return;

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearTimerInterval();
          
          if (focusPhase) {
            // Focus mode - handle phase transition
            handleFocusPhaseComplete();
          } else {
            // Regular timer completed
            setState('completed');
            onComplete?.();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearTimerInterval();
  }, [state, focusPhase, clearTimerInterval, handleFocusPhaseComplete, onComplete]);

  // Start timer
  const start = useCallback((duration: number) => {
    clearTimerInterval();
    const durationInSeconds = duration * 60;
    setTimeRemaining(durationInSeconds);
    setTotalTime(durationInSeconds);
    setState('running');
    setFocusPhase(null);
    focusConfigRef.current = null;
    setCurrentCycle(0);
  }, [clearTimerInterval]);

  // Pause timer
  const pause = useCallback(() => {
    if (state === 'running') {
      clearTimerInterval();
      setState('paused');
    }
  }, [state, clearTimerInterval]);

  // Resume timer
  const resume = useCallback(() => {
    if (state === 'paused') {
      setState('running');
    }
  }, [state]);

  // Reset timer
  const reset = useCallback(() => {
    clearTimerInterval();
    setTimeRemaining(0);
    setTotalTime(0);
    setState('idle');
    setFocusPhase(null);
    focusConfigRef.current = null;
    setCurrentCycle(0);
  }, [clearTimerInterval]);

  // Set duration without starting
  const setDuration = useCallback((duration: number) => {
    const durationInSeconds = duration * 60;
    setTimeRemaining(durationInSeconds);
    setTotalTime(durationInSeconds);
  }, []);

  // Start Focus Mode (Pomodoro)
  const startFocusMode = useCallback((
    workDuration = 25,
    breakDuration = 5,
    cycles = 4
  ) => {
    clearTimerInterval();
    
    focusConfigRef.current = {
      workDuration,
      breakDuration,
      totalCycles: cycles,
    };
    
    setCurrentCycle(0);
    setFocusPhase('work');
    onPhaseChange?.('work');
    setTimeRemaining(workDuration * 60);
    setTotalTime(workDuration * 60);
    setState('running');
  }, [clearTimerInterval, onPhaseChange]);

  // Stop Focus Mode
  const stopFocusMode = useCallback(() => {
    reset();
    setFocusPhase(null);
    focusConfigRef.current = null;
  }, [reset]);

  // Calculated values
  const progress = totalTime > 0 ? ((totalTime - timeRemaining) / totalTime) * 100 : 0;
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimerInterval();
  }, [clearTimerInterval]);

  return {
    timeRemaining,
    totalTime,
    progress,
    state,
    focusPhase,
    currentCycle,
    start,
    pause,
    resume,
    reset,
    setDuration,
    startFocusMode,
    stopFocusMode,
    minutes,
    seconds,
    formattedTime,
  };
};

export default useTimer;