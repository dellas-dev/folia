import Groq from 'groq-sdk'

let _groq: Groq | null = null
function getGroq() {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
  return _groq
}

const TEXT_MODEL = 'llama-3.3-70b-versatile'
const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'

// ─────────────────────────────────────────────────────────────────────
// TECHNICAL SUFFIX — always hardcoded, appended to every final prompt
// Never rely on Groq to add this — it must always be there
// ─────────────────────────────────────────────────────────────────────
const TECHNICAL_SUFFIX =
  'isolated on pure white background, no text, no letters, no words, no background elements, clean white background, professional clipart quality, commercial use ready'

// ─────────────────────────────────────────────────────────────────────
// FORBIDDEN WORDS — stripped from Groq output before sending to Flux
// These cause Flux to generate 3D/realistic/noisy results
// ─────────────────────────────────────────────────────────────────────
const FORBIDDEN_WORDS = [
  // 3D / Realism triggers — make Flux generate non-clipart results
  'photorealistic',
  'photorealism',
  'hyperrealistic',
  'hyper-detailed',
  'hyper detailed',
  'highly detailed',
  '8k',
  '4k',
  'ultra hd',
  'cinematic lighting',
  'dramatic lighting',
  'volumetric lighting',
  'ray tracing',
  'metallic',
  'reflective',
  'shiny surface',
  'specular',
  'subsurface scattering',
  // Canvas-fill triggers — make Flux fill entire canvas instead of isolated element
  'scattered across the full canvas',
  'scattered across the canvas',
  'filling the entire canvas',
  'full canvas',
  'full illustration',
  'background scene',
  'environment',
  'atmosphere',
  'landscape',
  'scenery',
  // Botanical "single branch" triggers — cause sparse/stiff single-branch look
  // instead of dense lush cluster
  'thin wispy',
  'wispy stems',
  'wispy brown',
  'branching stems',
  'spreading left to right',
  'spreading from left to right',
  'horizontal botanical cluster spreading',
  'loose impressionistic',
  'stiff branches',
  'single branch',
  'single stem',
]

// ─────────────────────────────────────────────────────────────────────
// CATEGORY STYLE JACKETS — Golden Keywords per occasion
// Injected automatically based on occasion detected in user text
// ─────────────────────────────────────────────────────────────────────
export const CATEGORY_STYLE_JACKET: Record<string, string> = {
  wedding:
    'elegant botanical watercolor, fine art illustration, soft sage green and dusty rose palette, muted tones, delicate brushwork, luxury stationery aesthetic, boutique wedding style',
  birthday:
    'whimsical hand-drawn style, vibrant pastel colors, playful gouache texture, soft rounded edges, cheerful storybook illustration, joyful and cute',
  baby_shower:
    'soft pastel gouache, gentle hand-painted style, sweet nursery palette, tender and delicate, minimal clean composition, baby pink and mint tones',
  halloween:
    'vintage ink and watercolor, autumn palette, burnt orange and charcoal grey, whimsical spooky-cute style, grainy texture, retro storybook vibe',
  christmas:
    'cozy holiday watercolor, warm red and forest green, hand-painted festive style, soft glow, seasonal stationery aesthetic',
  valentine:
    'romantic soft watercolor washes, blushing pink and deep rose accents, dreamy hand-painted quality, tender and poetic, delicate floral aesthetic',
  religious:
    'warm earth tones, soft pencil and watercolor mix, rustic hand-painted feel, serene and peaceful aesthetic, organic shapes, heritage paper texture',
  general:
    'soft hand-painted illustration, clean pastel palette, minimalist elegant style, boutique stationery aesthetic',
}

// ─────────────────────────────────────────────────────────────────────
// BOTANICAL DENSITY MODULE — injected when subject is botanical/floral
// Fixes the "single sparse branch" problem → forces dense lush cluster
// Key insight: "branch" = AI draws straight line with few leaves
//              "cluster/bouquet" = AI draws dense overlapping foliage
// ─────────────────────────────────────────────────────────────────────
const BOTANICAL_DENSITY_MODULE =
  'dense overlapping foliage, cascading botanical cluster, heavy leaf arrangement, thick leafy bundle, hidden stems, natural organic scattering'

const BOTANICAL_WATERCOLOR_TECHNIQUE =
  'soft wet-on-wet watercolor, diffused bleeding edges, muted sage and olive tones, visible paper grain, semi-transparent overlapping washes'

// ─────────────────────────────────────────────────────────────────────
// WEDDING BOTANICAL RIGID TEMPLATE
// Groq outputs ONLY the subject skeleton (≤10 words, no art direction).
// Backend assembles the full prompt from three locked modules.
// ─────────────────────────────────────────────────────────────────────

// Composition lock: hanging bouquet at top, isolated, generous white space below
const WEDDING_BOTANICAL_COMPOSITION_LOCK =
  'a single elegant centered botanical hanging bouquet cluster, oriented at the top of the frame, isolated element, generous white space below'

// Style jacket: sharp watercolor, defined edges, saturated sage, minimal splatter
const WEDDING_BOTANICAL_STYLE_JACKET =
  'realistic watercolor painting style, high contrast defined edges, saturated sage green tones, defined branches and stems, minimal fine splatter dots'

