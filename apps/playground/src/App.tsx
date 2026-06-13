import './index.css';

import { useRef, useEffect, useState, useCallback } from 'react';
import {
  // Layer 3 — Styled
  Tree,
  // Layer 2 — Headless
  TreeRoot,
  TreeEdges,
  TreeNodes,
  // Layer 1 — Hook
  useTreeLayout,
  type TreeNode,
} from '@niche-ui/tree';

import {
  // Layer 3 — Styled
  FlameGraph,
  // Layer 2 — Headless
  FlameRoot,
  FlameFrames,
  // Layer 1 — Hook
  computeFlameLayout,
  type FlameSample,
  type FlameFrame,
} from '@niche-ui/flame-graph';

import {
  // Layer 3 — Styled
  Graph,
  // Layer 2 — Headless
  GraphRoot,
  GraphEdges,
  GraphNodes,
  // Layer 1 — Hook
  computeGraphLayout,
  type GraphData,
  type LayoutGraphNode,
  type LayoutGraphEdge,
} from '@niche-ui/graph';

// ─── Tree sample data ─────────────────────────────────────────────────────────

function generateRandomTree(
  maxDepth: number,
  maxChildren = 4,
  currentDepth = 0,
  idCounter = { value: 0 },
): TreeNode {
  const id = `node-${idCounter.value++}`;
  const node: TreeNode = { id, label: id };

  if (currentDepth < maxDepth) {
    const childCount =
      currentDepth === 0
        ? Math.max(2, Math.floor(Math.random() * maxChildren) + 1)
        : Math.floor(Math.random() * (maxChildren + 1));

    if (childCount > 0) {
      node.children = Array.from({ length: childCount }, () =>
        generateRandomTree(maxDepth, maxChildren, currentDepth + 1, idCounter),
      );
    }
  }
  return node;
}

const TREE_SAMPLE = generateRandomTree(5);

// ─── Flame sample data — realistic CPU profile ─────────────────────────────────
//
// Simulates a browser render pipeline captured by a sampling profiler.
// Values = sample counts (each sample ≈ 1 ms on-CPU).

