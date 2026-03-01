'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import NotificationBell from './NotificationBell';
import UserMenu from './UserMenu';

export const DashboardNavbar = () => {
    return (
        <motion.nav
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between backdrop-blur-md bg-black/5 border-b border-white/[0.05]"
        >
            <div className="flex items-center gap-8">
                <Link href="/dashboard" className="group">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                            <span className="text-white font-bold text-lg italic">U</span>
                        </div>
                        <span className="text-[20px] font-bold tracking-tighter text-white">UNSAID</span>
                    </div>
                </Link>

                <div className="hidden md:flex items-center gap-6">
                    <Link href="/journal" className="text-[14px] text-white/40 hover:text-white transition-colors">Journal</Link>
                    <Link href="/calm" className="text-[14px] text-white/40 hover:text-white transition-colors">Calm Space</Link>
                    <Link href="/tasks" className="text-[14px] text-white/40 hover:text-white transition-colors">Mindful Tasks</Link>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <NotificationBell />
                <UserMenu />
            </div>
        </motion.nav>
    );
};