// Suffix: white background + stationery context
const WEDDING_BOTANICAL_SUFFIX =
  'isolated on pure white background, minimal aesthetic, professional stationery clipart'

// Negative constraints — --no converted to inline no-X phrases (Flux has no --no support)
const WEDDING_BOTANICAL_NEGATIVE =
  'no text, no pattern, no centerpiece cluster, no full canvas coverage, no blur, no wet-on-wet effect, no diffused edges'

// Build the full rigid wedding botanical prompt
// Groq provides ONLY the subject (≤10 words) — everything else is hardcoded
function buildWeddingBotanicalPrompt(subject: string): string {
  return [
    WEDDING_BOTANICAL_COMPOSITION_LOCK,
    subject.trim(),
    WEDDING_BOTANICAL_STYLE_JACKET,
    WEDDING_BOTANICAL_SUFFIX,
    WEDDING_BOTANICAL_NEGATIVE,
  ]
    .filter(Boolean)
    .join(', ')
}

// Detect if subject is botanical/floral — triggers density module injection
function isBotanicalSubject(userPrompt: string): boolean {
  const text = userPrompt.toLowerCase()
  return /flower|floral|leaf|leaves|branch|botanical|eucalyptus|rose|peony|daisy|lavender|olive|greenery|foliage|wreath|bouquet|fern|tropical|palm|herb|vine|daun|bunga|ranting|tanaman|botani|karangan/.test(text)
}

// Detect wedding + botanical combination — triggers rigid template lock
function isWeddingBotanical(userPrompt: string, category: string): boolean {
  return category === 'wedding' && isBotanicalSubject(userPrompt)
}

// Detect occasion/category from user prompt text
function detectCategory(userPrompt: string): string {
  const text = userPrompt.toLowerCase()

  if (/wedding|bride|groom|bridal|engagement|nikah|pernikahan|pengantin/.test(text)) return 'wedding'
  if (/birthday|bday|ulang tahun|anniversary/.test(text)) return 'birthday'
  if (/baby|shower|newborn|pregnancy|baptis|bayi/.test(text)) return 'baby_shower'
  if (/halloween|spooky|pumpkin|witch|ghost|monster/.test(text)) return 'halloween'
  if (/christmas|xmas|santa|natal|holiday|noel/.test(text)) return 'christmas'
  if (/valentine|love|heart|romance|romantic/.test(text)) return 'valentine'
  if (/syukuran|religious|islamic|church|gereja|masjid|pray|doa|aqiqah|khitan/.test(text)) return 'religious'
  return 'general'
}

