import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { fileURLToPath, pathToFileURL } from 'node:url'

const compositingModule = await import(new URL('../lib/mockup/compositing.ts', import.meta.url))

const extractModule = await import(new URL('../lib/perspective/extract-runtime.js', import.meta.url))
const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const warpSourcePath = fileURLToPath(new URL('../lib/perspective/warp.ts', import.meta.url))
const tempWarpPath = path.join(repoRoot, 'lib/perspective/.tmp-warp-test.ts')

const warpSource = await readFile(warpSourcePath, 'utf8')
const warpSourceForNode = warpSource
  .replace("from './homography'", `from '${pathToFileURL(path.join(repoRoot, 'lib/perspective/homography.ts')).href}'`)
  .replace("from './extract-runtime.js'", `from '${pathToFileURL(path.join(repoRoot, 'lib/perspective/extract-runtime.js')).href}'`)
  .replace("from './homography-runtime.js'", `from '${pathToFileURL(path.join(repoRoot, 'lib/perspective/homography-runtime.js')).href}'`)
  .replace("from '../mockup/compositing'", `from '${pathToFileURL(path.join(repoRoot, 'lib/mockup/compositing.ts')).href}'`)
  .replace("from '../mockup/sigma'", `from '${pathToFileURL(path.join(repoRoot, 'lib/mockup/sigma.ts')).href}'`)
  .replace("from '../../types'", `from '${pathToFileURL(path.join(repoRoot, 'types/index.ts')).href}'`)

await writeFile(tempWarpPath, warpSourceForNode)

const warpModule = await import(`${pathToFileURL(tempWarpPath).href}?t=${Date.now()}`)
await unlink(tempWarpPath)

const { applySoftEdgeMask, compositeSoftenedOverlay } = compositingModule
const { extractRectifiedSurfaceRuntime } = extractModule
const { cleanExtractedSurface, extractSurface } = warpModule

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

async function brightnessRangeInWindow(buffer, left, top, width, height) {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  let minBrightness = Infinity
  let maxBrightness = -Infinity

  for (let y = top; y < Math.min(info.height, top + height); y++) {
    for (let x = left; x < Math.min(info.width, left + width); x++) {
      const index = (y * info.width + x) * 4
      const brightness = data[index] + data[index + 1] + data[index + 2]
      minBrightness = Math.min(minBrightness, brightness)
      maxBrightness = Math.max(maxBrightness, brightness)
    }
  }

  return maxBrightness - minBrightness
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

test('extractSurface rectifies a skewed paper area, neutralizes old design color, and keeps paper texture variation', async () => {
  const points = [
    { x: 70, y: 25 },
    { x: 165, y: 30 },
    { x: 178, y: 188 },
    { x: 60, y: 194 },
  ]

  const scene = await sharp(Buffer.from(
    `<svg width="240" height="220" xmlns="http://www.w3.org/2000/svg">` +
    `<rect width="240" height="220" fill="#647255"/>` +
    `<polygon points="70,25 165,30 178,188 60,194" fill="#f7f1e7"/>` +
    `<polygon points="88,52 150,56 155,83 82,80" fill="#d94b78"/>` +
    `<polygon points="90,98 146,101 149,112 86,110" fill="#2563eb"/>` +
    `<polygon points="84,132 152,136 156,149 80,146" fill="#1f2937"/>` +
    `<circle cx="104" cy="154" r="6" fill="#d4b883" opacity="0.60"/>` +
    `<circle cx="123" cy="160" r="5" fill="#b7875d" opacity="0.45"/>` +
    `<circle cx="142" cy="151" r="4" fill="#7b8f69" opacity="0.42"/>` +
    `<circle cx="112" cy="171" r="3" fill="#8b6f63" opacity="0.35"/>` +
    `<circle cx="135" cy="176" r="3" fill="#c7b7a2" opacity="0.38"/>` +
    `</svg>`
  ))
    .png()
    .toBuffer()

  const extracted = await extractSurface(scene, points)
  const paperPixel = await pixelAt(extracted.buffer, Math.round(extracted.width * 0.2), Math.round(extracted.height * 0.82))
  const neutralizedInk = await pixelAt(extracted.buffer, Math.round(extracted.width * 0.5), Math.round(extracted.height * 0.23))
  const darkDetail = await pixelAt(extracted.buffer, Math.round(extracted.width * 0.5), Math.round(extracted.height * 0.72))
  const grainRange = await brightnessRangeInWindow(
    extracted.buffer,
    Math.round(extracted.width * 0.28),
    Math.round(extracted.height * 0.80),
    Math.max(8, Math.round(extracted.width * 0.18)),
    Math.max(8, Math.round(extracted.height * 0.12))
  )

  assert.equal(extracted.width, 107)
  assert.equal(extracted.height, 164)
  assert.ok(Math.abs(neutralizedInk.r - neutralizedInk.g) < 18 && Math.abs(neutralizedInk.g - neutralizedInk.b) < 18, `expected old design hue to be neutralized, got ${JSON.stringify(neutralizedInk)}`)
  assert.ok(darkDetail.r + darkDetail.g + darkDetail.b < paperPixel.r + paperPixel.g + paperPixel.b - 150, `expected dark detail to stay readable after rectification, got dark=${JSON.stringify(darkDetail)} paper=${JSON.stringify(paperPixel)}`)
  assert.ok(grainRange > 18, `expected paper texture variation to remain visible, got brightness range=${grainRange}`)
})

test('cleanExtractedSurface removes prominent design marks while keeping material variation', async () => {
  const rawExtract = await sharp(Buffer.from(
    `<svg width="180" height="240" xmlns="http://www.w3.org/2000/svg">` +
    `<rect width="180" height="240" fill="#f4efe6"/>` +
    `<circle cx="36" cy="42" r="4" fill="#c6b39f" opacity="0.45"/>` +
    `<circle cx="132" cy="62" r="5" fill="#d5c7b4" opacity="0.42"/>` +
    `<circle cx="84" cy="172" r="4" fill="#bda58d" opacity="0.40"/>` +
    `<rect x="42" y="38" width="98" height="22" rx="2" fill="#d946ef"/>` +
    `<rect x="32" y="92" width="116" height="16" rx="2" fill="#2563eb"/>` +
    `<rect x="46" y="144" width="88" height="18" rx="2" fill="#171717"/>` +
    `</svg>`
  ))
    .png()
    .toBuffer()

  const beforeInk = await pixelAt(rawExtract, 88, 48)
  const cleaned = await cleanExtractedSurface(rawExtract, {
    materialTexture: 'linen paper',
    lightingDirection: 'soft daylight from top-left',
  })
  const afterInk = await pixelAt(cleaned.buffer, 88, 48)
  const materialPatch = await brightnessRangeInWindow(cleaned.buffer, 18, 18, 60, 60)

  assert.ok(Math.abs(afterInk.r - afterInk.g) < 22 && Math.abs(afterInk.g - afterInk.b) < 22, `expected cleaned area to be neutralized, got ${JSON.stringify(afterInk)}`)
  assert.ok(afterInk.r + afterInk.g + afterInk.b > 420, `expected cleaned area to move toward a usable paper tone, got before=${JSON.stringify(beforeInk)} after=${JSON.stringify(afterInk)}`)
  assert.ok(materialPatch > 10, `expected subtle material texture variation to remain, got brightness range=${materialPatch}`)
})
