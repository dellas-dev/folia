import test from 'node:test'
import assert from 'node:assert/strict'
import sharp from 'sharp'

const compositingModule = await import(new URL('../lib/mockup/compositing.ts', import.meta.url))

const extractModule = await import(new URL('../lib/perspective/extract-runtime.js', import.meta.url))

const { applySoftEdgeMask, compositeSoftenedOverlay } = compositingModule
const { extractRectifiedSurfaceRuntime } = extractModule

async function pixelAt(buffer, x, y) {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const index = (y * info.width + x) * 4
  return {
    r: data[index],
    g: data[index + 1],
    b: data[index + 2],
    a: data[index + 3],
  }
}

async function minBrightnessInWindow(buffer, left, top, width, height) {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  let minBrightness = Infinity

  for (let y = top; y < Math.min(info.height, top + height); y++) {
    for (let x = left; x < Math.min(info.width, left + width); x++) {
      const index = (y * info.width + x) * 4
      const brightness = data[index] + data[index + 1] + data[index + 2]
      minBrightness = Math.min(minBrightness, brightness)
    }
  }

  return minBrightness
}

test('applySoftEdgeMask softens only the edge alpha while keeping the center fully opaque', async () => {
  const source = await sharp({
    create: {
      width: 80,
      height: 60,
      channels: 4,
      background: { r: 210, g: 60, b: 60, alpha: 1 },
    },
  }).png().toBuffer()

  const masked = await applySoftEdgeMask(source, 0.45)
  const center = await pixelAt(masked, 40, 30)
  const corner = await pixelAt(masked, 0, 0)

  assert.equal(center.a, 255)
  assert.ok(corner.a < 40, `expected corner alpha to be softened, got ${corner.a}`)
  assert.equal(center.r, 210)
  assert.equal(center.g, 60)
  assert.equal(center.b, 60)
})

test('compositeSoftenedOverlay preserves readable dark content and avoids white bloom outside the card area', async () => {
  const design = await sharp(Buffer.from(
    `<svg width="120" height="80" xmlns="http://www.w3.org/2000/svg">` +
    `<rect width="120" height="80" fill="#ffffff"/>` +
    `<rect x="28" y="28" width="64" height="18" fill="#111111"/>` +
    `</svg>`
  )).png().toBuffer()

  const whiteFill = await sharp({
    create: {
      width: 220,
      height: 160,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{
      input: Buffer.from(
        `<svg width="220" height="160" xmlns="http://www.w3.org/2000/svg">` +
        `<rect x="50" y="40" width="120" height="80" fill="white"/>` +
        `</svg>`
      ),
      blend: 'over',
    }])
    .png()
    .toBuffer()

  const warpedDesign = await sharp({
    create: {
      width: 220,
      height: 160,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: design, left: 50, top: 40, blend: 'over' }])
    .png()
    .toBuffer()

  const reference = await sharp({
    create: {
      width: 220,
      height: 160,
      channels: 3,
      background: { r: 188, g: 188, b: 188 },
    },
  }).png().toBuffer()

  const composited = await compositeSoftenedOverlay(
    reference,
    whiteFill,
    warpedDesign,
    { designBlendMode: 'over', edgeSoftnessSigma: 0.45 }
  )

  const textPixel = await pixelAt(composited, 110, 77)
  const outsidePixel = await pixelAt(composited, 46, 40)

  assert.ok(textPixel.r < 40 && textPixel.g < 40 && textPixel.b < 40, `expected readable dark text, got ${JSON.stringify(textPixel)}`)
  assert.ok(outsidePixel.r < 210 && outsidePixel.g < 210 && outsidePixel.b < 210, `expected no white bloom outside the card, got ${JSON.stringify(outsidePixel)}`)
})

test('compositeSoftenedOverlay keeps the design layer sharp instead of softening the artwork alpha', async () => {
  const whiteFill = await sharp({
    create: {
      width: 200,
      height: 140,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{
      input: Buffer.from(
        `<svg width="200" height="140" xmlns="http://www.w3.org/2000/svg">` +
        `<rect x="30" y="20" width="100" height="70" fill="white"/>` +
        `</svg>`
      ),
      blend: 'over',
    }])
    .png()
    .toBuffer()

  const design = await sharp({
    create: {
      width: 200,
      height: 140,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{
      input: Buffer.from(
        `<svg width="200" height="140" xmlns="http://www.w3.org/2000/svg">` +
        `<rect x="30" y="20" width="100" height="70" fill="white"/>` +
        `<rect x="62" y="46" width="36" height="8" fill="#111111"/>` +
        `</svg>`
      ),
      blend: 'over',
    }])
    .png()
    .toBuffer()

  const reference = await sharp({
    create: {
      width: 200,
      height: 140,
      channels: 3,
      background: { r: 214, g: 214, b: 214 },
    },
  }).png().toBuffer()

  const composited = await compositeSoftenedOverlay(
    reference,
    whiteFill,
    design,
    { designBlendMode: 'over', edgeSoftnessSigma: 0.45 }
  )

  const detailPixel = await pixelAt(composited, 80, 50)
  assert.ok(detailPixel.r < 30 && detailPixel.g < 30 && detailPixel.b < 30, `expected artwork detail to stay crisp/dark, got ${JSON.stringify(detailPixel)}`)
})

test('extractRectifiedSurfaceRuntime turns a detected skewed sign into a large planar extract', async () => {
  const corners = {
    topLeft: { x: 70, y: 25 },
    topRight: { x: 165, y: 30 },
    bottomRight: { x: 178, y: 188 },
    bottomLeft: { x: 60, y: 194 },
  }

  const scene = await sharp(Buffer.from(
    `<svg width="240" height="220" xmlns="http://www.w3.org/2000/svg">` +
    `<rect width="240" height="220" fill="#6e745d"/>` +
    `<polygon points="70,25 165,30 178,188 60,194" fill="#fbfaf6"/>` +
    `<polygon points="85,46 149,49 154,75 80,74" fill="#ffffff" stroke="#202020" stroke-width="2"/>` +
    `<polygon points="92,99 143,101 147,112 88,110" fill="#161616"/>` +
    `</svg>`
  ))
    .png()
    .toBuffer()

  const extracted = await extractRectifiedSurfaceRuntime(scene, corners, 240, 220, 2048)
  const outer = await pixelAt(extracted.buffer, Math.round(extracted.width * 0.1), Math.round(extracted.height * 0.1))
  const minLabelBrightness = await minBrightnessInWindow(
    extracted.buffer,
    Math.round(extracted.width * 0.35),
    Math.round(extracted.height * 0.5),
    Math.round(extracted.width * 0.3),
    Math.round(extracted.height * 0.12)
  )

  assert.equal(extracted.height, 2048)
  assert.ok(extracted.width > 1200 && extracted.width < 1500, `expected portrait planar extract, got ${extracted.width}x${extracted.height}`)
  assert.ok(minLabelBrightness < 120, `expected extracted label area to retain dark detail, got brightness=${minLabelBrightness}`)
  assert.ok(outer.r > 200 && outer.g > 200 && outer.b > 190, `expected extracted surface to stay bright, got ${JSON.stringify(outer)}`)
})
