import type { CornerPoints } from './perspective/homography'

export interface MockupTemplate {
  id: string
  angleLabel: string
  angleEmoji: string
  /** Public asset path or fully-qualified remote URL */
  imageUrl: string
  /** Public asset path or fully-qualified remote URL */
  thumbUrl: string
  composite?: MockupCompositeStyle
  corners: {
    topLeft: { x: number; y: number }
    topRight: { x: number; y: number }
    bottomRight: { x: number; y: number }
    bottomLeft: { x: number; y: number }
  }
}

export interface MockupCompositeStyle {
  overlayBlend?: 'multiply' | 'over'
  edgeBlur?: number
  paperTone?: { r: number; g: number; b: number }
  paperOpacity?: number
  shadowBlur?: number
  shadowOpacity?: number
  shadowOffsetX?: number
  shadowOffsetY?: number
}

export interface MockupBundle {
  id: string
  label: string
  emoji: string
  description: string
  palette: string[]
  templates: MockupTemplate[]
}

export function cornersToPixels(
  pct: MockupTemplate['corners'],
  width: number,
  height: number
): CornerPoints {
  return {
    topLeft: { x: pct.topLeft.x * width, y: pct.topLeft.y * height },
    topRight: { x: pct.topRight.x * width, y: pct.topRight.y * height },
    bottomRight: { x: pct.bottomRight.x * width, y: pct.bottomRight.y * height },
    bottomLeft: { x: pct.bottomLeft.x * width, y: pct.bottomLeft.y * height },
  }
}

export function getAllTemplates(): MockupTemplate[] {
  return MOCKUP_BUNDLES.flatMap((bundle) => bundle.templates)
}

export function getTemplateById(id: string): MockupTemplate | undefined {
  return getAllTemplates().find((template) => template.id === id)
}

export function getBundleByTemplateId(templateId: string): MockupBundle | undefined {
  return MOCKUP_BUNDLES.find((bundle) => bundle.templates.some((template) => template.id === templateId))
}

