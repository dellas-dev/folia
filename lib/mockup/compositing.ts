import sharp from 'sharp'

const MIN_SAFE_SIGMA = 0.3
const MAX_SAFE_SIGMA = 1000
const DEFAULT_SIGMA = MIN_SAFE_SIGMA

export type DesignBlendMode = 'over' | 'multiply'
type ExtractFocusRegion = { left: number; top: number; width: number; height: number }

function normalizeInternalBlurSigma(value: number | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_SIGMA
  }

  return Math.min(MAX_SAFE_SIGMA, Math.max(MIN_SAFE_SIGMA, value))
}

export function clampShadowSigma(value: number) {
  return normalizeInternalBlurSigma(Math.max(MIN_SAFE_SIGMA, value))
}

function clampEdgeSofteningSigma(value: number | undefined) {
  const normalized = normalizeInternalBlurSigma(value)
  return Math.max(MIN_SAFE_SIGMA, Math.min(1.4, normalized))
}

function getEdgeInset(width: number, height: number, sigma: number) {
  const requestedInset = Math.round(sigma * 8 + 2)
  const maxInset = Math.max(1, Math.min(Math.floor(width / 6), Math.floor(height / 6)))
  return Math.max(1, Math.min(requestedInset, maxInset))
}

function getEdgeMaskBlurSigma(sigma: number) {
  return clampShadowSigma(Math.max(0.45, sigma * 2.1))
}

async function createSoftEdgeMask(width: number, height: number, sigma: number): Promise<Buffer> {
  const inset = getEdgeInset(width, height, sigma)

  return sharp(Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">` +
    `<rect x="${inset}" y="${inset}" width="${Math.max(1, width - inset * 2)}" height="${Math.max(1, height - inset * 2)}" fill="white"/>` +
    `</svg>`
  ))
    .blur(getEdgeMaskBlurSigma(sigma))
    .png()
    .toBuffer()
}

export async function applySoftEdgeMask(imageBuffer: Buffer, sigma: number | undefined): Promise<Buffer> {
  const softenedSigma = clampEdgeSofteningSigma(sigma)
  const metadata = await sharp(imageBuffer).ensureAlpha().metadata()
  const width = metadata.width ?? 0
  const height = metadata.height ?? 0

  if (width <= 0 || height <= 0) {
    return sharp(imageBuffer).ensureAlpha().png().toBuffer()
  }

  const mask = await createSoftEdgeMask(width, height, softenedSigma)

  return sharp(imageBuffer)
    .ensureAlpha()
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer()
}

export async function compositeSoftenedOverlay(
  referenceBuffer: Buffer,
  whiteFillBuffer: Buffer,
  designBuffer: Buffer,
  options?: {
    designBlendMode?: DesignBlendMode
    edgeSoftnessSigma?: number
    resizeToFit?: { width: number; height: number }
  }
) {
  const softSigma = options?.edgeSoftnessSigma ?? 0.45
  const [softWhiteFill, softDesign] = await Promise.all([
    applySoftEdgeMask(whiteFillBuffer, softSigma),
    applySoftEdgeMask(designBuffer, softSigma),
  ])

  let pipeline = sharp(referenceBuffer)
  if (options?.resizeToFit) {
    pipeline = pipeline.resize(options.resizeToFit.width, options.resizeToFit.height, {
      fit: 'inside',
      withoutEnlargement: true,
    })
  }

  return pipeline
    .composite([
      { input: softWhiteFill, blend: 'over' },
      { input: softDesign, blend: options?.designBlendMode ?? 'over' },
    ])
    .png()
    .toBuffer()
}

function clampExtractLongEdge(value: number) {
  return Math.max(1024, Math.min(4096, Math.round(value)))
}

function getExtractScaleFactor(width: number, height: number, targetLongEdge: number) {
  const sourceLongEdge = Math.max(width, height)
  if (sourceLongEdge <= 0) return 1
  return targetLongEdge / sourceLongEdge
}

function getExtractSharpenConfig(scaleFactor: number) {
  if (scaleFactor >= 6) {
    return { sigma: 1.35, m1: 1.7, m2: 3, x1: 2, y2: 16, y3: 24 }
  }

  if (scaleFactor >= 3) {
    return { sigma: 1.22, m1: 1.5, m2: 2.7, x1: 2, y2: 14, y3: 22 }
  }

  return { sigma: 1.1, m1: 1.3, m2: 2.4, x1: 2, y2: 10, y3: 18 }
}

