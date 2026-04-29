import { useState, useMemo, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, Search } from "lucide-react";
import { toast } from "sonner";
import { JSONPath } from "jsonpath-plus";
import { JSONPATH_EXAMPLES, JSONPATH_QUERY_EXAMPLES } from "@/lib/convertExamples";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  json: string;
}

export function JsonPathDialog({ open, onOpenChange, json }: Props) {
  const [jsonInput, setJsonInput] = useState("");
  const [query, setQuery] = useState("$.*");
  const [copied, setCopied] = useState(false);
  const jsonRef = useRef(json);
  jsonRef.current = json;

  useEffect(() => {
    if (open) setJsonInput(jsonRef.current);
  }, [open]);

  const { output, error, count } = useMemo(() => {
    if (!jsonInput.trim() || !query.trim()) return { output: "", error: "", count: 0 };
    try {
      const parsed = JSON.parse(jsonInput);
      const results = JSONPath({ path: query, json: parsed }) as unknown[];
      return {
        output: JSON.stringify(results, null, 2),
        error: "",
        count: results.length,
      };
    } catch (e) {
      return { output: "", error: (e as Error).message, count: 0 };
    }
  }, [jsonInput, query]);

  function copy() {
    if (!output) return;
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      toast.success("Copied results");
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col gap-4 overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-4 w-4 text-green-500" />
            JSONPath Playground
          </DialogTitle>
          <DialogDescription>
            Query your JSON with JSONPath expressions. Results update as you type.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground shrink-0">Query</span>
            <input
              type="text"
              className="flex-1 font-mono text-xs rounded-lg border border-border bg-muted/30 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="$.users[*].email"
              spellCheck={false}
            />
          </div>
          <div className="flex gap-1.5 flex-wrap items-center">
            <span className="text-xs text-muted-foreground">Queries:</span>
            {JSONPATH_QUERY_EXAMPLES.map((ex) => (
              <button
                key={ex.query}
                onClick={() => setQuery(ex.query)}
                className="text-xs font-mono px-2 py-0.5 rounded bg-muted hover:bg-muted/70 text-foreground border border-border"
              >
                {ex.label}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5 flex-wrap items-center">
            <span className="text-xs text-muted-foreground">Load JSON:</span>
            {JSONPATH_EXAMPLES.map((ex) => (
              <button
                key={ex.label}
                onClick={() => { setJsonInput(ex.json!); setQuery(JSONPATH_QUERY_EXAMPLES[0].query); }}
                className="text-xs px-2.5 py-1 rounded-md bg-muted hover:bg-muted/70 border border-border transition-colors"
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 min-h-0 overflow-y-auto sm:overflow-visible">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">JSON Input</span>
            <textarea
              className="flex-1 min-h-[160px] sm:min-h-[200px] font-mono text-xs rounded-lg border border-border bg-muted/30 p-3 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='{ "users": [{ "name": "Alice" }] }'
              spellCheck={false}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Results
                {count > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded bg-primary/15 text-primary text-[10px] font-semibold">
                    {count}
                  </span>
                )}
              </span>
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
              <div className="flex-1 min-h-[160px] sm:min-h-[200px] rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive font-mono break-all">
                {error}
              </div>
            ) : (
              <pre className="flex-1 min-h-[160px] sm:min-h-[200px] font-mono text-xs rounded-lg border border-border bg-muted/30 p-3 overflow-auto whitespace-pre-wrap break-words">
                {output || (
                  <span className="text-muted-foreground">
                    {!jsonInput.trim() ? "Paste JSON on the left…" : "No matches found"}
                  </span>
                )}
              </pre>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
