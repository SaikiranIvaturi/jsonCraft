import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { shortcut } from "@/lib/utils";
import {
  Wand2,
  GitCompare,
  TreePine,
  Trash2,
  Copy,
  Download,
  Sparkles,
  Sun,
  Moon,
  FileJson,
  BarChart2,
  Minimize2,
  Search,
  Replace,
  FoldVertical,
  UnfoldVertical,
  Braces,
  Code2,
  Table,
  FileText,
} from "lucide-react";
import { EXAMPLES } from "@/lib/examples";
import type { Theme } from "@/types";

type ActionId =
  | "format"
  | "minify"
  | "validate"
  | "diff"
  | "tree"
  | "analyze"
  | "clear"
  | "copy"
  | "download"
  | "share"
  | "toggle-theme"
  | "search"
  | "search-replace"
  | "fold-all"
  | "unfold-all"
  | "jump-bracket"
  | "convert-ts"
  | "convert-jsonpath"
  | "convert-csv"
  | "convert-yaml"
  | "convert-schema"
  | `example-${string}`;

interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAction: (action: ActionId) => void;
  theme: Theme;
}

export function CommandMenu({ open, onOpenChange, onAction, theme }: CommandMenuProps) {
  const run = (action: ActionId) => {
    onOpenChange(false);
    // Defer action by one frame so the dialog finishes closing and focus restores
    // before any Monaco editor action (find, fold, etc.) tries to run.
    requestAnimationFrame(() => onAction(action));
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Actions">
          <CommandItem value="format json" onSelect={() => run("format")}>
            <Wand2 className="h-4 w-4 text-primary" />
            Format JSON
            <CommandShortcut>{shortcut("F", true)}</CommandShortcut>
          </CommandItem>
          <CommandItem value="minify json strip whitespace" onSelect={() => run("minify")}>
            <Minimize2 className="h-4 w-4 text-orange-500" />
            Minify JSON
          </CommandItem>
          <CommandItem value="copy clipboard" onSelect={() => run("copy")}>
            <Copy className="h-4 w-4" />
            Copy to Clipboard
          </CommandItem>
          <CommandItem value="download save file" onSelect={() => run("download")}>
            <Download className="h-4 w-4" />
            Download as .json
          </CommandItem>
          <CommandItem value="share url link" onSelect={() => run("share")}>
            <FileJson className="h-4 w-4" />
            Share via URL
            <CommandShortcut>{shortcut("S")}</CommandShortcut>
          </CommandItem>
          <CommandItem value="analyze stats depth keys" onSelect={() => run("analyze")}>
            <BarChart2 className="h-4 w-4 text-violet-500" />
            Analyze JSON
            <CommandShortcut>{shortcut("A", true)}</CommandShortcut>
          </CommandItem>
          <CommandItem value="clear delete editor" onSelect={() => run("clear")}>
            <Trash2 className="h-4 w-4 text-destructive" />
            Clear Editor
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Editor">
          <CommandItem value="find search" onSelect={() => run("search")}>
            <Search className="h-4 w-4 text-sky-500" />
            Find in Editor
            <CommandShortcut>Ctrl+F</CommandShortcut>
          </CommandItem>
          <CommandItem value="find replace search" onSelect={() => run("search-replace")}>
            <Replace className="h-4 w-4 text-sky-500" />
            Find &amp; Replace
            <CommandShortcut>Ctrl+H</CommandShortcut>
          </CommandItem>
          <CommandItem value="fold collapse all" onSelect={() => run("fold-all")}>
            <FoldVertical className="h-4 w-4 text-amber-500" />
            Fold All
          </CommandItem>
          <CommandItem value="unfold expand all" onSelect={() => run("unfold-all")}>
            <UnfoldVertical className="h-4 w-4 text-amber-500" />
            Unfold All
          </CommandItem>
          <CommandItem value="jump bracket brace" onSelect={() => run("jump-bracket")}>
            <Braces className="h-4 w-4 text-emerald-500" />
            Jump to Matching Bracket
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Modes">
          <CommandItem value="diff compare" onSelect={() => run("diff")}>
            <GitCompare className="h-4 w-4 text-sky-500" />
            Compare / Diff
            <CommandShortcut>{shortcut("D")}</CommandShortcut>
          </CommandItem>
          <CommandItem value="tree explorer view" onSelect={() => run("tree")}>
            <TreePine className="h-4 w-4 text-emerald-500" />
            Tree Explorer
            <CommandShortcut>{shortcut("T")}</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Load Example">
          {Object.entries(EXAMPLES).map(([key, { label }]) => (
            <CommandItem key={key} value={`example ${label.toLowerCase()}`} onSelect={() => run(`example-${key}`)}>
              <Sparkles className="h-4 w-4 text-yellow-500" />
              {label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Convert">
          <CommandItem value="typescript interface ts types" onSelect={() => run("convert-ts")}>
            <Code2 className="h-4 w-4 text-blue-500" />
            JSON → TypeScript
          </CommandItem>
          <CommandItem value="jsonpath query playground search" onSelect={() => run("convert-jsonpath")}>
            <Search className="h-4 w-4 text-green-500" />
            JSONPath Playground
          </CommandItem>
          <CommandItem value="csv spreadsheet export import table" onSelect={() => run("convert-csv")}>
            <Table className="h-4 w-4 text-orange-500" />
            JSON ↔ CSV
          </CommandItem>
          <CommandItem value="yaml convert export import" onSelect={() => run("convert-yaml")}>
            <FileText className="h-4 w-4 text-yellow-500" />
            JSON ↔ YAML
          </CommandItem>
          <CommandItem value="schema inference draft json schema" onSelect={() => run("convert-schema")}>
            <Braces className="h-4 w-4 text-violet-500" />
            JSON Schema Inference
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Settings">
          <CommandItem value="toggle theme dark light mode" onSelect={() => run("toggle-theme")}>
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-yellow-500" />
            ) : (
              <Moon className="h-4 w-4 text-blue-500" />
            )}
            Toggle {theme === "dark" ? "Light" : "Dark"} Mode
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
