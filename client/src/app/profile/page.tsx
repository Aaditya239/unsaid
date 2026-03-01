'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    User,
    Mail,
    Calendar,
    Shield,
    Settings,
    ChevronLeft,
    Camera,
    Activity,
    Heart,
    TrendingUp,
    MapPin,
    Clock
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { ThemedPage } from '@/components/themed/ThemedPage';
import { useTheme } from '@/hooks/useTheme';

export default function ProfilePage() {
    return (
        <ProtectedRoute>
            <ProfileContent />
        </ProtectedRoute>
    );
}

function ProfileContent() {
    const router = useRouter();
    const { user } = useAuthStore();
    const t = useTheme();

    if (!user) return null;

    return (
        <ThemedPage className="pb-24 text-white">

            <div className="relative z-10 w-full max-w-[900px] mx-auto px-4 sm:px-6 pt-12">
                <button
                    onClick={() => router.push('/dashboard')}
                    className="flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-8 group"
                >
                    <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span>Back to Dashboard</span>
                </button>

                <div className="bg-white/[0.06] backdrop-blur-[30px] border border-white/[0.08] rounded-[32px] overflow-hidden shadow-2xl">
                    {/* Cover Area */}
                    <div className="h-48 bg-gradient-to-r from-[#4F7CFF]/20 via-[#9C6BFF]/20 to-[#4F7CFF]/20 relative">
                        <div className="absolute inset-0 bg-black/20"></div>
                    </div>

                    <div className="px-8 pb-12 relative">
                        {/* Profile Avatar */}
                        <div className="relative -mt-20 mb-6 flex items-end justify-between">
                            <div className="relative group">
                                <div className="w-40 h-40 rounded-[40px] bg-gradient-to-tr from-[#4F7CFF] to-[#9C6BFF] p-1.5 shadow-2xl">
                                    <div className="w-full h-full rounded-[36px] bg-[#050B14] flex items-center justify-center overflow-hidden">
                                        <User className="w-16 h-16 text-white/80" />
                                    </div>
                                </div>
                                <button className="absolute bottom-2 right-2 w-10 h-10 rounded-2xl bg-[#4F7CFF] border-4 border-[#050B14] flex items-center justify-center hover:scale-110 transition-transform">
                                    <Camera className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex gap-3 mb-2">
                                <button
                                    onClick={() => router.push('/settings')}
                                    className="px-6 py-2.5 rounded-2xl bg-white/[0.06] border border-white/10 hover:bg-white/[0.1] transition-all flex items-center gap-2"
                                >
                                    <Settings className="w-4 h-4" />
                                    <span>Settings</span>
                                </button>
                            </div>
                        </div>

                        {/* Basic Info */}
                        <div className="mb-10">
                            <h1 className="text-4xl font-bold tracking-tight mb-2">
                                {user.firstName} {user.lastName}
                            </h1>
                            <div className="flex flex-wrap gap-4 text-white/50">
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    <span>{user.email}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4" />
                                    <span className="text-blue-400">Verified Account</span>
                                </div>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                            <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 flex flex-col gap-1">
                                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-2">
                                    <Heart className="w-5 h-5 text-blue-400" />
                                </div>
                                <span className="text-2xl font-bold">Safe</span>
                                <span className="text-xs text-white/30 uppercase tracking-widest font-bold">Mental State</span>
                            </div>
                            <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 flex flex-col gap-1">
                                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-2">
                                    <Activity className="w-5 h-5 text-purple-400" />
                                </div>
                                <span className="text-2xl font-bold">Active</span>
                                <span className="text-xs text-white/30 uppercase tracking-widest font-bold">Engagement</span>
                            </div>
                            <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 flex flex-col gap-1">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-2">
                                    <Clock className="w-5 h-5 text-emerald-400" />
                                </div>
                                <span className="text-2xl font-bold">14 Days</span>
                                <span className="text-xs text-white/30 uppercase tracking-widest font-bold">Journal Streak</span>
                            </div>
                        </div>

                        {/* Secondary Sections */}
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold mb-4 px-2 tracking-wide">Account Details</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <DetailItem icon={<Calendar className="w-4 h-4" />} label="Member Since" value="February 2026" />
                                    <DetailItem icon={<Shield className="w-4 h-4" />} label="Security Level" value="Level 2 (Active)" />
                                </div>
                                <div className="space-y-4">
                                    <DetailItem icon={<Activity className="w-4 h-4" />} label="Last Activity" value="Today, 7:15 PM" />
                                    <DetailItem icon={<TrendingUp className="w-4 h-4" />} label="Monthly Goal" value="Daily Reflection" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ThemedPage>
    );
}

function DetailItem({ icon, label, value }: { icon: any, label: string, value: string }) {
    return (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-3">
                <div className="text-white/30">{icon}</div>
                <span className="text-sm text-white/50">{label}</span>
            </div>
            <span className="text-sm font-medium text-white/90">{value}</span>
        </div>
    );
}