// Strip forbidden words from Groq output (case-insensitive)
function cleanPrompt(raw: string): string {
  let cleaned = raw
  for (const word of FORBIDDEN_WORDS) {
    const regex = new RegExp(word.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi')
    cleaned = cleaned.replace(regex, '')
  }
  // Collapse multiple spaces/commas left by removal
  cleaned = cleaned
    .replace(/,\s*,/g, ',')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .replace(/,\s*$/, '')
  return cleaned
}

// Build the final prompt: clean Groq output + hardcoded technical suffix
function buildFinalPrompt(groqOutput: string): string {
  const cleaned = cleanPrompt(groqOutput)
  // Remove any existing suffix-like ending Groq may have written
  const withoutGroqSuffix = cleaned
    .replace(/clean white background[^,]*/gi, '')
    .replace(/isolated on (a )?pure white background[^,]*/gi, '')
    .replace(/no text[^,]*/gi, '')
    .replace(/commercial use ready[^,]*/gi, '')
    .replace(/professional (illustration|clipart) quality[^,]*/gi, '')
    .replace(/,\s*,/g, ',')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .replace(/,\s*$/, '')

  return `${withoutGroqSuffix}, ${TECHNICAL_SUFFIX}`
}

// ─────────────────────────────────────────────────────────────────────
// MASTER SYSTEM PROMPT — The Minimalist Architect
// Instructs Groq to write SHORT, TECHNICAL prompts for Flux.1
// ─────────────────────────────────────────────────────────────────────
const MASTER_SYSTEM_PROMPT = `
ROLE: You are a Prompt Engineering specialist for Flux.1 AI image generation.
Your ONLY job is to write short, technical image generation prompts for
boutique stationery clipart elements (wedding, birthday, holiday, etc.).

CRITICAL RULE — PROMPT LENGTH:
- MODE B (text only): Maximum 40-50 words. No exceptions.
- MODE A (reference image): Maximum 55-65 words. No exceptions.
Flux performs WORSE with longer prompts. Short = better results.

STRUCTURE — Always use this exact order:
[Subject isolated element] + [Style keywords] + [Color palette] + [Composition/Technical]
Never write narrative sentences. Use comma-separated keywords only.

FORBIDDEN WORDS — Never use these in your output:
photorealistic, hyperrealistic, hyper-detailed, highly detailed, 8k, 4k,
cinematic lighting, dramatic lighting, metallic, reflective, shiny surface,
scattered across the canvas, full illustration, background scene,
environment, atmosphere, landscape, deep shadows, specular, ultra hd.

FORBIDDEN COMPOSITION — Never do this:
- Do NOT describe background elements or scenes
- Do NOT fill the canvas with many scattered elements
- Do NOT describe lighting environments
- ALWAYS write about ONE isolated subject or element group

══════════════════════════════════════════
MODE A — REFERENCE IMAGE PROVIDED
══════════════════════════════════════════

When a reference image is uploaded, extract the visual DNA of the image:

STEP 1 — IDENTIFY ARRANGEMENT TYPE (choose one):
- DENSE CLUSTER/BOUQUET: many leaves tightly packed, overlapping, stems mostly hidden
  → USE: "dense botanical cluster, heavy overlapping foliage, cascading arrangement, hidden stems"
- FRAME/BORDER: four separate corner groups with empty center void
  → USE: "four-corner botanical frame, separate corner clusters, large empty transparent center"
- SINGLE ISOLATED: one centered subject, minimal surroundings
  → USE: "single centered [subject], soft clean edges, minimal composition"
- VERTICAL CASCADE: elements flow top-to-bottom along main stem
  → USE: "vertical cascading botanical, flowing downward arrangement"
- SCATTERED PATTERN: small elements distributed loosely
  → USE: "scattered botanical elements, loose organic distribution"

CRITICAL BOTANICAL RULE — Read carefully:
If you see a DENSE BOUQUET or CLUSTER of leaves/flowers:
- NEVER describe it as "horizontal branch" or mention "stems" prominently
- ALWAYS use: "dense overlapping foliage", "cascading cluster", "hidden stems"
- The word "branch" makes Flux draw a straight line with sparse leaves
- The word "cluster" or "bouquet" makes Flux draw dense lush overlapping leaves
- This is the most important distinction for botanical subjects

STEP 2 — EXTRACT FAITHFULLY (strict accuracy):
- Describe EXACTLY what you see — size, scale, variety
- Small leaves stay small. Dense arrangement stays dense.
- List only elements that actually appear. Zero hallucination.
- Describe color palette with specific names (sage green, dusty rose, cream)
- Identify illustration technique (watercolor, line art, flat vector, etc.)

STEP 3 — ONE OPTIONAL ENHANCEMENT ONLY:
Only add if composition truly needs it. Choose maximum ONE from:
a) Scattered watercolor splatter dots in a color ALREADY in the palette
b) Tiny seed pods smaller than the smallest leaf in the reference
c) Very small buds on existing visible tips

FORBIDDEN ENHANCEMENTS:
- Do NOT add flowers if no flowers exist in reference
- Do NOT add baby's breath, ranunculus unless already present
- Do NOT change leaf variety or scale of any element
- Do NOT add elements larger than what exists in reference

OUTPUT for MODE A (55-65 words max, comma-separated keywords):
[Arrangement type using correct density keywords], [exact elements from reference],
[one optional enhancement if needed], [color palette],
[illustration technique], [mood in 2-3 words]

CORRECT Example — Dense eucalyptus bouquet reference:
"Dense botanical cluster clipart, heavy overlapping eucalyptus foliage,
cascading arrangement, large rounded oval leaves in varying sizes,
deep burgundy branching stems mostly hidden by leaves, scattered
multicolor watercolor splatter dots accent, muted sage green, grey-green,
and silver palette, soft wet-on-wet watercolor, diffused bleeding edges,
serene elegant boutique"

WRONG Example (causes sparse single-branch result — NEVER DO THIS):
"Horizontal botanical cluster spreading left to right,
thin wispy brown branching stems, loose impressionistic watercolor"

══════════════════════════════════════════
MODE B — TEXT ONLY (no reference image)
══════════════════════════════════════════

STEP 1 — DETECT OCCASION from user text:
wedding/engagement → apply elegant botanical style
birthday/party → apply whimsical playful style
baby/shower → apply soft gentle nursery style
halloween → apply spooky-cute vintage style
christmas/holiday → apply cozy festive style
valentine → apply romantic dreamy style
general/other → apply soft minimalist style

STEP 2 — DETECT SUBJECT TYPE:
cute animal/character → describe personality, pose, facial features, props
botanical/floral → describe arrangement, plant variety, leaf shapes
object/vehicle → describe shape, surface detail, decorative accents
human character → describe clothing, pose, accessories, surrounding accents

STEP 3 — WRITE PROMPT based on subject type:

══ WEDDING + BOTANICAL — SUBJECT SKELETON ONLY ══
If the occasion is WEDDING and the subject is botanical/floral,
your ONLY job is to name the subject. Nothing else.

RULE: Maximum 10 words. No art style. No background. No poetic adjectives. Subject only.

CORRECT examples:
- "A single branch of silver dollar eucalyptus leaves"
- "A bouquet of sage eucalyptus and small peony buds"
- "A cluster of olive branches with tiny white flowers"

WRONG (do NOT do this):
- "Elegant watercolor eucalyptus with soft muted tones" ← has style words
- "Botanical arrangement on white background" ← has background/composition words
- "Beautiful lush greenery with dreamy aesthetic" ← has poetic adjectives
- "Hanging bouquet, centered, isolated element" ← has composition words

Output ONLY the subject. No other words. No punctuation at the end.

══ ALL OTHER BOTANICAL/FLORAL subjects ══
"[Dense cluster/bouquet description], [botanical density keywords], [style], [color palette]"
Use "dense cluster", "lush bouquet", "cascading foliage". NEVER "A single" or "thin stems".

══ ALL OTHER subjects (characters, objects, animals) ══
"A single [subject description], [style keywords matching occasion], [color palette], centered, soft clean edges"

NEVER write more than 50 words total.
NEVER describe background, scene, or environment.
Output ONLY the final prompt text, nothing else.
`

// ─────────────────────────────────────────────────────────────────────
// PRESET SCENE MAPPING — Locked env/decor/light per scene preset
// Used by analyzeDesignForBackground to produce tight, art-directed prompts
// instead of letting Groq free-style the scene vocabulary.
// ─────────────────────────────────────────────────────────────────────
type PresetSceneData = { env: string; decor: string; light: string }

const PRESET_MAPPING: Record<string, PresetSceneData> = {
  'organic-eucalyptus': {
    env: 'a light-filled garden table with soft wrinkled linen',
    decor: 'eucalyptus sprigs and white rose petals scattered around',
    light: 'dappled sunlight through tree leaves (gobo shadows)',
  },
  'minimal-travertine': {
    env: 'a clean minimalist travertine stone slab',
    decor: 'a single modern glass vase with a green leaf branch',
    light: 'sharp architectural shadows, bright high-contrast morning sun',
  },
  'vintage-silk': {
    env: 'luxurious champagne-colored ruffled silk fabric',
    decor: 'vintage brass wax seal, ivory pearls, and a delicate ribbon',
    light: 'soft diffused window light, ethereal glow',
  },
  'earthy-terracotta': {
    env: 'aged terracotta tiles with a warm sun-baked patina',
    decor: 'dried rose petals, dried herb sprigs, and a small rustic clay bowl',
    light: 'warm raking afternoon sunlight casting long organic shadows',
  },
  'classic-black-tie': {
    env: 'rich dark navy velvet fabric draped on a polished surface',
    decor: 'gold fountain pen, champagne coupe glass, and a subtle ink mark accent',
    light: 'dramatic moody side lighting, deep shadows, single narrow spotlight',
  },
}

// Builds a Groq userMessage that injects locked scene vocabulary from PRESET_MAPPING,
// ensuring Groq cannot drift into generic descriptions.
function buildPresetSceneMessage(
  preset: PresetSceneData,
  sceneLabel: string,
  customPrompt?: string
): string {
  return `Analyze this invitation design and produce a premium wedding stationery mockup scene prompt.

LOCKED SCENE CONSTRAINTS — You MUST use exactly this vocabulary:
- Environment: "${preset.env}"
- Decorators: "${preset.decor}"
- Lighting: "${preset.light}"
- Scene label: "${sceneLabel}"

The final prompt must:
- Place decorators at the outer edges only — keep a clear empty central area for invitation placement
- Use Flatlay or Perspective composition
- Keep the color palette complementary to the invitation's dominant colors
- Include tactile texture language (linen grain, stone texture, silk drape, etc.)
- Be 60–90 words, no conversational text, output only the final image-generator prompt
${customPrompt ? `\nOptional user detail (apply only if it improves the scene without adding clutter): "${customPrompt}"` : ''}`
}

// ─────────────────────────────────────────────────────────────────────
// STYLE CONTEXT — Technical style hints appended to user message
// ─────────────────────────────────────────────────────────────────────
const STYLE_CONTEXT: Record<string, string> = {
  watercolor:
    'Style: soft hand-painted watercolor, wet-on-wet diffused edges, semi-transparent overlapping color layers, visible brush strokes, organic painted quality, muted desaturated palette',
  line_art:
    'Style: clean pen line art, fine detailed black outlines, minimal flat color fills, varying line weights, crisp coloring book quality',
  cartoon:
    'Style: cute kawaii cartoon, smooth digital painting, rounded chibi proportions, big sparkling eyes, rosy cheeks, bold clean outlines',
  boho:
    'Style: bohemian vintage illustration, earthy muted tones, aged warm patina, folk art hand-crafted rustic quality, textured brushwork',
  minimalist:
    'Style: minimalist flat design, simple geometric shapes, clean precise lines, limited solid color palette, modern refined aesthetic',
}

// ─────────────────────────────────────────────────────────────────────
// GROQ API CALLERS
// ─────────────────────────────────────────────────────────────────────
async function callGroqText(userMessage: string, systemPrompt: string): Promise<string> {
  const completion = await getGroq().chat.completions.create({
    model: TEXT_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    temperature: 0.65,
    max_tokens: 300,
  })
  return completion.choices[0]?.message?.content?.trim() ?? ''
}

async function callGroqVision(
  imageBase64: string,
  mimeType: string,
  userMessage: string,
  systemPrompt: string
): Promise<string> {
  const completion = await getGroq().chat.completions.create({
    model: VISION_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${imageBase64}` },
          },
          { type: 'text', text: userMessage },
        ],
      },
    ],
    temperature: 0.7,
    max_tokens: 400,
  })
  return completion.choices[0]?.message?.content?.trim() ?? ''
}

// ─────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────

export async function enhancePrompt(
  userPrompt: string,
  style: string,
  referenceImageBase64?: string,
  referenceImageMimeType?: string
): Promise<string> {
  const styleHint = STYLE_CONTEXT[style] ?? ''

  try {
    let rawOutput: string

    if (referenceImageBase64 && referenceImageMimeType) {
      // ── MODE A: Reference image provided ──
      const category = detectCategory(userPrompt || '')

      if (isWeddingBotanical(userPrompt || '', category)) {
        // ── WEDDING BOTANICAL MODE A: Subject skeleton extraction ──
        // Groq names the subject only — style/composition/negatives are hardcoded
        const subjectMessage = `TASK: Look at this botanical reference image.
Name the subject only. Maximum 10 words. No art style, no background, no poetic adjectives.
Example: "A single branch of silver dollar eucalyptus leaves"
Output ONLY the subject, nothing else.`

        const subject = await callGroqVision(
          referenceImageBase64,
          referenceImageMimeType,
          subjectMessage,
          MASTER_SYSTEM_PROMPT
        )
        rawOutput = buildWeddingBotanicalPrompt(cleanPrompt(subject))

        console.log('[Groq] Mode: A — WEDDING BOTANICAL (subject skeleton)')
        console.log('[Groq] Subject from Groq:', subject)
        console.log('[Groq] Final prompt:', rawOutput)

        return rawOutput
      }

      // Standard Mode A — non-wedding or non-botanical
      const isBotanical = isBotanicalSubject(userPrompt || '')
      const densityHint = isBotanical
        ? `BOTANICAL DENSITY REMINDER: If you see a dense cluster or bouquet of leaves/foliage,
use these keywords: "${BOTANICAL_DENSITY_MODULE}".
Do NOT describe stems prominently. Use "hidden stems" instead.
Do NOT write "horizontal spreading" or "thin wispy".`
        : ''

      const userMessage = `MODE A — Reference image provided.
Analyze using the steps above. User also wrote: "${userPrompt || 'generate a similar element'}".
${styleHint}
${densityHint}
Write a 55-65 word comma-separated prompt. No sentences. No narrative.`

      rawOutput = await callGroqVision(
        referenceImageBase64,
        referenceImageMimeType,
        userMessage,
        MASTER_SYSTEM_PROMPT
      )
    } else {
      // ── MODE B: Text only ──
      const category = detectCategory(userPrompt)
      const categoryJacket = CATEGORY_STYLE_JACKET[category] ?? CATEGORY_STYLE_JACKET.general
      const isBotanical = isBotanicalSubject(userPrompt)

      if (isWeddingBotanical(userPrompt, category)) {
        // ── WEDDING BOTANICAL MODE B: Subject skeleton extraction ──
        // Groq names the subject only — style/composition/negatives are hardcoded
        const subjectMessage = `TASK: Extract the botanical subject from this user input.
User input: "${userPrompt}"
Name the subject only. Maximum 10 words. No art style, no background, no poetic adjectives.
Example outputs:
- "A single branch of silver dollar eucalyptus leaves"
- "A bouquet of sage eucalyptus and peony buds"
- "A cluster of olive branches with small white flowers"
Output ONLY the subject, nothing else.`

        const subject = await callGroqText(subjectMessage, MASTER_SYSTEM_PROMPT)
        rawOutput = buildWeddingBotanicalPrompt(cleanPrompt(subject))

        console.log('[Groq] Mode: B — WEDDING BOTANICAL (subject skeleton)')
        console.log('[Groq] Subject from Groq:', subject)
        console.log('[Groq] Final prompt:', rawOutput)

        return rawOutput
      }

      // Inject botanical density module for non-wedding botanical subjects
      const botanicalHint = isBotanical
        ? `BOTANICAL DENSITY INJECTION: This is a botanical/floral subject.
Inject these density keywords into the prompt: "${BOTANICAL_DENSITY_MODULE}".
Watercolor technique: "${BOTANICAL_WATERCOLOR_TECHNIQUE}".
Use "cluster" or "bouquet" instead of "branch".
Do NOT write "thin stems" or "spreading left to right".`
        : ''

      const userMessage = `MODE B — Text only, no reference image.
User description: "${userPrompt}"
Selected illustration style: ${style}
Occasion category keywords to inject: ${categoryJacket}
${botanicalHint}
${styleHint}
Write a maximum 40-50 word comma-separated prompt. No sentences. No narrative. Output ONLY the prompt.`

      rawOutput = await callGroqText(userMessage, MASTER_SYSTEM_PROMPT)
    }

    const finalPrompt = buildFinalPrompt(rawOutput)
    const wordCount = finalPrompt.split(' ').length

    console.log('[Groq] Mode:', referenceImageBase64 ? 'A (with image)' : 'B (text only)')
    console.log('[Groq] Model:', referenceImageBase64 ? VISION_MODEL : TEXT_MODEL)
    console.log('[Groq] Raw output word count:', rawOutput.split(' ').length)
    console.log('[Groq] Final prompt word count:', wordCount)
    console.log('[Groq] Final prompt:', finalPrompt)

    return finalPrompt

  } catch (error: any) {
    const msg = error?.message ?? ''
    console.error('[Groq] Error:', msg)

    if (msg.includes('429') || msg.includes('rate_limit')) throw new Error('GROQ_RATE_LIMIT')
    if (msg.includes('401') || msg.includes('invalid_api_key')) throw new Error('GROQ_INVALID_KEY')
    throw new Error('GROQ_FAILED')
  }
}

export async function analyzeReferenceImage(
  imageBase64: string,
  mimeType: string
): Promise<string> {
  try {
    const userMessage = `MODE A — Analyze this reference image.
No user text provided. Extract visual DNA: spatial arrangement, exact elements,
color palette, illustration technique.
BOTANICAL DENSITY REMINDER: If you see dense leaves, foliage, or botanical cluster,
use: "${BOTANICAL_DENSITY_MODULE}". Use "hidden stems" not "thin stems".
Use "cluster" or "bouquet" not "branch". Never write "spreading left to right".
Write 55-65 word comma-separated prompt. No sentences. No narrative. Output ONLY the prompt.`

    const rawOutput = await callGroqVision(imageBase64, mimeType, userMessage, MASTER_SYSTEM_PROMPT)
    const finalPrompt = buildFinalPrompt(rawOutput)

    console.log('[Groq] analyzeReferenceImage word count:', finalPrompt.split(' ').length)
    console.log('[Groq] analyzeReferenceImage result:', finalPrompt)

    return finalPrompt

  } catch (error: any) {
    const msg = error?.message ?? ''
    console.error('[Groq] analyzeReferenceImage error:', msg)

    if (msg.includes('429') || msg.includes('rate_limit')) throw new Error('GROQ_RATE_LIMIT')
    throw new Error('GROQ_FAILED')
  }
}

type CornerDetectionResult = {
  topLeft: { x: number; y: number }
  topRight: { x: number; y: number }
  bottomRight: { x: number; y: number }
  bottomLeft: { x: number; y: number }
}

// Returns centered fallback corners (middle 60% of image) when vision detection fails
function fallbackCorners(w: number, h: number): CornerDetectionResult {
  return pctToPixels({ topLeft: { x: 0.20, y: 0.15 }, topRight: { x: 0.80, y: 0.15 }, bottomRight: { x: 0.80, y: 0.85 }, bottomLeft: { x: 0.20, y: 0.85 } }, w, h)
}

// Converts percentage-based corners (0.0–1.0) to pixel coordinates
function pctToPixels(
  pct: { topLeft: { x: number; y: number }; topRight: { x: number; y: number }; bottomRight: { x: number; y: number }; bottomLeft: { x: number; y: number } },
  w: number,
  h: number
): CornerDetectionResult {
  return {
    topLeft:     { x: Math.round(pct.topLeft.x * w),     y: Math.round(pct.topLeft.y * h)     },
    topRight:    { x: Math.round(pct.topRight.x * w),    y: Math.round(pct.topRight.y * h)    },
    bottomRight: { x: Math.round(pct.bottomRight.x * w), y: Math.round(pct.bottomRight.y * h) },
    bottomLeft:  { x: Math.round(pct.bottomLeft.x * w),  y: Math.round(pct.bottomLeft.y * h)  },
  }
}

function parseCornerResponse(raw: string, w: number, h: number): CornerDetectionResult | null {
  const stripped = raw.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim()
  const match = stripped.match(/\{[\s\S]*\}/)
  if (!match) return null
  try {
    const obj = JSON.parse(match[0]) as { topLeft: { x: number; y: number }; topRight: { x: number; y: number }; bottomRight: { x: number; y: number }; bottomLeft: { x: number; y: number } }
    for (const key of ['topLeft', 'topRight', 'bottomRight', 'bottomLeft'] as const) {
      if (typeof obj[key]?.x !== 'number' || typeof obj[key]?.y !== 'number') return null
    }
    // Values ≤ 1.5 → treat as percentages, otherwise treat as pixels
    const isPercent = obj.topLeft.x <= 1.5 && obj.topRight.x <= 1.5
    return isPercent ? pctToPixels(obj, w, h) : (obj as CornerDetectionResult)
  } catch {
    return null
  }
}

export async function detectMockupCorners(
  imageBase64: string,
  mimeType: string,
  imageWidth: number,
  imageHeight: number
): Promise<CornerDetectionResult> {
  const systemPrompt = `You are a precise computer vision assistant. Output ONLY a JSON object — no explanation, no markdown, no extra text.`

  // Ask for percentages (0.0–1.0) — vision models are far more accurate with
  // relative positions than absolute pixel coordinates
  const userMessage = `Look at this image carefully.

Find the rectangular design surface: the board, paper, easel sign, or framed card where artwork/text is displayed.

Return the 4 corners as PERCENTAGE values (0.0 to 1.0) of the image width and height.
- x=0.0 means far left edge, x=1.0 means far right edge
- y=0.0 means top edge, y=1.0 means bottom edge

Example for a sign that takes up the center-right area:
{"topLeft":{"x":0.35,"y":0.10},"topRight":{"x":0.90,"y":0.08},"bottomRight":{"x":0.88,"y":0.82},"bottomLeft":{"x":0.33,"y":0.85}}

Output ONLY the JSON, nothing else.`

  try {
    const raw = await callGroqVision(imageBase64, mimeType, userMessage, systemPrompt)
    console.log('[Groq] detectMockupCorners raw:', raw.slice(0, 400))

    const parsed = parseCornerResponse(raw, imageWidth, imageHeight)
    if (parsed) {
      console.log('[Groq] detectMockupCorners result (px):', parsed)
      return parsed
    }

    console.warn('[Groq] detectMockupCorners: unparseable, using fallback')
    return fallbackCorners(imageWidth, imageHeight)
  } catch (error: any) {
    const msg = error?.message ?? ''
    console.error('[Groq] detectMockupCorners error:', msg)
    if (msg.includes('429') || msg.includes('rate_limit')) throw new Error('GROQ_RATE_LIMIT')
    console.warn('[Groq] detectMockupCorners: API error, using fallback')
    return fallbackCorners(imageWidth, imageHeight)
  }
}

// Analyzes a design image and returns a Flux Schnell background-only prompt.
// The prompt requests an empty center area so the design can be composited on top.
export async function analyzeDesignForBackground(
  designBase64: string,
  mimeType: string,
  options?: {
    sceneLabel?: string
    scenePrompt?: string
    customPrompt?: string
  }
): Promise<string> {
  const BACKGROUND_SYSTEM_PROMPT = `You are an expert Photography Art Director specializing in high-end Wedding Stationery Mockups.
Your job is to analyze a user's invitation design and describe a matching physical environment for a professional photoshoot.

STRICT VISUAL GUIDELINES:
1. LIGHTING: Always specify light coming from the top-left — use "Dappled sunlight from top-left", "Gobo shadows from top-left", or "Soft morning light through a window from the top-left". This is non-negotiable for a premium look.
2. COMPOSITION: Describe a "Flatlay" or "Perspective" view. Demand a "clear, empty central area" for the invitation to be placed later.
3. TEXTURES: Use words like "Fine-grained paper texture", "Wrinkled organic linen", "Travertine stone", or "Raw silk fabric".
4. DECORATORS: Suggest 2-3 realistic elements based on the design's vibe (e.g., "Eucalyptus sprigs", "Dried white rose petals", "Vintage wax seal stamp", "Gold minimalist scissors").
5. COLOR PALETTE: Ensure the background colors complement the colors you see in the user's design.

OUTPUT FORMAT:
Provide ONLY the final prompt for the image generator (Flux/Fal.ai). No conversational text.`

  // Prefer locked PRESET_MAPPING data over free-form scenePrompt text when available.
  // This prevents Groq from drifting into generic vocabulary and ensures each
  // preset produces a distinct, art-directed scene.
  const mappedPreset = options?.sceneLabel ? PRESET_MAPPING[options.sceneLabel] : undefined

  const userMsg = mappedPreset
    ? buildPresetSceneMessage(mappedPreset, options!.sceneLabel!, options?.customPrompt)
    : options?.scenePrompt
    ? `Analyze this invitation design and produce a premium wedding stationery mockup scene prompt.
Use this scene direction as a hard constraint for surface, mood, and prop vocabulary: "${options.scenePrompt}".
Scene label: "${options.sceneLabel ?? 'preset scene'}".
${options.customPrompt ? `Optional extra detail from user: "${options.customPrompt}". Apply it only if it improves the scene without adding clutter.` : ''}
The final prompt must:
- keep a clear, empty central area for later invitation placement
- use either Flatlay or Perspective composition
- include one approved lighting cue
- include tactile premium textures
- include 2-3 realistic decorators at the outer edges only
- keep the palette complementary to the invitation artwork
- return only the final image-generator prompt`
    : options?.customPrompt
      ? `Analyze this invitation design's decorative elements, dominant colors, and overall mood.
Create a premium wedding stationery mockup scene prompt using this optional extra direction only if it stays refined and uncluttered: "${options.customPrompt}".
The final prompt must keep a clear, empty central area, use Flatlay or Perspective composition, include one approved lighting cue, mention tactile textures, include 2-3 realistic decorators, keep colors complementary to the design, and return only the final image-generator prompt.`
      : `Analyze this invitation design's decorative elements, dominant colors, and overall mood.
Create the most suitable premium wedding stationery mockup scene prompt.
The final prompt must keep a clear, empty central area, use Flatlay or Perspective composition, include one approved lighting cue, mention tactile textures, include 2-3 realistic decorators, keep colors complementary to the design, and return only the final image-generator prompt.`

  try {
    const raw = await callGroqVision(designBase64, mimeType || 'image/png', userMsg, BACKGROUND_SYSTEM_PROMPT)
    if (!raw) throw new Error('Empty response from Groq')
    return raw.trim()
  } catch (error: any) {
    const msg = error?.message ?? ''
    console.error('[Groq] analyzeDesignForBackground error:', msg || error)

    // Fall back to a deterministic premium flatlay prompt instead of failing the whole request.
    return buildFallbackBackgroundPrompt(options)
  }
}

function buildFallbackBackgroundPrompt(options?: {
  sceneLabel?: string
  scenePrompt?: string
  customPrompt?: string
}) {
  const rawDirection = [options?.scenePrompt, options?.customPrompt]
    .filter(Boolean)
    .join(', ')
    .replace(/place this invitation card/gi, '')
    .replace(/display this design/gi, '')
    .replace(/display this card/gi, '')
    .replace(/this card/gi, '')
    .replace(/invitation card/gi, '')
    .replace(/mounted on/gi, '')
    .replace(/centered inside/gi, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+,/g, ',')
    .trim()

  if (rawDirection) {
    return [
      'Flatlay premium wedding stationery photography',
      simplifySceneDirection(rawDirection),
      'clear empty central area for invitation placement',
      'soft morning light through a window',
      'complementary warm neutral palette',
      'refined editorial product photoshoot',
    ].join(', ')
  }

  return [
    'Flatlay premium wedding stationery photography',
    'travertine stone with wrinkled organic linen and fine-grained paper texture',
    'eucalyptus sprigs, dried white rose petals, and a vintage wax seal stamp at the outer edges only',
    'soft morning light through a window',
    'clear empty central area for invitation placement',
    'warm neutral palette that complements the invitation artwork',
    'refined editorial product photoshoot',
  ].join(', ')
}

function simplifySceneDirection(input: string) {
  return input
    .replace(/realistic etsy listing mockup/gi, '')
    .replace(/realistic product photography/gi, '')
    .replace(/sharp focus/gi, '')
    .replace(/highly detailed/gi, '')
    .replace(/outdoor garden wedding ceremony backdrop/gi, 'clean elegant backdrop')
    .replace(/lush white floral arrangements/gi, 'minimal white floral accents')
    .replace(/fresh peonies, roses, and linen fabric background/gi, 'soft linen surface with minimal blush floral accents at the edges')
    .replace(/fresh eucalyptus sprigs and small white flowers arranged around it/gi, 'subtle eucalyptus accents at the outer edges')
    .replace(/surrounded by/g, 'with')
    .replace(/soft natural light/gi, 'soft morning light through a window')
    .replace(/soft natural daylight from above/gi, 'soft morning light through a window')
    .replace(/warm candlelight ambiance/gi, 'gobo shadows with a warm restrained glow')
    .replace(/bright cheerful lighting/gi, 'dappled sunlight')
    .replace(/top-down flat lay perspective/gi, 'Flatlay view')
    .replace(/top-down flatlay photography/gi, 'Flatlay view')
    .replace(/flat lay/gi, 'Flatlay')
    .replace(/negative space in center/gi, 'clear empty central area')
    .replace(/negative space/gi, 'clear empty central area')
    .replace(/\s+/g, ' ')
    .replace(/\s+,/g, ',')
    .replace(/,+/g, ',')
    .replace(/^,\s*|\s*,\s*$/g, '')
    .trim()
}

export async function analyzeInvitationForMockup(
  invitationImageBase64: string,
  mimeType: string,
  userCustomPrompt?: string
): Promise<string> {
  const MOCKUP_SYSTEM_PROMPT = `You are a professional product photographer and creative director specializing in wedding and invitation photography styling.

Your job has two parts:

PART 1 — ANALYZE THE INVITATION:
Read the uploaded invitation design and identify:

a) THEME/OCCASION: What is this invitation for?
   Wedding / Engagement / Birthday / Baby shower / Christmas / Halloween / Valentine's Day / Other

b) BOTANICAL OR DECORATIVE ELEMENTS:
   List the 2-3 most prominent illustration elements on the invitation.

c) COLOR PALETTE: What are the dominant colors?

d) STYLE/MOOD: What is the overall aesthetic?

