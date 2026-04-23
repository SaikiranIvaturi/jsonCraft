import { useState, useMemo, useCallback } from 'react'
import { Virtuoso } from 'react-virtuoso'
import { ChevronDown, ChevronRight, Search } from 'lucide-react'
import { TreeNode } from './TreeNode'
import { buildJsonTree } from '@/lib/jsonUtils'
import type { TreeNodeData } from '@/types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FlatItem {
  node: TreeNodeData
  isExpanded: boolean
  hasChildren: boolean
}

function flattenTree(
  node: TreeNodeData,
  expandedPaths: Set<string>,
  expandAll: boolean,
  result: FlatItem[] = []
): FlatItem[] {
  const isExpanded = expandAll || expandedPaths.has(node.path)
  const hasChildren = !!(node.children && node.children.length > 0)

  result.push({ node, isExpanded, hasChildren })

  if (isExpanded && node.children) {
    for (const child of node.children) {
      flattenTree(child, expandedPaths, expandAll, result)
    }
  }

  return result
}

function matchesSearch(node: TreeNodeData, query: string): boolean {
  if (!query) return true
  const q = query.toLowerCase()
  const keyStr = String(node.key).toLowerCase()
  if (keyStr.includes(q)) return true
  if (node.type === 'string' && (node.value as string).toLowerCase().includes(q)) return true
  if (node.type === 'number' && String(node.value).includes(q)) return true
  if (node.type === 'boolean' && String(node.value).includes(q)) return true
  return false
}

interface TreeViewProps {
  json: string
  onPathCopy: (path: string) => void
}

export function TreeView({ json, onPathCopy }: TreeViewProps) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['$']))
  const [expandAll, setExpandAll] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const tree = useMemo(() => buildJsonTree(json), [json])

  const flatItems = useMemo((): FlatItem[] => {
    if (!tree) return []
    const items = flattenTree(tree, expandedPaths, expandAll)
    if (!searchQuery) return items
    return items.filter((item) => matchesSearch(item.node, searchQuery))
  }, [tree, expandedPaths, expandAll, searchQuery])

  const toggleExpand = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }, [])

  const handleExpandAll = () => {
    setExpandAll(true)
    setExpandedPaths(new Set())
  }

  const handleCollapseAll = () => {
    setExpandAll(false)
    setExpandedPaths(new Set(['$']))
  }

  if (!tree) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
        <p className="text-sm">Invalid JSON — fix errors to view tree</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border shrink-0">
        <div className="flex items-center gap-1 flex-1 bg-muted rounded-md px-2 h-7">
          <Search className="h-3 w-3 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Search keys and values…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground text-foreground"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-muted-foreground hover:text-foreground text-xs"
            >
              ✕
            </button>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleExpandAll}
          title="Expand all"
          className={cn(expandAll && 'bg-accent')}
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleCollapseAll}
          title="Collapse all"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-hidden py-1">
        {flatItems.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            No matches found
          </div>
        ) : (
          <Virtuoso
            data={flatItems}
            itemContent={(_index, item) => (
              <TreeNode
                node={item.node}
                isExpanded={item.isExpanded}
                onToggle={() => toggleExpand(item.node.path)}
                onPathCopy={onPathCopy}
                searchQuery={searchQuery}
                hasChildren={item.hasChildren}
              />
            )}
            style={{ height: '100%' }}
          />
        )}
      </div>
    </div>
  )
}
