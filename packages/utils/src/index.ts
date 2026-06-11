/**
 * @niche-ui/utils
 *
 * Shared utilities for all @niche-ui/* packages.
 * Tree-shakeable — import only what you need.
 */

// Math and geometry
export {
  clamp,
  lerp,
  mapRange,
  degToRad,
  radToDeg,
  distance,
  midpoint,
  pointOnCircle,
  round,
  inRange,
} from './math';

// className merge
export { cn } from './cn';

// TypeScript types (zero runtime cost — erased at compile time)
export type {
  AsProp,
  PropsWithAs,
  RenderProp,
  SlotProps,
  ForwardedRef,
  Size,
  Point,
  Rect,
  StrictRecord,
  Awaited,
  NonNullableProps,
} from './types';
