// Layer 1: Pure logic — no JSX, no DOM, no styles.

import { useMemo } from 'react';

// ─── Public types ─────────────────────────────────────────────────────────────

export interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
}

export interface LayoutNode {
  id: string;
  label: string;
  x: number;
  y: number;
  depth: number;
  parentId?: string | undefined;
}

export interface LayoutEdge {
  id: string;
  fromId: string;
  toId: string;
  /** Source point — bottom-center of parent node */
  x1: number;
  y1: number;
  /** Target point — top-center of child node */
  x2: number;
  y2: number;
}

export interface TreeLayout {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  /** Total SVG width needed */
  width: number;
  /** Total SVG height needed */
  height: number;
}

/**
 * Optional overrides for the layout algorithm.
 *
 * Use these when your custom nodes are larger than the adaptive defaults
 * would allocate — e.g. a 60×28 rect needs at least hGap ≥ 68 and vGap ≥ 52.
 *
 * Any value you omit falls back to the adaptive calculation.
 */
export interface TreeLayoutOptions {
  /**
   * Minimum horizontal slot width (px) given to each leaf node.
   * The adaptive default shrinks with tree breadth but never below this value.
   * Set this to your node's rendered width + desired padding.
   *
   * @default adaptive (≥ 64)
   */
  hGap?: number;
  /**
   * Vertical distance (px) between depth levels.
   * The adaptive default grows with tree depth.
   * Set this to your node's rendered height + desired padding.
   *
   * @default adaptive (≥ 72)
   */
  vGap?: number;
  /**
   * Half-height of a node (px) used for edge attachment offsets.
   * For circular nodes this is the radius; for rect nodes use height/2.
   *
   * @default 18
   */
  nodeRadius?: number;
}

// ─── Tree measurement ─────────────────────────────────────────────────────────

interface TreeStats {
  totalDepth: number;
  maxBreadth: number;
  leafCount: number;
}

function measureTree(root: TreeNode): TreeStats {
  const perDepth: number[] = [];
  let leafCount = 0;

  const queue: Array<{ node: TreeNode; depth: number }> = [{ node: root, depth: 0 }];
  while (queue.length > 0) {
    const { node, depth } = queue.shift()!;
    perDepth[depth] = (perDepth[depth] ?? 0) + 1;
    const kids = node.children ?? [];
    if (kids.length === 0) leafCount++;
    kids.forEach((c) => queue.push({ node: c, depth: depth + 1 }));
  }

  return {
    totalDepth: perDepth.length,
    maxBreadth: Math.max(...perDepth),
    leafCount,
  };
}

// ─── Adaptive gap calculation ─────────────────────────────────────────────────
//
// H_GAP: horizontal slot size per leaf node.
//   • More nodes per row  → narrower slots, floor at 64 px.
//   • Fewer nodes per row → up to 96 px.
//   Any caller-supplied hGap acts as a hard minimum on top of this.
//
// V_GAP: vertical distance between depth levels.
//   • Deeper trees → more breathing room, capped at 128 px, floored at 72 px.

function adaptiveGaps(
  stats: TreeStats,
  overrides: Required<Pick<TreeLayoutOptions, 'hGap' | 'vGap'>>,
): { hGap: number; vGap: number } {
  // Adaptive horizontal: base 96 px, compressed for wide trees
  const adaptiveH = Math.round(96 / Math.pow(Math.max(1, stats.maxBreadth) / 5, 0.4));
  // Caller can raise the floor (e.g. for wide rect nodes) but never lower it below adaptive
  const hGap = Math.max(overrides.hGap, adaptiveH, 64);

  // Adaptive vertical: grows gently with depth
  const adaptiveV = Math.round(72 * Math.pow(stats.totalDepth / 3, 0.3));
  const vGap = Math.max(overrides.vGap, adaptiveV, 72);

  return { hGap: Math.round(hGap), vGap: Math.min(128, Math.round(vGap)) };
}

