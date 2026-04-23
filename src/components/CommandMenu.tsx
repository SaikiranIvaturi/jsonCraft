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
  CheckCircle2,
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
} from "lucide-react";
import { EXAMPLES } from "@/lib/examples";
import type { Theme } from "@/types";

type ActionId =
  | "format"
  | "validate"
  | "diff"
  | "tree"
  | "analyze"
  | "clear"
  | "copy"
  | "download"
  | "share"
  | "toggle-theme"
  | `example-${string}`;

interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAction: (action: ActionId) => void;
  theme: Theme;
}

export function CommandMenu({
  open,
  onOpenChange,
  onAction,
  theme,
}: CommandMenuProps) {
  const run = (action: ActionId) => {
    onOpenChange(false);
    onAction(action);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => run("format")}>
            <Wand2 className="h-4 w-4 text-primary" />
            Format JSON
            <CommandShortcut>{shortcut('F', true)}</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run("copy")}>
            <Copy className="h-4 w-4" />
            Copy to Clipboard
          </CommandItem>
          <CommandItem onSelect={() => run("download")}>
            <Download className="h-4 w-4" />
            Download as .json
          </CommandItem>
          <CommandItem onSelect={() => run("share")}>
            <FileJson className="h-4 w-4" />
            Share via URL
            <CommandShortcut>{shortcut('S')}</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run("analyze")}>
            <BarChart2 className="h-4 w-4 text-violet-500" />
            Analyze JSON
            <CommandShortcut>{shortcut('A', true)}</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run("clear")}>
            <Trash2 className="h-4 w-4 text-destructive" />
            Clear Editor
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Modes">
          <CommandItem onSelect={() => run("validate")}>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            Validate JSON
          </CommandItem>
          <CommandItem onSelect={() => run("diff")}>
            <GitCompare className="h-4 w-4 text-sky-500" />
            Compare / Diff
            <CommandShortcut>{shortcut('D')}</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run("tree")}>
            <TreePine className="h-4 w-4 text-emerald-500" />
            Tree Explorer
            <CommandShortcut>{shortcut('T')}</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Load Example">
          {Object.entries(EXAMPLES).map(([key, { label }]) => (
            <CommandItem key={key} onSelect={() => run(`example-${key}`)}>
              <Sparkles className="h-4 w-4 text-yellow-500" />
              {label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Settings">
          <CommandItem onSelect={() => run("toggle-theme")}>
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
