import { useState, useMemo, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, Braces } from "lucide-react";
import { toast } from "sonner";
import { jsonToSchema } from "@/lib/jsonToSchema";
import { SCHEMA_EXAMPLES } from "@/lib/convertExamples";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  json: string;
}

export function JsonSchemaDialog({ open, onOpenChange, json }: Props) {
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);
  const jsonRef = useRef(json);
  jsonRef.current = json;

  useEffect(() => {
    if (open) setInput(jsonRef.current);
  }, [open]);

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: "", error: "" };
    try {
      return { output: jsonToSchema(input), error: "" };
    } catch (e) {
      return { output: "", error: (e as Error).message };
    }
  }, [input]);

  function copy() {
    if (!output) return;
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      toast.success("Copied JSON Schema");
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col gap-4 overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Braces className="h-4 w-4 text-violet-500" />
            JSON Schema Inference
          </DialogTitle>
          <DialogDescription>
            Infer a JSON Schema (Draft 7) from your JSON. Required fields and types are detected
            automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Examples:</span>
          {SCHEMA_EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              onClick={() => setInput(ex.json!)}
              className="text-xs px-2.5 py-1 rounded-md bg-muted hover:bg-muted/70 border border-border transition-colors"
            >
              {ex.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 min-h-0 overflow-y-auto sm:overflow-visible">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">JSON Input</span>
            <textarea
              className="flex-1 min-h-[160px] sm:min-h-[280px] font-mono text-xs rounded-lg border border-border bg-muted/30 p-3 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='{ "name": "Alice", "age": 30 }'
              spellCheck={false}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                JSON Schema (Draft 7)
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
              <div className="flex-1 min-h-[160px] sm:min-h-[280px] rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive font-mono break-all">
                {error}
              </div>
            ) : (
              <pre className="flex-1 min-h-[160px] sm:min-h-[280px] font-mono text-xs rounded-lg border border-border bg-muted/30 p-3 overflow-auto whitespace-pre-wrap break-words">
                {output || (
                  <span className="text-muted-foreground">Schema will appear here…</span>
                )}
              </pre>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
