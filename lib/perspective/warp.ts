import sharp from 'sharp'
import type { CornerPoints, Point } from './homography'
import { extractRectifiedSurfaceRuntime } from './extract-runtime.js'
import { applyH, computeHomography, invertMatrix3x3, isInsideQuad } from './homography-runtime.js'
import { applySoftEdgeMask, clampShadowSigma, compositeSoftenedOverlay, type DesignBlendMode } from '../mockup/compositing'
import { normalizeInternalBlurSigma } from '../mockup/sigma'
import type { MockupScenePreset } from '../../types'

const MAX_DESIGN_PX = 1200
const MAX_REF_PX = 1500
const MIN_SURFACE_EDGE_PX = 64
const DEFAULT_PAPER_TONE = { r: 246, g: 243, b: 237, alpha: 1 }

type ExtractSurfaceOptions = {
  neutralize?: boolean
}

type CleanExtractedSurfaceOptions = {
  materialTexture?: string
  lightingDirection?: string
}

function clampEdgeSofteningSigma(value: number | undefined) {
  const normalized = normalizeInternalBlurSigma(value)
  return Math.max(0.3, Math.min(1.4, normalized))
}

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

function distance(a: Point, b: Point) {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value))
}

function clampByte(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)))
}

function mix(a: number, b: number, amount: number) {
  return a + (b - a) * clamp01(amount)
}

function pointsArrayToCorners(points: Point[]): CornerPoints {
  if (points.length !== 4) {
    throw new Error('extractSurface requires exactly 4 points ordered as topLeft, topRight, bottomRight, bottomLeft.')
  }

  return {
    topLeft: points[0],
    topRight: points[1],
    bottomRight: points[2],
    bottomLeft: points[3],
  }
}

function getSurfaceSize(corners: CornerPoints) {
  const avgWidth = (distance(corners.topLeft, corners.topRight) + distance(corners.bottomLeft, corners.bottomRight)) / 2
  const avgHeight = (distance(corners.topLeft, corners.bottomLeft) + distance(corners.topRight, corners.bottomRight)) / 2

  return {
    width: Math.max(MIN_SURFACE_EDGE_PX, Math.round(avgWidth)),
    height: Math.max(MIN_SURFACE_EDGE_PX, Math.round(avgHeight)),
  }
}

