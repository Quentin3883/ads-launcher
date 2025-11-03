/**
 * Convert a blob URL to a base64 data URL
 * @param blobUrl The blob URL (e.g., "blob:http://localhost:3000/...")
 * @returns Promise<string> Base64 data URL (e.g., "data:image/png;base64,...")
 */
export async function blobUrlToBase64(blobUrl: string): Promise<string> {
  // Fetch the blob
  const response = await fetch(blobUrl)
  const blob = await response.blob()

  // Convert blob to base64
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      resolve(reader.result as string)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Convert all blob URLs in an object to base64 data URLs
 */
export async function convertBlobUrlsToBase64<T>(obj: T): Promise<T> {
  if (typeof obj === 'string' && obj.startsWith('blob:')) {
    return (await blobUrlToBase64(obj)) as any
  }

  if (Array.isArray(obj)) {
    return (await Promise.all(obj.map((item) => convertBlobUrlsToBase64(item)))) as any
  }

  if (obj && typeof obj === 'object') {
    const result: any = {}
    for (const [key, value] of Object.entries(obj)) {
      result[key] = await convertBlobUrlsToBase64(value)
    }
    return result
  }

  return obj
}
