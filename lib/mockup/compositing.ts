import sharp from 'sharp'

const MIN_SAFE_SIGMA = 0.3
const MAX_SAFE_SIGMA = 1000
const DEFAULT_SIGMA = MIN_SAFE_SIGMA

export type DesignBlendMode = 'over' | 'multiply'

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

  return {
    buffer: data,
    width: info.width,
    height: info.height,
  }
}
