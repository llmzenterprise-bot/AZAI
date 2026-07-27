import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0a0620',
        'bg-2': '#0f0a2b',
        panel: '#141033',
        'panel-2': '#1b1547',
        ink: '#f2f2fb',
        muted: '#a7a4cf',
        cyan: '#54ecff',
        violet: '#a581ff',
        magenta: '#ff6fd4',
        lime: '#8ff5ba',
        amber: '#ffd76f',
        // calm app surfaces
        'app-bg': '#f6f7fb',
        'app-panel': '#ffffff',
        'app-ink': '#171528',
        'app-muted': '#6a6785',
        'app-line': '#e7e7f0',
        'app-accent': '#8e75ff',
      },
      borderColor: {
        line: 'rgba(150,130,255,.16)',
      },
      backgroundImage: {
        grad: 'linear-gradient(120deg,#54ecff,#a581ff 48%,#ff6fd4)',
        'grad-action': 'linear-gradient(120deg,#8ff5ba,#ffd76f)',
      },
      keyframes: {
        shine: { to: { backgroundPosition: '200% center' } },
        float: { '0%,100%': { transform: 'translate(0,0)' }, '50%': { transform: 'translate(30px,-24px)' } },
        fade: { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'none' } },
        pulseMic: { '0%,100%': { boxShadow: '0 0 0 0 rgba(255,111,212,.5)' }, '50%': { boxShadow: '0 0 0 14px rgba(255,111,212,0)' } },
        breathe: { '0%,100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.12)' } },
      },
      animation: {
        shine: 'shine 6s linear infinite',
        float: 'float 20s ease-in-out infinite',
        fade: 'fade .4s ease',
        pulseMic: 'pulseMic 1s infinite',
        breathe: 'breathe 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
