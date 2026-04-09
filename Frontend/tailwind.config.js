/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        serif: ['"Playfair Display"', 'serif'],
      },
      colors: {
        // Redefine legacy variables used in components just to avoid immediate breakage
        // but alias them to our new aesthetics
        navy: {
          900: '#0a0a0a',
          800: '#121110',
          700: '#1c1b1a',
        },
        gold: '#b89a7a',
        // Our new strict palette
        charcoal: {
          950: '#0a0a0a',
          900: '#121110',
          800: '#1c1b1a',
          700: '#2b2a28',
        },
        bronze: {
          DEFAULT: '#b89a7a',
          light: '#d6bfa3',
          dark: '#8b7053',
        },
        warmGrey: {
          100: '#f2f0e9',
          200: '#e5e1d8',
          300: '#d1ccc0',
          400: '#b8b2a5',
          500: '#8b8a88',
        }
      },
      animation: {
        'fadeUp': 'fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fadeUpSlow': 'fadeUp 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fadeIn': 'fadeIn 0.8s ease-out forwards',
        'float': 'float 8s ease-in-out infinite',
        'subtlePulse': 'subtlePulse 4s ease-in-out infinite',
        'gradient': 'gradient 8s linear infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        subtlePulse: {
          '0%, 100%': { opacity: '0.8', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.02)' },
        },
        gradient: {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center',
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center',
          },
        },
      },
    },
  },
  plugins: [],
};