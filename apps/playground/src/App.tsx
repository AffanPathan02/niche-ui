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
  packageBadge?: 'flame';
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
  | 'flame-hook';

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
      </main>
    </div>
  );
}
