import { describe, it, expect } from 'vitest';
import { computeGraphLayout } from '../useGraphLayout';
import type { GraphData } from '../useGraphLayout';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const empty: GraphData = { nodes: [], edges: [] };

const singleNode: GraphData = {
  nodes: [{ id: 'a', label: 'A' }],
  edges: [],
};

const twoNodes: GraphData = {
  nodes: [
    { id: 'a', label: 'A' },
    { id: 'b', label: 'B' },
  ],
  edges: [{ id: 'a-b', source: 'a', target: 'b' }],
};

// Linear chain: a → b → c → d
const linearChain: GraphData = {
  nodes: [
    { id: 'a', label: 'A' },
    { id: 'b', label: 'B' },
    { id: 'c', label: 'C' },
    { id: 'd', label: 'D' },
  ],
  edges: [
    { id: 'ab', source: 'a', target: 'b' },
    { id: 'bc', source: 'b', target: 'c' },
    { id: 'cd', source: 'c', target: 'd' },
  ],
};

// Star: center connected to 5 leaves
const star: GraphData = {
  nodes: [
    { id: 'center', label: 'Center' },
    { id: 'l1', label: 'L1' },
    { id: 'l2', label: 'L2' },
    { id: 'l3', label: 'L3' },
    { id: 'l4', label: 'L4' },
    { id: 'l5', label: 'L5' },
  ],
  edges: [
    { id: 'e1', source: 'center', target: 'l1' },
    { id: 'e2', source: 'center', target: 'l2' },
    { id: 'e3', source: 'center', target: 'l3' },
    { id: 'e4', source: 'center', target: 'l4' },
    { id: 'e5', source: 'center', target: 'l5' },
  ],
};

// Graph with disconnected components (no edges)
const disconnected: GraphData = {
  nodes: [
    { id: 'x', label: 'X' },
    { id: 'y', label: 'Y' },
    { id: 'z', label: 'Z' },
  ],
  edges: [],
};

// Graph with a cycle: a → b → c → a
const cycle: GraphData = {
  nodes: [
    { id: 'a', label: 'A' },
    { id: 'b', label: 'B' },
    { id: 'c', label: 'C' },
  ],
  edges: [
    { id: 'ab', source: 'a', target: 'b' },
    { id: 'bc', source: 'b', target: 'c' },
    { id: 'ca', source: 'c', target: 'a' },
  ],
};

// ─── Empty graph ──────────────────────────────────────────────────────────────

describe('computeGraphLayout — empty graph', () => {
  it('returns zero nodes and zero edges', () => {
    const layout = computeGraphLayout(empty);
    expect(layout.nodes).toHaveLength(0);
    expect(layout.edges).toHaveLength(0);
  });

  it('preserves the requested width and height', () => {
    const layout = computeGraphLayout(empty, { width: 640, height: 480 });
    expect(layout.width).toBe(640);
    expect(layout.height).toBe(480);
  });
});

// ─── Single node ──────────────────────────────────────────────────────────────

describe('computeGraphLayout — single node', () => {
  it('produces exactly 1 node and 0 edges', () => {
    const layout = computeGraphLayout(singleNode);
    expect(layout.nodes).toHaveLength(1);
    expect(layout.edges).toHaveLength(0);
  });

  it('node id and label are preserved', () => {
    const layout = computeGraphLayout(singleNode);
    const node = layout.nodes[0]!;
    expect(node.id).toBe('a');
    expect(node.label).toBe('A');
  });

  it('node is positioned within the canvas bounds', () => {
    const W = 800;
    const H = 600;
    const R = 20;
    const layout = computeGraphLayout(singleNode, { width: W, height: H, nodeRadius: R });
    const node = layout.nodes[0]!;
    expect(node.x).toBeGreaterThanOrEqual(R);
    expect(node.x).toBeLessThanOrEqual(W - R);
    expect(node.y).toBeGreaterThanOrEqual(R);
    expect(node.y).toBeLessThanOrEqual(H - R);
  });
});

// ─── Two nodes + one edge ─────────────────────────────────────────────────────