function getExtractLinearAdjustments(scaleFactor: number) {
  if (scaleFactor >= 6) {
    return { a: 1.08, b: -6 }
  }

  if (scaleFactor >= 3) {
    return { a: 1.05, b: -4 }
  }

  return { a: 1.02, b: -2 }
}

function getFocusRegionSharpenConfig(scaleFactor: number) {
  if (scaleFactor >= 6) {
    return { sigma: 1.55, m1: 1.9, m2: 3.2, x1: 2, y2: 18, y3: 26 }
  }

  if (scaleFactor >= 3) {
    return { sigma: 1.38, m1: 1.7, m2: 3, x1: 2, y2: 16, y3: 24 }
  }

  return { sigma: 1.24, m1: 1.45, m2: 2.6, x1: 2, y2: 12, y3: 20 }
}

function clampExtractFocusRegion(region: ExtractFocusRegion, width: number, height: number): ExtractFocusRegion {
  const left = Math.max(0, Math.min(width - 1, Math.round(region.left)))
  const top = Math.max(0, Math.min(height - 1, Math.round(region.top)))
  const maxWidth = Math.max(1, width - left)
  const maxHeight = Math.max(1, height - top)

  return {
    left,
    top,
    width: Math.max(1, Math.min(maxWidth, Math.round(region.width))),
    height: Math.max(1, Math.min(maxHeight, Math.round(region.height))),
  }
}

function scaleExtractFocusRegion(
  region: ExtractFocusRegion,
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number
): ExtractFocusRegion {
  return clampExtractFocusRegion({
    left: (region.left / sourceWidth) * targetWidth,
    top: (region.top / sourceHeight) * targetHeight,
    width: (region.width / sourceWidth) * targetWidth,
    height: (region.height / sourceHeight) * targetHeight,
  }, targetWidth, targetHeight)
}

async function detectExtractFocusRegion(referenceBuffer: Buffer): Promise<{
  region: ExtractFocusRegion
  width: number
  height: number
} | null> {
  const { data, info } = await sharp(referenceBuffer)
    .rotate()
    .removeAlpha()
    .grayscale()
    .blur(0.55)
    .resize({
      width: 256,
      height: 256,
      fit: 'inside',
      withoutEnlargement: false,
      kernel: sharp.kernel.lanczos3,
    })
    .raw()
    .toBuffer({ resolveWithObject: true })

  const width = info.width
  const height = info.height
  if (!width || !height) return null

  const minX = Math.floor(width * 0.1)
  const maxX = Math.ceil(width * 0.9)
  const minY = Math.floor(height * 0.08)
  const maxY = Math.ceil(height * 0.94)
  const threshold = 214
  const visited = new Uint8Array(width * height)
  let best: { region: ExtractFocusRegion; score: number } | null = null

  for (let y = minY; y < maxY; y += 1) {
    for (let x = minX; x < maxX; x += 1) {
      const index = y * width + x
      if (visited[index] || data[index] < threshold) {
        continue
      }

      const queue = [index]
      visited[index] = 1
      let cursor = 0
      let count = 0
      let minComponentX = x
      let maxComponentX = x
      let minComponentY = y
      let maxComponentY = y

      while (cursor < queue.length) {
        const current = queue[cursor++]
        const currentX = current % width
        const currentY = Math.floor(current / width)
        count += 1
        minComponentX = Math.min(minComponentX, currentX)
        maxComponentX = Math.max(maxComponentX, currentX)
        minComponentY = Math.min(minComponentY, currentY)
        maxComponentY = Math.max(maxComponentY, currentY)

        const neighbors = [
          currentX > 0 ? current - 1 : -1,
          currentX < width - 1 ? current + 1 : -1,
          currentY > 0 ? current - width : -1,
          currentY < height - 1 ? current + width : -1,
        ]

        for (const neighbor of neighbors) {
          if (neighbor < 0 || neighbor >= data.length || visited[neighbor]) {
            continue
          }

          const neighborX = neighbor % width
          const neighborY = Math.floor(neighbor / width)
          if (neighborX < minX || neighborX >= maxX || neighborY < minY || neighborY >= maxY) {
            continue
          }

          if (data[neighbor] < threshold) {
            continue
          }

          visited[neighbor] = 1
          queue.push(neighbor)
        }
      }

      const bboxWidth = maxComponentX - minComponentX + 1
      const bboxHeight = maxComponentY - minComponentY + 1
      const bboxArea = bboxWidth * bboxHeight
      const fillRatio = count / bboxArea
      const aspectRatio = bboxWidth / bboxHeight
      const areaRatio = bboxArea / (width * height)
      const centerX = minComponentX + bboxWidth / 2
      const centerY = minComponentY + bboxHeight / 2
      const centerDistance =
        Math.abs(centerX - width / 2) / width +
        Math.abs(centerY - height / 2) / height

      if (areaRatio < 0.035 || areaRatio > 0.7) continue
      if (fillRatio < 0.5) continue
      if (aspectRatio < 0.38 || aspectRatio > 1.65) continue

      const score = bboxArea * fillRatio * Math.max(0.15, 1 - centerDistance)
      if (!best || score > best.score) {
        best = {
          region: {
            left: minComponentX,
            top: minComponentY,
            width: bboxWidth,
            height: bboxHeight,
          },
          score,
        }
      }
    }
  }

  if (!best) return null

  const paddingX = Math.max(4, Math.round(best.region.width * 0.06))
  const paddingY = Math.max(4, Math.round(best.region.height * 0.06))

  return {
    width,
    height,
    region: clampExtractFocusRegion({
      left: best.region.left - paddingX,
      top: best.region.top - paddingY,
      width: best.region.width + paddingX * 2,
      height: best.region.height + paddingY * 2,
    }, width, height),
  }
}

