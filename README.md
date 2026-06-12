# niche-ui

UI library for complex, rarely-seen components — headless by default, styled out of the box.

## Components

| Package                 | Status     | Description                     |
| ----------------------- | ---------- | ------------------------------- |
| `@niche-ui/tree`        | ✅ WIP     | Binary tree / AST visualiser    |
| `@niche-ui/flame-graph` | ✅ WIP     | Flame graph`                    |
| `@niche-ui/graph`       | 🔜 planned | Node-edge graph                 |
| `@niche-ui/video-frame` | 🔜 planned | Video frame / timeline scrubber |
| `@niche-ui/chain`       | 🔜 planned | Chained / linked list           |

---

## Getting started (local dev)

### Prerequisites

```bash
node -v   # 18+
pnpm -v   # 8+ (install: npm i -g pnpm)
```

### 1 — Install everything

```bash
pnpm install
```

### 2 — Build the tree package

```bash
pnpm build:tree
# or in watch mode:
pnpm dev:tree
```

### 3 — Run the playground

In a second terminal:

```bash
pnpm dev
```

Open http://localhost:5173 — you'll see all three layers of the tree component running side by side.

---

## Project structure

```
niche-ui/
├── package.json              workspace root (scripts only)
├── pnpm-workspace.yaml       declares packages + apps
├── tsconfig.base.json        shared TS config, extended by each package
│
├── packages/
│   └── tree/
│       ├── package.json      name: @niche-ui/tree
│       ├── vite.config.ts    library mode → dist/index.js + dist/index.cjs
│       └── src/
│           ├── core/
│           │   └── useTreeLayout.ts   Layer 1: pure layout algorithm
│           ├── headless/
│           │   └── index.tsx          Layer 2: TreeRoot, TreeEdges, TreeNodes
│           ├── Tree.tsx               Layer 3: styled default
│           └── index.ts               exports all 3 layers
│
└── apps/
    └── playground/
        ├── vite.config.ts    normal Vite app
        └── src/
            └── App.tsx       demos of Layer 1 / 2 / 3
```

---

## Architecture: 3-layer composition

Every component in this library follows the same pattern:

```
Layer 1 — Hook        pure computation, no JSX
Layer 2 — Headless    structure + a11y, render props, zero CSS
Layer 3 — Styled      pre-built defaults, works out of the box
```

Consumers import at whichever level they need:

```tsx
// 80% of users — drop it in
import { Tree } from '@niche-ui/tree';
<Tree data={myTree} />;

// 15% — custom look, same layout math
import { TreeRoot, TreeEdges, TreeNodes } from '@niche-ui/tree';

// 5% — canvas / D3 / WebGL
import { useTreeLayout } from '@niche-ui/tree';
```

---

## Adding a new component (e.g. @niche-ui/graph)

```bash
# 1. Copy the tree package as a starting point
cp -r packages/tree packages/graph

# 2. Update packages/graph/package.json
#    name: "@niche-ui/graph"

# 3. Rename / replace the source files
#    src/core/useGraphLayout.ts  ← Layer 1
#    src/headless/index.tsx      ← Layer 2
#    src/Graph.tsx               ← Layer 3
#    src/index.ts                ← exports

# 4. pnpm install && pnpm --filter @niche-ui/graph build
```

---

## Publishing to npm

```bash
# 1. Build all packages
pnpm build

# 2. Login to npm
npm login

# 3. Publish (from the package directory)
cd packages/tree
npm publish --access public

# Later — publish all at once with changesets
pnpm add -Dw @changesets/cli
pnpm changeset init
```

---

## Road to framework-agnostic (v2 plan)

Layer 1 (the hook) contains zero JSX — it's ready to extract:

```
v1 (now):    @niche-ui/tree         React only
v2 (later):  @niche-ui/tree-core    vanilla JS, no React (extract Layer 1)
             @niche-ui/tree-react   React adapter (TreeRoot + render props)
             @niche-ui/tree-vue     Vue adapter
```

This is a refactor, not a rewrite — because the architecture was designed for it from day one.
