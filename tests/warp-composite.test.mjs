import test from 'node:test'
import assert from 'node:assert/strict'
import sharp from 'sharp'

const compositingModule = await import(new URL('../lib/mockup/compositing.ts', import.meta.url))

const { applySoftEdgeMask, compositeSoftenedOverlay } = compositingModule

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
