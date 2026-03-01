// ============================================
// Theme Store (Zustand)
// ============================================
// Manages global appearance: theme mode, accent color, font size.
// Persisted to localStorage with explicit hydration control.
// ============================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ============================================
// TYPES
// ============================================

export type ThemeMode = 'midnight' | 'deep-ocean' | 'aurora' | 'sunset' | 'noir' | 'forest';

export interface ThemeColors {
    bgPrimary: string;
    bgSecondary: string;
    bgTertiary: string;
    bgGlow1: string;
    bgGlow2: string;
    cardBg: string;
    cardBorder: string;
    navBg: string;
    navBorder: string;
}

export const THEME_PRESETS: Record<ThemeMode, ThemeColors> = {
    midnight: {
        bgPrimary: '#050B14',
        bgSecondary: '#0A1128',
        bgTertiary: '#02050A',
        bgGlow1: 'rgba(79,124,255,0.10)',
        bgGlow2: 'rgba(156,107,255,0.05)',
        cardBg: 'rgba(255,255,255,0.06)',
        cardBorder: 'rgba(255,255,255,0.08)',
        navBg: 'rgba(255,255,255,0.02)',
        navBorder: 'rgba(255,255,255,0.06)',
    },
    'deep-ocean': {
        bgPrimary: '#020B18',
        bgSecondary: '#0C2D4A',
        bgTertiary: '#010610',
        bgGlow1: 'rgba(6,182,212,0.10)',
        bgGlow2: 'rgba(59,130,246,0.05)',
        cardBg: 'rgba(255,255,255,0.05)',
        cardBorder: 'rgba(6,182,212,0.10)',
        navBg: 'rgba(6,182,212,0.02)',
        navBorder: 'rgba(6,182,212,0.08)',
    },
    aurora: {
        bgPrimary: '#040D12',
        bgSecondary: '#0D2B24',
        bgTertiary: '#020806',
        bgGlow1: 'rgba(52,211,153,0.10)',
        bgGlow2: 'rgba(16,185,129,0.05)',
        cardBg: 'rgba(255,255,255,0.05)',
        cardBorder: 'rgba(52,211,153,0.10)',
        navBg: 'rgba(52,211,153,0.02)',
        navBorder: 'rgba(52,211,153,0.08)',
    },
    sunset: {
        bgPrimary: '#120B05',
        bgSecondary: '#2D1F0D',
        bgTertiary: '#0A0603',
        bgGlow1: 'rgba(245,158,11,0.10)',
        bgGlow2: 'rgba(249,115,22,0.05)',
        cardBg: 'rgba(255,255,255,0.05)',
        cardBorder: 'rgba(245,158,11,0.10)',
        navBg: 'rgba(245,158,11,0.02)',
        navBorder: 'rgba(245,158,11,0.08)',
    },
    noir: {
        bgPrimary: '#0A0A0A',
        bgSecondary: '#171717',
        bgTertiary: '#050505',
        bgGlow1: 'rgba(161,161,170,0.05)',
        bgGlow2: 'rgba(113,113,122,0.03)',
        cardBg: 'rgba(255,255,255,0.04)',
        cardBorder: 'rgba(255,255,255,0.06)',
        navBg: 'rgba(255,255,255,0.02)',
        navBorder: 'rgba(255,255,255,0.05)',
    },
    forest: {
        bgPrimary: '#061208',
        bgSecondary: '#14301A',
        bgTertiary: '#030A04',
        bgGlow1: 'rgba(34,197,94,0.10)',
        bgGlow2: 'rgba(22,163,74,0.05)',
        cardBg: 'rgba(255,255,255,0.05)',
        cardBorder: 'rgba(34,197,94,0.10)',
        navBg: 'rgba(34,197,94,0.02)',
        navBorder: 'rgba(34,197,94,0.08)',
    },
};

interface ThemeState {
    theme: ThemeMode;
    accent: string;
    fontSize: number;
    _hasHydrated: boolean;
}

interface ThemeActions {
    setTheme: (theme: ThemeMode) => void;
    setAccent: (accent: string) => void;
    setFontSize: (size: number) => void;
    getColors: () => ThemeColors;
    setHasHydrated: (state: boolean) => void;
}

type ThemeStore = ThemeState & ThemeActions;

export const useThemeStore = create<ThemeStore>()(
    persist(
        (set, get) => ({
            theme: 'midnight',
            accent: '#4F7CFF',
            fontSize: 14,
            _hasHydrated: false,

            setTheme: (theme: ThemeMode) => set({ theme }),
            setAccent: (accent: string) => set({ accent }),
            setFontSize: (size: number) => set({ fontSize: Math.max(12, Math.min(20, size)) }),
            getColors: () => THEME_PRESETS[get().theme],
            setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
        }),
        {
            name: 'unsaid-theme',
            storage: createJSONStorage(() => localStorage),
            // Fire setHasHydrated(true) once the store loads from localStorage
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        }
    )
);
