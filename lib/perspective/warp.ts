import sharp from 'sharp'
import {
  type CornerPoints,
  type Point,
  applyH,
  computeHomography,
  invertMatrix3x3,
  isInsideQuad,
} from './homography'
import { normalizeInternalBlurSigma } from '@/lib/mockup/sigma'
import type { MockupScenePreset } from '@/types'

const MAX_DESIGN_PX = 1200
const MAX_REF_PX = 1500

// Bilinear interpolation: samples RGBA raw buffer at fractional (x, y)
function bilinearSample(
  data: Buffer,
  width: number,
  height: number,
  x: number,
  y: number
): [number, number, number, number] {
  const x0 = Math.max(0, Math.floor(x))
  const y0 = Math.max(0, Math.floor(y))
  const x1 = Math.min(x0 + 1, width - 1)
  const y1 = Math.min(y0 + 1, height - 1)
  const fx = x - x0
  const fy = y - y0

  function px(px_: number, py_: number): [number, number, number, number] {
    const i = (py_ * width + px_) * 4
    return [data[i], data[i + 1], data[i + 2], data[i + 3]]
  }

  const [r00, g00, b00, a00] = px(x0, y0)
  const [r10, g10, b10, a10] = px(x1, y0)
  const [r01, g01, b01, a01] = px(x0, y1)
  const [r11, g11, b11, a11] = px(x1, y1)

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t
  const bilerp = (v00: number, v10: number, v01: number, v11: number) =>
    lerp(lerp(v00, v10, fx), lerp(v01, v11, fx), fy)

  return [
    Math.round(bilerp(r00, r10, r01, r11)),
    Math.round(bilerp(g00, g10, g01, g11)),
    Math.round(bilerp(b00, b10, b01, b11)),
    Math.round(bilerp(a00, a10, a01, a11)),
  ]
}

