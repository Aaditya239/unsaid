'use client';

import { useThemeStore, THEME_PRESETS } from '@/stores/themeStore';

/**
 * Hook that returns all theme-related values including computed inline styles.
 *
 * IMPORTANT: reads `_hasHydrated` from the store so that every component
 * using this hook automatically re-renders the instant Zustand finishes
 * rehydrating from localStorage. Without this, the saved theme would only
 * appear after the next user interaction.
 */
export function useTheme() {
    // Destructure _hasHydrated so this hook — and every component using it —
    // automatically re-renders when the persisted theme loads from localStorage.
    const { theme, accent, fontSize, _hasHydrated } = useThemeStore();
    const colors = THEME_PRESETS[theme];

    return {
        theme,
        accent,
        fontSize,
        colors,

        // Ready-to-use style objects
        pageBg: {
            backgroundColor: colors.bgPrimary,
        } as React.CSSProperties,

        // Background gradient for full-page overlay
        bgGradientStyle: {
            background: `radial-gradient(ellipse at top right, ${colors.bgSecondary}, ${colors.bgPrimary}, ${colors.bgTertiary})`,
        } as React.CSSProperties,

        // Glow 1 (top-left)
        glow1Style: {
            backgroundColor: colors.bgGlow1,
        } as React.CSSProperties,

        // Glow 2 (bottom-right)
        glow2Style: {
            backgroundColor: colors.bgGlow2,
        } as React.CSSProperties,

        // Card container
        cardStyle: {
            backgroundColor: colors.cardBg,
            borderColor: colors.cardBorder,
        } as React.CSSProperties,

        // Navbar
        navStyle: {
            backgroundColor: colors.navBg,
            borderBottomColor: colors.navBorder,
        } as React.CSSProperties,

        // Accent dot
        accentDotStyle: {
            backgroundColor: accent,
            boxShadow: `0 0 10px ${accent}99`,
        } as React.CSSProperties,

        // Accent text class-like
        accentColor: accent,

        // Accent button style
        accentBtnStyle: {
            backgroundColor: `${accent}1A`,
            color: accent,
            borderColor: `${accent}33`,
        } as React.CSSProperties,

        // Active nav link
        activeNavStyle: {
            color: accent,
            borderBottomColor: accent,
        } as React.CSSProperties,

        // Font size style
        fontStyle: {
            fontSize: `${fontSize}px`,
        } as React.CSSProperties,
    };
}
