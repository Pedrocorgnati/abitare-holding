/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#0f0f0f',
          alt: '#101010',
        },
        surface: {
          DEFAULT: '#2a2a2a',
          elevated: '#373737',
        },
        accent: {
          DEFAULT: '#C9A962',
          hover: '#D4B87A',
          active: '#B8983F',
          light: 'rgba(201, 169, 98, 0.12)',
        },
        text: {
          primary: '#d6d6d6',
          secondary: '#919191',
        },
        border: {
          DEFAULT: '#404040',
          subtle: '#2a2a2a',
        },
        success: '#4CAF50',
        warning: '#F59E0B',
        error: '#EF5350',
        info: '#3B82F6',
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        body: ['Manrope', 'Helvetica Neue', 'Helvetica', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        '5xl': ['3.5rem', { lineHeight: '1.1' }],
        '4xl': ['2.625rem', { lineHeight: '1.2' }],
        '3xl': ['1.875rem', { lineHeight: '1.3' }],
      },
      borderRadius: {
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
        md: '0 4px 12px rgba(0, 0, 0, 0.4)',
        lg: '0 10px 24px rgba(0, 0, 0, 0.45)',
        xl: '0 16px 32px rgba(0, 0, 0, 0.5)',
        '2xl': '0 24px 48px rgba(0, 0, 0, 0.55)',
      },
      transitionDuration: {
        fast: '150ms',
        normal: '300ms',
        slow: '500ms',
      },
      animation: {
        'fade-in-up': 'fadeInUp 500ms ease-out forwards',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
