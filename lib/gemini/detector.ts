import Groq from 'groq-sdk'

let _groq: Groq | null = null
function getGroq() {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
  return _groq
}

const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'

export type DetectedCorners = {
  topLeft:     { x: number; y: number }
  topRight:    { x: number; y: number }
  bottomRight: { x: number; y: number }
  bottomLeft:  { x: number; y: number }
}

export type SurfaceVisionAnalysis = {
  corners: DetectedCorners
  materialTexture: string
  lightingDirection: string
  raw: string
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function parseCorners(raw: string, w: number, h: number): DetectedCorners | null {
  const stripped = raw.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim()
  const match = stripped.match(/\{[\s\S]*\}/)
  if (!match) return null
  try {
    const obj = JSON.parse(match[0]) as {
      topLeft: { x: number; y: number }
      topRight: { x: number; y: number }
      bottomRight: { x: number; y: number }
      bottomLeft: { x: number; y: number }
    }
    for (const key of ['topLeft', 'topRight', 'bottomRight', 'bottomLeft'] as const) {
      if (typeof obj[key]?.x !== 'number' || typeof obj[key]?.y !== 'number') return null
    }
    // Values ≤ 1.5 → treat as percentages (0.0–1.0), otherwise treat as pixels
    const isPercent = obj.topLeft.x <= 1.5 && obj.topRight.x <= 1.5

    const corners: DetectedCorners = isPercent
      ? {
          topLeft:     { x: Math.round(obj.topLeft.x * w),     y: Math.round(obj.topLeft.y * h)     },
          topRight:    { x: Math.round(obj.topRight.x * w),    y: Math.round(obj.topRight.y * h)    },
          bottomRight: { x: Math.round(obj.bottomRight.x * w), y: Math.round(obj.bottomRight.y * h) },
          bottomLeft:  { x: Math.round(obj.bottomLeft.x * w),  y: Math.round(obj.bottomLeft.y * h)  },
        }
      : (obj as DetectedCorners)

    // Clamp all coordinates within image bounds
    for (const key of ['topLeft', 'topRight', 'bottomRight', 'bottomLeft'] as const) {
      corners[key].x = clamp(Math.round(corners[key].x), 0, w - 1)
      corners[key].y = clamp(Math.round(corners[key].y), 0, h - 1)
    }

    return corners
  } catch {
    return null
  }
}

function sanitizeShortLabel(value: unknown, fallback: string) {
  if (typeof value !== 'string') return fallback

  const cleaned = value
    .replace(/[`"'*]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  return cleaned || fallback
}

function parseSurfaceVisionAnalysis(raw: string, w: number, h: number): SurfaceVisionAnalysis | null {
  const stripped = raw.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim()
  const match = stripped.match(/\{[\s\S]*\}/)
  if (!match) return null

  try {
    const parsed = JSON.parse(match[0]) as {
      corners?: DetectedCorners
      topLeft?: { x: number; y: number }
      topRight?: { x: number; y: number }
      bottomRight?: { x: number; y: number }
      bottomLeft?: { x: number; y: number }
      material_texture?: string
      materialTexture?: string
      lighting_direction?: string
      lightingDirection?: string
    }

    const corners = parseCorners(JSON.stringify(parsed.corners ?? parsed), w, h)
    if (!corners) return null

    return {
      corners,
      materialTexture: sanitizeShortLabel(parsed.material_texture ?? parsed.materialTexture, 'matte paper'),
      lightingDirection: sanitizeShortLabel(parsed.lighting_direction ?? parsed.lightingDirection, 'soft front lighting'),
      raw,
    }
  } catch {
    return null
  }
}

export async function detectPaperCorners(
  imageBase64: string,
  mimeType: string,
  imageWidth: number,
  imageHeight: number,
): Promise<DetectedCorners> {
  const systemPrompt = `You are a precise computer vision assistant. Output ONLY a JSON object — no explanation, no markdown, no extra text.`

  // Ask for percentages (0.0–1.0) — vision models are far more accurate with
  // relative positions than absolute pixel coordinates
  const userMessage = `Look at this mockup photo carefully.

Find the main paper, card, poster, invitation, or printed sign in the image — the rectangular surface where artwork or text is displayed.

Return the 4 corners as PERCENTAGE values (0.0 to 1.0) of the image width and height.
- x=0.0 means far left edge, x=1.0 means far right edge
- y=0.0 means top edge, y=1.0 means bottom edge

Example for a card in the center:
{"topLeft":{"x":0.25,"y":0.15},"topRight":{"x":0.75,"y":0.15},"bottomRight":{"x":0.75,"y":0.85},"bottomLeft":{"x":0.25,"y":0.85}}

Image dimensions: ${imageWidth}x${imageHeight} pixels.
Output ONLY the JSON, nothing else.`

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
    temperature: 0.1,
    max_tokens: 200,
  })

  const raw = completion.choices[0]?.message?.content?.trim() ?? ''
  console.log('[detector] detectPaperCorners raw:', raw.slice(0, 400))

  const parsed = parseCorners(raw, imageWidth, imageHeight)
  if (parsed) {
    console.log('[detector] detectPaperCorners result (px):', parsed)
    return parsed
  }

  throw new Error('CORNER_DETECTION_FAILED')
}

export async function analyzeExtractSurfaceVision(
  imageBase64: string,
  mimeType: string,
  imageWidth: number,
  imageHeight: number,
): Promise<SurfaceVisionAnalysis> {
  const systemPrompt = `You are a precise computer vision assistant. Output ONLY a JSON object with keys corners, material_texture, and lighting_direction. No markdown, no explanation.`

  const userMessage = `Analyze this image.

1. Find the 4 precise corners [x, y] of the primary paper, canvas, poster, sign, or printed surface.
2. Identify the base material texture in a short phrase (examples: matte paper, linen paper, painted canvas, stained wood).
3. Describe the lighting direction in a short phrase (examples: soft daylight from top-left, frontal studio light, warm side light from right).

Return JSON in this exact shape:
{"corners":{"topLeft":{"x":0.25,"y":0.15},"topRight":{"x":0.75,"y":0.15},"bottomRight":{"x":0.75,"y":0.85},"bottomLeft":{"x":0.25,"y":0.85}},"material_texture":"matte paper","lighting_direction":"soft daylight from top-left"}

Use percentage coordinates from 0.0 to 1.0 for corners. Output ONLY the JSON.`

  try {
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
      temperature: 0.1,
      max_tokens: 260,
    })

    const raw = completion.choices[0]?.message?.content?.trim() ?? ''
    console.log('[detector] analyzeExtractSurfaceVision raw:', raw.slice(0, 400))

    const parsed = parseSurfaceVisionAnalysis(raw, imageWidth, imageHeight)
    if (parsed) {
      console.log('[detector] analyzeExtractSurfaceVision result:', {
        corners: parsed.corners,
        materialTexture: parsed.materialTexture,
        lightingDirection: parsed.lightingDirection,
      })
      return parsed
    }

    console.warn('[detector] analyzeExtractSurfaceVision: unparseable, falling back to corners-only detection')
    return {
      corners: await detectPaperCorners(imageBase64, mimeType, imageWidth, imageHeight),
      materialTexture: 'matte paper',
      lightingDirection: 'soft front lighting',
      raw,
    }
  } catch (error: any) {
    const msg = error?.message ?? ''
    console.error('[detector] analyzeExtractSurfaceVision error:', msg)
    if (msg.includes('429') || msg.includes('rate_limit')) throw new Error('GROQ_RATE_LIMIT')

    return {
      corners: await detectPaperCorners(imageBase64, mimeType, imageWidth, imageHeight),
      materialTexture: 'matte paper',
      lightingDirection: 'soft front lighting',
      raw: '',
    }
  }
}
