// Layer 1: Pure logic — no JSX, no DOM, no styles.
// Implements a Fruchterman–Reingold force-directed graph layout algorithm.

import { useMemo } from 'react';

// ─── Public types ─────────────────────────────────────────────────────────────

/** A node in the input graph. */
export interface GraphNode {
  id: string;
  label: string;
}

/** A directed or undirected edge in the input graph. */
export interface GraphEdge {
  /** Unique identifier for this edge */
  id: string;
  /** ID of the source node */
  source: string;
  /** ID of the target node */
  target: string;
}

/** Input graph data passed to the layout hook or function. */
export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/** A node with computed pixel coordinates. */
export interface LayoutGraphNode {
  id: string;
  label: string;
  /** Center X in pixels */
  x: number;
  /** Center Y in pixels */
  y: number;
}

/** An edge with computed pixel endpoints. */
export interface LayoutGraphEdge {
  id: string;
  source: string;
  target: string;
  /** X of the source node center */
  x1: number;
  /** Y of the source node center */
  y1: number;
  /** X of the target node center */
  x2: number;
  /** Y of the target node center */
  y2: number;
}

/** Output of the graph layout algorithm. */
export interface GraphLayout {
  nodes: LayoutGraphNode[];
  edges: LayoutGraphEdge[];
  /** Total canvas width needed */
  width: number;
  /** Total canvas height needed */
  height: number;
}

/**
 * Optional overrides for the layout algorithm.
 */
export interface GraphLayoutOptions {
  /**
   * Canvas width in pixels.
   * @default 800
   */
  width?: number;
  /**
   * Canvas height in pixels.
   * @default 600
   */
  height?: number;
  /**
   * Number of force simulation iterations.
   * Higher = better layout, slower compute. Diminishing returns past ~300.
   * @default 200
   */
  iterations?: number;
  /**
   * Node radius in px — used to clamp positions so nodes stay inside the canvas.
   * @default 20
   */
  nodeRadius?: number;
  /**
   * Optional seed for the initial node positions (circle layout).
   * Changing this lets you produce different but deterministic layouts.
   * @default 0
   */
  seed?: number;
}

// ─── Internal simulation state ────────────────────────────────────────────────

interface SimNode {
  id: string;
  label: string;
  x: number;
  y: number;
  dx: number; // accumulated displacement this iteration
  dy: number;
}

// ─── Fruchterman–Reingold helpers ─────────────────────────────────────────────

/**
 * Natural spacing constant: the ideal edge length.
 * k = C * sqrt(area / N), C ≈ 1 for balanced graphs.
 */
function springConstant(area: number, nodeCount: number): number {
  return Math.sqrt(area / Math.max(1, nodeCount));
}

/** Repulsive force between two nodes: f = k² / dist */
function repulsiveForce(dist: number, k: number): number {
  return (k * k) / Math.max(dist, 0.01);
}

/** Attractive (spring) force along an edge: f = dist² / k */
function attractiveForce(dist: number, k: number): number {
  return (dist * dist) / Math.max(k, 0.01);
}

// ─── Core compute function ────────────────────────────────────────────────────

