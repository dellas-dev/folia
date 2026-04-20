import sharp from 'sharp'
import {
  type CornerPoints,
  type Point,
  applyH,
  computeHomography,
  invertMatrix3x3,
  isInsideQuad,
} from './homography'

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

// Centers the design on a generated background with realistic blending:
// 1. Color temperature tint to match the background
// 2. Programmatic paper grain (soft-light, ~9% opacity)
// 3. 0.4px edge blur to soften hard digital edges
// 4. Two-layer drop shadow (outer wide + inner tight)
// 5. Multiply blend so white areas show surface texture through
export async function compositeDesignCentered(
  designBuffer: Buffer,
  backgroundBuffer: Buffer,
  colorTemp: 'warm' | 'cool' | 'neutral' = 'neutral'
): Promise<Buffer> {
  const bgMeta = await sharp(backgroundBuffer).metadata()
  const bgW = bgMeta.width!
  const bgH = bgMeta.height!

  const maxW = Math.round(bgW * 0.56)
  const maxH = Math.round(bgH * 0.68)

  // Step 1 — Flatten + resize design
  let design = await sharp(designBuffer)
    .resize(maxW, maxH, { fit: 'inside', withoutEnlargement: false })
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .png()
    .toBuffer()

  const dMeta = await sharp(design).metadata()
  const dW = dMeta.width!
  const dH = dMeta.height!

  // Step 2 — Color temperature tint (very subtle: ~5% opacity overlay)
  const TINT: Record<'warm' | 'cool' | 'neutral', { r: number; g: number; b: number; alpha: number }> = {
    warm:    { r: 255, g: 210, b: 140, alpha: 13 },
    cool:    { r: 140, g: 195, b: 255, alpha: 13 },
    neutral: { r: 128, g: 128, b: 128, alpha: 0  },
  }
  const tintColor = TINT[colorTemp]
  if (tintColor.alpha > 0) {
    const tintLayer = await sharp({
      create: { width: dW, height: dH, channels: 4, background: tintColor },
    }).png().toBuffer()
    design = await sharp(design)
      .composite([{ input: tintLayer, blend: 'over' }])
      .png()
      .toBuffer()
  }

  // Step 3 — Paper grain texture (programmatic noise, soft-light blend)
  const grainData = Buffer.alloc(dW * dH * 4)
  for (let i = 0; i < dW * dH; i++) {
    const v = 128 + Math.round((Math.random() - 0.5) * 52)
    grainData[i * 4]     = v
    grainData[i * 4 + 1] = v
    grainData[i * 4 + 2] = v
    grainData[i * 4 + 3] = 23  // ~9% opacity
  }
  const grainBuf = await sharp(grainData, {
    raw: { width: dW, height: dH, channels: 4 },
  }).png().toBuffer()

  design = await sharp(design)
    .composite([{ input: grainBuf, blend: 'soft-light' }])
    .png()
    .toBuffer()

  // Step 4 — Edge blur: softens hard digital pixel boundary by ~1px
  design = await sharp(design).blur(0.4).png().toBuffer()

  // Step 5 — Position: centered, shifted slightly above vertical midpoint
  const left = Math.round((bgW - dW) / 2)
  const top  = Math.round((bgH - dH) / 2 - dH * 0.04)

  // Step 6 — Shadow layers (outer wide → inner tight)
  const outerPad = 40
  const outerShadow = await sharp({
    create: { width: dW + outerPad * 2, height: dH + outerPad * 2, channels: 4,
              background: { r: 8, g: 4, b: 0, alpha: 32 } },
  }).blur(24).png().toBuffer()

  const innerPad = 18
  const innerShadow = await sharp({
    create: { width: dW + innerPad * 2, height: dH + innerPad * 2, channels: 4,
              background: { r: 18, g: 10, b: 2, alpha: 58 } },
  }).blur(11).png().toBuffer()

  // Step 7 — Final composite
  return sharp(backgroundBuffer)
    .composite([
      {
        input: outerShadow, blend: 'over',
        left: Math.max(0, left - outerPad + 8),
        top:  Math.max(0, top  - outerPad + 14),
      },
      {
        input: innerShadow, blend: 'over',
        left: Math.max(0, left - innerPad + 4),
        top:  Math.max(0, top  - innerPad + 8),
      },
      {
        input: design, blend: 'multiply',
        left,
        top,
      },
    ])
    .png()
    .toBuffer()
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
  const softWarp = await sharp(warpedPng).blur(0.7).toBuffer()

  return sharp(refBuffer)
    .resize(MAX_REF_PX, MAX_REF_PX, { fit: 'inside', withoutEnlargement: true })
    .composite([
      { input: whiteFill, blend: 'over' },
      { input: softWarp, blend: 'multiply' },
    ])
    .png()
    .toBuffer()
}
