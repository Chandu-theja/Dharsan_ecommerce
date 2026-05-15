import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand Navy
        navy: {
          50:  '#E8EBF2',
          100: '#C5CEDE',
          200: '#9FADC7',
          300: '#798CB0',
          400: '#5A73A0',
          500: '#3D5A8E',
          600: '#2C4275',
          700: '#1C2E5C',
          800: '#111D3D',
          900: '#0A1128',
          950: '#060B1A',
        },
        // Brand Gold
        gold: {
          50:  '#FDF8EC',
          100: '#F9EDCB',
          200: '#F4DFA0',
          300: '#EDCC6D',
          400: '#E5B83A',
          500: '#C8991E',
          600: '#A97B12',
          700: '#8A5E0B',
          800: '#6B4508',
          900: '#4D2F05',
          950: '#2E1A02',
        },
        // Cream background
        cream: {
          50:  '#FDFCF9',
          100: '#FAF7F0',
          200: '#F5EFE1',
          300: '#EDE2CC',
          400: '#DFD0AF',
          500: '#CCBA8F',
        },
      },
      fontFamily: {
        display: ['var(--font-cormorant)', 'Georgia', 'serif'],
        body: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #C8991E 0%, #E5B83A 50%, #C8991E 100%)',
        'navy-gradient': 'linear-gradient(135deg, #0A1128 0%, #1C2E5C 100%)',
        'hero-gradient': 'linear-gradient(160deg, #060B1A 0%, #1C2E5C 60%, #2C4275 100%)',
      },
      boxShadow: {
        'gold': '0 4px 24px rgba(200, 153, 30, 0.3)',
        'gold-lg': '0 8px 40px rgba(200, 153, 30, 0.4)',
        'navy': '0 4px 24px rgba(10, 17, 40, 0.3)',
        'card': '0 2px 16px rgba(10, 17, 40, 0.08)',
        'card-hover': '0 8px 32px rgba(10, 17, 40, 0.16)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'shimmer': 'shimmer 1.5s infinite',
        'marquee': 'marquee 30s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
