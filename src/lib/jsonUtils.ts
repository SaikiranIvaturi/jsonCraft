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

// ─── JSON repair ─────────────────────────────────────────────────────────────

export function repairJson(input: string): { fixed: string; changes: string[] } | null {
  try { JSON.parse(input); return null; } catch { /* needs repair */ }

  const changes: string[] = []
  let s = input.trim().replace(/^﻿/, '') // strip BOM

  s = repairPercentEncodedQuotes(s, changes) // "url%22, → "url",
  s = repairUnclosedStrings(s, changes)      // "url…, or any string cut off before newline+structural JSON
  s = repairMarkdownFences(s, changes)       // unwrap ```json ... ```
  s = repairStripComments(s, changes)        // // and /* */ comments
  s = repairSingleQuotes(s, changes)         // '...' → "..."
  s = repairTemplateLiterals(s, changes)     // `...` → "..."
  s = repairUnescapedBackslashes(s, changes) // fix bad \ escapes (Windows paths etc.)
  s = repairStringControlChars(s, changes)   // escape raw \n \t \r inside strings
  // From here all strings are "..." — transformNonStrings is safe.
  s = repairBareKeys(s, changes)             // {foo: → {"foo":
  s = repairLiterals(s, changes)             // True/False/None → true/false/null
  s = repairInvalidTokens(s, changes)        // undefined/NaN/Infinity → null
  s = repairNumberLiterals(s, changes)       // 0xFF / 0o7 / 0b1 → decimal
  s = repairBareValues(s, changes)           // {k: active} → {k: "active"}
  s = repairMissingValues(s, changes)        // {"k":,} → {"k":null,}
  s = repairTrailingCommas(s, changes)       // [1,] → [1]
  s = repairMissingCommas(s, changes)        // [1 2] → [1,2]
  s = repairBraceBalance(s, changes)         // close unclosed { [, fix mismatched ] }
  s = repairMultipleRoots(s, changes)        // {...}{...} → [{...},{...}]

  try {
    const parsed = JSON.parse(s)
    if (changes.length === 0) return null
    return { fixed: JSON.stringify(parsed, null, 2), changes }
  } catch {
    return null
  }
}

function repairStripComments(s: string, changes: string[]): string {
  let result = ''
  let i = 0
  let changed = false

  while (i < s.length) {
    const ch = s[i]

    if (ch === '"' || ch === "'") {
      const q = ch
      result += s[i++]
      while (i < s.length) {
        if (s[i] === '\\' && i + 1 < s.length) { result += s[i] + s[i + 1]; i += 2 }
        else if (s[i] === q) { result += s[i++]; break }
        else result += s[i++]
      }
      continue
    }

    if (ch === '/' && s[i + 1] === '/') {
      changed = true
      while (i < s.length && s[i] !== '\n') i++
      continue
    }

    if (ch === '/' && s[i + 1] === '*') {
      changed = true
      i += 2
      while (i < s.length && !(s[i] === '*' && s[i + 1] === '/')) i++
      if (i < s.length) i += 2
      continue
    }

    result += ch
    i++
  }

  if (changed) changes.push('Removed JavaScript comments')
  return result
}

function repairSingleQuotes(s: string, changes: string[]): string {
  let result = ''
  let i = 0
  let changed = false

  while (i < s.length) {
    const ch = s[i]

    if (ch === '"') {
      result += s[i++]
      while (i < s.length) {
        if (s[i] === '\\' && i + 1 < s.length) { result += s[i] + s[i + 1]; i += 2 }
        else if (s[i] === '"') { result += s[i++]; break }
        else result += s[i++]
      }
      continue
    }

    if (ch === "'") {
      changed = true
      result += '"'
      i++
      while (i < s.length) {
        if (s[i] === '\\' && i + 1 < s.length) {
          const esc = s[i + 1]
          if (esc === "'") { result += "'"; i += 2 }
          else if (esc === '"') { result += '\\"'; i += 2 }
          else { result += s[i] + esc; i += 2 }
          continue
        }
        if (s[i] === '"') { result += '\\"'; i++; continue }
        if (s[i] === "'") { result += '"'; i++; break }
        result += s[i++]
      }
      continue
    }

    result += ch
    i++
  }

  if (changed) changes.push('Replaced single quotes with double quotes')
  return result
}

// All strings are "..." from here — safe to use transformNonStrings.
function transformNonStrings(s: string, fn: (chunk: string) => string): string {
  let result = ''
  let i = 0
  let nonStr = ''

  while (i < s.length) {
    if (s[i] === '"') {
      result += fn(nonStr)
      nonStr = ''
      result += s[i++]
      while (i < s.length) {
        if (s[i] === '\\' && i + 1 < s.length) { result += s[i] + s[i + 1]; i += 2 }
        else if (s[i] === '"') { result += s[i++]; break }
        else result += s[i++]
      }
      continue
    }
    nonStr += s[i++]
  }
  result += fn(nonStr)
  return result
}

