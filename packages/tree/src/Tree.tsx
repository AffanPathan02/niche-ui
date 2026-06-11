// Layer 3: Styled default — works out of the box with zero config.
// Built entirely on Layer 2 via render props. Zero layout logic here.
// Users who need full control drop down to <TreeRoot> + render props.

import type { CSSProperties } from 'react';
import { TreeRoot, TreeEdges, TreeNodes } from './headless';
import type { TreeNode } from './core/useTreeLayout';

// ─── Props ───────────────────────────────────────────────────────────────────

export interface TreeProps {
  /** Tree data to render */
  data: TreeNode;
  /** Node fill color. Default: indigo */
  nodeColor?: string | undefined;
  /** Node circle radius in px. Default: 18 */
  nodeRadius?: number | undefined;
  /** Edge stroke color. Default: slate */
  edgeColor?: string | undefined;
  /** Edge stroke width in px. Default: 1.5 */
  edgeWidth?: number | undefined;
  /** Node label color. Default: white */
  labelColor?: string | undefined;
  /** Node label font size in px. Default: 11 */
  fontSize?: number | undefined;
  /** Forwarded to the wrapping <svg> element */
  style?: CSSProperties | undefined;
  className?: string | undefined;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Drop-in tree visualiser. Accepts basic style overrides.
 * For custom node shapes, edges, or animations, use <TreeRoot> directly (Layer 2).
 *
 * @example
 * <Tree data={myTree} />
 * <Tree data={myTree} nodeColor="#f43f5e" edgeColor="#fda4af" />
 */
export function Tree({
  data,
  nodeColor  = '#6366f1',
  nodeRadius = 18,
  edgeColor  = '#475569',
  edgeWidth  = 1.5,
  labelColor = '#ffffff',
  fontSize   = 11,
  style,
  className,
}: TreeProps) {
  return (
    <TreeRoot data={data} style={style} className={className}>

      {/* Edges drawn first — they appear behind nodes */}
      <TreeEdges
        render={(edge) => (
          <line
            key={edge.id}
            x1={edge.x1}
            y1={edge.y1}
            x2={edge.x2}
            y2={edge.y2}
            stroke={edgeColor}
            strokeWidth={edgeWidth}
          />
        )}
      />

      {/* Nodes drawn on top */}
      <TreeNodes
        render={(node) => (
          <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
            <circle r={nodeRadius} fill={nodeColor} />
            <text
              textAnchor="middle"
              dominantBaseline="middle"
              fill={labelColor}
              fontSize={fontSize}
              fontFamily="monospace"
              style={{ userSelect: 'none' }}
            >
              {node.label}
            </text>
          </g>
        )}
      />

    </TreeRoot>
  );
}
