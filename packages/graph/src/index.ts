// All 3 layers are public API.

// ─── Layer 1: Hook ───────────────────────────────────────────────────────────
// Max control. Bring your own renderer (SVG, Canvas, WebGL, D3).
export { useGraphLayout, computeGraphLayout } from './core/useGraphLayout';
export type {
  GraphNode,
  GraphEdge,
  GraphData,
  LayoutGraphNode,
  LayoutGraphEdge,
  GraphLayout,
  GraphLayoutOptions,
} from './core/useGraphLayout';

// ─── Layer 2: Headless ───────────────────────────────────────────────────────
// Full visual control via render props. Zero opinions on CSS.
export { GraphRoot, GraphEdges, GraphNodes, useGraph } from './headless';

// ─── Layer 3: Styled ─────────────────────────────────────────────────────────
// Drop-in default. Works with zero config.
export { Graph } from './Graph';
export type { GraphProps } from './Graph';