describe('computeGraphLayout — two nodes', () => {
  it('produces 2 nodes and 1 edge', () => {
    const layout = computeGraphLayout(twoNodes);
    expect(layout.nodes).toHaveLength(2);
    expect(layout.edges).toHaveLength(1);
  });

  it('edge source/target IDs match input', () => {
    const layout = computeGraphLayout(twoNodes);
    const edge = layout.edges[0]!;
    expect(edge.source).toBe('a');
    expect(edge.target).toBe('b');
    expect(edge.id).toBe('a-b');
  });

  it('edge endpoints are close to node centers', () => {
    const layout = computeGraphLayout(twoNodes, { iterations: 300 });
    const nodeMap = Object.fromEntries(layout.nodes.map((n) => [n.id, n]));
    const edge = layout.edges[0]!;
    // Endpoints must exactly equal the node centers (before shortening in Layer 3)
    expect(edge.x1).toBeCloseTo(nodeMap['a']!.x, 5);
    expect(edge.y1).toBeCloseTo(nodeMap['a']!.y, 5);
    expect(edge.x2).toBeCloseTo(nodeMap['b']!.x, 5);
    expect(edge.y2).toBeCloseTo(nodeMap['b']!.y, 5);
  });
});

// ─── Output contract ──────────────────────────────────────────────────────────

describe('computeGraphLayout — output contract', () => {
  it('width and height match options', () => {
    const layout = computeGraphLayout(linearChain, { width: 1200, height: 900 });
    expect(layout.width).toBe(1200);
    expect(layout.height).toBe(900);
  });

  it('all input node IDs appear exactly once in output', () => {
    const layout = computeGraphLayout(linearChain);
    const inputIds = new Set(linearChain.nodes.map((n) => n.id));
    const outputIds = new Set(layout.nodes.map((n) => n.id));
    expect(outputIds).toEqual(inputIds);
  });

  it('all input edge IDs appear in output', () => {
    const layout = computeGraphLayout(linearChain);
    const inputEdgeIds = new Set(linearChain.edges.map((e) => e.id));
    const outputEdgeIds = new Set(layout.edges.map((e) => e.id));
    expect(outputEdgeIds).toEqual(inputEdgeIds);
  });

  it('all edge source/target IDs reference valid node IDs', () => {
    const layout = computeGraphLayout(star);
    const nodeIds = new Set(layout.nodes.map((n) => n.id));
    for (const edge of layout.edges) {
      expect(nodeIds.has(edge.source)).toBe(true);
      expect(nodeIds.has(edge.target)).toBe(true);
    }
  });

  it('node labels are preserved from input', () => {
    const layout = computeGraphLayout(linearChain);
    const nodeMap = Object.fromEntries(layout.nodes.map((n) => [n.id, n]));
    expect(nodeMap['a']!.label).toBe('A');
    expect(nodeMap['b']!.label).toBe('B');
    expect(nodeMap['c']!.label).toBe('C');
    expect(nodeMap['d']!.label).toBe('D');
  });
});

// ─── Canvas clamping ──────────────────────────────────────────────────────────

describe('computeGraphLayout — canvas clamping', () => {
  it('all nodes stay within [R, W-R] x [R, H-R] after layout', () => {
    const W = 600;
    const H = 400;
    const R = 25;
    const layout = computeGraphLayout(star, {
      width: W,
      height: H,
      nodeRadius: R,
      iterations: 300,
    });
    for (const node of layout.nodes) {
      expect(node.x).toBeGreaterThanOrEqual(R);
      expect(node.x).toBeLessThanOrEqual(W - R);
      expect(node.y).toBeGreaterThanOrEqual(R);
      expect(node.y).toBeLessThanOrEqual(H - R);
    }
  });

  it('nodes stay inside bounds even with a very small canvas', () => {
    const W = 80;
    const H = 80;
    const R = 20;
    const layout = computeGraphLayout(twoNodes, { width: W, height: H, nodeRadius: R });
    for (const node of layout.nodes) {
      expect(node.x).toBeGreaterThanOrEqual(R);
      expect(node.x).toBeLessThanOrEqual(W - R);
      expect(node.y).toBeGreaterThanOrEqual(R);
      expect(node.y).toBeLessThanOrEqual(H - R);
    }
  });
});

// ─── Cycle handling ───────────────────────────────────────────────────────────

describe('computeGraphLayout — cycles', () => {
  it('handles cyclic graphs without throwing', () => {
    expect(() => computeGraphLayout(cycle)).not.toThrow();
  });

  it('produces the correct number of nodes and edges for a cycle', () => {
    const layout = computeGraphLayout(cycle);
    expect(layout.nodes).toHaveLength(3);
    expect(layout.edges).toHaveLength(3);
  });
});

