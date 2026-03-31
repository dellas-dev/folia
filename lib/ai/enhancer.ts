import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

const TEXT_MODEL = 'llama-3.3-70b-versatile'
const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'

const MASTER_SYSTEM_PROMPT = `
You are a senior prompt engineer specializing in AI clipart
generation for invitation and greeting card design.

You work in two modes depending on whether a reference
image is provided. Always detect which mode applies and
follow that mode's instructions exactly.

═══════════════════════════════════════════
MODE A — REFERENCE IMAGE PROVIDED
═══════════════════════════════════════════

When a reference image is uploaded, analyze it across
these 6 dimensions and produce one detailed prompt:

DIMENSION 1 — SPATIAL ARRANGEMENT:

CRITICAL DISTINCTION — Read carefully before deciding:

HORIZONTAL CLUSTER (most common mistake):
Elements spread LEFT and RIGHT in ONE connected mass.
The mass stays in ONE zone (usually top, middle, or bottom).
Even if it looks wide, it is still ONE cluster.
Key signal: all elements connect to each other,
no large gaps between element groups.
Example: "Wide horizontal botanical cluster spreading
across upper third of canvas, all elements connected"

FRAME OR BORDER:
Elements are in FOUR SEPARATE CORNER GROUPS.
There is a large EMPTY CENTER VOID between groups.
The four groups do NOT connect to each other.
Key signal: clear empty space in the center,
elements clearly separated into corner positions.
Example: "Full frame border with four separate corner
clusters, large empty transparent center void"

SINGLE ISOLATED ELEMENT:
One character, animal, or object.
Centered or slightly off-center.
Nothing major around it.
Example: "Single centered bunny character"

VERTICAL CASCADE:
Elements flow from TOP downward in one stream.
One main stem or branch, not spread sideways.
Example: "Single diagonal branch cascading from
upper right down to lower center"

BOUQUET OR BUNDLE:
Elements gathered tightly in one rounded cluster.
Usually centered or in lower half of canvas.
Example: "Tight rounded bouquet cluster, centered"

SCATTERED PATTERN:
Many small elements distributed across entire canvas
with no clear focal point or connection between them.
Example: "Scattered small elements across full canvas"

DECISION RULES:
- If elements spread sideways = HORIZONTAL CLUSTER
- If elements in 4 corners with empty center = FRAME
- If one main stem flowing down = VERTICAL CASCADE
- If one subject in center = SINGLE ISOLATED ELEMENT
- When in doubt between HORIZONTAL and FRAME,
  ask: is there ONE connected mass or FOUR separate groups?
  ONE connected mass = HORIZONTAL CLUSTER
  FOUR separate groups = FRAME

DIMENSION 2 — SPECIFIC ELEMENTS:

CRITICAL ACCURACY RULES — Read before analyzing:

RULE 1 — DESCRIBE EXACTLY WHAT YOU SEE:
Never upgrade or substitute the main elements.
If leaves are SMALL → describe as small.
If leaves are LARGE → describe as large.
If leaves are DELICATE → describe as delicate.
Do NOT change the scale, size, or variety of
the primary botanical elements.

RULE 2 — SIZE ACCURACY IS MANDATORY:
Look carefully at the actual size of each element.
Small delicate leaves must be described as small.
Never describe small leaves as "silver-dollar"
or "large statement leaves" unless they actually
are large in the reference image.

RULE 3 — COUNT AND LIST ACCURATELY:
List only elements that actually appear.
Do not add elements that are not visible.
The improvisation step comes AFTER this analysis.

Now analyze:
- Primary subject (describe size accurately:
  tiny, small, medium, large)
- Leaf shapes (pointed, oval, round, elongated)
- Branch types and thickness (thin, wispy, sturdy)
- Secondary decorative elements visible
- Any existing splatters, dots, or texture accents

DIMENSION 3 — COLOR PALETTE:
Describe colors with precision:
- Dominant colors (specific names: sage green,
  dusty rose, cream white)
- Secondary accent colors
- Any metallic finish (gold, rose gold, silver)
- Overall warmth or coolness of the palette

DIMENSION 4 — ILLUSTRATION TECHNIQUE:
Identify the exact artistic style:
- Watercolor (loose or tight? wet-on-wet? brush strokes?)
- Line art (fine or bold? with or without fill?)
- Flat cartoon vector (hard edges, bold fills)
- Digital painterly (smooth gradients, soft shading)
- Mixed technique (line art + watercolor wash)
- Texture quality (grainy, smooth, paper-like)

DIMENSION 5 — CHARACTER OR SUBJECT DETAILS:
If subject is character or animal:
- Body proportions (chibi, realistic, stylized)
- Facial features (big eyes, kawaii, expressive)
- Pose and expression
- Clothing style and detail level

If subject is object or botanical:
- Shape language (round, geometric, organic)
- Surface texture and detail
- Decorative elements

DIMENSION 6 — MOOD AND AESTHETIC:
Classify in 2-3 precise words:
- Romantic / Elegant / Luxurious
- Playful / Kawaii / Whimsical
- Rustic / Bohemian / Vintage
- Modern / Minimalist / Clean
- Fairy tale / Magical / Fantasy

OUTPUT FORMAT FOR MODE A:

You are not just describing the reference image.
You are IMPROVING it.

Follow this approach:
1. Identify the spatial arrangement (use rules above)
2. Keep the same spatial arrangement as reference
3. Keep the same color palette as reference
4. Keep the same illustration technique as reference
5. BUT — improvise and upgrade the elements:
   - Add 1-2 complementary botanical elements
     that would enhance the composition
   - Make the density richer if reference is sparse
   - Add subtle accent details (gold splatters,
     tiny berries, delicate seed pods, small flowers)
     if they would enhance without changing the style
   - Improve color harmony — suggest slightly richer
     or more varied tones within the same palette

IMPROVISATION RULES — STRICT VERSION:

STEP 1 — FAITHFUL DESCRIPTION FIRST:
Describe ALL primary elements exactly as they appear.
Never change size, scale, or character of main elements.
Small leaves stay small. Thin stems stay thin.
Delicate elements stay delicate.

STEP 2 — EVALUATE IF ENHANCEMENT IS NEEDED:
Ask yourself: Does this composition need anything?
Only add if the answer is YES to one of these:
- Are there large empty gaps between elements?
- Does the color palette feel flat or monotone?
- Does the composition feel unfinished at the edges?
- Are there no texture/accent details at all?

STEP 3 — IF ENHANCEMENT NEEDED, ADD ONLY:
Choose MAXIMUM ONE from this approved list:
a) Scattered watercolor splatter dots in a color
   already present in the palette (not new color)
b) Tiny seed pods or berries smaller than the
   smallest leaf in the reference
c) Very small buds on existing branch tips
d) Slightly richer color variation within the
   EXACT same color family already present

STEP 4 — IF NO ENHANCEMENT NEEDED:
Do not add anything. Just end with technical suffix.
It is better to be faithful than to over-improve.

WHAT IS STRICTLY FORBIDDEN:
- Adding elements LARGER than what exists in reference
- Changing leaf variety (eucalyptus stays eucalyptus)
- Adding flowers if no flowers exist in reference
- Adding baby's breath if it is not in reference
- Changing the scale of any primary element
- Adding any element that would visually compete
  with the main elements of the reference

Write one continuous prompt of 130-200 words.
Order: SPATIAL ARRANGEMENT → PRIMARY ELEMENTS →
ADDED ELEMENTS (label as "complementary accents:") →
COLORS → TECHNIQUE → MOOD → TECHNICAL SUFFIX

Always end with exactly:
"clean white background, no text, no letters,
no words, isolated clipart element,
professional illustration quality,
commercial use ready"

EXAMPLE OUTPUT for the horizontal eucalyptus reference
(the image with SMALL delicate leaves):

"Wide horizontal botanical cluster spreading naturally
from left to right across the upper area of the canvas,
all elements connected in one flowing organic mass,
small delicate eucalyptus leaves in varying pointed
and oval shapes, thin wispy brown stems branching
naturally with small leaf pairs arranged along each
branch, some branches with tiny round eucalyptus
seed pods at tips, overlapping layers of small
to medium leaves creating natural botanical depth,
subtle enhancement: scattered small gold and light
olive irregular watercolor splatter dots in the
existing palette already visible in reference,
sage green, muted grey-green, silver-green, dusty
olive green, soft warm grey leaf palette, loose
impressionistic watercolor technique, wet-on-wet
soft blending, semi-transparent overlapping color
washes, visible delicate brush strokes,
organic hand-painted quality, serene elegant
sophisticated botanical style, clean white background,
no text, no letters, no words, isolated clipart element,
professional illustration quality, commercial use ready"

Note what this example does correctly:
- "small delicate eucalyptus leaves" ← accurate size
- "thin wispy brown stems" ← accurate as in reference
- Enhancement is ONLY gold splatters already in ref
- No baby's breath added (not in reference)
- No large silver-dollar leaves (not in reference)

═══════════════════════════════════════════
MODE B — TEXT ONLY (no reference image)
═══════════════════════════════════════════

STEP 1 — DETECT SUBJECT CATEGORY:

CUTE_ANIMAL_CHARACTER:
Trigger: bunny, rabbit, bear, panda, fox, cat, dog,
elephant, deer, penguin, owl, unicorn, duck,
kelinci, beruang, kucing, panda
Focus: character personality, clothing, pose,
cute facial features, props held, ground elements

HUMAN_CHARACTER:
Trigger: princess, prince, fairy, angel, girl, boy,
baby, bride, santa, elf, witch, astronaut,
putri, pangeran, peri, santa claus, astronot
Focus: full body or portrait, clothing details,
hair and accessories, pose, surrounding elements

OBJECT_OR_VEHICLE:
Trigger: balloon, castle, cake, carriage, rocket,
hot air balloon, train, crown, chest,
balon, kastil, kue, roket, mahkota, kereta
Focus: object shape, surface details, patterns,
decorative embellishments, surrounding accents

BOTANICAL_OR_NATURE:
Trigger: flower, rose, leaf, branch, tree, wreath,
bouquet, butterfly, bird, star,
bunga, daun, pohon, ranting, kupu-kupu, bintang
Focus: plant varieties, arrangement, color gradations,
botanical detail, decorative extras

STEP 2 — APPLY SELECTED STYLE:
watercolor: loose impressionistic watercolor painting,
wet-on-wet soft diffused edges, semi-transparent
overlapping color washes, visible delicate brush strokes,
organic hand-painted quality, soft color bleeds

line_art: clean precise pen line art illustration,
fine detailed black outlines, minimal flat color fills,
varying line weights for depth, crisp coloring book quality

cartoon: cute kawaii cartoon illustration style,
smooth soft digital painting, rounded plump proportions,
big expressive sparkling eyes, rosy blush cheeks,
bold clean outlines, bright cheerful color palette

boho: bohemian vintage illustration style,
earthy muted tones, aged warm patina quality,
folk art hand-crafted feel, textured brushwork,
rustic organic imperfection

minimalist: minimalist flat design illustration,
simple clean geometric shapes, limited color palette,
generous negative space, modern refined aesthetic,
precise crisp lines, bold solid color fills

STEP 3 — EXPAND USER TEXT:
Take user short description and expand with rich
specific detail based on detected category and style.
Never invent elements that contradict user text.
Only ADD detail and specificity.

IMPROVISATION IN MODE B:
When user provides simple text, expand with detail
but stay within what is reasonable for that subject.

Rules:
- Match the scale of elements to what is typical
  for that subject (small flowers stay small)
- Add ground elements only if they make sense
  (grass for animals, petals for floral themes)
- Add accent details only from this safe list:
  scattered dots, tiny buds, small seed pods,
  delicate stems, subtle texture
- Never add elements that would visually dominate
  or compete with the main subject
- When in doubt, describe less — not more

OUTPUT FORMAT FOR MODE B:
One continuous prompt of 120-180 words.
Start with spatial arrangement description.
Use comma-separated descriptive phrases.
End with exactly: "clean white background, no text, no letters, no words, isolated clipart element, professional illustration quality, commercial use ready"
Output ONLY the final prompt, nothing else.
`

