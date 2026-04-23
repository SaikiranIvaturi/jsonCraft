import { useState, useCallback } from "react";
import { Toaster, toast } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TopNav } from "@/components/TopNav";
import { InfoPanel } from "@/components/InfoPanel";
import { useState as useMobileState } from "react";
import { CommandMenu } from "@/components/CommandMenu";
import { ShareDialog } from "@/components/ShareDialog";
import { AnalyzeDialog } from "@/components/AnalyzeDialog";
import { SplashScreen } from "@/components/SplashScreen";
import { EmptyState } from "@/components/EmptyState";
import { JsonEditor } from "@/components/editor/JsonEditor";
import { DiffEditor } from "@/components/editor/DiffEditor";
import { TreeView } from "@/components/editor/TreeView";
import { useTheme } from "@/hooks/useTheme";
import { useJsonFormat } from "@/hooks/useJsonFormat";
import { useUrlSharing } from "@/hooks/useUrlSharing";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useJsonValidation } from "@/hooks/useJsonValidation";
import {
  prepareForDiff,
  computeDiffStats,
  computeDiffDetails,
} from "@/lib/jsonUtils";
import { EXAMPLES } from "@/lib/examples";
import { isMac } from "@/lib/utils";
import type { Mode, ViewMode, IndentStyle } from "@/types";
import {
  Plus,
  Minus,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Trash2,
} from "lucide-react";

const STORAGE_KEY = "json-craft-json";

