/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1E56E0',
          hover: '#173F9E',
          50: '#EAF1FD',
          100: '#D6E3FB',
        },
        surface: '#FFFFFF',
        page: '#F7F9FC',
        border: '#E2E8F0',
        ink: '#101828',
        muted: '#475467',
        success: '#067647',
        warning: '#B45309',
        danger: '#B42318',
        alice: {
          50: '#f4f8fc',
          100: '#eaf2f9',
          200: '#d5e4f4',
          300: '#b5d0ed',
          400: '#8eb6e3',
          500: '#6497d7',
          600: '#4b7cc6',
          700: '#3c63a5',
          800: '#345287',
          900: '#2f466e',
          950: '#1d2c47',
        },
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
        glow: '0 0 20px -3px rgba(79, 70, 229, 0.15)',
      },
      fontSize: {
        sm: ['0.8rem', { lineHeight: '1.4' }],     // 12.8px
        base: ['1rem', { lineHeight: '1.6' }],      // 16px
        lg: ['1.25rem', { lineHeight: '1.4' }],     // 20px
        xl: ['1.5625rem', { lineHeight: '1.3' }],   // 25px
        '2xl': ['1.9375rem', { lineHeight: '1.25' }], // 31px
        '3xl': ['2.4375rem', { lineHeight: '1.2' }],  // 39px
      },
    },
  },
  plugins: [],
}
