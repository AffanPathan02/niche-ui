/**
 * @niche-ui/utils — shared type utilities
 *
 * These are the building blocks for composable, type-safe component APIs.
 * Import these in any @niche-ui/* package. Do not duplicate them.
 */
import type React from 'react';

// ─── Polymorphic "as" prop pattern ───────────────────────────────────────────
// Used when a component can render as different HTML elements or other components.
// Example: <Box as="section"> or <Box as={Link}>

export type AsProp<C extends React.ElementType> = {
  as?: C;
};

export type PropsWithAs<C extends React.ElementType, Props = Record<string, never>> = AsProp<C> &
  Omit<React.ComponentPropsWithoutRef<C>, keyof Props | 'as'> &
  Props;

// ─── Slot / render prop pattern ──────────────────────────────────────────────
// Used by headless components to let consumers control what gets rendered.
// Example: render={(node) => <circle cx={node.x} cy={node.y} r={18} />}

export type RenderProp<T> = (props: T) => React.ReactNode;

export interface SlotProps<T> {
  render: RenderProp<T>;
}

// ─── Ref forwarding helper ────────────────────────────────────────────────────

export type ForwardedRef<T> = React.ForwardedRef<T>;

// ─── Size / geometry ──────────────────────────────────────────────────────────

export interface Size {
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Rect extends Point, Size {}

// ─── Strict optional record ───────────────────────────────────────────────────
// Prevents accidental {[key: string]: unknown} spreads

export type StrictRecord<K extends string, V> = { [P in K]: V };

// ─── Awaited unwrap ───────────────────────────────────────────────────────────

export type Awaited<T> = T extends Promise<infer U> ? U : T;

// ─── Non-nullable utilities ───────────────────────────────────────────────────

export type NonNullableProps<T> = { [K in keyof T]-?: NonNullable<T[K]> };