const FLAME_SAMPLE: FlameSample = {
  id: 'program',
  label: '(program)',
  value: 5,
  children: [
    {
      id: 'gc',
      label: '(garbage collector)',
      value: 12,
    },
    {
      id: 'bootstrap',
      label: 'bootstrap',
      value: 3,
      children: [
        {
          id: 'require',
          label: 'require',
          value: 5,
          children: [
            {
              id: 'load-module',
              label: 'Module.load',
              value: 2,
              children: [
                {
                  id: 'read-file',
                  label: 'fs.readFileSync',
                  value: 10,
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'http-server',
      label: 'http.createServer',
      value: 4,
      children: [
        {
          id: 'conn-listener',
          label: 'connectionListener',
          value: 8,
          children: [
            {
              id: 'req-listener',
              label: 'requestListener',
              value: 6,
              children: [
                {
                  id: 'router-handle',
                  label: 'Router.handle',
                  value: 10,
                  children: [
                    {
                      id: 'mw-cors',
                      label: 'corsMiddleware',
                      value: 4,
                      children: [
                        {
                          id: 'set-header',
                          label: 'res.setHeader',
                          value: 2,
                        },
                      ],
                    },
                    {
                      id: 'mw-auth',
                      label: 'authMiddleware',
                      value: 5,
                      children: [
                        {
                          id: 'jwt-verify',
                          label: 'jwt.verify',
                          value: 12,
                          children: [
                            {
                              id: 'crypto-decrypt',
                              label: 'crypto.decrypt',
                              value: 15,
                              children: [
                                {
                                  id: 'pbkdf2',
                                  label: 'pbkdf2',
                                  value: 25,
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                    {
                      id: 'ctrl-get-user',
                      label: 'UserController.getUser',
                      value: 8,
                      children: [
                        {
                          id: 'db-find',
                          label: 'Database.find',
                          value: 10,
                          children: [
                            {
                              id: 'mongo-connect',
                              label: 'Mongo.connect',
                              value: 4,
                            },
                            {
                              id: 'mongo-query',
                              label: 'Mongo.query',
                              value: 18,
                              children: [
                                {
                                  id: 'sock-write',
                                  label: 'Socket.write',
                                  value: 14,
                                  children: [
                                    {
                                      id: 'net-write',
                                      label: 'net.write',
                                      value: 22,
                                      children: [
                                        {
                                          id: 'libuv-poll',
                                          label: 'uv__io_poll',
                                          value: 35,
                                        },
                                      ],
                                    },
                                  ],
                                },
                              ],
                            },
                            {
                              id: 'serialize-json',
                              label: 'serializeJSON',
                              value: 20,
                              children: [
                                {
                                  id: 'json-stringify',
                                  label: 'JSON.stringify',
                                  value: 18,
                                  children: [
                                    {
                                      id: 'utf8-encode',
                                      label: 'utf8Encode',
                                      value: 12,
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                    {
                      id: 'render-html',
                      label: 'renderHTML',
                      value: 10,
                      children: [
                        {
                          id: 'react-render',
                          label: 'ReactDOMServer.renderToString',
                          value: 15,
                          children: [
                            {
                              id: 'reconcile',
                              label: 'reconcileChildren',
                              value: 22,
                              children: [
                                {
                                  id: 'begin-work',
                                  label: 'beginWork',
                                  value: 18,
                                  children: [
                                    {
                                      id: 'update-simple-memo',
                                      label: 'updateSimpleMemoComponent',
                                      value: 24,
                                      children: [
                                        {
                                          id: 'render-component',
                                          label: 'renderComponent',
                                          value: 30,
                                          children: [
                                            {
                                              id: 'create-element',
                                              label: 'createElement',
                                              value: 12,
                                            },
                                          ],
                                        },
                                      ],
                                    },
                                  ],
                                },
                                {
                                  id: 'complete-work',
                                  label: 'completeWork',
                                  value: 14,
                                  children: [
                                    {
                                      id: 'diff-props',
                                      label: 'diffProperties',
                                      value: 20,
                                    },
                                  ],
                                },
                              ],
                            },
                            {
                              id: 'commit-root',
                              label: 'commitRoot',
                              value: 12,
                              children: [
                                {
                                  id: 'commit-mutations',
                                  label: 'commitMutationEffects',
                                  value: 18,
                                  children: [
                                    {
                                      id: 'remove-child',
                                      label: 'removeChild',
                                      value: 10,
                                    },
                                    {
                                      id: 'append-child',
                                      label: 'appendChild',
                                      value: 15,
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

// ─── Graph sample data — React ecosystem dependency graph ────────────────────
//
// Models a realistic package dependency graph as a directed graph.
// Each node is a package; each edge is a "depends on" relationship.

const GRAPH_SAMPLE: GraphData = {
  nodes: [
    { id: 'react', label: 'react' },
    { id: 'react-dom', label: 'react-dom' },
    { id: 'scheduler', label: 'scheduler' },
    { id: 'react-router', label: 'react-router' },
    { id: 'history', label: 'history' },
    { id: 'zustand', label: 'zustand' },
    { id: 'immer', label: 'immer' },
    { id: 'axios', label: 'axios' },
    { id: 'swr', label: 'swr' },
    { id: 'vite', label: 'vite' },
    { id: 'esbuild', label: 'esbuild' },
    { id: 'rollup', label: 'rollup' },
    { id: 'typescript', label: 'typescript' },
    { id: 'app', label: 'app' },
  ],
  edges: [
    { id: 'e1', source: 'react-dom', target: 'react' },
    { id: 'e2', source: 'react-dom', target: 'scheduler' },
    { id: 'e3', source: 'react', target: 'scheduler' },
    { id: 'e4', source: 'react-router', target: 'react' },
    { id: 'e5', source: 'react-router', target: 'history' },
    { id: 'e6', source: 'zustand', target: 'react' },
    { id: 'e7', source: 'zustand', target: 'immer' },
    { id: 'e8', source: 'swr', target: 'react' },
    { id: 'e9', source: 'swr', target: 'axios' },
    { id: 'e10', source: 'vite', target: 'esbuild' },
    { id: 'e11', source: 'vite', target: 'rollup' },
    { id: 'e12', source: 'app', target: 'react' },
    { id: 'e13', source: 'app', target: 'react-dom' },
    { id: 'e14', source: 'app', target: 'react-router' },
    { id: 'e15', source: 'app', target: 'zustand' },
    { id: 'e16', source: 'app', target: 'swr' },
    { id: 'e17', source: 'app', target: 'vite' },
    { id: 'e18', source: 'app', target: 'typescript' },
  ],
};

// ─── Tree — Layer 3: Styled ───────────────────────────────────────────────────

function TreeStyledExample() {
  return (
    <DemoSection
      title="Layer 3 — Styled"
      layer="l3"
      importLine="import { Tree } from '@niche-ui/tree'"
    >
      <Tree data={TREE_SAMPLE} />
      <br />
      <br />
      <Tree data={TREE_SAMPLE} nodeColor="#f43f5e" edgeColor="#fda4af" nodeRadius={22} />
    </DemoSection>
  );
}

// ─── Tree — Layer 2: Headless ─────────────────────────────────────────────────

function TreeHeadlessExample() {
  return (
    <DemoSection
      title="Layer 2 — Headless"
      layer="l2"
      importLine="import { TreeRoot, TreeEdges, TreeNodes } from '@niche-ui/tree'"
    >
      <TreeRoot data={TREE_SAMPLE} layout={{ hGap: 72, vGap: 56, nodeRadius: 13 }}>
        <TreeEdges
          render={(edge) => (
            <path
              key={edge.id}
              fill="none"
              d={`M${edge.x1},${edge.y1} C${edge.x1},${(edge.y1 + edge.y2) / 2} ${edge.x2},${(edge.y1 + edge.y2) / 2} ${edge.x2},${edge.y2}`}
              stroke="#6366f1"
              strokeWidth={2}
              strokeDasharray="4 2"
            />
          )}
        />
        <TreeNodes
          render={(node) => (
            <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
              <rect
                x={-26}
                y={-13}
                width={52}
                height={26}
                rx={4}
                fill="#1e293b"
                stroke="#6366f1"
                strokeWidth={1.5}
              />
              <text
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#a5b4fc"
                fontSize={10}
                fontFamily="monospace"
              >
                {node.label}
              </text>
            </g>
          )}
        />
      </TreeRoot>
    </DemoSection>
  );
}

// ─── Tree — Layer 1: Hook (Canvas) ────────────────────────────────────────────

function TreeHookExample() {
  const layout = useTreeLayout(TREE_SAMPLE);
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, layout.width, layout.height);

    layout.edges.forEach((e) => {
      ctx.beginPath();
      ctx.moveTo(e.x1, e.y1);
      ctx.lineTo(e.x2, e.y2);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    layout.nodes.forEach((n) => {
      ctx.beginPath();
      ctx.arc(n.x, n.y, 18, 0, Math.PI * 2);
      ctx.fillStyle = '#6366f1';
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '11px monospace';
      ctx.fillText(n.label, n.x, n.y);
    });
  }, [layout]);

  return (
    <DemoSection
      title="Layer 1 — Hook (Canvas)"
      layer="l1"
      importLine="import { useTreeLayout } from '@niche-ui/tree'"
    >
      <canvas ref={ref} width={layout.width} height={layout.height} />
    </DemoSection>
  );
}

// ─── Flame — Layer 3: Styled ──────────────────────────────────────────────────

function FlameStyledExample() {
  const [lastClicked, setLastClicked] = useState<string | null>(null);

  const handleClick = useCallback((frame: FlameFrame) => {
    setLastClicked(frame.label);
  }, []);

  return (
    <DemoSection
      title="Layer 3 — Styled"
      layer="l3"
      importLine="import { FlameGraph } from '@niche-ui/flame-graph'"
      packageBadge="flame"
    >
      <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
        Click a frame to zoom in · use the breadcrumb trail to navigate back.
        {lastClicked && (
          <span style={{ color: 'var(--color-amber-light)', marginLeft: 8 }}>
            Last clicked: <strong>{lastClicked}</strong>
          </span>
        )}
      </p>
      <div style={{ marginBottom: 24 }}>
        <p
          style={{
            fontSize: 11,
            color: 'var(--color-text-muted)',
            marginBottom: 8,
            fontFamily: 'var(--font-mono)',
          }}
        >
          colorScheme="warm" (default)
        </p>
        <FlameGraph
          data={FLAME_SAMPLE}
          width={1000}
          rowHeight={26}
          colorScheme="warm"
          onFrameClick={handleClick}
        />
      </div>
      <div style={{ marginBottom: 24 }}>
        <p
          style={{
            fontSize: 11,
            color: 'var(--color-text-muted)',
            marginBottom: 8,
            fontFamily: 'var(--font-mono)',
          }}
        >
          colorScheme="cool"
        </p>
        <FlameGraph data={FLAME_SAMPLE} width={1000} rowHeight={26} colorScheme="cool" />
      </div>
      <div>
        <p
          style={{
            fontSize: 11,
            color: 'var(--color-text-muted)',
            marginBottom: 8,
            fontFamily: 'var(--font-mono)',
          }}
        >
          colorScheme="blue"
        </p>
        <FlameGraph data={FLAME_SAMPLE} width={1000} rowHeight={26} colorScheme="blue" />
      </div>
    </DemoSection>
  );
}

// ─── Flame — Layer 2: Headless ────────────────────────────────────────────────

function FlameHeadlessExample() {
  const ROW_H = 26;
  const WIDTH = 1000;

  return (
    <DemoSection
      title="Layer 2 — Headless"
      layer="l2"
      importLine="import { FlameRoot, FlameFrames } from '@niche-ui/flame-graph'"
      packageBadge="flame"
    >
      <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
        Custom dark-indigo theme built entirely with render props — zero CSS from the library.
      </p>
      <FlameRoot data={FLAME_SAMPLE} options={{ rowHeight: ROW_H, totalWidth: WIDTH }}>
        <FlameFrames
          render={(frame) => {
            const pct = (frame.totalValue / frame.rootValue) * 100;
            const opacity = 0.3 + (pct / 100) * 0.7;
            const canShowLabel = frame.width > 30;
            const textMaxChars = Math.max(0, Math.floor((frame.width - 8) / 7));
            const label =
              frame.label.length > textMaxChars
                ? frame.label.substring(0, textMaxChars - 1) + '…'
                : frame.label;

            return (
              <g key={frame.id}>
                <rect
                  x={frame.x}
                  y={frame.y}
                  width={Math.max(0, frame.width - 1)}
                  height={ROW_H - 1}
                  rx={2}
                  fill={`rgba(99, 102, 241, ${opacity})`}
                  stroke="rgba(129, 140, 248, 0.25)"
                  strokeWidth={0.5}
                />
                {canShowLabel && (
                  <text
                    x={frame.x + 4}
                    y={frame.y + ROW_H / 2}
                    dominantBaseline="middle"
                    fill="rgba(255,255,255,0.9)"
                    fontSize={11}
                    fontFamily="'JetBrains Mono', monospace"
                    style={{ pointerEvents: 'none' }}
                  >
                    {label}
                  </text>
                )}
              </g>
            );
          }}
        />
      </FlameRoot>
    </DemoSection>
  );
}

// ─── Flame — Layer 1: Hook (Canvas) ───────────────────────────────────────────

function FlameHookExample() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const WIDTH = 1000;
  const ROW_H = 26;

  useEffect(() => {
    const layout = computeFlameLayout(FLAME_SAMPLE, { totalWidth: WIDTH, rowHeight: ROW_H });
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, WIDTH, layout.totalHeight);

    for (const frame of layout.visibleFrames) {
      // Warm hue: hash id to a hue between 15–55°
      let h = 5381;
      for (let i = 0; i < frame.id.length; i++) h = ((h << 5) + h) ^ frame.id.charCodeAt(i);
      h = h >>> 0;
      const hue = 15 + (h % 40);
      const sat = 72 + (h % 20);
      const lit = 42 + (h % 16);

      ctx.fillStyle = `hsl(${hue}, ${sat}%, ${lit}%)`;
      ctx.beginPath();
      ctx.roundRect(frame.x, frame.y, Math.max(0, frame.width - 1), ROW_H - 1, 2);
      ctx.fill();

      if (frame.width > 30) {
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.font = '11px "JetBrains Mono", monospace';
        ctx.textBaseline = 'middle';
        ctx.save();
        ctx.beginPath();
        ctx.rect(frame.x + 4, frame.y, frame.width - 8, ROW_H);
        ctx.clip();
        ctx.fillText(frame.label, frame.x + 4, frame.y + ROW_H / 2);
        ctx.restore();
      }
    }
  }, []);

  const layout = computeFlameLayout(FLAME_SAMPLE, { totalWidth: WIDTH, rowHeight: ROW_H });

  return (
    <DemoSection
      title="Layer 1 — Hook (Canvas)"
      layer="l1"
      importLine="import { computeFlameLayout } from '@niche-ui/flame-graph'"
      packageBadge="flame"
    >
      <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
        Pure Canvas renderer — uses{' '}
        <code
          style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-code)' }}
        >
          computeFlameLayout
        </code>{' '}
        directly, no React components from the library.
      </p>
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={layout.totalHeight}
        style={{ display: 'block', borderRadius: 6 }}
      />
    </DemoSection>
  );
}

// ─── Graph — Layer 3: Styled ──────────────────────────────────────────────────

function GraphStyledExample() {
  return (
    <DemoSection
      title="Layer 3 — Styled"
      layer="l3"
      importLine="import { Graph } from '@niche-ui/graph'"
      packageBadge="graph"
    >
      <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
        React ecosystem dependency graph — hover any node to highlight its edges.
      </p>

      <div style={{ marginBottom: 28 }}>
        <p
          style={{
            fontSize: 11,
            color: 'var(--color-text-muted)',
            marginBottom: 8,
            fontFamily: 'var(--font-mono)',
          }}
        >
          directed={'{true}'} nodeColor="#06b6d4" (default)
        </p>
        <Graph
          data={GRAPH_SAMPLE}
          width={820}
          height={520}
          nodeColor="#06b6d4"
          edgeColor="#334155"
          nodeRadius={22}
          directed
        />
      </div>

      <div>
        <p
          style={{
            fontSize: 11,
            color: 'var(--color-text-muted)',
            marginBottom: 8,
            fontFamily: 'var(--font-mono)',
          }}
        >
          directed={'{false}'} nodeColor="#a78bfa" (undirected, violet)
        </p>
        <Graph
          data={GRAPH_SAMPLE}
          width={820}
          height={520}
          nodeColor="#a78bfa"
          edgeColor="#3730a3"
          nodeRadius={22}
          directed={false}
          iterations={250}
          seed={1.2}
        />
      </div>
    </DemoSection>
  );
}

// ─── Graph — Layer 2: Headless ────────────────────────────────────────────────

function GraphHeadlessExample() {
  const W = 820;
  const H = 520;
  const R = 20;

  // Deterministic hash for stable per-node colors
  function hashId(s: string): number {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
    return h >>> 0;
  }

  const renderEdge = (edge: LayoutGraphEdge) => {
    // Cubic bezier with a slight arc
    const mx = (edge.x1 + edge.x2) / 2;
    const my = (edge.y1 + edge.y2) / 2 - 30;
    return (
      <path
        key={edge.id}
        fill="none"
        d={`M${edge.x1},${edge.y1} Q${mx},${my} ${edge.x2},${edge.y2}`}
        stroke="rgba(99,102,241,0.45)"
        strokeWidth={1.5}
        strokeDasharray="5 3"
      />
    );
  };

  const renderNode = (node: LayoutGraphNode) => {
    const h = hashId(node.id);
    const hue = 200 + (h % 80); // cyan–blue range
    const fill = `hsl(${hue}, 70%, 42%)`;
    const stroke = `hsl(${hue}, 80%, 65%)`;

    return (
      <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
        {/* Hexagonal clip path would be complex in SVG; use octagon via polygon */}
        <circle r={R} fill={fill} stroke={stroke} strokeWidth={2} />
        <text
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#f1f5f9"
          fontSize={9}
          fontFamily="'JetBrains Mono', monospace"
          style={{ userSelect: 'none' }}
        >
          {node.label.length > 8 ? node.label.slice(0, 7) + '…' : node.label}
        </text>
      </g>
    );
  };

  return (
    <DemoSection
      title="Layer 2 — Headless"
      layer="l2"
      importLine="import { GraphRoot, GraphEdges, GraphNodes } from '@niche-ui/graph'"
      packageBadge="graph"
    >
      <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
        Custom hashed-hue node colors and curved bezier edges — zero CSS from the library.
      </p>
      <GraphRoot
        data={GRAPH_SAMPLE}
        layout={{ width: W, height: H, iterations: 200, nodeRadius: R }}
      >
        <GraphEdges render={renderEdge} />
        <GraphNodes render={renderNode} />
      </GraphRoot>
    </DemoSection>
  );
}

// ─── Graph — Layer 1: Hook (Canvas) ──────────────────────────────────────────

function GraphHookExample() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const W = 820;
  const H = 520;
  const R = 20;

  useEffect(() => {
    const layout = computeGraphLayout(GRAPH_SAMPLE, {
      width: W,
      height: H,
      iterations: 220,
      nodeRadius: R,
    });

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, W, H);

    // Draw edges
    for (const edge of layout.edges) {
      const dx = edge.x2 - edge.x1;
      const dy = edge.y2 - edge.y1;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const ux = dx / len;
      const uy = dy / len;

      const arrowSize = 7;

      // Tip of the arrow touches the target node boundary (at radius R)
      const ax = edge.x2 - ux * R;
      const ay = edge.y2 - uy * R;

      // Base of the arrowhead is at R + arrowSize from center
      const ex = edge.x2 - ux * (R + arrowSize);
      const ey = edge.y2 - uy * (R + arrowSize);

      // Start of the line at source node boundary (at radius R)
      const sx = edge.x1 + ux * R;
      const sy = edge.y1 + uy * R;

      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Arrowhead triangle pointing towards (ax, ay)
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ex - uy * arrowSize, ey + ux * arrowSize);
      ctx.lineTo(ex + uy * arrowSize, ey - ux * arrowSize);
      ctx.closePath();
      ctx.fillStyle = 'rgba(51, 65, 85, 0.8)';
      ctx.fill();
    }

    // Draw nodes
    for (const node of layout.nodes) {
      // Hashed hue
      let h = 5381;
      for (let i = 0; i < node.id.length; i++) h = ((h << 5) + h) ^ node.id.charCodeAt(i);
      h = h >>> 0;
      const hue = 180 + (h % 60);

      ctx.beginPath();
      ctx.arc(node.x, node.y, R, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${hue}, 65%, 42%)`;
      ctx.fill();
      ctx.strokeStyle = `hsl(${hue}, 75%, 62%)`;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#f1f5f9';
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = node.label.length > 8 ? node.label.slice(0, 7) + '…' : node.label;
      ctx.fillText(label, node.x, node.y);
    }
  }, []);

  return (
    <DemoSection
      title="Layer 1 — Hook (Canvas)"
      layer="l1"
      importLine="import { computeGraphLayout } from '@niche-ui/graph'"
      packageBadge="graph"
    >
      <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
        Pure Canvas renderer — uses{' '}
        <code
          style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-code)' }}
        >
          computeGraphLayout
        </code>{' '}
        directly, no React components from the library. Manually draws arrowheads.
      </p>
      <canvas ref={canvasRef} width={W} height={H} style={{ display: 'block', borderRadius: 6 }} />
    </DemoSection>
  );
}

// ─── DemoSection shell ────────────────────────────────────────────────────────

type LayerBadge = 'l1' | 'l2' | 'l3';
const LAYER_LABELS: Record<LayerBadge, string> = {
  l1: 'Hook',
  l2: 'Headless',
  l3: 'Styled',
};

function DemoSection({
  title,
  importLine,
  layer,
  packageBadge,
  children,
}: {
  title: string;
  importLine: string;
  layer: LayerBadge;
  packageBadge?: 'flame' | 'graph';
  children: React.ReactNode;
}) {
  return (
    <section className="demo-section">
      <div className="demo-section__header">
        <h2 className="demo-section__title">{title}</h2>
        <span className={`demo-section__layer-badge badge--${layer}`}>{LAYER_LABELS[layer]}</span>
        {packageBadge === 'flame' && (
          <span className="demo-section__layer-badge badge--flame">flame-graph</span>
        )}
        {packageBadge === 'graph' && (
          <span className="demo-section__layer-badge badge--graph">graph</span>
        )}
      </div>
      <code className="demo-section__import">{importLine}</code>
      <div className="demo-section__canvas">{children}</div>
    </section>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

type Section =
  | 'tree-styled'
  | 'tree-headless'
  | 'tree-hook'
  | 'flame-styled'
  | 'flame-headless'
  | 'flame-hook'
  | 'graph-styled'
  | 'graph-headless'
  | 'graph-hook';

const TREE_SECTIONS: { id: Section; label: string }[] = [
  { id: 'tree-styled', label: 'Layer 3 — Styled' },
  { id: 'tree-headless', label: 'Layer 2 — Headless' },
  { id: 'tree-hook', label: 'Layer 1 — Hook' },
];

const FLAME_SECTIONS: { id: Section; label: string }[] = [
  { id: 'flame-styled', label: 'Layer 3 — Styled' },
  { id: 'flame-headless', label: 'Layer 2 — Headless' },
  { id: 'flame-hook', label: 'Layer 1 — Hook' },
];

const GRAPH_SECTIONS: { id: Section; label: string }[] = [
  { id: 'graph-styled', label: 'Layer 3 — Styled' },
  { id: 'graph-headless', label: 'Layer 2 — Headless' },
  { id: 'graph-hook', label: 'Layer 1 — Hook' },
];

function Sidebar({ active, onSelect }: { active: Section; onSelect: (s: Section) => void }) {
  return (
    <aside className="sidebar">
      <p className="sidebar__section-title">@niche-ui/tree</p>
      <ul className="sidebar__nav">
        {TREE_SECTIONS.map(({ id, label }) => (
          <li key={id}>
            <button
              className={`sidebar__link${active === id ? ' active' : ''}`}
              onClick={() => onSelect(id)}
            >
              <span className="sidebar__dot" />
              {label}
            </button>
          </li>
        ))}
      </ul>

      <p className="sidebar__package-heading">@niche-ui/flame-graph</p>
      <ul className="sidebar__nav">
        {FLAME_SECTIONS.map(({ id, label }) => (
          <li key={id}>
            <button
              className={`sidebar__link${active === id ? ' active' : ''}`}
              onClick={() => onSelect(id)}
            >
              <span className="sidebar__dot" />
              {label}
            </button>
          </li>
        ))}
      </ul>

      <p className="sidebar__package-heading">@niche-ui/graph</p>
      <ul className="sidebar__nav">
        {GRAPH_SECTIONS.map(({ id, label }) => (
          <li key={id}>
            <button
              className={`sidebar__link${active === id ? ' active' : ''}`}
              onClick={() => onSelect(id)}
            >
              <span className="sidebar__dot" />
              {label}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}

// ─── Page metadata per section ────────────────────────────────────────────────

const PAGE_META: Record<Section, { title: string; desc: string }> = {
  'tree-styled': {
    title: '@niche-ui/tree',
    desc: 'Binary tree & AST visualiser — headless, styled, or hook-only.',
  },
  'tree-headless': {
    title: '@niche-ui/tree',
    desc: 'Binary tree & AST visualiser — headless, styled, or hook-only.',
  },
  'tree-hook': {
    title: '@niche-ui/tree',
    desc: 'Binary tree & AST visualiser — headless, styled, or hook-only.',
  },
  'flame-styled': {
    title: '@niche-ui/flame-graph',
    desc: 'Flame graph visualiser — headless, styled, or hook-only. Click a frame to zoom in.',
  },
  'flame-headless': {
    title: '@niche-ui/flame-graph',
    desc: 'Flame graph visualiser — headless, styled, or hook-only. Full render-prop control.',
  },
  'flame-hook': {
    title: '@niche-ui/flame-graph',
    desc: 'Flame graph visualiser — hook-only. Bring your own Canvas or WebGL renderer.',
  },
  'graph-styled': {
    title: '@niche-ui/graph',
    desc: 'Node-edge graph visualiser — force-directed layout. Hover to highlight connected edges.',
  },
  'graph-headless': {
    title: '@niche-ui/graph',
    desc: 'Node-edge graph — full render-prop control. Custom node shapes, edge curves, zero CSS.',
  },
  'graph-hook': {
    title: '@niche-ui/graph',
    desc: 'Node-edge graph — hook-only. Bring your own Canvas, WebGL, or D3 renderer.',
  },
};

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [active, setActive] = useState<Section>('tree-styled');
  const meta = PAGE_META[active];

  return (
    <div className="layout">
      {/* Header */}
      <header className="header">
        <div className="header__logo">
          <span className="header__wordmark">niche-ui</span>
          <span className="header__badge">playground</span>
        </div>
        <span className="header__tagline">same algorithm · three levels of control</span>
      </header>

      {/* Sidebar */}
      <Sidebar active={active} onSelect={setActive} />

      {/* Main */}
      <main className="main">
        <div className="page-header">
          <h1 className="page-title">{meta.title}</h1>
          <p className="page-desc">{meta.desc}</p>
        </div>

        {active === 'tree-styled' && <TreeStyledExample />}
        {active === 'tree-headless' && <TreeHeadlessExample />}
        {active === 'tree-hook' && <TreeHookExample />}
        {active === 'flame-styled' && <FlameStyledExample />}
        {active === 'flame-headless' && <FlameHeadlessExample />}
        {active === 'flame-hook' && <FlameHookExample />}
        {active === 'graph-styled' && <GraphStyledExample />}
        {active === 'graph-headless' && <GraphHeadlessExample />}
        {active === 'graph-hook' && <GraphHookExample />}
      </main>
    </div>
  );
}
