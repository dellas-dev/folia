export type { Database } from './database.types'

export type IllustrationStyle = 'watercolor' | 'line_art' | 'cartoon' | 'boho' | 'minimalist'

export type GenerationType = 'element' | 'mockup'

export type UserTier = 'none' | 'starter' | 'pro' | 'business'

export type PaymentProvider = 'mayar' | 'polar'

export type MockupScenePreset =
  | 'marble-eucalyptus'
  | 'golden-plate'
  | 'floral-flatlay'
  | 'rustic-wood'
  | 'blush-silk'
  | 'modern-desk'
  | 'holiday-scene'
  | 'spooky-scene'
  | 'party-table'

export interface GenerationResult {
  r2_key: string
  signed_url: string
  index: number
}

export interface StyleOption {
  id: IllustrationStyle
  label: string
  icon: string
  modifier: string
  description: string
  sampleImage: string
}

export interface MockupSceneOption {
  id: MockupScenePreset
  label: string
  emoji: string
  accessLevel: 'all' | 'pro'
  description: string
  prompt: string
}

export const STYLE_OPTIONS: StyleOption[] = [
  {
    id: 'watercolor',
    label: 'Watercolor',
    icon: '🎨',
    modifier: 'soft watercolor illustration, wet-on-wet technique, visible paper texture, translucent color washes, delicate hand-painted brush strokes, color bleeding at edges, white paper showing through highlights, professional botanical art style',
    description: 'Wedding, floral, baby shower',
    sampleImage: '/samples/watercolor.jpg',
  },
  {
    id: 'line_art',
    label: 'Line Art',
    icon: '✏️',
    modifier: 'clean black ink line art illustration, precise uniform stroke weight, no color fills, crisp vector-like outlines, fine detail linework, coloring book quality, elegant contour drawing',
    description: 'Minimalist, DIY templates',
    sampleImage: '/samples/line-art.jpg',
  },
  {
    id: 'cartoon',
    label: 'Cartoon / Kawaii',
    icon: '🐼',
    modifier: 'cute kawaii cartoon illustration, bold clean black outlines, flat cel-shading colors, pastel color palette, rounded bubbly shapes, chibi proportions, big expressive sparkly eyes, cheerful playful style',
    description: 'Kids birthday, baby shower',
    sampleImage: '/samples/cartoon.jpg',
  },
  {
    id: 'boho',
    label: 'Boho / Vintage',
    icon: '🌾',
    modifier: 'bohemian vintage hand-drawn illustration, muted earthy tones (terracotta, sage, dusty rose, cream), slightly rough ink texture, folk art decorative style, aged paper look, rustic botanical aesthetic',
    description: 'Boho wedding, rustic party',
    sampleImage: '/samples/boho.jpg',
  },
  {
    id: 'minimalist',
    label: 'Minimalist / Flat',
    icon: '⬜',
    modifier: 'clean minimalist flat design illustration, simple geometric shapes, maximum 3 flat colors, bold clean outlines, modern scandinavian aesthetic, crisp edges, no gradients, no textures',
    description: 'Modern wedding, corporate',
    sampleImage: '/samples/minimalist.jpg',
  },
]

export const STYLE_MODIFIERS: Record<IllustrationStyle, string> = Object.fromEntries(
  STYLE_OPTIONS.map((s) => [s.id, s.modifier])
) as Record<IllustrationStyle, string>

export const MOCKUP_SCENE_OPTIONS: MockupSceneOption[] = [
  {
    id: 'marble-eucalyptus',
    label: 'Marble & Eucalyptus',
    emoji: '🍃',
    accessLevel: 'all',
    description: 'Fresh marble surface with eucalyptus and natural editorial light.',
    prompt:
      'Place this invitation card flat on a pristine white marble surface, with fresh eucalyptus sprigs and small white flowers arranged around it, soft natural daylight from the side, top-down editorial photography, sharp focus, highly detailed, realistic Etsy listing mockup',
  },
  {
    id: 'golden-plate',
    label: 'Golden Plate',
    emoji: '🌕',
    accessLevel: 'all',
    description: 'Warm candlelit luxury setup with dried flowers and a gold plate.',
    prompt:
      'Place this invitation card on a decorative gold plate, surrounded by dried roses and eucalyptus branches, warm candlelight ambiance, top-down photography, luxurious aesthetic, soft shadows, realistic Etsy listing mockup',
  },
  {
    id: 'floral-flatlay',
    label: 'Floral Flat Lay',
    emoji: '🌸',
    accessLevel: 'all',
    description: 'Airy peonies, linen textures, and dreamy pastel styling.',
    prompt:
      'Place this invitation card in an elegant flat lay with fresh peonies, roses, and linen fabric background, light and airy photography style, overhead view, dreamy pastel tones, realistic Etsy listing mockup',
  },
  {
    id: 'rustic-wood',
    label: 'Rustic Wood Table',
    emoji: '🪵',
    accessLevel: 'all',
    description: 'Warm wooden tabletop with handmade textures and botanical accents.',
    prompt:
      'Place this invitation card on a warm rustic wooden table with torn handmade paper, soft linen ribbon, dried flowers, and natural window light, top-down styled product photography, realistic Etsy listing mockup',
  },
  {
    id: 'blush-silk',
    label: 'Blush Silk Editorial',
    emoji: '🎀',
    accessLevel: 'pro',
    description: 'Soft silk fabric, blush palette, and romantic editorial styling.',
    prompt:
      'Place this invitation card on draped blush silk fabric with delicate ribbon, pearl details, and soft diffused daylight, romantic editorial wedding styling, overhead product photography, realistic Etsy listing mockup',
  },
  {
    id: 'modern-desk',
    label: 'Modern Desk Flat Lay',
    emoji: '🖇️',
    accessLevel: 'pro',
    description: 'Clean studio desk with refined neutral props and minimalist styling.',
    prompt:
      'Place this invitation card in a clean modern flat lay with neutral stationery props, paper clips, ceramic cup, soft shadow, and minimalist studio styling, top-down product photography, realistic Etsy listing mockup',
  },
  {
    id: 'holiday-scene',
    label: 'Holiday Scene',
    emoji: '🎄',
    accessLevel: 'pro',
    description: 'Cozy pine branches, ornaments, and festive warm lights.',
    prompt:
      'Place this invitation card surrounded by fresh pine branches, gold and red christmas ornaments, fairy lights, warm cozy festive atmosphere, top-down photography, realistic Etsy listing mockup',
  },
  {
    id: 'spooky-scene',
    label: 'Spooky Scene',
    emoji: '🎃',
    accessLevel: 'pro',
    description: 'Dark wooden tabletop with pumpkins and candlelit shadows.',
    prompt:
      'Place this invitation card on a dark wooden table, carved halloween pumpkins and flickering candles around it, moody dark atmosphere, dramatic shadows, top-down view, realistic Etsy listing mockup',
  },
  {
    id: 'party-table',
    label: 'Party Table',
    emoji: '🎈',
    accessLevel: 'pro',
    description: 'Confetti, balloons, and bright celebration energy.',
    prompt:
      'Place this invitation card on a colorful festive party table, confetti, balloons, streamers surrounding it, bright cheerful lighting, celebration atmosphere, top-down photography, realistic Etsy listing mockup',
  },
]

export const MOCKUP_SCENE_PROMPTS: Record<MockupScenePreset, string> = Object.fromEntries(
  MOCKUP_SCENE_OPTIONS.map((scene) => [scene.id, scene.prompt])
) as Record<MockupScenePreset, string>
