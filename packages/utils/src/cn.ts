/**
 * @niche-ui/utils — className merge helper
 *
 * Lightweight alternative to clsx: merges class strings, arrays, and conditionals.
 * Does NOT handle Tailwind conflict resolution (no twMerge).
 * If you need Tailwind-aware merging, compose this with tailwind-merge in your app.
 *
 * @example
 * cn('foo', 'bar')           → 'foo bar'
 * cn('foo', undefined, 'bar') → 'foo bar'
 * cn('foo', { active: true, disabled: false }) → 'foo active'
 */

type ClassValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | ClassValue[]
  | { [key: string]: boolean | null | undefined };

function flatten(value: ClassValue): string {
  if (!value && value !== 0) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(flatten).filter(Boolean).join(' ');
  if (typeof value === 'object') {
    return Object.entries(value)
      .filter(([, v]) => Boolean(v))
      .map(([k]) => k)
      .join(' ');
  }
  return '';
}

export function cn(...inputs: ClassValue[]): string {
  return inputs.map(flatten).filter(Boolean).join(' ');
}