// Returns the reference image resized to ≤ MAX_REF_PX and its dimensions.
// Call this once before detectMockupCorners so the corners match the resized dims.
export async function prepareReference(refBuffer: Buffer): Promise<{
  resizedBuffer: Buffer
  width: number
  height: number
}> {
  const { data: _, info } = await sharp(refBuffer)
    .resize(MAX_REF_PX, MAX_REF_PX, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer({ resolveWithObject: true })

  const resizedBuffer = await sharp(refBuffer)
    .resize(MAX_REF_PX, MAX_REF_PX, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer()

  return { resizedBuffer, width: info.width, height: info.height }
}

// Warps `designBuffer` onto a canvas of `refWidth × refHeight` using the
// perspective transform defined by `corners` (in the reference image's pixel space).
// Returns a PNG buffer with transparent background outside the quad.
export async function perspectiveWarp(
  designBuffer: Buffer,
  corners: CornerPoints,
  refWidth: number,
  refHeight: number
): Promise<Buffer> {
  // 1. Resize design to bounded size and get raw RGBA pixels
  const { data: designRaw, info: dInfo } = await sharp(designBuffer)
    .resize(MAX_DESIGN_PX, MAX_DESIGN_PX, { fit: 'inside', withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const dW = dInfo.width
  const dH = dInfo.height

  // 2. Define source corners (full design extent, clockwise: TL TR BR BL)
  const src: Point[] = [
    { x: 0, y: 0 },
    { x: dW - 1, y: 0 },
    { x: dW - 1, y: dH - 1 },
    { x: 0, y: dH - 1 },
  ]

  // 3. Destination corners in reference space (same clockwise order)
  const dst: Point[] = [
    corners.topLeft,
    corners.topRight,
    corners.bottomRight,
    corners.bottomLeft,
  ]

  // 4. H maps src → dst; H_inv maps dst → src (inverse mapping for rasterization)
  const H = computeHomography(src, dst)
  const H_inv = invertMatrix3x3(H)

  // 5. Bounding box of the destination quad for pixel-loop efficiency
  const xs = dst.map((p) => p.x)
  const ys = dst.map((p) => p.y)
  const bboxX0 = Math.max(0, Math.floor(Math.min(...xs)))
  const bboxY0 = Math.max(0, Math.floor(Math.min(...ys)))
  const bboxX1 = Math.min(refWidth - 1, Math.ceil(Math.max(...xs)))
  const bboxY1 = Math.min(refHeight - 1, Math.ceil(Math.max(...ys)))

  // 6. Allocate transparent RGBA output (refWidth × refHeight)
  const outData = Buffer.alloc(refWidth * refHeight * 4, 0)

  // 7. Reverse-map: for each output pixel inside the quad, sample from design
  const quad: [Point, Point, Point, Point] = [dst[0], dst[1], dst[2], dst[3]]

  for (let y = bboxY0; y <= bboxY1; y++) {
    for (let x = bboxX0; x <= bboxX1; x++) {
      if (!isInsideQuad({ x, y }, quad)) continue

      const { x: sx, y: sy } = applyH(H_inv, { x, y })

      if (sx < 0 || sy < 0 || sx >= dW || sy >= dH) continue

      const [r, g, b, a] = bilinearSample(designRaw, dW, dH, sx, sy)
      const i = (y * refWidth + x) * 4
      outData[i] = r
      outData[i + 1] = g
      outData[i + 2] = b
      outData[i + 3] = a
    }
  }

  // 8. Encode as PNG (preserves alpha for composite step)
  return sharp(outData, {
    raw: { width: refWidth, height: refHeight, channels: 4 },
  })
    .png()
    .toBuffer()
}

// Creates a fully-opaque white quad mask in the shape of the destination corners.
// Used to erase the existing design on the reference photo before placing the new one.
async function createWhiteFill(
  corners: CornerPoints,
  refWidth: number,
  refHeight: number
): Promise<Buffer> {
  const dst: Point[] = [
    corners.topLeft,
    corners.topRight,
    corners.bottomRight,
    corners.bottomLeft,
  ]

  const xs = dst.map((p) => p.x)
  const ys = dst.map((p) => p.y)
  const bboxX0 = Math.max(0, Math.floor(Math.min(...xs)))
  const bboxY0 = Math.max(0, Math.floor(Math.min(...ys)))
  const bboxX1 = Math.min(refWidth - 1, Math.ceil(Math.max(...xs)))
  const bboxY1 = Math.min(refHeight - 1, Math.ceil(Math.max(...ys)))

  const outData = Buffer.alloc(refWidth * refHeight * 4, 0)
  const quad: [Point, Point, Point, Point] = [dst[0], dst[1], dst[2], dst[3]]

  for (let y = bboxY0; y <= bboxY1; y++) {
    for (let x = bboxX0; x <= bboxX1; x++) {
      if (!isInsideQuad({ x, y }, quad)) continue
      const i = (y * refWidth + x) * 4
      outData[i] = 255
      outData[i + 1] = 255
      outData[i + 2] = 255
      outData[i + 3] = 255
    }
  }

  return sharp(outData, { raw: { width: refWidth, height: refHeight, channels: 4 } })
    .png()
    .toBuffer()
}

// Detects whether a background image has warm, cool, or neutral color temperature
// by comparing average red vs blue channel values across a downsampled version.
export async function detectColorTemperature(bgBuffer: Buffer): Promise<'warm' | 'cool' | 'neutral'> {
  const { data } = await sharp(bgBuffer)
    .resize(40, 40, { fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  let totalR = 0
  let totalB = 0
  const pixels = data.length / 3
  for (let i = 0; i < data.length; i += 3) {
    totalR += data[i]
    totalB += data[i + 2]
  }
  const diff = (totalR - totalB) / pixels
  if (diff > 14) return 'warm'
  if (diff < -14) return 'cool'
  return 'neutral'
}

// Places the design centered on a generated background.
// white-paper (over) → design (multiply): multiply(255, any) = any → card always fully opaque.
// Shadow is a separate blurred rectangle composited before the white paper.
export async function compositeDesignCentered(
  designBuffer: Buffer,
  backgroundBuffer: Buffer,
  colorTemp: 'warm' | 'cool' | 'neutral' = 'neutral',
  scenePreset?: MockupScenePreset,
  sigma?: number
): Promise<Buffer> {
  const bgMeta = await sharp(backgroundBuffer).metadata()
  const bgW = bgMeta.width!
  const bgH = bgMeta.height!

  const placement = getMockupPlacement(scenePreset)
  const maxW = Math.round(bgW * placement.maxWRatio)
  const maxH = Math.round(bgH * placement.maxHRatio)
  const designBlurSigma = normalizeInternalBlurSigma(sigma)

  // Flatten to an off-white paper tone, resize, then slightly soften the edge
  // so the card integrates without a harsh digital cutout.
  const paperColor = getPaperColor(colorTemp)
  const design = await sharp(designBuffer)
    .resize(maxW, maxH, { fit: 'inside', withoutEnlargement: false })
    .flatten({ background: paperColor })
    .blur(designBlurSigma)
    .png()
    .toBuffer()

  const { width: dW, height: dH } = await sharp(design).metadata() as { width: number; height: number }

  const left = Math.round((bgW - dW) / 2 + bgW * placement.offsetXRatio)
  const top  = Math.round((bgH - dH) / 2 + bgH * placement.offsetYRatio)

  // Paper base sits under the artwork so any transparent edges read as a physical sheet.
  const whitePaper = await sharp({
    create: { width: dW, height: dH, channels: 3, background: paperColor },
  }).png().toBuffer()

  // Keep the contact shadow light and diffuse so it does not read as a grey block.
  const shadowPad = placement.shadowPad
  const shadow = await sharp({
    create: {
      width: dW + shadowPad * 2,
      height: dH + shadowPad * 2,
      channels: 4,
      background: { r: 28, g: 22, b: 18, alpha: placement.shadowAlpha },
    },
  })
    .blur(normalizeInternalBlurSigma(placement.shadowBlur))
    .png()
    .toBuffer()

  return sharp(backgroundBuffer)
    .composite([
      // Shadow behind card, offset slightly down-right
      {
        input: shadow,
        blend: 'over',
        left: Math.max(0, left - shadowPad + placement.shadowOffsetX),
        top:  Math.max(0, top  - shadowPad + placement.shadowOffsetY),
      },
      // White paper establishes opaque base
      { input: whitePaper, blend: 'over',     left, top },
      // Design on white: multiply(255, color) = color — full fidelity
      { input: design,     blend: 'multiply', left, top },
    ])
    .png()
    .toBuffer()
}

function getPaperColor(colorTemp: 'warm' | 'cool' | 'neutral') {
  switch (colorTemp) {
    case 'warm':
      return { r: 252, g: 248, b: 242 }
    case 'cool':
      return { r: 248, g: 250, b: 252 }
    default:
      return { r: 250, g: 249, b: 246 }
  }
}

function getMockupPlacement(scenePreset?: MockupScenePreset) {
  switch (scenePreset) {
    case 'floral-flatlay':
      return {
        maxWRatio: 0.46,
        maxHRatio: 0.62,
        offsetXRatio: 0.03,
        offsetYRatio: -0.015,
        shadowPad: 12,
        shadowBlur: 22,
        shadowAlpha: 0.085,
        shadowOffsetX: 2,
        shadowOffsetY: 4,
      }
    case 'marble-eucalyptus':
    case 'invitation-suite':
    case 'modern-desk':
      return {
        maxWRatio: 0.48,
        maxHRatio: 0.64,
        offsetXRatio: 0.015,
        offsetYRatio: -0.01,
        shadowPad: 12,
        shadowBlur: 20,
        shadowAlpha: 0.08,
        shadowOffsetX: 2,
        shadowOffsetY: 4,
      }
    case 'golden-plate':
    case 'save-the-date-satin':
    case 'blush-silk':
      return {
        maxWRatio: 0.44,
        maxHRatio: 0.6,
        offsetXRatio: 0.02,
        offsetYRatio: -0.005,
        shadowPad: 11,
        shadowBlur: 20,
        shadowAlpha: 0.075,
        shadowOffsetX: 2,
        shadowOffsetY: 4,
      }
    default:
      return {
        maxWRatio: 0.5,
        maxHRatio: 0.66,
        offsetXRatio: 0,
        offsetYRatio: -0.005,
        shadowPad: 12,
        shadowBlur: 20,
        shadowAlpha: 0.08,
        shadowOffsetX: 2,
        shadowOffsetY: 4,
      }
  }
}

// Full pipeline: erase existing design on reference, then warp and place new design.
// Step 1 — composite white fill with 'over' blend: blanks out the existing content.
// Step 2 — composite warped design with 'multiply' blend: preserves surface texture.
// multiply on white = design shows exactly as-is (255 * x / 255 = x).
export async function compositeOverlay(
  designBuffer: Buffer,
  refBuffer: Buffer,
  corners: CornerPoints,
  refWidth: number,
  refHeight: number
): Promise<Buffer> {
  const [warpedPng, whiteFill] = await Promise.all([
    perspectiveWarp(designBuffer, corners, refWidth, refHeight),
    createWhiteFill(corners, refWidth, refHeight),
  ])

  // Soften the hard alpha edge so the design looks printed rather than sticker-pasted.
  // blur(0.7) softens the transparent→opaque boundary by ~1–2px without visibly
  // blurring the interior of the design at typical output sizes.
  const softWarp = await sharp(warpedPng).blur(normalizeInternalBlurSigma(0.7)).toBuffer()

  return sharp(refBuffer)
    .resize(MAX_REF_PX, MAX_REF_PX, { fit: 'inside', withoutEnlargement: true })
    .composite([
      { input: whiteFill, blend: 'over' },
      { input: softWarp, blend: 'multiply' },
    ])
    .png()
    .toBuffer()
}
