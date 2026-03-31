export async function buildSvgWrapperFromImageUrl(imageUrl: string, options?: { title?: string }) {
  const response = await fetch(imageUrl)

  if (!response.ok) {
    throw new Error('Failed to fetch image for SVG export.')
  }

  const blob = await response.blob()
  const dataUrl = await blobToDataUrl(blob)
  const dimensions = await getImageDimensions(dataUrl)
  const title = escapeXml(options?.title ?? 'Folia export')

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${dimensions.width}" height="${dimensions.height}" viewBox="0 0 ${dimensions.width} ${dimensions.height}" role="img" aria-labelledby="title">
  <title>${title}</title>
  <image href="${dataUrl}" width="${dimensions.width}" height="${dimensions.height}" preserveAspectRatio="xMidYMid meet"/>
</svg>`
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Failed to read image for SVG export.'))
    reader.readAsDataURL(blob)
  })
}

function getImageDimensions(src: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight })
    image.onerror = () => reject(new Error('Failed to measure image for SVG export.'))
    image.src = src
  })
}

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}