function repairBareKeys(s: string, changes: string[]): string {
  let changed = false
  const fixed = transformNonStrings(s, (chunk) =>
    chunk.replace(/([{,]?\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, (_m, prefix, key) => {
      changed = true
      return `${prefix}"${key}":`
    })
  )
  if (changed) changes.push('Quoted unquoted object keys')
  return fixed
}

function repairTrailingCommas(s: string, changes: string[]): string {
  const fixed = transformNonStrings(s, (chunk) => chunk.replace(/,(\s*[}\]])/g, '$1'))
  if (fixed !== s) changes.push('Removed trailing commas')
  return fixed
}

function repairInvalidTokens(s: string, changes: string[]): string {
  let changed = false
  const fixed = transformNonStrings(s, (chunk) => {
    const before = chunk
    const after = chunk
      .replace(/\bundefined\b/g, 'null')
      .replace(/\bNaN\b/g, 'null')
      .replace(/-?Infinity\b/g, 'null')
    if (after !== before) changed = true
    return after
  })
  if (changed) changes.push('Replaced undefined / NaN / Infinity with null')
  return fixed
}

function repairMarkdownFences(s: string, changes: string[]): string {
  const m = s.match(/^`{3}(?:[a-z]*)?\s*\r?\n?([\s\S]*?)\r?\n?`{3}\s*$/i)
  if (m) { changes.push('Stripped markdown code fence'); return m[1].trim() }
  return s
}

function repairTemplateLiterals(s: string, changes: string[]): string {
  let result = ''
  let i = 0
  let changed = false
  while (i < s.length) {
    if (s[i] === '"') {
      result += s[i++]
      while (i < s.length) {
        if (s[i] === '\\' && i + 1 < s.length) { result += s[i] + s[i + 1]; i += 2 }
        else if (s[i] === '"') { result += s[i++]; break }
        else result += s[i++]
      }
      continue
    }
    if (s[i] === '`') {
      changed = true; result += '"'; i++
      while (i < s.length) {
        if (s[i] === '`') { result += '"'; i++; break }
        if (s[i] === '"') { result += '\\"'; i++; continue }
        if (s[i] === '\\' && i + 1 < s.length) {
          if (s[i + 1] === '`') { result += '`'; i += 2 }
          else { result += s[i] + s[i + 1]; i += 2 }
          continue
        }
        result += s[i++]
      }
      continue
    }
    result += s[i++]
  }
  if (changed) changes.push('Converted template literals to strings')
  return result
}

function repairUnclosedStrings(s: string, changes: string[]): string {
  // Detects strings that were never closed before a newline followed by structural JSON.
  // Handles: "url…,\n  "nextKey": (URL truncated with ellipsis/any suffix)
  // Strategy: if inside a string we hit a newline and the next non-whitespace char
  // is " } ] or EOF, close the string there. If it ended with , move the comma outside.
  let result = ''
  let i = 0
  let changed = false

  while (i < s.length) {
    if (s[i] !== '"') { result += s[i++]; continue }

    result += '"'
    i++
    let closed = false

    while (i < s.length) {
      const ch = s[i]

      if (ch === '\\' && i + 1 < s.length) { result += ch + s[i + 1]; i += 2; continue }
      if (ch === '"') { result += '"'; i++; closed = true; break }

      if (ch === '\n' || ch === '\r') {
        let j = i + 1
        while (j < s.length && (s[j] === ' ' || s[j] === '\t' || s[j] === '\r' || s[j] === '\n')) j++
        const nc = j < s.length ? s[j] : ''
        if (nc === '"' || nc === '}' || nc === ']' || j >= s.length) {
          if (result.endsWith(',')) {
            result = result.slice(0, -1) + '",'
          } else {
            result += '"'
          }
          changed = true; closed = true; break
        }
        result += ch; i++; continue
      }

      result += ch; i++
    }

    if (!closed) { result += '"'; changed = true }
  }

  if (changed) changes.push('Closed unclosed string literals')
  return result
}

function repairPercentEncodedQuotes(s: string, changes: string[]): string {
  // Handles strings where the closing " was accidentally URL-encoded as %22.
  // Pattern: "...url...%22,  →  "...url...",
  // Also handles redundant: ...%22"  →  ..."  (encoded + actual quote)
  let changed = false
  let result = s
  result = result.replace(/%22"/g, () => { changed = true; return '"' })
  result = result.replace(/"([^"\r\n]*?)%22,/g, (_m, content) => {
    changed = true
    return `"${content}",`
  })
  if (changed) changes.push('Fixed URL-encoded closing quotes (%22 → ")')
  return result
}

