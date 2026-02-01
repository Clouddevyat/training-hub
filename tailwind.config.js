/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary — Wasatch Granite
        slate: {
          50: '#EDF1F4',
          100: '#D6DEE5',
          200: '#B4C0CC',
          300: '#8E9DAB',
          400: '#6B7A8A',
          500: '#4E5D6C',
          600: '#3A4755',
          700: '#2C3640',
          800: '#242A32',
          900: '#1A1E24',
        },
        // Accent — Sandstone Amber
        amber: {
          50: '#FAF3EA',
          100: '#F4E3CA',
          200: '#EBCFA5',
          300: '#E0B87E',
          400: '#D4A05A',
          500: '#C4883A',
          600: '#B47A2E',
          700: '#9B6424',
          800: '#7A4E1A',
          900: '#5C3A12',
        },
        // Secondary — Sage Field
        sage: {
          50: '#F0F3EE',
          100: '#DFE6DB',
          200: '#C7D1BF',
          300: '#ADBBA3',
          400: '#93A488',
          500: '#7A8B6F',
          600: '#617753',
          700: '#4F6344',
          800: '#3E4E36',
          900: '#2E3A28',
        },
        // Functional
        'warm-white': '#F5F2ED',
        'cool-white': '#EDF1F4',
        'near-black': '#1A1E24',
        // Status
        critical: '#C45A3A',
        warning: '#C4883A',
        nominal: '#5A8B5E',
        info: '#4A7A9B',
      },
      fontFamily: {
        sans: ['IBM Plex Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
}
