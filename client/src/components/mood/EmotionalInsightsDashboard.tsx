'use client';

import { Sparkles, TrendingUp, Activity } from 'lucide-react';
import { useMoodStore } from '@/stores/moodStore';

export default function EmotionalInsightsDashboard() {
  const { emotionalAnalysis, isLoadingAnalysis } = useMoodStore();

  const glassCard = "bg-white/[0.03] backdrop-blur-[24px] border border-white/[0.06] rounded-[24px] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)]";

  if (isLoadingAnalysis) {
    return (
      <div className="space-y-6">
        <div className="h-40 w-full animate-pulse bg-white/5 rounded-[24px]"></div>
        <div className="h-28 w-full animate-pulse bg-white/5 rounded-[24px]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className={`${glassCard} bg-gradient-to-br from-white/5 to-transparent border-white/10 relative overflow-hidden`}>
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Sparkles className="w-16 h-16" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-[#8B5CF6]/20 flex items-center justify-center border border-[#8B5CF6]/30">
              <Activity className="w-5 h-5 text-[#8B5CF6]" />
            </div>
            <h3 className="text-[18px] font-medium text-white">Your Emotional Rhythm</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-4">
              <p className="text-[20px] text-white/90 leading-relaxed font-light font-serif italic">
                "{emotionalAnalysis?.insightSentence || 'Patterns are still forming. Consistency is the first step to clarity.'}"
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {emotionalAnalysis?.supportiveSentences?.map((sentence, index) => (
                  <span key={index} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[13px] text-white/50">
                    {sentence}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col justify-center items-center md:items-end border-l border-white/5 md:pl-8">
              <span className="text-[12px] text-white/30 uppercase tracking-widest mb-1">Weekly Status</span>
              <span className="text-[28px] font-medium text-white">{emotionalAnalysis?.moodShiftTrend || 'Steady'}</span>
              <span className="text-[14px] text-emerald-400 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Improving flow
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#4F7CFF]/10 border border-[#4F7CFF]/20 rounded-[24px] p-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(79,124,255,0.4)]">
          <Sparkles className="w-7 h-7 text-[#4F7CFF]" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h4 className="text-[16px] font-semibold text-white mb-1">A gentle thought for today</h4>
          <p className="text-[14px] text-white/60 leading-relaxed italic font-serif">
            "{emotionalAnalysis?.suggestion || 'Take five minutes today to just be. No goals, no tasks, just breath.'}"
          </p>
        </div>
      </section>
    </div>
  );
}
