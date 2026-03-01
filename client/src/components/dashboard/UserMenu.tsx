'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    User,
    Settings,
    LogOut,
    ChevronDown,
    Shield,
    Moon,
    ExternalLink
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export default function UserMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const { user, logout } = useAuthStore();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            await logout();
            router.push('/auth/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    if (!user) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 p-1.5 pl-3 rounded-full bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] hover:border-white/10 transition-all group"
            >
                <div className="flex flex-col items-end hidden md:flex">
                    <span className="text-xs font-semibold text-white/90 leading-none">
                        {user.firstName || 'User'}
                    </span>
                    <span className="text-[10px] text-white/40 mt-0.5">Dashboard Entry</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#4F7CFF] to-[#9C6BFF] p-[1.5px] group-hover:scale-105 transition-transform">
                    <div className="w-full h-full rounded-full bg-[#050B14] flex items-center justify-center">
                        <User className="w-4 h-4 text-white/80" />
                    </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-white/30 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-[#0F172A]/90 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-white/10 bg-white/[0.02]">
                        <p className="text-xs text-white/40 uppercase tracking-widest font-bold">Personal Account</p>
                        <p className="text-sm font-medium text-white truncate mt-1">{user.email}</p>
                    </div>

                    <div className="p-2">
                        <button
                            onClick={() => { router.push('/settings'); setIsOpen(false); }}
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/[0.05] rounded-xl transition-colors"
                        >
                            <Settings className="w-4 h-4" />
                            <span>Settings</span>
                        </button>
                        <button
                            onClick={() => { router.push('/profile'); setIsOpen(false); }}
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/[0.05] rounded-xl transition-colors"
                        >
                            <User className="w-4 h-4" />
                            <span>My Profile</span>
                        </button>
                    </div>

                    <div className="p-2 border-t border-white/5 bg-white/[0.01]">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400/80 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
