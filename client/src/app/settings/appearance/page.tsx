'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Moon,
    Sparkles,
    Type,
    Minus,
    Plus,
    CheckCircle2,
    Save
} from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { ThemedPage, ThemedNav } from '@/components/themed/ThemedPage';
import { useThemeStore, THEME_PRESETS, type ThemeMode } from '@/stores/themeStore';

interface ThemeConfig {
    id: ThemeMode;
    name: string;
    description: string;
    accent: string;
    preview: string;
    previewBorder: string;
}

const THEMES: ThemeConfig[] = [
    {
        id: 'midnight',
        name: 'Midnight',
        description: 'Default dark theme',
        accent: '#4F7CFF',
        preview: 'bg-gradient-to-br from-[#050B14] to-[#0A1128]',
        previewBorder: 'border-[#4F7CFF]/30'
    },
    {
        id: 'deep-ocean',
        name: 'Deep Ocean',
        description: 'Cool blue tones',
        accent: '#06B6D4',
        preview: 'bg-gradient-to-br from-[#020B18] to-[#0C2D4A]',
        previewBorder: 'border-[#06B6D4]/30'
    },
    {
        id: 'aurora',
        name: 'Aurora',
        description: 'Northern lights',
        accent: '#34D399',
        preview: 'bg-gradient-to-br from-[#040D12] to-[#0D2B24]',
        previewBorder: 'border-[#34D399]/30'
    },
    {
        id: 'sunset',
        name: 'Sunset',
        description: 'Warm golden tones',
        accent: '#F59E0B',
        preview: 'bg-gradient-to-br from-[#120B05] to-[#2D1F0D]',
        previewBorder: 'border-[#F59E0B]/30'
    },
    {
        id: 'noir',
        name: 'Noir',
        description: 'Pure dark minimal',
        accent: '#A1A1AA',
        preview: 'bg-gradient-to-br from-[#0A0A0A] to-[#171717]',
        previewBorder: 'border-[#A1A1AA]/30'
    },
    {
        id: 'forest',
        name: 'Forest',
        description: 'Lush green vibes',
        accent: '#22C55E',
        preview: 'bg-gradient-to-br from-[#061208] to-[#14301A]',
        previewBorder: 'border-[#22C55E]/30'
    },
];

const ACCENT_COLORS = [
    { name: 'Blue', hex: '#4F7CFF' },
    { name: 'Purple', hex: '#9C6BFF' },
    { name: 'Cyan', hex: '#06B6D4' },
    { name: 'Green', hex: '#34D399' },
    { name: 'Pink', hex: '#EC4899' },
    { name: 'Amber', hex: '#F59E0B' },
    { name: 'Red', hex: '#EF4444' },
    { name: 'Indigo', hex: '#6366F1' },
];

export default function AppearancePage() {
    return (
        <ProtectedRoute>
            <AppearanceContent />
        </ProtectedRoute>
    );
}

