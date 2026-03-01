'use client';

import React from 'react';
import { useTheme } from '@/hooks/useTheme';

interface ThemedPageProps {
    children: React.ReactNode;
    className?: string;
}

/**
 * Wrapper that applies the current theme (bg, gradient, glows) to any page.
 * Use this as the outermost wrapper of every page that should respect the theme.
 */
export function ThemedPage({ children, className = '' }: ThemedPageProps) {
    const t = useTheme();

    return (
        <div className={`min-h-screen font-sans relative overflow-hidden ${className}`} style={t.pageBg}>
            {/* Background gradient */}
            <div className="fixed inset-0 z-0 pointer-events-none" style={t.bgGradientStyle} />
            {/* Glow orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] z-0 pointer-events-none" style={t.glow1Style} />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[150px] z-0 pointer-events-none" style={t.glow2Style} />
            {children}
        </div>
    );
}

interface ThemedNavProps {
    children: React.ReactNode;
    className?: string;
}

/**
 * Themed navigation bar.
 */
export function ThemedNav({ children, className = '' }: ThemedNavProps) {
    const t = useTheme();
    return (
        <nav
            className={`relative z-20 sticky top-0 backdrop-blur-xl border-b px-4 md:px-8 py-4 ${className}`}
            style={t.navStyle}
        >
            {children}
        </nav>
    );
}
