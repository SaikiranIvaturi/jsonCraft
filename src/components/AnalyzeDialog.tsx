import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { analyzeJson } from "@/lib/jsonUtils";
import { cn } from "@/lib/utils";
import { BarChart2, Layers, Hash, List, AlertCircle } from "lucide-react";

interface AnalyzeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  json: string;
}

function SectionTitle({
  icon: Icon,
  label,
}: {
  icon: React.ElementType;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </div>
  );
}

function Row({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string | number;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-xs py-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("text-foreground", mono && "font-mono")}>
        {value}
      </span>
    </div>
  );
}

const TYPE_COLORS: Record<string, string> = {
  objects: "bg-sky-500",
  arrays: "bg-violet-500",
  strings: "bg-green-500",
  numbers: "bg-amber-500",
  booleans: "bg-rose-500",
  nulls: "bg-zinc-400",
};

const TYPE_LABELS: Record<string, string> = {
  objects: "Objects",
  arrays: "Arrays",
  strings: "Strings",
  numbers: "Numbers",
  booleans: "Booleans",
  nulls: "Nulls",
};

export function AnalyzeDialog({
  open,
  onOpenChange,
  json,
}: AnalyzeDialogProps) {
  const isEmpty = !json.trim();
  const analysis = !isEmpty ? analyzeJson(json) : null;

  const errorContent = isEmpty ? (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-3 text-sm text-muted-foreground">
      <AlertCircle className="h-4 w-4 shrink-0" />
      No JSON loaded — paste or type JSON into the editor first.
    </div>
  ) : (
    <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-3 text-sm text-destructive">
      <AlertCircle className="h-4 w-4 shrink-0" />
      Invalid JSON — fix errors before analyzing.
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-primary" />
            JSON Analysis
          </DialogTitle>
          <DialogDescription>
            Structural breakdown of your JSON document.
          </DialogDescription>
        </DialogHeader>

        {!analysis ? (
          errorContent
        ) : (
          <div className="flex flex-col gap-5">
            {/* Structure */}
            <div>
              <SectionTitle icon={Layers} label="Structure" />
              <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 flex flex-col gap-0.5">
                <Row label="Root type" value={analysis.rootType} mono />
                <Row
                  label="Total nodes"
                  value={analysis.totalNodes.toLocaleString()}
                />
                <Row label="Max depth" value={analysis.maxDepth} />
              </div>
            </div>

            {/* Type distribution */}
            <div>
              <SectionTitle icon={BarChart2} label="Type Distribution" />
              <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 flex flex-col gap-1.5">
                {/* Bar chart */}
                {(() => {
                  const counts = analysis.typeCounts;
                  const total = analysis.totalNodes;
                  const entries = Object.entries(counts).filter(
                    ([, v]) => v > 0,
                  );
                  return (
                    <>
                      <div className="flex h-3 w-full overflow-hidden rounded-full gap-px mb-1">
                        {entries.map(([type, count]) => (
                          <div
                            key={type}
                            className={cn("h-full", TYPE_COLORS[type])}
                            style={{ width: `${(count / total) * 100}%` }}
                            title={`${TYPE_LABELS[type]}: ${count}`}
                          />
                        ))}
                      </div>
                      {entries.map(([type, count]) => (
                        <div
                          key={type}
                          className="flex items-center justify-between text-xs py-0.5"
                        >
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <span
                              className={cn(
                                "inline-block h-2 w-2 rounded-sm",
                                TYPE_COLORS[type],
                              )}
                            />
                            {TYPE_LABELS[type]}
                          </span>
                          <span className="text-foreground">
                            {count.toLocaleString()}
                            <span className="text-muted-foreground ml-1">
                              ({Math.round((count / total) * 100)}%)
                            </span>
                          </span>
                        </div>
                      ))}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Keys */}
            {analysis.totalKeys > 0 && (
              <div>
                <SectionTitle icon={Hash} label="Keys" />
                <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 flex flex-col gap-0.5">
                  <Row
                    label="Unique keys"
                    value={analysis.uniqueKeys.toLocaleString()}
                  />
                  <Row
                    label="Total key occurrences"
                    value={analysis.totalKeys.toLocaleString()}
                  />
                  {analysis.mostCommonKeys.length > 0 && (
                    <div className="mt-1.5 flex flex-col gap-0.5">
                      <span className="text-xs text-muted-foreground mb-0.5">
                        Most common
                      </span>
                      {analysis.mostCommonKeys.map(({ key, count }) => (
                        <div
                          key={key}
                          className="flex items-center justify-between text-xs py-0.5"
                        >
                          <span className="font-mono text-foreground truncate max-w-[60%]">
                            {key}
                          </span>
                          <span className="text-muted-foreground">
                            ×{count}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Arrays */}
            {analysis.arrayStats && (
              <div>
                <SectionTitle icon={List} label="Arrays" />
                <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 flex flex-col gap-0.5">
                  <Row
                    label="Total arrays"
                    value={analysis.arrayStats.total.toLocaleString()}
                  />
                  <Row label="Min length" value={analysis.arrayStats.min} />
                  <Row label="Max length" value={analysis.arrayStats.max} />
                  <Row label="Avg length" value={analysis.arrayStats.avg} />
                </div>
              </div>
            )}

            {/* Empty / null values */}
            {(() => {
              const e = analysis.emptyValues;
              const hasAny =
                e.nulls + e.emptyStrings + e.emptyArrays + e.emptyObjects > 0;
              if (!hasAny) return null;
              return (
                <div>
                  <SectionTitle
                    icon={AlertCircle}
                    label="Empty / Null Values"
                  />
                  <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 flex flex-col gap-0.5">
                    {e.nulls > 0 && <Row label="Null values" value={e.nulls} />}
                    {e.emptyStrings > 0 && (
                      <Row label='Empty strings ""' value={e.emptyStrings} />
                    )}
                    {e.emptyArrays > 0 && (
                      <Row label="Empty arrays []" value={e.emptyArrays} />
                    )}
                    {e.emptyObjects > 0 && (
                      <Row label="Empty objects {}" value={e.emptyObjects} />
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
