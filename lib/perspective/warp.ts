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
  sigma?: number,
  foregroundBuffer?: Buffer  // Optional transparent-PNG decorator (leaf, ribbon, etc.)
                             // composited above the card to simulate physical depth.
                             // If omitted, no foreground layer is added.
): Promise<Buffer> {
  const bgMeta = await sharp(backgroundBuffer).metadata()
  const bgW = bgMeta.width!
  const bgH = bgMeta.height!

  const placement = getMockupPlacement(scenePreset)
  const maxW = Math.round(bgW * placement.maxWRatio)
  const maxH = Math.round(bgH * placement.maxHRatio)
  const designBlurSigma = normalizeInternalBlurSigma(sigma)

  // Sample the background at the estimated card position to derive a scene-matched
  // paper color. Real printed card on a warm surface picks up ambient reflected light —
  // it never looks as white as a monitor white point.
  // Formula: 85% white + 15% scene ambient = card white that "belongs" to the scene.
  const estLeft = Math.round((bgW - maxW) / 2 + bgW * placement.offsetXRatio)
  const estTop  = Math.round((bgH - maxH) / 2 + bgH * placement.offsetYRatio)
  const { data: localSample } = await sharp(backgroundBuffer)
    .extract({
      left:   Math.max(0, Math.min(bgW - 20, estLeft  + Math.round(maxW * 0.25))),
      top:    Math.max(0, Math.min(bgH - 20, estTop   + Math.round(maxH * 0.25))),
      width:  Math.min(Math.round(maxW * 0.5), bgW - Math.max(0, estLeft + Math.round(maxW * 0.25))),
      height: Math.min(Math.round(maxH * 0.5), bgH - Math.max(0, estTop  + Math.round(maxH * 0.25))),
    })
    .resize(20, 20, { fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  let rSum = 0, gSum = 0, bSum = 0
  const localPixels = localSample.length / 3
  for (let i = 0; i < localSample.length; i += 3) {
    rSum += localSample[i]; gSum += localSample[i + 1]; bSum += localSample[i + 2]
  }
  const BG_BLEND = 0.15  // 15% scene color, 85% white
  const localPaperColor = {
    r: Math.round((1 - BG_BLEND) * 255 + BG_BLEND * (rSum / localPixels)),
    g: Math.round((1 - BG_BLEND) * 255 + BG_BLEND * (gSum / localPixels)),
    b: Math.round((1 - BG_BLEND) * 255 + BG_BLEND * (bSum / localPixels)),
  }

  // Flatten to an off-white paper tone, resize, then slightly soften the edge
  // so the card integrates without a harsh digital cutout.
  const paperColor = localPaperColor  // scene-matched, replaces static getPaperColor()
  const tintColor  = getCardTint(colorTemp)

  // Guaranteed tilt: ±0.5°–1.0° so the card never sits at perfect 0° alignment.
  // Math.random() * 2 - 1 can produce values very close to 0 — this version
  // always picks a magnitude in [0.5, 1.0] and randomly flips sign.
  const rotationSign = Math.random() > 0.5 ? 1 : -1
  const rotationDeg  = rotationSign * (Math.random() * 0.5 + 0.5)

  const design = await sharp(designBuffer)
    .resize(maxW, maxH, { fit: 'inside', withoutEnlargement: false })
    .flatten({ background: paperColor })
    .rotate(rotationDeg, { background: paperColor })
    // Lift brightness slightly and desaturate to match ambient background mood,
    // then tint toward the background's dominant warmth/coolness so the card
    // feels embedded rather than pasted.
    .modulate({ brightness: 0.97, saturation: 0.88 })
    .tint(tintColor)
    // Color temperature matching: nudge RGB channels to prevent the card looking
    // "too blue/cool" against a warm AI background (or vice versa).
    .recomb(getColorTempMatrix(colorTemp))
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

  // Two-layer shadow system using SVG rectangles — NOT card content.
  //
  // Root causes of content-derived shadows:
  //   1. greyscale+negate on design leaks the card's internal motif into shadow shape.
  //   2. Same-size buffer at same position → blur doesn't extend outside card →
  //      whitePaper (over) completely hides ambient shadow → zero visible halo.
  //   3. multiply×multiply stacking over-darkens bottom-right (0.84×0.57≈0.48×bg).
  //
  // SVG rectangles fix all three:
  //   • Uniform shape — shadow matches card outline, not design content.
  //   • Ambient canvas = card + 2×blur padding on all sides → blur spreads outside card.
  //   • Alpha-controlled 'over' blend — no multiplicative stacking.
  const shadowOffsetX = placement.shadowOffsetX
  const shadowOffsetY = placement.shadowOffsetY

  // Dual-shadow system using rgba + 'over' blend — visible on light backgrounds.
  // Previous multiply+gray approach: gray=153 → only 40% darken on white → invisible.
  // rgba 'over' approach: alpha directly controls opacity, works on any background tone.
  //
  // Layer A — Contact shadow: tight halo anchored to card edges, 42% opacity dark brown.
  //   Canvas = card + CONTACT_PAD×2 on each side → blur decays fully before canvas edge.
  //   Composited at (left-CONTACT_PAD, top-CONTACT_PAD).
  //
  // Layer B — Cast shadow: soft directional blur, 26% opacity, shifted bottom-right.
  //   Pre-shifted rect → shadow lands at (left+shadowOffsetX, top+shadowOffsetY).
  //   Composited at (left, top) so offset is baked into SVG coordinate space.
  const CONTACT_BLUR = 6
  const CONTACT_PAD  = 20
  const CAST_BLUR    = 12
  const CAST_PAD     = 40

  const [contactShadow, castShadow] = await Promise.all([
    sharp(Buffer.from(
      `<svg width="${dW + CONTACT_PAD * 2}" height="${dH + CONTACT_PAD * 2}" xmlns="http://www.w3.org/2000/svg">` +
      `<rect x="${CONTACT_PAD}" y="${CONTACT_PAD}" width="${dW}" height="${dH}" fill="rgba(25,18,12,0.42)"/>` +
      `</svg>`
    ))
      .blur(normalizeInternalBlurSigma(CONTACT_BLUR))
      .png()
      .toBuffer(),
    sharp(Buffer.from(
      `<svg width="${dW + shadowOffsetX + CAST_PAD}" height="${dH + shadowOffsetY + CAST_PAD}" xmlns="http://www.w3.org/2000/svg">` +
      `<rect x="${shadowOffsetX}" y="${shadowOffsetY}" width="${dW}" height="${dH}" fill="rgba(20,14,8,0.26)"/>` +
      `</svg>`
    ))
      .blur(normalizeInternalBlurSigma(CAST_BLUR))
      .png()
      .toBuffer(),
  ])

  // Dark edge strip: same card dimensions, offset 3px down-right, sits between shadow
  // and white paper so only a 3px sliver peeks out — reads as heavy cardstock thickness.
  const EDGE_PX = 3
  const darkEdge = await sharp({
    create: { width: dW, height: dH, channels: 3, background: getDarkEdgeColor(colorTemp) },
  }).png().toBuffer()

  // Thin inner highlight on card edges — simulates physical paper lekukan/edge lift.
  // Screen blend over white is additive: brightens the 1-2px border slightly.
  // Top + left edge highlight only — simulates light source from top-left.
  // All-4-sides rect stroke was physically incorrect: bottom/right edges face away from light.
  const edgeGlowSvg = Buffer.from(
    `<svg width="${dW}" height="${dH}" xmlns="http://www.w3.org/2000/svg">` +
    `<line x1="0" y1="0.75" x2="${dW}" y2="0.75" stroke="rgba(255,255,255,0.60)" stroke-width="1.5"/>` +
    `<line x1="0.75" y1="0" x2="0.75" y2="${dH}" stroke="rgba(255,255,255,0.60)" stroke-width="1.5"/>` +
    `</svg>`
  )
  const edgeGlow = await sharp(edgeGlowSvg).png().toBuffer()

  // Grain overlay — measure background luminance variance from a downsampled raw
  // buffer (avoids .statistics() which is absent from this Sharp type version).
  // Card grain = ~40% of bg stdev, clamped 4–18: visible but subordinate.
  const { data: bgSample } = await sharp(backgroundBuffer)
    .resize(64, 64, { fit: 'inside' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  let lumSum = 0, lumSumSq = 0
  const pixelCount = bgSample.length / 3
  for (let i = 0; i < bgSample.length; i += 3) {
    const lum = bgSample[i] * 0.299 + bgSample[i + 1] * 0.587 + bgSample[i + 2] * 0.114
    lumSum += lum
    lumSumSq += lum * lum
  }
  const bgMean = lumSum / pixelCount
  const bgStdev = Math.sqrt(Math.max(0, lumSumSq / pixelCount - bgMean * bgMean))
  const grainMag = Math.max(4, Math.min(18, Math.round(bgStdev * 0.4)))

  const grainData = Buffer.alloc(dW * dH * 4)
  for (let i = 0; i < grainData.length; i += 4) {
    const v = 128 + Math.round((Math.random() - 0.5) * grainMag * 2)
    grainData[i] = grainData[i + 1] = grainData[i + 2] = Math.max(0, Math.min(255, v))
    grainData[i + 3] = 18  // ~7% opacity — grain felt not seen
  }
  const grainBuffer = await sharp(grainData, {
    raw: { width: dW, height: dH, channels: 4 },
  }).png().toBuffer()

  // Border reveal: restore original background pixels near card edges with a linear
  // alpha fade (215→0 over EDGE_OVERLAP px inward). Scene flowers/petals that the
  // AI placed in the center of the background image will now bleed over card borders,
  // creating natural physical depth without a separate foreground cutout.
  const EDGE_OVERLAP = 35
  const bgRawResult = await sharp(backgroundBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const bgRawData = bgRawResult.data
  const bgRawW    = bgRawResult.info.width
  const bgRawH    = bgRawResult.info.height

  const borderData = Buffer.alloc(bgRawW * bgRawH * 4, 0)
  const bLeft   = Math.max(0, left)
  const bTop    = Math.max(0, top)
  const bRight  = Math.min(bgRawW, left + dW)
  const bBottom = Math.min(bgRawH, top + dH)

  for (let y = bTop; y < bBottom; y++) {
    for (let x = bLeft; x < bRight; x++) {
      const distX = Math.min(x - left, left + dW - 1 - x)
      const distY = Math.min(y - top,  top  + dH - 1 - y)
      const dist  = Math.min(distX, distY)
      if (dist >= EDGE_OVERLAP) continue
      const t     = dist / EDGE_OVERLAP
      const alpha = Math.round(215 * (1 - t))
      const i     = (y * bgRawW + x) * 4
      borderData[i]     = bgRawData[i]
      borderData[i + 1] = bgRawData[i + 1]
      borderData[i + 2] = bgRawData[i + 2]
      borderData[i + 3] = alpha
    }
  }
  const borderBuffer = await sharp(borderData, {
    raw: { width: bgRawW, height: bgRawH, channels: 4 },
  }).png().toBuffer()

  return sharp(backgroundBuffer)
    .composite([
      // Cast shadow: soft directional blur, pre-shifted rect lands at (left+offsetX, top+offsetY)
      { input: castShadow,    blend: 'over', left: Math.max(0, left),                top: Math.max(0, top) },
      { input: contactShadow, blend: 'over', left: Math.max(0, left - CONTACT_PAD), top: Math.max(0, top - CONTACT_PAD) },
      // Dark edge (cardstock thickness): 3px sliver peeks below-right
      { input: darkEdge,      blend: 'over',     left: left + EDGE_PX,       top: top + EDGE_PX },
      // White paper establishes opaque base
      { input: whitePaper,    blend: 'over',     left, top },
      // Design on white: multiply(255, color) = color — full fidelity
      { input: design,        blend: 'multiply', left, top },
      // Paper edge highlight: thin inner glow for physical paper feel
      { input: edgeGlow,      blend: 'screen',   left, top },
      // Grain overlay: ~7% opacity random noise scaled to background texture level
      { input: grainBuffer,   blend: 'overlay',  left, top },
      // Border reveal: scene elements bleed over card edges for natural depth
      { input: borderBuffer,  blend: 'over',     left: 0, top: 0 },
      // Foreground decorator (optional): transparent-PNG cutout (leaf, ribbon, etc.)
      // overlaps top-left card corner — creates physical depth "sandwich" effect.
      ...(foregroundBuffer ? [{ input: foregroundBuffer, blend: 'over' as const, left: Math.max(0, left - 20), top: Math.max(0, top - 15) }] : []),
    ])
    .png()
    .toBuffer()
}


function getCardTint(colorTemp: 'warm' | 'cool' | 'neutral') {
  switch (colorTemp) {
    case 'warm':  return { r: 253, g: 247, b: 232 }
    case 'cool':  return { r: 242, g: 246, b: 252 }
    default:      return { r: 250, g: 249, b: 246 }
  }
}

// Dark compressed edge that peeks out from behind the card — simulates 300gsm cardstock.
// Color is warm-tinted dark grey (not black) so it reads as paper, not a drop shadow.
// RGB channel matrix for color temperature correction on the card surface.
// Warm background: boost R, slight G, pull B so card doesn't look too cool/blue.
// Cool background: pull R slightly, hold G, boost B for consistent temperature.
// Neutral: identity — no color shift.
type Matrix3 = [[number,number,number],[number,number,number],[number,number,number]]

function getColorTempMatrix(colorTemp: 'warm' | 'cool' | 'neutral'): Matrix3 {
  switch (colorTemp) {
    case 'warm': return [[1.05, 0, 0], [0, 1.02, 0], [0, 0, 0.95]]
    case 'cool': return [[0.97, 0, 0], [0, 1.00, 0], [0, 0, 1.04]]
    default:     return [[1.00, 0, 0], [0, 1.00, 0], [0, 0, 1.00]]
  }
}

function getDarkEdgeColor(colorTemp: 'warm' | 'cool' | 'neutral') {
  switch (colorTemp) {
    case 'warm':  return { r: 138, g: 120, b: 105 }
    case 'cool':  return { r: 118, g: 122, b: 132 }
    default:      return { r: 128, g: 118, b: 112 }
  }
}

function getMockupPlacement(scenePreset?: MockupScenePreset) {
  switch (scenePreset) {
    case 'floral-flatlay':
    case 'organic-eucalyptus':
      return {
        maxWRatio: 0.46,
        maxHRatio: 0.62,
        offsetXRatio: 0.03,
        offsetYRatio: -0.015,
        shadowPad: 12,
        shadowBlur: 8,
        shadowAlpha: 0.28,
        shadowOffsetX: 12,
        shadowOffsetY: 12,
      }
    case 'marble-eucalyptus':
    case 'invitation-suite':
    case 'modern-desk':
    case 'minimal-travertine':
    case 'classic-black-tie':
      return {
        maxWRatio: 0.48,
        maxHRatio: 0.64,
        offsetXRatio: 0.015,
        offsetYRatio: -0.01,
        shadowPad: 12,
        shadowBlur: 8,
        shadowAlpha: 0.28,
        shadowOffsetX: 12,
        shadowOffsetY: 12,
      }
    case 'golden-plate':
    case 'save-the-date-satin':
    case 'blush-silk':
    case 'vintage-silk':
    case 'earthy-terracotta':
      return {
        maxWRatio: 0.44,
        maxHRatio: 0.6,
        offsetXRatio: 0.02,
        offsetYRatio: -0.005,
        shadowPad: 11,
        shadowBlur: 8,
        shadowAlpha: 0.28,
        shadowOffsetX: 12,
        shadowOffsetY: 12,
      }
    default:
      return {
        maxWRatio: 0.5,
        maxHRatio: 0.66,
        offsetXRatio: 0,
        offsetYRatio: -0.005,
        shadowPad: 12,
        shadowBlur: 8,
        shadowAlpha: 0.28,
        shadowOffsetX: 12,
        shadowOffsetY: 12,
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
