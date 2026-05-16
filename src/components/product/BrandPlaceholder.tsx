/**
 * Brand-gradient placeholder for products without uploaded photos.
 *
 * Until the ER4U image acquisition is sorted (see PROJECT_NOTES Phase 2.1),
 * every ER4U-imported product ships with an empty `images[]`. Rather than
 * showing a broken-image icon, we render an on-brand placeholder that
 * looks intentional — navy gradient with the brand name + gold accent glyph.
 *
 * Deterministic hue rotation per brand keeps adjacent cards visually distinct.
 */
import { cn } from '@/lib/utils';

type Props = {
  brand?: string | null;
  productName?: string | null;
  className?: string;
  /** Show the product name below the brand label. Default: true */
  showName?: boolean;
};

// Stable colour palette — every brand maps to one of these via name hash.
// Keeps all placeholders on-brand (navy/gold/cream tones) but visually varied.
const PALETTES: Array<{ from: string; to: string; accent: string }> = [
  { from: '#0A1128', to: '#1A2547', accent: '#C8991E' }, // navy → mid navy / gold
  { from: '#1A2547', to: '#0A1128', accent: '#E5B845' }, // mid navy → navy / brighter gold
  { from: '#2C1810', to: '#0A1128', accent: '#C8991E' }, // espresso → navy / gold
  { from: '#0A1128', to: '#3B2A4A', accent: '#D4A574' }, // navy → plum / warm gold
  { from: '#1A1A2E', to: '#16213E', accent: '#C8991E' }, // deep ink → navy / gold
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function BrandPlaceholder({ brand, productName, className, showName = true }: Props) {
  const label = (brand && brand.trim()) || 'DHARSAN';
  const palette = PALETTES[hash(label) % PALETTES.length];

  return (
    <div
      className={cn('relative w-full h-full overflow-hidden flex flex-col items-center justify-center text-center', className)}
      style={{
        background: `linear-gradient(135deg, ${palette.from} 0%, ${palette.to} 100%)`,
      }}
      aria-label={`Placeholder image for ${productName ?? label}`}
    >
      {/* Soft radial highlight */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 30% 25%, ${palette.accent}33 0%, transparent 55%)`,
        }}
      />
      {/* Subtle diagonal weave pattern */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, ${palette.accent} 0px, ${palette.accent} 1px, transparent 1px, transparent 18px)`,
        }}
      />

      {/* Gold rhombus glyph */}
      <div className="relative mb-4">
        <div
          className="w-12 h-12 rotate-45 border"
          style={{ borderColor: palette.accent, borderWidth: 1.5 }}
        />
        <div
          className="absolute inset-0 m-auto w-2 h-2 rotate-45"
          style={{ backgroundColor: palette.accent, top: 0, left: 0, right: 0, bottom: 0 }}
        />
      </div>

      {/* Brand label */}
      <div
        className="relative font-display text-lg sm:text-xl font-light tracking-[0.25em] uppercase px-4 break-words"
        style={{ color: palette.accent }}
      >
        {label}
      </div>

      {/* Product name (small, faded) */}
      {showName && productName && (
        <div className="relative mt-2 font-body text-[10px] sm:text-xs text-white/40 uppercase tracking-wider px-4 line-clamp-2 max-w-[80%]">
          {productName.replace(/\s*\([^)]+\)\s*$/, '')}
        </div>
      )}

      {/* Bottom accent line */}
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 h-px w-16"
        style={{ backgroundColor: `${palette.accent}80` }}
      />
    </div>
  );
}
