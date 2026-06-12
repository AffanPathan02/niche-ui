// Layer 3: Styled default — works out of the box with zero config.
// Built entirely on Layer 1 (useFlameLayout) via direct usage.
// Users who need full control drop down to <FlameRoot> + render props.

import { useState, useCallback, useRef, type CSSProperties } from 'react';
import { useFlameLayout } from './core/useFlameLayout';
import type { FlameSample, FlameFrame, FlameLayoutOptions } from './core/useFlameLayout';

// ─── Color utilities ──────────────────────────────────────────────────────────

/** Deterministic hash of a string → integer (djb2) */
function hashString(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) ^ s.charCodeAt(i);
  }
  return h >>> 0; // unsigned 32-bit
}

type ColorScheme = 'warm' | 'cool' | 'blue';

/**
 * Returns a stable warm/cool/blue hue for a given frame id.
 * Colors are randomised per id but deterministic across renders.
 */
function frameColor(id: string, scheme: ColorScheme, dimmed = false): string {
  const h = hashString(id);
  const lightness = dimmed ? 25 : 42 + (h % 16); // 42–57 %
  const saturation = dimmed ? 20 : 72 + (h % 20); // 72–91 %

  let hue: number;
  if (scheme === 'warm') {
    // Gold → orange → red: 15–55°
    hue = 15 + (h % 40);
  } else if (scheme === 'cool') {
    // Teal → green: 140–180°
    hue = 140 + (h % 40);
  } else {
    // Blue → violet: 210–260°
    hue = 210 + (h % 50);
  }

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

interface TooltipState {
  frame: FlameFrame;
  x: number;
  y: number;
}

function Tooltip({ tip, totalWidth }: { tip: TooltipState; totalWidth: number }) {
  const pct = ((tip.frame.totalValue / tip.frame.rootValue) * 100).toFixed(1);
  const selfPct = ((tip.frame.selfValue / tip.frame.rootValue) * 100).toFixed(1);

  // Flip tooltip to the left if too close to right edge
  const flipLeft = tip.x > totalWidth * 0.6;

  return (
    <div
      style={{
        position: 'absolute',
        left: flipLeft ? undefined : tip.x + 12,
        right: flipLeft ? totalWidth - tip.x + 4 : undefined,
        top: tip.y - 8,
        background: 'rgba(10, 14, 26, 0.96)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 8,
        padding: '8px 12px',
        pointerEvents: 'none',
        zIndex: 50,
        maxWidth: 280,
        backdropFilter: 'blur(6px)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
      }}
    >
      <div
        style={{
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          fontSize: 12,
          fontWeight: 600,
          color: '#f1f5f9',
          marginBottom: 4,
          wordBreak: 'break-all',
        }}
      >
        {tip.frame.label}
      </div>
      <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.6 }}>
        <span style={{ color: '#fbbf24' }}>total</span> {tip.frame.totalValue.toLocaleString()}{' '}
        <span style={{ color: '#475569' }}>({pct}%)</span>
        <br />
        <span style={{ color: '#fbbf24' }}>self&nbsp;&nbsp;</span>{' '}
        {tip.frame.selfValue.toLocaleString()}{' '}
        <span style={{ color: '#475569' }}>({selfPct}%)</span>
      </div>
    </div>
  );
}

// ─── Breadcrumbs ──────────────────────────────────────────────────────────────

