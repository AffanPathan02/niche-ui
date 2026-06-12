import { describe, it, expect } from 'vitest';
import { computeFlameLayout } from '../useFlameLayout';
import type { FlameSample } from '../useFlameLayout';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const singleNode: FlameSample = { id: 'root', label: 'main', value: 100 };

const twoLevel: FlameSample = {
  id: 'root',
  label: 'main',
  value: 10,
  children: [
    { id: 'a', label: 'funcA', value: 60 },
    { id: 'b', label: 'funcB', value: 30 },
  ],
};
// root.totalValue = 10 + 60 + 30 = 100

const deepChain: FlameSample = {
  id: 'd0',
  label: 'level0',
  value: 0,
  children: [
    {
      id: 'd1',
      label: 'level1',
      value: 0,
      children: [
        {
          id: 'd2',
          label: 'level2',
          value: 0,
          children: [{ id: 'd3', label: 'level3', value: 100 }],
        },
      ],
    },
  ],
};

const balanced: FlameSample = {
  id: 'root',
  label: 'root',
  value: 0,
  children: [
    {
      id: 'l',
      label: 'left',
      value: 0,
      children: [
        { id: 'll', label: 'LL', value: 25 },
        { id: 'lr', label: 'LR', value: 25 },
      ],
    },
    {
      id: 'r',
      label: 'right',
      value: 0,
      children: [
        { id: 'rl', label: 'RL', value: 25 },
        { id: 'rr', label: 'RR', value: 25 },
      ],
    },
  ],
};
// root.totalValue = 100

// ─── Single node ──────────────────────────────────────────────────────────────

describe('computeFlameLayout — single node', () => {
  it('produces exactly 1 frame', () => {
    const layout = computeFlameLayout(singleNode);
    expect(layout.frames).toHaveLength(1);
  });

  it('frame spans full width', () => {
    const layout = computeFlameLayout(singleNode, { totalWidth: 800 });
    expect(layout.frames[0]!.width).toBeCloseTo(800, 1);
  });

  it('frame x starts at 0', () => {
    const layout = computeFlameLayout(singleNode);
    expect(layout.frames[0]!.x).toBe(0);
  });

  it('frame is at depth 0', () => {
    const layout = computeFlameLayout(singleNode);
    expect(layout.frames[0]!.depth).toBe(0);
  });

  it('maxDepth is 0', () => {
    const layout = computeFlameLayout(singleNode);
    expect(layout.maxDepth).toBe(0);
  });

  it('totalHeight equals one rowHeight', () => {
    const layout = computeFlameLayout(singleNode, { rowHeight: 28 });
    expect(layout.totalHeight).toBe(28);
  });
});

// ─── Two-level tree ───────────────────────────────────────────────────────────

describe('computeFlameLayout — two levels', () => {
  it('produces 3 frames', () => {
    const layout = computeFlameLayout(twoLevel);
    expect(layout.frames).toHaveLength(3);
  });

  it('root frame spans full width', () => {
    const layout = computeFlameLayout(twoLevel, { totalWidth: 1000 });
    const root = layout.frames.find((f) => f.id === 'root')!;
    expect(root.width).toBeCloseTo(1000, 1);
  });

  it('child widths are proportional to their totalValues', () => {
    const layout = computeFlameLayout(twoLevel, { totalWidth: 1000 });
    const a = layout.frames.find((f) => f.id === 'a')!;
    const b = layout.frames.find((f) => f.id === 'b')!;
    // a.totalValue=60, b.totalValue=30, root=100
    expect(a.width).toBeCloseTo(600, 1);
    expect(b.width).toBeCloseTo(300, 1);
  });

  it('child b starts where child a ends', () => {
    const layout = computeFlameLayout(twoLevel, { totalWidth: 1000 });
    const a = layout.frames.find((f) => f.id === 'a')!;
    const b = layout.frames.find((f) => f.id === 'b')!;
    expect(b.x).toBeCloseTo(a.x + a.width, 1);
  });

  it('children are at depth 1', () => {
    const layout = computeFlameLayout(twoLevel);
    const a = layout.frames.find((f) => f.id === 'a')!;
    const b = layout.frames.find((f) => f.id === 'b')!;
    expect(a.depth).toBe(1);
    expect(b.depth).toBe(1);
  });

  it('totalValue and selfValue are correct for root', () => {
    const layout = computeFlameLayout(twoLevel);
    const root = layout.frames.find((f) => f.id === 'root')!;
    expect(root.selfValue).toBe(10);
    expect(root.totalValue).toBe(100);
  });

  it('maxDepth is 1', () => {
    const layout = computeFlameLayout(twoLevel);
    expect(layout.maxDepth).toBe(1);
  });
});

// ─── Deep chain ───────────────────────────────────────────────────────────────

