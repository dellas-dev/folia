import type { CornerPoints } from './perspective/homography'

export interface MockupTemplate {
  id: string
  /** Short angle label shown below the thumbnail, e.g. "Easel", "Flat Lay" */
  angleLabel: string
  angleEmoji: string
  /** Full-resolution image URL used for compositing (target ~1500px on longest side) */
  imageUrl: string
  /** Lower-res thumbnail shown in the UI grid (~480px) */
  thumbUrl: string
  /** Corner coordinates as fractions 0.0–1.0 of the full-res image dimensions */
  corners: {
    topLeft:     { x: number; y: number }
    topRight:    { x: number; y: number }
    bottomRight: { x: number; y: number }
    bottomLeft:  { x: number; y: number }
  }
  /** Use multiply only for scenes where visible paper texture should show through the artwork. */
  blendMode?: 'over' | 'multiply'
}

export interface MockupBundle {
  id: string
  label: string
  emoji: string
  description: string
  /** Representative swatch colors for future smart-matching (CSS hex strings) */
  palette: string[]
  templates: MockupTemplate[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Convert percentage-based corners (0.0–1.0) to absolute pixel CornerPoints.
 * Call this just before passing corners to compositeOverlay.
 */
export function cornersToPixels(
  pct: MockupTemplate['corners'],
  width: number,
  height: number
): CornerPoints {
  return {
    topLeft:     { x: pct.topLeft.x     * width, y: pct.topLeft.y     * height },
    topRight:    { x: pct.topRight.x    * width, y: pct.topRight.y    * height },
    bottomRight: { x: pct.bottomRight.x * width, y: pct.bottomRight.y * height },
    bottomLeft:  { x: pct.bottomLeft.x  * width, y: pct.bottomLeft.y  * height },
  }
}

/** Flat list of all templates across all bundles — used by the API route. */
export function getAllTemplates(): MockupTemplate[] {
  return MOCKUP_BUNDLES.flatMap((b) => b.templates)
}

export function getTemplateById(id: string): MockupTemplate | undefined {
  return getAllTemplates().find((t) => t.id === id)
}

export function getBundleByTemplateId(templateId: string): MockupBundle | undefined {
  return MOCKUP_BUNDLES.find((b) => b.templates.some((t) => t.id === templateId))
}

// ─── Bundle Library ───────────────────────────────────────────────────────────
//
// NOTE FOR DEPLOYMENT:
// Replace imageUrl / thumbUrl with your own hosted photos.
// Corners are fractions (0.0–1.0) of the full-res image dimensions — measure
// the 4 inner corners of the design surface in each photo before publishing.
// Placeholder images use picsum.photos with fixed seeds for dev consistency.

export const MOCKUP_BUNDLES: MockupBundle[] = [
  // ── 1. Eucalyptus Suite ────────────────────────────────────────────────────
  {
    id: 'eucalyptus',
    label: 'Eucalyptus Suite',
    emoji: '🌿',
    description: 'Natural greenery, linen textures, warm sage tones',
    palette: ['#7d9b7a', '#c8b89a', '#eae5dc'],
    templates: [
      {
        id: 'eucalyptus-easel',
        angleLabel: 'Easel',
        angleEmoji: '🖼️',
        imageUrl:  'https://picsum.photos/seed/euc-easel/1500/1000',
        thumbUrl:  'https://picsum.photos/seed/euc-easel/480/320',
        corners: {
          topLeft:     { x: 0.27, y: 0.09 },
          topRight:    { x: 0.73, y: 0.09 },
          bottomRight: { x: 0.73, y: 0.88 },
          bottomLeft:  { x: 0.27, y: 0.88 },
        },
      },
      {
        id: 'eucalyptus-flatlay',
        angleLabel: 'Flat Lay',
        angleEmoji: '📋',
        imageUrl:  'https://picsum.photos/seed/euc-flat/1500/1000',
        thumbUrl:  'https://picsum.photos/seed/euc-flat/480/320',
        corners: {
          topLeft:     { x: 0.18, y: 0.14 },
          topRight:    { x: 0.68, y: 0.12 },
          bottomRight: { x: 0.71, y: 0.82 },
          bottomLeft:  { x: 0.16, y: 0.84 },
        },
      },
      {
        id: 'eucalyptus-table',
        angleLabel: 'Table Card',
        angleEmoji: '🍃',
        imageUrl:  'https://picsum.photos/seed/euc-table/1500/1000',
        thumbUrl:  'https://picsum.photos/seed/euc-table/480/320',
        blendMode: 'multiply',
        corners: {
          topLeft:     { x: 0.30, y: 0.17 },
          topRight:    { x: 0.70, y: 0.15 },
          bottomRight: { x: 0.72, y: 0.79 },
          bottomLeft:  { x: 0.28, y: 0.81 },
        },
      },
    ],
  },

  // ── 2. Dusty Rose Suite ────────────────────────────────────────────────────
  {
    id: 'dusty-rose',
    label: 'Dusty Rose Suite',
    emoji: '🌸',
    description: 'Blush pinks, dried roses, soft romantic light',
    palette: ['#c9848c', '#e8c4c8', '#f5ede8'],
    templates: [
      {
        id: 'dusty-rose-easel',
        angleLabel: 'Easel',
        angleEmoji: '🖼️',
        imageUrl:  'https://picsum.photos/seed/rose-easel/1500/1000',
        thumbUrl:  'https://picsum.photos/seed/rose-easel/480/320',
        corners: {
          topLeft:     { x: 0.26, y: 0.10 },
          topRight:    { x: 0.74, y: 0.10 },
          bottomRight: { x: 0.73, y: 0.87 },
          bottomLeft:  { x: 0.27, y: 0.87 },
        },
      },
      {
        id: 'dusty-rose-flatlay',
        angleLabel: 'Flat Lay',
        angleEmoji: '📋',
        imageUrl:  'https://picsum.photos/seed/rose-flat/1500/1000',
        thumbUrl:  'https://picsum.photos/seed/rose-flat/480/320',
        corners: {
          topLeft:     { x: 0.20, y: 0.18 },
          topRight:    { x: 0.72, y: 0.16 },
          bottomRight: { x: 0.74, y: 0.80 },
          bottomLeft:  { x: 0.18, y: 0.82 },
        },
      },
      {
        id: 'dusty-rose-frame',
        angleLabel: 'Wall Frame',
        angleEmoji: '🪟',
        imageUrl:  'https://picsum.photos/seed/rose-frame/1500/1000',
        thumbUrl:  'https://picsum.photos/seed/rose-frame/480/320',
        corners: {
          topLeft:     { x: 0.24, y: 0.08 },
          topRight:    { x: 0.76, y: 0.08 },
          bottomRight: { x: 0.76, y: 0.92 },
          bottomLeft:  { x: 0.24, y: 0.92 },
        },
      },
    ],
  },

  // ── 3. Minimal White Suite ─────────────────────────────────────────────────
  {
    id: 'minimal-white',
    label: 'Minimal White Suite',
    emoji: '🤍',
    description: 'Clean studio light, white surfaces, modern elegance',
    palette: ['#f0eeec', '#d6d3d0', '#1a1c1c'],
    templates: [
      {
        id: 'minimal-easel',
        angleLabel: 'Easel',
        angleEmoji: '🖼️',
        imageUrl:  'https://picsum.photos/seed/min-easel/1500/1000',
        thumbUrl:  'https://picsum.photos/seed/min-easel/480/320',
        corners: {
          topLeft:     { x: 0.28, y: 0.10 },
          topRight:    { x: 0.72, y: 0.10 },
          bottomRight: { x: 0.72, y: 0.88 },
          bottomLeft:  { x: 0.28, y: 0.88 },
        },
      },
      {
        id: 'minimal-clipboard',
        angleLabel: 'Clipboard',
        angleEmoji: '📎',
        imageUrl:  'https://picsum.photos/seed/min-clip/1500/1000',
        thumbUrl:  'https://picsum.photos/seed/min-clip/480/320',
        corners: {
          topLeft:     { x: 0.22, y: 0.12 },
          topRight:    { x: 0.62, y: 0.10 },
          bottomRight: { x: 0.64, y: 0.86 },
          bottomLeft:  { x: 0.20, y: 0.88 },
        },
      },
      {
        id: 'minimal-frame',
        angleLabel: 'Wall Frame',
        angleEmoji: '🪟',
        imageUrl:  'https://picsum.photos/seed/min-frame/1500/1000',
        thumbUrl:  'https://picsum.photos/seed/min-frame/480/320',
        corners: {
          topLeft:     { x: 0.25, y: 0.08 },
          topRight:    { x: 0.75, y: 0.08 },
          bottomRight: { x: 0.75, y: 0.92 },
          bottomLeft:  { x: 0.25, y: 0.92 },
        },
      },
    ],
  },

  // ── 4. Rustic Garden Suite ─────────────────────────────────────────────────
  {
    id: 'rustic-garden',
    label: 'Rustic Garden Suite',
    emoji: '🌻',
    description: 'Wood textures, outdoor greenery, golden hour warmth',
    palette: ['#8b6f47', '#7d9b7a', '#e8d5a3'],
    templates: [
      {
        id: 'rustic-easel',
        angleLabel: 'Easel',
        angleEmoji: '🖼️',
        imageUrl:  'https://picsum.photos/seed/rus-easel/1500/1000',
        thumbUrl:  'https://picsum.photos/seed/rus-easel/480/320',
        corners: {
          topLeft:     { x: 0.26, y: 0.09 },
          topRight:    { x: 0.74, y: 0.09 },
          bottomRight: { x: 0.73, y: 0.87 },
          bottomLeft:  { x: 0.27, y: 0.87 },
        },
      },
      {
        id: 'rustic-flatlay',
        angleLabel: 'Flat Lay',
        angleEmoji: '📋',
        imageUrl:  'https://picsum.photos/seed/rus-flat/1500/1000',
        thumbUrl:  'https://picsum.photos/seed/rus-flat/480/320',
        blendMode: 'multiply',
        corners: {
          topLeft:     { x: 0.17, y: 0.16 },
          topRight:    { x: 0.67, y: 0.13 },
          bottomRight: { x: 0.70, y: 0.83 },
          bottomLeft:  { x: 0.15, y: 0.85 },
        },
      },
      {
        id: 'rustic-garden-display',
        angleLabel: 'Garden Display',
        angleEmoji: '🌿',
        imageUrl:  'https://picsum.photos/seed/rus-garden/1500/1000',
        thumbUrl:  'https://picsum.photos/seed/rus-garden/480/320',
        corners: {
          topLeft:     { x: 0.27, y: 0.11 },
          topRight:    { x: 0.73, y: 0.11 },
          bottomRight: { x: 0.73, y: 0.89 },
          bottomLeft:  { x: 0.27, y: 0.89 },
        },
      },
    ],
  },

  // ── 5. Luxury Gold Suite ───────────────────────────────────────────────────
  {
    id: 'luxury-gold',
    label: 'Luxury Gold Suite',
    emoji: '✨',
    description: 'Marble surfaces, gold accents, black tie elegance',
    palette: ['#c9a84c', '#e8e0d5', '#2a2420'],
    templates: [
      {
        id: 'luxury-flatlay',
        angleLabel: 'Flat Lay',
        angleEmoji: '📋',
        imageUrl:  'https://picsum.photos/seed/lux-flat/1500/1000',
        thumbUrl:  'https://picsum.photos/seed/lux-flat/480/320',
        corners: {
          topLeft:     { x: 0.20, y: 0.22 },
          topRight:    { x: 0.76, y: 0.19 },
          bottomRight: { x: 0.78, y: 0.76 },
          bottomLeft:  { x: 0.18, y: 0.79 },
        },
      },
      {
        id: 'luxury-frame',
        angleLabel: 'Wall Frame',
        angleEmoji: '🪟',
        imageUrl:  'https://picsum.photos/seed/lux-frame/1500/1000',
        thumbUrl:  'https://picsum.photos/seed/lux-frame/480/320',
        corners: {
          topLeft:     { x: 0.23, y: 0.09 },
          topRight:    { x: 0.77, y: 0.09 },
          bottomRight: { x: 0.77, y: 0.91 },
          bottomLeft:  { x: 0.23, y: 0.91 },
        },
      },
      {
        id: 'luxury-table',
        angleLabel: 'Table Card',
        angleEmoji: '🥂',
        imageUrl:  'https://picsum.photos/seed/lux-table/1500/1000',
        thumbUrl:  'https://picsum.photos/seed/lux-table/480/320',
        corners: {
          topLeft:     { x: 0.31, y: 0.19 },
          topRight:    { x: 0.69, y: 0.17 },
          bottomRight: { x: 0.71, y: 0.77 },
          bottomLeft:  { x: 0.29, y: 0.79 },
        },
      },
    ],
  },
]
