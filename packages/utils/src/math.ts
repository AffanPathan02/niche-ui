/**
 * @niche-ui/utils — geometry and math helpers
 *
 * Pure functions (no side effects, no DOM). Safe to run in Node.js, Canvas, WebGL.
 */

// ─── Range utilities ──────────────────────────────────────────────────────────

/**
 * Clamps a value between min and max (inclusive).
 * @example clamp(15, 0, 10) → 10
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation between a and b by t ∈ [0, 1].
 * @example lerp(0, 100, 0.5) → 50
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Maps a value from one range [inMin, inMax] to another [outMin, outMax].
 * @example mapRange(5, 0, 10, 0, 100) → 50
 */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);
}

// ─── Angle utilities ──────────────────────────────────────────────────────────

/** Converts degrees to radians. */
export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Converts radians to degrees. */
export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

// ─── 2D geometry ──────────────────────────────────────────────────────────────

/** Euclidean distance between two points. */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/** Midpoint between two points. */
export function midpoint(x1: number, y1: number, x2: number, y2: number): { x: number; y: number } {
  return { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };
}

/**
 * Given a center point and a radius, returns the (x, y) on the circumference
 * at the given angle (in radians, 0 = right).
 */
export function pointOnCircle(cx: number, cy: number, r: number, angle: number): { x: number; y: number } {
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  };
}

// ─── Number utilities ─────────────────────────────────────────────────────────

/** Rounds to a given number of decimal places. */
export function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/** Returns true if value is between min and max (inclusive). */
export function inRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}
