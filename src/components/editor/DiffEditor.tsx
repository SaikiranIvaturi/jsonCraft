import { useEffect, useRef } from 'react'
import {
  DiffEditor as MonacoDiffEditor,
  type BeforeMount,
  type DiffOnMount,
} from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { jsonCraftDark, jsonCraftLight } from '@/lib/monacoTheme'
import { Skeleton } from '@/components/ui/skeleton'
import type { Theme } from '@/types'

interface DiffEditorProps {
  original: string
  modified: string
  onOriginalChange: (value: string) => void
  onModifiedChange: (value: string) => void
  theme: Theme
  renderSideBySide?: boolean
}

function DiffSkeleton() {
  return (
    <div className="flex gap-px h-full">
      <div className="flex-1 flex flex-col gap-3 p-6">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <div className="flex-1 flex flex-col gap-3 p-6">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  )
}

export function DiffEditor({
  original,
  modified,
  onOriginalChange,
  onModifiedChange,
  theme,
  renderSideBySide = true,
}: DiffEditorProps) {
  const diffEditorRef = useRef<editor.IStandaloneDiffEditor | null>(null)
  const monacoRef = useRef<Parameters<BeforeMount>[0] | null>(null)
  const suppressRef = useRef(false)

  const handleBeforeMount: BeforeMount = (monaco) => {
    monacoRef.current = monaco
    monaco.editor.defineTheme('json-craft-dark', jsonCraftDark)
    monaco.editor.defineTheme('json-craft-light', jsonCraftLight)
  }

  const handleMount: DiffOnMount = (diffEditor) => {
    diffEditorRef.current = diffEditor

    const origEditor = diffEditor.getOriginalEditor()
    const modEditor = diffEditor.getModifiedEditor()

    origEditor.onDidChangeModelContent(() => {
      if (!suppressRef.current) {
        onOriginalChange(origEditor.getValue())
      }
    })
    modEditor.onDidChangeModelContent(() => {
      if (!suppressRef.current) {
        onModifiedChange(modEditor.getValue())
      }
    })
  }

  useEffect(() => {
    const diffEditor = diffEditorRef.current
    if (!diffEditor) return
    const origEditor = diffEditor.getOriginalEditor()
    if (origEditor.getValue() !== original) {
      suppressRef.current = true
      origEditor.setValue(original)
      suppressRef.current = false
    }
  }, [original])

  useEffect(() => {
    const diffEditor = diffEditorRef.current
    if (!diffEditor) return
    const modEditor = diffEditor.getModifiedEditor()
    if (modEditor.getValue() !== modified) {
      suppressRef.current = true
      modEditor.setValue(modified)
      suppressRef.current = false
    }
  }, [modified])

  useEffect(() => {
    const monaco = monacoRef.current
    if (!monaco) return
    monaco.editor.setTheme(`json-craft-${theme}`)
  }, [theme])

  return (
    <MonacoDiffEditor
      original={original}
      modified={modified}
      language="json"
      theme={`json-craft-${theme}`}
      beforeMount={handleBeforeMount}
      onMount={handleMount}
      height="100%"
      loading={<DiffSkeleton />}
      options={{
        minimap: { enabled: false },
        fontSize: 13,
        fontFamily: '"JetBrains Mono", "Fira Code", monospace',
        fontLigatures: true,
        renderSideBySide,
        automaticLayout: true,
        scrollBeyondLastLine: false,
        padding: { top: 16, bottom: 16 },
        scrollbar: {
          verticalScrollbarSize: 6,
          horizontalScrollbarSize: 6,
          useShadows: false,
        },
        overviewRulerBorder: false,
        originalEditable: true,
        fixedOverflowWidgets: true,
      }}
    />
  )
}