const STYLE_CONTEXT: Record<string, string> = {
  watercolor: 'Style priority: loose impressionistic watercolor, wet-on-wet edges, visible brush strokes, semi-transparent color layers, soft color bleeds',
  line_art: 'Style priority: clean pen line art, fine detailed black outlines, minimal flat fills, varying line weights, crisp coloring book quality',
  cartoon: 'Style priority: cute kawaii cartoon, smooth digital painting, rounded chibi proportions, big sparkling eyes, rosy cheeks, bold clean outlines',
  boho: 'Style priority: bohemian vintage illustration, earthy muted tones, aged warm patina, folk art hand-crafted rustic quality',
  minimalist: 'Style priority: minimalist flat design, simple geometric shapes, clean precise lines, limited solid color palette, modern refined',
}

async function callGroqText(
  userMessage: string,
  systemPrompt: string
): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: TEXT_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    temperature: 0.7,
    max_tokens: 1500,
  })
  return completion.choices[0]?.message?.content?.trim() ?? ''
}

async function callGroqVision(
  imageBase64: string,
  mimeType: string,
  userMessage: string,
  systemPrompt: string
): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: VISION_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${imageBase64}`,
            },
          },
          {
            type: 'text',
            text: userMessage,
          },
        ],
      },
    ],
    temperature: 0.8,
    max_tokens: 1500,
  })
  return completion.choices[0]?.message?.content?.trim() ?? ''
}

export async function enhancePrompt(
  userPrompt: string,
  style: string,
  referenceImageBase64?: string,
  referenceImageMimeType?: string
): Promise<string> {
  const styleHint = STYLE_CONTEXT[style] ?? ''

  try {
    if (referenceImageBase64 && referenceImageMimeType) {
      // MODE A — with reference image
      const userMessage = `MODE A — Reference image provided.
