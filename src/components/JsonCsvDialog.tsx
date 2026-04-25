import { useState, useMemo, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, Table } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { jsonToCsv, csvToJson } from "@/lib/csvUtils";
import { CSV_JSON_EXAMPLES, CSV_CSV_EXAMPLES } from "@/lib/convertExamples";

type Direction = "json-to-csv" | "csv-to-json";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  json: string;
}

export function JsonCsvDialog({ open, onOpenChange, json }: Props) {
  const [direction, setDirection] = useState<Direction>("json-to-csv");
  const [jsonInput, setJsonInput] = useState("");
  const [csvInput, setCsvInput] = useState("");
  const [copied, setCopied] = useState(false);
  const jsonRef = useRef(json);
  jsonRef.current = json;

  useEffect(() => {
    if (open) {
      setJsonInput(jsonRef.current);
      setCsvInput("");
      setDirection("json-to-csv");
    }
  }, [open]);

  const input = direction === "json-to-csv" ? jsonInput : csvInput;
  const setInput = direction === "json-to-csv" ? setJsonInput : setCsvInput;

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: "", error: "" };
    try {
      const result = direction === "json-to-csv" ? jsonToCsv(input) : csvToJson(input);
      return { output: result, error: "" };
    } catch (e) {
      return { output: "", error: (e as Error).message };
    }
  }, [input, direction]);

  function copy() {
    if (!output) return;
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 1500);
    });
  }

  const inputLabel = direction === "json-to-csv" ? "JSON Input" : "CSV Input";
  const outputLabel = direction === "json-to-csv" ? "CSV Output" : "JSON Output";
  const placeholder =
    direction === "json-to-csv"
      ? '[{ "name": "Alice", "age": 30 }, { "name": "Bob", "age": 25 }]'
      : "name,age\nAlice,30\nBob,25";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col gap-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Table className="h-4 w-4 text-orange-500" />
            JSON ↔ CSV
          </DialogTitle>
          <DialogDescription>
            Convert between JSON arrays and CSV. Nested objects are flattened with dot notation.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-1 bg-secondary rounded-lg p-0.5 self-start">
          {(["json-to-csv", "csv-to-json"] as Direction[]).map((d) => (
            <button
              key={d}
              onClick={() => setDirection(d)}
              className={cn(
                "px-3 py-1 rounded-md text-xs font-medium transition-all",
                direction === d
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {d === "json-to-csv" ? "JSON → CSV" : "CSV → JSON"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Examples:</span>
          {(direction === "json-to-csv" ? CSV_JSON_EXAMPLES : CSV_CSV_EXAMPLES).map((ex) => (
            <button
              key={ex.label}
              onClick={() => setInput(direction === "json-to-csv" ? ex.json! : ex.csv!)}
              className="text-xs px-2.5 py-1 rounded-md bg-muted hover:bg-muted/70 border border-border transition-colors"
            >
              {ex.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 min-h-0">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">{inputLabel}</span>
            <textarea
              className="flex-1 min-h-[240px] font-mono text-xs rounded-lg border border-border bg-muted/30 p-3 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={placeholder}
              spellCheck={false}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">{outputLabel}</span>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs gap-1"
                onClick={copy}
                disabled={!output}
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                Copy
              </Button>
            </div>
            {error ? (
              <div className="flex-1 min-h-[240px] rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive font-mono break-all">
                {error}
              </div>
            ) : (
              <pre className="flex-1 min-h-[240px] font-mono text-xs rounded-lg border border-border bg-muted/30 p-3 overflow-auto whitespace-pre-wrap break-words">
                {output || (
                  <span className="text-muted-foreground">Output will appear here…</span>
                )}
              </pre>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
