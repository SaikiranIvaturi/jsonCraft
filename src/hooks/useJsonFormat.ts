import { formatJson } from '@/lib/jsonUtils'
import type { IndentStyle } from '@/types'

export function useJsonFormat() {
  const format = (json: string, indent: IndentStyle, sortKeys: boolean): string => {
    const { result } = formatJson(json, indent, sortKeys)
    return result
  }

  return { format }
}
