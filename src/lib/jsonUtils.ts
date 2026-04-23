import type { ValidationError, ValidationResult, JsonStats, DiffStats, DiffChange, IndentStyle, JsonAnalysis } from '@/types'
import { buildJsonPath } from './jsonPath'
import type { TreeNodeData } from '@/types'

export function formatJson(
  json: string,
  indent: IndentStyle,
  sortKeys: boolean
): { result: string; error?: string } {
  try {
    const parsed = JSON.parse(json)
    const processed = sortKeys ? sortObjectKeys(parsed) : parsed
    const indentStr = indent === 'tab' ? '\t' : indent
    return { result: JSON.stringify(processed, null, indentStr) }
  } catch (e) {
    return { result: json, error: (e as Error).message }
  }
}

function sortObjectKeys(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(sortObjectKeys)
  return Object.keys(obj as Record<string, unknown>)
    .sort()
    .reduce(
      (acc, key) => {
        acc[key] = sortObjectKeys((obj as Record<string, unknown>)[key])
        return acc
      },
      {} as Record<string, unknown>
    )
}

export function validateJson(json: string): ValidationResult {
  if (!json.trim()) {
    return { valid: false }
  }

  try {
    const parsed = JSON.parse(json)
    return { valid: true, stats: computeStats(json, parsed) }
  } catch (e) {
    const error = parseJsonError(json, (e as Error).message)
    return { valid: false, error }
  }
}

function computeStats(json: string, parsed: unknown): JsonStats {
  const lines = json.split('\n').length
  const chars = json.length
  const sizeKb = Math.round((new TextEncoder().encode(json).byteLength / 1024) * 100) / 100

  let rootKeys = 0
  if (parsed !== null && typeof parsed === 'object') {
    rootKeys = Array.isArray(parsed) ? parsed.length : Object.keys(parsed as object).length
  }

  return { chars, lines, sizeKb, rootKeys }
}

export function getJsonStats(json: string): JsonStats & { valid: boolean } {
  const lines = json.split('\n').length
  const chars = json.length
  const sizeKb = Math.round((new TextEncoder().encode(json).byteLength / 1024) * 100) / 100

  try {
    const parsed = JSON.parse(json)
    let rootKeys = 0
    if (parsed !== null && typeof parsed === 'object') {
      rootKeys = Array.isArray(parsed) ? parsed.length : Object.keys(parsed as object).length
    }
    return { lines, chars, sizeKb, rootKeys, valid: true }
  } catch {
    return { lines, chars, sizeKb, rootKeys: 0, valid: false }
  }
}

function parseJsonError(json: string, message: string): ValidationError {
  const posMatch = message.match(/position (\d+)/)
  const pos = posMatch ? parseInt(posMatch[1]) : 0

  let line = 1
  let column = 1
  for (let i = 0; i < pos && i < json.length; i++) {
    if (json[i] === '\n') {
      line++
      column = 1
    } else {
      column++
    }
  }

  const friendly = getFriendlyError(message, json, pos)
  return { message, line, column, friendly }
}

function getFriendlyError(message: string, json: string, pos: number): string {
  const lower = message.toLowerCase()
  const char = json[pos] ?? json[pos - 1] ?? ''

  if (lower.includes('unexpected end')) {
    const opens = (json.match(/\{/g) ?? []).length
    const closes = (json.match(/\}/g) ?? []).length
    const arrOpens = (json.match(/\[/g) ?? []).length
    const arrCloses = (json.match(/\]/g) ?? []).length

    if (opens > closes)
      return `Missing closing brace "}" — ${opens - closes} unclosed object(s)`
    if (arrOpens > arrCloses)
      return `Missing closing bracket "]" — ${arrOpens - arrCloses} unclosed array(s)`
    return 'Unexpected end of input — JSON is incomplete'
  }

  if (lower.includes('unexpected token')) {
    if (char === "'") return 'Single quotes are not valid JSON — use double quotes instead'
    if (char === ',') return 'Trailing comma is not allowed in JSON'
    if (char === '/' || char === '#') return 'Comments are not allowed in JSON'
    if (char === 'u' || char === 'U') return '"undefined" is not a valid JSON value'
    if (char === 'N') return 'Use null (lowercase) — "NaN" and "None" are not valid JSON'
    return `Unexpected character "${char}" — check syntax near this position`
  }

  return message
}

