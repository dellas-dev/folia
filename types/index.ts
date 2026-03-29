export type { Database } from './database.types'

export type IllustrationStyle = 'watercolor' | 'line_art' | 'cartoon' | 'boho' | 'minimalist'

export type GenerationType = 'element' | 'mockup'

export type UserTier = 'none' | 'starter' | 'pro' | 'business'

export type PaymentProvider = 'mayar' | 'polar'

export type MockupScenePreset =
  | 'marble-eucalyptus'
  | 'golden-plate'
  | 'floral-flatlay'
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
  emoji: string
  modifier: string
  bestFor: string
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
    emoji: '🎨',
    modifier: 'soft watercolor painting, delicate brush strokes, hand-painted, translucent layers',
    bestFor: 'Wedding, baby shower, floral',
  },
  {
    id: 'line_art',
    label: 'Line Art',
    emoji: '✏️',
    modifier: 'clean vector line art, black outline only, no fill, coloring book style',
    bestFor: 'Minimalist, DIY templates',
  },
  {
    id: 'cartoon',
    label: 'Cartoon / Kawaii',
    emoji: '🐼',
    modifier: 'cute kawaii cartoon illustration, rounded shapes, big sparkly eyes, pastel colors, chibi style',
    bestFor: 'Kids birthday, baby shower',
  },
  {
    id: 'boho',
    label: 'Boho / Vintage',
    emoji: '🌾',
    modifier: 'bohemian vintage illustration, earthy tones, aged texture, folk art style, rustic',
    bestFor: 'Boho wedding, rustic party',
  },
  {
    id: 'minimalist',
    label: 'Minimalist / Flat',
    emoji: '⬜',
    modifier: 'minimalist flat design, simple geometric shapes, clean lines, modern, bold colors',
    bestFor: 'Modern wedding, corporate',
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
