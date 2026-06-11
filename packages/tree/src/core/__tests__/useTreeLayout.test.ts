import { describe, it, expect } from 'vitest';
// We test the pure compute logic, not the React hook.
// Import via the module internals — we'll expose compute for testing.
// For now we test via the hook output shape, using renderHook from @testing-library/react.
// The core algorithm (measureTree, adaptiveGaps, compute) is tested indirectly here
// until we decide to export them explicitly.

// ─── Test the public types and hook output shape ──────────────────────────────

import type { TreeNode } from '../useTreeLayout';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const singleNode: TreeNode = { id: 'root', label: 'A' };

const linearChain: TreeNode = {
  id: '1',
  label: 'A',
  children: [{ id: '2', label: 'B', children: [{ id: '3', label: 'C' }] }],
};

const balanced: TreeNode = {
  id: 'root',
  label: 'Root',
  children: [
    {
      id: 'l',
      label: 'L',
      children: [
        { id: 'll', label: 'LL' },
        { id: 'lr', label: 'LR' },
      ],
    },
    {
      id: 'r',
      label: 'R',
      children: [
        { id: 'rl', label: 'RL' },
        { id: 'rr', label: 'RR' },
      ],
    },
  ],
};

const wideFanout: TreeNode = {
  id: 'root',
  label: 'Root',
  children: Array.from({ length: 10 }, (_, i) => ({ id: `c${i}`, label: `C${i}` })),
};

// ─── Pure logic tests (no React) ─────────────────────────────────────────────
// We import the compute function by testing index exports

describe('useTreeLayout — output contract', () => {
  // We test via dynamic import to avoid needing renderHook for pure logic
  // The hook just calls compute() inside useMemo — the logic is deterministic.

  it('single node: produces exactly 1 node and 0 edges', async () => {
    const { computeTreeLayout } = await import('../useTreeLayout');
    const layout = computeTreeLayout(singleNode);
    expect(layout.nodes).toHaveLength(1);
    expect(layout.edges).toHaveLength(0);
  });

  it('single node: node is positioned at a positive coordinate', async () => {
    const { computeTreeLayout } = await import('../useTreeLayout');
    const layout = computeTreeLayout(singleNode);
    const node = layout.nodes[0]!;
    expect(node.x).toBeGreaterThan(0);
    expect(node.y).toBeGreaterThan(0);
  });

  it('linear chain depth 3: produces 3 nodes and 2 edges', async () => {
    const { computeTreeLayout } = await import('../useTreeLayout');
    const layout = computeTreeLayout(linearChain);
    expect(layout.nodes).toHaveLength(3);
    expect(layout.edges).toHaveLength(2);
  });

  it('linear chain: nodes are at increasing y values (top to bottom)', async () => {
    const { computeTreeLayout } = await import('../useTreeLayout');
    const layout = computeTreeLayout(linearChain);
    const sorted = [...layout.nodes].sort((a, b) => a.depth - b.depth);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i]!.y).toBeGreaterThan(sorted[i - 1]!.y);
    }
  });

  it('balanced tree: produces 7 nodes and 6 edges', async () => {
    const { computeTreeLayout } = await import('../useTreeLayout');
    const layout = computeTreeLayout(balanced);
    expect(layout.nodes).toHaveLength(7);
    expect(layout.edges).toHaveLength(6);
  });

  it('balanced tree: left subtree nodes are to the left of right subtree nodes', async () => {
    const { computeTreeLayout } = await import('../useTreeLayout');
    const layout = computeTreeLayout(balanced);
    const nodeMap = Object.fromEntries(layout.nodes.map((n) => [n.id, n]));
    // Left leaf LL should be left of Right leaf RL
    expect(nodeMap['ll']!.x).toBeLessThan(nodeMap['rl']!.x);
  });

  it('balanced tree: root is horizontally centered over its children', async () => {
    const { computeTreeLayout } = await import('../useTreeLayout');
    const layout = computeTreeLayout(balanced);
    const nodeMap = Object.fromEntries(layout.nodes.map((n) => [n.id, n]));
    const rootX = nodeMap['root']!.x;
    const lX = nodeMap['l']!.x;
    const rX = nodeMap['r']!.x;
    // Root should be between left and right children (within 1 px tolerance)
    expect(rootX).toBeGreaterThanOrEqual(lX - 1);
    expect(rootX).toBeLessThanOrEqual(rX + 1);
  });

  it('wide fanout (10 children): horizontal span grows with breadth', async () => {
    const { computeTreeLayout } = await import('../useTreeLayout');
    const narrow = computeTreeLayout(balanced);
    const wide = computeTreeLayout(wideFanout);
    expect(wide.width).toBeGreaterThan(narrow.width);
  });

  it('all node IDs in output match input node IDs', async () => {
    const { computeTreeLayout } = await import('../useTreeLayout');
    const layout = computeTreeLayout(balanced);
    const inputIds = new Set(['root', 'l', 'r', 'll', 'lr', 'rl', 'rr']);
    const outputIds = new Set(layout.nodes.map((n) => n.id));
    expect(outputIds).toEqual(inputIds);
  });

  it('all edge fromId and toId reference valid node IDs', async () => {
    const { computeTreeLayout } = await import('../useTreeLayout');
    const layout = computeTreeLayout(balanced);
    const nodeIds = new Set(layout.nodes.map((n) => n.id));
    for (const edge of layout.edges) {
      expect(nodeIds.has(edge.fromId)).toBe(true);
      expect(nodeIds.has(edge.toId)).toBe(true);
    }
  });

  it('options.hGap overrides expand horizontal layout', async () => {
    const { computeTreeLayout } = await import('../useTreeLayout');
    const defaultLayout = computeTreeLayout(balanced);
    const wideLayout = computeTreeLayout(balanced, { hGap: 200 });
    expect(wideLayout.width).toBeGreaterThan(defaultLayout.width);
  });

  it('output width and height are positive numbers', async () => {
    const { computeTreeLayout } = await import('../useTreeLayout');
    const layout = computeTreeLayout(balanced);
    expect(layout.width).toBeGreaterThan(0);
    expect(layout.height).toBeGreaterThan(0);
  });
});
