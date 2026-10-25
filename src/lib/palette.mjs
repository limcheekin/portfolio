// Colour tokens, documented in DESIGN.md ("Portfolio tokens"). tailwind.config.mjs turns them into Tailwind
// colours, shadows and gradients; canvas code that cannot use classes (DotGrid) imports them directly.

export const COLORS = {
  // DESIGN.md core palette
  navy: '#050507',
  'light-navy': '#101010',
  'lightest-navy': '#3d3a39',
  'slate-text': '#8b949e',
  'light-slate': '#b8b3b0',
  'lightest-slate': '#f2f2f2',
  'white-text': '#ffffff',
  'green-accent': '#00d992',
  danger: '#fb565b', // Danger Coral: form errors and the FIRE / DO NOT BUILD verdict
  amber: '#f5a524', // the TRAIN verdict only
  // Redesign additions: sky marks open-source work only
  sky: '#38bdf8',
  // Home surfaces, darkest to lightest
  well: '#09090b',
  card: '#0e0e10',
  graphite: '#141417',
  'light-graphite': '#1c1c20',
  edge: '#26262a',
  'edge-strong': '#2e2e33',
  // Illustration tints (enterprise green, open-source sky)
  'green-deep': '#0f2a20',
  'green-dim': '#1d4d3a',
  'green-pale': '#c9f5e4',
  'sky-deep': '#0c1f2a',
  'sky-dim': '#1e3a4a',
  'sky-pale': '#cbeeff',
  // Print set: the HIRE check PDF report, on white paper (verdict inks are darkened to read on white)
  'print-ink': '#16161a',
  'print-muted': '#5b6068',
  'print-rule': '#d9d9de',
  'print-paper': '#ffffff',
  'print-green': '#047857',
  'print-amber': '#b45309',
  'print-coral': '#d4323a',
};

/**
 * `#rrggbb` plus an alpha as an `rgba()` string.
 * @param {string} hex
 * @param {number} alpha
 */
export function rgba(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}
