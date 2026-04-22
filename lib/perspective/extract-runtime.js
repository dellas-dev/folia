import sharp from 'sharp'
import { applyH, computeHomography } from './homography-runtime.js'

function bilinearSample(data, width, height, x, y) {
  const x0 = Math.max(0, Math.floor(x))
  const y0 = Math.max(0, Math.floor(y))
  const x1 = Math.min(x0 + 1, width - 1)
  const y1 = Math.min(y0 + 1, height - 1)
  const fx = x - x0
  const fy = y - y0

  function px(px_, py_) {
    const i = (py_ * width + px_) * 4
    return [data[i], data[i + 1], data[i + 2], data[i + 3]]
  }

  const [r00, g00, b00, a00] = px(x0, y0)
  const [r10, g10, b10, a10] = px(x1, y0)
  const [r01, g01, b01, a01] = px(x0, y1)
  const [r11, g11, b11, a11] = px(x1, y1)

  const lerp = (a, b, t) => a + (b - a) * t
  const bilerp = (v00, v10, v01, v11) =>
    lerp(lerp(v00, v10, fx), lerp(v01, v11, fx), fy)

  return [
    Math.round(bilerp(r00, r10, r01, r11)),
    Math.round(bilerp(g00, g10, g01, g11)),
    Math.round(bilerp(b00, b10, b01, b11)),
    Math.round(bilerp(a00, a10, a01, a11)),
  ]
}

function distance(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

function getRectifiedSurfaceSize(corners, targetLongEdge) {
  const avgWidth = (distance(corners.topLeft, corners.topRight) + distance(corners.bottomLeft, corners.bottomRight)) / 2
  const avgHeight = (distance(corners.topLeft, corners.bottomLeft) + distance(corners.topRight, corners.bottomRight)) / 2
  const safeWidth = Math.max(1, avgWidth)
  const safeHeight = Math.max(1, avgHeight)
  const aspect = Math.max(0.4, Math.min(2.2, safeWidth / safeHeight))
  const longEdge = Math.max(1024, Math.min(4096, Math.round(targetLongEdge)))

  if (aspect >= 1) {
    return { width: longEdge, height: Math.max(512, Math.round(longEdge / aspect)) }
  }

  return { width: Math.max(512, Math.round(longEdge * aspect)), height: longEdge }
}

export async function extractRectifiedSurfaceRuntime(refBuffer, corners, refWidth, refHeight, targetLongEdge) {
  const { data: refRaw, info } = await sharp(refBuffer)
    .rotate()
    .resize(refWidth, refHeight, { fit: 'inside', withoutEnlargement: false })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const outputSize = getRectifiedSurfaceSize(corners, targetLongEdge)
  const src = [corners.topLeft, corners.topRight, corners.bottomRight, corners.bottomLeft]
  const dst = [
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
      if (sx < 0 || sy < 0 || sx >= info.width || sy >= info.height) continue

      const [r, g, b, a] = bilinearSample(refRaw, info.width, info.height, sx, sy)
      const i = (y * outputSize.width + x) * 4
      outData[i] = r
      outData[i + 1] = g
      outData[i + 2] = b
      outData[i + 3] = a
    }
  }

  const { data, info: encodedInfo } = await sharp(outData, {
    raw: { width: outputSize.width, height: outputSize.height, channels: 4 },
  })
    .gamma(1.9)
    .normalise({ lower: 1, upper: 99 })
    .gamma()
    .median(1)
    .linear(1.04, -4)
    .modulate({ brightness: 1.01, saturation: 1.01 })
    .sharpen({ sigma: 1.24, m1: 1.45, m2: 2.6, x1: 2, y2: 12, y3: 20 })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer({ resolveWithObject: true })

  return {
    buffer: data,
    width: encodedInfo.width,
    height: encodedInfo.height,
  }
}