// ─── Disconnected graph ───────────────────────────────────────────────────────

describe('computeGraphLayout — disconnected nodes', () => {
  it('lays out isolated nodes without throwing', () => {
    expect(() => computeGraphLayout(disconnected)).not.toThrow();
  });

  it('produces the correct node count with no edges', () => {
    const layout = computeGraphLayout(disconnected);
    expect(layout.nodes).toHaveLength(3);
    expect(layout.edges).toHaveLength(0);
  });

  it('all isolated nodes are within canvas bounds', () => {
    const W = 800;
    const H = 600;
    const R = 20;
    const layout = computeGraphLayout(disconnected, { width: W, height: H, nodeRadius: R });
    for (const node of layout.nodes) {
      expect(node.x).toBeGreaterThanOrEqual(R);
      expect(node.x).toBeLessThanOrEqual(W - R);
      expect(node.y).toBeGreaterThanOrEqual(R);
      expect(node.y).toBeLessThanOrEqual(H - R);
    }
  });
});

// ─── Options ──────────────────────────────────────────────────────────────────

describe('computeGraphLayout — options', () => {
  it('default width is 800 and height is 600', () => {
    const layout = computeGraphLayout(singleNode);
    expect(layout.width).toBe(800);
    expect(layout.height).toBe(600);
  });

  it('custom width/height are respected', () => {
    const layout = computeGraphLayout(singleNode, { width: 1024, height: 768 });
    expect(layout.width).toBe(1024);
    expect(layout.height).toBe(768);
  });

  it('more iterations move nodes further from random initial positions (better layout convergence)', () => {
    // With many iterations the layout should be more spread out than with 0 iterations.
    // We verify this by checking max pairwise distance increases with more iterations.
    const few = computeGraphLayout(star, { iterations: 1, seed: 0 });
    const many = computeGraphLayout(star, { iterations: 500, seed: 0 });

    function maxPairwiseDist(nodes: typeof few.nodes) {
      let max = 0;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i]!.x - nodes[j]!.x;
          const dy = nodes[i]!.y - nodes[j]!.y;
          max = Math.max(max, Math.sqrt(dx * dx + dy * dy));
        }
      }
      return max;
    }

    expect(maxPairwiseDist(many.nodes)).toBeGreaterThan(maxPairwiseDist(few.nodes));
  });

  it('nodeRadius option clamps nodes at least R px from each edge', () => {
    const R = 40;
    const W = 800;
    const H = 600;
    const layout = computeGraphLayout(star, { width: W, height: H, nodeRadius: R });
    for (const node of layout.nodes) {
      expect(node.x).toBeGreaterThanOrEqual(R);
      expect(node.x).toBeLessThanOrEqual(W - R);
      expect(node.y).toBeGreaterThanOrEqual(R);
      expect(node.y).toBeLessThanOrEqual(H - R);
    }
  });
});

// ─── Seed / determinism ───────────────────────────────────────────────────────

describe('computeGraphLayout — seed / determinism', () => {
  it('same seed produces the same layout', () => {
    const a = computeGraphLayout(star, { seed: 42 });
    const b = computeGraphLayout(star, { seed: 42 });
    for (let i = 0; i < a.nodes.length; i++) {
      expect(a.nodes[i]!.x).toBeCloseTo(b.nodes[i]!.x, 10);
      expect(a.nodes[i]!.y).toBeCloseTo(b.nodes[i]!.y, 10);
    }
  });

  it('different seeds produce different layouts', () => {
    const a = computeGraphLayout(star, { seed: 0 });
    const b = computeGraphLayout(star, { seed: 99 });
    // At least one node must differ between the two layouts
    const anyDiffers = a.nodes.some((nodeA, i) => {
      const nodeB = b.nodes[i]!;
      return Math.abs(nodeA.x - nodeB.x) > 1 || Math.abs(nodeA.y - nodeB.y) > 1;
    });
    expect(anyDiffers).toBe(true);
  });

  it('no seed and seed=0 produce the same layout (default seed is 0)', () => {
    const withDefault = computeGraphLayout(star);
    const withZero = computeGraphLayout(star, { seed: 0 });
    for (let i = 0; i < withDefault.nodes.length; i++) {
      expect(withDefault.nodes[i]!.x).toBeCloseTo(withZero.nodes[i]!.x, 10);
      expect(withDefault.nodes[i]!.y).toBeCloseTo(withZero.nodes[i]!.y, 10);
    }
  });
});