async function neutralizeSurfaceColors(buffer: Buffer) {
  return sharp(buffer)
    .flatten({ background: DEFAULT_PAPER_TONE })
    .greyscale()
    // Keep the luminance texture from the photo, but strip the old design hue.
    .normalise({ lower: 1, upper: 99 })
    .linear(1.03, -3)
    .tint({ r: 248, g: 245, b: 239 })
    .sharpen({ sigma: 1.05, m1: 1.2, m2: 2, x1: 2, y2: 10, y3: 16 })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer()
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

export async function extractSurface(
  imageBuffer: Buffer,
  points: Point[],
  options: ExtractSurfaceOptions = {}
): Promise<{
  buffer: Buffer
  width: number
  height: number
}> {
  const corners = pointsArrayToCorners(points)
  const xs = points.map((point) => point.x)
  const ys = points.map((point) => point.y)

  const metadata = await sharp(imageBuffer).rotate().metadata()
  const imageWidth = metadata.width
  const imageHeight = metadata.height

  if (!imageWidth || !imageHeight) {
    throw new Error('extractSurface could not read source image dimensions.')
  }

  const cropPadding = Math.max(
    12,
    Math.round(Math.max(
      distance(corners.topLeft, corners.topRight),
      distance(corners.bottomLeft, corners.bottomRight),
      distance(corners.topLeft, corners.bottomLeft),
      distance(corners.topRight, corners.bottomRight),
    ) * 0.08)
  )

  const left = Math.floor(Math.min(...xs) - cropPadding)
  const top = Math.floor(Math.min(...ys) - cropPadding)
  const right = Math.ceil(Math.max(...xs) + cropPadding)
  const bottom = Math.ceil(Math.max(...ys) + cropPadding)

  const extendLeft = Math.max(0, -left)
  const extendTop = Math.max(0, -top)
  const extendRight = Math.max(0, right - imageWidth)
  const extendBottom = Math.max(0, bottom - imageHeight)

  const extractedLeft = left + extendLeft
  const extractedTop = top + extendTop
  const extractedWidth = right - left
  const extractedHeight = bottom - top

  const extendedBuffer = await sharp(imageBuffer)
    .rotate()
    .ensureAlpha()
    .extend({
      top: extendTop,
      bottom: extendBottom,
      left: extendLeft,
      right: extendRight,
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .extract({
      left: extractedLeft,
      top: extractedTop,
      width: Math.max(1, extractedWidth),
      height: Math.max(1, extractedHeight),
    })
    .raw()
    .toBuffer({ resolveWithObject: true })

  const adjustedCorners: CornerPoints = {
    topLeft: {
      x: corners.topLeft.x - left,
      y: corners.topLeft.y - top,
    },
    topRight: {
      x: corners.topRight.x - left,
      y: corners.topRight.y - top,
    },
    bottomRight: {
      x: corners.bottomRight.x - left,
      y: corners.bottomRight.y - top,
    },
    bottomLeft: {
      x: corners.bottomLeft.x - left,
      y: corners.bottomLeft.y - top,
    },
  }

  const outputSize = getSurfaceSize(adjustedCorners)
  const src: Point[] = [
    adjustedCorners.topLeft,
    adjustedCorners.topRight,
    adjustedCorners.bottomRight,
    adjustedCorners.bottomLeft,
  ]
  const dst: Point[] = [
    { x: 0, y: 0 },
    { x: outputSize.width - 1, y: 0 },
    { x: outputSize.width - 1, y: outputSize.height - 1 },
    { x: 0, y: outputSize.height - 1 },
  ]

  const H = computeHomography(dst, src)
  const outData = Buffer.alloc(outputSize.width * outputSize.height * 4, 0)

  for (let y = 0; y < outputSize.height; y++) {
    for (let x = 0; x < outputSize.width; x++) {
      const { x: sx, y: sy } = applyH(H, { x, y })

      if (
        sx < 0 ||
        sy < 0 ||
        sx >= extendedBuffer.info.width ||
        sy >= extendedBuffer.info.height
      ) {
        continue
      }

      const [r, g, b, a] = bilinearSample(extendedBuffer.data, extendedBuffer.info.width, extendedBuffer.info.height, sx, sy)
      const index = (y * outputSize.width + x) * 4
      outData[index] = r
      outData[index + 1] = g
      outData[index + 2] = b
      outData[index + 3] = a
    }
  }

  const rectifiedBuffer = await sharp(outData, {
    raw: { width: outputSize.width, height: outputSize.height, channels: 4 },
  })
    .png()
    .toBuffer()

  return {
    buffer: options.neutralize === false ? rectifiedBuffer : await neutralizeSurfaceColors(rectifiedBuffer),
    width: outputSize.width,
    height: outputSize.height,
  }
}

function getMaterialCleanupProfile(materialTexture?: string, lightingDirection?: string) {
  const material = (materialTexture ?? '').toLowerCase()
  const lighting = (lightingDirection ?? '').toLowerCase()
  const isWood = /wood|timber|oak|walnut|plywood|mahogany/.test(material)
  const isCanvas = /canvas/.test(material)
  const isLinen = /linen|cotton rag|textured paper|fabric/.test(material)
  const isPaper = /paper|cardstock|matte|paperboard/.test(material) || (!isWood && !isCanvas)
  const warmLight = /warm|golden|sunset|candle|amber/.test(lighting)
  const coolLight = /cool|blue|north|overcast/.test(lighting)

  return {
    blurSigma: isWood ? 4.4 : isCanvas ? 4.8 : isLinen ? 5.2 : 5.6,
    globalNeutralize: isWood ? 0.08 : isCanvas ? 0.18 : isLinen ? 0.24 : 0.3,
    textureRetentionInMask: isWood ? 0.55 : isCanvas ? 0.4 : isLinen ? 0.28 : 0.22,
    blurColorRetention: isWood ? 0.9 : isCanvas ? 0.55 : isLinen ? 0.38 : 0.28,
    paperWarmthOffset: warmLight ? 6 : coolLight ? -4 : 0,
    likelyPaperLike: isPaper || isLinen || isCanvas,
  }
}

export async function cleanExtractedSurface(
  extractedBuffer: Buffer,
  options: CleanExtractedSurfaceOptions = {}
): Promise<{
  buffer: Buffer
  width: number
  height: number
}> {
  const profile = getMaterialCleanupProfile(options.materialTexture, options.lightingDirection)

  const { data: originalRaw, info } = await sharp(extractedBuffer)
    .flatten({ background: DEFAULT_PAPER_TONE })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const blurredRaw = await sharp(extractedBuffer)
    .flatten({ background: DEFAULT_PAPER_TONE })
    .removeAlpha()
    .blur(profile.blurSigma)
    .raw()
    .toBuffer()

  const output = Buffer.alloc(info.width * info.height * 3)

  for (let i = 0; i < originalRaw.length; i += 3) {
    const r = originalRaw[i]
    const g = originalRaw[i + 1]
    const b = originalRaw[i + 2]
    const br = blurredRaw[i]
    const bg = blurredRaw[i + 1]
    const bb = blurredRaw[i + 2]

    const luminance = r * 0.299 + g * 0.587 + b * 0.114
    const blurredLuminance = br * 0.299 + bg * 0.587 + bb * 0.114
    const saturation = (Math.max(r, g, b) - Math.min(r, g, b)) / 255
    const detailScore = clamp01((Math.abs(luminance - blurredLuminance) - 5) / 52)
    const darkInkScore = clamp01((blurredLuminance - luminance - 8) / 92)
    const colorInkScore = clamp01((saturation - (profile.likelyPaperLike ? 0.03 : 0.07)) / 0.22)
    const mask = Math.max(profile.globalNeutralize, Math.pow(Math.max(detailScore, darkInkScore, colorInkScore), 0.82))

    const paperTarget = {
      r: clampByte(blurredLuminance + 14 + profile.paperWarmthOffset),
      g: clampByte(blurredLuminance + 10 + Math.round(profile.paperWarmthOffset * 0.45)),
      b: clampByte(blurredLuminance + (profile.likelyPaperLike ? 6 : 8) - Math.round(profile.paperWarmthOffset * 0.2)),
    }

    const localColorRetention = mix(profile.blurColorRetention, profile.likelyPaperLike ? 0.08 : 0.3, mask)
    const baseR = mix(paperTarget.r, br, localColorRetention)
    const baseG = mix(paperTarget.g, bg, localColorRetention)
    const baseB = mix(paperTarget.b, bb, localColorRetention)

    const residual = Math.max(-12, Math.min(12, luminance - blurredLuminance))
    const preservedResidual = residual * mix(1, profile.textureRetentionInMask, mask)
    let outR = mix(r, baseR + preservedResidual, mask)
    let outG = mix(g, baseG + preservedResidual, mask)
    let outB = mix(b, baseB + preservedResidual, mask)

    if (profile.likelyPaperLike) {
      const localNeutralStrength = Math.max(mask, profile.globalNeutralize)
      const mono = (outR + outG + outB) / 3
      outR = mix(outR, mono + 5 + profile.paperWarmthOffset * 0.45, localNeutralStrength * 0.78)
      outG = mix(outG, mono + 2 + profile.paperWarmthOffset * 0.22, localNeutralStrength * 0.78)
      outB = mix(outB, mono - 2 - profile.paperWarmthOffset * 0.12, localNeutralStrength * 0.78)
    }

    output[i] = clampByte(outR)
    output[i + 1] = clampByte(outG)
    output[i + 2] = clampByte(outB)
  }

  const { data, info: cleanedInfo } = await sharp(output, {
    raw: { width: info.width, height: info.height, channels: 3 },
  })
    .modulate({
      brightness: profile.likelyPaperLike ? 1.012 : 1.005,
      saturation: profile.likelyPaperLike ? 0.9 : 0.98,
    })
    .sharpen({
      sigma: profile.likelyPaperLike ? 0.95 : 0.8,
      m1: 1.15,
      m2: 2.2,
      x1: 2,
      y2: 10,
      y3: 14,
    })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer({ resolveWithObject: true })

  return {
    buffer: data,
    width: cleanedInfo.width,
    height: cleanedInfo.height,
  }
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

export async function extractRectifiedSurface(
  refBuffer: Buffer,
  corners: CornerPoints,
  refWidth: number,
  refHeight: number,
  targetLongEdge: number
): Promise<{
  buffer: Buffer
  width: number
  height: number
}> {
  return extractRectifiedSurfaceRuntime(refBuffer, corners, refWidth, refHeight, targetLongEdge)
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
  const edgeSoftnessSigma = clampEdgeSofteningSigma(sigma)

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
  const BG_BLEND = 0.50  // 50% scene color, 50% white
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

  const flattenedDesign = await sharp(designBuffer)
    .resize(maxW, maxH, { fit: 'inside', withoutEnlargement: false })
    .flatten({ background: paperColor })
    .rotate(rotationDeg, { background: paperColor })
    // Lift brightness slightly and desaturate to match ambient background mood,
    // then tint toward the background's dominant warmth/coolness so the card
    // feels embedded rather than pasted.
    .modulate({ brightness: 0.97, saturation: 0.92 })
    .tint(tintColor)
    // Color temperature matching: nudge RGB channels to prevent the card looking
    // "too blue/cool" against a warm AI background (or vice versa).
    .recomb(getColorTempMatrix(colorTemp))
    .png()
    .toBuffer()

  const design = await applySoftEdgeMask(flattenedDesign, edgeSoftnessSigma)

  const { width: dW, height: dH } = await sharp(design).metadata() as { width: number; height: number }

  const left = Math.round((bgW - dW) / 2 + bgW * placement.offsetXRatio)
  const top  = Math.round((bgH - dH) / 2 + bgH * placement.offsetYRatio)

  // Paper base sits under the artwork so any transparent edges read as a physical sheet.
  const whitePaperBase = await sharp({
    create: { width: dW, height: dH, channels: 3, background: paperColor },
  }).png().toBuffer()
  const whitePaper = await applySoftEdgeMask(whitePaperBase, edgeSoftnessSigma)

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
      `<rect x="${CONTACT_PAD}" y="${CONTACT_PAD}" width="${dW}" height="${dH}" fill="rgba(28,20,14,0.10)"/>` +
      `</svg>`
    ))
      .blur(clampShadowSigma(CONTACT_BLUR))
      .png()
      .toBuffer(),
    sharp(Buffer.from(
      `<svg width="${dW + shadowOffsetX + CAST_PAD}" height="${dH + shadowOffsetY + CAST_PAD}" xmlns="http://www.w3.org/2000/svg">` +
      `<rect x="${shadowOffsetX}" y="${shadowOffsetY}" width="${dW}" height="${dH}" fill="rgba(22,16,10,0.06)"/>` +
      `</svg>`
    ))
      .blur(clampShadowSigma(CAST_BLUR))
      .png()
      .toBuffer(),
  ])

  // Dark edge strip: same card dimensions, offset 3px down-right, sits between shadow
  // and white paper so only a 3px sliver peeks out — reads as heavy cardstock thickness.
  const EDGE_PX = 2
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

  // Corner-weighted border reveal: background elements heavily overlap card
  // corners (like real props placed on physical cards), taper toward edges.
  const CORNER_OVERLAP = 105  // px radial distance from each corner
  const EDGE_OVERLAP   = 42   // px from each straight edge

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
      const dL = x - left
      const dR = left + dW - 1 - x
      const dT = y - top
      const dB = top + dH - 1 - y

      // Radial distance from nearest corner
      const minCornerDist = Math.min(
        Math.sqrt(dL * dL + dT * dT),  // TL
        Math.sqrt(dR * dR + dT * dT),  // TR
        Math.sqrt(dL * dL + dB * dB),  // BL
        Math.sqrt(dR * dR + dB * dB),  // BR
      )
      // Linear distance from nearest edge
      const edgeDist = Math.min(dL, dR, dT, dB)

      const cornerAlpha = minCornerDist < CORNER_OVERLAP
        ? 185 * Math.pow(1 - minCornerDist / CORNER_OVERLAP, 0.8)
        : 0
      const edgeAlpha = edgeDist < EDGE_OVERLAP
        ? 110 * Math.pow(1 - edgeDist / EDGE_OVERLAP, 1.15)
        : 0

      const alpha = Math.min(255, Math.round(Math.max(cornerAlpha, edgeAlpha)))
      if (alpha === 0) continue

      const i = (y * bgRawW + x) * 4
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
      { input: design,        blend: placement.designBlendMode, left, top },
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

// Generates a scene background with a clean white paper placeholder at the
// card position — no design, no shadow, no grain. User pastes their design
// in Photoshop afterward. Border reveal still runs so scene elements naturally
// overlap the paper edges just like in the full mockup flow.
export async function compositeTemplateOnly(
  designBuffer: Buffer,
  backgroundBuffer: Buffer,
  scenePreset?: MockupScenePreset,
): Promise<Buffer> {
  const bgMeta = await sharp(backgroundBuffer).metadata()
  const bgW = bgMeta.width!
  const bgH = bgMeta.height!

  const placement = getMockupPlacement(scenePreset)
  const maxW = Math.round(bgW * placement.maxWRatio)
  const maxH = Math.round(bgH * placement.maxHRatio)

  const sizedDesign = await sharp(designBuffer)
    .resize(maxW, maxH, { fit: 'inside', withoutEnlargement: false })
    .png()
    .toBuffer()
  const { width: dW, height: dH } = await sharp(sizedDesign).metadata() as
    { width: number; height: number }

  const left = Math.round((bgW - dW) / 2 + bgW * placement.offsetXRatio)
  const top  = Math.round((bgH - dH) / 2 + bgH * placement.offsetYRatio)

  const whitePaper = await sharp({
    create: { width: dW, height: dH, channels: 3, background: { r: 255, g: 255, b: 255 } },
  }).png().toBuffer()
  const softWhitePaper = await applySoftEdgeMask(whitePaper, 0.45)

  const CORNER_OVERLAP = 105
  const EDGE_OVERLAP   = 42

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
      const dL = x - left
      const dR = left + dW - 1 - x
      const dT = y - top
      const dB = top + dH - 1 - y

      const minCornerDist = Math.min(
        Math.sqrt(dL * dL + dT * dT),
        Math.sqrt(dR * dR + dT * dT),
        Math.sqrt(dL * dL + dB * dB),
        Math.sqrt(dR * dR + dB * dB),
      )
      const edgeDist = Math.min(dL, dR, dT, dB)

      const cornerAlpha = minCornerDist < CORNER_OVERLAP
        ? 185 * Math.pow(1 - minCornerDist / CORNER_OVERLAP, 0.8) : 0
      const edgeAlpha = edgeDist < EDGE_OVERLAP
        ? 110 * Math.pow(1 - edgeDist / EDGE_OVERLAP, 1.15) : 0

      const alpha = Math.min(255, Math.round(Math.max(cornerAlpha, edgeAlpha)))
      if (alpha === 0) continue

      const i = (y * bgRawW + x) * 4
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
      { input: softWhitePaper, blend: 'over', left, top },
      { input: borderBuffer,   blend: 'over', left: 0, top: 0 },
    ])
    .png()
    .toBuffer()
}

