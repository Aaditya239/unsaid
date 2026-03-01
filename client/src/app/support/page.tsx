'use client';

// ============================================
// AI Support Page - Warm Friendly Theme
// ============================================

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useAIStore } from '@/stores/aiStore';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Button from '@/components/ui/Button';
import {
  ArrowLeft,
  Send,
  Sparkles,
  MessageCircle,
  AlertTriangle,
  RefreshCw,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function SupportPage() {
  return (
    <ProtectedRoute>
      <SupportContent />
    </ProtectedRoute>
  );
}

function SupportContent() {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    conversations,
    weeklySummary,
    dailyReflection,
    isLoading,
    isSending,
    isLoadingSummary,
    isLoadingReflection,
    error,
    fetchConversations,
    sendMessage,
    fetchWeeklySummary,
    fetchDailyReflection,
    clearError,
  } = useAIStore();

  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'insights'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch data on mount
  useEffect(() => {
    fetchConversations();
    fetchWeeklySummary();
    fetchDailyReflection();
  }, [fetchConversations, fetchWeeklySummary, fetchDailyReflection]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations]);

  // Handle send message
  const handleSend = async () => {
    if (!message.trim() || isSending) return;
    
    const messageText = message.trim();
    setMessage('');
    
    try {
      await sendMessage(messageText);
    } catch {
      // Error is handled by store
    }
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Character counter
  const charCount = message.length;
  const maxChars = 500;

  return (
    <div className="min-h-screen bg-[#FBF9F7] flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-warm-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 rounded-xl hover:bg-warm-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-warm-500" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-coffee-400 to-coffee-500 flex items-center justify-center shadow-soft">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-warm-900">
                    Emotional Support
                  </h1>
                  <p className="text-xs text-warm-400">Your safe space to reflect</p>
                </div>
              </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('chat')}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-medium transition-all',
                  activeTab === 'chat'
                    ? 'bg-coffee-50 text-coffee-500 border-2 border-coffee-200'
                    : 'text-warm-400 hover:text-warm-600 hover:bg-warm-100'
                )}
              >
                <MessageCircle className="w-4 h-4 inline mr-2" />
                Chat
              </button>
              <button
                onClick={() => setActiveTab('insights')}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-medium transition-all',
                  activeTab === 'insights'
                    ? 'bg-rose-50 text-rose-500 border-2 border-rose-200'
                    : 'text-warm-400 hover:text-warm-600 hover:bg-warm-100'
                )}
              >
                <TrendingUp className="w-4 h-4 inline mr-2" />
                Insights
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 pt-28 pb-4 flex flex-col">
        {activeTab === 'chat' ? (
          <>
            {/* Daily Reflection Card */}
            {dailyReflection && (
              <div className="card p-6 mb-6 border-l-4 border-l-rose-400">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5 text-rose-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-rose-500 mb-1">
                      Today's Reflection
                    </h3>
                    <p className="text-warm-900 mb-2">{dailyReflection.question}</p>
                    <p className="text-sm text-warm-400 italic">
                      {dailyReflection.encouragement}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Banner */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 rounded-2xl p-4 mb-4">
                <AlertTriangle className="w-4 h-4 inline mr-2" />
                {error}
                <button
                  onClick={clearError}
                  className="ml-2 underline text-sm opacity-80 hover:opacity-100"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Chat Messages Area */}
            <div className="flex-1 card p-0 mb-4 overflow-hidden flex flex-col min-h-[400px]">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="w-8 h-8 border-4 border-coffee-200 border-t-coffee-500 rounded-full animate-spin" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-16 h-16 rounded-2xl bg-coffee-100 flex items-center justify-center mb-4">
                      <MessageCircle className="w-8 h-8 text-coffee-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-warm-900 mb-2">
                      Start a Conversation
                    </h3>
                    <p className="text-warm-400 max-w-sm">
                      Share what's on your mind. I'm here to listen and support you
                      through your emotional journey.
                    </p>
                  </div>
                ) : (
                  <>
                    {conversations.map((conv) => (
                      <div key={conv.id} className="space-y-3">
                        {/* User Message */}
                        <div className="flex justify-end">
                          <div className="max-w-[80%] bg-coffee-500 rounded-2xl rounded-tr-md px-4 py-3 shadow-soft">
                            <p className="text-white">{conv.message}</p>
                            <p className="text-xs text-coffee-200 mt-1">
                              {format(new Date(conv.createdAt), 'h:mm a')}
                            </p>
                          </div>
                        </div>
                        
                        {/* AI Response */}
                        <div className="flex justify-start">
                          <div className="max-w-[80%] bg-warm-50 border-2 border-warm-100 rounded-2xl rounded-tl-md px-4 py-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Sparkles className="w-4 h-4 text-rose-500" />
                              <span className="text-xs font-medium text-rose-500">
                                UNSAID Support
                              </span>
                            </div>
                            <p className="text-warm-700 whitespace-pre-wrap">
                              {conv.response}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>
            </div>

            {/* Message Input */}
            <div className="card p-4">
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, maxChars))}
                  onKeyDown={handleKeyDown}
                  placeholder="Share what's on your mind..."
                  rows={3}
                  disabled={isSending}
                  className={cn(
                    'w-full bg-white border-2 border-warm-200 rounded-xl px-4 py-3 pr-24',
                    'text-warm-700 placeholder:text-warm-300 resize-none',
                    'focus:outline-none focus:border-coffee-400',
                    'focus:shadow-[0_0_0_4px_rgba(152,112,112,0.15)]',
                    'transition-all duration-200',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                />
                <div className="absolute bottom-3 right-3 flex items-center gap-3">
                  <span
                    className={cn(
                      'text-xs',
                      charCount > maxChars * 0.9
                        ? 'text-red-500'
                        : 'text-warm-400'
                    )}
                  >
                    {charCount}/{maxChars}
                  </span>
                  <Button
                    onClick={handleSend}
                    disabled={!message.trim() || isSending}
                    size="sm"
                    className="px-3"
                  >
                    {isSending ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-warm-400 mt-2">
                Press Enter to send • Shift+Enter for new line
              </p>
            </div>
          </>
        ) : (
          /* Insights Tab */
          <div className="space-y-6">
            {/* Weekly Summary Card */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-coffee-100 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-coffee-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-warm-900">
                      Weekly Summary
                    </h3>
                    <p className="text-sm text-warm-400">
                      Your emotional patterns this week
                    </p>
                  </div>
                </div>
                <button
                  onClick={fetchWeeklySummary}
                  disabled={isLoadingSummary}
                  className="p-2 rounded-xl hover:bg-warm-100 transition-colors disabled:opacity-50"
                >
                  <RefreshCw
                    className={cn(
                      'w-5 h-5 text-warm-400',
                      isLoadingSummary && 'animate-spin'
                    )}
                  />
                </button>
              </div>

              {isLoadingSummary ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-4 border-coffee-200 border-t-coffee-500 rounded-full animate-spin" />
                </div>
              ) : weeklySummary ? (
                <div className="space-y-6">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="rounded-2xl p-4 text-center bg-coffee-50 border-2 border-coffee-100">
                      <p className="text-2xl font-bold text-coffee-500">
                        {weeklySummary.entryCount}
                      </p>
                      <p className="text-sm text-warm-500">Total Entries</p>
                    </div>
                    <div className="rounded-2xl p-4 text-center bg-rose-50 border-2 border-rose-100">
                      <p className="text-2xl font-bold text-rose-500">
                        {weeklySummary.averageIntensity.toFixed(1)}
                      </p>
                      <p className="text-sm text-warm-500">Avg Intensity</p>
                    </div>
                    <div className="rounded-2xl p-4 text-center bg-blush-50 border-2 border-blush-100 col-span-2 sm:col-span-1">
                      <p className="text-2xl font-bold text-blush-500 capitalize">
                        {weeklySummary.dominantMood?.toLowerCase() || '—'}
                      </p>
                      <p className="text-sm text-warm-500">Dominant Mood</p>
                    </div>
                  </div>

                  {/* Mood Distribution */}
                  {Object.keys(weeklySummary.moodDistribution).length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-warm-500 mb-3">
                        Mood Distribution
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(weeklySummary.moodDistribution).map(
                          ([mood, count]) => (
                            <span
                              key={mood}
                              className="px-3 py-1.5 rounded-full bg-warm-100 border-2 border-warm-200 text-sm"
                            >
                              <span className="text-warm-700 capitalize">
                                {mood.toLowerCase()}
                              </span>
                              <span className="text-coffee-500 ml-2 font-medium">{count}</span>
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* AI Insight */}
                  <div className="bg-gradient-to-br from-coffee-50 to-rose-50 border-2 border-coffee-100 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-coffee-500" />
                      <span className="text-sm font-medium text-coffee-500">
                        AI Insight
                      </span>
                    </div>
                    <p className="text-warm-700 mb-3">
                      {weeklySummary.insightMessage}
                    </p>
                    <p className="text-rose-500 italic text-sm">
                      {weeklySummary.encouragement}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <span className="text-4xl mb-4 block">📊</span>
                  <p className="text-warm-900 font-semibold">No data available yet.</p>
                  <p className="text-sm text-warm-400 mt-1">
                    Start tracking your moods to see insights.
                  </p>
                </div>
              )}
            </div>

            {/* Today's Reflection (larger version for insights tab) */}
            {dailyReflection && (
              <div className="card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-11 h-11 rounded-xl bg-rose-100 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-rose-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-warm-900">
                      Daily Reflection
                    </h3>
                    <p className="text-sm text-warm-400">Take a moment to reflect</p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-rose-50 to-blush-50 border-2 border-rose-100 rounded-2xl p-6">
                  <p className="text-xl text-warm-900 mb-4 leading-relaxed">
                    "{dailyReflection.question}"
                  </p>
                  <p className="text-rose-500 italic">
                    {dailyReflection.encouragement}
                  </p>
                </div>

                <div className="mt-4 flex justify-center">
                  <Button
                    variant="secondary"
                    onClick={() => router.push('/journal/new')}
                  >
                    Write in Journal
                  </Button>
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div className="text-center text-xs text-warm-400 p-4">
              <p>
                UNSAID provides emotional support and reflection tools. It is not a
                substitute for professional mental health care. If you're
                experiencing a crisis, please contact a mental health professional
                or crisis helpline.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
