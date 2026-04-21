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
