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

test('enhanceExtractReference creates a materially larger export from a tiny source image', async () => {
  const source = await sharp({
    create: {
      width: 120,
      height: 120,
      channels: 3,
      background: { r: 242, g: 239, b: 235 },
    },
  })
    .composite([
      {
        input: Buffer.from(
          `<svg width="120" height="120" xmlns="http://www.w3.org/2000/svg">` +
          `<rect x="18" y="18" width="84" height="84" fill="#ffffff" stroke="#2c2c2c" stroke-width="2"/>` +
          `<rect x="34" y="48" width="52" height="10" fill="#111111"/>` +
          `<rect x="34" y="66" width="42" height="6" fill="#3f3f3f"/>` +
          `</svg>`
        ),
        top: 0,
        left: 0,
      },
    ])
    .png()
    .toBuffer()

  const enhanced = await enhanceExtractReference(source, 2048)

  assert.ok(enhanced.buffer.length > source.length * 8, `expected much larger output artifact, got source=${source.length} enhanced=${enhanced.buffer.length}`)

  const darkLine = await pixelAt(enhanced.buffer, Math.round(enhanced.width * 0.5), Math.round(enhanced.height * 0.43))
  const cardFill = await pixelAt(enhanced.buffer, Math.round(enhanced.width * 0.5), Math.round(enhanced.height * 0.33))

  assert.ok(darkLine.r + darkLine.g + darkLine.b < cardFill.r + cardFill.g + cardFill.b - 240, `expected readable contrast after upscale, got dark=${JSON.stringify(darkLine)} fill=${JSON.stringify(cardFill)}`)
})

test('enhanceExtractReference boosts card-region edge contrast in a blurred reference scene', async () => {
  const scene = await sharp(Buffer.from(
    `<svg width="220" height="220" xmlns="http://www.w3.org/2000/svg">` +
    `<rect width="220" height="220" fill="#6b6f59"/>` +
    `<rect x="58" y="42" width="102" height="142" fill="#fbfbf8" stroke="#8a735c" stroke-width="6"/>` +
    `<rect x="78" y="82" width="62" height="10" fill="#121212"/>` +
    `<rect x="78" y="100" width="48" height="6" fill="#505050"/>` +
    `</svg>`
  ))
    .blur(1.35)
    .png()
    .toBuffer()

  const enhanced = await enhanceExtractReference(scene, 2048)
  const outside = await pixelAt(enhanced.buffer, Math.round(enhanced.width * 0.2), Math.round(enhanced.height * 0.45))
  const inside = await pixelAt(enhanced.buffer, Math.round(enhanced.width * 0.34), Math.round(enhanced.height * 0.45))
  const text = await pixelAt(enhanced.buffer, Math.round(enhanced.width * 0.5), Math.round(enhanced.height * 0.39))

  const outsideBrightness = outside.r + outside.g + outside.b
  const insideBrightness = inside.r + inside.g + inside.b
  const textBrightness = text.r + text.g + text.b

  assert.ok(insideBrightness > outsideBrightness + 180, `expected card area to stay clearly separated from background, got inside=${JSON.stringify(inside)} outside=${JSON.stringify(outside)}`)
  assert.ok(textBrightness < insideBrightness - 280, `expected text/detail to remain visibly darker than the card fill, got text=${JSON.stringify(text)} inside=${JSON.stringify(inside)}`)
})
