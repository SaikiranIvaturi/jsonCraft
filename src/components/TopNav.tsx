import * as TabsPrimitive from "@radix-ui/react-tabs";
import {
  Wand2,
  GitCompare,
  TreePine,
  Share2,
  Terminal,
  HelpCircle,
  ChevronDown,
  Code2,
  Search,
  Table,
  FileText,
  Braces,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, isMac, shortcut } from "@/lib/utils";
import type { Mode, Theme } from "@/types";

const CHANGELOG: { version: string; label: string; items: string[] }[] = [
  {
    version: "1.1.0",
    label: "Latest",
    items: [
      "JSON → TypeScript interface generator",
      "JSONPath query playground",
      "JSON ↔ CSV converter",
      "JSON ↔ YAML converter",
      "JSON Schema inference",
    ],
  },
  {
    version: "1.0.0",
    label: "Initial release",
    items: [
      "Formatter, minifier & validator",
      "JSON Diff & compare",
      "Tree explorer",
      "Multi-tab workspaces",
      "Command palette (⌘K)",
      "Drag & drop file upload",
      "Share via URL",
      "JSON Analyzer",
    ],
  },
];

interface TopNavProps {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  onShare: () => void;
  onCommandMenu: () => void;
  onShowFeatures: () => void;
  onConvert: (tool: string) => void;
  theme: Theme;
  onThemeToggle: () => void;
}

const TABS: {
  value: Mode;
  label: string;
  icon: typeof Wand2;
  shortcut: string;
}[] = [
  { value: "format", label: "Format", icon: Wand2, shortcut: "" },
  { value: "diff", label: "Diff", icon: GitCompare, shortcut: "⌘D" },
  { value: "tree", label: "Tree", icon: TreePine, shortcut: "⌘T" },
];

export function TopNav({
  mode,
  onModeChange,
  onShare,
  onCommandMenu,
  onShowFeatures,
  onConvert,
  theme,
  onThemeToggle,
}: TopNavProps) {
  return (
    <header className="h-12 border-b border-border flex items-center justify-between px-3 sm:px-4 shrink-0 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
      {/* Logo */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
          <Terminal className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="font-semibold text-sm tracking-tight">JSONCraft</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="hidden sm:inline text-[10px] font-mono text-muted-foreground/60 bg-muted px-1.5 py-0.5 rounded cursor-default select-none hover:text-foreground hover:bg-muted/80 transition-colors">
              v{__APP_VERSION__}
            </span>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            align="start"
            className="p-0 max-w-[260px] overflow-hidden"
          >
            <div className="px-3 py-2 border-b border-border">
              <p className="text-xs font-semibold">What's new</p>
            </div>
            <div className="p-2 flex flex-col gap-3">
              {CHANGELOG.map((release) => (
                <div key={release.version}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] font-mono font-semibold text-primary">
                      v{release.version}
                    </span>
                    {release.label === "Latest" && (
                      <span className="text-[9px] bg-primary/15 text-primary px-1 py-0.5 rounded font-medium">
                        NEW
                      </span>
                    )}
                  </div>
                  <ul className="flex flex-col gap-0.5">
                    {release.items.map((item) => (
                      <li key={item} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                        <span className="mt-[3px] shrink-0 h-1 w-1 rounded-full bg-muted-foreground/40" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Mode tabs */}
      <TabsPrimitive.Root value={mode} onValueChange={(v) => onModeChange(v as Mode)}>
        <TabsPrimitive.List className="flex items-center bg-secondary rounded-lg p-0.5 gap-0.5">
          {TABS.map(({ value, label, icon: Icon }) => (
            <TabsPrimitive.Trigger
              key={value}
              value={value}
              className={cn(
                "flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 h-8 sm:h-7 rounded-md text-xs font-medium transition-all",
                "text-muted-foreground hover:text-foreground",
                "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">{label}</span>
            </TabsPrimitive.Trigger>
          ))}
        </TabsPrimitive.List>
      </TabsPrimitive.Root>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Convert dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="hidden sm:flex gap-1.5 text-xs">
              Convert
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Convert JSON</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onConvert("ts")}>
              <Code2 className="h-4 w-4 text-blue-500" />
              JSON → TypeScript
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onConvert("jsonpath")}>
              <Search className="h-4 w-4 text-green-500" />
              JSONPath Playground
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onConvert("csv")}>
              <Table className="h-4 w-4 text-orange-500" />
              JSON ↔ CSV
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onConvert("yaml")}>
              <FileText className="h-4 w-4 text-yellow-500" />
              JSON ↔ YAML
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onConvert("schema")}>
              <Braces className="h-4 w-4 text-violet-500" />
              JSON Schema
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCommandMenu}
              className="hidden sm:flex gap-2 text-xs"
            >
              <kbd className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                {isMac ? "⌘K" : "Ctrl+K"}
              </kbd>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Open command menu</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onShare} aria-label="Share">
              <Share2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Share via URL ({shortcut("S")})</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onShowFeatures} aria-label="Features">
              <HelpCircle className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>What can JSONCraft do?</TooltipContent>
        </Tooltip>

        <ThemeToggle theme={theme} onToggle={onThemeToggle} />
      </div>
    </header>
  );
}
