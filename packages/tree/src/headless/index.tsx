// Layer 2: Headless — structure + accessibility, zero CSS.

import { createContext, useContext, type ReactNode } from 'react';
import {
  useTreeLayout,
  type TreeNode,
  type TreeLayoutOptions,
  type LayoutNode,
  type LayoutEdge,
  type TreeLayout,
} from '../core/useTreeLayout';

// ─── Context ─────────────────────────────────────────────────────────────────

const TreeCtx = createContext<TreeLayout | null>(null);

/**
 * Access the computed layout from anywhere inside a <TreeRoot>.
 */
export function useTree(): TreeLayout {
  const ctx = useContext(TreeCtx);
  if (!ctx) throw new Error('[niche-ui/tree] useTree must be used inside <TreeRoot>');
  return ctx;
}

// ─── TreeRoot ────────────────────────────────────────────────────────────────

interface TreeRootProps {
  /** Your tree data */
  data: TreeNode;
  children: ReactNode;
  /**
   * Layout spacing overrides. Use this when your custom nodes are larger than
   * the adaptive defaults would allocate.
   *
   * @example
   * // Rect nodes 80x32 px — give them 96 px wide slots and 56 px tall lanes
   * <TreeRoot data={data} layout={{ hGap: 96, vGap: 56, nodeRadius: 16 }}>
   */
  layout?: TreeLayoutOptions | undefined;
  /** Pass-through SVG props (className, style, onClick, …) */
  className?: string | undefined;
  style?: React.CSSProperties | undefined;
}

/**
 * Runs useTreeLayout, provides the SVG canvas + context.
 * All other Tree* components must live inside this.
 */
export function TreeRoot({ data, children, layout, className, style }: TreeRootProps) {
  const treeLayout = useTreeLayout(data, layout); // ← Layer 1

  return (
    <TreeCtx.Provider value={treeLayout}>
      <svg
        viewBox={`0 0 ${treeLayout.width} ${treeLayout.height}`}
        width={treeLayout.width}
        height={treeLayout.height}
        className={className}
        style={style}
        role="img"
        aria-label="Tree diagram"
      >
        {children}
      </svg>
    </TreeCtx.Provider>
  );
}

// ─── TreeEdges ───────────────────────────────────────────────────────────────

interface TreeEdgesProps {
  /**
   * Render prop — called once per edge.
   * Return any SVG element: <line>, <path>, <g>, custom animated component, etc.
   *
   * @example
   * <TreeEdges render={(edge) => (
   *   <line key={edge.id} x1={edge.x1} y1={edge.y1} x2={edge.x2} y2={edge.y2} stroke="gray" />
   * )} />
   */
  render: (edge: LayoutEdge) => ReactNode;
}

/** Renders all edges via your render prop. Drawn below nodes by default. */
export function TreeEdges({ render }: TreeEdgesProps) {
  const { edges } = useTree();
  return <g aria-hidden="true">{edges.map(render)}</g>;
}

// ─── TreeNodes ───────────────────────────────────────────────────────────────

interface TreeNodesProps {
  /**
   * Render prop — called once per node.
   * Return any SVG element. Use `transform={`translate(${node.x}, ${node.y})`}` to position.
   *
   * @example
   * <TreeNodes render={(node) => (
   *   <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
   *     <circle r={18} fill="indigo" />
   *     <text textAnchor="middle" dominantBaseline="middle">{node.label}</text>
   *   </g>
   * )} />
   */
  render: (node: LayoutNode) => ReactNode;
}

/** Renders all nodes via your render prop. */
export function TreeNodes({ render }: TreeNodesProps) {
  const { nodes } = useTree();
  return <g role="group">{nodes.map(render)}</g>;
}
