'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    Bell,
    User,
    Shield,
    ArrowLeft,
    ChevronRight,
    LogOut,
    Moon,
    Lock,
    Camera,
    Save,
    CheckCircle2,
    Palette,
    X
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { ThemedPage, ThemedNav } from '@/components/themed/ThemedPage';

const AVATAR_OPTIONS = [
    { id: 'gradient-1', bg: 'from-[#4F7CFF] to-[#9C6BFF]' },
    { id: 'gradient-2', bg: 'from-[#F472B6] to-[#9C6BFF]' },
    { id: 'gradient-3', bg: 'from-[#34D399] to-[#3B82F6]' },
    { id: 'gradient-4', bg: 'from-[#FBBF24] to-[#F97316]' },
    { id: 'gradient-5', bg: 'from-[#EC4899] to-[#EF4444]' },
    { id: 'gradient-6', bg: 'from-[#8B5CF6] to-[#06B6D4]' },
    { id: 'gradient-7', bg: 'from-[#10B981] to-[#84CC16]' },
    { id: 'gradient-8', bg: 'from-[#6366F1] to-[#A855F7]' },
];

const AVATAR_EMOJIS = ['😊', '🌙', '🦋', '🌸', '🔮', '🌿', '✨', '🎵'];

export default function SettingsPage() {
    return (
        <ProtectedRoute>
            <SettingsContent />
        </ProtectedRoute>
    );
}