export function prepareForDiff(json: string, sortKeys: boolean): string {
  try {
    const parsed = JSON.parse(json)
    const processed = sortKeys ? sortObjectKeys(parsed) : parsed
    return JSON.stringify(processed, null, 2)
  } catch {
    return json
  }
}

export function computeDiffStats(original: string, modified: string): DiffStats {
  const originalLines = new Set(
    original
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
  )
  const modifiedLines = new Set(
    modified
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
  )

  let additions = 0
  let deletions = 0

  modifiedLines.forEach((line) => {
    if (!originalLines.has(line)) additions++
  })
  originalLines.forEach((line) => {
    if (!modifiedLines.has(line)) deletions++
  })

  const modifications = Math.min(additions, deletions)
  return {
    additions: additions - modifications,
    deletions: deletions - modifications,
    modifications,
  }
}

export function computeDiffDetails(original: string, modified: string): DiffChange[] {
  try {
    const orig = JSON.parse(original)
    const mod = JSON.parse(modified)
    const changes: DiffChange[] = []
    diffRecursive(orig, mod, '$', changes)
    return changes
  } catch {
    return []
  }
}

function diffRecursive(orig: unknown, mod: unknown, path: string, changes: DiffChange[]): void {
  const origIsNull = orig === null
  const modIsNull = mod === null
  const origIsArray = Array.isArray(orig)
  const modIsArray = Array.isArray(mod)
  const origType = origIsNull ? 'null' : origIsArray ? 'array' : typeof orig
  const modType = modIsNull ? 'null' : modIsArray ? 'array' : typeof mod

  if (origType !== modType) {
    changes.push({ path, type: 'changed', oldValue: orig, newValue: mod })
    return
  }

  if (origType === 'null' || origType === 'string' || origType === 'number' || origType === 'boolean') {
    if (orig !== mod) {
      changes.push({ path, type: 'changed', oldValue: orig, newValue: mod })
    }
    return
  }

  if (origIsArray && modIsArray) {
    const origArr = orig as unknown[]
    const modArr = mod as unknown[]
    const maxLen = Math.max(origArr.length, modArr.length)
    for (let i = 0; i < maxLen; i++) {
      if (i >= origArr.length) {
        changes.push({ path: `${path}[${i}]`, type: 'added', newValue: modArr[i] })
      } else if (i >= modArr.length) {
        changes.push({ path: `${path}[${i}]`, type: 'removed', oldValue: origArr[i] })
      } else {
        diffRecursive(origArr[i], modArr[i], `${path}[${i}]`, changes)
      }
    }
    return
  }

  const origObj = orig as Record<string, unknown>
  const modObj = mod as Record<string, unknown>
  const allKeys = new Set([...Object.keys(origObj), ...Object.keys(modObj)])
  for (const key of allKeys) {
    const childPath = `${path}.${key}`
    if (!(key in origObj)) {
      changes.push({ path: childPath, type: 'added', newValue: modObj[key] })
    } else if (!(key in modObj)) {
      changes.push({ path: childPath, type: 'removed', oldValue: origObj[key] })
    } else {
      diffRecursive(origObj[key], modObj[key], childPath, changes)
    }
  }
}

export function buildJsonTree(json: string): TreeNodeData | null {
  try {
    const parsed = JSON.parse(json)
    return buildNode(parsed, 'root', [], 0)
  } catch {
    return null
  }
}

