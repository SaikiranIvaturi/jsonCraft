import { ChevronRight, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import type { TreeNodeData } from '@/types'
import { cn } from '@/lib/utils'
import { formatNumber } from '@/lib/jsonUtils'

interface TreeNodeProps {
  node: TreeNodeData
  isExpanded: boolean
  onToggle: () => void
  onPathCopy: (path: string) => void
  searchQuery: string
  hasChildren: boolean
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-primary/30 text-foreground rounded-sm px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}

function formatValue(node: TreeNodeData, isExpanded: boolean): React.ReactNode {
  const { type, value, size } = node

  if (type === 'array') {
    if (isExpanded) return <span className="text-muted-foreground text-xs">[</span>
    return (
      <span className="text-muted-foreground text-xs">
        [{size} {size === 1 ? 'item' : 'items'}]
      </span>
    )
  }

  if (type === 'object') {
    if (isExpanded) return <span className="text-muted-foreground text-xs">{'{'}</span>
    return (
      <span className="text-muted-foreground text-xs">
        {'{'}
        {size} {size === 1 ? 'key' : 'keys'}
        {'}'}
      </span>
    )
  }

  if (type === 'null') {
    return <span className="text-zinc-400 italic text-xs">null</span>
  }

  if (type === 'boolean') {
    return (
      <span className={cn('text-xs font-medium', value ? 'text-violet-400' : 'text-red-400')}>
        {String(value)}
      </span>
    )
  }

  if (type === 'number') {
    const num = value as number
    return (
      <span className="text-yellow-500 dark:text-yellow-400 text-xs font-mono">
        {Number.isInteger(num) && Math.abs(num) >= 1000 ? formatNumber(num) : String(num)}
      </span>
    )
  }

  if (type === 'string') {
    const str = value as string
    const display = str.length > 60 ? str.slice(0, 60) + '…' : str
    return (
      <span className="text-green-600 dark:text-green-400 text-xs font-mono">
        &ldquo;{display}&rdquo;
      </span>
    )
  }

  return null
}

function typeBadge(type: TreeNodeData['type'], size?: number): React.ReactNode {
  if (type === 'array') {
    return <Badge variant="array">array[{size}]</Badge>
  }
  if (type === 'object') {
    return <Badge variant="object">object{'{' + size + '}'}</Badge>
  }
  return <Badge variant={type}>{type}</Badge>
}

export function TreeNode({
  node,
  isExpanded,
  onToggle,
  onPathCopy,
  searchQuery,
  hasChildren,
}: TreeNodeProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyPath = (e: React.MouseEvent) => {
    e.stopPropagation()
    onPathCopy(node.path)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const indent = node.depth * 20

  const isRoot = node.depth === 0
  const keyDisplay = isRoot
    ? 'root'
    : typeof node.key === 'number'
      ? `[${node.key}]`
      : node.key

  const isClosingBrace =
    (node.type === 'array' || node.type === 'object') && isExpanded

  return (
    <div
      className="group flex items-center gap-1 py-0.5 px-2 hover:bg-accent/50 rounded-sm cursor-default select-none"
      style={{ paddingLeft: `${indent + 8}px` }}
    >
      {/* Expand/collapse toggle */}
      <button
        onClick={hasChildren ? onToggle : undefined}
        className={cn(
          'flex-shrink-0 h-4 w-4 flex items-center justify-center rounded-sm transition-colors',
          hasChildren
            ? 'hover:bg-accent cursor-pointer text-muted-foreground hover:text-foreground'
            : 'cursor-default text-transparent'
        )}
        aria-label={isExpanded ? 'Collapse' : 'Expand'}
      >
        {hasChildren && (
          <ChevronRight
            className={cn('h-3 w-3 transition-transform duration-150', isExpanded && 'rotate-90')}
          />
        )}
      </button>

      {/* Key */}
      <span className="text-sky-600 dark:text-sky-400 text-xs font-mono shrink-0">
        {highlight(String(keyDisplay), searchQuery)}
      </span>

      {!isRoot && (
        <span className="text-muted-foreground text-xs shrink-0 mr-1">:</span>
      )}

      {/* Value or type */}
      <span className="flex-1 min-w-0">
        {isClosingBrace ? null : formatValue(node, isExpanded)}
      </span>

      {/* Type badge — show on hover */}
      <span className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {typeBadge(node.type, node.size)}
      </span>

      {/* Copy path button */}
      <button
        onClick={handleCopyPath}
        className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 h-5 w-5 flex items-center justify-center rounded-sm hover:bg-accent text-muted-foreground hover:text-foreground"
        title={`Copy JSONPath: ${node.path}`}
      >
        {copied ? (
          <Check className="h-3 w-3 text-green-500" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </button>
    </div>
  )
}