function Breadcrumbs({ trail, onJump }: { trail: FlameSample[]; onJump: (index: number) => void }) {
  if (trail.length <= 1) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        marginBottom: 8,
        flexWrap: 'wrap',
      }}
    >
      {trail.map((node, i) => (
        <span key={node.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            onClick={() => onJump(i)}
            style={{
              border: 'none',
              cursor: i < trail.length - 1 ? 'pointer' : 'default',
              color: i === trail.length - 1 ? '#f1f5f9' : '#6366f1',
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              fontSize: 11,
              padding: '2px 6px',
              borderRadius: 4,
              textDecoration: i < trail.length - 1 ? 'underline' : 'none',
              background: i === trail.length - 1 ? 'rgba(99,102,241,0.12)' : 'transparent',
            }}
          >
            {node.label}
          </button>
          {i < trail.length - 1 && <span style={{ color: '#475569', fontSize: 10 }}>›</span>}
        </span>
      ))}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface FlameGraphProps {
  /** Input flame data (nested FlameSample tree) */
  data: FlameSample;
  /**
   * Total pixel width of the SVG canvas.
   * @default 800
   */
  width?: number;
  /**
   * Height of each depth row in pixels.
   * @default 28
   */
  rowHeight?: number;
  /**
   * Color palette for frame backgrounds.
   * @default 'warm'
   */
  colorScheme?: ColorScheme;
  /**
   * Callback fired when a frame is clicked.
   * The component also zooms into the clicked frame automatically.
   */
  onFrameClick?: (frame: FlameFrame) => void;
  style?: CSSProperties;
  className?: string;
}

// ─── Find a node by id in the tree ────────────────────────────────────────────

function findNode(root: FlameSample, id: string): FlameSample | null {
  if (root.id === id) return root;
  for (const child of root.children ?? []) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}

/** Build ancestry path from root to target id (inclusive) */
function buildTrail(root: FlameSample, targetId: string): FlameSample[] {
  function dfs(node: FlameSample, path: FlameSample[]): FlameSample[] | null {
    const next = [...path, node];
    if (node.id === targetId) return next;
    for (const child of node.children ?? []) {
      const found = dfs(child, next);
      if (found) return found;
    }
    return null;
  }
  return dfs(root, []) ?? [root];
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Drop-in flame graph visualiser.
 *
 * Features:
 * • Warm/cool/blue color schemes (stable per frame id)
 * • Hover tooltip with label, total value, self value, and % of root
 * • Click-to-zoom: recomputes layout with clicked frame as new root
 * • Breadcrumb trail for navigating back up the zoom stack
 * • Keyboard accessible (Tab + Enter/Space to activate frames)
 *
 * For custom frame shapes or full layout control, use <FlameRoot> directly (Layer 2).
 *
 * @example
 * <FlameGraph data={cpuProfile} />
 * <FlameGraph data={cpuProfile} width={1200} colorScheme="cool" rowHeight={32} />
 */
export function FlameGraph({
  data,
  width = 800,
  rowHeight = 28,
  colorScheme = 'warm',
  onFrameClick,
  style,
  className,
}: FlameGraphProps) {
  // ── Zoom state ──────────────────────────────────────────────────────────────
  const [zoomedId, setZoomedId] = useState<string>(data.id);
  const zoomedNode = findNode(data, zoomedId) ?? data;
  const trail = buildTrail(data, zoomedId);

  // ── Layout ──────────────────────────────────────────────────────────────────
  const options: FlameLayoutOptions = { rowHeight, totalWidth: width, minWidth: 0.5 };
  const layout = useFlameLayout(zoomedNode, options);

  // ── Tooltip state ────────────────────────────────────────────────────────────
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleFrameClick = useCallback(
    (frame: FlameFrame) => {
      onFrameClick?.(frame);
      // Only zoom in if the frame has children in the original data
      const originalNode = findNode(data, frame.id);
      if (originalNode && (originalNode.children?.length ?? 0) > 0) {
        setZoomedId(frame.id);
        setTooltip(null);
      }
    },
    [data, onFrameClick],
  );

  const handleBreadcrumbJump = useCallback(
    (index: number) => {
      const node = trail[index];
      if (node) setZoomedId(node.id);
    },
    [trail],
  );

  const handleMouseMove = useCallback((frame: FlameFrame, e: React.MouseEvent<SVGRectElement>) => {
    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;
    setTooltip({
      frame,
      x: e.clientX - svgRect.left,
      y: e.clientY - svgRect.top,
    });
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className={className} style={{ position: 'relative', display: 'inline-block', ...style }}>
      {/* Breadcrumbs */}
      <Breadcrumbs trail={trail} onJump={handleBreadcrumbJump} />

      {/* SVG canvas */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${layout.totalWidth} ${layout.totalHeight}`}
        width={layout.totalWidth}
        height={layout.totalHeight}
        role="img"
        aria-label={`Flame graph — ${zoomedNode.label}`}
        style={{ display: 'block', userSelect: 'none' }}
        onMouseLeave={() => setTooltip(null)}
      >
        {layout.visibleFrames.map((frame) => {
          const color = frameColor(frame.id, colorScheme);
          const dimColor = frameColor(frame.id, colorScheme, true);
          const isRoot = frame.depth === 0;
          const PADDING = 4;
          const canShowLabel = frame.width > 24;
          const textMaxWidth = frame.width - PADDING * 2;

          return (
            <g
              key={frame.id}
              role="button"
              tabIndex={0}
              aria-label={`${frame.label} — ${frame.totalValue} samples`}
              style={{
                cursor:
                  (findNode(data, frame.id)?.children?.length ?? 0) > 0 ? 'pointer' : 'default',
              }}
              onClick={() => handleFrameClick(frame)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleFrameClick(frame);
                }
              }}
            >
              {/* Background rect */}
              <rect
                x={frame.x}
                y={frame.y}
                width={Math.max(0, frame.width - 1)} // 1px gap between siblings
                height={rowHeight - 1} // 1px gap between rows
                fill={color}
                rx={isRoot ? 3 : 2}
                style={{ transition: 'fill 0.1s' }}
                onMouseMove={(e) => handleMouseMove(frame, e)}
                onMouseEnter={(e) => {
                  (e.currentTarget as SVGRectElement).setAttribute('fill', dimColor);
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as SVGRectElement).setAttribute('fill', color);
                }}
              />

              {/* Label */}
              {canShowLabel && (
                <text
                  x={frame.x + PADDING}
                  y={frame.y + rowHeight / 2}
                  dominantBaseline="middle"
                  fill="rgba(255,255,255,0.92)"
                  fontSize={Math.min(12, rowHeight * 0.44)}
                  fontFamily="'JetBrains Mono', 'Fira Code', monospace"
                  style={{ pointerEvents: 'none' }}
                >
                  <title>{frame.label}</title>
                  {/* SVG doesn't support text-overflow, so we clip via textLength */}
                  {frame.label.length * 7.2 > textMaxWidth
                    ? frame.label.substring(0, Math.max(0, Math.floor(textMaxWidth / 7.2) - 1)) +
                      '…'
                    : frame.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Floating tooltip */}
      {tooltip && <Tooltip tip={tooltip} totalWidth={width} />}
    </div>
  );
}
