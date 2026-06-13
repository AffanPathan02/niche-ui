// Layer 3: Styled default — works out of the box with zero config.
// Built entirely on Layer 2 via render props. Zero layout logic here.
// Users who need full control drop down to <GraphRoot> + render props.

import { useState, useCallback, type CSSProperties } from 'react';
import { GraphRoot, GraphEdges, GraphNodes } from './headless';
import type { GraphData } from './core/useGraphLayout';
import type { LayoutGraphEdge, LayoutGraphNode } from './core/useGraphLayout';

// ─── Arrowhead marker id ──────────────────────────────────────────────────────
// Each <Graph> instance needs a unique marker id so multiple instances on the
// same page don't fight over the same SVG <defs> element.
let _markerSeq = 0;

// ─── Props ────────────────────────────────────────────────────────────────────

export interface GraphProps {
  /** Graph data — nodes and edges arrays */
  data: GraphData;
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
   * Number of force-simulation iterations.
   * @default 200
   */
  iterations?: number;
  /** Node fill color. @default '#06b6d4' (cyan) */
  nodeColor?: string | undefined;
  /** Node circle radius in px. @default 20 */
  nodeRadius?: number | undefined;
  /** Edge stroke color. @default '#334155' */
  edgeColor?: string | undefined;
  /** Edge stroke width in px. @default 1.5 */
  edgeWidth?: number | undefined;
  /** Node label color. @default '#ffffff' */
  labelColor?: string | undefined;
  /** Node label font size in px. @default 11 */
  fontSize?: number | undefined;
  /** Show arrowheads on edges (directed graph style). @default true */
  directed?: boolean | undefined;
  /** Optional seed for the initial node positions. @default 0 */
  seed?: number | undefined;
  /** Forwarded to the wrapping <svg> element */
  style?: CSSProperties | undefined;
  className?: string | undefined;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Shorten an edge so its visible endpoints sit on the surface of the node
 * circles rather than at their centers, giving arrowheads a clean look.
 */
function shortenEdge(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  r: number,
): { x1: number; y1: number; x2: number; y2: number } {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  return {
    x1: x1 + ux * r,
    y1: y1 + uy * r,
    x2: x2 - ux * (r + 0.6), // Align marker tip exactly with node boundary
    y2: y2 - uy * (r + 0.6),
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Drop-in node-edge graph visualiser. Accepts basic style overrides.
 * Supports both directed (arrowheads) and undirected modes.
 * For custom node shapes, edges, or animations, use <GraphRoot> directly (Layer 2).
 *
 * @example
 * <Graph data={{ nodes, edges }} />
 * <Graph data={{ nodes, edges }} nodeColor="#f43f5e" directed={false} />
 */
export function Graph({
  data,
  width = 800,
  height = 600,
  iterations = 200,
  nodeColor = '#06b6d4',
  nodeRadius = 20,
  edgeColor = '#334155',
  edgeWidth = 1.5,
  labelColor = '#ffffff',
  fontSize = 11,
  directed = true,
  seed,
  style,
  className,
}: GraphProps) {
  // Stable unique marker id per instance
  const [markerId] = useState(() => `graph-arrow-${++_markerSeq}`);

  // Hover state — track which node id is hovered
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleEnter = useCallback((id: string) => setHoveredId(id), []);
  const handleLeave = useCallback(() => setHoveredId(null), []);

  const layout = {
    width,
    height,
    iterations,
    nodeRadius,
    ...(seed !== undefined ? { seed } : {}),
  };

  // ── Edge renderer ────────────────────────────────────────────────────────

  const renderEdge = useCallback(
    (edge: LayoutGraphEdge) => {
      const srcHovered = hoveredId === edge.source;
      const tgtHovered = hoveredId === edge.target;
      const active = srcHovered || tgtHovered;

      const { x1, y1, x2, y2 } = directed
        ? shortenEdge(edge.x1, edge.y1, edge.x2, edge.y2, nodeRadius!)
        : { x1: edge.x1, y1: edge.y1, x2: edge.x2, y2: edge.y2 };

      return (
        <line
          key={edge.id}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={active ? nodeColor : edgeColor}
          strokeWidth={active ? edgeWidth! * 1.6 : edgeWidth}
          strokeOpacity={active ? 0.9 : 0.55}
          markerEnd={directed ? `url(#${markerId})` : undefined}
          style={{ transition: 'stroke 0.15s, stroke-width 0.15s, stroke-opacity 0.15s' }}
        />
      );
    },
    [directed, edgeColor, edgeWidth, hoveredId, markerId, nodeColor, nodeRadius],
  );

  // ── Node renderer ─────────────────────────────────────────────────────────

  const renderNode = useCallback(
    (node: LayoutGraphNode) => {
      const isHovered = hoveredId === node.id;
      const r = nodeRadius!;

      return (
        <g
          key={node.id}
          transform={`translate(${node.x}, ${node.y})`}
          style={{ cursor: 'default' }}
          onMouseEnter={() => handleEnter(node.id)}
          onMouseLeave={handleLeave}
        >
          {/*
           * Glow ring — ALWAYS in the DOM, opacity toggled by state.
           * Mounting/unmounting it was the cause of oscillation: DOM mutations
           * under the cursor trigger spurious mouseleave/mouseenter in SVG.
           * pointerEvents:none ensures it never steals events from the <g>.
           */}
          <circle
            r={r + 7}
            fill="none"
            stroke={nodeColor}
            strokeWidth={2}
            strokeOpacity={isHovered ? 0.4 : 0}
            style={{ pointerEvents: 'none', transition: 'stroke-opacity 0.15s' }}
          />

          {/* Main circle — fill changes on hover; no scale() to avoid hit-test shift */}
          <circle
            r={r}
            fill={isHovered ? lighten(nodeColor!) : nodeColor}
            style={{ transition: 'fill 0.15s' }}
          />

          {/* Label */}
          <text
            textAnchor="middle"
            dominantBaseline="middle"
            fill={labelColor}
            fontSize={fontSize}
            fontFamily="'JetBrains Mono', 'Fira Code', monospace"
            style={{ userSelect: 'none', pointerEvents: 'none' }}
          >
            {node.label}
          </text>
        </g>
      );
    },
    [fontSize, handleEnter, handleLeave, hoveredId, labelColor, nodeColor, nodeRadius],
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <GraphRoot data={data} layout={layout} style={style} className={className}>
      {/* SVG defs — arrowhead marker */}
      {directed && (
        <defs>
          <marker
            id={markerId}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={edgeColor} fillOpacity={0.7} />
          </marker>
        </defs>
      )}

      {/* Edges drawn first — they appear behind nodes */}
      <GraphEdges render={renderEdge} />

      {/* Nodes drawn on top */}
      <GraphNodes render={renderNode} />
    </GraphRoot>
  );
}

// ─── Color helpers ────────────────────────────────────────────────────────────

/**
 * Lighten a hex color by mixing it 25% toward white.
 * Keeps the implementation dependency-free.
 */
function lighten(hex: string): string {
  // Handle named colors / non-hex gracefully
  if (!hex.startsWith('#')) return hex;

  const full = hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex;

  const r = parseInt(full.slice(1, 3), 16);
  const g = parseInt(full.slice(3, 5), 16);
  const b = parseInt(full.slice(5, 7), 16);

  const mix = (c: number) =>
    Math.round(c + (255 - c) * 0.28)
      .toString(16)
      .padStart(2, '0');
  return `#${mix(r)}${mix(g)}${mix(b)}`;
}