async function enhanceExtractFocusRegion(
  imageBuffer: Buffer,
  region: ExtractFocusRegion,
  imageWidth: number,
  imageHeight: number,
  scaleFactor: number
) {
  const safeRegion = clampExtractFocusRegion(region, imageWidth, imageHeight)
  const focusPatch = await sharp(imageBuffer)
    .extract(safeRegion)
    .gamma(1.8)
    .normalise({ lower: 1, upper: 99 })
    .gamma()
    .median(1)
    .linear(scaleFactor >= 4 ? 1.07 : 1.04, scaleFactor >= 4 ? -7 : -4)
    .modulate({ brightness: 1.015, saturation: 1.01 })
    .sharpen(getFocusRegionSharpenConfig(scaleFactor))
    .png()
    .toBuffer()

  const softenedPatch = await applySoftEdgeMask(focusPatch, 0.65)

  return sharp(imageBuffer)
    .composite([{ input: softenedPatch, left: safeRegion.left, top: safeRegion.top, blend: 'over' }])
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer()
}

export async function enhanceExtractReference(
  referenceBuffer: Buffer,
  targetLongEdge: number
): Promise<{
  buffer: Buffer
  width: number
  height: number
}> {
  const metadata = await sharp(referenceBuffer).metadata()
  const width = metadata.width ?? 0
  const height = metadata.height ?? 0

  if (width <= 0 || height <= 0) {
    throw new Error('The uploaded reference image could not be processed.')
  }

  const detectedFocus = await detectExtractFocusRegion(referenceBuffer)
  const longEdge = clampExtractLongEdge(targetLongEdge)
  const landscape = width >= height
  const scaleFactor = getExtractScaleFactor(width, height, longEdge)
  const sharpenConfig = getExtractSharpenConfig(scaleFactor)
  const linearAdjustments = getExtractLinearAdjustments(scaleFactor)

  const { data, info } = await sharp(referenceBuffer)
    .rotate()
    .gamma(1.9)
    .resize({
      width: landscape ? longEdge : undefined,
      height: landscape ? undefined : longEdge,
      fit: 'inside',
      withoutEnlargement: false,
      kernel: sharp.kernel.lanczos3,
    })
    .gamma()
    .linear(linearAdjustments.a, linearAdjustments.b)
    .modulate({ brightness: 1.01, saturation: scaleFactor >= 4 ? 1.02 : 1.01 })
    .sharpen(sharpenConfig)
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer({ resolveWithObject: true })

  const focusedBuffer = detectedFocus
    ? await enhanceExtractFocusRegion(
        data,
        scaleExtractFocusRegion(detectedFocus.region, detectedFocus.width, detectedFocus.height, info.width, info.height),
        info.width,
        info.height,
        scaleFactor
      )
    : data

  return {
    buffer: focusedBuffer,
    width: info.width,
    height: info.height,
  }
}
