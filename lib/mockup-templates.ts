import type { CornerPoints } from './perspective/homography'

export interface MockupTemplate {
  id: string
  /** Stable product type key within a suite, e.g. "welcome-sign-on-easel" */
  productType: string
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
  {
    id: 'eucalyptus-wedding-suite',
    label: 'Eucalyptus Wedding Suite',
    emoji: '🌿',
    description: 'A ready-to-build Etsy listing suite for wedding invitation sellers using eucalyptus styling and soft reception details.',
    palette: ['#7d9b7a', '#c8b89a', '#eae5dc'],
    templates: [
      {
        id: 'eucalyptus-wedding-suite-invitation-suite-flat-lay',
        productType: 'invitation-suite-flat-lay',
        angleLabel: 'Invitation Suite Flat Lay',
        angleEmoji: '💌',
        imageUrl:  'https://picsum.photos/seed/folia-eucalyptus-invitation-suite-flat-lay/1500/1000',
        thumbUrl:  'https://picsum.photos/seed/folia-eucalyptus-invitation-suite-flat-lay/480/320',
        corners: {
          topLeft:     { x: 0.18, y: 0.14 },
          topRight:    { x: 0.68, y: 0.12 },
          bottomRight: { x: 0.71, y: 0.82 },
          bottomLeft:  { x: 0.16, y: 0.84 },
        },
      },
      {
        id: 'eucalyptus-wedding-suite-welcome-sign-on-easel',
        productType: 'welcome-sign-on-easel',
        angleLabel: 'Welcome Sign on Easel',
        angleEmoji: '🪧',
        imageUrl:  'https://picsum.photos/seed/folia-eucalyptus-welcome-sign-on-easel/1500/1000',
        thumbUrl:  'https://picsum.photos/seed/folia-eucalyptus-welcome-sign-on-easel/480/320',
        corners: {
          topLeft:     { x: 0.27, y: 0.09 },
          topRight:    { x: 0.73, y: 0.09 },
          bottomRight: { x: 0.73, y: 0.88 },
          bottomLeft:  { x: 0.27, y: 0.88 },
        },
      },
      {
        id: 'eucalyptus-wedding-suite-place-card-tabletop',
        productType: 'place-card-tabletop',
        angleLabel: 'Place Card Tabletop',
        angleEmoji: '🍽️',
        imageUrl:  'https://picsum.photos/seed/folia-eucalyptus-place-card-tabletop/1500/1000',
        thumbUrl:  'https://picsum.photos/seed/folia-eucalyptus-place-card-tabletop/480/320',
        blendMode: 'multiply',
        corners: {
          topLeft:     { x: 0.30, y: 0.17 },
          topRight:    { x: 0.70, y: 0.15 },
          bottomRight: { x: 0.72, y: 0.79 },
          bottomLeft:  { x: 0.28, y: 0.81 },
        },
      },
      {
        id: 'eucalyptus-wedding-suite-table-number-mini-easel',
        productType: 'table-number-mini-easel',
        angleLabel: 'Table Number Mini Easel',
        angleEmoji: '🔢',
        imageUrl:  'https://picsum.photos/seed/folia-eucalyptus-table-number-mini-easel/1500/1000',
        thumbUrl:  'https://picsum.photos/seed/folia-eucalyptus-table-number-mini-easel/480/320',
        corners: {
          topLeft:     { x: 0.26, y: 0.10 },
          topRight:    { x: 0.74, y: 0.10 },
          bottomRight: { x: 0.73, y: 0.87 },
          bottomLeft:  { x: 0.27, y: 0.87 },
        },
      },
    ],
  },
]