PART 2 — CREATE A REALISTIC PHOTO SCENE PROMPT:
Based on your analysis, create a detailed prompt for a REALISTIC PRODUCT PHOTOGRAPHY SCENE.

CRITICAL RULES:
- The scene must be a REALISTIC PHOTOGRAPH, NOT watercolor or illustration
- Match scene props and flowers to the invitation's theme and color palette
- The invitation card must be FLAT, SHARP, FULLY VISIBLE, and UNDISTORTED
- Scene should feel like a professional Etsy product listing photo

SCENE STRUCTURE — always include:
1. SURFACE: marble, linen fabric, wooden table, ceramic plate, gold decorative plate
2. PROPS: real flowers matching invitation theme, eucalyptus, ribbon, wax seal
3. LIGHTING: soft natural daylight, warm candlelight, soft diffused studio light
4. ANGLE: flat lay top-down, slight 15-degree angle, eye-level portrait
5. MOOD: romantic, elegant, cozy, festive, playful

OUTPUT FORMAT:
Write ONE continuous realistic scene description of 80-120 words.
Start with invitation placement. Then props. Then surface, lighting, angle.
End with EXACTLY: "the invitation card remains completely flat, sharp, fully visible and readable, professional product photography, high resolution, Etsy listing photo quality"`

  const userMessage = userCustomPrompt
    ? `Analyze this invitation and create a realistic photo scene prompt. The user also requests: "${userCustomPrompt}". Incorporate the user's request into the scene while still matching the invitation's theme.`
    : `Analyze this invitation and automatically create the most suitable realistic photo scene prompt that matches this invitation's theme, colors, and decorative elements.`

  try {
    const scenePrompt = await callGroqVision(
      invitationImageBase64,
      mimeType || 'image/png',
      userMessage,
      MOCKUP_SYSTEM_PROMPT
    )

    if (!scenePrompt) throw new Error('Groq returned an empty scene prompt.')

    console.log('[Groq] analyzeInvitationForMockup word count:', scenePrompt.split(' ').length)
    console.log('[Groq] Scene prompt:', scenePrompt)

    return scenePrompt

  } catch (error: any) {
    const msg = error?.message ?? ''
    console.error('[Groq] analyzeInvitationForMockup error:', msg)

    if (msg.includes('429') || msg.includes('rate_limit')) throw new Error('GROQ_RATE_LIMIT')
    throw new Error('GROQ_FAILED')
  }
}
