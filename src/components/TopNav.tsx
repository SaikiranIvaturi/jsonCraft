import * as TabsPrimitive from "@radix-ui/react-tabs";
import {
  Wand2,
  GitCompare,
  TreePine,
  Share2,
  Terminal,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn, isMac, shortcut } from "@/lib/utils";
import type { Mode, Theme } from "@/types";

interface TopNavProps {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  onShare: () => void;
  onCommandMenu: () => void;
  onShowFeatures: () => void;
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
