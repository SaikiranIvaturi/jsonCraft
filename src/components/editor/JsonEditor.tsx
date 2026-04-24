import { useEffect, useRef } from "react";
import Editor, { type BeforeMount, type OnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { jsonCraftDark, jsonCraftLight } from "@/lib/monacoTheme";
import { Skeleton } from "@/components/ui/skeleton";
import type { ValidationError, Theme } from "@/types";

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  validationError?: ValidationError | null;
  theme: Theme;
  readOnly?: boolean;
  onEditorReady?: (editorInstance: editor.IStandaloneCodeEditor) => void;
}

function EditorSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-6 h-full">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-4 w-3/5" />
    </div>
  );
}

export function JsonEditor({
  value,
  onChange,
  validationError,
  theme,
  readOnly = false,
  onEditorReady,
}: JsonEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Parameters<BeforeMount>[0] | null>(null);

  const handleBeforeMount: BeforeMount = (monaco) => {
    monacoRef.current = monaco;
    monaco.editor.defineTheme("json-craft-dark", jsonCraftDark);
    monaco.editor.defineTheme("json-craft-light", jsonCraftLight);
  };

  const handleMount: OnMount = (editorInstance, monaco) => {
    editorRef.current = editorInstance;
    onEditorReady?.(editorInstance);

    // Monaco captures Ctrl+K (chord), Ctrl+D (find next), Ctrl+Shift+F (format document)
    // before they can bubble to our window listener. Override them to dispatch custom
    // events that useKeyboardShortcuts picks up regardless of where focus is.
    const fire = (name: string) => () =>
      window.dispatchEvent(new CustomEvent(`jsoncraft:${name}`));

    editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, fire("cmd-k"));
    editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyD, fire("cmd-d"));
    editorInstance.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF,
      fire("cmd-shift-f"),
    );
    editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyT, fire("cmd-t"));
    editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, fire("cmd-s"));
  };

  useEffect(() => {
    const monaco = monacoRef.current;
    const editorInstance = editorRef.current;
    if (!monaco || !editorInstance) return;

    const model = editorInstance.getModel();
    if (!model) return;

    if (validationError) {
      const maxCol = model.getLineMaxColumn(validationError.line);
      monaco.editor.setModelMarkers(model, "jsoncraft", [
        {
          startLineNumber: validationError.line,
          startColumn: validationError.column,
          endLineNumber: validationError.line,
          endColumn: Math.max(validationError.column + 1, maxCol),
          message: validationError.friendly,
          severity: monaco.MarkerSeverity.Error,
        },
      ]);
    } else {
      monaco.editor.setModelMarkers(model, "jsoncraft", []);
    }
  }, [validationError]);

  useEffect(() => {
    const monaco = monacoRef.current;
    if (!monaco) return;
    monaco.editor.setTheme(`json-craft-${theme}`);
  }, [theme]);

  return (
    <Editor
      value={value}
      onChange={(v) => onChange(v ?? "")}
      language="json"
      theme={`json-craft-${theme}`}
      beforeMount={handleBeforeMount}
      onMount={handleMount}
      height="100%"
      loading={<EditorSkeleton />}
      options={{
        minimap: { enabled: false },
        fontSize: 13,
        fontFamily: '"JetBrains Mono", "Fira Code", monospace',
        fontLigatures: true,
        lineNumbers: "on",
        renderLineHighlight: "line",
        scrollBeyondLastLine: false,
        wordWrap: "on",
        tabSize: 2,
        automaticLayout: true,
        padding: { top: 16, bottom: 16 },
        scrollbar: {
          verticalScrollbarSize: 6,
          horizontalScrollbarSize: 6,
          useShadows: false,
          alwaysConsumeMouseWheel: false,
        },
        overviewRulerBorder: false,
        hideCursorInOverviewRuler: true,
        readOnly,
        domReadOnly: readOnly,
        fixedOverflowWidgets: true,
        bracketPairColorization: { enabled: true },
      }}
    />
  );
}
