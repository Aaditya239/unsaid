'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, ArrowRight, Loader2, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Invalid or missing reset token.');
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;

        if (formData.newPassword !== formData.confirmPassword) {
            setStatus('error');
            setMessage('Passwords do not match.');
            return;
        }

        if (formData.newPassword.length < 8) {
            setStatus('error');
            setMessage('Password must be at least 8 characters long.');
            return;
        }

        setIsLoading(true);
        setStatus('idle');
        setMessage('');

        try {
            const response = await api.post('/auth/reset-password', {
                token,
                newPassword: formData.newPassword,
                confirmPassword: formData.confirmPassword,
            });
            setStatus('success');
            setMessage(response.data.message || 'Password reset successful!');

            // Auto redirect to login after 3 seconds
            setTimeout(() => {
                router.push('/auth/login');
            }, 3000);
        } catch (err: any) {
            setStatus('error');
            setMessage(err.response?.data?.message || 'Something went wrong. Link might be expired.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!token && status !== 'success') {
        return (
            <div className="space-y-6 text-center">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-2xl font-serif text-white">Invalid Link</h1>
                    <p className="text-softwhite/50 text-sm">The password reset link is invalid or has expired.</p>
                </div>
                <Link
                    href="/auth/forgot-password"
                    className="inline-flex items-center justify-center w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white font-medium transition-all"
                >
                    Request a new link
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="space-y-3">
                <h1 className="text-3xl font-serif text-white tracking-tight leading-tight">
                    Create <br /><span className="text-electric italic">new password</span>
                </h1>
                <p className="text-softwhite/50 text-sm leading-relaxed max-w-[280px]">
                    Enter your new password below. Make sure it's secure.
                </p>
            </div>

            <AnimatePresence mode="wait">
                {status === 'success' ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 space-y-6 text-center"
                    >
                        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-lg font-medium text-white">Success!</p>
                            <p className="text-sm text-emerald-400/80 leading-relaxed">
                                {message}
                            </p>
                        </div>
                        <div className="pt-2 text-xs text-softwhite/30 italic">
                            Redirecting to login...
                        </div>
                    </motion.div>
                ) : (
                    <motion.form
                        key="reset-form"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onSubmit={handleSubmit}
                        className="space-y-6"
                    >
                        <div className="space-y-5">
                            {/* New Password */}
                            <div className="space-y-2 group">
                                <label className="block text-xs font-medium text-softwhite/40 tracking-widest uppercase ml-1">
                                    New Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-softwhite/20 group-focus-within:text-electric/40 transition-colors">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="password"
                                        value={formData.newPassword}
                                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                        className="block w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-white/10 rounded-2xl text-white placeholder:text-softwhite/20 focus:outline-none focus:ring-2 focus:ring-electric/30 transition-all text-base"
                                        placeholder="Minimal 8 characters"
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-2 group">
                                <label className="block text-xs font-medium text-softwhite/40 tracking-widest uppercase ml-1">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-softwhite/20 group-focus-within:text-electric/40 transition-colors">
                                        <ShieldCheck className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        className="block w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-white/10 rounded-2xl text-white placeholder:text-softwhite/20 focus:outline-none focus:ring-2 focus:ring-electric/30 transition-all text-base"
                                        placeholder="Repeat new password"
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                        </div>

                        {status === 'error' && (
                            <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2 text-red-400 text-sm pl-1 font-medium bg-red-400/5 p-3 rounded-lg border border-red-400/10"
                            >
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{message}</span>
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-electric hover:bg-electric-light disabled:bg-electric/50 text-white font-semibold py-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 group shadow-lg shadow-electric/20 active:scale-[0.98]"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Updating Password...
                                </>
                            ) : (
                                <>
                                    Reset Password
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </motion.form>
                )}
            </AnimatePresence>
        </div>
    );
}
