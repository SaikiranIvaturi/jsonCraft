import LZString from 'lz-string'

export function encodeJson(json: string): string {
  return LZString.compressToEncodedURIComponent(json)
}

export function decodeJson(encoded: string): string | null {
  try {
    return LZString.decompressFromEncodedURIComponent(encoded)
  } catch {
    return null
  }
}

const URL_SAFE_MAX = 2000

export function getShareUrl(json: string): { url: string; tooLong: boolean } {
  const encoded = encodeJson(json)
  const url = `${window.location.origin}${window.location.pathname}#data=${encoded}`
  return { url, tooLong: url.length > URL_SAFE_MAX }
}

export function loadFromUrlHash(): string | null {
  const hash = window.location.hash
  if (!hash.startsWith('#data=')) return null
  const encoded = hash.slice(6)
  if (!encoded) return null
  return decodeJson(encoded)
}
