// Layer 2: Headless — structure + accessibility, zero CSS.
// Mirrors the TreeRoot/TreeEdges/TreeNodes pattern from @niche-ui/tree.

import { createContext, useContext, type ReactNode } from 'react';
import {
  useGraphLayout,
  type GraphData,
  type GraphLayoutOptions,
  type LayoutGraphNode,
  type LayoutGraphEdge,
  type GraphLayout,
} from '../core/useGraphLayout';

// ─── Context ─────────────────────────────────────────────────────────────────

const GraphCtx = createContext<GraphLayout | null>(null);

/**
 * Access the computed graph layout from anywhere inside a <GraphRoot>.
 */
export function useGraph(): GraphLayout {
  const ctx = useContext(GraphCtx);
  if (!ctx) throw new Error('[niche-ui/graph] useGraph must be used inside <GraphRoot>');
  return ctx;
}

// ─── GraphRoot ───────────────────────────────────────────────────────────────

interface GraphRootProps {
  /** Your graph data — nodes and edges arrays */
  data: GraphData;
  children: ReactNode;
  /**
   * Layout options. Use to set canvas dimensions, iterations, or node radius.
   *
   * @example
   * <GraphRoot data={data} layout={{ width: 900, height: 700, iterations: 250 }}>
   */
  layout?: GraphLayoutOptions | undefined;
  /** Pass-through SVG props (className, style, onClick, …) */
  className?: string | undefined;
  style?: React.CSSProperties | undefined;
}

/**
 * Runs useGraphLayout, provides the SVG canvas + context.
 * All other Graph* components must live inside this.
 *
 * @example
 * <GraphRoot data={{ nodes, edges }} layout={{ width: 800, height: 600 }}>
 *   <GraphEdges render={(edge) => <line key={edge.id} ... />} />
 *   <GraphNodes render={(node) => <circle key={node.id} ... />} />
 * </GraphRoot>
 */
export function GraphRoot({ data, children, layout, className, style }: GraphRootProps) {
  const graphLayout = useGraphLayout(data, layout); // ← Layer 1

  return (
    <GraphCtx.Provider value={graphLayout}>
      <svg
        viewBox={`0 0 ${graphLayout.width} ${graphLayout.height}`}
        width={graphLayout.width}
        height={graphLayout.height}
        className={className}
        style={style}
        role="img"
        aria-label="Graph diagram"
      >
        {children}
      </svg>
    </GraphCtx.Provider>
  );
}

// ─── GraphEdges ──────────────────────────────────────────────────────────────

interface GraphEdgesProps {
  /**
   * Render prop — called once per edge.
   * Return any SVG element: <line>, <path>, <g>, custom animated component, etc.
   *
   * @example
   * <GraphEdges render={(edge) => (
   *   <line key={edge.id} x1={edge.x1} y1={edge.y1} x2={edge.x2} y2={edge.y2} stroke="gray" />
   * )} />
   */
  render: (edge: LayoutGraphEdge) => ReactNode;
}

/** Renders all edges via your render prop. Drawn below nodes by default. */
export function GraphEdges({ render }: GraphEdgesProps) {
  const { edges } = useGraph();
  return <g aria-hidden="true">{edges.map(render)}</g>;
}

// ─── GraphNodes ──────────────────────────────────────────────────────────────

interface GraphNodesProps {
  /**
   * Render prop — called once per node.
   * Return any SVG element. Use `transform={`translate(${node.x}, ${node.y})`}` to position.
   *
   * @example
   * <GraphNodes render={(node) => (
   *   <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
   *     <circle r={20} fill="teal" />
   *     <text textAnchor="middle" dominantBaseline="middle">{node.label}</text>
   *   </g>
   * )} />
   */
  render: (node: LayoutGraphNode) => ReactNode;
}

/** Renders all nodes via your render prop. */
export function GraphNodes({ render }: GraphNodesProps) {
  const { nodes } = useGraph();
  return <g role="group">{nodes.map(render)}</g>;
}