function getCardTint(colorTemp: 'warm' | 'cool' | 'neutral') {
  switch (colorTemp) {
    case 'warm':  return { r: 246, g: 232, b: 208 }
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
    case 'warm': return [[1.09, 0, 0], [0, 1.03, 0], [0, 0, 0.89]]
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
        maxWRatio: 0.36,
        maxHRatio: 0.50,
        offsetXRatio: -0.02,
        offsetYRatio: 0.01,
        shadowPad: 12,
        shadowBlur: 8,
        shadowAlpha: 0.28,
        shadowOffsetX: 12,
        shadowOffsetY: 12,
        designBlendMode: 'over' as const,
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
        designBlendMode: scenePreset === 'classic-black-tie' ? 'multiply' as const : 'over' as const,
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
        designBlendMode: scenePreset === 'earthy-terracotta' || scenePreset === 'vintage-silk' ? 'multiply' as const : 'over' as const,
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
        designBlendMode: 'over' as const,
      }
  }
}

// Full pipeline: erase existing design on reference, then warp and place new design.
// Step 1 — composite a softly masked white fill so the previous artwork is removed
// without creating a hard white sticker edge.
// Step 2 — composite the warped design with adaptive blend mode:
// default 'over' for fidelity, optional 'multiply' for texture-heavy scenes.
export async function compositeOverlay(
  designBuffer: Buffer,
  refBuffer: Buffer,
  corners: CornerPoints,
  refWidth: number,
  refHeight: number,
  options?: {
    designBlendMode?: DesignBlendMode
    edgeSoftnessSigma?: number
  }
): Promise<Buffer> {
  const [warpedPng, whiteFill] = await Promise.all([
    perspectiveWarp(designBuffer, corners, refWidth, refHeight),
    createWhiteFill(corners, refWidth, refHeight),
  ])

  return compositeSoftenedOverlay(refBuffer, whiteFill, warpedPng, {
    designBlendMode: options?.designBlendMode ?? 'over',
    edgeSoftnessSigma: options?.edgeSoftnessSigma ?? 0.45,
    resizeToFit: { width: MAX_REF_PX, height: MAX_REF_PX },
  })
}
