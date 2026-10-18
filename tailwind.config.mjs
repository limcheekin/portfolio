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
        'sky': '#38bdf8',
        'graphite': '#141417',
        'light-graphite': '#1c1c20',
      },
      // Work track pin breakpoint; keep in sync with MQ.pin in src/lib/motion.ts.
      // Raw screens turn off Tailwind's max-* variants (max-sm: etc.), so write responsive classes mobile-first.
      screens: {
        pin: { raw: '(min-width: 768px) and (min-height: 560px)' },
        nopin: { raw: 'not all and (min-width: 768px) and (min-height: 560px)' },
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
    },
  },
  plugins: [],
};