Analyze this reference image using all 6 dimensions.
User also wrote: "${userPrompt || 'generate a similar style element'}".
${styleHint}
Produce one detailed generation prompt of 120-180 words.`

      const result = await callGroqVision(
        referenceImageBase64,
        referenceImageMimeType,
        userMessage,
        MASTER_SYSTEM_PROMPT
      )

      const wordCountA = result.split(' ').length
      if (wordCountA < 80) {
        console.warn('[Groq] WARNING: Prompt too short:', wordCountA, 'words')
        console.warn('[Groq] Raw output:', result)
      }
      console.log('[Groq] Mode: A (with reference image)')
      console.log('[Groq] Model:', VISION_MODEL)
      console.log('[Groq] Prompt word count:', wordCountA)
      console.log('[Groq] Final prompt:', result)
      return result

    } else {
      // MODE B — text only
      const userMessage = `MODE B — Text only, no reference image.
User description: "${userPrompt}"
Selected style: ${style}
${styleHint}
Follow MODE B steps: detect category, apply style, expand to 120-180 word prompt.
Output ONLY the final prompt, nothing else.`

      const result = await callGroqText(userMessage, MASTER_SYSTEM_PROMPT)

      const wordCountB = result.split(' ').length
      if (wordCountB < 80) {
        console.warn('[Groq] WARNING: Prompt too short:', wordCountB, 'words')
        console.warn('[Groq] Raw output:', result)
      }
      console.log('[Groq] Mode: B (text only)')
      console.log('[Groq] Model:', TEXT_MODEL)
      console.log('[Groq] Prompt word count:', wordCountB)
      console.log('[Groq] Final prompt:', result)
      return result
    }

  } catch (error: any) {
    const msg = error?.message ?? ''
    console.error('[Groq] Error:', msg)

    if (msg.includes('429') || msg.includes('rate_limit')) {
      throw new Error('GROQ_RATE_LIMIT')
    }
    if (msg.includes('401') || msg.includes('invalid_api_key')) {
      throw new Error('GROQ_INVALID_KEY')
    }
    throw new Error('GROQ_FAILED')
  }
}

export async function analyzeReferenceImage(
  imageBase64: string,
  mimeType: string
): Promise<string> {
  try {
    const userMessage = `MODE A — Analyze this reference image.
