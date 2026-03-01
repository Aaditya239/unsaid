'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Bell,
    ArrowLeft,
    Moon,
    Clock,
    MessageSquare,
    CheckCircle2,
    AlertCircle,
    Save,
    ShieldCheck
} from 'lucide-react';
import { NotificationManager } from '@/lib/notifications';
import { ThemedPage, ThemedNav } from '@/components/themed/ThemedPage';

interface NotificationPreferences {
    journalReminderEnabled: boolean;
    journalReminderTime: string;
    moodReminderEnabled: boolean;
    moodIntervalHours: number;
    aiSupportEnabled: boolean;
    timezone: string;
}

export default function NotificationSettings() {
    const router = useRouter();
    const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [permission, setPermission] = useState<string>('default');

    useEffect(() => {
        // Check permission status
        setPermission(NotificationManager.checkPermission());

        // Fetch preferences
        const fetchPrefs = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/preferences`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                const data = await res.json();
                if (data.status === 'success') {
                    setPrefs(data.data);
                }
            } catch (err) {
                console.error('Failed to fetch preferences', err);
            }
        };

        fetchPrefs();
    }, []);

    const handleSave = async () => {
        if (!prefs) return;
        setIsSaving(true);
        setSaveStatus('idle');

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/preferences`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(prefs)
            });

            if (res.ok) {
                setSaveStatus('success');
                setTimeout(() => setSaveStatus('idle'), 3000);
            } else {
                setSaveStatus('error');
            }
        } catch (err) {
            setSaveStatus('error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEnableNotifications = async () => {
        const success = await NotificationManager.requestPermission();
        if (success) {
            setPermission('granted');
        } else {
            setPermission(NotificationManager.checkPermission());
        }
    };

    if (!prefs) {
        return (
            <ThemedPage className="flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-[#4F7CFF] border-t-transparent rounded-full animate-spin"></div>
            </ThemedPage>
        );
    }

    return (
        <ThemedPage className="pb-20">

            {/* Header */}
            <ThemedNav>
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="p-2 -ml-2 text-white/60 hover:text-white transition-colors flex items-center gap-2"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="text-[15px]">Back</span>
                    </button>
                    <h1 className="text-[17px] font-medium text-white tracking-wide">Notifications</h1>
                    <div className="w-10"></div>
                </div>
            </ThemedNav>

            <main className="relative z-10 max-w-2xl mx-auto px-6 pt-10">

                {/* Permission Banner */}
                {permission !== 'granted' && (
                    <div className="mb-8 p-5 bg-[#4F7CFF]/10 border border-[#4F7CFF]/20 rounded-2xl backdrop-blur-md flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
                        <div className="w-12 h-12 bg-[#4F7CFF]/20 rounded-full flex items-center justify-center shrink-0">
                            <Bell className="w-6 h-6 text-[#4F7CFF]" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-white font-medium mb-1">Enable Gentle Reminders?</h3>
                            <p className="text-white/50 text-sm">We'll send subtle nudges to help you maintain your mental wellness habit.</p>
                        </div>
                        <button
                            onClick={handleEnableNotifications}
                            className="px-6 py-2.5 bg-[#4F7CFF] hover:bg-[#3D66E0] text-white rounded-full font-medium transition-all shadow-lg shadow-[#4F7CFF]/20 active:scale-95"
                        >
                            Allow Notifications
                        </button>
                    </div>
                )}

                {/* Journal Reminders Section */}
                <section className="mb-10">
                    <div className="flex items-center gap-3 mb-6 px-2">
                        <div className="p-2 bg-white/[0.03] rounded-lg border border-white/5">
                            <Clock className="w-4 h-4 text-[#4F7CFF]" />
                        </div>
                        <h2 className="text-white font-medium text-[16px]">Journal Reminders</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl backdrop-blur-sm flex items-center justify-between">
                            <div>
                                <h4 className="text-white text-[15px] font-medium">Daily Reminder</h4>
                                <p className="text-white/40 text-xs mt-1">"Take 3 minutes to write how you feel."</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={prefs.journalReminderEnabled}
                                    onChange={(e) => setPrefs({ ...prefs, journalReminderEnabled: e.target.checked })}
                                />
                                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4F7CFF]"></div>
                            </label>
                        </div>

                        {prefs.journalReminderEnabled && (
                            <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl backdrop-blur-sm flex items-center justify-between">
                                <div>
                                    <h4 className="text-white text-[15px] font-medium">Reminder Time</h4>
                                    <p className="text-white/40 text-xs mt-1">What time should we remind you?</p>
                                </div>
                                <input
                                    type="time"
                                    value={prefs.journalReminderTime}
                                    onChange={(e) => setPrefs({ ...prefs, journalReminderTime: e.target.value })}
                                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white outline-none focus:border-[#4F7CFF]/50 transition-colors"
                                />
                            </div>
                        )}
                    </div>
                </section>

                {/* Mood Check-ins Section */}
                <section className="mb-10">
                    <div className="flex items-center gap-3 mb-6 px-2">
                        <div className="p-2 bg-white/[0.03] rounded-lg border border-white/5">
                            <Moon className="w-4 h-4 text-[#9C6BFF]" />
                        </div>
                        <h2 className="text-white font-medium text-[16px]">Mood Awareness</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl backdrop-blur-sm flex items-center justify-between">
                            <div>
                                <h4 className="text-white text-[15px] font-medium">Periodic Check-ins</h4>
                                <p className="text-white/40 text-xs mt-1">Briefly check in between 9 AM and 9 PM.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={prefs.moodReminderEnabled}
                                    onChange={(e) => setPrefs({ ...prefs, moodReminderEnabled: e.target.checked })}
                                />
                                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#9C6BFF]"></div>
                            </label>
                        </div>

                        {prefs.moodReminderEnabled && (
                            <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl backdrop-blur-sm flex items-center justify-between">
                                <div>
                                    <h4 className="text-white text-[15px] font-medium">Check-in Interval</h4>
                                    <p className="text-white/40 text-xs mt-1">How often should we check in?</p>
                                </div>
                                <select
                                    value={prefs.moodIntervalHours}
                                    onChange={(e) => setPrefs({ ...prefs, moodIntervalHours: parseInt(e.target.value) })}
                                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white outline-none focus:border-[#9C6BFF]/50 transition-colors"
                                >
                                    <option value={1} className="bg-[#0F172A]">Every hour</option>
                                    <option value={2} className="bg-[#0F172A]">Every 2 hours</option>
                                    <option value={3} className="bg-[#0F172A]">Every 3 hours</option>
                                    <option value={4} className="bg-[#0F172A]">Every 4 hours</option>
                                </select>
                            </div>
                        )}
                    </div>
                </section>

                {/* AI Support Section */}
                <section className="mb-12">
                    <div className="flex items-center gap-3 mb-6 px-2">
                        <div className="p-2 bg-white/[0.03] rounded-lg border border-white/5">
                            <MessageSquare className="w-4 h-4 text-[#4ade80]" />
                        </div>
                        <h2 className="text-white font-medium text-[16px]">AI Support Presence</h2>
                    </div>

                    <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl backdrop-blur-sm flex items-center justify-between">
                        <div>
                            <h4 className="text-white text-[15px] font-medium">Supportive Nudges</h4>
                            <p className="text-white/40 text-xs mt-1">Intelligent messages when you log difficult moods.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={prefs.aiSupportEnabled}
                                onChange={(e) => setPrefs({ ...prefs, aiSupportEnabled: e.target.checked })}
                            />
                            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4ade80]"></div>
                        </label>
                    </div>
                </section>

                {/* Action Button */}
                <div className="fixed bottom-8 left-0 right-0 px-6 z-30">
                    <div className="max-w-2xl mx-auto">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="w-full py-4 bg-gradient-to-r from-[#4F8CFF] to-[#8A5CFF] text-white font-semibold rounded-2xl shadow-xl shadow-[#4F7CFF]/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-70"
                        >
                            {isSaving ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : saveStatus === 'success' ? (
                                <CheckCircle2 className="w-5 h-5" />
                            ) : saveStatus === 'error' ? (
                                <AlertCircle className="w-5 h-5" />
                            ) : (
                                <Save className="w-5 h-5" />
                            )}
                            {isSaving ? 'Saving Changes...' : saveStatus === 'success' ? 'Settings Saved' : saveStatus === 'error' ? 'Error Saving' : 'Save Notification Preferences'}
                        </button>
                    </div>
                </div>

                {/* Info Card */}
                <div className="flex items-start gap-4 p-5 bg-white/[0.03] border border-white/5 rounded-2xl">
                    <ShieldCheck className="w-5 h-5 text-white/30 shrink-0 mt-1" />
                    <div>
                        <h5 className="text-white/60 text-[14px] font-medium">Privacy First</h5>
                        <p className="text-white/30 text-xs mt-1.5 leading-relaxed">
                            Notifications are processed on-device and your subscriptions are securely stored.
                            We never share your mood data with external advertisers. Our AI nudges are generated
                            to provide comfort, not to analyze your data for profit.
                        </p>
                    </div>
                </div>

            </main>
        </ThemedPage>
    );
}
