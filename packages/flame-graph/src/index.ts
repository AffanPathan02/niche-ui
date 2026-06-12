// All 3 layers are public API.

// ─── Layer 1: Hook ───────────────────────────────────────────────────────────
// Max control. Bring your own renderer (SVG, Canvas, WebGL, D3).
export { useFlameLayout, computeFlameLayout } from './core/useFlameLayout';
export type {
  FlameSample,
  FlameFrame,
  FlameLayout,
  FlameLayoutOptions,
} from './core/useFlameLayout';

// ─── Layer 2: Headless ───────────────────────────────────────────────────────
// Full visual control via render props. Zero opinions on CSS.
export { FlameRoot, FlameFrames, useFlame } from './headless';

// ─── Layer 3: Styled ─────────────────────────────────────────────────────────
// Drop-in default. Works with zero config.
export { FlameGraph } from './FlameGraph';
export type { FlameGraphProps } from './FlameGraph';
