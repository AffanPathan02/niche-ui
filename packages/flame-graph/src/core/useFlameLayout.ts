// Layer 1: Pure logic — no JSX, no DOM, no styles.
// Implements the flame graph layout algorithm as described by Brendan Gregg.

import { useMemo } from 'react';

// ─── Public types ─────────────────────────────────────────────────────────────

/**
 * A node in the input flame graph data tree.
 * `value` represents the weight of this node (e.g. sample count, duration ms).
 * The total value of a node includes itself AND all its descendants.
 */
export interface FlameSample {
  /** Unique identifier for this frame */
  id: string;
  /** Display label (function name, module, etc.) */
  label: string;
  /**
   * The self-weight of this node (e.g. on-CPU samples, blocked time ms).
   * Does NOT include children — the layout engine sums descendants automatically.
   * For intermediate nodes with no self-cost, set to 0.
   */
  value: number;
  children?: FlameSample[];
}

/**
 * A single laid-out frame in the flame graph.
 * All coordinates are in SVG/canvas pixel space.
 */
export interface FlameFrame {
  id: string;
  label: string;
  /** Self value of this node (from FlameSample.value) */
  selfValue: number;
  /** Total value = selfValue + sum of all descendants' values */
  totalValue: number;
  /** Root's totalValue — used to compute percentage */
  rootValue: number;
  /** 0-indexed depth from the root */
  depth: number;
  /** Left edge in pixels */
  x: number;
  /** Width in pixels, proportional to totalValue / rootValue */
  width: number;
  /** Top edge in pixels (depth * rowHeight) */
  y: number;
  /** The id of this frame's parent, undefined for root */
  parentId?: string;
}

/** Output of the flame layout algorithm */
export interface FlameLayout {
  /** All frames in the graph, including hidden ones (width < minWidth) */
  frames: FlameFrame[];
  /**
   * Frames that should actually be rendered.
   * Frames narrower than `minWidth` are filtered out here.
   */
  visibleFrames: FlameFrame[];
  /** Total pixel width of the graph */
  totalWidth: number;
  /** Total pixel height (maxDepth + 1) * rowHeight */
  totalHeight: number;
  /** Deepest depth level in the data */
  maxDepth: number;
}

/**
 * Optional overrides for the layout algorithm.
 */
export interface FlameLayoutOptions {
  /**
   * Height in pixels of each depth row.
   * @default 28
   */
  rowHeight?: number;
  /**
   * Total pixel width of the flame graph canvas.
   * @default 800
   */
  totalWidth?: number;
  /**
   * Frames narrower than this many pixels are excluded from `visibleFrames`.
   * @default 1
   */
  minWidth?: number;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * DFS pass to accumulate total values bottom-up.
 * Returns the total value of the subtree rooted at `node`.
 */
function sumValues(node: FlameSample, cache: Map<string, number>): number {
  if (cache.has(node.id)) return cache.get(node.id)!;

  const childSum = (node.children ?? []).reduce((acc, child) => acc + sumValues(child, cache), 0);
  const total = node.value + childSum;
  cache.set(node.id, total);
  return total;
}

/**
 * DFS pass to place frames in pixel coordinates.
 * x grows left-to-right proportionally to totalValue.
 */
function placeFrames(
  node: FlameSample,
  depth: number,
  xOffset: number,
  rootValue: number,
  totalWidth: number,
  rowHeight: number,
  totalCache: Map<string, number>,
  out: FlameFrame[],
  parentId?: string,
): void {
  const totalValue = totalCache.get(node.id)!;
  const width = (totalValue / rootValue) * totalWidth;
  const x = xOffset;
  const y = depth * rowHeight;

  const frame: FlameFrame = {
    id: node.id,
    label: node.label,
    selfValue: node.value,
    totalValue,
    rootValue,
    depth,
    x,
    y,
    width,
    ...(parentId !== undefined ? { parentId } : {}),
  };
  out.push(frame);

  // Place children left-to-right within this frame's x span
  let cursor = xOffset;
  for (const child of node.children ?? []) {
    placeFrames(
      child,
      depth + 1,
      cursor,
      rootValue,
      totalWidth,
      rowHeight,
      totalCache,
      out,
      node.id,
    );
    const childTotal = totalCache.get(child.id)!;
    cursor += (childTotal / rootValue) * totalWidth;
  }
}

// ─── Core compute function ────────────────────────────────────────────────────

function compute(root: FlameSample, options: FlameLayoutOptions = {}): FlameLayout {
  const rowHeight = options.rowHeight ?? 28;
  const totalWidth = options.totalWidth ?? 800;
  const minWidth = options.minWidth ?? 1;

  // Phase 1: accumulate total values
  const totalCache = new Map<string, number>();
  const rootValue = sumValues(root, totalCache);

  // Phase 2: lay out frames
  const frames: FlameFrame[] = [];
  placeFrames(root, 0, 0, rootValue, totalWidth, rowHeight, totalCache, frames);

  // Compute maxDepth
  const maxDepth = frames.reduce((m, f) => Math.max(m, f.depth), 0);

  const visibleFrames = frames.filter((f) => f.width >= minWidth);

  return {
    frames,
    visibleFrames,
    totalWidth,
    totalHeight: (maxDepth + 1) * rowHeight,
    maxDepth,
  };
}

// ─── Public compute function (pure — no React) ────────────────────────────────
//
// Use when you need the layout outside of React (Node.js, Canvas, SSR).

/**
 * Pure layout function — same algorithm as useFlameLayout, no React required.
 * Useful for testing, SSR, Canvas-only renderers, and framework-agnostic use.
 *
 * Frames are laid out with:
 *  • y-axis = depth (root at top, leaves at bottom) — icicle / top-down layout.
 *    Flip via CSS `transform: scaleY(-1)` on the SVG to get classic flame-up style.
 *  • x-axis = proportional to totalValue; siblings ordered left-to-right as
 *    they appear in the input data.
 *
 * @example
 * const layout = computeFlameLayout(myData);
 * const layout = computeFlameLayout(myData, { rowHeight: 24, totalWidth: 1200 });
 */
export function computeFlameLayout(root: FlameSample, options?: FlameLayoutOptions): FlameLayout {
  return compute(root, options);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Computes the 2-D layout for a flame graph.
 * Result is memoized — only recomputed when `data` or `options` change.
 *
 * @example
 * const layout = useFlameLayout(profileData);
 * const layout = useFlameLayout(profileData, { rowHeight: 24, totalWidth: 1000 });
 */
export function useFlameLayout(data: FlameSample, options?: FlameLayoutOptions): FlameLayout {
  return useMemo(() => compute(data, options), [data, options]);
}
