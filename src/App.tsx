import { useState, useCallback, useEffect, useRef } from "react";
import { Toaster, toast } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { TopNav } from "@/components/TopNav";
import { TabBar } from "@/components/TabBar";
import { InfoPanel } from "@/components/InfoPanel";
import { CommandMenu } from "@/components/CommandMenu";
import { ShareDialog } from "@/components/ShareDialog";
import { AnalyzeDialog } from "@/components/AnalyzeDialog";
import { FeaturesDialog } from "@/components/FeaturesDialog";
import { AboutDialog } from "@/components/AboutDialog";
import { JsonToTsDialog } from "@/components/JsonToTsDialog";
import { JsonPathDialog } from "@/components/JsonPathDialog";
import { JsonCsvDialog } from "@/components/JsonCsvDialog";
import { JsonYamlDialog } from "@/components/JsonYamlDialog";
import { JsonSchemaDialog } from "@/components/JsonSchemaDialog";
import { OnboardingTour, ONBOARDED_KEY } from "@/components/OnboardingTour";
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
import { isMac, cn } from "@/lib/utils";
import type { Mode, ViewMode, IndentStyle, Tab } from "@/types";
import type { editor as MonacoEditor } from "monaco-editor";
import {
  Plus,
  Minus,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Trash2,
  Copy,
  Check,
  Wand2,
  SlidersHorizontal,
  Upload,
  Code2,
  Search,
  Table,
  FileText,
  Braces,
  Share2,
  BarChart2,
} from "lucide-react";

const TABS_KEY = "json-craft-tabs";
const ACTIVE_TAB_KEY = "json-craft-active-tab";
const LEGACY_KEY = "json-craft-json";

