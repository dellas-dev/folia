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

// Full pipeline: warp design onto reference and composite with multiply blend.
// refBuffer should be the ORIGINAL reference buffer (not yet resized).
// corners must be in the coordinate space of the resized reference (MAX_REF_PX).
export async function compositeOverlay(
  designBuffer: Buffer,
  refBuffer: Buffer,
  corners: CornerPoints,
  refWidth: number,
  refHeight: number
): Promise<Buffer> {
  const warpedPng = await perspectiveWarp(designBuffer, corners, refWidth, refHeight)

  return sharp(refBuffer)
    .resize(MAX_REF_PX, MAX_REF_PX, { fit: 'inside', withoutEnlargement: true })
    .composite([{ input: warpedPng, blend: 'multiply' }])
    .png()
    .toBuffer()
}