function SettingsContent() {
    const router = useRouter();
    const { logout, user } = useAuthStore();

    const [firstName, setFirstName] = useState(user?.firstName || '');
    const [lastName, setLastName] = useState(user?.lastName || '');
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [showAvatarPicker, setShowAvatarPicker] = useState(false);
    const [selectedAvatar, setSelectedAvatar] = useState(
        () => localStorage.getItem('unsaid-avatar') || 'gradient-1'
    );
    const [selectedEmoji, setSelectedEmoji] = useState(
        () => localStorage.getItem('unsaid-avatar-emoji') || ''
    );
    const [profileImage, setProfileImage] = useState<string | null>(
        () => localStorage.getItem('unsaid-profile-image')
    );
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSaveName = async () => {
        setIsSaving(true);
        setSaveStatus('idle');
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/profile`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ firstName, lastName })
            });
            if (res.ok) {
                setSaveStatus('success');
                setTimeout(() => setSaveStatus('idle'), 3000);
            } else {
                setSaveStatus('error');
            }
        } catch {
            setSaveStatus('error');
        }
        setIsSaving(false);
    };

    const handleAvatarSelect = (avatarId: string, emoji?: string) => {
        setSelectedAvatar(avatarId);
        localStorage.setItem('unsaid-avatar', avatarId);
        if (emoji) {
            setSelectedEmoji(emoji);
            localStorage.setItem('unsaid-avatar-emoji', emoji);
        }
        setProfileImage(null);
        localStorage.removeItem('unsaid-profile-image');
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const dataUrl = ev.target?.result as string;
            setProfileImage(dataUrl);
            localStorage.setItem('unsaid-profile-image', dataUrl);
            setSelectedEmoji('');
            localStorage.removeItem('unsaid-avatar-emoji');
        };
        reader.readAsDataURL(file);
    };

    const handleLogout = async () => {
        await logout();
        router.push('/auth/login');
    };

    const currentAvatarBg = AVATAR_OPTIONS.find(a => a.id === selectedAvatar)?.bg || 'from-[#4F7CFF] to-[#9C6BFF]';

    const settingsOptions = [
        {
            title: 'Notifications',
            description: 'Daily reminders, mood check-ins, and AI support.',
            icon: <Bell className="w-5 h-5 text-[#4F7CFF]" />,
            path: '/settings/notifications'
        },
        {
            title: 'Privacy & Security',
            description: 'PIN lock, session management, and data privacy.',
            icon: <Shield className="w-5 h-5 text-[#9C6BFF]" />,
            path: '/settings/privacy'
        },
        {
            title: 'Appearance',
            description: 'Theme modes, accent colors, and font size.',
            icon: <Palette className="w-5 h-5 text-[#4ade80]" />,
            path: '/settings/appearance'
        }
    ];

    return (
        <ThemedPage>

            {/* Header */}
            <ThemedNav>
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="p-2 -ml-2 text-white/60 hover:text-white transition-colors flex items-center gap-2"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="text-[15px]">Dashboard</span>
                    </button>
                    <h1 className="text-[17px] font-medium text-white tracking-wide">Settings</h1>
                    <div className="w-10"></div>
                </div>
            </ThemedNav>

            <main className="relative z-10 max-w-2xl mx-auto px-6 pt-10 pb-20">

                {/* Profile Section */}
                <section className="mb-10">
                    <h2 className="text-xs uppercase tracking-[0.2em] text-white/30 font-bold mb-4 px-2">Your Profile</h2>
                    <div className="p-6 bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-md">
                        {/* Avatar */}
                        <div className="flex flex-col items-center mb-6">
                            <div className="relative group mb-4">
                                <div className={`w-24 h-24 rounded-full bg-gradient-to-tr ${currentAvatarBg} p-[2px] shadow-2xl`}>
                                    <div className="w-full h-full rounded-full bg-[#050B14] flex items-center justify-center overflow-hidden">
                                        {profileImage ? (
                                            <img src={profileImage} alt="Profile" className="w-full h-full object-cover rounded-full" />
                                        ) : selectedEmoji ? (
                                            <span className="text-4xl">{selectedEmoji}</span>
                                        ) : (
                                            <User className="w-10 h-10 text-white/80" />
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                                    className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-[#4F7CFF] border-4 border-[#050B14] flex items-center justify-center hover:scale-110 transition-transform"
                                >
                                    <Camera className="w-4 h-4 text-white" />
                                </button>
                            </div>
                            <p className="text-white font-medium text-lg">{user?.firstName} {user?.lastName}</p>
                            <p className="text-white/40 text-sm">{user?.email}</p>
                        </div>

                        {/* Avatar Picker Modal */}
                        {showAvatarPicker && (
                            <div className="mb-6 p-5 bg-white/[0.02] border border-white/10 rounded-2xl">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-white text-sm font-medium">Choose Avatar</h4>
                                    <button onClick={() => setShowAvatarPicker(false)} className="text-white/40 hover:text-white">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Upload photo */}
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full mb-4 flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-colors"
                                >
                                    <Camera className="w-5 h-5 text-[#4F7CFF]" />
                                    <span className="text-white/70 text-sm">Upload Photo</span>
                                </button>
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

                                {/* Emoji avatars */}
                                <p className="text-white/30 text-xs uppercase tracking-widest font-bold mb-3">Emoji Avatars</p>
                                <div className="grid grid-cols-8 gap-2 mb-5">
                                    {AVATAR_EMOJIS.map((emoji, i) => (
                                        <button
                                            key={emoji}
                                            onClick={() => handleAvatarSelect(AVATAR_OPTIONS[i]?.id || 'gradient-1', emoji)}
                                            className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl border transition-all hover:scale-110 ${selectedEmoji === emoji
                                                ? 'border-[#4F7CFF] bg-[#4F7CFF]/10 shadow-lg shadow-[#4F7CFF]/20'
                                                : 'border-white/5 bg-white/[0.02]'
                                                }`}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>

                                {/* Gradient rings */}
                                <p className="text-white/30 text-xs uppercase tracking-widest font-bold mb-3">Ring Color</p>
                                <div className="grid grid-cols-8 gap-2">
                                    {AVATAR_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.id}
                                            onClick={() => handleAvatarSelect(opt.id)}
                                            className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${opt.bg} p-[2px] transition-all hover:scale-110 ${selectedAvatar === opt.id ? 'ring-2 ring-white ring-offset-2 ring-offset-[#050B14]' : ''
                                                }`}
                                        >
                                            <div className="w-full h-full rounded-[10px] bg-[#0F172A]"></div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Name fields */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="text-white/40 text-xs uppercase tracking-widest font-bold block mb-2">First Name</label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#4F7CFF]/50 transition-colors placeholder:text-white/20"
                                    placeholder="Your first name"
                                />
                            </div>
                            <div>
                                <label className="text-white/40 text-xs uppercase tracking-widest font-bold block mb-2">Last Name</label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#4F7CFF]/50 transition-colors placeholder:text-white/20"
                                    placeholder="Your last name"
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleSaveName}
                            disabled={isSaving}
                            className="w-full py-3 bg-[#4F7CFF]/10 text-[#4F7CFF] border border-[#4F7CFF]/20 rounded-xl font-medium text-sm hover:bg-[#4F7CFF]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isSaving ? (
                                <div className="w-4 h-4 border-2 border-[#4F7CFF]/30 border-t-[#4F7CFF] rounded-full animate-spin"></div>
                            ) : saveStatus === 'success' ? (
                                <CheckCircle2 className="w-4 h-4" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            {isSaving ? 'Saving...' : saveStatus === 'success' ? 'Name Updated!' : 'Save Profile'}
                        </button>
                    </div>
                </section>

                {/* Settings Grid */}
                <section className="mb-10">
                    <h2 className="text-xs uppercase tracking-[0.2em] text-white/30 font-bold mb-4 px-2">Preferences</h2>
                    <div className="space-y-3">
                        {settingsOptions.map((option, idx) => (
                            <button
                                key={idx}
                                onClick={() => router.push(option.path)}
                                className="w-full p-5 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 rounded-2xl backdrop-blur-sm flex items-center group transition-all"
                            >
                                <div className="p-3 bg-white/[0.03] rounded-xl border border-white/5 mr-4 group-hover:scale-110 transition-transform">
                                    {option.icon}
                                </div>
                                <div className="flex-1 text-left">
                                    <h4 className="text-white text-[16px] font-medium">{option.title}</h4>
                                    <p className="text-white/40 text-xs mt-1">{option.description}</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white/40 transition-colors" />
                            </button>
                        ))}
                    </div>
                </section>

                {/* Danger Zone */}
                <section>
                    <h2 className="text-xs uppercase tracking-[0.2em] text-red-400/40 font-bold mb-4 px-2">Account</h2>
                    <button
                        onClick={handleLogout}
                        className="w-full p-5 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/20 rounded-2xl backdrop-blur-sm flex items-center group transition-all"
                    >
                        <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/10 mr-4 group-hover:scale-110 transition-transform">
                            <LogOut className="w-5 h-5 text-red-400" />
                        </div>
                        <div className="flex-1 text-left">
                            <h4 className="text-red-400 text-[16px] font-medium">Sign Out</h4>
                            <p className="text-red-400/40 text-xs mt-1">End your current session safely.</p>
                        </div>
                    </button>
                </section>

            </main>
        </ThemedPage>
    );
}
