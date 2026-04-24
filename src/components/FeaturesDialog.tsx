import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Wand2,
  CheckCircle2,
  GitCompare,
  TreePine,
  BarChart2,
  Minimize2,
  Search,
  Replace,
  FoldVertical,
  Braces,
  Layers,
  Upload,
  Share2,
  Download,
  SortAsc,
  Keyboard,
} from "lucide-react";
import { isMac } from "@/lib/utils";

const cmd = isMac ? "⌘" : "Ctrl";

interface Feature {
  icon: typeof Wand2;
  iconColor: string;
  title: string;
  description: string;
  shortcut?: string;
}

interface Section {
  heading: string;
  features: Feature[];
}

const SECTIONS: Section[] = [
  {
    heading: "Core Tools",
    features: [
      {
        icon: Wand2,
        iconColor: "text-primary",
        title: "Format",
        description: "Pretty-print with 2-space, 4-space, or tab indent. Sort keys alphabetically.",
        shortcut: `${cmd}⇧F`,
      },
      {
        icon: Minimize2,
        iconColor: "text-orange-500",
        title: "Minify",
        description: "Strip all whitespace in one click. Shows how many KB you saved.",
      },
      {
        icon: CheckCircle2,
        iconColor: "text-green-500",
        title: "Validate",
        description: "Highlights the exact line and column of any JSON syntax error.",
      },
      {
        icon: GitCompare,
        iconColor: "text-sky-500",
        title: "Diff",
        description: "Compare two JSON documents side-by-side. Toggle strict key-order mode.",
        shortcut: `${cmd}D`,
      },
      {
        icon: TreePine,
        iconColor: "text-emerald-500",
        title: "Tree Explorer",
        description: "Visualise the JSON structure. Click any node to copy its full JSONPath.",
        shortcut: `${cmd}T`,
      },
      {
        icon: BarChart2,
        iconColor: "text-violet-500",
        title: "Analyze",
        description: "Deep stats: depth, type counts, most common keys, array size distribution.",
        shortcut: `${cmd}⇧A`,
      },
    ],
  },
  {
    heading: "Editor",
    features: [
      {
        icon: Search,
        iconColor: "text-sky-500",
        title: "Find",
        description: "Search inside the editor using Monaco's built-in find widget.",
        shortcut: "Ctrl+F",
      },
      {
        icon: Replace,
        iconColor: "text-sky-500",
        title: "Find & Replace",
        description: "Find and replace with optional regex mode — full power of Monaco.",
        shortcut: "Ctrl+H",
      },
      {
        icon: FoldVertical,
        iconColor: "text-amber-500",
        title: "Fold / Unfold",
        description: "Collapse any object or array. Fold All / Unfold All via the command menu.",
      },
      {
        icon: Braces,
        iconColor: "text-emerald-500",
        title: "Jump to Bracket",
        description: "Jump between matching brackets and braces inside any nested structure.",
      },
      {
        icon: SortAsc,
        iconColor: "text-indigo-500",
        title: "Sort Keys",
        description: "Alphabetically sort all keys at every depth when formatting.",
      },
    ],
  },
  {
    heading: "Workflow",
    features: [
      {
        icon: Layers,
        iconColor: "text-primary",
        title: "Multiple Tabs",
        description: "Keep up to 5 JSON workspaces open at once. Each tab remembers its own mode. Double-click to rename.",
      },
      {
        icon: Upload,
        iconColor: "text-pink-500",
        title: "Drag & Drop",
        description: "Drop any .json, .txt, or .log file anywhere on the editor to load it instantly.",
      },
      {
        icon: Share2,
        iconColor: "text-blue-500",
        title: "Share via URL",
        description: "Compress and encode your JSON into a shareable URL — no server involved.",
        shortcut: `${cmd}S`,
      },
      {
        icon: Download,
        iconColor: "text-teal-500",
        title: "Download",
        description: "Save the current JSON to a file directly from the browser.",
      },
    ],
  },
  {
    heading: "Keyboard Shortcuts",
    features: [
      {
        icon: Keyboard,
        iconColor: "text-muted-foreground",
        title: `${cmd}K`,
        description: "Open the command menu — search and run any action from here.",
      },
      {
        icon: Keyboard,
        iconColor: "text-muted-foreground",
        title: `${cmd}⇧F`,
        description: "Format the current JSON with the active indent setting.",
      },
      {
        icon: Keyboard,
        iconColor: "text-muted-foreground",
        title: `${cmd}D`,
        description: "Switch to Diff mode (pre-loads the current JSON as the left side).",
      },
      {
        icon: Keyboard,
        iconColor: "text-muted-foreground",
        title: `${cmd}T`,
        description: "Switch to Tree Explorer mode.",
      },
      {
        icon: Keyboard,
        iconColor: "text-muted-foreground",
        title: `${cmd}S`,
        description: "Open the Share dialog to get a URL for the current JSON.",
      },
      {
        icon: Keyboard,
        iconColor: "text-muted-foreground",
        title: `${cmd}⇧A`,
        description: "Open the Analyze dialog for deep JSON stats.",
      },
    ],
  },
];

interface FeaturesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeaturesDialog({ open, onOpenChange }: FeaturesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[82vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">What can JSONCraft do?</DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Everything runs in your browser — no data leaves your machine.
          </p>
        </DialogHeader>

        <div className="flex flex-col gap-6 mt-2">
          {SECTIONS.map((section) => (
            <div key={section.heading}>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                {section.heading}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {section.features.map((f) => {
                  const Icon = f.icon;
                  return (
                    <div
                      key={f.title}
                      className="flex gap-3 p-3 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors"
                    >
                      <div className="shrink-0 mt-0.5">
                        <Icon className={`h-4 w-4 ${f.iconColor}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-semibold text-foreground">{f.title}</span>
                          {f.shortcut && (
                            <kbd className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-mono leading-none">
                              {f.shortcut}
                            </kbd>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {f.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
