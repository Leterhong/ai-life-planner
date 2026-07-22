/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Neumorphism base color - soft off-white/light gray
        neu: {
          bg: '#e0e5ec',        // Base background
          bgDark: '#d1d9e6',    // Darker variant
          light: '#ffffff',     // Light shadow
          dark: '#a3b1c6',      // Dark shadow
          text: '#2d3748',      // Primary text
          textLight: '#718096', // Secondary text
          primary: '#6366f1',   // Accent indigo
          primaryLight: '#818cf8',
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444',
        },
      },
      boxShadow: {
        // Neumorphism shadows
        'neu': '8px 8px 16px #a3b1c6, -8px -8px 16px #ffffff',
        'neu-sm': '4px 4px 8px #a3b1c6, -4px -4px 8px #ffffff',
        'neu-xs': '2px 2px 4px #a3b1c6, -2px -2px 4px #ffffff',
        'neu-inset': 'inset 4px 4px 8px #a3b1c6, inset -4px -4px 8px #ffffff',
        'neu-inset-sm': 'inset 2px 2px 4px #a3b1c6, inset -2px -2px 4px #ffffff',
        'neu-pressed': 'inset 6px 6px 12px #a3b1c6, inset -6px -6px 12px #ffffff',
        'neu-primary': '6px 6px 12px #a3b1c6, -6px -6px 12px #ffffff, 0 0 0 3px rgba(99, 102, 241, 0.1)',
      },
      borderRadius: {
        'neu': '16px',
        'neu-lg': '24px',
        'neu-xl': '32px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