function buildNode(
  value: unknown,
  key: string | number,
  pathSegments: (string | number)[],
  depth: number
): TreeNodeData {
  const path = buildJsonPath(pathSegments)

  if (value === null) {
    return { key, value, path, pathSegments, type: 'null', depth }
  }
  if (typeof value === 'string') {
    return { key, value, path, pathSegments, type: 'string', depth }
  }
  if (typeof value === 'number') {
    return { key, value, path, pathSegments, type: 'number', depth }
  }
  if (typeof value === 'boolean') {
    return { key, value, path, pathSegments, type: 'boolean', depth }
  }
  if (Array.isArray(value)) {
    const children = value.map((item, i) => buildNode(item, i, [...pathSegments, i], depth + 1))
    return { key, value, path, pathSegments, type: 'array', children, size: value.length, depth }
  }
  if (typeof value === 'object') {
    const children = Object.entries(value as Record<string, unknown>).map(([k, v]) =>
      buildNode(v, k, [...pathSegments, k], depth + 1)
    )
    return {
      key,
      value,
      path,
      pathSegments,
      type: 'object',
      children,
      size: children.length,
      depth,
    }
  }

  return { key, value, path, pathSegments, type: 'null', depth }
}

export function formatNumber(n: number): string {
  return n.toLocaleString()
}

// --- Analysis ---

function getValueType(value: unknown): JsonAnalysis['rootType'] {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  const t = typeof value
  if (t === 'string') return 'string'
  if (t === 'number') return 'number'
  if (t === 'boolean') return 'boolean'
  return 'object'
}

export function analyzeJson(json: string): JsonAnalysis | null {
  try {
    const parsed = JSON.parse(json)
    const typeCounts = { objects: 0, arrays: 0, strings: 0, numbers: 0, booleans: 0, nulls: 0 }
    const keyCounts: Record<string, number> = {}
    const arrayLengths: number[] = []
    let totalNodes = 0
    let maxDepth = 0
    let emptyStrings = 0
    let emptyArrays = 0
    let emptyObjects = 0

    function traverse(value: unknown, depth: number) {
      totalNodes++
      if (depth > maxDepth) maxDepth = depth
      const type = getValueType(value)
      if (type === 'null') {
        typeCounts.nulls++
      } else if (type === 'string') {
        typeCounts.strings++
        if ((value as string).length === 0) emptyStrings++
      } else if (type === 'number') {
        typeCounts.numbers++
      } else if (type === 'boolean') {
        typeCounts.booleans++
      } else if (type === 'array') {
        typeCounts.arrays++
        const arr = value as unknown[]
        arrayLengths.push(arr.length)
        if (arr.length === 0) emptyArrays++
        arr.forEach((item) => traverse(item, depth + 1))
      } else {
        typeCounts.objects++
        const obj = value as Record<string, unknown>
        const keys = Object.keys(obj)
        if (keys.length === 0) emptyObjects++
        keys.forEach((key) => {
          keyCounts[key] = (keyCounts[key] ?? 0) + 1
          traverse(obj[key], depth + 1)
        })
      }
    }

    traverse(parsed, 0)

    const uniqueKeys = Object.keys(keyCounts).length
    const totalKeys = Object.values(keyCounts).reduce((s, n) => s + n, 0)
    const mostCommonKeys = Object.entries(keyCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([key, count]) => ({ key, count }))

    let arrayStats: JsonAnalysis['arrayStats'] = null
    if (arrayLengths.length > 0) {
      const min = Math.min(...arrayLengths)
      const max = Math.max(...arrayLengths)
      const avg =
        Math.round((arrayLengths.reduce((s, n) => s + n, 0) / arrayLengths.length) * 10) / 10
      arrayStats = { min, max, avg, total: arrayLengths.length }
    }

    return {
      rootType: getValueType(parsed),
      totalNodes,
      maxDepth,
      typeCounts,
      uniqueKeys,
      totalKeys,
      mostCommonKeys,
      arrayStats,
      emptyValues: { emptyStrings, emptyArrays, emptyObjects, nulls: typeCounts.nulls },
    }
  } catch {
    return null
  }
}
