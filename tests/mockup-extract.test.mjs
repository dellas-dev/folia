import test from 'node:test'
import assert from 'node:assert/strict'
import sharp from 'sharp'

const compositingModule = await import(new URL('../lib/mockup/compositing.ts', import.meta.url))

const { enhanceExtractReference } = compositingModule

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

test('enhanceExtractReference upscales small reference images to the requested premium long edge', async () => {
  const source = await sharp({
    create: {
      width: 240,
      height: 160,
      channels: 3,
      background: { r: 232, g: 229, b: 224 },
    },
  }).png().toBuffer()

  const enhanced = await enhanceExtractReference(source, 2048)

  assert.equal(enhanced.width, 2048)
  assert.equal(enhanced.height, 1365)
})

test('enhanceExtractReference preserves strong center detail instead of softening the whole image', async () => {
  const source = await sharp(Buffer.from(
    `<svg width="240" height="160" xmlns="http://www.w3.org/2000/svg">` +
    `<rect width="240" height="160" fill="#f6f2ed"/>` +
    `<rect x="56" y="36" width="128" height="88" fill="#ffffff" stroke="#2f2f2f" stroke-width="2"/>` +
    `<rect x="90" y="68" width="60" height="12" fill="#111111"/>` +
    `</svg>`
  )).png().toBuffer()

  const enhanced = await enhanceExtractReference(source, 2048)
  const center = await pixelAt(enhanced.buffer, Math.round(enhanced.width * 0.5), Math.round(enhanced.height * 0.46))
  const outer = await pixelAt(enhanced.buffer, Math.round(enhanced.width * 0.15), Math.round(enhanced.height * 0.15))

  assert.ok(center.r < 30 && center.g < 30 && center.b < 30, `expected dark readable center detail, got ${JSON.stringify(center)}`)
  assert.ok(outer.r > 180 && outer.g > 180 && outer.b > 180, `expected bright preserved paper tone, got ${JSON.stringify(outer)}`)
})
