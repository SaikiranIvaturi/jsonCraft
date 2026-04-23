import { useEffect } from 'react'
import { getShareUrl, loadFromUrlHash } from '@/lib/compression'

export function useUrlSharing(onLoad: (json: string) => void) {
  useEffect(() => {
    const json = loadFromUrlHash()
    if (json) {
      onLoad(json)
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [onLoad])

  return { getShareUrl }
}
