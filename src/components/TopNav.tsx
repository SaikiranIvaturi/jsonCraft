import * as TabsPrimitive from "@radix-ui/react-tabs";
import {
  Wand2,
  CheckCircle2,
  GitCompare,
  export function TopNav({
    mode,
    onModeChange,
    onShare,
    onCommandMenu,
    theme,
    onThemeToggle,
  }: TopNavProps) {
    return (
      <header className="h-12 border-b border-border flex flex-col sm:flex-row items-center justify-between px-2 sm:px-4 shrink-0 bg-card/80 backdrop-blur-sm sticky top-0 z-10 gap-1 sm:gap-0">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-center sm:justify-start">
          <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
            <Terminal className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-base sm:text-sm tracking-tight">JSONCraft</span>
        </div>

        {/* Mode tabs */}
        <TabsPrimitive.Root value={mode} onValueChange={(v) => onModeChange(v as Mode)}>
          <TabsPrimitive.List className="flex items-center bg-secondary rounded-lg p-0.5 gap-0.5 w-full sm:w-auto justify-center">
            {TABS.map(({ value, label, icon: Icon }) => (
              <TabsPrimitive.Trigger
                key={value}
                value={value}
                className={cn(
                  'flex items-center gap-1.5 px-2 sm:px-3 h-9 sm:h-7 rounded-md text-sm sm:text-xs font-medium transition-all',
                  'text-muted-foreground hover:text-foreground',
                  'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm'
                )}
              >
                <Icon className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                <span className="hidden xs:inline">{label}</span>
              </TabsPrimitive.Trigger>
            ))}
          </TabsPrimitive.List>
        </TabsPrimitive.Root>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0 w-full sm:w-auto justify-center sm:justify-end">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={onCommandMenu} className="gap-2 text-xs">
                <kbd className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{isMac ? '⌘K' : 'Ctrl+K'}</kbd>
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
            <TooltipContent>Share via URL ({shortcut('S')})</TooltipContent>
          </Tooltip>

          <ThemeToggle theme={theme} onToggle={onThemeToggle} />
        </div>
      </header>
    );
  }
              className={cn(
                "flex items-center gap-1.5 px-3 h-7 rounded-md text-xs font-medium transition-all",
                "text-muted-foreground hover:text-foreground",
                "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
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
              className="gap-2 text-xs"
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
            <Button
              variant="ghost"
              size="icon"
              onClick={onShare}
              aria-label="Share"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Share via URL ({shortcut("S")})</TooltipContent>
        </Tooltip>

        <ThemeToggle theme={theme} onToggle={onThemeToggle} />
      </div>
    </header>
  );
}
