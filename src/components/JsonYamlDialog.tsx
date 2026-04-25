import { useState, useMemo, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import yaml from "js-yaml";
import { YAML_JSON_EXAMPLES, YAML_YAML_EXAMPLES } from "@/lib/convertExamples";

type Direction = "json-to-yaml" | "yaml-to-json";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  json: string;
}

export function JsonYamlDialog({ open, onOpenChange, json }: Props) {
  const [direction, setDirection] = useState<Direction>("json-to-yaml");
  const [jsonInput, setJsonInput] = useState("");
  const [yamlInput, setYamlInput] = useState("");
  const [copied, setCopied] = useState(false);
  const jsonRef = useRef(json);
  jsonRef.current = json;

  useEffect(() => {
    if (open) {
      setJsonInput(jsonRef.current);
      setYamlInput("");
      setDirection("json-to-yaml");
    }
  }, [open]);

  const input = direction === "json-to-yaml" ? jsonInput : yamlInput;
  const setInput = direction === "json-to-yaml" ? setJsonInput : setYamlInput;

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: "", error: "" };
    try {
      if (direction === "json-to-yaml") {
        const parsed = JSON.parse(input);
        return { output: yaml.dump(parsed, { lineWidth: -1, noRefs: true }), error: "" };
      } else {
        const parsed = yaml.load(input);
        return { output: JSON.stringify(parsed, null, 2), error: "" };
      }
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

  const inputLabel = direction === "json-to-yaml" ? "JSON Input" : "YAML Input";
  const outputLabel = direction === "json-to-yaml" ? "YAML Output" : "JSON Output";
  const placeholder =
    direction === "json-to-yaml"
      ? '{ "name": "Alice", "age": 30 }'
      : "name: Alice\nage: 30";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col gap-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-yellow-500" />
            JSON ↔ YAML
          </DialogTitle>
          <DialogDescription>
            Convert between JSON and YAML formats. Fully bidirectional.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-1 bg-secondary rounded-lg p-0.5 self-start">
          {(["json-to-yaml", "yaml-to-json"] as Direction[]).map((d) => (
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
              {d === "json-to-yaml" ? "JSON → YAML" : "YAML → JSON"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Examples:</span>
          {(direction === "json-to-yaml" ? YAML_JSON_EXAMPLES : YAML_YAML_EXAMPLES).map((ex) => (
            <button
              key={ex.label}
              onClick={() => setInput(direction === "json-to-yaml" ? ex.json! : ex.yaml!)}
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