function repairStringControlChars(s: string, changes: string[]): string {
  let result = ''
  let i = 0
  let changed = false
  while (i < s.length) {
    if (s[i] !== '"') { result += s[i++]; continue }
    result += '"'; i++
    while (i < s.length) {
      const ch = s[i]
      if (ch === '\\' && i + 1 < s.length) { result += ch + s[i + 1]; i += 2; continue }
      if (ch === '"') { result += '"'; i++; break }
      const code = ch.charCodeAt(0)
      if (code < 0x20) {
        changed = true
        if (code === 0x09) result += '\\t'
        else if (code === 0x0a) result += '\\n'
        else if (code === 0x0d) result += '\\r'
        else result += `\\u${code.toString(16).padStart(4, '0')}`
        i++; continue
      }
      result += ch; i++
    }
  }
  if (changed) changes.push('Escaped control characters in strings')
  return result
}

function repairUnescapedBackslashes(s: string, changes: string[]): string {
  const VALID = new Set(['"', '\\', '/', 'b', 'f', 'n', 'r', 't', 'u'])
  let result = ''
  let i = 0
  let changed = false
  while (i < s.length) {
    if (s[i] !== '"') { result += s[i++]; continue }
    result += '"'; i++
    while (i < s.length) {
      if (s[i] === '"') { result += '"'; i++; break }
      if (s[i] === '\\') {
        const next = s[i + 1]
        if (next !== undefined && VALID.has(next)) {
          if (next === 'u') {
            const hex = s.slice(i + 2, i + 6)
            if (/^[0-9a-fA-F]{4}$/.test(hex)) { result += '\\u' + hex; i += 6 }
            else { result += '\\\\'; i++; changed = true }
          } else { result += s[i] + next; i += 2 }
        } else { result += '\\\\'; i++; changed = true }
        continue
      }
      result += s[i++]
    }
  }
  if (changed) changes.push('Escaped invalid backslashes in strings')
  return result
}

function repairLiterals(s: string, changes: string[]): string {
  let changed = false
  const fixed = transformNonStrings(s, (chunk) => {
    const before = chunk
    const after = chunk
      .replace(/\bTrue\b/g, 'true').replace(/\bFalse\b/g, 'false').replace(/\bNone\b/g, 'null')
      .replace(/\bNULL\b/g, 'null').replace(/\bTRUE\b/g, 'true').replace(/\bFALSE\b/g, 'false')
    if (after !== before) changed = true
    return after
  })
  if (changed) changes.push('Converted Python/Ruby literals to JSON')
  return fixed
}

function repairNumberLiterals(s: string, changes: string[]): string {
  let changed = false
  const fixed = transformNonStrings(s, (chunk) => {
    let after = chunk
    after = after.replace(/\b0[xX][0-9a-fA-F]+\b/g, m => { changed = true; return String(parseInt(m, 16)) })
    after = after.replace(/\b0[oO][0-7]+\b/g,        m => { changed = true; return String(parseInt(m, 8)) })
    after = after.replace(/\b0[bB][01]+\b/g,          m => { changed = true; return String(parseInt(m, 2)) })
    return after
  })
  if (changed) changes.push('Converted hex/octal/binary number literals')
  return fixed
}

function repairBareValues(s: string, changes: string[]): string {
  let changed = false
  const fixed = transformNonStrings(s, (chunk) => {
    const after = chunk.replace(
      /([:,\[]\s*)([a-zA-Z_$][a-zA-Z0-9_$-]*)\b/g,
      (_m, prefix, word) => {
        if (/^(true|false|null)$/.test(word)) return _m
        changed = true
        return `${prefix}"${word}"`
      }
    )
    return after
  })
  if (changed) changes.push('Quoted unquoted string values')
  return fixed
}

function repairMissingValues(s: string, changes: string[]): string {
  let changed = false
  const fixed = transformNonStrings(s, (chunk) => {
    let after = chunk
    after = after.replace(/(:\s*)([,}\]])/g, (_m, colon, closer) => { changed = true; return `${colon}null${closer}` })
    after = after.replace(/,(\s*),/g, () => { changed = true; return ',null,' })
    after = after.replace(/(\[\s*),/g, (_m, open) => { changed = true; return `${open}null,` })
    return after
  })
  if (changed) changes.push('Replaced missing values with null')
  return fixed
}

