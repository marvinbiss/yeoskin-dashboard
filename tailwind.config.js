/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // ============================================
      // YEOSKIN BRAND COLORS
      // Premium K-Beauty inspired palette
      // ============================================
      colors: {
        // Primary Brand - Rose Gold / Soft Pink
        brand: {
          50: '#FFF5F7',
          100: '#FFE8ED',
          200: '#FFD4DE',
          300: '#FFB3C5',
          400: '#FF8AA8',
          500: '#FF6B9D',  // Primary
          600: '#F04D7F',
          700: '#D93A6A',
          800: '#B32D55',
          900: '#8F2445',
          950: '#5C1129',
        },
        // Secondary - Lavender Luxury
        lavender: {
          50: '#FAF5FF',
          100: '#F3E8FF',
          200: '#E9D5FF',
          300: '#D8B4FE',
          400: '#C084FC',
          500: '#A855F7',
          600: '#9333EA',
          700: '#7C22CE',
          800: '#6B21A8',
          900: '#581C87',
        },
        // Accent - Mint Fresh
        mint: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
        // Warm Accent - Peach Glow
        peach: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
        },
        // Neutral - Sophisticated Grays
        neutral: {
          0: '#FFFFFF',
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0A0A0A',
        },
        // Semantic Colors
        success: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
        },
        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
        },
        error: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
        },
        // Legacy alias
        primary: {
          50: '#FFF5F7',
          100: '#FFE8ED',
          200: '#FFD4DE',
          300: '#FFB3C5',
          400: '#FF8AA8',
          500: '#FF6B9D',
          600: '#F04D7F',
          700: '#D93A6A',
          800: '#B32D55',
          900: '#8F2445',
        },
        danger: {
          50: '#FEF2F2',
          500: '#EF4444',
          600: '#DC2626',
        },
      },
      // ============================================
      // TYPOGRAPHY
      // ============================================
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        // Display sizes
        'display-2xl': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-xl': ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-lg': ['3rem', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '600' }],
        'display-md': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '600' }],
        'display-sm': ['1.875rem', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }],
        'display-xs': ['1.5rem', { lineHeight: '1.4', fontWeight: '600' }],
      },
      // ============================================
      // SPACING & SIZING
      // ============================================
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
      // ============================================
      // SHADOWS - Premium depth
      // ============================================
      boxShadow: {
        // Subtle shadows
        'soft-xs': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'soft-sm': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)',
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        'soft-md': '0 6px 12px -2px rgba(0, 0, 0, 0.06), 0 3px 6px -2px rgba(0, 0, 0, 0.04)',
        'soft-lg': '0 10px 25px -3px rgba(0, 0, 0, 0.07), 0 4px 10px -2px rgba(0, 0, 0, 0.04)',
        'soft-xl': '0 20px 40px -5px rgba(0, 0, 0, 0.08), 0 8px 16px -4px rgba(0, 0, 0, 0.04)',
        // Brand glow
        'brand-glow': '0 0 20px rgba(255, 107, 157, 0.25)',
        'brand-glow-lg': '0 0 40px rgba(255, 107, 157, 0.35)',
        // Card shadows
        'card': '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.06), 0 12px 28px rgba(0,0,0,0.08)',
        // Button shadows
        'button': '0 1px 2px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.05)',
        'button-hover': '0 4px 8px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
      },
      // ============================================
      // BORDER RADIUS - Refined curves
      // ============================================
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      // ============================================
      // ANIMATIONS - Smooth & Premium
      // ============================================
      animation: {
        // Entrance animations
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'fade-in-down': 'fadeInDown 0.6s ease-out forwards',
        'slide-in-right': 'slideInRight 0.5s ease-out forwards',
        'slide-in-left': 'slideInLeft 0.5s ease-out forwards',
        'scale-in': 'scaleIn 0.3s ease-out forwards',
        // Looping animations
        'float': 'float 6s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'gradient-shift': 'gradientShift 8s ease infinite',
        // Micro-interactions
        'bounce-subtle': 'bounceSubtle 0.4s ease-out',
        'wiggle': 'wiggle 0.5s ease-in-out',
        // Loading
        'spin-slow': 'spin 2s linear infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255, 107, 157, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(255, 107, 157, 0.6)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-3deg)' },
          '75%': { transform: 'rotate(3deg)' },
        },
      },
      // ============================================
      // TRANSITIONS
      // ============================================
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
        '400': '400ms',
      },
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'smooth-out': 'cubic-bezier(0, 0, 0.2, 1)',
      },
      // ============================================
      // BACKDROP BLUR
      // ============================================
      backdropBlur: {
        xs: '2px',
      },
      // ============================================
      // GRADIENTS (via backgroundImage)
      // ============================================
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #FF6B9D 0%, #C084FC 100%)',
        'gradient-brand-subtle': 'linear-gradient(135deg, #FFF5F7 0%, #FAF5FF 100%)',
        'gradient-glow': 'radial-gradient(circle at center, rgba(255,107,157,0.15) 0%, transparent 70%)',
        'gradient-mesh': 'radial-gradient(at 40% 20%, #FFF5F7 0px, transparent 50%), radial-gradient(at 80% 0%, #FAF5FF 0px, transparent 50%), radial-gradient(at 0% 50%, #ECFDF5 0px, transparent 50%)',
        'shimmer': 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
      },
    },
  },
  plugins: [],
}