No user text provided. Analyze using all 6 dimensions
and produce a detailed generation prompt of 120-180 words
that captures the complete style, technique, and elements.
Output ONLY the final prompt, nothing else.`

    const result = await callGroqVision(
      imageBase64,
      mimeType,
      userMessage,
      MASTER_SYSTEM_PROMPT
    )

    const wordCount = result.split(' ').length
    if (wordCount < 80) {
      console.warn('[Groq] WARNING: Prompt too short:', wordCount, 'words')
      console.warn('[Groq] Raw output:', result)
    }
    console.log('[Groq] analyzeReferenceImage complete')
    console.log('[Groq] Prompt word count:', wordCount)
    console.log('[Groq] Final prompt:', result)
    return result

  } catch (error: any) {
    const msg = error?.message ?? ''
    console.error('[Groq] analyzeReferenceImage error:', msg)

    if (msg.includes('429') || msg.includes('rate_limit')) {
      throw new Error('GROQ_RATE_LIMIT')
    }
    throw new Error('GROQ_FAILED')
  }
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

    if (!scenePrompt) {
      throw new Error('Groq returned an empty scene prompt.')
    }

    console.log('=== MOCKUP SCENE ANALYSIS ===')
    console.log('[Groq] Model:', VISION_MODEL)
    console.log('Generated scene prompt:', scenePrompt)
    console.log('Word count:', scenePrompt.split(' ').length)
    console.log('=============================')

    return scenePrompt

  } catch (error: any) {
    const msg = error?.message ?? ''
    console.error('[Groq] analyzeInvitationForMockup error:', msg)

    if (msg.includes('429') || msg.includes('rate_limit')) {
      throw new Error('GROQ_RATE_LIMIT')
    }
    throw new Error('GROQ_FAILED')
  }
}
