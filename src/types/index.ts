export type Mode = 'format' | 'validate' | 'diff' | 'tree'
export type ViewMode = 'code' | 'tree'
export type IndentStyle = 2 | 4 | 'tab'
export type Theme = 'dark' | 'light'

export interface ValidationError {
  message: string
  line: number
  column: number
  friendly: string
}

export interface ValidationResult {
  valid: boolean
  error?: ValidationError
  stats?: JsonStats
}

export interface JsonStats {
  chars: number
  lines: number
  sizeKb: number
  rootKeys: number
}

export interface DiffStats {
  additions: number
  deletions: number
  modifications: number
}

export interface DiffChange {
  path: string
  type: 'added' | 'removed' | 'changed'
  oldValue?: unknown
  newValue?: unknown
}

export interface TreeNodeData {
  key: string | number
  value: unknown
  path: string
  pathSegments: (string | number)[]
  depth: number
  type: 'string' | 'number' | 'boolean' | 'null' | 'array' | 'object'
  children?: TreeNodeData[]
  size?: number
}

export interface JsonAnalysis {
  rootType: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null'
  totalNodes: number
  maxDepth: number
  typeCounts: {
    objects: number
    arrays: number
    strings: number
    numbers: number
    booleans: number
    nulls: number
  }
  uniqueKeys: number
  totalKeys: number
  mostCommonKeys: Array<{ key: string; count: number }>
  arrayStats: { min: number; max: number; avg: number; total: number } | null
  emptyValues: { emptyStrings: number; emptyArrays: number; emptyObjects: number; nulls: number }
}