function repairMissingCommas(s: string, changes: string[]): string {
  let result = ''
  let i = 0
  let changed = false
  let lastWasValue = false
  let lastWasColon = false

  const maybeComma = () => { if (lastWasValue && !lastWasColon) { result += ','; changed = true } }

  while (i < s.length) {
    const ch = s[i]
    if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n') { result += ch; i++; continue }
    if (ch === '"') {
      maybeComma(); result += ch; i++
      while (i < s.length) {
        if (s[i] === '\\' && i + 1 < s.length) { result += s[i] + s[i + 1]; i += 2; continue }
        if (s[i] === '"') { result += s[i++]; break }
        result += s[i++]
      }
      lastWasValue = true; lastWasColon = false; continue
    }
    if (ch === '{' || ch === '[') {
      maybeComma(); result += ch; i++; lastWasValue = false; lastWasColon = false; continue
    }
    if (ch === '}' || ch === ']') {
      result += ch; i++; lastWasValue = true; lastWasColon = false; continue
    }
    if (ch === ',') {
      result += ch; i++; lastWasValue = false; lastWasColon = false; continue
    }
    if (ch === ':') {
      result += ch; i++; lastWasValue = false; lastWasColon = true; continue
    }
    if (ch === '-' || (ch >= '0' && ch <= '9')) {
      maybeComma()
      while (i < s.length && /[-\d.eE+]/.test(s[i])) result += s[i++]
      lastWasValue = true; lastWasColon = false; continue
    }
    if (ch === 't' || ch === 'f' || ch === 'n') {
      const rest = s.slice(i)
      const tok = rest.startsWith('true') ? 'true' : rest.startsWith('false') ? 'false' : rest.startsWith('null') ? 'null' : null
      if (tok) {
        maybeComma(); result += tok; i += tok.length; lastWasValue = true; lastWasColon = false; continue
      }
    }
    result += ch; i++
  }
  if (changed) changes.push('Inserted missing commas')
  return result
}

function repairBraceBalance(s: string, changes: string[]): string {
  let result = ''
  const stack: ('}' | ']')[] = []
  let i = 0
  let hadMismatch = false
  let hadExtra = false

  while (i < s.length) {
    if (s[i] === '"') {
      result += s[i++]
      while (i < s.length) {
        if (s[i] === '\\' && i + 1 < s.length) { result += s[i] + s[i + 1]; i += 2 }
        else if (s[i] === '"') { result += s[i++]; break }
        else result += s[i++]
      }
      continue
    }
    const ch = s[i]
    if (ch === '{') { stack.push('}'); result += ch; i++ }
    else if (ch === '[') { stack.push(']'); result += ch; i++ }
    else if (ch === '}' || ch === ']') {
      if (stack.length > 0) {
        const expected = stack[stack.length - 1]
        result += expected !== ch ? (hadMismatch = true, expected) : ch
        stack.pop()
      } else { hadExtra = true }
      i++
    } else { result += ch; i++ }
  }

  if (hadMismatch) changes.push('Fixed mismatched brackets')
  if (hadExtra)   changes.push('Removed extra closing brackets')
  if (stack.length > 0) {
    result += stack.reverse().join('')
    changes.push(`Added ${stack.length} missing closing bracket${stack.length > 1 ? 's' : ''}`)
  }
  return result
}

function repairMultipleRoots(s: string, changes: string[]): string {
  const text = s.trim()
  try { JSON.parse(text); return s } catch { /* */ }

  const roots: string[] = []
  let depth = 0
  let inStr = false
  let start = -1
  let i = 0

  while (i < text.length) {
    const ch = text[i]
    if (inStr) {
      if (ch === '\\' && i + 1 < text.length) { i += 2; continue }
      if (ch === '"') inStr = false
      i++; continue
    }
    if (/\s/.test(ch)) {
      if (depth === 0 && start >= 0 && text[start] !== '{' && text[start] !== '[' && text[start] !== '"') {
        roots.push(text.slice(start, i)); start = -1
      }
      i++; continue
    }
    if (ch === '"') { if (depth === 0 && start < 0) start = i; inStr = true; i++; continue }
    if (ch === '{' || ch === '[') { if (depth === 0) start = i; depth++; i++; continue }
    if (ch === '}' || ch === ']') {
      depth--
      if (depth === 0 && start >= 0) { roots.push(text.slice(start, i + 1)); start = -1 }
      i++; continue
    }
    if (depth === 0 && start < 0) start = i
    i++
  }
  if (start >= 0 && depth === 0) roots.push(text.slice(start))

  if (roots.length > 1) {
    changes.push(`Wrapped ${roots.length} root values in an array`)
    return '[\n' + roots.join(',\n') + '\n]'
  }
  return s
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
