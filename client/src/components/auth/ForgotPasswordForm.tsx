'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';

export default function ForgotPasswordForm() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setStatus('idle');
        setMessage('');

        try {
            const response = await api.post('/auth/forgot-password', { email });
            setStatus('success');
            setMessage(response.data.message || 'Reset link sent! Check your inbox.');
        } catch (err: any) {
            setStatus('error');
            setMessage(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="space-y-3">
                <h1 className="text-3xl font-serif text-white tracking-tight leading-tight">
                    Forgot your <br /><span className="text-electric italic">password?</span>
                </h1>
                <p className="text-softwhite/50 text-sm leading-relaxed max-w-[280px]">
                    Enter your email and we'll send you a secure link to reset it.
                </p>
            </div>

            <AnimatePresence mode="wait">
                {status === 'success' ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 space-y-4"
                    >
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-6 h-6 shrink-0" />
                            <p className="font-medium">Check your inbox</p>
                        </div>
                        <p className="text-sm text-emerald-400/80 leading-relaxed">
                            {message}
                        </p>
                        <Link
                            href="/auth/login"
                            className="flex items-center gap-2 text-sm font-medium hover:text-emerald-300 transition-colors pt-2"
                        >
                            Back to Sign In <ArrowRight className="w-4 h-4" />
                        </Link>
                    </motion.div>
                ) : (
                    <motion.form
                        key="forgot-form"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onSubmit={handleSubmit}
                        className="space-y-6"
                    >
                        <div className="space-y-2 group">
                            <label htmlFor="email" className="block text-xs font-medium text-softwhite/40 tracking-widest uppercase ml-1 transition-colors group-focus-within:text-electric/60">
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-softwhite/20 group-focus-within:text-electric/40 transition-colors">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-white/10 rounded-2xl text-white placeholder:text-softwhite/20 focus:outline-none focus:ring-2 focus:ring-electric/30 focus:border-electric/30 transition-all text-base"
                                    placeholder="name@example.com"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        {status === 'error' && (
                            <motion.p
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="text-red-400 text-sm pl-1 font-medium"
                            >
                                {message}
                            </motion.p>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-electric hover:bg-electric-light disabled:bg-electric/50 text-white font-semibold py-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 group shadow-lg shadow-electric/20 active:scale-[0.98]"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Sending Link...
                                </>
                            ) : (
                                <>
                                    Send Reset Link
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>

                        <div className="text-center">
                            <Link href="/auth/login" className="text-sm text-softwhite/40 hover:text-white transition-colors tracking-wide">
                                Already remember your password? <span className="text-softwhite/60 font-medium">Log In</span>
                            </Link>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>
        </div>
    );
}
