// All 3 layers are public API.

// ─── Layer 1: Hook ───────────────────────────────────────────────────────────
// Max control. Bring your own renderer (SVG, Canvas, WebGL, D3).
export { useTreeLayout, computeTreeLayout } from './core/useTreeLayout';
export type {
  TreeNode,
  LayoutNode,
  LayoutEdge,
  TreeLayout,
  TreeLayoutOptions,
} from './core/useTreeLayout';

// ─── Layer 2: Headless ───────────────────────────────────────────────────────
// Full visual control via render props. Zero opinions on CSS.
export { TreeRoot, TreeEdges, TreeNodes, useTree } from './headless';

// ─── Layer 3: Styled ─────────────────────────────────────────────────────────
// Drop-in default. Works with zero config.
export { Tree } from './Tree';
export type { TreeProps } from './Tree';
