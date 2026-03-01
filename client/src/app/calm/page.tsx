'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  User,
  Search,
  Bell,
  Zap,
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

import { useAuthStore } from '@/stores/authStore';
import { useYouTubeStore } from '@/stores/youtubeStore';
import { useTimer } from '@/hooks/useTimer';
import { TIMER_PRESETS } from '@/lib/calm';
import {
  TimerDisplay,
  AmbientParticles,
} from '@/components/calm';
import { FocusMusicProvider, useFocusMusic } from '@/context/FocusMusicContext';
import { FocusMusicPlayer, FocusMiniPlayer } from '@/components/focus';
import { cn } from '@/lib/utils';

function CalmPageContent() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const { isPlaying: isFocusMusicPlaying, stopAll: stopFocusMusic } = useFocusMusic();

  const [selectedDuration, setSelectedDuration] = useState(15);
  const [focusMode, setFocusMode] = useState(false);

  const { isPlaying: isYouTubePlaying } = useYouTubeStore();

  const combinedIsPlaying = isFocusMusicPlaying || isYouTubePlaying;

  const handleTimerComplete = useCallback(async () => {
    stopFocusMusic();
    useYouTubeStore.getState().setIsPlaying(false);
  }, [stopFocusMusic]);

  const handlePhaseChange = useCallback((phase: 'work' | 'break' | null) => {
    console.log('Phase changed to:', phase);
  }, []);

  const timer = useTimer({
    onComplete: handleTimerComplete,
    onPhaseChange: handlePhaseChange,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  const handleStartTimer = useCallback(() => {
    timer.start(selectedDuration);
  }, [timer, selectedDuration]);

  const t = useTheme();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={t.pageBg}>
        <motion.div
          className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  return (
      <div className="min-h-screen font-sans pb-36 relative overflow-hidden text-[#F8FAFC]" style={t.pageBg}>
        {/* Background effects */}
        <div className="absolute inset-0 z-0 pointer-events-none" style={t.bgGradientStyle}></div>

        {/* Glow areas */}
        <div
          className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] z-0 pointer-events-none"
          style={t.glow1Style}
        ></div>
        <div
          className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[150px] z-0 pointer-events-none"
          style={t.glow2Style}
        ></div>

        <div className="absolute inset-0 bg-black/40 mix-blend-overlay z-0 pointer-events-none"></div>

        <AmbientParticles />

        <div className="relative z-10 w-full max-w-[1200px] mx-auto px-4 sm:px-6 pt-12 pb-12 animate-fade-in-up">
          {/* Main Dashboard Container */}
          <div className="bg-white/[0.06] backdrop-blur-[25px] border border-white/[0.08] rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.4)] overflow-hidden">

            {/* Internal Navbar */}
            <nav className="sticky top-0 z-20 backdrop-blur-md border-b px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-between" style={t.navStyle}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={t.accentDotStyle}></div>
                <span className="text-white font-serif font-semibold tracking-wider text-[16px] sm:text-[18px]">UNSAID</span>
              </div>

              <div className="hidden md:flex items-center gap-2">
                <span className="text-white/60 hover:text-white hover:bg-white/[0.04] px-3 py-1.5 rounded-md transition-colors text-[14px] font-medium cursor-pointer" onClick={() => router.push('/dashboard')}>Dashboard</span>
                <span className="text-white/60 hover:text-white hover:bg-white/[0.04] px-3 py-1.5 rounded-md transition-colors text-[14px] font-medium cursor-pointer" onClick={() => router.push('/journal')}>Journal</span>
                <span className="text-white/60 hover:text-white hover:bg-white/[0.04] px-3 py-1.5 rounded-md transition-colors text-[14px] font-medium cursor-pointer" onClick={() => router.push('/mood')}>Mood</span>
                <span style={t.activeNavStyle} className="border-b px-3 py-1.5 text-[14px] font-medium cursor-pointer">Focus</span>
                <span className="text-white/60 hover:text-white hover:bg-white/[0.04] px-3 py-1.5 rounded-md transition-colors text-[14px] font-medium cursor-pointer" onClick={() => router.push('/ai-support')}>AI Support</span>
              </div>

              <div className="flex items-center gap-3 sm:gap-6">
                <div className="hidden lg:flex items-center bg-black/20 border border-white/5 rounded-full px-4 py-1.5 backdrop-blur-sm focus-within:border-[#4F7CFF]/50 transition-colors">
                  <Search className="w-4 h-4 text-white/40 mr-2" />
                  <input type="text" placeholder="Search..." className="bg-transparent text-white text-[13px] placeholder:text-white/30 focus:outline-none w-24" />
                </div>
                <button className="text-white/60 hover:text-white transition-colors relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-[#9C6BFF]"></span>
                </button>
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#4F7CFF] to-[#9C6BFF] p-[2px] cursor-pointer" onClick={() => router.push('/profile')}>
                  <div className="w-full h-full rounded-full bg-[#050B14] flex items-center justify-center">
                    <User className="w-4 h-4 text-white/80" />
                  </div>
                </div>
              </div>
            </nav>

            <div className="p-4 sm:p-6 md:p-8">
              {/* Header */}
              <header className="mb-6 sm:mb-10">
                <h1 className="text-[24px] sm:text-[32px] font-semibold text-[#F8FAFC] tracking-tight mb-1">Calm Space</h1>
                <p className="text-[14px] sm:text-[15px] text-white/50 font-light">A quiet space for focus and relaxation.</p>
              </header>

              {/* Music Library */}
              <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-12"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-[20px] font-medium text-[#F8FAFC]">Music</h2>
                </div>

                <FocusMusicPlayer />
              </motion.section>

              {/* Timer Section */}
              <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-12"
              >
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-[20px] font-medium text-[#F8FAFC]">Timer</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-4 sm:gap-6">
                  <div className="p-4 sm:p-6 md:p-8 rounded-[20px] sm:rounded-[24px] bg-white/[0.03] backdrop-blur-[20px] border border-white/[0.08] shadow-[0_20px_40px_rgba(0,0,0,0.45)] flex items-center justify-center min-h-[250px] sm:min-h-[300px]">
                    <TimerDisplay
                      formattedTime={timer.formattedTime}
                      progress={timer.progress}
                      state={timer.state}
                      focusPhase={timer.focusPhase}
                      currentCycle={timer.currentCycle}
                      onStart={handleStartTimer}
                      onPause={timer.pause}
                      onResume={timer.resume}
                      onReset={timer.reset}
                      isAudioPlaying={combinedIsPlaying}
                    />
                  </div>

                  <div className="space-y-4 sm:space-y-6">
                    <div className="p-4 sm:p-6 md:p-8 rounded-[20px] sm:rounded-[24px] bg-white/[0.03] backdrop-blur-[20px] border border-white/[0.08] shadow-[0_20px_40px_rgba(0,0,0,0.45)] h-full">
                      <h4 className="text-[15px] sm:text-[16px] font-medium text-white/90 mb-4 sm:mb-5">Duration</h4>
                      <div className="flex flex-wrap gap-2 sm:gap-3">
                        {TIMER_PRESETS.map((preset) => (
                          <button
                            key={preset.value}
                            onClick={() => {
                              setSelectedDuration(preset.value);
                              setFocusMode(false);
                            }}
                            className={cn(
                              'px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-[13px] sm:text-[14px] font-medium transition-all duration-200 border',
                              selectedDuration === preset.value && !focusMode
                                ? 'bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white border-transparent shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                                : 'bg-white/[0.03] text-white/70 border-white/[0.08] hover:bg-white/[0.08]'
                            )}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>

                      <div className="mt-6 sm:mt-10 pt-6 sm:pt-8 border-t border-white/[0.08]">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2 text-[#F8FAFC]">
                            <Zap className="w-4 h-4 text-[#8B5CF6]" />
                            <h4 className="text-[15px] sm:text-[16px] font-medium">Focus Mode</h4>
                          </div>
                          <button
                            onClick={() => setFocusMode(!focusMode)}
                            className={cn(
                              'px-3 sm:px-4 py-1.5 rounded-full text-[12px] sm:text-[13px] font-medium transition-all duration-200',
                              focusMode
                                ? 'bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                                : 'bg-white/[0.05] text-white/60 hover:bg-white/[0.1] hover:text-white'
                            )}
                          >
                            {focusMode ? 'Active' : 'Enable'}
                          </button>
                        </div>
                        <p className="text-[13px] sm:text-[14px] text-white/50 font-light">
                          25 min focus + 5 min break × 4 cycles. Sound plays during focus.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.section>
            </div>
          </div>
        </div>

        {/* Focus Mini Player - Bottom Sticky */}
        <FocusMiniPlayer />
      </div>
  );
}

export default function CalmPage() {
  return (
    <FocusMusicProvider>
      <CalmPageContent />
    </FocusMusicProvider>
  );
}