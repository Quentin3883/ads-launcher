/**
 * Validates URL format
 * Accepts both simple domain format (example.com) and full URLs (https://example.com)
 */
export function isValidUrl(url: string | undefined): boolean {
  if (!url || url.trim().length === 0) return false

  // Remove protocol for validation
  const urlWithoutProtocol = url.replace(/^https?:\/\//, '').trim()

  // Must have at least: domain.tld (e.g., example.com)
  // Domain part: letters, numbers, hyphens (but not starting/ending with hyphen)
  // TLD: at least 2 letters
  const domainPattern = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(\/.*)?$/

  if (!domainPattern.test(urlWithoutProtocol)) return false

  // Additional validation: check with URL constructor
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
    const hostname = urlObj.hostname

    // Must have at least one dot and valid TLD
    if (!hostname.includes('.')) return false

    // TLD must be at least 2 characters
    const parts = hostname.split('.')
    const tld = parts[parts.length - 1]
    if (!tld || tld.length < 2) return false

    return true
  } catch {
    return false
  }
}