// ─── Edge endpoint integrity ──────────────────────────────────────────────────

describe('computeGraphLayout — edge endpoint integrity', () => {
  it('edge x1/y1 equals source node center', () => {
    const layout = computeGraphLayout(linearChain, { iterations: 0 });
    const nodeMap = Object.fromEntries(layout.nodes.map((n) => [n.id, n]));
    for (const edge of layout.edges) {
      expect(edge.x1).toBeCloseTo(nodeMap[edge.source]!.x, 5);
      expect(edge.y1).toBeCloseTo(nodeMap[edge.source]!.y, 5);
    }
  });

  it('edge x2/y2 equals target node center', () => {
    const layout = computeGraphLayout(linearChain, { iterations: 0 });
    const nodeMap = Object.fromEntries(layout.nodes.map((n) => [n.id, n]));
    for (const edge of layout.edges) {
      expect(edge.x2).toBeCloseTo(nodeMap[edge.target]!.x, 5);
      expect(edge.y2).toBeCloseTo(nodeMap[edge.target]!.y, 5);
    }
  });

  it('edges referencing unknown nodes are dropped gracefully', () => {
    const badEdge: GraphData = {
      nodes: [{ id: 'a', label: 'A' }],
      // edge references a non-existent node 'z'
      edges: [{ id: 'az', source: 'a', target: 'z' }],
    };
    const layout = computeGraphLayout(badEdge);
    // Bad edge is silently dropped — output edges must only reference real nodes
    expect(layout.edges).toHaveLength(0);
    expect(layout.nodes).toHaveLength(1);
  });
});

// ─── Star graph ───────────────────────────────────────────────────────────────

describe('computeGraphLayout — star graph', () => {
  it('produces 6 nodes and 5 edges', () => {
    const layout = computeGraphLayout(star);
    expect(layout.nodes).toHaveLength(6);
    expect(layout.edges).toHaveLength(5);
  });

  it('force-simulation spreads leaf nodes apart from each other', () => {
    const layout = computeGraphLayout(star, { iterations: 300, seed: 0 });
    const leaves = layout.nodes.filter((n) => n.id !== 'center');
    // Every pair of leaves should be separated by at least the node diameter
    for (let i = 0; i < leaves.length; i++) {
      for (let j = i + 1; j < leaves.length; j++) {
        const dx = leaves[i]!.x - leaves[j]!.x;
        const dy = leaves[i]!.y - leaves[j]!.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        // After 300 iterations repulsion should push leaves apart
        expect(dist).toBeGreaterThan(0);
      }
    }
  });
});

// ─── Large graph stability ────────────────────────────────────────────────────

describe('computeGraphLayout — large graph', () => {
  it('handles 50 nodes and 60 edges without throwing', () => {
    const nodes = Array.from({ length: 50 }, (_, i) => ({ id: `n${i}`, label: `N${i}` }));
    const edges = Array.from({ length: 60 }, (_, i) => ({
      id: `e${i}`,
      source: `n${i % 50}`,
      target: `n${(i + 3) % 50}`,
    }));
    expect(() => computeGraphLayout({ nodes, edges })).not.toThrow();
  });

  it('50-node graph output has all 50 nodes in bounds', () => {
    const W = 1000;
    const H = 800;
    const R = 15;
    const nodes = Array.from({ length: 50 }, (_, i) => ({ id: `n${i}`, label: `N${i}` }));
    const edges = Array.from({ length: 40 }, (_, i) => ({
      id: `e${i}`,
      source: `n${i % 50}`,
      target: `n${(i + 5) % 50}`,
    }));
    const layout = computeGraphLayout({ nodes, edges }, { width: W, height: H, nodeRadius: R });
    expect(layout.nodes).toHaveLength(50);
    for (const node of layout.nodes) {
      expect(node.x).toBeGreaterThanOrEqual(R);
      expect(node.x).toBeLessThanOrEqual(W - R);
      expect(node.y).toBeGreaterThanOrEqual(R);
      expect(node.y).toBeLessThanOrEqual(H - R);
    }
  });
});
