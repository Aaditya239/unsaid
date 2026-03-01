import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ============================================
      // COLOR SYSTEM - UNSAID Emotional Theme
      // Cozy, Feminine-soft, Elegant, Warm
      // ============================================
      colors: {
        // ============================================
        // FULL FUTURISTIC SAAS THEME
        // ============================================
        midnight: '#0B1120',
        navy: {
          800: '#1E293B',
          900: '#0F172A', // Primary Deep Navy
        },
        bluegray: {
          700: '#334155',
          800: '#1E293B', // Secondary Soft Blue Gray
          900: '#0F172A',
        },
        electric: '#3B82F6', // Accent Glow Electric Blue
        lavenderglow: '#A78BFA', // Secondary Glow Lavender
        softwhite: '#E2E8F0', // Text

        // ============================================
        // LEGACY WELNESS THEMES (Do Not Remove)
        // ============================================
        lavender: {
          50: '#F4F0FF',
          100: '#EBE4FF',
          200: '#D9CEFF',
          300: '#C8B6FF', // Primary
          400: '#AFA1E6',
          500: '#968CCD',
        },
        beige: {
          50: '#FCFAF8',
          100: '#F9F4F0',
          200: '#F5EDE3', // Secondary warm background
          300: '#EDDFCD',
          400: '#E5D1B7',
          500: '#DDC3A1',
        },
        mauve: {
          50: '#F6F0F6',
          100: '#EBE0EC',
          200: '#D6C0D9',
          300: '#B899BA',
          400: '#9F6BA0', // Accent Deep Mauve
          500: '#855686',
        },
        peach: {
          50: '#FFF8F5',
          100: '#FFEFEA',
          200: '#FFE0D5',
          300: '#FFC8B8', // Soft Peach for gradient
          400: '#FFAA94',
        },
        charcoal: {
          800: '#2A2A2E',
          900: '#1A1A1D', // Dark Mode Base
          950: '#0F0F12',
        },

        // ============================================
        // LEGACY WARM THEME (Do Not Remove)
        // ============================================
        cream: {
          50: '#FAF7F2',
          100: '#F7F2E9',
          200: '#F1E5D1',
          300: '#E8D9C0',
          400: '#DBC9A8',
          500: '#C9B48F',
        },
        blush: {
          50: '#F5EAEA',
          100: '#EFE0E0',
          200: '#E5D0D0',
          300: '#DBB5B5',
          400: '#D1A3A3',
          500: '#C79090',
        },
        rose: {
          50: '#ECE2E2',
          100: '#E2D4D4',
          200: '#D4C0C0',
          300: '#C9ADAD',
          400: '#C39898',
          500: '#B88585',
        },
        coffee: {
          50: '#C4AEAE',
          100: '#B89D9D',
          200: '#A88888',
          300: '#987070',
          400: '#876363',
          500: '#755656',
        },
        warm: {
          50: '#FAFAF9',
          100: '#F5F5F4',
          200: '#E7E5E4',
          300: '#D6D3D1',
          400: '#A8A29E',
          500: '#78716C',
          600: '#57534E',
          700: '#44403C',
          800: '#292524',
          900: '#1C1917',
        },
        emotion: {
          happy: '#FFD93D',
          sad: '#6B9AFF',
          anxious: '#FF9F6B',
          calm: '#7DD3C0',
          angry: '#FF7B7B',
          grateful: '#C4B5FD',
          hopeful: '#FFB5D8',
          confused: '#B4B4B4',
          excited: '#FF8A6B',
          neutral: '#E7E5E4',
        },
      },

      // ============================================
      // TYPOGRAPHY
      // ============================================
      fontFamily: {
        serif: ['"DM Serif Display"', '"Cormorant Garamond"', '"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', '"SF Pro Display"', '"Poppins"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      fontSize: {
        'hero': ['4rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'hero-sm': ['2.5rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
      },

      // ============================================
      // BORDER RADIUS - Soft & Rounded
      // ============================================
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
        '4xl': '1.5rem',
        '5xl': '2rem',
        'soft': '2.5rem',
      },

      // ============================================
      // BOX SHADOW - Cinematic & Apple-Level Products
      // ============================================
      boxShadow: {
        'soft': '0 2px 15px rgba(152, 112, 112, 0.08)',
        'soft-md': '0 4px 20px rgba(152, 112, 112, 0.1)',
        'soft-lg': '0 8px 30px rgba(152, 112, 112, 0.12)',
        'soft-xl': '0 12px 40px rgba(152, 112, 112, 0.15)',
        'soft-2xl': '0 20px 50px rgba(152, 112, 112, 0.18)',
        'glow-blush': '0 0 40px rgba(219, 181, 181, 0.4)',
        'glow-rose': '0 0 40px rgba(195, 152, 152, 0.3)',
        'inner-soft': 'inset 0 2px 10px rgba(152, 112, 112, 0.06)',

        'glow-lavender': '0 0 40px rgba(200, 182, 255, 0.3)',
        'glow-mauve': '0 0 40px rgba(159, 107, 160, 0.25)',
        'inner-lavender': 'inset 0 2px 20px rgba(200, 182, 255, 0.15)',

        // Futuristic SaaS Theme
        'glow-electric': '0 0 40px rgba(59, 130, 246, 0.4)',
        'glow-lavenderglow': '0 0 40px rgba(167, 139, 250, 0.4)',

        // High-end Apple-Level Cinematic Lighting & Layering
        'glass-panel': '0 20px 40px -10px rgba(0, 0, 0, 0.5), 0 0 1px 1px rgba(255, 255, 255, 0.05)',
        'glass-panel-hover': '0 30px 60px -15px rgba(0, 0, 0, 0.7), 0 0 1px 1px rgba(255, 255, 255, 0.1), 0 0 40px rgba(59, 130, 246, 0.3)',
        'apple-card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        'apple-focus': '0 0 0 4px rgba(59, 130, 246, 0.4), 0 0 20px rgba(59, 130, 246, 0.2)',
        'cinematic-glow': '0 0 80px -10px rgba(59, 130, 246, 0.5), 0 0 40px -10px rgba(167, 139, 250, 0.4)',
        'inner-glass': 'inset 0 1px 1px rgba(255, 255, 255, 0.15), inset 0 -1px 1px rgba(0, 0, 0, 0.25)',
      },

      // ============================================
      // BACKGROUND IMAGES - Warm Gradients
      // ============================================
      backgroundImage: {
        // Legacy
        'gradient-cream': 'linear-gradient(180deg, #F1E5D1 0%, #FAF7F2 100%)',
        'gradient-warm': 'linear-gradient(135deg, #F1E5D1 0%, #FAF7F2 50%, #F1E5D1 100%)',
        'gradient-blush': 'linear-gradient(135deg, #F1E5D1 0%, #DBB5B5 100%)',
        'gradient-rose': 'linear-gradient(135deg, #DBB5B5 0%, #C39898 100%)',
        'gradient-hero': 'radial-gradient(ellipse at 50% 0%, rgba(219, 181, 181, 0.3) 0%, transparent 60%)',
        'gradient-radial-blush': 'radial-gradient(ellipse at center, rgba(219, 181, 181, 0.4) 0%, transparent 70%)',
        'gradient-radial-rose': 'radial-gradient(ellipse at center, rgba(195, 152, 152, 0.3) 0%, transparent 60%)',

        // New Lavender Theme
        'gradient-wellness': 'linear-gradient(to bottom right, #F5EDE3, #F4F0FF, #FFF8F5)',
        'gradient-lavender-peach': 'linear-gradient(135deg, #C8B6FF 0%, #FFC8B8 100%)',
        'gradient-mauve': 'linear-gradient(135deg, #9F6BA0 0%, #C8B6FF 100%)',
        'gradient-hero-lavender': 'radial-gradient(ellipse at 50% -20%, rgba(200, 182, 255, 0.4) 0%, transparent 60%)',
        'gradient-radial-lavender': 'radial-gradient(ellipse at center, rgba(200, 182, 255, 0.35) 0%, transparent 70%)',
        'gradient-radial-peach': 'radial-gradient(ellipse at center, rgba(255, 200, 184, 0.25) 0%, transparent 60%)',

        // Futuristic Theme
        'gradient-saas': 'linear-gradient(to bottom right, #0F172A, #0B1120, #0F172A)',
        'gradient-electric': 'linear-gradient(135deg, #3B82F6 0%, #A78BFA 100%)',
        'gradient-radial-electric': 'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.3) 0%, transparent 70%)',
        'gradient-radial-midnight': 'radial-gradient(ellipse at center, rgba(167, 139, 250, 0.2) 0%, transparent 70%)',
        'gradient-radial-spotlight': 'radial-gradient(ellipse at 50% -20%, rgba(59, 130, 246, 0.25) 0%, transparent 60%)',
      },

      // ============================================
      // ANIMATIONS - Soft & Gentle
      // ============================================
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out infinite 2s',
        'pulse-soft': 'pulse-soft 4s ease-in-out infinite',
        'fade-in': 'fade-in 0.4s ease-out',
        'fade-in-up': 'fade-in-up 0.5s ease-out',
        'fade-in-down': 'fade-in-down 0.5s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
        'gradient-shift': 'gradient-shift 8s ease-in-out infinite',
        'blob': 'blob 7s infinite',
        'blob-slow': 'blob 12s infinite',
        'tagline': 'tagline 0.5s ease-out',
        'spin-slow': 'spin 15s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.7' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-down': {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        tagline: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },

      // ============================================
      // BACKDROP BLUR
      // ============================================
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

export default config
