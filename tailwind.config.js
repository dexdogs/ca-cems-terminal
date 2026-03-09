/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        term: {
          bg: '#0a0a0a',
          surface: '#0d0d0d',
          border: '#1a1a1a',
          border2: '#2a2a2a',
          muted: '#444',
          dim: '#666',
          text: '#c8c8c8',
          bright: '#e0e0e0',
          accent: '#ff8c00',
          green: '#22c55e',
          red: '#ef4444',
          blue: '#3b82f6',
          purple: '#a855f7',
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', '"Fira Code"', 'monospace'],
      },
    },
  },
  plugins: [],
};
