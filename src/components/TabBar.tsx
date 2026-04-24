import { useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tab } from "@/types";

interface TabBarProps {
  tabs: Tab[];
  activeId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onClose: (id: string) => void;
  onRename: (id: string, name: string) => void;
}

export function TabBar({ tabs, activeId, onSelect, onNew, onClose, onRename }: TabBarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = (e: React.MouseEvent, tab: Tab) => {
    e.stopPropagation();
    setEditingId(tab.id);
    setEditValue(tab.name);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commitEdit = () => {
    if (editingId && editValue.trim()) {
      onRename(editingId, editValue.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="flex items-center h-8 border-b border-border bg-muted/30 overflow-x-auto shrink-0 scrollbar-none">
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <div
            key={tab.id}
            className={cn(
              "flex items-center gap-1 pl-3 pr-2 h-full border-r border-border cursor-pointer group shrink-0 select-none min-w-0",
              isActive
                ? "bg-background text-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
            )}
            onClick={() => onSelect(tab.id)}
            onDoubleClick={(e) => startEdit(e, tab)}
          >
            {editingId === tab.id ? (
              <input
                ref={inputRef}
                className="text-xs bg-transparent border-none outline-none w-20 min-w-0 font-medium"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); commitEdit(); }
                  if (e.key === "Escape") setEditingId(null);
                }}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            ) : (
              <span className="text-xs font-medium truncate max-w-[6rem]">{tab.name}</span>
            )}
            {tabs.length > 1 && (
              <button
                className="opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:text-destructive shrink-0 ml-0.5 rounded p-0.5 transition-opacity"
                onClick={(e) => { e.stopPropagation(); onClose(tab.id); }}
                aria-label={`Close ${tab.name}`}
              >
                <X className="h-2.5 w-2.5" />
              </button>
            )}
          </div>
        );
      })}
      {tabs.length < 5 && (
        <button
          className="flex items-center justify-center h-full w-8 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors shrink-0"
          onClick={onNew}
          aria-label="New tab"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
