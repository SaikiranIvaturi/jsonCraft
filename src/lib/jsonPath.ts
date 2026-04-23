export function buildJsonPath(segments: (string | number)[]): string {
  if (segments.length === 0) return '$'
  return (
    '$' +
    segments
      .map((segment) => {
        if (typeof segment === 'number') return `[${segment}]`
        if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(segment)) return `.${segment}`
        return `["${segment.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"]`
      })
      .join('')
  )
}
