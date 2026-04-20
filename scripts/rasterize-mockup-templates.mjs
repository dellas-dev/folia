import { mkdir, readdir } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const root = process.cwd()
const sourceDir = path.join(root, 'public', 'mockups', 'templates')
const outputDir = path.join(sourceDir, 'rendered')

await mkdir(outputDir, { recursive: true })

const files = await readdir(sourceDir)
const svgFiles = files.filter((file) => file.endsWith('.svg'))

for (const file of svgFiles) {
  const input = path.join(sourceDir, file)
  const base = file.replace(/\.svg$/i, '')
  const fullOutput = path.join(outputDir, `${base}.png`)
  const thumbOutput = path.join(outputDir, `${base}-thumb.png`)

  const image = sharp(input, { density: 192 })

  await image
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(fullOutput)

  await sharp(input, { density: 144 })
    .resize(480, 320, { fit: 'cover', position: 'centre' })
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(thumbOutput)

  console.log(`Rasterized ${file}`)
}

console.log(`Created ${svgFiles.length} full-size PNGs and thumbnails in ${outputDir}`)
