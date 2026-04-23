import { useState } from "react";
import {
  Copy,
  Check,
  Download,
  CheckCircle2,
  XCircle,
  AlignLeft,
  SortAsc,
  Code,
  TreePine,
  Wand2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getJsonStats } from "@/lib/jsonUtils";
import { useJsonValidation } from "@/hooks/useJsonValidation";
import type { Mode, ViewMode, IndentStyle } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface InfoPanelProps {
  json: string;
  mode: Mode;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  indent: IndentStyle;
  onIndentChange: (indent: IndentStyle) => void;
  sortKeys: boolean;
  onSortKeysChange: (sorted: boolean) => void;
  onFormat: () => void;
  onClear: () => void;
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-foreground">{value}</span>
    </div>
  );
}

function IndentButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 h-9 rounded text-xs font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      )}
    >
      {label}
    </button>
  );
}

export function InfoPanel({
  json,
  mode,
  viewMode,
  onViewModeChange,
  indent,
  onIndentChange,
  sortKeys,
  onSortKeysChange,
  onFormat,
  onClear,
}: InfoPanelProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const validationResult = useJsonValidation(json);
  const stats = getJsonStats(json);
  const isEmpty = !json.trim();

  const handleCopy = async () => {
    if (!json) return;
    try {
      await navigator.clipboard.writeText(json);
      setCopyState("copied");
      toast.success("Copied to clipboard");
      setTimeout(() => setCopyState("idle"), 1500);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleDownload = () => {
    if (!json) return;
    const blob = new Blob([json], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "jsoncraft.json";
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("Downloaded jsoncraft.json");
  };

  return (
    <div className="w-full md:w-64 shrink-0 border-l border-border flex flex-col bg-card overflow-y-auto">
      {/* Validation status */}
      <div className="px-4 py-3 border-b border-border">
        {isEmpty ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-muted-foreground/50" />
            <span className="text-xs">No JSON loaded</span>
          </div>
        ) : validationResult.valid ? (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="text-xs font-medium">Valid JSON</span>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-destructive">
              <XCircle className="h-4 w-4 shrink-0" />
              <span className="text-xs font-medium">Invalid JSON</span>
            </div>
            {validationResult.error && (
              <p className="text-xs text-muted-foreground ml-6 leading-relaxed">
                {validationResult.error.friendly}
                <span className="block text-xs text-muted-foreground/60 mt-0.5">
                  Line {validationResult.error.line}, Col{" "}
                  {validationResult.error.column}
                </span>
              </p>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="px-4 py-3 border-b border-border flex flex-col gap-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Stats
        </p>
        <StatRow label="Characters" value={stats.chars.toLocaleString()} />
        <StatRow label="Lines" value={stats.lines.toLocaleString()} />
        <StatRow label="Size" value={`${stats.sizeKb} KB`} />
        {stats.valid && (
          <StatRow
            label={mode === "tree" ? "Root items" : "Root keys"}
            value={stats.rootKeys.toLocaleString()}
          />
        )}
      </div>

      {/* Tree mode toggle (only in tree mode) */}
      {mode === "tree" && (
        <div className="px-4 py-3 border-b border-border flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            View
          </p>
          <div className="flex rounded-lg overflow-hidden border border-border">
            <button
              onClick={() => onViewModeChange("code")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 h-10 text-xs font-medium transition-colors",
                viewMode === "code"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent",
              )}
            >
              <Code className="h-3.5 w-3.5" />
              Code
            </button>
            <button
              onClick={() => onViewModeChange("tree")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 h-10 text-xs font-medium transition-colors",
                viewMode === "tree"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent",
              )}
            >
              <TreePine className="h-3.5 w-3.5" />
              Tree
            </button>
          </div>
        </div>
      )}

      {/* Format options (in format and tree modes) */}
      {(mode === "format" || mode === "tree") && (
        <div className="px-4 py-3 border-b border-border flex flex-col gap-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Format
          </p>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <AlignLeft className="h-3 w-3" />
              Indent
            </span>
            <div className="flex gap-1 rounded-lg bg-muted p-0.5">
              <IndentButton
                label="2"
                active={indent === 2}
                onClick={() => onIndentChange(2)}
              />
              <IndentButton
                label="4"
                active={indent === 4}
                onClick={() => onIndentChange(4)}
              />
              <IndentButton
                label="Tab"
                active={indent === "tab"}
                onClick={() => onIndentChange("tab")}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <SortAsc className="h-3 w-3" />
              Sort keys
            </span>
            <Switch checked={sortKeys} onCheckedChange={onSortKeysChange} />
          </div>

          <Button
            onClick={onFormat}
            size="sm"
            disabled={isEmpty || !validationResult.valid}
            className="w-full gap-2"
          >
            <Wand2 className="h-3.5 w-3.5" />
            Format JSON
          </Button>
        </div>
      )}

      <Separator />

      {/* Actions */}
      <div className="px-4 py-3 flex flex-col gap-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Actions
        </p>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="default"
              onClick={handleCopy}
              disabled={isEmpty}
              className="w-full gap-2"
            >
              {copyState === "copied" ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copyState === "copied" ? "Copied!" : "Copy JSON"}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy raw JSON to clipboard</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="default"
              onClick={handleDownload}
              disabled={isEmpty}
              className="w-full gap-2"
            >
              <Download className="h-3.5 w-3.5" />
              Download .json
            </Button>
          </TooltipTrigger>
          <TooltipContent>Download as jsoncraft.json</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="default"
              onClick={onClear}
              disabled={isEmpty}
              className="w-full gap-2 hover:text-destructive hover:border-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </Button>
          </TooltipTrigger>
          <TooltipContent>Clear the editor</TooltipContent>
        </Tooltip>
      </div>

      {/* Privacy note + tagline */}
      <div className="mt-auto px-4 py-3 border-t border-border flex flex-col gap-2">
        <p className="text-xs text-muted-foreground/70 text-center leading-relaxed font-medium">
          Zero ads. Zero tracking. Just JSON tools.
        </p>
        <p className="text-xs text-muted-foreground/45 text-center leading-relaxed">
          More features on the way — stay tuned.
        </p>
      </div>
    </div>
  );
}