function compute(data: GraphData, options: GraphLayoutOptions = {}): GraphLayout {
  const W = options.width ?? 800;
  const H = options.height ?? 600;
  const ITER = options.iterations ?? 200;
  const R = options.nodeRadius ?? 20;
  const SEED = options.seed ?? 0;

  const { nodes: inputNodes, edges: inputEdges } = data;
  const N = inputNodes.length;

  if (N === 0) {
    return { nodes: [], edges: [], width: W, height: H };
  }

  // ── Phase 1: Initialise positions on a circle ─────────────────────────────
  //
  // Starting on a circle avoids degenerate all-at-origin initial states.
  // The seed offset rotates the circle so consumers can get different
  // (but still deterministic) layouts by passing a different seed.

  const cx = W / 2;
  const cy = H / 2;
  const initRadius = Math.min(W, H) * 0.38;

  const sim: SimNode[] = inputNodes.map((n, i) => {
    const angle = (2 * Math.PI * i) / N + SEED;
    return {
      id: n.id,
      label: n.label,
      x: cx + initRadius * Math.cos(angle),
      y: cy + initRadius * Math.sin(angle),
      dx: 0,
      dy: 0,
    };
  });

  // Build an index for O(1) node lookup
  const nodeIndex = new Map<string, SimNode>();
  for (const n of sim) nodeIndex.set(n.id, n);

  // ── Phase 2: Fruchterman–Reingold iterations ──────────────────────────────
  //
  // The "temperature" (t) caps how far a node moves in a single step.
  // It starts at ~10% of the canvas dimension and cools linearly to 0.
  //
  // Repulsion: all-pairs O(N²) — fast enough for ≤ 200 nodes.
  // Attraction: one pass per edge, O(E).

  const area = W * H;
  const k = springConstant(area, N);
  const tInit = Math.min(W, H) * 0.1;

  for (let iter = 0; iter < ITER; iter++) {
    const t = tInit * (1 - iter / ITER); // linear cooling

    // Reset displacements
    for (const n of sim) {
      n.dx = 0;
      n.dy = 0;
    }

    // Repulsion — every pair
    for (let i = 0; i < sim.length; i++) {
      for (let j = i + 1; j < sim.length; j++) {
        const a = sim[i]!;
        const b = sim[j]!;
        const ddx = a.x - b.x;
        const ddy = a.y - b.y;
        const dist = Math.sqrt(ddx * ddx + ddy * ddy) || 0.1;
        const f = repulsiveForce(dist, k);
        const ux = ddx / dist;
        const uy = ddy / dist;
        a.dx += ux * f;
        a.dy += uy * f;
        b.dx -= ux * f;
        b.dy -= uy * f;
      }
    }

    // Attraction — along edges
    for (const edge of inputEdges) {
      const a = nodeIndex.get(edge.source);
      const b = nodeIndex.get(edge.target);
      if (!a || !b) continue;
      const ddx = b.x - a.x;
      const ddy = b.y - a.y;
      const dist = Math.sqrt(ddx * ddx + ddy * ddy) || 0.1;
      const f = attractiveForce(dist, k);
      const ux = ddx / dist;
      const uy = ddy / dist;
      a.dx += ux * f;
      a.dy += uy * f;
      b.dx -= ux * f;
      b.dy -= uy * f;
    }

    // Apply displacements, capped by temperature, clamped to canvas
    for (const n of sim) {
      const dispLen = Math.sqrt(n.dx * n.dx + n.dy * n.dy) || 0.1;
      const cap = Math.min(dispLen, t);
      n.x += (n.dx / dispLen) * cap;
      n.y += (n.dy / dispLen) * cap;
      // Keep inside canvas with padding = nodeRadius
      n.x = Math.max(R, Math.min(W - R, n.x));
      n.y = Math.max(R, Math.min(H - R, n.y));
    }
  }

  // ── Phase 3: Build output ─────────────────────────────────────────────────

  const outNodes: LayoutGraphNode[] = sim.map((n) => ({
    id: n.id,
    label: n.label,
    x: n.x,
    y: n.y,
  }));

  const outEdges: LayoutGraphEdge[] = inputEdges.flatMap((e) => {
    const src = nodeIndex.get(e.source);
    const tgt = nodeIndex.get(e.target);
    if (!src || !tgt) return [];
    return [
      {
        id: e.id,
        source: e.source,
        target: e.target,
        x1: src.x,
        y1: src.y,
        x2: tgt.x,
        y2: tgt.y,
      },
    ];
  });

  return { nodes: outNodes, edges: outEdges, width: W, height: H };
}

// ─── Public compute function (pure — no React) ────────────────────────────────
//
// Use this when you need the layout outside of React (Node.js, Canvas, SSR,
// D3 integration, framework-agnostic rendering).

/**
 * Pure layout function — same algorithm as useGraphLayout, no React required.
 *
 * Uses a Fruchterman–Reingold force-directed simulation:
 *  • Nodes start on a circle; repulsive forces space them apart.
 *  • Edge springs pull connected nodes together.
 *  • Temperature cools each iteration to converge on a stable layout.
 *
 * @example
 * const layout = computeGraphLayout({ nodes, edges });
 * const layout = computeGraphLayout({ nodes, edges }, { width: 1200, height: 800, iterations: 300 });
 */
export function computeGraphLayout(data: GraphData, options?: GraphLayoutOptions): GraphLayout {
  return compute(data, options);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Computes the 2-D force-directed layout for a node-edge graph.
 * Result is memoized — only recomputed when `data` or `options` change.
 *
 * Uses a Fruchterman–Reingold style simulation:
 *  • Each node repels every other node proportional to k²/distance.
 *  • Each edge acts as a spring attracting its endpoints proportional to dist²/k.
 *  • k = sqrt(area / N) — the natural spacing between nodes.
 *  • Displacement is cooled each iteration so the layout converges.
 *
 * @example
 * // Default — good for graphs up to ~80 nodes
 * const layout = useGraphLayout(data);
 *
 * // Wide canvas, more iterations for denser graphs
 * const layout = useGraphLayout(data, { width: 1200, height: 900, iterations: 300 });
 */
export function useGraphLayout(data: GraphData, options?: GraphLayoutOptions): GraphLayout {
  return useMemo(() => compute(data, options), [data, options]);
}
