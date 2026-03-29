import { GoogleGenerativeAI, type Part } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

const SYSTEM_PROMPT = `You are a professional clipart prompt specialist for invitation designers.
Your job is to transform simple user descriptions into highly optimized image generation prompts.

Rules:
- Always produce isolated clipart elements (no scenes, no backgrounds)
- Always end with: transparent background, no text, no letters, isolated element, PNG clipart, professional illustration, commercial use ready
- Preserve the user's requested style modifier
- Output ONLY the enhanced prompt, nothing else`

export async function enhancePrompt(
  userPrompt: string,
  styleModifier: string,
  referenceImageUrl?: string
): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured.')
  }

  const parts: Part[] = []

  if (referenceImageUrl) {
    const imageResponse = await fetch(referenceImageUrl)

    if (!imageResponse.ok) {
      throw new Error('Failed to load the reference image for prompt enhancement.')
    }

    const imageData = await imageResponse.arrayBuffer()
    const base64 = Buffer.from(imageData).toString('base64')
    const mimeType = imageResponse.headers.get('content-type') || 'image/png'

    parts.push({
      inlineData: { data: base64, mimeType }
    })
    parts.push({
      text: `${SYSTEM_PROMPT}\n\nAnalyze the art style, color palette, and technique in this reference image, then generate an optimized prompt for: "${userPrompt}" in ${styleModifier} style.`
    })
  } else {
    parts.push({
      text: `${SYSTEM_PROMPT}\n\nEnhance this prompt: "${userPrompt}" in ${styleModifier} style.`
    })
  }

  const result = await model.generateContent(parts)
  const text = result.response.text().trim()

  if (!text) {
    throw new Error('Gemini returned an empty enhanced prompt.')
  }

  return text
}
