'use client'

export async function downloadRemoteFile(url: string, filename: string) {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('Failed to download file.')
  }

  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = objectUrl
  anchor.download = filename
  anchor.style.display = 'none'

  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()

  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
}

export async function downloadR2File(r2Key: string, filename: string) {
  const response = await fetch(`/api/download?key=${encodeURIComponent(r2Key)}`)

  if (!response.ok) {
    throw new Error('Failed to download file.')
  }

  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = objectUrl
  anchor.download = filename
  anchor.style.display = 'none'

  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()

  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
}
