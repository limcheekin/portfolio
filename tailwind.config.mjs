import { COLORS, rgba } from './src/lib/palette.mjs';

const GREEN = COLORS['green-accent'];

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ...COLORS,
        'green-tint': rgba(GREEN, 0.1),
      },
      // Multi-layer or tinted shadows and gradients built from the palette (DESIGN.md, "Portfolio tokens").
      boxShadow: {
        console: `0 0 0 1px ${rgba(GREEN, 0.06)}, 0 30px 80px rgba(0, 0, 0, 0.6), 0 0 80px ${rgba(GREEN, 0.08)}`,
        'glow-green': `0 0 60px ${rgba(GREEN, 0.06)}`,
        'glow-sky': `0 0 60px ${rgba(COLORS.sky, 0.06)}`,
        halo: `0 0 0 4px ${rgba(GREEN, 0.12)}`,
        magnet: `0 10px 40px ${rgba(GREEN, 0.25)}`,
        scan: `0 0 12px ${GREEN}`,
        spark: `0 0 10px ${COLORS.sky}`,
        'doc-lines': [9, 18, 27].map((y) => `0 ${y}px 0 ${COLORS['edge-strong']}`).join(', '),
      },
      backgroundImage: {
        'row-tint': `linear-gradient(90deg, ${rgba(GREEN, 0.06)}, transparent 70%)`,
        'contact-glow': `radial-gradient(circle, ${rgba(GREEN, 0.1)}, transparent 60%)`,
        'dot-pattern': `radial-gradient(circle at 1px 1px, ${COLORS['light-graphite']} 1px, transparent 0)`,
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