function makeTab(name: string, json = ""): Tab {
  return { id: `tab-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name, json };
}

function loadInitialTabs(): { tabs: Tab[]; activeId: string } {
  try {
    const stored = localStorage.getItem(TABS_KEY);
    if (stored) {
      const tabs = JSON.parse(stored) as Tab[];
      if (Array.isArray(tabs) && tabs.length > 0) {
        const savedActive = localStorage.getItem(ACTIVE_TAB_KEY) ?? "";
        const activeId = tabs.some((t) => t.id === savedActive) ? savedActive : tabs[0].id;
        return { tabs, activeId };
      }
    }
  } catch { /* fall through */ }

  // Migrate from legacy single-json storage
  try {
    const legacy = localStorage.getItem(LEGACY_KEY) ?? "";
    const tab = makeTab("Tab 1", legacy);
    return { tabs: [tab], activeId: tab.id };
  } catch {
    const tab = makeTab("Tab 1");
    return { tabs: [tab], activeId: tab.id };
  }
}

function saveTabs(tabs: Tab[], activeId: string) {
  try {
    localStorage.setItem(TABS_KEY, JSON.stringify(tabs));
    localStorage.setItem(ACTIVE_TAB_KEY, activeId);
  } catch { /* storage might be full */ }
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
  const monacoEditorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);

  // ── Tabs state ──────────────────────────────────────────────────────────
  const [tabs, setTabs] = useState<Tab[]>(() => loadInitialTabs().tabs);
  const [activeTabId, setActiveTabId] = useState<string>(() => loadInitialTabs().activeId);

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];
  const json = activeTab?.json ?? "";
  const mode: Mode = activeTab?.mode ?? "format";

  const handleModeChange = useCallback((newMode: Mode) => {
    if (newMode === "tree") {
      setViewMode("tree");
    }
    setTabs((prev) =>
      prev.map((t) => {
        if (t.id !== activeTabId) return t;
        // Auto-format JSON when entering tree mode so the tree renders clean JSON
        if (newMode === "tree" && t.json.trim()) {
          try {
            const parsed = JSON.parse(t.json);
            return { ...t, mode: newMode, json: JSON.stringify(parsed, null, 2) };
          } catch { /* invalid JSON — leave as-is */ }
        }
        return { ...t, mode: newMode };
      }),
    );
  }, [activeTabId]);

  // Persist tabs whenever they change
  useEffect(() => {
    saveTabs(tabs, activeTabId);
  }, [tabs, activeTabId]);

  const handleJsonChange = useCallback(
    (value: string) => {
      setTabs((prev) => prev.map((t) => (t.id === activeTabId ? { ...t, json: value } : t)));
    },
    [activeTabId],
  );

  const handleTabSelect = useCallback((id: string) => {
    setActiveTabId(id);
  }, []);

  const handleTabNew = useCallback(() => {
    setTabs((prev) => {
      if (prev.length >= 5) return prev;
      const tab = makeTab(`Tab ${prev.length + 1}`);
      setActiveTabId(tab.id);
      return [...prev, tab];
    });
  }, []);

  const handleTabClose = useCallback(
    (id: string) => {
      setTabs((prev) => {
        if (prev.length <= 1) return prev;
        const idx = prev.findIndex((t) => t.id === id);
        const next = prev.filter((t) => t.id !== id);
        if (id === activeTabId) {
          const newActive = next[Math.max(0, idx - 1)] ?? next[0];
          setActiveTabId(newActive.id);
        }
        // Renumber tabs that still carry a default "Tab N" name
        let counter = 1;
        return next.map((t) => (/^Tab \d+$/.test(t.name) ? { ...t, name: `Tab ${counter++}` } : t));
      });
    },
    [activeTabId],
  );

  const handleTabRename = useCallback((id: string, name: string) => {
    setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, name } : t)));
  }, []);

  // ── Other state ─────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>("code");

  const handleViewModeChange = useCallback((newViewMode: ViewMode) => {
    setViewMode(newViewMode);
    if (newViewMode === "tree" && json.trim()) {
      try {
        const formatted = JSON.stringify(JSON.parse(json), null, 2);
        if (formatted !== json) handleJsonChange(formatted);
      } catch { /* invalid JSON — tree will show its own error state */ }
    }
  }, [json, handleJsonChange]);
  const [indent, setIndent] = useState<IndentStyle>(2);
  const [sortKeys, setSortKeys] = useState(false);
  const [diffLeft, setDiffLeft] = useState("");
  const [diffRight, setDiffRight] = useState("");
  const [strictDiff, setStrictDiff] = useState(false);
  const [showDiffSummary, setShowDiffSummary] = useState(true);
  const [commandMenuOpen, setCommandMenuOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [analyzeDialogOpen, setAnalyzeDialogOpen] = useState(false);
  const [featuresDialogOpen, setFeaturesDialogOpen] = useState(false);
  const [aboutDialogOpen, setAboutDialogOpen] = useState(false);
  const [jsonToTsOpen, setJsonToTsOpen] = useState(false);
  const [jsonPathOpen, setJsonPathOpen] = useState(false);
  const [jsonCsvOpen, setJsonCsvOpen] = useState(false);
  const [jsonYamlOpen, setJsonYamlOpen] = useState(false);
  const [jsonSchemaOpen, setJsonSchemaOpen] = useState(false);
  const [showMobilePanel, setShowMobilePanel] = useState(false);
  const [renderSideBySide, setRenderSideBySide] = useState(() => window.innerWidth >= 640);
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem(ONBOARDED_KEY),
  );
  const [mobileCopied, setMobileCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const handler = () => setRenderSideBySide(window.innerWidth >= 640);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // ── Monaco editor ready ─────────────────────────────────────────────────
  const handleEditorReady = useCallback((editorInstance: MonacoEditor.IStandaloneCodeEditor) => {
    monacoEditorRef.current = editorInstance;
  }, []);

  // ── Validation ──────────────────────────────────────────────────────────
  const validationResult = useJsonValidation(json);

  // ── Format ──────────────────────────────────────────────────────────────
  const handleFormat = useCallback(() => {
    if (!json.trim() || !validationResult.valid) return;
    handleJsonChange(format(json, indent, sortKeys));
    toast.success("JSON formatted");
  }, [json, validationResult.valid, format, indent, sortKeys, handleJsonChange]);

  // ── Minify ──────────────────────────────────────────────────────────────
  const handleMinify = useCallback(() => {
    if (!json.trim() || !validationResult.valid) return;
    try {
      const minified = JSON.stringify(JSON.parse(json));
      const savedBytes = json.length - minified.length;
      const savedKb = Math.abs(savedBytes / 1024).toFixed(1);
      handleJsonChange(minified);
      if (savedBytes > 0) {
        toast.success(`Minified — saved ${savedKb} KB`);
      } else {
        toast.success("Already minified");
      }
    } catch {
      toast.error("Failed to minify");
    }
  }, [json, validationResult.valid, handleJsonChange]);

  // ── Drag-and-drop ────────────────────────────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (!file) return;
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      if (!["json", "txt", "log", ""].includes(ext)) {
        toast.error(`Unsupported file: .${ext}. Drop .json, .txt, or .log`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = (ev.target?.result as string) ?? "";
        if (ext === "json") {
          handleJsonChange(content);
          toast.success(`Loaded: ${file.name}`);
          return;
        }
        // For .txt / .log: try parsing directly first, then extract JSON block
        try {
          JSON.parse(content);
          handleJsonChange(content);
          toast.success(`Loaded JSON from: ${file.name}`);
          return;
        } catch { /* not pure JSON */ }
        const m = content.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
        if (m) {
          try {
            JSON.parse(m[0]);
            handleJsonChange(m[0]);
            toast.success(`Extracted JSON from: ${file.name}`);
            return;
          } catch { /* fall through */ }
        }
        handleJsonChange(content);
        toast.success(`Loaded: ${file.name}`);
      };
      reader.onerror = () => toast.error("Failed to read file");
      reader.readAsText(file);
    },
    [handleJsonChange],
  );

  // ── Mobile copy ──────────────────────────────────────────────────────────
  const handleMobileCopy = useCallback(() => {
    if (!json) return;
    navigator.clipboard
      .writeText(json)
      .then(() => {
        setMobileCopied(true);
        toast.success("Copied to clipboard");
        setTimeout(() => setMobileCopied(false), 1500);
      })
      .catch(() => toast.error("Failed to copy"));
  }, [json]);

  // ── Command menu actions ─────────────────────────────────────────────────
  const handleCommandAction = useCallback(
    (action: string) => {
      if (action === "format") {
        handleFormat();
      } else if (action === "minify") {
        handleMinify();
      } else if (action === "validate") {
        handleModeChange("validate");
      } else if (action === "diff") {
        handleModeChange("diff");
        if (!diffLeft && json) setDiffLeft(json);
      } else if (action === "tree") {
        handleModeChange("tree");
      } else if (action === "clear") {
        handleJsonChange("");
        toast.success("Editor cleared");
      } else if (action === "copy") {
        navigator.clipboard
          .writeText(json)
          .then(() => toast.success("Copied to clipboard"))
          .catch(() => toast.error("Failed to copy"));
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
      } else if (action === "search") {
        monacoEditorRef.current?.getAction("actions.find")?.run();
      } else if (action === "search-replace") {
        monacoEditorRef.current?.getAction("editor.action.startFindReplaceAction")?.run();
      } else if (action === "fold-all") {
        monacoEditorRef.current?.trigger("keyboard", "editor.foldAll", {});
      } else if (action === "unfold-all") {
        monacoEditorRef.current?.trigger("keyboard", "editor.unfoldAll", {});
      } else if (action === "jump-bracket") {
        monacoEditorRef.current?.getAction("editor.action.jumpToBracket")?.run();
      } else if (action === "convert-ts") {
        setJsonToTsOpen(true);
      } else if (action === "convert-jsonpath") {
        setJsonPathOpen(true);
      } else if (action === "convert-csv") {
        setJsonCsvOpen(true);
      } else if (action === "convert-yaml") {
        setJsonYamlOpen(true);
      } else if (action === "convert-schema") {
        setJsonSchemaOpen(true);
      } else if (action.startsWith("example-")) {
        const key = action.slice("example-".length);
        const example = EXAMPLES[key];
        if (example) {
          handleJsonChange(example.json);
          toast.success(`Loaded: ${example.label}`);
        }
      }
    },
    [handleFormat, handleMinify, handleModeChange, json, diffLeft, handleJsonChange, toggleTheme],
  );

  // ── URL sharing ──────────────────────────────────────────────────────────
  const handleShareLoad = useCallback(
    (loaded: string) => {
      handleJsonChange(loaded);
      toast.success("JSON loaded from URL");
    },
    [handleJsonChange],
  );
  useUrlSharing(handleShareLoad);

  // ── Keyboard shortcuts ───────────────────────────────────────────────────
  const handleDiff = useCallback(() => {
    handleModeChange("diff");
    if (!diffLeft && json) setDiffLeft(json);
  }, [handleModeChange, diffLeft, json]);

  const handleTree = useCallback(() => handleModeChange("tree"), [handleModeChange]);
  const handleShare = useCallback(() => setShareDialogOpen(true), []);
  const handleAnalyze = useCallback(() => setAnalyzeDialogOpen(true), []);
  const handleCommandMenu = useCallback(() => setCommandMenuOpen(true), []);

  const handleOnboardingDone = useCallback(() => {
    localStorage.setItem(ONBOARDED_KEY, "1");
    setShowOnboarding(false);
  }, []);

  const handleConvert = useCallback((tool: string) => {
    if (tool === "ts") setJsonToTsOpen(true);
    else if (tool === "jsonpath") setJsonPathOpen(true);
    else if (tool === "csv") setJsonCsvOpen(true);
    else if (tool === "yaml") setJsonYamlOpen(true);
    else if (tool === "schema") setJsonSchemaOpen(true);
  }, []);

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
      .then(() => toast.success(`Copied: ${path}`))
      .catch(() => toast.error("Failed to copy path"));
  }, []);

  // ── Diff stats ───────────────────────────────────────────────────────────
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

  const infoPanelProps = {
    json,
    mode,
    viewMode,
    onViewModeChange: handleViewModeChange,
    indent,
    onIndentChange: setIndent,
    sortKeys,
    onSortKeysChange: setSortKeys,
    onFormat: handleFormat,
    onMinify: handleMinify,
    onClear: () => handleJsonChange(""),
  };

  return (
    <TooltipProvider delayDuration={400}>
      <div className="fixed inset-0 flex flex-col bg-background text-foreground overflow-hidden">
        <TopNav
          mode={mode}
          onModeChange={handleModeChange}
          onShare={() => setShareDialogOpen(true)}
          onCommandMenu={() => setCommandMenuOpen(true)}
          onShowFeatures={() => setFeaturesDialogOpen(true)}
          onConvert={handleConvert}
          theme={theme}
          onThemeToggle={toggleTheme}
        />

        {/* Tab bar */}
        <TabBar
          tabs={tabs}
          activeId={activeTab?.id ?? ""}
          onSelect={handleTabSelect}
          onNew={handleTabNew}
          onClose={handleTabClose}
          onRename={handleTabRename}
        />

        <main
          className="flex-1 min-h-0 overflow-hidden flex flex-col md:flex-row relative"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Drag-and-drop overlay */}
          {isDragging && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/90 border-2 border-dashed border-primary rounded-lg m-2 pointer-events-none">
              <div className="text-center">
                <Upload className="h-10 w-10 text-primary mx-auto mb-3" />
                <p className="text-sm font-semibold">Drop to load JSON</p>
                <p className="text-xs text-muted-foreground mt-1">.json · .txt · .log</p>
              </div>
            </div>
          )}

          {mode === "diff" ? (
            /* Diff mode — full width with stats bar */
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              <div className="flex flex-wrap items-center justify-between gap-y-1 px-4 py-2 border-b border-border bg-card/50 text-xs shrink-0">
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground font-medium">JSON Diff</span>
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
                    onClick={() => { setDiffLeft(""); setDiffRight(""); }}
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
                        <span className="text-green-600 dark:text-green-400">✓ No differences</span>
                      )}
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-hidden relative">
                <div className="absolute inset-0">
                  <DiffEditor
                    original={diffLeft}
                    modified={diffRight}
                    onOriginalChange={setDiffLeft}
                    onModifiedChange={setDiffRight}
                    theme={theme}
                    renderSideBySide={renderSideBySide}
                  />
                </div>
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
                        {diffDetails.length} change{diffDetails.length !== 1 ? "s" : ""}
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
                              <span className="text-muted-foreground shrink-0 truncate max-w-[40%]">{change.path}</span>
                              <span className="text-green-500 truncate">{formatDiffValue(change.newValue)}</span>
                            </>
                          )}
                          {change.type === "removed" && (
                            <>
                              <span className="text-red-500 shrink-0">−</span>
                              <span className="text-muted-foreground shrink-0 truncate max-w-[40%]">{change.path}</span>
                              <span className="text-red-500 truncate">{formatDiffValue(change.oldValue)}</span>
                            </>
                          )}
                          {change.type === "changed" && (
                            <>
                              <span className="text-yellow-500 shrink-0">~</span>
                              <span className="text-muted-foreground shrink-0 truncate max-w-[30%]">{change.path}</span>
                              <span className="text-red-400 line-through truncate">{formatDiffValue(change.oldValue)}</span>
                              <span className="text-muted-foreground shrink-0">→</span>
                              <span className="text-green-400 truncate">{formatDiffValue(change.newValue)}</span>
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
            <div className="flex-1 min-h-0 overflow-hidden flex">
              <div className="flex-1 min-h-0 min-w-0 overflow-hidden relative">
                {mode === "tree" && viewMode === "tree" ? (
                  showEmptyState ? (
                    <EmptyState onLoadExample={handleJsonChange} />
                  ) : (
                    <TreeView json={json} onPathCopy={handlePathCopy} />
                  )
                ) : (
                  <>
                    <div className="absolute inset-0">
                      <JsonEditor
                        value={json}
                        onChange={handleJsonChange}
                        validationError={validationResult.error ?? null}
                        theme={theme}
                        onEditorReady={handleEditorReady}
                      />
                    </div>
                    {showEmptyState && (
                      <div className="absolute inset-0 pointer-events-none">
                        <EmptyState onLoadExample={handleJsonChange} />
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Desktop sidebar only */}
              <div className="hidden md:flex">
                <InfoPanel {...infoPanelProps} />
              </div>
            </div>
          )}
        </main>

        {/* Mobile action bar */}
        {mode !== "diff" && (
          <div className="md:hidden shrink-0 h-14 border-t border-border flex items-center px-3 gap-2 bg-card/80 backdrop-blur-sm">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <div
                className={cn(
                  "h-2 w-2 rounded-full shrink-0",
                  isEmpty
                    ? "bg-muted-foreground/30"
                    : validationResult.valid
                      ? "bg-green-500"
                      : "bg-destructive",
                )}
              />
              <span className="text-xs text-muted-foreground truncate">
                {isEmpty
                  ? "Paste or type JSON"
                  : validationResult.valid
                    ? "Valid JSON"
                    : (validationResult.error?.friendly ?? "Invalid JSON")}
              </span>
            </div>
            {(mode === "format" || mode === "tree") && (
              <Button
                size="sm"
                onClick={handleFormat}
                disabled={isEmpty || !validationResult.valid}
                className="shrink-0 gap-1.5"
              >
                <Wand2 className="h-3.5 w-3.5" />
                Format
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleMobileCopy}
              disabled={isEmpty}
              className="shrink-0 gap-1.5"
            >
              {mobileCopied ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {mobileCopied ? "Copied" : "Copy"}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowMobilePanel(true)}
              className="shrink-0"
              aria-label="Open settings panel"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Mobile info panel sheet */}
        {showMobilePanel && (
          <div className="fixed inset-0 z-50 flex flex-col md:hidden">
            <div className="flex-1 bg-black/50" onClick={() => setShowMobilePanel(false)} />
            <div className="bg-card border-t border-border rounded-t-2xl shadow-2xl px-2 pb-2 pt-1 max-h-[82vh] overflow-y-auto animate-slideInUp">
              <div className="flex items-center justify-between px-2 py-2 mb-1">
                <span className="text-sm font-semibold">Tools &amp; Settings</span>
                <button
                  className="text-xs text-muted-foreground px-3 py-1.5 rounded-md hover:bg-muted"
                  onClick={() => setShowMobilePanel(false)}
                >
                  Close
                </button>
              </div>

              {/* Convert tools */}
              <div className="px-2 pb-3 border-b border-border mb-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 mb-2">Convert</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { tool: "ts", icon: Code2, label: "JSON → TypeScript", color: "text-blue-500" },
                    { tool: "jsonpath", icon: Search, label: "JSONPath Playground", color: "text-green-500" },
                    { tool: "csv", icon: Table, label: "JSON ↔ CSV", color: "text-orange-500" },
                    { tool: "yaml", icon: FileText, label: "JSON ↔ YAML", color: "text-yellow-500" },
                    { tool: "schema", icon: Braces, label: "JSON Schema", color: "text-violet-500" },
                  ].map(({ tool, icon: Icon, label, color }) => (
                    <button
                      key={tool}
                      onClick={() => { handleConvert(tool); setShowMobilePanel(false); }}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-muted/30 hover:bg-muted text-xs font-medium transition-colors text-left"
                    >
                      <Icon className={`h-3.5 w-3.5 shrink-0 ${color}`} />
                      <span className="leading-tight">{label}</span>
                    </button>
                  ))}
                  <button
                    onClick={() => { setShareDialogOpen(true); setShowMobilePanel(false); }}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-muted/30 hover:bg-muted text-xs font-medium transition-colors text-left"
                  >
                    <Share2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span className="leading-tight">Share via URL</span>
                  </button>
                  <button
                    onClick={() => { setAnalyzeDialogOpen(true); setShowMobilePanel(false); }}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-muted/30 hover:bg-muted text-xs font-medium transition-colors text-left"
                  >
                    <BarChart2 className="h-3.5 w-3.5 shrink-0 text-pink-500" />
                    <span className="leading-tight">Analyze JSON</span>
                  </button>
                </div>
              </div>

              <InfoPanel {...infoPanelProps} />

              <div className="px-4 py-3 border-t border-border mt-1 flex items-center justify-between">
                <p className="text-xs text-muted-foreground/60">🔒 All processing in your browser</p>
                <button
                  onClick={() => { setAboutDialogOpen(true); setShowMobilePanel(false); }}
                  className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors"
                >
                  Built by Ivaturi Sai Kiran
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Desktop bottom bar */}
        <footer className="h-7 border-t border-border hidden md:flex items-center justify-between px-4 bg-card/50 shrink-0">
          <p className="text-xs text-muted-foreground/60">
            🔒 Privacy: all processing happens in your browser
          </p>
          <button
            onClick={() => setAboutDialogOpen(true)}
            className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors"
          >
            Built by Ivaturi Sai Kiran
          </button>
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

        <ShareDialog open={shareDialogOpen} onOpenChange={setShareDialogOpen} json={json} />

        <AnalyzeDialog open={analyzeDialogOpen} onOpenChange={setAnalyzeDialogOpen} json={json} />

        <FeaturesDialog open={featuresDialogOpen} onOpenChange={setFeaturesDialogOpen} />

        <AboutDialog open={aboutDialogOpen} onOpenChange={setAboutDialogOpen} />

        <JsonToTsDialog open={jsonToTsOpen} onOpenChange={setJsonToTsOpen} json={json} />
        <JsonPathDialog open={jsonPathOpen} onOpenChange={setJsonPathOpen} json={json} />
        <JsonCsvDialog open={jsonCsvOpen} onOpenChange={setJsonCsvOpen} json={json} />
        <JsonYamlDialog open={jsonYamlOpen} onOpenChange={setJsonYamlOpen} json={json} />
        <JsonSchemaDialog open={jsonSchemaOpen} onOpenChange={setJsonSchemaOpen} json={json} />

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

        {showOnboarding && <OnboardingTour onDone={handleOnboardingDone} />}
      </div>
    </TooltipProvider>
  );
}