describe('computeFlameLayout — deep chain', () => {
  it('produces 4 frames', () => {
    const layout = computeFlameLayout(deepChain);
    expect(layout.frames).toHaveLength(4);
  });

  it('maxDepth is 3', () => {
    const layout = computeFlameLayout(deepChain);
    expect(layout.maxDepth).toBe(3);
  });

  it('all frames span full width (linear chain)', () => {
    const layout = computeFlameLayout(deepChain, { totalWidth: 800 });
    for (const frame of layout.frames) {
      expect(frame.width).toBeCloseTo(800, 1);
    }
  });

  it('depths are sequential 0–3', () => {
    const layout = computeFlameLayout(deepChain);
    const depths = layout.frames.map((f) => f.depth).sort((a, b) => a - b);
    expect(depths).toEqual([0, 1, 2, 3]);
  });

  it('y coordinates increase with depth', () => {
    const layout = computeFlameLayout(deepChain, { rowHeight: 28 });
    const sorted = [...layout.frames].sort((a, b) => a.depth - b.depth);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i]!.y).toBeGreaterThan(sorted[i - 1]!.y);
    }
  });
});

// ─── Balanced tree ────────────────────────────────────────────────────────────

describe('computeFlameLayout — balanced tree', () => {
  it('produces 7 frames', () => {
    const layout = computeFlameLayout(balanced);
    expect(layout.frames).toHaveLength(7);
  });

  it('left subtree frames are to the left of right subtree frames', () => {
    const layout = computeFlameLayout(balanced, { totalWidth: 800 });
    const frameMap = Object.fromEntries(layout.frames.map((f) => [f.id, f]));
    expect(frameMap['ll']!.x).toBeLessThan(frameMap['rl']!.x);
    expect(frameMap['lr']!.x).toBeLessThan(frameMap['rl']!.x);
  });

  it('all leaf frames sum to totalWidth', () => {
    const layout = computeFlameLayout(balanced, { totalWidth: 800 });
    const leaves = layout.frames.filter((f) => f.depth === 2);
    const sum = leaves.reduce((acc, f) => acc + f.width, 0);
    expect(sum).toBeCloseTo(800, 1);
  });

  it('rootValue is set correctly on every frame', () => {
    const layout = computeFlameLayout(balanced);
    for (const frame of layout.frames) {
      expect(frame.rootValue).toBe(100);
    }
  });

  it('parentId is set correctly', () => {
    const layout = computeFlameLayout(balanced);
    const frameMap = Object.fromEntries(layout.frames.map((f) => [f.id, f]));
    expect(frameMap['l']!.parentId).toBe('root');
    expect(frameMap['r']!.parentId).toBe('root');
    expect(frameMap['ll']!.parentId).toBe('l');
    expect(frameMap['rl']!.parentId).toBe('r');
    expect(frameMap['root']!.parentId).toBeUndefined();
  });
});

// ─── Options ──────────────────────────────────────────────────────────────────

describe('computeFlameLayout — options', () => {
  it('rowHeight option changes y coordinates', () => {
    const layout = computeFlameLayout(deepChain, { rowHeight: 40 });
    const leaf = layout.frames.find((f) => f.id === 'd3')!;
    expect(leaf.y).toBe(3 * 40); // depth 3 * rowHeight 40
  });

  it('totalWidth option scales all frame widths', () => {
    const small = computeFlameLayout(singleNode, { totalWidth: 400 });
    const large = computeFlameLayout(singleNode, { totalWidth: 1200 });
    expect(large.frames[0]!.width).toBe(3 * small.frames[0]!.width);
  });

  it('minWidth filters out narrow frames from visibleFrames', () => {
    // Create a node with a tiny child
    const data: FlameSample = {
      id: 'root',
      label: 'root',
      value: 0,
      children: [
        { id: 'big', label: 'big', value: 999 },
        { id: 'tiny', label: 'tiny', value: 1 },
      ],
    };
    const layout = computeFlameLayout(data, { totalWidth: 1000, minWidth: 2 });
    // tiny = (1/1000) * 1000 = 1px, which is < minWidth=2
    const tinyInVisible = layout.visibleFrames.find((f) => f.id === 'tiny');
    expect(tinyInVisible).toBeUndefined();
    // but it IS in frames (unfiltered)
    const tinyInAll = layout.frames.find((f) => f.id === 'tiny');
    expect(tinyInAll).toBeDefined();
  });

  it('totalHeight = (maxDepth + 1) * rowHeight', () => {
    const layout = computeFlameLayout(deepChain, { rowHeight: 30 });
    expect(layout.totalHeight).toBe((layout.maxDepth + 1) * 30);
  });
});

// ─── All IDs round-trip ───────────────────────────────────────────────────────

describe('computeFlameLayout — ID integrity', () => {
  it('all input IDs appear exactly once in frames output', () => {
    const layout = computeFlameLayout(balanced);
    const inputIds = new Set(['root', 'l', 'r', 'll', 'lr', 'rl', 'rr']);
    const outputIds = new Set(layout.frames.map((f) => f.id));
    expect(outputIds).toEqual(inputIds);
  });
});
