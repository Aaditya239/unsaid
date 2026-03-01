'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Shield,
    Lock,
    Eye,
    EyeOff,
    Fingerprint,
    Smartphone,
    Trash2,
    CheckCircle2,
    AlertTriangle,
    KeyRound,
    Save
} from 'lucide-react';
import { usePinLockStore } from '@/stores/pinLockStore';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { ThemedPage, ThemedNav } from '@/components/themed/ThemedPage';

export default function PrivacyPage() {
    return (
        <ProtectedRoute>
            <PrivacyContent />
        </ProtectedRoute>
    );
}

function PrivacyContent() {
    const router = useRouter();
    const {
        isEnabled: pinEnabled,
        pin: currentPin,
        setPin,
        enablePinLock,
        disablePinLock,
    } = usePinLockStore();

    const [showPin, setShowPin] = useState(false);
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [pinError, setPinError] = useState('');
    const [pinSaved, setPinSaved] = useState(false);

    const handlePinToggle = () => {
        if (pinEnabled) {
            disablePinLock();
        } else {
            enablePinLock();
        }
    };

    const handlePinChange = () => {
        setPinError('');
        if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
            setPinError('PIN must be exactly 4 digits');
            return;
        }
        if (newPin !== confirmPin) {
            setPinError('PINs do not match');
            return;
        }
        setPin(newPin);
        setPinSaved(true);
        setNewPin('');
        setConfirmPin('');
        setTimeout(() => setPinSaved(false), 3000);
    };

    return (
        <ThemedPage className="pb-20">

            <ThemedNav>
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <button onClick={() => router.back()} className="p-2 -ml-2 text-white/60 hover:text-white transition-colors flex items-center gap-2">
                        <ArrowLeft className="w-5 h-5" />
                        <span className="text-[15px]">Back</span>
                    </button>
                    <h1 className="text-[17px] font-medium text-white tracking-wide">Privacy & Security</h1>
                    <div className="w-10"></div>
                </div>
            </ThemedNav>

            <main className="relative z-10 max-w-2xl mx-auto px-6 pt-10">
                {/* PIN Lock Section */}
                <section className="mb-10">
                    <div className="flex items-center gap-3 mb-6 px-2">
                        <div className="p-2 bg-white/[0.03] rounded-lg border border-white/5">
                            <Lock className="w-4 h-4 text-[#9C6BFF]" />
                        </div>
                        <h2 className="text-white font-medium text-[16px]">PIN Lock</h2>
                    </div>

                    <div className="space-y-4">
                        {/* Enable/Disable toggle */}
                        <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between">
                            <div>
                                <h4 className="text-white text-[15px] font-medium">Enable PIN Lock</h4>
                                <p className="text-white/40 text-xs mt-1">
                                    {pinEnabled
                                        ? 'Lock screen is active. Your journal is protected.'
                                        : 'Add a 4-digit PIN to protect your data.'
                                    }
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={pinEnabled} onChange={handlePinToggle} />
                                <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#9C6BFF]"></div>
                            </label>
                        </div>

                        {/* Change PIN */}
                        {pinEnabled && (
                            <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <KeyRound className="w-4 h-4 text-[#9C6BFF]" />
                                    <h4 className="text-white text-[15px] font-medium">Change PIN</h4>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className="text-white/40 text-sm">Current PIN:</span>
                                    <span className="text-white font-mono tracking-[0.3em]">
                                        {showPin ? currentPin : '••••'}
                                    </span>
                                    <button onClick={() => setShowPin(!showPin)} className="text-white/30 hover:text-white/60 transition-colors">
                                        {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        type="password"
                                        maxLength={4}
                                        placeholder="New PIN"
                                        value={newPin}
                                        onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                        className="bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#9C6BFF]/50 transition-colors text-center tracking-[0.5em] font-mono placeholder:tracking-normal placeholder:text-white/20"
                                    />
                                    <input
                                        type="password"
                                        maxLength={4}
                                        placeholder="Confirm"
                                        value={confirmPin}
                                        onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                        className="bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#9C6BFF]/50 transition-colors text-center tracking-[0.5em] font-mono placeholder:tracking-normal placeholder:text-white/20"
                                    />
                                </div>

                                {pinError && (
                                    <p className="text-red-400 text-xs flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" /> {pinError}
                                    </p>
                                )}

                                <button
                                    onClick={handlePinChange}
                                    className="w-full py-3 bg-[#9C6BFF]/10 text-[#9C6BFF] border border-[#9C6BFF]/20 rounded-xl font-medium text-sm hover:bg-[#9C6BFF]/20 transition-all flex items-center justify-center gap-2"
                                >
                                    {pinSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                                    {pinSaved ? 'PIN Updated!' : 'Update PIN'}
                                </button>
                            </div>
                        )}
                    </div>
                </section>

                {/* Session Security */}
                <section className="mb-10">
                    <div className="flex items-center gap-3 mb-6 px-2">
                        <div className="p-2 bg-white/[0.03] rounded-lg border border-white/5">
                            <Smartphone className="w-4 h-4 text-[#4F7CFF]" />
                        </div>
                        <h2 className="text-white font-medium text-[16px]">Session</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]"></div>
                                <div>
                                    <h4 className="text-white text-[15px] font-medium">Current Session</h4>
                                    <p className="text-white/40 text-xs mt-0.5">This device · Active Now</p>
                                </div>
                            </div>
                            <span className="text-xs text-green-400/80 px-3 py-1 bg-green-400/10 rounded-full border border-green-400/20">Active</span>
                        </div>
                    </div>
                </section>

                {/* Data Privacy */}
                <section className="mb-10">
                    <div className="flex items-center gap-3 mb-6 px-2">
                        <div className="p-2 bg-white/[0.03] rounded-lg border border-white/5">
                            <Fingerprint className="w-4 h-4 text-[#34D399]" />
                        </div>
                        <h2 className="text-white font-medium text-[16px]">Data Privacy</h2>
                    </div>

                    <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl">
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <Shield className="w-4 h-4 text-[#34D399] mt-0.5 shrink-0" />
                                <p className="text-white/50 text-sm">Your journal entries are encrypted and never shared with third parties.</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <Shield className="w-4 h-4 text-[#34D399] mt-0.5 shrink-0" />
                                <p className="text-white/50 text-sm">AI analysis runs securely and your mood data is never sold.</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <Shield className="w-4 h-4 text-[#34D399] mt-0.5 shrink-0" />
                                <p className="text-white/50 text-sm">Passwords are hashed with bcrypt. Cookies are httpOnly and secure.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Danger Zone */}
                <section>
                    <div className="flex items-center gap-3 mb-6 px-2">
                        <div className="p-2 bg-red-500/5 rounded-lg border border-red-500/10">
                            <Trash2 className="w-4 h-4 text-red-400" />
                        </div>
                        <h2 className="text-red-400/80 font-medium text-[16px]">Danger Zone</h2>
                    </div>

                    <div className="p-5 bg-red-500/[0.03] border border-red-500/10 rounded-2xl">
                        <h4 className="text-red-400 text-[15px] font-medium mb-1">Delete Account</h4>
                        <p className="text-white/30 text-xs mb-4">This action is permanent and cannot be undone. All your data will be erased.</p>
                        <button className="px-6 py-2.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-sm font-medium hover:bg-red-500/20 transition-all">
                            Request Account Deletion
                        </button>
                    </div>
                </section>
            </main>
        </ThemedPage>
    );
}