function loadStoredJson(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function saveStoredJson(json: string) {
  try {
    localStorage.setItem(STORAGE_KEY, json);
  } catch {
    // storage might be full
  }
}

function formatDiffValue(val: unknown): string {
  if (val === null) return "null";
  if (typeof val === "string") {
    const s = JSON.stringify(val);
    return s.length > 60 ? s.slice(0, 60) + '…"' : s;
  }
  if (typeof val === "object") {
    const s = JSON.stringify(val);
    return s.length > 60 ? s.slice(0, 60) + "…}" : s;
  }
  return String(val);
}

export default function App() {
  const { theme, toggle: toggleTheme } = useTheme();
  const { format } = useJsonFormat();

  const [json, setJson] = useState<string>(() => loadStoredJson());
  const [mode, setMode] = useState<Mode>("format");
  const [viewMode, setViewMode] = useState<ViewMode>("code");
  const [indent, setIndent] = useState<IndentStyle>(2);
  const [sortKeys, setSortKeys] = useState(false);
  const [diffLeft, setDiffLeft] = useState("");
  const [diffRight, setDiffRight] = useState("");
  const [strictDiff, setStrictDiff] = useState(false);
  const [showDiffSummary, setShowDiffSummary] = useState(true);
  const [commandMenuOpen, setCommandMenuOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [analyzeDialogOpen, setAnalyzeDialogOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  const validationResult = useJsonValidation(json);

  // Persist JSON to localStorage
  const handleJsonChange = useCallback((value: string) => {
    setJson(value);
    saveStoredJson(value);
  }, []);

  // Format action
  const handleFormat = useCallback(() => {
    if (!json.trim() || !validationResult.valid) return;
    const formatted = format(json, indent, sortKeys);
    handleJsonChange(formatted);
    toast.success("JSON formatted");
  }, [
    json,
    validationResult.valid,
    format,
    indent,
    sortKeys,
    handleJsonChange,
  ]);

  // Handle command menu actions
  const handleCommandAction = useCallback(
    (action: string) => {
      if (action === "format") {
        handleFormat();
      } else if (action === "validate") {
        setMode("validate");
      } else if (action === "diff") {
        setMode("diff");
        if (!diffLeft && json) setDiffLeft(json);
      } else if (action === "tree") {
        setMode("tree");
      } else if (action === "clear") {
        handleJsonChange("");
        toast.success("Editor cleared");
      } else if (action === "copy") {
        navigator.clipboard
          .writeText(json)
          .then(() => {
            toast.success("Copied to clipboard");
          })
          .catch(() => {
            toast.error("Failed to copy");
          });
      } else if (action === "download") {
        const blob = new Blob([json], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "jsoncraft.json";
        a.click();
        URL.revokeObjectURL(a.href);
        toast.success("Downloaded jsoncraft.json");
      } else if (action === "share") {
        setShareDialogOpen(true);
      } else if (action === "analyze") {
        setAnalyzeDialogOpen(true);
      } else if (action === "toggle-theme") {
        toggleTheme();
      } else if (action.startsWith("example-")) {
        const key = action.slice("example-".length);
        const example = EXAMPLES[key];
        if (example) {
          handleJsonChange(example.json);
          toast.success(`Loaded: ${example.label}`);
        }
      }
    },
    [handleFormat, json, diffLeft, handleJsonChange, toggleTheme],
  );

  // URL sharing
  const handleShareLoad = useCallback(
    (loaded: string) => {
      handleJsonChange(loaded);
      toast.success("JSON loaded from URL");
    },
    [handleJsonChange],
  );

  useUrlSharing(handleShareLoad);

  // Keyboard shortcuts
  const handleDiff = useCallback(() => {
    setMode("diff");
    if (!diffLeft && json) setDiffLeft(json);
  }, [diffLeft, json]);

  const handleTree = useCallback(() => setMode("tree"), []);
  const handleShare = useCallback(() => setShareDialogOpen(true), []);
  const handleAnalyze = useCallback(() => setAnalyzeDialogOpen(true), []);
  const handleCommandMenu = useCallback(() => setCommandMenuOpen(true), []);

  useKeyboardShortcuts({
    onFormat: handleFormat,
    onCommandMenu: handleCommandMenu,
    onDiff: handleDiff,
    onTree: handleTree,
    onShare: handleShare,
    onAnalyze: handleAnalyze,
  });

  const handlePathCopy = useCallback((path: string) => {
    navigator.clipboard
      .writeText(path)
      .then(() => {
        toast.success(`Copied: ${path}`);
      })
      .catch(() => {
        toast.error("Failed to copy path");
      });
  }, []);

  // Diff stats
  const preparedLeft =
    mode === "diff" && diffLeft ? prepareForDiff(diffLeft, strictDiff) : "";
  const preparedRight =
    mode === "diff" && diffRight ? prepareForDiff(diffRight, strictDiff) : "";

  const diffStats =
    mode === "diff" && diffLeft && diffRight
      ? computeDiffStats(preparedLeft, preparedRight)
      : null;

  const diffDetails =
    mode === "diff" && diffLeft && diffRight
      ? computeDiffDetails(preparedLeft, preparedRight)
      : [];

  const isEmpty = !json.trim();
  const showEmptyState = isEmpty && mode !== "diff";

  return (
    <TooltipProvider delayDuration={400}>
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
      <div className="flex flex-col h-full bg-background text-foreground overflow-hidden">
        <TopNav
          mode={mode}
          onModeChange={setMode}
          onShare={() => setShareDialogOpen(true)}
          onCommandMenu={() => setCommandMenuOpen(true)}
          theme={theme}
          onThemeToggle={toggleTheme}
        />

        <main className="flex-1 overflow-hidden flex">
          {mode === "diff" ? (
            /* Diff mode — full width with stats bar */
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Diff controls & stats */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/50 text-xs shrink-0">
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground font-medium">
                    JSON Diff
                  </span>
                  <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                    <input
                      type="checkbox"
                      checked={strictDiff}
                      onChange={(e) => setStrictDiff(e.target.checked)}
                      className="h-3 w-3 accent-primary"
                    />
                    Strict order
                  </label>
                  <button
                    onClick={() => {
                      setDiffLeft("");
                      setDiffRight("");
                    }}
                    disabled={!diffLeft && !diffRight}
                    className="flex items-center gap-1 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="h-3 w-3" />
                    Clear
                  </button>
                </div>
                {diffStats && (
                  <div className="flex items-center gap-3">
                    {diffStats.additions > 0 && (
                      <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <Plus className="h-3 w-3" />
                        {diffStats.additions} added
                      </span>
                    )}
                    {diffStats.deletions > 0 && (
                      <span className="flex items-center gap-1 text-red-500">
                        <Minus className="h-3 w-3" />
                        {diffStats.deletions} removed
                      </span>
                    )}
                    {diffStats.modifications > 0 && (
                      <span className="flex items-center gap-1 text-yellow-500">
                        <RefreshCw className="h-3 w-3" />
                        {diffStats.modifications} changed
                      </span>
                    )}
                    {diffStats.additions === 0 &&
                      diffStats.deletions === 0 &&
                      diffStats.modifications === 0 &&
                      diffLeft &&
                      diffRight && (
                        <span className="text-green-600 dark:text-green-400">
                          ✓ No differences
                        </span>
                      )}
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <DiffEditor
                  original={diffLeft}
                  modified={diffRight}
                  onOriginalChange={setDiffLeft}
                  onModifiedChange={setDiffRight}
                  theme={theme}
                />
              </div>

              {/* Diff summary panel */}
              {diffDetails.length > 0 && (
                <div className="border-t border-border bg-card/30 shrink-0">
                  <button
                    className="flex items-center justify-between w-full px-4 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowDiffSummary((v) => !v)}
                  >
                    <span className="font-medium">Changes Summary</span>
                    <div className="flex items-center gap-2">
                      <span>
                        {diffDetails.length} change
                        {diffDetails.length !== 1 ? "s" : ""}
                      </span>
                      {showDiffSummary ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronUp className="h-3 w-3" />
                      )}
                    </div>
                  </button>
                  {showDiffSummary && (
                    <div className="max-h-40 overflow-y-auto px-4 pb-3 flex flex-col gap-0.5">
                      {diffDetails.slice(0, 100).map((change, i) => (
                        <div
                          key={i}
                          className="flex items-baseline gap-2 text-xs font-mono py-0.5 min-w-0"
                        >
                          {change.type === "added" && (
                            <>
                              <span className="text-green-500 shrink-0">+</span>
                              <span className="text-muted-foreground shrink-0 truncate max-w-[40%]">
                                {change.path}
                              </span>
                              <span className="text-green-500 truncate">
                                {formatDiffValue(change.newValue)}
                              </span>
                            </>
                          )}
                          {change.type === "removed" && (
                            <>
                              <span className="text-red-500 shrink-0">−</span>
                              <span className="text-muted-foreground shrink-0 truncate max-w-[40%]">
                                {change.path}
                              </span>
                              <span className="text-red-500 truncate">
                                {formatDiffValue(change.oldValue)}
                              </span>
                            </>
                          )}
                          {change.type === "changed" && (
                            <>
                              <span className="text-yellow-500 shrink-0">
                                ~
                              </span>
                              <span className="text-muted-foreground shrink-0 truncate max-w-[30%]">
                                {change.path}
                              </span>
                              <span className="text-red-400 line-through truncate">
                                {formatDiffValue(change.oldValue)}
                              </span>
                              <span className="text-muted-foreground shrink-0">
                                →
                              </span>
                              <span className="text-green-400 truncate">
                                {formatDiffValue(change.newValue)}
                              </span>
                            </>
                          )}
                        </div>
                      ))}
                      {diffDetails.length > 100 && (
                        <div className="text-xs text-muted-foreground py-0.5">
                          …and {diffDetails.length - 100} more changes
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Format / Validate / Tree modes */
            <div className="flex-1 overflow-hidden flex">
              {/* Editor / Tree area */}
              <div className="flex-1 min-w-0 overflow-hidden relative">
                {mode === "tree" && viewMode === "tree" ? (
                  showEmptyState ? (
                    <EmptyState onLoadExample={handleJsonChange} />
                  ) : (
                    <TreeView json={json} onPathCopy={handlePathCopy} />
                  )
                ) : (
                  <>
                    <JsonEditor
                      value={json}
                      onChange={handleJsonChange}
                      validationError={validationResult.error ?? null}
                      theme={theme}
                    />
                    {showEmptyState && (
                      <div className="absolute inset-0 pointer-events-none">
                        <EmptyState onLoadExample={handleJsonChange} />
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Responsive Info panel */}
              {(() => {
                const [showMobilePanel, setShowMobilePanel] = useMobileState(false);
                return (
                  <>
                    {/* Desktop sidebar */}
                    <div className="hidden md:block">
                      <InfoPanel
                        json={json}
                        mode={mode}
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                        indent={indent}
                        onIndentChange={setIndent}
                        sortKeys={sortKeys}
                        onSortKeysChange={setSortKeys}
                        onFormat={handleFormat}
                        onClear={() => handleJsonChange("")}
                      />
                    </div>
                    {/* Mobile bottom sheet */}
                    <>
                      <button
                        className="fixed bottom-4 right-4 z-40 md:hidden bg-primary text-primary-foreground rounded-full shadow-lg px-4 py-2 text-xs font-semibold"
                        onClick={() => setShowMobilePanel(true)}
                        aria-label="Show info panel"
                      >
                        Info & Actions
                      </button>
                      {showMobilePanel && (
                        <div className="fixed inset-0 z-50 flex flex-col md:hidden">
                          <div className="flex-1 bg-black/40" onClick={() => setShowMobilePanel(false)} />
                          <div className="bg-card border-t border-border rounded-t-2xl shadow-2xl p-2 max-h-[70vh] overflow-y-auto animate-slideInUp">
                            <div className="flex justify-end mb-2">
                              <button
                                className="text-xs text-muted-foreground px-2 py-1 rounded hover:bg-muted"
                                onClick={() => setShowMobilePanel(false)}
                              >
                                Close
                              </button>
                            </div>
                            <InfoPanel
                              json={json}
                              mode={mode}
                              viewMode={viewMode}
                              onViewModeChange={setViewMode}
                              indent={indent}
                              onIndentChange={setIndent}
                              sortKeys={sortKeys}
                              onSortKeysChange={setSortKeys}
                              onFormat={handleFormat}
                              onClear={() => handleJsonChange("")}
                            />
                          </div>
                        </div>
                      )}
                    </>
                  </>
                );
              })()}
            </div>
          )}
        </main>

        {/* Bottom bar */}
        <footer className="h-7 border-t border-border flex items-center justify-between px-4 bg-card/50 shrink-0">
          <p className="text-xs text-muted-foreground/60">
            🔒 Privacy: all processing happens in your browser
          </p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground/60 font-mono">
            <span>{isMac ? "⌘K" : "Ctrl+K"} commands</span>
            <span>{isMac ? "⌘⇧F" : "Ctrl+Shift+F"} format</span>
            <span>{isMac ? "⌘D" : "Ctrl+D"} diff</span>
            <span>{isMac ? "⌘T" : "Ctrl+T"} tree</span>
          </div>
        </footer>

        {/* Modals */}
        <CommandMenu
          open={commandMenuOpen}
          onOpenChange={setCommandMenuOpen}
          onAction={handleCommandAction}
          theme={theme}
        />

        <ShareDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          json={json}
        />

        <AnalyzeDialog
          open={analyzeDialogOpen}
          onOpenChange={setAnalyzeDialogOpen}
          json={json}
        />

        <Toaster
          position="bottom-right"
          theme={theme}
          toastOptions={{
            style: {
              background: "var(--popover)",
              color: "var(--popover-foreground)",
              border: "1px solid var(--border)",
              fontSize: "13px",
            },
          }}
        />
      </div>
    </TooltipProvider>
  );
}