// Local premium template catalog for phase 2.
// These SVG scenes are deterministic, art-directed, and measured for stable compositing.
export const MOCKUP_BUNDLES: MockupBundle[] = [
  {
    id: 'sage-editorial',
    label: 'Sage Editorial',
    emoji: '🌿',
    description: 'Soft ivory surfaces, botanical edge styling, and calm editorial light.',
    palette: ['#f4efe8', '#c4d0c0', '#7a8d77'],
    templates: [
      {
        id: 'sage-editorial-flatlay',
        angleLabel: 'Editorial Flat Lay',
        angleEmoji: '📋',
        imageUrl: '/mockups/templates/rendered/sage-editorial-flatlay.png',
        thumbUrl: '/mockups/templates/rendered/sage-editorial-flatlay-thumb.png',
        composite: {
          overlayBlend: 'multiply',
          edgeBlur: 0.55,
          paperTone: { r: 255, g: 252, b: 248 },
          paperOpacity: 0.98,
          shadowBlur: 18,
          shadowOpacity: 0.16,
          shadowOffsetX: 12,
          shadowOffsetY: 18,
        },
        corners: {
          topLeft: { x: 0.2867, y: 0.245 },
          topRight: { x: 0.7133, y: 0.245 },
          bottomRight: { x: 0.7133, y: 0.705 },
          bottomLeft: { x: 0.2867, y: 0.705 },
        },
      },
      {
        id: 'sage-editorial-easel',
        angleLabel: 'Standing Sign',
        angleEmoji: '🖼️',
        imageUrl: '/mockups/templates/rendered/sage-editorial-easel.png',
        thumbUrl: '/mockups/templates/rendered/sage-editorial-easel-thumb.png',
        composite: {
          overlayBlend: 'multiply',
          edgeBlur: 0.68,
          paperTone: { r: 254, g: 250, b: 244 },
          paperOpacity: 0.98,
          shadowBlur: 14,
          shadowOpacity: 0.12,
          shadowOffsetX: 10,
          shadowOffsetY: 14,
        },
        corners: {
          topLeft: { x: 0.36, y: 0.17 },
          topRight: { x: 0.6533, y: 0.19 },
          bottomRight: { x: 0.64, y: 0.82 },
          bottomLeft: { x: 0.3467, y: 0.8 },
        },
      },
    ],
  },
  {
    id: 'blush-romance',
    label: 'Blush Romance',
    emoji: '🌸',
    description: 'Ribbon-led wedding styling with warm blush accents and soft floral framing.',
    palette: ['#f6eceb', '#e8c8cb', '#c58f97'],
    templates: [
      {
        id: 'blush-romance-suite',
        angleLabel: 'Ribbon Suite',
        angleEmoji: '🎀',
        imageUrl: '/mockups/templates/rendered/blush-romance-suite.png',
        thumbUrl: '/mockups/templates/rendered/blush-romance-suite-thumb.png',
        composite: {
          overlayBlend: 'multiply',
          edgeBlur: 0.5,
          paperTone: { r: 255, g: 250, b: 251 },
          paperOpacity: 0.98,
          shadowBlur: 20,
          shadowOpacity: 0.14,
          shadowOffsetX: 12,
          shadowOffsetY: 18,
        },
        corners: {
          topLeft: { x: 0.2933, y: 0.23 },
          topRight: { x: 0.7067, y: 0.23 },
          bottomRight: { x: 0.7067, y: 0.73 },
          bottomLeft: { x: 0.2933, y: 0.73 },
        },
      },
      {
        id: 'blush-romance-frame',
        angleLabel: 'Gold Frame',
        angleEmoji: '✨',
        imageUrl: '/mockups/templates/rendered/blush-romance-frame.png',
        thumbUrl: '/mockups/templates/rendered/blush-romance-frame-thumb.png',
        composite: {
          overlayBlend: 'multiply',
          edgeBlur: 0.62,
          paperTone: { r: 255, g: 251, b: 249 },
          paperOpacity: 0.97,
          shadowBlur: 16,
          shadowOpacity: 0.1,
          shadowOffsetX: 8,
          shadowOffsetY: 12,
        },
        corners: {
          topLeft: { x: 0.3733, y: 0.135 },
          topRight: { x: 0.6267, y: 0.135 },
          bottomRight: { x: 0.6267, y: 0.835 },
          bottomLeft: { x: 0.3733, y: 0.835 },
        },
      },
    ],
  },
  {
    id: 'modern-minimal',
    label: 'Modern Minimal',
    emoji: '🤍',
    description: 'Stone, paper, and polished metal with restrained premium styling.',
    palette: ['#f1ede8', '#d6cec4', '#9e9182'],
    templates: [
      {
        id: 'modern-minimal-board',
        angleLabel: 'Stone Board',
        angleEmoji: '🪨',
        imageUrl: '/mockups/templates/rendered/modern-minimal-board.png',
        thumbUrl: '/mockups/templates/rendered/modern-minimal-board-thumb.png',
        composite: {
          overlayBlend: 'multiply',
          edgeBlur: 0.58,
          paperTone: { r: 252, g: 249, b: 244 },
          paperOpacity: 0.98,
          shadowBlur: 18,
          shadowOpacity: 0.15,
          shadowOffsetX: 12,
          shadowOffsetY: 16,
        },
        corners: {
          topLeft: { x: 0.3, y: 0.21 },
          topRight: { x: 0.7133, y: 0.225 },
          bottomRight: { x: 0.7, y: 0.725 },
          bottomLeft: { x: 0.2867, y: 0.71 },
        },
      },
      {
        id: 'modern-minimal-frame',
        angleLabel: 'Shadow Frame',
        angleEmoji: '🪟',
        imageUrl: '/mockups/templates/rendered/modern-minimal-frame.png',
        thumbUrl: '/mockups/templates/rendered/modern-minimal-frame-thumb.png',
        composite: {
          overlayBlend: 'multiply',
          edgeBlur: 0.66,
          paperTone: { r: 253, g: 251, b: 247 },
          paperOpacity: 0.97,
          shadowBlur: 16,
          shadowOpacity: 0.1,
          shadowOffsetX: 8,
          shadowOffsetY: 12,
        },
        corners: {
          topLeft: { x: 0.3467, y: 0.135 },
          topRight: { x: 0.6533, y: 0.135 },
          bottomRight: { x: 0.6533, y: 0.835 },
          bottomLeft: { x: 0.3467, y: 0.835 },
        },
      },
    ],
  },
]
