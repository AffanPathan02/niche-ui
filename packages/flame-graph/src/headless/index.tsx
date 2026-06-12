// Layer 2: Headless — structure + accessibility, zero CSS.
// Mirrors the TreeRoot/TreeEdges/TreeNodes pattern from @niche-ui/tree.

import { createContext, useContext, type ReactNode } from 'react';
import {
  useFlameLayout,
  type FlameSample,
  type FlameLayoutOptions,
  type FlameFrame,
  type FlameLayout,
} from '../core/useFlameLayout';

// ─── Context ─────────────────────────────────────────────────────────────────

const FlameCtx = createContext<FlameLayout | null>(null);

/**
 * Access the computed flame layout from anywhere inside a <FlameRoot>.
 */
export function useFlame(): FlameLayout {
  const ctx = useContext(FlameCtx);
  if (!ctx) throw new Error('[niche-ui/flame-graph] useFlame must be used inside <FlameRoot>');
  return ctx;
}

// ─── FlameRoot ────────────────────────────────────────────────────────────────

interface FlameRootProps {
  /** Flame graph input data */
  data: FlameSample;
  children: ReactNode;
  /** Layout options — rowHeight, totalWidth, minWidth */
  options?: FlameLayoutOptions | undefined;
  /** Pass-through SVG props */
  className?: string | undefined;
  style?: React.CSSProperties | undefined;
}

/**
 * Runs useFlameLayout, provides the SVG canvas + context.
 * All other Flame* components must live inside this.
 *
 * The SVG is rendered **top-down** (root at y=0, leaves grow downward).
 * To get the classic "flames up" look, apply `transform: scaleY(-1)` to the
 * SVG element via style/className and counter-rotate labels in your render prop.
 *
 * @example
 * <FlameRoot data={profile} options={{ totalWidth: 1000, rowHeight: 28 }}>
 *   <FlameFrames render={(frame) => <rect key={frame.id} ... />} />
 * </FlameRoot>
 */
export function FlameRoot({ data, children, options, className, style }: FlameRootProps) {
  const layout = useFlameLayout(data, options);

  return (
    <FlameCtx.Provider value={layout}>
      <svg
        viewBox={`0 0 ${layout.totalWidth} ${layout.totalHeight}`}
        width={layout.totalWidth}
        height={layout.totalHeight}
        className={className}
        style={style}
        role="img"
        aria-label="Flame graph"
      >
        {children}
      </svg>
    </FlameCtx.Provider>
  );
}

// ─── FlameFrames ─────────────────────────────────────────────────────────────

interface FlameFramesProps {
  /**
   * Render prop — called once per **visible** frame (width >= minWidth).
   * Return any SVG element: <rect>, <g>, custom animated component, etc.
   *
   * @example
   * <FlameFrames render={(frame) => (
   *   <g key={frame.id}>
   *     <rect x={frame.x} y={frame.y} width={frame.width} height={rowHeight} fill="orange" />
   *     <text x={frame.x + 4} y={frame.y + 14}>{frame.label}</text>
   *   </g>
   * )} />
   */
  render: (frame: FlameFrame) => ReactNode;
}

/**
 * Renders all visible frames via your render prop.
 * "Visible" means width >= the minWidth option passed to <FlameRoot>.
 */
export function FlameFrames({ render }: FlameFramesProps) {
  const { visibleFrames } = useFlame();
  return (
    <g role="group" aria-label="Flame graph frames">
      {visibleFrames.map(render)}
    </g>
  );
}