// ─── Subtree-width layout (Reingold–Tilford simplified) ───────────────────────
//
// Phase 1 — calcWidth (bottom-up):
//   Leaves receive `hGap` pixels each.
//   Internal nodes receive the sum of all their children's widths.
//   This means no two sibling subtrees ever share space.
//
// Phase 2 — place (top-down):
//   Each node is centered over its own allocated width span.
//   Children are placed left-to-right consuming their pre-measured widths.
//   Edges are built here using the exact center coordinates.

function compute(root: TreeNode, options: TreeLayoutOptions = {}): TreeLayout {
  const stats = measureTree(root);

  const { hGap, vGap } = adaptiveGaps(stats, {
    hGap: options.hGap ?? 0,   // 0 → use purely adaptive
    vGap: options.vGap ?? 0,
  });

  const nodeRadius = options.nodeRadius ?? 18;

  // ── Phase 1: measure subtree pixel widths ───────────────────────────────────

  const subtreeWidth = new Map<TreeNode, number>();

  function calcWidth(node: TreeNode): number {
    const kids = node.children ?? [];
    const w = kids.length === 0
      ? hGap
      : kids.reduce((acc, c) => acc + calcWidth(c), 0);
    subtreeWidth.set(node, w);
    return w;
  }

  const totalWidth = calcWidth(root);

  // ── Phase 2: assign pixel coordinates ──────────────────────────────────────

  const nodesOut: LayoutNode[] = [];
  const edgesOut: LayoutEdge[] = [];

  function place(
    node: TreeNode,
    leftEdge: number,
    depth: number,
    parentId?: string,
  ): number {
    const myWidth = subtreeWidth.get(node)!;
    const centerX = leftEdge + myWidth / 2;
    const y = depth * vGap + vGap / 2;

    const layoutNode: LayoutNode = { id: node.id, label: node.label, x: centerX, y, depth };
    if (parentId !== undefined) layoutNode.parentId = parentId;
    nodesOut.push(layoutNode);

    let cursor = leftEdge;
    (node.children ?? []).forEach((child) => {
      const childCenterX = place(child, cursor, depth + 1, node.id);
      const childY = (depth + 1) * vGap + vGap / 2;

      edgesOut.push({
        id: `${node.id}→${child.id}`,
        fromId: node.id,
        toId: child.id,
        x1: centerX,
        y1: y + nodeRadius,
        x2: childCenterX,
        y2: childY - nodeRadius,
      });

      cursor += subtreeWidth.get(child)!;
    });

    return centerX;
  }

  place(root, 0, 0);

  return {
    nodes: nodesOut,
    edges: edgesOut,
    width: totalWidth,
    height: stats.totalDepth * vGap,
  };
}

// ─── Public compute function (pure — no React) ────────────────────────────────
//
// Use this when you need the layout outside of React (Node.js, Canvas, SSR).
// The hook below wraps this in useMemo.

/**
 * Pure layout function — same algorithm as useTreeLayout, no React required.
 * Useful for testing, SSR, Canvas-only renderers, and framework-agnostic use.
 *
 * @example
 * const layout = computeTreeLayout(myTree);
 * const layout = computeTreeLayout(myTree, { hGap: 96, vGap: 56 });
 */
export function computeTreeLayout(root: TreeNode, options?: TreeLayoutOptions): TreeLayout {
  return compute(root, options);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Computes the 2-D layout for a tree structure.
 * Result is memoized — only recomputed when `data` or `options` change.
 *
 * Uses a Reingold–Tilford style subtree-width algorithm:
 *  • Each leaf gets exactly `hGap` px of horizontal space.
 *  • Each internal node is centered over its children's combined span.
 *  • `hGap` and `vGap` adapt to tree breadth/depth by default.
 *    Pass explicit values via `options` when your custom nodes need more room.
 *
 * @example
 * // Default — works for circle nodes up to ~60 px diameter
 * const layout = useTreeLayout(data);
 *
 * // Custom rect nodes 80×32 px — tell the layout how much room to reserve
 * const layout = useTreeLayout(data, { hGap: 96, vGap: 56, nodeRadius: 16 });
 */
export function useTreeLayout(data: TreeNode, options?: TreeLayoutOptions): TreeLayout {
  return useMemo(() => compute(data, options), [data, options]);
}
