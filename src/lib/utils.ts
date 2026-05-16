import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge tailwind classes safely. Filters falsy values and dedupes conflicting
 * classes (e.g. `px-2 px-4` → `px-4`).
 *
 *   cn('px-2', isActive && 'bg-gold-500', className)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Format a number as Indian Rupee (₹1,23,456). */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount);
}

/** Compute discount percentage from MRP and selling price. */
export function discountPct(mrp: number, price: number): number {
  if (!mrp || mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}
