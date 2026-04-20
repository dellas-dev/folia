import type { CornerPoints } from './perspective/homography'

export interface MockupTemplate {
  id: string
  label: string
  emoji: string
  description: string
  /** Full-resolution image URL used for compositing (should be ~1500px wide) */
  imageUrl: string
  /** Lower-res thumbnail shown in the UI grid */
  thumbUrl: string
  /** Corner coordinates as fractions 0.0–1.0 of the full-res image dimensions */
  corners: {
    topLeft:     { x: number; y: number }
    topRight:    { x: number; y: number }
    bottomRight: { x: number; y: number }
    bottomLeft:  { x: number; y: number }
  }
}

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

export function getTemplateById(id: string): MockupTemplate | undefined {
  return MOCKUP_TEMPLATES.find((t) => t.id === id)
}

/**
 * Curated template library.
 *
 * NOTE FOR DEPLOYMENT:
 * Replace imageUrl / thumbUrl with your own hosted template photos.
 * Corners are measured as fractions of the full-res image (0.0–1.0).
 * Each photo should have a clearly visible flat rectangular surface
 * (easel canvas, framed print, flat-lay on table, etc.) pre-measured
 * so placement is always pixel-perfect.
 *
 * Placeholder images below use picsum.photos with fixed seeds for
 * consistent previews during development.
 */
export const MOCKUP_TEMPLATES: MockupTemplate[] = [
  {
    id: 'easel-white-studio',
    label: 'Studio Easel',
    emoji: '🖼️',
    description: 'White canvas on a wooden easel in a bright studio',
    imageUrl:  'https://picsum.photos/seed/easel01/1500/1000',
    thumbUrl:  'https://picsum.photos/seed/easel01/480/320',
    // Design area: roughly the inner canvas, slightly inset from the easel frame
    corners: {
      topLeft:     { x: 0.28, y: 0.10 },
      topRight:    { x: 0.72, y: 0.10 },
      bottomRight: { x: 0.72, y: 0.88 },
      bottomLeft:  { x: 0.28, y: 0.88 },
    },
  },
  {
    id: 'flatlay-table',
    label: 'Flat Lay Table',
    emoji: '📋',
    description: 'Print laid flat on a light wooden desk with props',
    imageUrl:  'https://picsum.photos/seed/flatlay02/1500/1000',
    thumbUrl:  'https://picsum.photos/seed/flatlay02/480/320',
    corners: {
      topLeft:     { x: 0.18, y: 0.15 },
      topRight:    { x: 0.68, y: 0.12 },
      bottomRight: { x: 0.72, y: 0.82 },
      bottomLeft:  { x: 0.16, y: 0.84 },
    },
  },
  {
    id: 'frame-wall',
    label: 'Wall Frame',
    emoji: '🪟',
    description: 'Framed art print hanging on a textured white wall',
    imageUrl:  'https://picsum.photos/seed/frame03/1500/1000',
    thumbUrl:  'https://picsum.photos/seed/frame03/480/320',
    corners: {
      topLeft:     { x: 0.25, y: 0.08 },
      topRight:    { x: 0.75, y: 0.08 },
      bottomRight: { x: 0.75, y: 0.92 },
      bottomLeft:  { x: 0.25, y: 0.92 },
    },
  },
  {
    id: 'wedding-table-card',
    label: 'Wedding Table',
    emoji: '💒',
    description: 'Invitation card on a styled wedding reception table',
    imageUrl:  'https://picsum.photos/seed/wedding04/1500/1000',
    thumbUrl:  'https://picsum.photos/seed/wedding04/480/320',
    corners: {
      topLeft:     { x: 0.30, y: 0.18 },
      topRight:    { x: 0.70, y: 0.16 },
      bottomRight: { x: 0.72, y: 0.78 },
      bottomLeft:  { x: 0.28, y: 0.80 },
    },
  },
  {
    id: 'clipboard-desk',
    label: 'Clipboard Desk',
    emoji: '📎',
    description: 'Design clipped to a clipboard on a minimal desk',
    imageUrl:  'https://picsum.photos/seed/clip05/1500/1000',
    thumbUrl:  'https://picsum.photos/seed/clip05/480/320',
    corners: {
      topLeft:     { x: 0.22, y: 0.12 },
      topRight:    { x: 0.62, y: 0.10 },
      bottomRight: { x: 0.64, y: 0.86 },
      bottomLeft:  { x: 0.20, y: 0.88 },
    },
  },
  {
    id: 'rustic-easel',
    label: 'Rustic Easel',
    emoji: '🌿',
    description: 'Canvas propped on a rustic wood easel with greenery',
    imageUrl:  'https://picsum.photos/seed/rustic06/1500/1000',
    thumbUrl:  'https://picsum.photos/seed/rustic06/480/320',
    corners: {
      topLeft:     { x: 0.26, y: 0.09 },
      topRight:    { x: 0.74, y: 0.09 },
      bottomRight: { x: 0.73, y: 0.87 },
      bottomLeft:  { x: 0.27, y: 0.87 },
    },
  },
  {
    id: 'luxury-envelope',
    label: 'Luxury Envelope',
    emoji: '✉️',
    description: 'Stationery suite on a marble surface with gold accents',
    imageUrl:  'https://picsum.photos/seed/luxury07/1500/1000',
    thumbUrl:  'https://picsum.photos/seed/luxury07/480/320',
    corners: {
      topLeft:     { x: 0.20, y: 0.22 },
      topRight:    { x: 0.76, y: 0.19 },
      bottomRight: { x: 0.78, y: 0.76 },
      bottomLeft:  { x: 0.18, y: 0.79 },
    },
  },
  {
    id: 'garden-display',
    label: 'Garden Display',
    emoji: '🌸',
    description: 'Framed print displayed in a lush outdoor garden setting',
    imageUrl:  'https://picsum.photos/seed/garden08/1500/1000',
    thumbUrl:  'https://picsum.photos/seed/garden08/480/320',
    corners: {
      topLeft:     { x: 0.27, y: 0.11 },
      topRight:    { x: 0.73, y: 0.11 },
      bottomRight: { x: 0.73, y: 0.89 },
      bottomLeft:  { x: 0.27, y: 0.89 },
    },
  },
]
