/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'navy': '#050507',
        'light-navy': '#101010',
        'lightest-navy': '#3d3a39',
        'slate-text': '#8b949e',
        'light-slate': '#b8b3b0',
        'lightest-slate': '#f2f2f2',
        'white-text': '#ffffff',
        'green-accent': '#00d992',
        'green-tint': 'rgba(0, 217, 146, 0.1)',
      },
      fontFamily: {
        display: ['system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'Ubuntu', 'Cantarell', '"Noto Sans"', 'Helvetica', 'Arial', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', '"Noto Sans"', 'sans-serif'],
        mono: ['SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', '"Courier New"', 'monospace'],
      },
      transitionTimingFunction: {
        'custom-ease': 'cubic-bezier(0.645, 0.045, 0.355, 1)',
      },
      transitionDuration: {
        '250': '250ms',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeInUp: 'fadeInUp 0.5s ease-out forwards',
      },
    },
  },
  plugins: [],
};
