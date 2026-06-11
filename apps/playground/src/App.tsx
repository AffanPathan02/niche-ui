import './index.css';

import { useRef, useEffect, useState } from 'react';
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

// ─── Sample data ─────────────────────────────────────────────────────────────

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

const SAMPLE = generateRandomTree(5);

// ─── Layer 3: Styled ──────────────────────────────────────────────────────────

function StyledExample() {
  return (
    <DemoSection
      title="Layer 3 — Styled"
      layer="l3"
      importLine="import { Tree } from '@niche-ui/tree'"
    >
      <Tree data={SAMPLE} />
      <br /><br />
      <Tree data={SAMPLE} nodeColor="#f43f5e" edgeColor="#fda4af" nodeRadius={22} />
    </DemoSection>
  );
}

// ─── Layer 2: Headless ────────────────────────────────────────────────────────

function HeadlessExample() {
  return (
    <DemoSection
      title="Layer 2 — Headless"
      layer="l2"
      importLine="import { TreeRoot, TreeEdges, TreeNodes } from '@niche-ui/tree'"
    >
      <TreeRoot data={SAMPLE} layout={{ hGap: 72, vGap: 56, nodeRadius: 13 }}>
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
              <rect x={-26} y={-13} width={52} height={26} rx={4} fill="#1e293b" stroke="#6366f1" strokeWidth={1.5} />
              <text textAnchor="middle" dominantBaseline="middle" fill="#a5b4fc" fontSize={10} fontFamily="monospace">
                {node.label}
              </text>
            </g>
          )}
        />
      </TreeRoot>
    </DemoSection>
  );
}

// ─── Layer 1: Hook — Canvas ───────────────────────────────────────────────────

function HookExample() {
  const layout = useTreeLayout(SAMPLE);
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
  children,
}: {
  title: string;
  importLine: string;
  layer: LayerBadge;
  children: React.ReactNode;
}) {
  return (
    <section className="demo-section">
      <div className="demo-section__header">
        <h2 className="demo-section__title">{title}</h2>
        <span className={`demo-section__layer-badge badge--${layer}`}>{LAYER_LABELS[layer]}</span>
      </div>
      <code className="demo-section__import">{importLine}</code>
      <div className="demo-section__canvas">{children}</div>
    </section>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

type Section = 'styled' | 'headless' | 'hook';
const SECTIONS: { id: Section; label: string }[] = [
  { id: 'styled',   label: 'Layer 3 — Styled' },
  { id: 'headless', label: 'Layer 2 — Headless' },
  { id: 'hook',     label: 'Layer 1 — Hook' },
];

function Sidebar({ active, onSelect }: { active: Section; onSelect: (s: Section) => void }) {
  return (
    <aside className="sidebar">
      <p className="sidebar__section-title">@niche-ui/tree</p>
      <ul className="sidebar__nav">
        {SECTIONS.map(({ id, label }) => (
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

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [active, setActive] = useState<Section>('styled');

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
          <h1 className="page-title">@niche-ui/tree</h1>
          <p className="page-desc">
            Binary tree &amp; AST visualiser — headless, styled, or hook-only.
          </p>
        </div>

        {active === 'styled'   && <StyledExample />}
        {active === 'headless' && <HeadlessExample />}
        {active === 'hook'     && <HookExample />}
      </main>
    </div>
  );
}
