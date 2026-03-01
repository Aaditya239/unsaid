'use client';

import { useEffect } from 'react';
import { useThemeStore, THEME_PRESETS } from '@/stores/themeStore';

/** Apply all CSS custom properties to :root based on current theme/accent/fontSize.
 *  Called both on initial render AND after localStorage rehydration. */
function applyThemeVars(
    theme: string,
    accent: string,
    fontSize: number,
) {
    const colors = THEME_PRESETS[theme as keyof typeof THEME_PRESETS];
    if (!colors) return;

    const root = document.documentElement;

    // ── Backgrounds ──────────────────────────────────────────────────────
    root.style.setProperty('--theme-bg-primary', colors.bgPrimary);
    root.style.setProperty('--theme-bg-secondary', colors.bgSecondary);
    root.style.setProperty('--theme-bg-tertiary', colors.bgTertiary);
    root.style.setProperty('--theme-bg-glow1', colors.bgGlow1);
    root.style.setProperty('--theme-bg-glow2', colors.bgGlow2);

    // ── Card / Nav ────────────────────────────────────────────────────────
    root.style.setProperty('--theme-card-bg', colors.cardBg);
    root.style.setProperty('--theme-card-border', colors.cardBorder);
    root.style.setProperty('--theme-card-shadow', '0 20px 60px rgba(0,0,0,0.45)');
    root.style.setProperty('--theme-nav-bg', colors.navBg);
    root.style.setProperty('--theme-nav-border', colors.navBorder);

    // ── Accent colour + opacity variants ──────────────────────────────────
    root.style.setProperty('--theme-accent', accent);
    root.style.setProperty('--theme-accent-soft', accent + '1A'); // 10%
    root.style.setProperty('--theme-accent-border', accent + '33'); // 20%
    root.style.setProperty('--theme-accent-glow', accent + '4D'); // 30%

    // ── Scrollbar thumb ───────────────────────────────────────────────────
    root.style.setProperty('--theme-scrollbar', accent + '66'); // 40%

    // ── Font size ─────────────────────────────────────────────────────────
    root.style.setProperty('--theme-font-size', `${fontSize}px`);

    // Body background (instant paint before CSS vars are read)
    document.body.style.backgroundColor = colors.bgPrimary;
}

/**
 * ThemeProvider — root-level wrapper that drives all theme CSS variables.
 *
 * It runs in TWO situations:
 *  1. On initial mount (applies default or whatever Zustand already has).
 *  2. Whenever theme / accent / fontSize / _hasHydrated changes, which
 *     includes the moment Zustand rehydrates from localStorage — ensuring
 *     the saved theme is applied on every page navigation, not just settings.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const { theme, accent, fontSize, _hasHydrated } = useThemeStore();

    // Re-apply CSS vars whenever any theme value changes OR hydration completes.
    useEffect(() => {
        applyThemeVars(theme, accent, fontSize);
    }, [theme, accent, fontSize, _hasHydrated]);

    return <>{children}</>;
}