function AppearanceContent() {
    const router = useRouter();
    const { theme, accent, fontSize, setTheme, setAccent, setFontSize } = useThemeStore();
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        // Theme is already set via Zustand. Just show confirmation.
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <ThemedPage className="pb-20">

            <ThemedNav>
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <button onClick={() => router.back()} className="p-2 -ml-2 text-white/60 hover:text-white transition-colors flex items-center gap-2">
                        <ArrowLeft className="w-5 h-5" />
                        <span className="text-[15px]">Back</span>
                    </button>
                    <h1 className="text-[17px] font-medium text-white tracking-wide">Appearance</h1>
                    <div className="w-10"></div>
                </div>
            </ThemedNav>

            <main className="relative z-10 max-w-2xl mx-auto px-6 pt-10">

                {/* Theme Mode */}
                <section className="mb-10">
                    <div className="flex items-center gap-3 mb-6 px-2">
                        <div className="p-2 bg-white/[0.03] rounded-lg border border-white/5">
                            <Moon className="w-4 h-4 text-[#9C6BFF]" />
                        </div>
                        <h2 className="text-white font-medium text-[16px]">Theme Mode</h2>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {THEMES.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setTheme(t.id)}
                                className={`relative p-4 rounded-2xl border transition-all overflow-hidden group ${theme === t.id
                                        ? `${t.previewBorder} border-2 shadow-lg`
                                        : 'border-white/5 hover:border-white/10'
                                    }`}
                            >
                                <div className={`absolute inset-0 ${t.preview} opacity-80`}></div>
                                <div className="relative z-10">
                                    <div className="mb-3 flex items-center gap-1.5">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.accent }}></div>
                                        <div className="h-1.5 w-8 rounded-full bg-white/10"></div>
                                    </div>
                                    <div className="space-y-1.5 mb-3">
                                        <div className="h-1 w-full rounded-full bg-white/5"></div>
                                        <div className="h-1 w-3/4 rounded-full bg-white/5"></div>
                                        <div className="h-1 w-1/2 rounded-full bg-white/5"></div>
                                    </div>
                                    <h4 className="text-white text-sm font-medium">{t.name}</h4>
                                    <p className="text-white/30 text-[10px] mt-0.5">{t.description}</p>
                                </div>

                                {theme === t.id && (
                                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: t.accent }}>
                                        <CheckCircle2 className="w-4 h-4 text-white" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Accent Color */}
                <section className="mb-10">
                    <div className="flex items-center gap-3 mb-6 px-2">
                        <div className="p-2 bg-white/[0.03] rounded-lg border border-white/5">
                            <Sparkles className="w-4 h-4 text-[#F59E0B]" />
                        </div>
                        <h2 className="text-white font-medium text-[16px]">Accent Color</h2>
                    </div>

                    <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl">
                        <div className="grid grid-cols-8 gap-3">
                            {ACCENT_COLORS.map((color) => (
                                <button
                                    key={color.hex}
                                    onClick={() => setAccent(color.hex)}
                                    className={`relative w-full aspect-square rounded-xl transition-all hover:scale-110 ${accent === color.hex
                                            ? 'ring-2 ring-white ring-offset-2 ring-offset-[#050B14] scale-110'
                                            : ''
                                        }`}
                                    style={{ backgroundColor: color.hex }}
                                    title={color.name}
                                >
                                    {accent === color.hex && (
                                        <CheckCircle2 className="w-4 h-4 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-lg" />
                                    )}
                                </button>
                            ))}
                        </div>
                        <p className="text-white/30 text-xs mt-4 text-center">
                            Selected: <span className="font-medium" style={{ color: accent }}>
                                {ACCENT_COLORS.find(c => c.hex === accent)?.name || 'Custom'}
                            </span>
                        </p>
                    </div>
                </section>

                {/* Font Size */}
                <section className="mb-12">
                    <div className="flex items-center gap-3 mb-6 px-2">
                        <div className="p-2 bg-white/[0.03] rounded-lg border border-white/5">
                            <Type className="w-4 h-4" style={{ color: accent }} />
                        </div>
                        <h2 className="text-white font-medium text-[16px]">Font Size</h2>
                    </div>

                    <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <button
                                onClick={() => setFontSize(Math.max(12, fontSize - 1))}
                                className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white hover:bg-white/[0.1] transition-colors"
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            <span className="text-white font-mono text-2xl font-bold">{fontSize}px</span>
                            <button
                                onClick={() => setFontSize(Math.min(20, fontSize + 1))}
                                className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white hover:bg-white/[0.1] transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                            <p className="text-white/60 text-center" style={{ fontSize: `${fontSize}px` }}>
                                The quick brown fox jumps over the lazy dog.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Save Button */}
                <div className="fixed bottom-8 left-0 right-0 px-6 z-30">
                    <div className="max-w-2xl mx-auto">
                        <button
                            onClick={handleSave}
                            className="w-full py-4 text-white font-semibold rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                            style={{ background: `linear-gradient(to right, ${accent}, ${accent}CC)`, boxShadow: `0 10px 25px ${accent}33` }}
                        >
                            {saved ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                            {saved ? 'Preferences Saved!' : 'Save Appearance'}
                        </button>
                    </div>
                </div>
            </main>
        </ThemedPage>
    );
}
