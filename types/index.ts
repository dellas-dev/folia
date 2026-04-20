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
  | 'invitation-suite'
  | 'welcome-sign-easel'
  | 'seating-chart-easel'
  | 'save-the-date-satin'
  | 'custom-sign-gold-frame'
  | 'menu-card-hoop'
  | 'place-card-table'
  | 'table-number-mini-easel'
  | 'wedding-timeline-linen'
  | 'wedding-program-tall'
  | 'water-bottle-flatlay'
  | 'belly-band-suite'

export interface GenerationResult {
  r2_key: string
  signed_url: string
  index: number
  format?: 'png' | 'jpg' | 'webp'
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
  {
    id: 'invitation-suite',
    label: 'Invitation Suite',
    emoji: '💌',
    accessLevel: 'all',
    description: 'Multiple cards flat lay with eucalyptus, dusty blue envelope on light marble.',
    prompt:
      'Place this card as part of an elegant wedding invitation suite flat lay on a light marble surface, surrounded by fresh eucalyptus sprigs and small white flowers, dusty blue envelope beside it, soft top-down natural daylight photography, sharp focus, realistic Etsy listing mockup',
  },
  {
    id: 'welcome-sign-easel',
    label: 'Welcome Sign Easel',
    emoji: '🖼️',
    accessLevel: 'all',
    description: 'Large canvas on ornate gold easel with sage green balloons and white flowers.',
    prompt:
      'Display this design as a large welcome sign mounted on an ornate gold wedding easel, surrounded by sage green and gold balloons and lush white floral arrangements, outdoor garden wedding ceremony backdrop, soft natural light, realistic Etsy listing mockup',
  },
  {
    id: 'seating-chart-easel',
    label: 'Seating Chart Easel',
    emoji: '📋',
    accessLevel: 'all',
    description: 'Tall poster on gold easel, outdoor with white flowers and greenery.',
    prompt:
      'Display this design as a tall wedding seating chart sign mounted on an ornate gold easel in an outdoor wedding garden setting, lush white flower arrangements and eucalyptus greenery surrounding the base, soft outdoor natural light, realistic Etsy listing mockup',
  },
  {
    id: 'save-the-date-satin',
    label: 'Save the Date Satin',
    emoji: '📅',
    accessLevel: 'all',
    description: 'Card on draped golden satin fabric with dried flowers.',
    prompt:
      'Place this card elegantly on soft draped golden champagne satin fabric, small dried eucalyptus sprigs beside it, warm soft window light, intimate close-up photography, romantic wedding aesthetic, realistic Etsy listing mockup',
  },
  {
    id: 'custom-sign-gold-frame',
    label: 'Gold Frame Sign',
    emoji: '🖼️',
    accessLevel: 'pro',
    description: 'Ornate gold picture frame on wood surface with eucalyptus and crystal glass.',
    prompt:
      'Display this design framed inside an ornate gold decorative picture frame, placed on a rustic wooden surface, fresh eucalyptus branches and a crystal wine glass beside it, soft natural side lighting, elegant wedding decor styling, realistic Etsy listing mockup',
  },
  {
    id: 'menu-card-hoop',
    label: 'Menu Hoop Frame',
    emoji: '🍽️',
    accessLevel: 'pro',
    description: 'Tall menu card displayed in a round gold hoop wreath with white flowers.',
    prompt:
      'Display this tall menu card centered inside a round gold decorative hoop wreath completely surrounded by fresh white roses and eucalyptus garland, light marble background, elegant bridal styling, soft studio lighting, realistic Etsy listing mockup',
  },
  {
    id: 'place-card-table',
    label: 'Place Card Table',
    emoji: '🪑',
    accessLevel: 'all',
    description: 'Folded tent card on white wedding reception table with baby\'s breath flowers.',
    prompt:
      'Display this as a folded tent place card standing upright on a white linen wedding reception table, surrounded by scattered baby\'s breath white flowers and small eucalyptus leaves, soft bokeh background of table settings, close-up realistic product photography, Etsy listing mockup',
  },
  {
    id: 'table-number-mini-easel',
    label: 'Table Number Easel',
    emoji: '🔢',
    accessLevel: 'all',
    description: 'Card propped on small wooden mini easel with white roses on light surface.',
    prompt:
      'Display this card propped upright on a small rustic wooden mini tabletop easel, white roses and small eucalyptus leaves scattered around the base on a light neutral surface, soft natural light, close-up realistic product photography, Etsy listing mockup',
  },
  {
    id: 'wedding-timeline-linen',
    label: 'Timeline Linen',
    emoji: '⏱️',
    accessLevel: 'pro',
    description: 'Horizontal timeline card on white linen with white hydrangeas.',
    prompt:
      'Place this horizontal card flat on white soft linen fabric, large fresh white hydrangea blooms and delicate eucalyptus beside it, airy bright natural light from above, top-down editorial photography, clean and elegant wedding styling, realistic Etsy listing mockup',
  },
  {
    id: 'wedding-program-tall',
    label: 'Program Tall Card',
    emoji: '📄',
    accessLevel: 'pro',
    description: 'Tall DL program card with eucalyptus stems and pale pink roses.',
    prompt:
      'Display this tall narrow program card standing upright, pale pink roses and fresh eucalyptus branches artfully arranged beside it on a sage green linen surface, soft natural light with gentle bokeh background, close-up realistic product photography, Etsy listing mockup',
  },
  {
    id: 'water-bottle-flatlay',
    label: 'Water Bottle Label',
    emoji: '🍶',
    accessLevel: 'pro',
    description: 'Design wrapped as label on two clear water bottles, warm flat lay.',
    prompt:
      'Display this design as a label wrapped around two clear glass water bottles on a warm-toned surface with soft shadows, elegant wedding favor styling, overhead flat lay photography, realistic Etsy listing mockup',
  },
  {
    id: 'belly-band-suite',
    label: 'Belly Band Suite',
    emoji: '🎁',
    accessLevel: 'pro',
    description: 'Stacked invitation suite with belly band on rattan surface, warm tones.',
    prompt:
      'Display this design as a belly band wrapping around a stacked wedding invitation suite, placed on a natural rattan woven surface with warm amber glass vessels beside it, warm-toned soft natural light, intimate close-up styling, realistic Etsy listing mockup',
  },
]

export const MOCKUP_SCENE_PROMPTS: Record<MockupScenePreset, string> = Object.fromEntries(
  MOCKUP_SCENE_OPTIONS.map((scene) => [scene.id, scene.prompt])
) as Record<MockupScenePreset, string>
