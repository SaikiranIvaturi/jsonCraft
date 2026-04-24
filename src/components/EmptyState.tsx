import { useState, useEffect } from 'react'
import { Sparkles, Wand2, GitCompare, TreePine, Minimize2, Upload, Layers } from 'lucide-react'
import { shortcut } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EXAMPLES } from '@/lib/examples'

const HINTS = [
  { icon: Wand2, label: 'Format & Minify', color: 'text-primary' },
  { icon: GitCompare, label: 'Diff', color: 'text-sky-500' },
  { icon: TreePine, label: 'Tree View', color: 'text-emerald-500' },
  { icon: Minimize2, label: 'Minify', color: 'text-orange-500' },
  { icon: Upload, label: 'Drag & Drop', color: 'text-pink-500' },
  { icon: Layers, label: 'Multi-tab', color: 'text-indigo-500' },
]

interface EmptyStateProps {
  onLoadExample: (json: string) => void
}

const PHRASES = [
  '{ "paste": "your json here" }',
  '[ { "hello": "world" } ]',
  '{ "or": "load an example ↓" }',
]

function TypewriterHint() {
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [phase, setPhase] = useState<'typing' | 'pause' | 'erasing'>('typing')

  useEffect(() => {
    const text = PHRASES[phraseIndex]

    if (phase === 'typing') {
      if (displayed.length < text.length) {
        const t = setTimeout(() => setDisplayed(text.slice(0, displayed.length + 1)), 55)
        return () => clearTimeout(t)
      } else {
        const t = setTimeout(() => setPhase('pause'), 1800)
        return () => clearTimeout(t)
      }
    }

    if (phase === 'pause') {
      const t = setTimeout(() => setPhase('erasing'), 400)
      return () => clearTimeout(t)
    }

    if (phase === 'erasing') {
      if (displayed.length > 0) {
        const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 25)
        return () => clearTimeout(t)
      } else {
        setPhraseIndex((i) => (i + 1) % PHRASES.length)
        setPhase('typing')
      }
    }
  }, [displayed, phase, phraseIndex])

  return (
    <span
      className="font-mono text-[13px] text-muted-foreground/40 pointer-events-none select-none"
      style={{ fontFamily: '"JetBrains Mono", "Fira Code", monospace' }}
    >
      {displayed}
      <span
        className="inline-block w-[1px] h-[14px] ml-[1px] align-middle bg-muted-foreground/40"
        style={{ animation: 'blink-caret 1s step-end infinite' }}
      />
    </span>
  )
}

export function EmptyState({ onLoadExample }: EmptyStateProps) {
  return (
    <div className="relative h-full select-none pointer-events-none">
      {/* Centered load example button with typewriter hint above it */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <TypewriterHint />

        <div className="pointer-events-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Load an example
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              {Object.entries(EXAMPLES).map(([key, { label, json }]) => (
                <DropdownMenuItem key={key} onClick={() => onLoadExample(json)}>
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <p className="hidden sm:block text-xs text-muted-foreground/50">
          {shortcut('K')} for commands · {shortcut('F', true)} to format
        </p>

        {/* Capability hints */}
        <div className="hidden sm:flex items-center gap-3 mt-4 flex-wrap justify-center">
          {HINTS.map(({ icon: Icon, label, color }) => (
            <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground/40 select-none">
              <Icon className={`h-3 w-3 ${color} opacity-60`} />
              <span>{label}</span>
            </div>
          ))}
        </div>
        <p className="hidden sm:block text-[11px] text-muted-foreground/30 mt-1">
          Press <kbd className="font-mono">?</kbd> in the toolbar to see all features
        </p>
      </div>
    </div>
  )
}
