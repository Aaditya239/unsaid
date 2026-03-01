'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useMoodStore } from '@/stores/moodStore';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { sendEmotionSupportMessage } from '@/lib/ai';
import { ArrowLeft, User, Bell, Sparkles, TrendingUp, Activity, Brain, ArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';

interface Message {
    id: string;
    role: 'user' | 'ai';
    content: string;
}

const ACTION_PILLS = ['Reflect deeper', 'Reframe perspective', 'Ground me', 'Suggest action'];

export default function AISupportPage() {
    return (
        <ProtectedRoute>
            <AISupportContent />
        </ProtectedRoute>
    );
}

function AISupportContent() {
    const router = useRouter();
    const { user, isLoading } = useAuthStore();
    const { stats, fetchStats, entries, fetchEntries } = useMoodStore();
    const t = useTheme();

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'ai',
            content: `Aaditya, I noticed your entries this week reflect some performance pressure. Do you want to explore what's underneath that?` // User explicitly asked for this kind of tone
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/auth/login');
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (user) {
            fetchStats();
            fetchEntries();
        }
    }, [user, fetchStats, fetchEntries]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const handleSend = async () => {
        if (!inputValue.trim() || !user) return;

        const messageText = inputValue.trim();
        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: messageText };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsTyping(true);

        try {
            const aiReply = await sendEmotionSupportMessage(messageText, user.firstName || 'User');

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'ai',
                content: aiReply
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error('Failed to get AI response:', error);
            // Fallback gracefully on UI side
            const fallbackMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'ai',
                content: "I'm having a little trouble connecting right now, but I genuinely want to hear what you have to say. Take a deep breath and we can try again in a moment."
            };
            setMessages(prev => [...prev, fallbackMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    const handlePillClick = async (pill: string) => {
        if (!user) return;
        const messageText = `I'd like to ${pill.toLowerCase()}.`;
        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: messageText };
        setMessages(prev => [...prev, userMsg]);
        setIsTyping(true);

        try {
            const aiReply = await sendEmotionSupportMessage(messageText, user.firstName || 'User');

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'ai',
                content: aiReply
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error('Failed to handle pill context:', error);
            const fallbackMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'ai',
                content: "Take your time. Whenever you're ready, I'll be right here."
            };
            setMessages(prev => [...prev, fallbackMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    if (isLoading || !user) return <div className="min-h-screen" style={t.pageBg}></div>;

    const glassCard = "bg-white/[0.03] backdrop-blur-[18px] border border-white/[0.06] rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.6)]";

    return (
        <div className="min-h-screen font-sans relative flex flex-col items-center text-white xl:overflow-hidden" style={t.pageBg}>
            {/* Background gradient */}
            <div className="fixed inset-0 z-0 pointer-events-none" style={t.bgGradientStyle} />

            {/* Radial glow behind main chat container */}
            <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] z-0 pointer-events-none" style={t.glow1Style} />
            <div className="fixed bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[150px] z-0 pointer-events-none" style={t.glow2Style} />

            {/* Top Navbar */}
            <nav className="relative z-20 sticky top-0 w-full backdrop-blur-xl border-b px-4 md:px-8 py-4 flex items-center justify-between transition-all" style={t.navStyle}>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={t.accentDotStyle} />
                    <span className="text-white font-serif font-semibold tracking-wider text-[18px]">UNSAID</span>
                </div>

                <div className="hidden md:flex items-center gap-2">
                    <span className="text-white/60 hover:text-white hover:bg-white/[0.04] px-3 py-1.5 rounded-md transition-colors text-[14px] font-medium cursor-pointer" onClick={() => router.push('/dashboard')}>Dashboard</span>
                    <span className="text-white/60 hover:text-white hover:bg-white/[0.04] px-3 py-1.5 rounded-md transition-colors text-[14px] font-medium cursor-pointer" onClick={() => router.push('/journal')}>Journal</span>
                    <span className="text-white/60 hover:text-white hover:bg-white/[0.04] px-3 py-1.5 rounded-md transition-colors text-[14px] font-medium cursor-pointer" onClick={() => router.push('/mood')}>Mood</span>
                    <span className="text-white/60 hover:text-white hover:bg-white/[0.04] px-3 py-1.5 rounded-md transition-colors text-[14px] font-medium cursor-pointer" onClick={() => router.push('/calm')}>Focus</span>
                    <span className="border-b px-3 py-1.5 text-[14px] font-medium cursor-pointer" style={t.activeNavStyle}>AI Support</span>
                </div>

                <div className="flex items-center gap-4 sm:gap-6">
                    <button className="text-white/60 hover:text-white transition-colors relative">
                        <Bell className="w-5 h-5" />
                    </button>
                    <div className="w-8 h-8 rounded-full p-[2px] cursor-pointer" style={{ background: `linear-gradient(135deg, ${t.accent}, ${t.accent}99)` }} onClick={() => router.push('/settings')}>
                        <div className="w-full h-full rounded-full flex items-center justify-center" style={{ backgroundColor: t.colors.bgPrimary }}>
                            <User className="w-4 h-4 text-white/80" />
                        </div>
                    </div>
                </div>
            </nav>

            <main className="relative z-10 w-full max-w-6xl px-4 py-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-73px)]">

                {/* Left Col: Main Chat Area */}
                <div className="lg:col-span-8 flex flex-col h-full overscroll-none">

                    {/* Header */}
                    <header className="mb-6">
                        <div className="flex justify-between items-start mb-1">
                            <button onClick={() => router.push('/dashboard')} className="text-white/40 hover:text-white transition-colors flex items-center gap-1.5 text-[14px]">
                                <ArrowLeft className="w-4 h-4" /> Back
                            </button>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"></span>
                                <span className="text-[13px] text-emerald-400/90 font-medium tracking-wide">Personalized Mode Active</span>
                            </div>
                        </div>
                        <h1 className="text-[32px] font-semibold text-white tracking-tight mb-1">AI Emotion Supporter</h1>
                        <p className="text-[15px] text-white/50 font-light">Connected to your emotional patterns.</p>
                    </header>

                    {/* Chat Container */}
                    <div className={`${glassCard} flex-1 flex flex-col overflow-hidden relative`}>

                        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-[20px] scrollbar-hide">

                            {/* Context Panel */}
                            <div className="bg-[#3B82F6]/[0.08] border border-[#3B82F6]/20 rounded-[16px] p-5 mb-4 shadow-[inset_0_0_20px_rgba(59,130,246,0.05)]">
                                <div className="flex items-center gap-2 mb-3">
                                    <Brain className="w-4 h-4 text-[#4F7CFF]" />
                                    <span className="text-[13px] font-semibold tracking-wide text-[#4F7CFF] uppercase">Active Context</span>
                                </div>
                                <p className="text-[14px] text-white/80 leading-relaxed font-light">Based on your recent entries:</p>
                                <ul className="text-[14px] text-white/60 mt-2 space-y-1.5 list-disc list-inside font-light">
                                    <li>Increased anxiety this week</li>
                                    <li>Higher focus on work-related reflections</li>
                                    <li>Mood trending downward slightly over the last 3 days</li>
                                </ul>
                            </div>

                            <AnimatePresence initial={false}>
                                {messages.map((msg, index) => (
                                    <div key={msg.id} className="flex flex-col w-full">
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.25, ease: "easeOut" }}
                                            whileHover={{ y: -2 }}
                                            className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`px-6 py-4 max-w-[80%] select-text transition-transform duration-250 ${msg.role === 'user'
                                                    ? 'bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white rounded-[20px] rounded-br-[4px] shadow-[0_8px_25px_rgba(59,130,246,0.2)]'
                                                    : 'bg-white/[0.04] text-[#E5E7EB] border border-white/[0.05] rounded-[20px] rounded-bl-[4px] shadow-[0_0_25px_rgba(139,92,246,0.15)]'
                                                    }`}
                                            >
                                                <p className="text-[15.5px] leading-[1.6] tracking-wide font-light">{msg.content}</p>
                                            </div>
                                        </motion.div>

                                        {/* Smart Action Buttons (Only show after latest AI message) */}
                                        {msg.role === 'ai' && index === messages.length - 1 && !isTyping && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.3, duration: 0.25 }}
                                                className="flex flex-wrap gap-2 mt-4 ml-2"
                                            >
                                                {ACTION_PILLS.map((pill) => (
                                                    <button
                                                        key={pill}
                                                        onClick={() => handlePillClick(pill)}
                                                        className="px-4 py-2 rounded-full text-[13px] font-medium transition-all duration-200 bg-white/[0.04] border border-white/[0.08] text-white/70 hover:bg-white/[0.08] hover:border-white/[0.2] hover:text-white hover:-translate-y-0.5"
                                                    >
                                                        {pill}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </div>
                                ))}

                                {isTyping && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex w-full justify-start"
                                    >
                                        <div className="px-5 py-4 bg-white/[0.04] border border-white/[0.05] rounded-[20px] rounded-bl-[4px] flex gap-1.5 items-center">
                                            <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.2 }} className="w-1.5 h-1.5 rounded-full bg-white/50" />
                                            <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-white/50" />
                                            <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-white/50" />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <div ref={messagesEndRef} className="h-4" />
                        </div>

                        {/* Input Area */}
                        <div className="p-5 bg-transparent mt-auto relative z-10 border-t border-white/[0.02]">
                            <div className="flex items-center gap-3 bg-white/[0.04] backdrop-blur-md border border-white/[0.08] rounded-[30px] p-1.5 pl-6 focus-within:ring-1 focus-within:ring-[#3B82F6]/50 focus-within:border-[#3B82F6]/50 transition-all duration-300">
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Share your thoughts..."
                                    className="flex-1 bg-transparent border-none outline-none text-[15.5px] text-white placeholder:text-white/30 font-light"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!inputValue.trim()}
                                    className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 ${inputValue.trim()
                                        ? 'bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white shadow-[0_4px_15px_rgba(59,130,246,0.3)]'
                                        : 'bg-white/[0.05] text-white/20 cursor-not-allowed border border-white/[0.05]'
                                        }`}
                                >
                                    <ArrowUp className="w-5 h-5 stroke-[2.5px]" />
                                </button>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Right Col: Live Insights Sidebar */}
                <div className="hidden lg:flex lg:col-span-4 flex-col gap-6 pt-[88px]">
                    <h2 className="text-[18px] font-medium text-white mb-1">Live Emotional Insight</h2>

                    <div className={`${glassCard} p-5 hover:bg-white/[0.04] transition-colors group cursor-default`}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#3B82F6]/20 to-[#8B5CF6]/20 border border-white/[0.1] flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-[#8B5CF6]" />
                            </div>
                            <div>
                                <p className="text-[13px] text-white/40 uppercase tracking-wide font-medium">Dominant Emotion</p>
                                <p className="text-[18px] text-white font-medium capitalize">{stats?.mostFrequentMood?.toLowerCase() || 'Anxious'}</p>
                            </div>
                        </div>
                        <p className="text-[13px] text-white/50 leading-relaxed font-light">Your interactions suggest a heightened state of alertness mixed with underlying stress factors.</p>
                    </div>

                    <div className={`${glassCard} p-5 hover:bg-white/[0.04] transition-colors group cursor-default`}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-white/[0.05] border border-white/[0.1] flex items-center justify-center">
                                <Activity className="w-5 h-5 text-[#3B82F6]" />
                            </div>
                            <div>
                                <p className="text-[13px] text-white/40 uppercase tracking-wide font-medium">Weekly Pattern</p>
                                <p className="text-[18px] text-white font-medium capitalize">Fluctuating</p>
                            </div>
                        </div>
                        <div className="flex items-end gap-1 h-10 mb-2">
                            {[4, 7, 5, 8, 4, 9, 6].map((h, i) => (
                                <div key={i} className="flex-1 bg-white/[0.08] rounded-t-sm" style={{ height: `${h * 10}%` }}>
                                    <div className="w-full h-full bg-gradient-to-t from-[#3B82F6]/50 to-[#8B5CF6]/50 rounded-t-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                </div>
                            ))}
                        </div>
                        <p className="text-[13px] text-white/50 leading-relaxed font-light">Peaks typically occur mid-week aligned with focus sessions.</p>
                    </div>

                    <div className={`${glassCard} p-5 hover:bg-white/[0.04] transition-colors group cursor-default`}>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-full bg-white/[0.05] border border-white/[0.1] flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-[13px] text-white/40 uppercase tracking-wide font-medium">Intensity Trend</p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-[24px] text-white font-medium">{stats?.averageIntensity ? stats.averageIntensity.toFixed(1) : '6.4'}</p>
                                    <span className="text-[13px] text-white/30">/10</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

            </main>
        </div>
    );
}
