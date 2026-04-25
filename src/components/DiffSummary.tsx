import { useState } from "react";
import { Plus, Minus, RefreshCw, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import type { DiffChange } from "@/types";
import { cn } from "@/lib/utils";

type Filter = "all" | "added" | "removed" | "changed";

const TYPE_CONFIG = {
  added: {
    icon: Plus,
    label: "Added",
    badge: "bg-green-500/12 text-green-600 dark:text-green-400 ring-1 ring-green-500/20",
    value: "text-green-600 dark:text-green-400",
  },
  removed: {
    icon: Minus,
    label: "Removed",
    badge: "bg-red-500/12 text-red-600 dark:text-red-400 ring-1 ring-red-500/20",
    value: "text-red-500",
  },
  changed: {
    icon: RefreshCw,
    label: "Changed",
    badge: "bg-yellow-500/12 text-yellow-600 dark:text-yellow-400 ring-1 ring-yellow-500/20",
    value: "",
  },
} as const;

function formatValue(val: unknown): string {
  if (val === null) return "null";
  if (val === undefined) return "";
  if (typeof val === "string") {
    const s = JSON.stringify(val);
    return s.length > 52 ? s.slice(0, 52) + '…"' : s;
  }
  if (typeof val === "object") {
    const s = JSON.stringify(val);
    return s.length > 52 ? s.slice(0, 52) + "…}" : s;
  }
  return String(val);
}

interface Props {
  changes: DiffChange[];
  visible: boolean;
  onToggle: () => void;
}

export function DiffSummary({ changes, visible, onToggle }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const counts = {
    added: changes.filter((c) => c.type === "added").length,
    removed: changes.filter((c) => c.type === "removed").length,
    changed: changes.filter((c) => c.type === "changed").length,
  };

  const filtered =
    filter === "all"
      ? changes
      : changes.filter((c) => c.type === filter);

  function copyPath(path: string) {
    navigator.clipboard.writeText(path).then(() => {
      setCopiedPath(path);
      toast.success(`Copied path: ${path}`);
      setTimeout(() => setCopiedPath(null), 1500);
    });
  }

  const FILTERS: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "All", count: changes.length },
    { key: "added", label: "Added", count: counts.added },
    { key: "removed", label: "Removed", count: counts.removed },
    { key: "changed", label: "Changed", count: counts.changed },
  ];

  return (
    <div className="border-t border-border bg-card/30 shrink-0">
      {/* Collapse toggle */}
      <button
        className="flex items-center justify-between w-full px-4 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        onClick={onToggle}
      >
        <span className="font-medium text-foreground/80">Changes Summary</span>
        <div className="flex items-center gap-2">
          <span className="font-mono">{changes.length} change{changes.length !== 1 ? "s" : ""}</span>
          {visible ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
        </div>
      </button>

      {visible && (
        <>
          {/* Filter tabs */}
          <div className="flex items-center gap-1 px-3 pb-2 pt-0.5 border-b border-border/60">
            {FILTERS.map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                  filter === key
                    ? "bg-muted text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                {label}
                <span
                  className={cn(
                    "font-mono text-[10px] min-w-[14px] text-center",
                    key === "added" && count > 0 && "text-green-500",
                    key === "removed" && count > 0 && "text-red-500",
                    key === "changed" && count > 0 && "text-yellow-500",
                    key === "all" && "text-muted-foreground",
                  )}
                >
                  {count}
                </span>
              </button>
            ))}
          </div>

          {/* Rows */}
          <div className="max-h-56 overflow-y-auto px-2 py-1.5 flex flex-col gap-px">
            {filtered.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No {filter === "all" ? "" : filter} changes
              </p>
            ) : (
              <>
                {filtered.slice(0, 200).map((change, i) => {
                  const cfg = TYPE_CONFIG[change.type];
                  const Icon = cfg.icon;

                  return (
                    <div
                      key={i}
                      className="group flex items-start gap-2 text-xs py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors min-w-0"
                    >
                      {/* Type badge */}
                      <span
                        className={cn(
                          "shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold mt-px",
                          cfg.badge,
                        )}
                      >
                        <Icon className="h-2.5 w-2.5" />
                        {cfg.label}
                      </span>

                      {/* Path + values */}
                      <div className="flex-1 min-w-0 flex flex-col gap-1">
                        <span className="font-mono text-foreground/75 break-all leading-snug">
                          {change.path}
                        </span>

                        {change.type === "changed" ? (
                          <div className="flex items-baseline gap-1.5 flex-wrap font-mono text-[11px]">
                            <span className="text-red-400 line-through opacity-80">
                              {formatValue(change.oldValue)}
                            </span>
                            <span className="text-muted-foreground text-[10px]">→</span>
                            <span className="text-green-400">
                              {formatValue(change.newValue)}
                            </span>
                          </div>
                        ) : change.type === "added" ? (
                          <span className={cn("font-mono text-[11px]", cfg.value)}>
                            {formatValue(change.newValue)}
                          </span>
                        ) : (
                          <span className={cn("font-mono text-[11px] line-through opacity-70", cfg.value)}>
                            {formatValue(change.oldValue)}
                          </span>
                        )}
                      </div>

                      {/* Copy path */}
                      <button
                        onClick={() => copyPath(change.path)}
                        className="shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground hover:bg-muted"
                        aria-label="Copy path"
                      >
                        {copiedPath === change.path ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  );
                })}

                {filtered.length > 200 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    …and {filtered.length - 200} more changes
                  </p>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
