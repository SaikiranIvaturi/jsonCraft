import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Eye, Table2, LayoutGrid, BarChart2, Database,
  ChevronLeft, ChevronRight, Search, Hash, Type,
  ToggleLeft, Calendar, Link, Mail, Layers, ImageIcon,
  Palette, Activity, ChevronUp, ChevronDown, AlertCircle,
  ArrowLeft, Trophy, Clock, List, ArrowLeftRight, ShoppingBag,
  Check, Sparkles, Kanban, Grid3X3, FileText, Braces,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewTab   = "patterns" | "grid" | "gallery" | "dashboard" | "profiler" | "record" | "document";
type PatternId = "kanban" | "leaderboard" | "timeline" | "metrics" | "feed" | "comparison" | "heatmap" | "product";
type DocTab    = "outline" | "tabs" | "tree" | "tables";

interface DetectedTable {
  path: string;
  title?: string;
  subtitle?: string;
  columns: { id: string; label: string; type?: string }[];
  rows: Record<string, unknown>[];
}
type FieldType = "id" | "text" | "longtext" | "number" | "integer" | "boolean"
               | "date" | "url" | "image" | "email" | "color" | "status" | "nested" | "unknown";

interface FieldInfo {
  key: string;
  type: FieldType;
  nullPct: number;
  uniqueCount: number;
  topValues: { label: string; count: number; pct: number }[];
  numStats?: { min: number; max: number; avg: number; sum: number };
}

interface DatasetInfo {
  rows: Record<string, unknown>[];
  fields: FieldInfo[];
  nameKey?: string;
  avatarKey?: string;
  statusKey?: string;
  descKey?: string;
  numKey?: string;
  dateKey?: string;
  labelKey?: string;
}

interface Props { open: boolean; onOpenChange: (open: boolean) => void; json: string }

// ─── Palette & status styles ──────────────────────────────────────────────────

const PALETTE = ["#8b5cf6","#3b82f6","#10b981","#f59e0b","#ef4444","#ec4899","#06b6d4","#84cc16","#f97316","#a855f7"];

const S_GREEN  = "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400";
const S_RED    = "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/40 dark:border-red-800 dark:text-red-400";
const S_AMBER  = "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-400";
const S_BLUE   = "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-400";
const S_PURPLE = "bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-950/40 dark:border-purple-800 dark:text-purple-400";
const S_GRAY   = "bg-muted border-border text-muted-foreground";

function statusVariant(v: string): string {
  const l = v.toLowerCase();
  if (["active","enabled","success","yes","true","online","live","published","complete","done","approved","healthy","running","open","verified"].some(k => l === k || l.includes(k))) return "green";
  if (["inactive","disabled","error","no","false","offline","failed","rejected","deleted","closed","banned","blocked","down","critical","expired"].some(k => l === k || l.includes(k))) return "red";
  if (["pending","processing","warning","draft","review","partial","paused","suspended","idle","queued","waiting","scheduled"].some(k => l === k || l.includes(k))) return "amber";
  if (["info","new","in_progress","in progress","planned","todo","open_"].some(k => l === k || l.includes(k))) return "blue";
  if (["admin","owner","superuser","moderator","manager","premium"].some(k => l === k || l.includes(k))) return "purple";
  return "gray";
}

const STATUS_STYLE_MAP: Record<string, string> = { green: S_GREEN, red: S_RED, amber: S_AMBER, blue: S_BLUE, purple: S_PURPLE, gray: S_GRAY };

// ─── Data analysis ────────────────────────────────────────────────────────────

function detectType(key: string, vals: unknown[]): FieldType {
  if (!vals.length) return "unknown";
  const kl = key.toLowerCase();
  if (vals.every(v => typeof v === "boolean")) return "boolean";
  if (vals.every(v => typeof v === "object" && v !== null)) return "nested";
  if (vals.every(v => typeof v === "number")) {
    return vals.every(v => Number.isInteger(v as number)) ? "integer" : "number";
  }
  if (vals.every(v => typeof v === "string")) {
    const ss = vals as string[];
    if (ss.every(s => /^#([0-9a-fA-F]{3}){1,2}$/.test(s))) return "color";
    if (ss.some(s => /\.(jpe?g|png|gif|webp|svg|avif)(\?.*)?$/i.test(s))) return "image";
    if (ss.every(s => /^https?:\/\//i.test(s))) return "url";
    if (ss.every(s => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s))) return "email";
    const sample = ss.slice(0, 5);
    if (sample.every(s => !isNaN(Date.parse(s)) && /\d{4}[-/]\d{1,2}/.test(s))) return "date";
    if (new Set(ss.map(s => s.toLowerCase())).size <= 8 && ss.length >= 3) return "status";
    if (ss.some(s => s.length > 80)) return "longtext";
    if (kl === "id" || kl.endsWith("_id") || kl.endsWith("id")) return "id";
    return "text";
  }
  return "unknown";
}

function analyzeDataset(parsed: unknown): DatasetInfo | null {
  let rows: Record<string, unknown>[];
  if (Array.isArray(parsed)) {
    rows = parsed.filter(x => x !== null && typeof x === "object" && !Array.isArray(x)) as Record<string, unknown>[];
    if (!rows.length) return null;
  } else if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
    rows = [parsed as Record<string, unknown>];
  } else return null;

  const n = rows.length;
  const allKeys = Array.from(new Set(rows.flatMap(r => Object.keys(r)))).slice(0, 25);

  const fields: FieldInfo[] = allKeys.map(key => {
    const vals = rows.map(r => r[key]);
    const nonNull = vals.filter(v => v !== null && v !== undefined);
    const counts: Record<string, number> = {};
    nonNull.forEach(v => {
      const k = typeof v === "object" ? (Array.isArray(v) ? "[array]" : "[object]") : String(v);
      counts[k] = (counts[k] ?? 0) + 1;
    });
    const topValues = Object.entries(counts).sort(([,a],[,b]) => b-a).slice(0,6).map(([label,count]) => ({ label, count, pct: (count/n)*100 }));
    const type = detectType(key, nonNull);
    let numStats: FieldInfo["numStats"];
    if (nonNull.length && nonNull.every(v => typeof v === "number")) {
      const nums = nonNull as number[];
      const sum = nums.reduce((a,b) => a+b, 0);
      numStats = { min: Math.min(...nums), max: Math.max(...nums), avg: sum/nums.length, sum };
    }
    return { key, type, nullPct: n > 0 ? ((n-nonNull.length)/n)*100 : 0, uniqueCount: Object.keys(counts).length, topValues, numStats };
  });

  const byName  = (...ns: string[]) => fields.find(f => ns.some(n => f.key.toLowerCase() === n))?.key;
  const bySub   = (...ss: string[]) => fields.find(f => ss.some(s => f.key.toLowerCase().includes(s)))?.key;
  const byType  = (...ts: FieldType[]) => fields.find(f => ts.includes(f.type))?.key;

  const nameKey   = byName("name","title","label","username","fullname","full_name","display_name","displayname") ?? bySub("name","title","label");
  const avatarKey = bySub("avatar","image","img","photo","picture","thumbnail","logo");
  const statusKey = byType("status") ?? bySub("status","state");
  const descKey   = bySub("description","desc","bio","summary","about","content","body","details");
  const numKey    = fields.find(f => (f.type==="number"||f.type==="integer") && !["id","year","index","page"].some(e => f.key.toLowerCase().includes(e)))?.key ?? byType("number","integer");
  const dateKey   = byType("date");
  const labelKey  = nameKey ?? byType("text","id");

  return { rows, fields, nameKey, avatarKey, statusKey, descKey, numKey, dateKey, labelKey };
}

// ─── Shared components ────────────────────────────────────────────────────────

function TypeIcon({ type, className }: { type: FieldType; className?: string }) {
  const cls = cn("h-3 w-3 shrink-0", className);
  switch (type) {
    case "integer": case "number": return <Hash className={cn(cls,"text-blue-400")} />;
    case "boolean":  return <ToggleLeft className={cn(cls,"text-amber-400")} />;
    case "date":     return <Calendar className={cn(cls,"text-violet-400")} />;
    case "url":      return <Link className={cn(cls,"text-sky-400")} />;
    case "image":    return <ImageIcon className={cn(cls,"text-pink-400")} />;
    case "email":    return <Mail className={cn(cls,"text-teal-400")} />;
    case "color":    return <Palette className={cn(cls,"text-rose-400")} />;
    case "status":   return <Activity className={cn(cls,"text-emerald-400")} />;
    case "nested":   return <Layers className={cn(cls,"text-orange-400")} />;
    default:         return <Type className={cn(cls,"text-muted-foreground")} />;
  }
}

function StatusBadge({ value }: { value: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider", STATUS_STYLE_MAP[statusVariant(value)])}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />{value}
    </span>
  );
}

function Cell({ value, type, search }: { value: unknown; type: FieldType; search?: string }) {
  if (value === null || value === undefined) return <span className="text-muted-foreground/30 italic select-none">—</span>;
  const str = String(value);
  switch (type) {
    case "boolean":  return (value as boolean)
      ? <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold", S_GREEN)}>TRUE</span>
      : <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold", S_RED)}>FALSE</span>;
    case "status":   return <StatusBadge value={str} />;
    case "number": case "integer": return <span className="font-mono text-blue-500 dark:text-blue-400 tabular-nums">{Number(value).toLocaleString()}</span>;
    case "date":     try { return <span className="text-violet-600 dark:text-violet-400 font-mono text-[11px]">{new Date(str).toLocaleDateString(undefined,{year:"numeric",month:"short",day:"numeric"})}</span>; } catch { return <span>{str}</span>; }
    case "color":    return <div className="flex items-center gap-1.5"><div className="h-3.5 w-3.5 rounded border border-border/50 shrink-0" style={{ background: str }} /><span className="font-mono text-[11px]">{str}</span></div>;
    case "email":    return <span className="text-violet-600 dark:text-violet-400 font-mono text-[11px]">{str}</span>;
    case "url": case "image": return <span className="text-sky-500 dark:text-sky-400 text-[11px] font-mono truncate" title={str}>{str.replace(/^https?:\/\/(www\.)?/,"").slice(0,30)}</span>;
    case "nested":   return Array.isArray(value) ? <span className="text-muted-foreground text-[11px] font-mono">[{(value as unknown[]).length} items]</span> : <span className="text-muted-foreground text-[11px] font-mono">{"{"}{Object.keys(value as object).length} keys{"}"}</span>;
    case "id":       return <span className="font-mono text-[11px] text-muted-foreground">{str}</span>;
    default: {
      if (search && str.toLowerCase().includes(search.toLowerCase())) {
        const i = str.toLowerCase().indexOf(search.toLowerCase());
        return <span className="truncate max-w-[180px]">{str.slice(0,i)}<mark className="bg-yellow-200 dark:bg-yellow-800/60 rounded-sm px-0.5">{str.slice(i,i+search.length)}</mark>{str.slice(i+search.length)}</span>;
      }
      return <span className="truncate max-w-[180px] inline-block" title={str}>{str.length > 60 ? str.slice(0,60)+"…" : str}</span>;
    }
  }
}

function strColor(s: string) { let h=0; for (let i=0;i<s.length;i++) h=s.charCodeAt(i)+((h<<5)-h); return PALETTE[Math.abs(h)%PALETTE.length]; }
function getInitials(name: string) { return name.trim().split(/\s+/).slice(0,2).map(w=>w[0]?.toUpperCase()??"").join("")||"?"; }

function Avatar({ name, src, size="md" }: { name: string; src?: string; size?: "sm"|"md"|"lg" }) {
  const [err, setErr] = useState(false);
  const sz = size==="sm" ? "h-8 w-8 text-xs" : size==="lg" ? "h-14 w-14 text-base" : "h-10 w-10 text-sm";
  if (src && !err) return <img src={src} alt={name} className={cn(sz,"rounded-full object-cover shrink-0 border border-border/50")} onError={()=>setErr(true)} />;
  return <div className={cn(sz,"rounded-full flex items-center justify-center font-bold text-white shrink-0 select-none")} style={{background:strColor(name)}}>{getInitials(name)}</div>;
}

function NotApplicable({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-48 text-center gap-2 p-6">
      <AlertCircle className="h-7 w-7 text-muted-foreground/30" />
      <p className="text-sm font-medium text-muted-foreground">{label} isn't a great fit for this JSON</p>
      <p className="text-xs text-muted-foreground/50 max-w-xs leading-relaxed">Try a different pattern or add more structured fields.</p>
    </div>
  );
}

// ─── Pattern 1: Kanban Board ──────────────────────────────────────────────────

function KanbanFull({ ds }: { ds: DatasetInfo }) {
  const groupKey = ds.statusKey ?? ds.fields.find(f => f.uniqueCount <= 8 && f.type !== "nested" && f.type !== "longtext")?.key;
  if (!groupKey) return <NotApplicable label="Kanban Board" />;

  const groups: Record<string, Record<string, unknown>[]> = {};
  ds.rows.forEach(row => {
    const k = String(row[groupKey] ?? "Uncategorized");
    (groups[k] = groups[k] ?? []).push(row);
  });

  const extraFields = ds.fields.filter(f => f.key !== ds.nameKey && f.key !== groupKey && f.key !== ds.avatarKey && f.type !== "nested").slice(0,2);

  return (
    <div className="h-full overflow-auto p-4">
      <div className="flex gap-3 min-w-max pb-2">
        {Object.entries(groups).map(([status, items], gi) => (
          <div key={status} className="w-72 flex flex-col gap-2.5 shrink-0">
            {/* Column header */}
            <div className="flex items-center justify-between px-3 py-2 rounded-xl border border-border bg-card/80 sticky top-0 z-10">
              <StatusBadge value={status} />
              <span className="text-xs font-mono font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{items.length}</span>
            </div>
            {/* Cards */}
            {items.slice(0, 12).map((item, i) => {
              const nameVal = ds.nameKey ? String(item[ds.nameKey] ?? `Item ${i+1}`) : `Item ${i+1}`;
              const avatarSrc = ds.avatarKey ? String(item[ds.avatarKey] ?? "") : undefined;
              return (
                <div key={i} className={cn("rounded-xl border bg-card p-3.5 hover:shadow-md transition-all duration-200 cursor-default", "border-border hover:border-primary/30 group")}>
                  <div className="flex items-start gap-2.5 mb-2">
                    <Avatar name={nameVal} src={avatarSrc?.startsWith("http") ? avatarSrc : undefined} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{nameVal}</p>
                      {ds.dateKey && !!item[ds.dateKey] && (
                        <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                          {(() => { try { return new Date(String(item[ds.dateKey])).toLocaleDateString(undefined,{month:"short",day:"numeric"}); } catch { return ""; } })()}
                        </p>
                      )}
                    </div>
                  </div>
                  {!!ds.descKey && !!item[ds.descKey] && (
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2 leading-relaxed">{String(item[ds.descKey])}</p>
                  )}
                  {extraFields.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-border/50">
                      {extraFields.map(f => item[f.key] !== undefined && item[f.key] !== null ? (
                        <div key={f.key} className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                          <TypeIcon type={f.type} /><span className="truncate max-w-[60px]">{String(item[f.key]).slice(0,20)}</span>
                        </div>
                      ) : null)}
                    </div>
                  )}
                </div>
              );
            })}
            {items.length > 12 && (
              <div className="text-center py-2 text-xs text-muted-foreground/50 border border-dashed border-border rounded-xl">
                +{items.length - 12} more
              </div>
            )}
            {/* Empty column placeholder */}
            <div className="rounded-xl border border-dashed border-border/40 px-3 py-2 text-center text-[10px] text-muted-foreground/30" style={{borderColor: PALETTE[gi%PALETTE.length]+"40"}}>
              {status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Pattern 2: Leaderboard ───────────────────────────────────────────────────

const MEDALS = ["🥇","🥈","🥉"];

function LeaderboardFull({ ds }: { ds: DatasetInfo }) {
  if (!ds.numKey) return <NotApplicable label="Leaderboard" />;
  const sorted = [...ds.rows].filter(r => typeof r[ds.numKey!] === "number").sort((a,b) => (b[ds.numKey!] as number)-(a[ds.numKey!] as number));
  if (!sorted.length) return <NotApplicable label="Leaderboard" />;
  const max = sorted[0][ds.numKey!] as number;
  const extraKey = ds.fields.find(f => f.key !== ds.nameKey && f.key !== ds.numKey && f.key !== ds.avatarKey && (f.type === "status" || f.type === "text"))?.key;

  return (
    <div className="h-full overflow-y-auto p-5 flex flex-col gap-2.5">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-2 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">
        <span className="w-8 text-center">#</span>
        <span className="flex-1">Name</span>
        <span className="w-48 hidden sm:block">{ds.numKey}</span>
        <span className="w-16 text-right font-mono">Score</span>
      </div>
      {sorted.slice(0, 20).map((row, i) => {
        const nameVal = ds.nameKey ? String(row[ds.nameKey] ?? `#${i+1}`) : `#${i+1}`;
        const val = row[ds.numKey!] as number;
        const pct = max > 0 ? (val/max)*100 : 0;
        const avatarSrc = ds.avatarKey ? String(row[ds.avatarKey] ?? "") : undefined;
        const isTop = i < 3;
        return (
          <div key={i} className={cn("flex items-center gap-4 px-4 py-3 rounded-xl border transition-all cursor-default hover:shadow-sm",
            i===0 ? "bg-yellow-50/80 border-yellow-300/60 dark:bg-yellow-950/30 dark:border-yellow-700/40" :
            i===1 ? "bg-slate-50/80 border-slate-300/60 dark:bg-slate-950/30 dark:border-slate-600/40" :
            i===2 ? "bg-amber-50/80 border-amber-400/30 dark:bg-amber-950/20 dark:border-amber-700/30" :
            "bg-card/60 border-border hover:bg-muted/20")}>
            {/* Rank */}
            <div className="w-8 text-center shrink-0">
              {isTop ? <span className="text-lg">{MEDALS[i]}</span> : <span className="text-sm font-mono font-bold text-muted-foreground/60">{i+1}</span>}
            </div>
            {/* Avatar + Name */}
            <Avatar name={nameVal} src={avatarSrc?.startsWith("http") ? avatarSrc : undefined} size="sm" />
            <div className="flex-1 min-w-0">
              <p className={cn("font-semibold text-sm truncate", isTop && "text-foreground")}>{nameVal}</p>
              {extraKey && !!row[extraKey] && <p className="text-[10px] text-muted-foreground"><Cell value={row[extraKey]} type={ds.fields.find(f=>f.key===extraKey)!.type} /></p>}
            </div>
            {/* Bar */}
            <div className="w-48 hidden sm:flex items-center gap-2">
              <div className="flex-1 bg-muted/60 rounded-full h-2.5 overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width:`${pct}%`, background: i<3 ? ["#f59e0b","#94a3b8","#d97706"][i] : PALETTE[(i-3)%PALETTE.length] }} />
              </div>
              <span className="text-[10px] font-mono text-muted-foreground w-8 text-right">{pct.toFixed(0)}%</span>
            </div>
            {/* Score */}
            <span className={cn("w-16 text-right font-mono font-bold tabular-nums shrink-0", isTop ? "text-base" : "text-sm text-foreground")}>{val.toLocaleString()}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Pattern 3: Timeline ──────────────────────────────────────────────────────

function TimelineFull({ ds }: { ds: DatasetInfo }) {
  const sorted = ds.dateKey
    ? [...ds.rows].sort((a,b) => Date.parse(String(a[ds.dateKey!]??0)) - Date.parse(String(b[ds.dateKey!]??0)))
    : ds.rows;

  return (
    <div className="h-full overflow-y-auto px-6 py-4">
      <div className="relative max-w-2xl mx-auto">
        {/* Vertical line */}
        <div className="absolute left-[88px] top-0 bottom-0 w-px bg-gradient-to-b from-primary/60 via-border to-transparent" />
        <div className="flex flex-col gap-5">
          {sorted.slice(0, 15).map((row, i) => {
            const nameVal = ds.nameKey ? String(row[ds.nameKey] ?? `Event ${i+1}`) : `Event ${i+1}`;
            const dateVal = ds.dateKey ? row[ds.dateKey] : null;
            const statusVal = ds.statusKey ? row[ds.statusKey] : null;
            const avatarSrc = ds.avatarKey ? String(row[ds.avatarKey] ?? "") : undefined;
            return (
              <div key={i} className="flex items-start gap-5">
                {/* Date label */}
                <div className="w-20 text-right shrink-0 pt-3.5">
                  {dateVal ? (
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-bold text-muted-foreground font-mono">
                        {(() => { try { return new Date(String(dateVal)).toLocaleDateString(undefined,{month:"short",day:"numeric"}); } catch { return ""; } })()}
                      </span>
                      <span className="text-[9px] text-muted-foreground/50 font-mono">
                        {(() => { try { return new Date(String(dateVal)).getFullYear(); } catch { return ""; } })()}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs font-mono text-muted-foreground/40">#{i+1}</span>
                  )}
                </div>
                {/* Node */}
                <div className="relative z-10 mt-3.5 shrink-0">
                  <div className={cn("h-4 w-4 rounded-full border-2 bg-background transition-all", i===0 ? "border-primary scale-125" : "border-border hover:border-primary/60")} />
                </div>
                {/* Card */}
                <div className="flex-1 min-w-0 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all p-4 group">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar name={nameVal} src={avatarSrc?.startsWith("http") ? avatarSrc : undefined} size="sm" />
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{nameVal}</p>
                      </div>
                    </div>
                    {statusVal !== null && <StatusBadge value={String(statusVal)} />}
                  </div>
                  {!!ds.descKey && !!row[ds.descKey] && (
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">{String(row[ds.descKey])}</p>
                  )}
                  {ds.numKey && row[ds.numKey] !== undefined && (
                    <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border/40">
                      <span className="text-[10px] text-muted-foreground capitalize">{ds.numKey}</span>
                      <span className="font-mono font-bold text-primary text-sm">{Number(row[ds.numKey]).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Pattern 4: Metric Cards ──────────────────────────────────────────────────

function MetricCardsFull({ ds }: { ds: DatasetInfo }) {
  const numFields = ds.fields.filter(f => (f.type==="number"||f.type==="integer") && f.numStats);
  if (!ds.numKey && !numFields.length) return <NotApplicable label="Metric Cards" />;

  const primaryField = numFields.find(f => f.key === ds.numKey) ?? numFields[0];
  const maxVal = primaryField?.numStats?.max ?? 1;

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {ds.rows.slice(0, 24).map((row, i) => {
          const nameVal = ds.nameKey ? String(row[ds.nameKey] ?? `Item ${i+1}`) : `Item ${i+1}`;
          const avatarSrc = ds.avatarKey ? String(row[ds.avatarKey] ?? "") : undefined;
          const primaryVal = primaryField ? (row[primaryField.key] as number | null | undefined) : null;
          const statusVal = ds.statusKey ? row[ds.statusKey] : null;
          const pct = (primaryVal != null && maxVal > 0) ? (primaryVal / maxVal) * 100 : 0;
          const isTop = primaryVal != null && primaryVal === maxVal;
          const secondaryFields = numFields.filter(f => f.key !== primaryField?.key).slice(0, 2);

          return (
            <div key={i} className={cn("rounded-xl border bg-card p-4 flex flex-col gap-3 hover:shadow-md hover:border-primary/30 transition-all cursor-default relative overflow-hidden",
              isTop ? "border-yellow-300/60 bg-yellow-50/30 dark:bg-yellow-950/20" : "border-border")}>
              {isTop && <div className="absolute top-2 right-2 text-base">⭐</div>}
              {/* Header */}
              <div className="flex items-center gap-2">
                <Avatar name={nameVal} src={avatarSrc?.startsWith("http") ? avatarSrc : undefined} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{nameVal}</p>
                  {statusVal !== null && <div className="mt-0.5"><StatusBadge value={String(statusVal)} /></div>}
                </div>
              </div>
              {/* Primary metric */}
              {primaryField && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">{primaryField.key}</p>
                  <p className={cn("text-2xl font-bold font-mono tabular-nums", isTop ? "text-yellow-600 dark:text-yellow-400" : "text-foreground")}>
                    {primaryVal != null ? primaryVal.toLocaleString() : "—"}
                  </p>
                  <div className="mt-1.5 bg-muted/60 rounded-full h-1.5 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width:`${pct}%`, background: isTop ? "#f59e0b" : PALETTE[i%PALETTE.length] }} />
                  </div>
                </div>
              )}
              {/* Secondary metrics */}
              {secondaryFields.length > 0 && (
                <div className="flex gap-3 pt-2 border-t border-border/40">
                  {secondaryFields.map(f => (
                    <div key={f.key} className="flex-1 min-w-0">
                      <p className="text-[9px] uppercase tracking-wider text-muted-foreground/60">{f.key}</p>
                      <p className="text-xs font-mono font-bold">{row[f.key] != null ? Number(row[f.key]).toLocaleString() : "—"}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Pattern 5: Feed ─────────────────────────────────────────────────────────

function FeedFull({ ds }: { ds: DatasetInfo }) {
  const tagFields = ds.fields.filter(f => f.key !== ds.nameKey && f.key !== ds.descKey && f.key !== ds.avatarKey && f.key !== ds.statusKey && f.type === "status").slice(0, 2);
  const metaFields = ds.fields.filter(f => f.key !== ds.nameKey && f.key !== ds.descKey && f.key !== ds.avatarKey && f.key !== ds.statusKey && !tagFields.find(t=>t.key===f.key) && (f.type==="text"||f.type==="id"||f.type==="email")).slice(0,1);

  return (
    <div className="h-full overflow-y-auto p-4 flex flex-col gap-0">
      {ds.rows.slice(0, 20).map((row, i) => {
        const nameVal = ds.nameKey ? String(row[ds.nameKey] ?? `User ${i+1}`) : `User ${i+1}`;
        const descVal = ds.descKey ? row[ds.descKey] : null;
        const avatarSrc = ds.avatarKey ? String(row[ds.avatarKey] ?? "") : undefined;
        const statusVal = ds.statusKey ? row[ds.statusKey] : null;
        const dateVal = ds.dateKey ? row[ds.dateKey] : null;

        return (
          <div key={i} className={cn("flex gap-4 px-4 py-4 hover:bg-muted/20 transition-colors cursor-default", i < ds.rows.length-1 && "border-b border-border/50")}>
            <Avatar name={nameVal} src={avatarSrc?.startsWith("http") ? avatarSrc : undefined} size="md" />
            <div className="flex-1 min-w-0">
              {/* Name + meta + date */}
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <span className="font-semibold text-sm text-foreground">{nameVal}</span>
                  {metaFields.map(f => !!row[f.key] && (
                    <span key={f.key} className="text-xs text-muted-foreground font-mono">{String(row[f.key]).slice(0,30)}</span>
                  ))}
                  {statusVal !== null && <StatusBadge value={String(statusVal)} />}
                </div>
                {!!dateVal && (
                  <span className="text-[11px] text-muted-foreground/60 font-mono shrink-0">
                    {(() => { try { return new Date(String(dateVal)).toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"}); } catch { return ""; } })()}
                  </span>
                )}
              </div>
              {/* Description */}
              {!!descVal && (
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{String(descVal)}</p>
              )}
              {/* Numeric fields as small stats */}
              {ds.numKey && row[ds.numKey] !== undefined && (
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[10px] text-muted-foreground/60">{ds.numKey}:</span>
                  <span className="text-xs font-mono font-bold text-primary">{Number(row[ds.numKey]).toLocaleString()}</span>
                </div>
              )}
              {/* Tag pills */}
              {tagFields.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tagFields.map(f => !!row[f.key] && (
                    <StatusBadge key={f.key} value={String(row[f.key])} />
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Pattern 6: Comparison Matrix ────────────────────────────────────────────

function ComparisonFull({ ds }: { ds: DatasetInfo }) {
  const records = ds.rows.slice(0, 5);
  const showFields = ds.fields.filter(f => f.type !== "nested" && f.type !== "longtext" && f.key !== ds.avatarKey).slice(0, 15);

  return (
    <div className="h-full overflow-auto p-4">
      <table className="w-full text-xs border-collapse min-w-max">
        <thead>
          <tr>
            <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b-2 border-border w-32 sticky left-0 bg-card/95 z-10">Field</th>
            {records.map((row, i) => {
              const nameVal = ds.nameKey ? String(row[ds.nameKey] ?? `Record ${i+1}`) : `Record ${i+1}`;
              const avatarSrc = ds.avatarKey ? String(row[ds.avatarKey] ?? "") : undefined;
              return (
                <th key={i} className="px-4 py-3 border-b-2 border-border text-center min-w-[140px]">
                  <div className="flex flex-col items-center gap-1.5">
                    <Avatar name={nameVal} src={avatarSrc?.startsWith("http") ? avatarSrc : undefined} size="sm" />
                    <span className="font-semibold text-foreground truncate max-w-[120px]">{nameVal}</span>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {showFields.map((f, fi) => {
            const vals = records.map(r => r[f.key]);
            const hasVariation = new Set(vals.map(v => String(v ?? ""))).size > 1;
            return (
              <tr key={f.key} className={cn("border-b border-border/30 hover:bg-muted/20", fi%2!==0&&"bg-muted/10")}>
                {/* Field name */}
                <td className="px-4 py-2.5 sticky left-0 bg-inherit z-10">
                  <div className="flex items-center gap-1.5">
                    <TypeIcon type={f.type} />
                    <span className="font-semibold text-muted-foreground capitalize">{f.key.replace(/_/g," ")}</span>
                    {hasVariation && <span className="text-[8px] text-amber-500 font-bold uppercase ml-auto">differs</span>}
                  </div>
                </td>
                {/* Values */}
                {records.map((row, ri) => {
                  const v = row[f.key];
                  const allVals = vals.filter(x => x!==null&&x!==undefined);
                  const isMax = f.type==="number"||f.type==="integer" ? v===Math.max(...allVals.map(Number)) : false;
                  const isMin = f.type==="number"||f.type==="integer" ? v===Math.min(...allVals.map(Number)) : false;
                  return (
                    <td key={ri} className={cn("px-4 py-2.5 text-center", isMax&&"bg-emerald-50/50 dark:bg-emerald-950/20", isMin&&allVals.length>1&&"bg-red-50/50 dark:bg-red-950/20")}>
                      <Cell value={v} type={f.type} />
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      {ds.rows.length > 5 && <p className="text-xs text-muted-foreground/50 text-center mt-3">Comparing first 5 of {ds.rows.length} records</p>}
    </div>
  );
}

// ─── Pattern 7: Heat Map ──────────────────────────────────────────────────────

function HeatMapFull({ ds }: { ds: DatasetInfo }) {
  const numFields = ds.fields.filter(f => (f.type==="number"||f.type==="integer") && f.numStats).slice(0,8);
  if (numFields.length < 2) return <NotApplicable label="Heat Map" />;

  const rows = ds.rows.slice(0, 15);

  function heatColor(val: number, min: number, max: number): string {
    if (max===min) return "#8b5cf6";
    const t = (val-min)/(max-min);
    if (t < 0.33) return `rgb(${Math.round(59+t*3*(96-59))},${Math.round(130+t*3*(165-130))},${Math.round(246+t*3*(0-246))})`;
    if (t < 0.66) return `rgb(${Math.round(16+(t-0.33)*3*(245-16))},${Math.round(185+(t-0.33)*3*(158-185))},${Math.round(129+(t-0.33)*3*(11-129))})`;
    return `rgb(${Math.round(245+(t-0.66)*3*(239-245))},${Math.round(158+(t-0.66)*3*(68-158))},${Math.round(11+(t-0.66)*3*(68-11))})`;
  }

  return (
    <div className="h-full overflow-auto p-4">
      {/* Legend */}
      <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
        <span>Low</span>
        <div className="h-3 flex-1 max-w-32 rounded-full" style={{background:"linear-gradient(to right,#3b82f6,#10b981,#f59e0b,#ef4444)"}} />
        <span>High</span>
      </div>
      <table className="w-full text-xs border-collapse min-w-max">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border w-32">Record</th>
            {numFields.map(f => (
              <th key={f.key} className="px-2 py-2 text-center text-[10px] font-semibold text-muted-foreground border-b border-border min-w-[80px]">
                <div className="flex flex-col gap-0.5">
                  <span className="capitalize">{f.key.replace(/_/g," ")}</span>
                  <span className="text-[9px] opacity-50 font-mono">{f.numStats?.min.toFixed(0)}–{f.numStats?.max.toFixed(0)}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => {
            const nameVal = ds.nameKey ? String(row[ds.nameKey] ?? `Row ${ri+1}`) : `Row ${ri+1}`;
            return (
              <tr key={ri} className="border-b border-border/20">
                <td className="px-4 py-1.5 font-medium text-muted-foreground truncate max-w-[120px]">{nameVal}</td>
                {numFields.map(f => {
                  const v = row[f.key];
                  const num = typeof v === "number" ? v : null;
                  const { min=0, max=1 } = f.numStats ?? {};
                  const bg = num !== null ? heatColor(num, min, max) : undefined;
                  return (
                    <td key={f.key} className="px-2 py-1 text-center">
                      <div className="rounded-lg py-2 px-1 transition-transform hover:scale-105 cursor-default" style={{ background: bg ? bg+"cc" : undefined, minWidth: 60 }}>
                        {num !== null ? (
                          <span className="font-mono font-bold text-white text-xs drop-shadow">{num.toLocaleString()}</span>
                        ) : (
                          <span className="text-muted-foreground/30 text-xs">—</span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Pattern 8: Product Shelf ─────────────────────────────────────────────────

function ProductShelfFull({ ds }: { ds: DatasetInfo }) {
  const priceField = ds.numKey ?? ds.fields.find(f => (f.type==="number"||f.type==="integer") && ["price","cost","amount","salary","value","revenue","budget","fee"].some(k=>f.key.toLowerCase().includes(k)))?.key;
  const extraFields = ds.fields.filter(f => f.key!==ds.nameKey && f.key!==ds.avatarKey && f.key!==ds.statusKey && f.key!==priceField && f.key!==ds.descKey && f.type!=="nested" && f.type!=="longtext").slice(0,2);

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {ds.rows.slice(0, 24).map((row, i) => {
          const nameVal = ds.nameKey ? String(row[ds.nameKey] ?? `Product ${i+1}`) : `Product ${i+1}`;
          const avatarSrc = ds.avatarKey ? String(row[ds.avatarKey] ?? "") : undefined;
          const statusVal = ds.statusKey ? row[ds.statusKey] : null;
          const priceVal = priceField ? row[priceField] : null;
          const color = strColor(nameVal);

          return (
            <div key={i} className="rounded-xl border border-border bg-card overflow-hidden hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-200 cursor-default group">
              {/* Image area */}
              <div className="relative h-36 flex items-center justify-center overflow-hidden" style={{ background: `linear-gradient(135deg, ${color}22, ${color}44)` }}>
                {avatarSrc && avatarSrc.startsWith("http") ? (
                  <img src={avatarSrc} alt={nameVal} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={e=>(e.currentTarget.style.display="none")} />
                ) : (
                  <div className="text-4xl font-black opacity-20 select-none" style={{ color }}>{getInitials(nameVal)}</div>
                )}
                {statusVal !== null && (
                  <div className="absolute top-2 right-2"><StatusBadge value={String(statusVal)} /></div>
                )}
                {priceVal !== null && priceVal !== undefined && (
                  <div className="absolute bottom-2 left-2 bg-background/95 backdrop-blur-sm border border-border rounded-lg px-2.5 py-1">
                    <span className="font-mono font-bold text-sm text-foreground">{typeof priceVal==="number" ? `$${priceVal.toLocaleString()}` : String(priceVal)}</span>
                  </div>
                )}
              </div>
              {/* Details */}
              <div className="p-3">
                <p className="font-semibold text-sm text-foreground truncate mb-1">{nameVal}</p>
                {!!ds.descKey && !!row[ds.descKey] && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{String(row[ds.descKey])}</p>
                )}
                {extraFields.length > 0 && (
                  <div className="flex flex-col gap-1 mt-2 pt-2 border-t border-border/40">
                    {extraFields.map(f => row[f.key] !== undefined && row[f.key] !== null ? (
                      <div key={f.key} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <TypeIcon type={f.type} />
                        <span className="truncate"><Cell value={row[f.key]} type={f.type} /></span>
                      </div>
                    ) : null)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Pattern suitability ──────────────────────────────────────────────────────

function getSuitability(id: PatternId, ds: DatasetInfo): 0|1|2|3 {
  const nums = ds.fields.filter(f=>f.type==="number"||f.type==="integer");
  switch (id) {
    case "kanban":      return ds.statusKey ? 3 : ds.fields.some(f=>f.type==="status") ? 2 : 1;
    case "leaderboard": return ds.numKey && ds.labelKey ? 3 : ds.numKey ? 2 : 0;
    case "timeline":    return ds.dateKey ? 3 : ds.rows.length>3 ? 1 : 0;
    case "metrics":     return nums.length>=3 ? 3 : nums.length>=1 ? 2 : 1;
    case "feed":        return ds.nameKey && ds.descKey ? 3 : ds.nameKey ? 2 : 1;
    case "comparison":  return ds.rows.length<=6 ? 3 : ds.rows.length<=10 ? 2 : 1;
    case "heatmap":     return nums.length>=3 ? 3 : nums.length>=2 ? 2 : 0;
    case "product":     return (ds.nameKey && ds.numKey) ? (ds.avatarKey ? 3 : 2) : (ds.nameKey ? 1 : 0);
  }
}

// ─── Pattern metadata ─────────────────────────────────────────────────────────

const PATTERN_META: Record<PatternId, { name: string; desc: string; bestFor: string; icon: React.ElementType }> = {
  kanban:      { name: "Kanban Board",       desc: "Drag-and-drop style columns grouped by status or category",        bestFor: "Status-based data",   icon: Kanban },
  leaderboard: { name: "Leaderboard",        desc: "Ranked list with medals, scores and progress bars",               bestFor: "Scored / ranked data", icon: Trophy },
  timeline:    { name: "Timeline",           desc: "Chronological event stream with date markers and cards",           bestFor: "Date-ordered events",  icon: Clock },
  metrics:     { name: "Metric Cards",       desc: "Big number cards with progress bars and relative comparisons",    bestFor: "Numeric KPIs",         icon: BarChart2 },
  feed:        { name: "Activity Feed",      desc: "Social-style feed with avatars, descriptions and timestamps",     bestFor: "User / content data",  icon: List },
  comparison:  { name: "Comparison Matrix",  desc: "Side-by-side record columns with field highlighting",             bestFor: "Comparing 2–5 items",  icon: ArrowLeftRight },
  heatmap:     { name: "Heat Map",           desc: "Color-intensity grid across multiple numeric dimensions",         bestFor: "Multi-numeric fields", icon: Grid3X3 },
  product:     { name: "Product Shelf",      desc: "E-commerce grid with image area, price badge and status chip",    bestFor: "Product / catalog data", icon: ShoppingBag },
};

const PATTERN_ORDER: PatternId[] = ["kanban","leaderboard","timeline","metrics","feed","comparison","heatmap","product"];

// ─── Pattern mini-previews ────────────────────────────────────────────────────

function KanbanMini({ ds }: { ds: DatasetInfo }) {
  const gk = ds.statusKey ?? ds.fields.find(f=>f.uniqueCount<=6&&f.type!=="nested")?.key;
  const groups: Record<string,number> = {};
  ds.rows.forEach(r => { const k = gk ? String(r[gk]??"?") : "All"; groups[k]=(groups[k]??0)+1; });
  const cols = Object.entries(groups).slice(0,3);
  return (
    <div className="flex gap-1.5 p-2 h-full items-start">
      {cols.map(([label, count], gi) => (
        <div key={label} className="flex-1 flex flex-col gap-1">
          <div className="px-1.5 py-0.5 rounded-md text-[8px] font-bold text-center truncate" style={{background:PALETTE[gi]+"33",color:PALETTE[gi]}}>{label}</div>
          {Array.from({length:Math.min(count,3)}).map((_,i)=>(<div key={i} className="rounded bg-muted/50 border border-border/30 px-1.5 py-1"><div className="h-1.5 rounded bg-muted-foreground/20 mb-0.5" style={{width:`${60+i*15}%`}} /><div className="h-1 rounded bg-muted-foreground/10" style={{width:"50%"}} /></div>))}
        </div>
      ))}
    </div>
  );
}

function LeaderboardMini({ ds }: { ds: DatasetInfo }) {
  const sorted = ds.numKey ? [...ds.rows].filter(r=>typeof r[ds.numKey!]==="number").sort((a,b)=>(b[ds.numKey!] as number)-(a[ds.numKey!] as number)).slice(0,4) : ds.rows.slice(0,4);
  const max = ds.numKey ? ((sorted[0]?.[ds.numKey] as number) ?? 1) : 1;
  return (
    <div className="p-2 flex flex-col gap-1.5 h-full justify-center">
      {sorted.map((r,i) => {
        const pct = ds.numKey && max>0 ? ((r[ds.numKey] as number)/max)*100 : [90,65,45,25][i];
        return (
          <div key={i} className="flex items-center gap-1.5">
            <span className="text-[9px] shrink-0 w-4">{["🥇","🥈","🥉","4"][i]}</span>
            <div className="flex-1 h-3 rounded-full bg-muted/60 overflow-hidden">
              <div className="h-full rounded-full" style={{width:`${pct}%`,background:PALETTE[i]}} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TimelineMini({ ds }: { ds: DatasetInfo }) {
  const items = ds.rows.slice(0,3);
  return (
    <div className="p-2 relative h-full flex flex-col justify-center gap-2">
      <div className="absolute left-4 top-3 bottom-3 w-px bg-border" />
      {items.map((_,i)=>(
        <div key={i} className="flex items-start gap-2">
          <div className="h-2 w-2 rounded-full shrink-0 mt-0.5 relative z-10" style={{background:PALETTE[i%PALETTE.length]}} />
          <div className="flex-1 bg-card rounded border border-border/40 p-1.5">
            <div className="h-1.5 rounded mb-0.5 bg-muted-foreground/20" style={{width:`${55+i*15}%`}} />
            <div className="h-1 rounded bg-muted-foreground/10" style={{width:"40%"}} />
          </div>
        </div>
      ))}
    </div>
  );
}

function MetricsMini({ ds }: { ds: DatasetInfo }) {
  const numField = ds.fields.find(f=>f.key===ds.numKey);
  const items = ds.rows.slice(0,4);
  const max = numField?.numStats?.max ?? 1;
  return (
    <div className="grid grid-cols-2 gap-1.5 p-2 h-full content-start">
      {items.map((r,i)=>{
        const nameVal = ds.nameKey ? String(r[ds.nameKey]??"").slice(0,8) : `#${i+1}`;
        const val = ds.numKey ? r[ds.numKey] as number : null;
        const pct = val!=null && max>0 ? (val/max)*100 : [80,60,40,20][i];
        return (
          <div key={i} className="rounded-lg border border-border bg-card p-1.5">
            <div className="text-[8px] text-muted-foreground/60 truncate mb-0.5">{nameVal}</div>
            <div className="text-[11px] font-bold font-mono truncate" style={{color:PALETTE[i%PALETTE.length]}}>{val!=null ? val.toLocaleString() : "—"}</div>
            <div className="h-1 rounded-full bg-muted mt-0.5 overflow-hidden"><div className="h-full rounded-full" style={{width:`${pct}%`,background:PALETTE[i%PALETTE.length]}} /></div>
          </div>
        );
      })}
    </div>
  );
}

function FeedMini({ ds }: { ds: DatasetInfo }) {
  return (
    <div className="p-2 flex flex-col gap-1.5 h-full justify-center">
      {ds.rows.slice(0,3).map((r,i)=>{
        const nameVal = ds.nameKey ? String(r[ds.nameKey]??"User").slice(0,12) : `User ${i+1}`;
        return (
          <div key={i} className="flex items-start gap-1.5 pb-1.5 border-b border-border/30 last:border-0">
            <div className="h-5 w-5 rounded-full shrink-0 flex items-center justify-center text-[7px] font-bold text-white" style={{background:strColor(nameVal)}}>{getInitials(nameVal)}</div>
            <div className="flex-1"><div className="h-1.5 rounded bg-muted-foreground/30 mb-0.5" style={{width:"60%"}} /><div className="h-1 rounded bg-muted-foreground/15" style={{width:"90%"}} /></div>
          </div>
        );
      })}
    </div>
  );
}

function ComparisonMini({ ds }: { ds: DatasetInfo }) {
  const cols = ds.rows.slice(0,3);
  const rowKeys = ds.fields.filter(f=>f.type!=="nested").slice(0,3).map(f=>f.key);
  return (
    <div className="p-2 overflow-hidden h-full">
      <table className="w-full text-[8px] border-collapse">
        <thead><tr><th className="border-b border-border pb-0.5 text-left text-muted-foreground/50 pr-1">Field</th>{cols.map((_,i)=><th key={i} className="border-b border-border pb-0.5 px-1 text-center font-bold" style={{color:PALETTE[i]}}>#{i+1}</th>)}</tr></thead>
        <tbody>{rowKeys.map(k=><tr key={k}><td className="py-0.5 text-muted-foreground/60 pr-1 truncate max-w-[30px]">{k.slice(0,6)}</td>{cols.map((_,i)=><td key={i} className="py-0.5 px-1 text-center"><div className="h-1 rounded bg-muted-foreground/20 mx-auto" style={{width:`${40+i*15}%`}} /></td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

function HeatmapMini({ ds }: { ds: DatasetInfo }) {
  const numFs = ds.fields.filter(f=>f.type==="number"||f.type==="integer").slice(0,4);
  const rows = ds.rows.slice(0,4);
  const levels = ["#3b82f6","#10b981","#f59e0b","#ef4444"];
  return (
    <div className="p-2 h-full flex flex-col gap-1 justify-center">
      {rows.map((_,ri)=>(
        <div key={ri} className="flex gap-1">
          {numFs.map((_f,fi)=>(
            <div key={fi} className="flex-1 h-4 rounded-sm" style={{background:levels[(ri+fi)%4]+"aa"}} />
          ))}
          {numFs.length===0 && [0,1,2,3].map(fi=><div key={fi} className="flex-1 h-4 rounded-sm" style={{background:levels[(ri+fi)%4]+"aa"}} />)}
        </div>
      ))}
    </div>
  );
}

function ProductMini({ ds }: { ds: DatasetInfo }) {
  return (
    <div className="grid grid-cols-2 gap-1.5 p-2 h-full content-start">
      {ds.rows.slice(0,4).map((_r,i)=>{
        const nameVal = ds.nameKey ? String(_r[ds.nameKey]??"Product").slice(0,6) : `P${i+1}`;
        const color = strColor(nameVal);
        return (
          <div key={i} className="rounded-lg overflow-hidden border border-border/60 bg-card">
            <div className="h-8 flex items-center justify-center" style={{background:`${color}33`}}>
              <span className="text-[10px] font-black" style={{color}}>{getInitials(nameVal)}</span>
            </div>
            <div className="p-1"><div className="h-1.5 rounded bg-muted-foreground/20 mb-0.5" /><div className="h-1 rounded bg-primary/30" style={{width:"60%"}} /></div>
          </div>
        );
      })}
    </div>
  );
}

const PATTERN_MINI: Record<PatternId, React.FC<{ds: DatasetInfo}>> = {
  kanban: KanbanMini, leaderboard: LeaderboardMini, timeline: TimelineMini, metrics: MetricsMini,
  feed: FeedMini, comparison: ComparisonMini, heatmap: HeatmapMini, product: ProductMini,
};

const PATTERN_FULL: Record<PatternId, React.FC<{ds: DatasetInfo}>> = {
  kanban: KanbanFull, leaderboard: LeaderboardFull, timeline: TimelineFull, metrics: MetricCardsFull,
  feed: FeedFull, comparison: ComparisonFull, heatmap: HeatMapFull, product: ProductShelfFull,
};

// ─── Patterns Tab ─────────────────────────────────────────────────────────────

function PatternsTab({ ds, onApply }: { ds: DatasetInfo; onApply: (id: PatternId) => void }) {
  const [preview, setPreview] = useState<PatternId | null>(null);
  const [applied, setApplied] = useState<PatternId | null>(null);

  const sorted = useMemo(() =>
    [...PATTERN_ORDER].sort((a,b) => getSuitability(b,ds) - getSuitability(a,ds)),
  [ds]);

  if (preview) {
    const Full = PATTERN_FULL[preview];
    const meta = PATTERN_META[preview];
    const Icon = meta.icon;
    const suitability = getSuitability(preview, ds);
    return (
      <div className="flex flex-col h-full">
        {/* Preview header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0 bg-card/60">
          <button onClick={()=>setPreview(null)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to patterns
          </button>
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">{meta.name}</span>
            {suitability===3 && <span className="flex items-center gap-0.5 text-[10px] text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-1.5 py-0.5 rounded-full"><Sparkles className="h-2.5 w-2.5" />Best match</span>}
          </div>
          <button
            onClick={()=>{ setApplied(preview); onApply(preview); }}
            className={cn("flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
              applied===preview ? "bg-emerald-600 text-white" : "bg-primary text-primary-foreground hover:bg-primary/90")}
          >
            {applied===preview ? <><Check className="h-4 w-4" /> Applied!</> : <>Use this pattern</>}
          </button>
        </div>
        {/* Full preview */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <Full ds={ds} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-5">
      {applied && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400">
          <Check className="h-4 w-4 shrink-0" />
          <span className="text-sm font-medium">Pattern applied: <strong>{PATTERN_META[applied].name}</strong></span>
          <button onClick={()=>setApplied(null)} className="ml-auto text-xs opacity-60 hover:opacity-100">Dismiss</button>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {sorted.map(id => {
          const meta = PATTERN_META[id];
          const Icon = meta.icon;
          const suit = getSuitability(id, ds);
          const Mini = PATTERN_MINI[id];
          const isApplied = applied === id;
          return (
            <div
              key={id}
              onClick={()=>setPreview(id)}
              className={cn("rounded-xl border bg-card overflow-hidden cursor-pointer hover:shadow-lg hover:border-primary/50 hover:-translate-y-0.5 transition-all duration-200 group",
                isApplied ? "border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-400/30" : suit===3 ? "border-primary/30" : "border-border")}
            >
              {/* Mini preview */}
              <div className="h-28 bg-gradient-to-br from-muted/30 to-muted/60 overflow-hidden relative border-b border-border/50">
                <Mini ds={ds} />
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors flex items-center justify-center">
                  <span className="text-[10px] font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 px-2 py-1 rounded-md">Preview →</span>
                </div>
                {/* Badge */}
                {isApplied && (
                  <div className="absolute top-1.5 right-1.5 bg-emerald-500 rounded-full p-0.5"><Check className="h-2.5 w-2.5 text-white" /></div>
                )}
                {!isApplied && suit===3 && (
                  <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 bg-amber-500/90 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                    <Sparkles className="h-2 w-2" />Best
                  </div>
                )}
                {!isApplied && suit===2 && (
                  <div className="absolute top-1.5 right-1.5 bg-primary/90 text-primary-foreground text-[8px] font-bold px-1.5 py-0.5 rounded-full">Good</div>
                )}
                {suit===0 && (
                  <div className="absolute top-1.5 right-1.5 bg-muted/90 text-muted-foreground text-[8px] font-medium px-1.5 py-0.5 rounded-full">Optional</div>
                )}
              </div>
              {/* Info */}
              <div className="p-3">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="text-xs font-semibold text-foreground">{meta.name}</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">{meta.desc}</p>
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-[9px] text-muted-foreground/50 bg-muted px-1.5 py-0.5 rounded-full truncate">{meta.bestFor}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Views: DataGrid, Gallery, Dashboard, Profiler, Record ───────────────────

const PAGE_SIZE = 25;

function DataGrid({ ds }: { ds: DatasetInfo }) {
  const [sortKey, setSortKey] = useState<string|null>(null);
  const [sortDir, setSortDir] = useState<"asc"|"desc">("asc");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    if (!search.trim()) return ds.rows;
    const q = search.toLowerCase();
    return ds.rows.filter(row => Object.values(row).some(v => v!==null&&v!==undefined&&String(v).toLowerCase().includes(q)));
  }, [ds.rows, search]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const f = ds.fields.find(x=>x.key===sortKey);
    return [...filtered].sort((a,b)=>{
      const av=a[sortKey],bv=b[sortKey];
      if(av===null||av===undefined) return 1;
      if(bv===null||bv===undefined) return -1;
      let c = (f?.type==="number"||f?.type==="integer") ? (av as number)-(bv as number) : f?.type==="date" ? Date.parse(String(av))-Date.parse(String(bv)) : String(av).localeCompare(String(bv));
      return sortDir==="asc" ? c : -c;
    });
  }, [filtered, sortKey, sortDir, ds.fields]);

  const totalPages = Math.ceil(sorted.length/PAGE_SIZE);
  const pageRows = sorted.slice(page*PAGE_SIZE, (page+1)*PAGE_SIZE);

  const handleSort = (key: string) => {
    if (sortKey===key) setSortDir(d=>d==="asc"?"desc":"asc"); else { setSortKey(key); setSortDir("asc"); }
    setPage(0);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border shrink-0">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}} placeholder="Search all fields…" className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-border bg-muted/30 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50" />
        </div>
        <span className="text-xs text-muted-foreground/60 shrink-0">{filtered.length!==ds.rows.length ? `${filtered.length.toLocaleString()} / ${ds.rows.length.toLocaleString()} rows` : `${ds.rows.length.toLocaleString()} rows`} · {ds.fields.length} cols</span>
      </div>
      <div className="flex-1 overflow-auto min-h-0">
        <table className="w-full text-xs border-collapse">
          <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm">
            <tr>
              <th className="px-3 py-2.5 text-left text-muted-foreground/40 font-mono border-b border-border w-10 text-[10px]">#</th>
              {ds.fields.map(f=>(
                <th key={f.key} onClick={()=>handleSort(f.key)} className="px-3 py-2.5 text-left font-semibold text-muted-foreground whitespace-nowrap cursor-pointer hover:text-foreground hover:bg-muted/30 border-b border-border select-none transition-colors group">
                  <div className="flex items-center gap-1.5"><TypeIcon type={f.type} />{f.key}{sortKey===f.key ? (sortDir==="asc"?<ChevronUp className="h-3 w-3 text-primary"/>:<ChevronDown className="h-3 w-3 text-primary"/>):<ChevronUp className="h-3 w-3 opacity-0 group-hover:opacity-30"/>}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row,ri)=>(
              <tr key={ri} className={cn("border-b border-border/30 hover:bg-primary/5 transition-colors",ri%2!==0&&"bg-muted/10")}>
                <td className="px-3 py-2 font-mono text-[10px] text-muted-foreground/30 select-none">{page*PAGE_SIZE+ri+1}</td>
                {ds.fields.map(f=><td key={f.key} className="px-3 py-2 max-w-[200px]"><Cell value={row[f.key]} type={f.type} search={search||undefined} /></td>)}
              </tr>
            ))}
          </tbody>
        </table>
        {!pageRows.length && <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">No results for "{search}"</div>}
      </div>
      {totalPages>1 && (
        <div className="flex items-center justify-between px-3 py-2 border-t border-border shrink-0 bg-card/50">
          <span className="text-xs text-muted-foreground">Page {page+1} of {totalPages}</span>
          <div className="flex items-center gap-1">
            <button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0} className="p-1 rounded hover:bg-muted disabled:opacity-30"><ChevronLeft className="h-4 w-4"/></button>
            {Array.from({length:Math.min(totalPages,7)},(_,i)=>{const pg=totalPages<=7?i:Math.max(0,Math.min(totalPages-7,page-3))+i;return(<button key={pg} onClick={()=>setPage(pg)} className={cn("w-7 h-7 rounded text-xs font-medium",pg===page?"bg-primary text-primary-foreground":"hover:bg-muted text-muted-foreground")}>{pg+1}</button>);}).slice(0,7)}
            <button onClick={()=>setPage(p=>Math.min(totalPages-1,p+1))} disabled={page===totalPages-1} className="p-1 rounded hover:bg-muted disabled:opacity-30"><ChevronRight className="h-4 w-4"/></button>
          </div>
        </div>
      )}
    </div>
  );
}

function Gallery({ ds }: { ds: DatasetInfo }) {
  const metricFields = ds.fields.filter(f=>(f.type==="number"||f.type==="integer")&&f.key!==ds.numKey).slice(0,3);
  const extraFields = ds.fields.filter(f=>f.key!==ds.nameKey&&f.key!==ds.avatarKey&&f.key!==ds.statusKey&&f.key!==ds.descKey&&!metricFields.find(m=>m.key===f.key)&&f.type!=="nested").slice(0,4);
  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ds.rows.slice(0,30).map((row,i)=>{
          const nameVal = ds.nameKey ? String(row[ds.nameKey]??`Item ${i+1}`) : `Item ${i+1}`;
          const avatarSrc = ds.avatarKey ? String(row[ds.avatarKey]??"") : undefined;
          return (
            <div key={i} className="rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all overflow-hidden">
              <div className="px-4 pt-4 pb-3 flex items-start gap-3 border-b border-border/50">
                <Avatar name={nameVal} src={avatarSrc?.startsWith("http")?avatarSrc:undefined} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{nameVal}</p>
                  {!!ds.descKey && !!row[ds.descKey] && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{String(row[ds.descKey])}</p>}
                  {ds.statusKey && row[ds.statusKey]!==undefined && <div className="mt-1.5"><StatusBadge value={String(row[ds.statusKey])} /></div>}
                </div>
                <span className="text-[10px] font-mono text-muted-foreground/30 mt-0.5 shrink-0">#{i+1}</span>
              </div>
              {(metricFields.length>0||ds.numKey) && (
                <div className="flex divide-x divide-border/50 border-b border-border/50">
                  {ds.numKey && <div className="flex-1 px-3 py-2 text-center min-w-0"><p className="text-lg font-bold text-primary font-mono tabular-nums truncate">{typeof row[ds.numKey]==="number"?(row[ds.numKey] as number).toLocaleString():"—"}</p><p className="text-[10px] text-muted-foreground uppercase tracking-wider truncate">{ds.numKey}</p></div>}
                  {metricFields.slice(0,ds.numKey?2:3).map(f=><div key={f.key} className="flex-1 px-3 py-2 text-center min-w-0"><p className="text-sm font-bold font-mono tabular-nums text-foreground truncate">{typeof row[f.key]==="number"?(row[f.key] as number).toLocaleString():"—"}</p><p className="text-[10px] text-muted-foreground uppercase tracking-wider truncate">{f.key}</p></div>)}
                </div>
              )}
              {extraFields.length>0 && <div className="px-4 py-3 flex flex-col gap-1.5">{extraFields.map(f=>{ const v=row[f.key]; return v===null||v===undefined?null:(<div key={f.key} className="flex items-center gap-2 text-xs min-w-0"><TypeIcon type={f.type} className="shrink-0 opacity-50"/><span className="text-muted-foreground shrink-0 w-20 truncate capitalize">{f.key}</span><span className="flex-1 truncate font-mono text-[11px]"><Cell value={v} type={f.type} /></span></div>); })}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub }: { label: string; value: string|number; sub?: string }) {
  return <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-1"><span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">{label}</span><span className="text-2xl font-bold font-mono">{typeof value==="number"?value.toLocaleString():value}</span>{sub&&<span className="text-xs text-muted-foreground/60">{sub}</span>}</div>;
}

function Dashboard({ ds }: { ds: DatasetInfo }) {
  const numField = ds.fields.find(f=>f.key===ds.numKey);
  const catField = ds.fields.find(f=>f.key===ds.statusKey) ?? ds.fields.find(f=>f.type==="status"||(f.type==="text"&&f.uniqueCount<=8));
  const barData = useMemo(()=>!ds.numKey||!ds.labelKey?null:ds.rows.filter(r=>typeof r[ds.numKey!]==="number").sort((a,b)=>(b[ds.numKey!] as number)-(a[ds.numKey!] as number)).slice(0,15).map(r=>({label:String(r[ds.labelKey!]??"?"),value:r[ds.numKey!] as number})),[ds]);
  const pieData = useMemo(()=>{
    if(!catField) return null;
    const c:Record<string,number>={};
    ds.rows.forEach(r=>{const v=r[catField.key];if(v!==null&&v!==undefined){const k=String(v);c[k]=(c[k]??0)+1;}});
    return Object.entries(c).map(([label,value])=>({label,value}));
  },[ds,catField]);
  const fillRate = ds.fields.length>0?Math.round(ds.fields.reduce((s,f)=>s+(100-f.nullPct),0)/ds.fields.length):0;
  return (
    <div className="h-full overflow-y-auto p-4 flex flex-col gap-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label="Records" value={ds.rows.length} sub={`${ds.fields.length} fields`} />
        {numField?.numStats ? (<><KpiCard label={`Avg ${ds.numKey}`} value={numField.numStats.avg.toFixed(2)} /><KpiCard label={`Max ${ds.numKey}`} value={numField.numStats.max} sub={`min: ${numField.numStats.min}`} /><KpiCard label={`Sum ${ds.numKey}`} value={numField.numStats.sum} /></>) : (<><KpiCard label="Fields" value={ds.fields.length} /><KpiCard label="Fill rate" value={`${fillRate}%`} sub="avg non-null" /><KpiCard label="Unique" value={ds.fields.find(f=>f.type==="id")?.uniqueCount??ds.rows.length} /></>)}
      </div>
      <div className={cn("grid gap-5",barData&&pieData?"grid-cols-1 lg:grid-cols-3":"grid-cols-1")}>
        {barData&&barData.length>0&&(
          <div className={cn("rounded-xl border border-border bg-card/60 p-4",pieData?"lg:col-span-2":"")}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{ds.numKey} by {ds.labelKey}</p>
            <div className="flex flex-col gap-1.5">
              {barData.map((d,i)=>{ const pct=(d.value/barData[0].value)*100; return (<div key={i} className="flex items-center gap-2 text-xs"><span className="text-muted-foreground truncate shrink-0 text-right" style={{width:100}} title={d.label}>{d.label}</span><div className="flex-1 bg-muted/60 rounded-full h-6 relative overflow-hidden"><div className="absolute inset-y-0 left-0 rounded-full flex items-center justify-end pr-2" style={{width:`${Math.max(pct,1)}%`,background:PALETTE[i%PALETTE.length]+"dd"}}>{pct>20&&<span className="text-white text-[10px] font-bold truncate">{d.value.toLocaleString()}</span>}</div></div><span className="font-mono text-muted-foreground shrink-0 w-16 text-right tabular-nums">{d.value.toLocaleString()}</span></div>); })}
            </div>
          </div>
        )}
        {pieData&&pieData.length>0&&(()=>{
          const pos=pieData.filter(d=>d.value>0);const total=pos.reduce((s,d)=>s+d.value,0);
          const sorted=[...pos].sort((a,b)=>b.value-a.value);const top=sorted.slice(0,8);const rest=sorted.slice(8);
          const cd=rest.length>0?[...top,{label:"Other",value:rest.reduce((s,d)=>s+d.value,0)}]:top;
          const cx=80,cy=80,R=65,r=32;let angle=-Math.PI/2;
          const slices=cd.map((e,i)=>{const p=e.value/total;const s=angle;angle+=p*2*Math.PI;const end=angle;const lg=p>0.5?1:0;const[c1,s1,c2,s2]=[Math.cos(s),Math.sin(s),Math.cos(end),Math.sin(end)];const d=[`M${cx+R*c1} ${cy+R*s1}`,`A${R} ${R} 0 ${lg} 1 ${cx+R*c2} ${cy+R*s2}`,`L${cx+r*c2} ${cy+r*s2}`,`A${r} ${r} 0 ${lg} 0 ${cx+r*c1} ${cy+r*s1}`,"Z"].join(" ");return{d,color:PALETTE[i%PALETTE.length],pct:p,...e};});
          return (
            <div className="rounded-xl border border-border bg-card/60 p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{catField?.key} distribution</p>
              <div className="flex items-center gap-4">
                <svg viewBox="0 0 160 160" className="w-32 h-32 shrink-0">{slices.map((s,i)=><path key={i} d={s.d} fill={s.color} className="hover:opacity-80 transition-opacity"/>)}<text x={cx} y={cy-6} textAnchor="middle" fontSize="14" fontWeight="800" fill="#8b5cf6">{total.toLocaleString()}</text><text x={cx} y={cy+10} textAnchor="middle" fontSize="9" fill="gray" opacity="0.5">total</text></svg>
                <div className="flex flex-col gap-1 flex-1 min-w-0">{slices.map((s,i)=><div key={i} className="flex items-center gap-1.5 text-[11px]"><div className="h-2 w-2 rounded-sm shrink-0" style={{background:s.color}}/><span className="truncate flex-1 text-muted-foreground" title={s.label}>{s.label}</span><span className="font-mono font-semibold shrink-0">{(s.pct*100).toFixed(0)}%</span></div>)}</div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

function Profiler({ ds }: { ds: DatasetInfo }) {
  return (
    <div className="h-full overflow-y-auto">
      <table className="w-full text-xs border-collapse">
        <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm">
          <tr className="border-b border-border">{["Field","Type","Fill","Unique","Sample / Stats"].map(h=><th key={h} className="px-4 py-2.5 text-left font-semibold text-muted-foreground whitespace-nowrap">{h}</th>)}</tr>
        </thead>
        <tbody>
          {ds.fields.map((f,i)=>{ const fill=100-f.nullPct; return (
            <tr key={f.key} className={cn("border-b border-border/30 hover:bg-muted/20",i%2!==0&&"bg-muted/10")}>
              <td className="px-4 py-3"><div className="flex items-center gap-2"><TypeIcon type={f.type}/><span className="font-semibold">{f.key}</span></div></td>
              <td className="px-4 py-3"><span className={cn("px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider",f.type==="status"?"bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400":f.type==="number"||f.type==="integer"?"bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-400":f.type==="boolean"?"bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400":f.type==="date"?"bg-violet-50 border-violet-200 text-violet-700 dark:bg-violet-950/30 dark:border-violet-800 dark:text-violet-400":"bg-muted border-border text-muted-foreground")}>{f.type}</span></td>
              <td className="px-4 py-3"><div className="flex items-center gap-2" style={{minWidth:100}}><div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden"><div className={cn("h-full rounded-full",fill===100?"bg-emerald-500":fill>=80?"bg-primary":fill>=50?"bg-amber-500":"bg-red-500")} style={{width:`${fill}%`}}/></div><span className="font-mono text-[11px] text-muted-foreground shrink-0 w-10 text-right">{fill.toFixed(0)}%</span></div></td>
              <td className="px-4 py-3"><div className="flex items-center gap-1"><span className="font-mono font-bold">{f.uniqueCount}</span>{f.uniqueCount===ds.rows.length&&<span className="text-[9px] text-emerald-500 font-bold uppercase">uniq</span>}{f.uniqueCount===1&&<span className="text-[9px] text-amber-500 font-bold uppercase">const</span>}</div></td>
              <td className="px-4 py-3">{f.numStats?(<div className="flex items-center gap-4 flex-wrap">{[["min",f.numStats.min],["avg",+f.numStats.avg.toFixed(2)],["max",f.numStats.max]].map(([l,v])=><div key={String(l)} className="flex flex-col"><span className="text-[9px] text-muted-foreground uppercase">{l}</span><span className="font-mono font-bold text-xs">{Number(v).toLocaleString()}</span></div>)}</div>):(<div className="flex flex-wrap gap-1">{f.topValues.slice(0,4).map(tv=><span key={tv.label} className={cn("px-1.5 py-0.5 rounded text-[10px] border",f.type==="status"?STATUS_STYLE_MAP[statusVariant(tv.label)]:"bg-muted border-border text-muted-foreground")}>{tv.label.length>18?tv.label.slice(0,18)+"…":tv.label}</span>)}</div>)}</td>
            </tr>
          );})}
        </tbody>
      </table>
    </div>
  );
}

function RecordExplorer({ ds }: { ds: DatasetInfo }) {
  const [idx, setIdx] = useState(0);
  const row = ds.rows[idx];
  const nameVal = ds.nameKey ? String(row[ds.nameKey]??`Record ${idx+1}`) : `Record ${idx+1}`;
  const avatarSrc = ds.avatarKey ? String(row[ds.avatarKey]??"") : undefined;
  const mainFields = ds.fields.filter(f=>f.key!==ds.nameKey&&f.key!==ds.avatarKey&&f.key!==ds.statusKey&&f.key!==ds.descKey);
  return (
    <div className="h-full overflow-y-auto p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Record <span className="font-mono font-bold text-foreground">{idx+1}</span> of <span className="font-mono font-bold text-foreground">{ds.rows.length}</span></span>
        <div className="flex items-center gap-1">
          <button onClick={()=>setIdx(0)} disabled={idx===0} className="px-2 py-1 rounded text-xs hover:bg-muted disabled:opacity-30 font-mono">«</button>
          <button onClick={()=>setIdx(i=>Math.max(0,i-1))} disabled={idx===0} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronLeft className="h-4 w-4"/></button>
          <button onClick={()=>setIdx(i=>Math.min(ds.rows.length-1,i+1))} disabled={idx===ds.rows.length-1} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronRight className="h-4 w-4"/></button>
          <button onClick={()=>setIdx(ds.rows.length-1)} disabled={idx===ds.rows.length-1} className="px-2 py-1 rounded text-xs hover:bg-muted disabled:opacity-30 font-mono">»</button>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-start gap-4 p-5 border-b border-border">
          <Avatar name={nameVal} src={avatarSrc?.startsWith("http")?avatarSrc:undefined} size="lg" />
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold truncate">{nameVal}</h2>
            {!!ds.descKey && !!row[ds.descKey] && <p className="text-sm text-muted-foreground mt-1 leading-relaxed line-clamp-3">{String(row[ds.descKey])}</p>}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {ds.statusKey && row[ds.statusKey]!==undefined && <StatusBadge value={String(row[ds.statusKey])} />}
              {ds.dateKey && !!row[ds.dateKey] && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="h-3 w-3"/>{(()=>{try{return new Date(String(row[ds.dateKey])).toLocaleDateString(undefined,{year:"numeric",month:"long",day:"numeric"});}catch{return String(row[ds.dateKey]);}})()}</span>}
            </div>
          </div>
        </div>
        <div className="divide-y divide-border/50">
          {mainFields.map(f=>{ const v=row[f.key]; return (
            <div key={f.key} className="flex items-start gap-4 px-5 py-3 hover:bg-muted/20 transition-colors">
              <div className="flex items-center gap-1.5 w-36 shrink-0 mt-0.5"><TypeIcon type={f.type}/><span className="text-xs font-medium text-muted-foreground capitalize">{f.key.replace(/_/g," ")}</span></div>
              <div className="flex-1 min-w-0 text-sm">{v===null||v===undefined?<span className="text-muted-foreground/30 italic text-xs">empty</span>:f.type==="longtext"?<p className="text-sm leading-relaxed">{String(v)}</p>:f.type==="nested"?<pre className="text-[11px] font-mono bg-muted/50 rounded-md p-2 overflow-auto max-h-24 text-muted-foreground">{JSON.stringify(v,null,2)}</pre>:<Cell value={v} type={f.type}/>}</div>
            </div>
          );})}
        </div>
      </div>
    </div>
  );
}

// ─── Rich Document View ───────────────────────────────────────────────────────

function RichInlineValue({ value }: { value: unknown }) {
  if (value === null || value === undefined)
    return <span className="text-muted-foreground/30 italic text-xs">empty</span>;
  if (typeof value === "boolean")
    return value
      ? <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold", S_GREEN)}>TRUE</span>
      : <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold", S_RED)}>FALSE</span>;
  if (typeof value === "number")
    return <span className="font-mono text-blue-500 dark:text-blue-400 tabular-nums">{value.toLocaleString()}</span>;
  const str = String(value);
  if (/^#([0-9a-fA-F]{3}){1,2}$/.test(str))
    return <div className="flex items-center gap-1.5"><div className="h-3.5 w-3.5 rounded border border-border/50 shrink-0" style={{ background: str }} /><span className="font-mono text-[11px]">{str}</span></div>;
  if (/^https?:\/\//i.test(str))
    return <a href={str} target="_blank" rel="noreferrer" className="text-sky-500 dark:text-sky-400 text-[11px] font-mono underline underline-offset-2 break-all">{str.replace(/^https?:\/\/(www\.)?/, "").slice(0, 70)}</a>;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str))
    return <span className="text-violet-600 dark:text-violet-400 font-mono text-[11px]">{str}</span>;
  if (["active","inactive","pending","published","draft","enabled","disabled","open","closed","approved","rejected","success","failed","error","warning","complete","done"].includes(str.toLowerCase()))
    return <StatusBadge value={str} />;
  return <span className="text-foreground text-sm">{str}</span>;
}

function RichParagraphBlock({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">{label.replace(/_/g, " ")}</p>
      <p className="text-sm text-foreground/80 leading-relaxed">{text}</p>
    </div>
  );
}

function RichPillList({ label, items }: { label: string; items: unknown[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">{label.replace(/_/g, " ")}</p>
        <span className="text-[9px] font-mono text-muted-foreground/30">{items.length} items</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.slice(0, 24).map((item, i) => (
          <span key={i} className="px-2 py-0.5 rounded-full bg-muted border border-border text-xs font-mono text-muted-foreground">
            {item === null || item === undefined ? "null" : String(item)}
          </span>
        ))}
        {items.length > 24 && <span className="text-xs text-muted-foreground/40 self-center">+{items.length - 24} more</span>}
      </div>
    </div>
  );
}

function RichArrayTable({ label, rows }: { label: string; rows: Record<string, unknown>[] }) {
  const keys = Array.from(new Set(rows.flatMap(r => Object.keys(r)))).slice(0, 8);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">{label.replace(/_/g, " ")}</p>
        <span className="text-[9px] font-mono text-muted-foreground/30">{rows.length} {rows.length === 1 ? "row" : "rows"}</span>
      </div>
      <div className="rounded-lg border border-border overflow-auto">
        <table className="min-w-full text-xs border-collapse">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              {keys.map(k => (
                <th key={k} className="px-3 py-1.5 text-left text-[10px] font-semibold text-muted-foreground whitespace-nowrap capitalize">{k.replace(/_/g, " ")}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 12).map((row, ri) => (
              <tr key={ri} className={cn("border-b border-border/30 last:border-0", ri % 2 !== 0 && "bg-muted/20")}>
                {keys.map(k => (
                  <td key={k} className="px-3 py-2 max-w-[160px]">
                    <RichInlineValue value={row[k]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length > 12 && (
          <p className="px-3 py-1.5 text-[10px] text-muted-foreground/40 bg-muted/20 text-center border-t border-border/30">
            +{rows.length - 12} more rows
          </p>
        )}
      </div>
    </div>
  );
}

function RichNestedSection({ label, obj, depth }: { label: string; obj: Record<string, unknown>; depth: number }) {
  const [open, setOpen] = useState(depth < 1);
  const keys = Object.keys(obj);
  return (
    <div className="flex flex-col">
      <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2 py-1 text-left group w-full">
        <ChevronRight className={cn("h-3.5 w-3.5 text-muted-foreground/50 transition-transform duration-150 shrink-0", open && "rotate-90")} />
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 group-hover:text-muted-foreground transition-colors">{label.replace(/_/g, " ")}</p>
        <span className="text-[9px] font-mono text-muted-foreground/30">{keys.length} {keys.length === 1 ? "key" : "keys"}</span>
      </button>
      {open && (
        <div className="pl-4 border-l-2 border-border/50 ml-1.5 flex flex-col gap-3 py-2">
          {Object.entries(obj).map(([k, v]) => (
            <RichContentBlock key={k} label={k} value={v} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function RichContentBlock({ label, value, depth }: { label: string; value: unknown; depth: number }) {
  if (value === null || value === undefined) return null;

  if (Array.isArray(value)) {
    const objs = value.filter(x => x !== null && typeof x === "object" && !Array.isArray(x)) as Record<string, unknown>[];
    if (objs.length > 0 && objs.length === value.length)
      return <RichArrayTable label={label} rows={objs} />;
    return <RichPillList label={label} items={value} />;
  }

  if (typeof value === "object" && value !== null)
    return <RichNestedSection label={label} obj={value as Record<string, unknown>} depth={depth} />;

  if (typeof value === "string" && value.length > 80)
    return <RichParagraphBlock label={label} text={value} />;

  return (
    <div className="flex items-start gap-3 text-xs">
      <span className="text-muted-foreground/60 capitalize shrink-0 w-28 truncate pt-0.5 font-medium">{label.replace(/_/g, " ")}</span>
      <div className="flex-1 min-w-0"><RichInlineValue value={value} /></div>
    </div>
  );
}

function RichRecordAccordion({ record, title, index, defaultOpen }: {
  record: Record<string, unknown>; title: string; index: number; defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const fieldCount = Object.keys(record).length;
  const color = strColor(title);
  return (
    <div className={cn("rounded-xl border bg-card overflow-hidden transition-shadow duration-200", open ? "border-primary/30 shadow-sm" : "border-border hover:border-muted-foreground/20")}>
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/20 transition-colors group">
        <div className="h-6 w-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white shrink-0 select-none" style={{ background: color }}>
          {String(index + 1).padStart(2, "0")}
        </div>
        <span className="font-semibold text-sm text-foreground flex-1 truncate">{title}</span>
        <span className="text-[10px] font-mono text-muted-foreground/30 shrink-0">{fieldCount} fields</span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground/50 transition-transform duration-150 shrink-0 group-hover:text-muted-foreground", open && "rotate-180")} />
      </button>
      {open && (
        <div className="px-5 pb-5 pt-3 border-t border-border/50 flex flex-col gap-4">
          {Object.entries(record).map(([k, v]) => (
            <RichContentBlock key={k} label={k} value={v} depth={0} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── JSON tree viewer ─────────────────────────────────────────────────────────

function JsonNodeTree({ value, depth = 0, label }: { value: unknown; depth?: number; label?: string }) {
  const [open, setOpen] = useState(depth < 2);
  const BRANCH_COLORS = ["border-primary/25","border-violet-500/25","border-emerald-500/25","border-amber-500/25","border-sky-500/25"];

  if (value === null || typeof value !== "object") {
    const str = value === null ? "null" : String(value);
    const isTrunc = typeof value === "string" && str.length > 100;
    return (
      <div className="flex items-baseline gap-2 py-[1px] min-w-0">
        {label !== undefined && <span className="text-violet-500 dark:text-violet-400 font-mono text-[11px] shrink-0">"{label}":</span>}
        <span className={cn("font-mono text-[11px] break-all",
          value === null        ? "text-muted-foreground/40 italic" :
          typeof value === "boolean" ? (value ? "text-emerald-500" : "text-red-400") :
          typeof value === "number"  ? "text-blue-500 dark:text-blue-400" :
          "text-amber-600 dark:text-amber-400")}>
          {typeof value === "string"
            ? `"${isTrunc ? str.slice(0,100)+"…" : str}"`
            : str}
        </span>
      </div>
    );
  }

  const isArr = Array.isArray(value);
  const entries: [string, unknown][] = isArr
    ? (value as unknown[]).map((v,i) => [String(i), v])
    : Object.entries(value as Record<string,unknown>);
  const preview = isArr ? `[ ${entries.length} ]` : `{ ${entries.length} }`;

  return (
    <div className="min-w-0">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 py-[1px] w-full text-left group hover:opacity-80 transition-opacity">
        <ChevronRight className={cn("h-3 w-3 text-muted-foreground/40 transition-transform duration-150 shrink-0", open && "rotate-90")} />
        {label !== undefined && <span className="text-violet-500 dark:text-violet-400 font-mono text-[11px] shrink-0">"{label}":</span>}
        <span className="font-mono text-[11px] text-muted-foreground">
          {open ? (isArr ? "[" : "{") : preview}
        </span>
        {!open && <span className="text-[9px] text-muted-foreground/25 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">expand</span>}
      </button>
      {open && (
        <div className={cn("ml-3 border-l-2 pl-3 flex flex-col gap-0 my-0.5", BRANCH_COLORS[depth % BRANCH_COLORS.length])}>
          {entries.slice(0,200).map(([k,v]) => (
            <JsonNodeTree key={k} value={v} depth={depth+1} label={isArr ? undefined : k} />
          ))}
          {entries.length > 200 && <span className="text-[10px] text-muted-foreground/30 py-0.5 font-mono">… {entries.length-200} more</span>}
          <span className="font-mono text-[11px] text-muted-foreground/40">{isArr ? "]" : "}"}</span>
        </div>
      )}
    </div>
  );
}

// ─── Table auto-detection ──────────────────────────────────────────────────────

function findTables(obj: unknown, path = "", result: DetectedTable[] = []): DetectedTable[] {
  if (obj === null || typeof obj !== "object") return result;

  if (Array.isArray(obj)) {
    const items = obj.filter(x => x !== null && typeof x === "object" && !Array.isArray(x)) as Record<string,unknown>[];
    if (items.length >= 2 && items.length === obj.length) {
      const allKeys = Array.from(new Set(items.flatMap(r => Object.keys(r)))).slice(0,20);
      if (allKeys.length > 0 && allKeys.length <= 15)
        result.push({ path: path || "root", columns: allKeys.map(k => ({ id: k, label: k })), rows: items });
    }
    obj.forEach((item,i) => findTables(item, `${path}[${i}]`, result));
    return result;
  }

  const rec = obj as Record<string,unknown>;

  if (Array.isArray(rec.columns) && Array.isArray(rec.rows) && (rec.rows as unknown[]).length > 0) {
    const cols = (rec.columns as unknown[]).map((c,i) => {
      if (typeof c === "string") return { id: c, label: c };
      if (typeof c === "object" && c !== null) {
        const co = c as Record<string,unknown>;
        return { id: String(co.id ?? co.key ?? i), label: String(co.label ?? co.name ?? co.id ?? i), type: String(co.type ?? "") };
      }
      return { id: String(i), label: String(i) };
    });
    const tableRows = (rec.rows as unknown[]).filter(r => typeof r === "object" && r !== null) as Record<string,unknown>[];
    if (tableRows.length > 0)
      result.push({ path: path || "root", title: rec.title ? String(rec.title) : undefined, subtitle: rec.subtitle ? String(rec.subtitle) : undefined, columns: cols, rows: tableRows });
  }

  Object.entries(rec).forEach(([k,v]) => {
    if (typeof v === "object" && v !== null) findTables(v, path ? `${path}.${k}` : k, result);
  });
  return result;
}

function DetectedTableBlock({ table }: { table: DetectedTable }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          {table.title && <h3 className="font-semibold text-sm text-foreground">{table.title}</h3>}
          {table.subtitle && <p className="text-xs text-muted-foreground/70 mt-0.5">{table.subtitle}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0 text-[10px] font-mono text-muted-foreground/40">
          <span className="bg-muted px-1.5 py-0.5 rounded">{table.path}</span>
          <span>{table.rows.length} rows</span>
        </div>
      </div>
      <div className="rounded-xl border border-border overflow-auto">
        <table className="min-w-full text-xs border-collapse">
          <thead>
            <tr className="bg-muted/60 border-b border-border">
              {table.columns.map(col => (
                <th key={col.id} className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    {col.type && (
                      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0",
                        col.type==="badge"  ? "bg-violet-400" :
                        col.type==="date"   ? "bg-amber-400"  :
                        col.type==="url"    ? "bg-sky-400"    : "bg-muted-foreground/30")} />
                    )}
                    {col.label.replace(/\\n/g, " ")}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, ri) => (
              <tr key={ri} className={cn("border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors", ri%2!==0 && "bg-muted/10")}>
                {table.columns.map(col => {
                  const val = row[col.id];
                  const str = val === null || val === undefined ? "" : String(val);
                  return (
                    <td key={col.id} className="px-3 py-2.5 align-top">
                      {val === null || val === undefined
                        ? <span className="text-muted-foreground/30 italic">—</span>
                        : col.type==="badge"
                          ? <StatusBadge value={str} />
                          : col.type==="date"
                            ? <span className="text-violet-500 dark:text-violet-400 font-mono text-[11px]">{str}</span>
                            : col.type==="url"
                              ? <a href={str} target="_blank" rel="noreferrer" className="text-sky-500 text-[11px] underline underline-offset-2 break-all block max-w-xs">{str.replace(/^https?:\/\/(www\.)?/,"").slice(0,50)}</a>
                              : <span className="text-foreground/80 text-[11px] leading-relaxed">{str.length>80 ? str.slice(0,80)+"…" : str}</span>
                      }
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Shared doc helper ────────────────────────────────────────────────────────

function findDocNameKey(records: Record<string,unknown>[]): string | undefined {
  const first = records[0];
  if (!first) return undefined;
  for (const c of ["name","title","label","pattern_title","heading","username","display_name","displayname","full_name","fullname"]) {
    if (c in first) return c;
  }
  return Object.keys(first).find(k => typeof first[k]==="string" && String(first[k]).length < 80) ?? Object.keys(first)[0];
}

// ─── Tab Structure View ───────────────────────────────────────────────────────

function TabStructureView({ parsed }: { parsed: unknown }) {
  const [active, setActive] = useState(0);

  // Normalise: array of objects OR single object treated as one-tab
  const isArr = Array.isArray(parsed);
  const records: Record<string,unknown>[] = isArr
    ? (parsed as unknown[]).filter(x => x!==null && typeof x==="object" && !Array.isArray(x)) as Record<string,unknown>[]
    : (typeof parsed==="object" && parsed!==null ? [parsed as Record<string,unknown>] : []);

  if (!records.length) return <NotApplicable label="Tab Structure" />;

  const nameKey = findDocNameKey(records);
  const safeActive = Math.min(active, records.length - 1);
  const current = records[safeActive];

  // For a single object, treat each top-level key as a tab
  if (!isArr && records.length === 1) {
    const obj = records[0];
    const keys = Object.keys(obj);
    const safeKey = Math.min(active, keys.length - 1);
    return (
      <div className="flex flex-col h-full">
        <div className="flex overflow-x-auto border-b border-border shrink-0 bg-muted/10">
          {keys.map((k, i) => (
            <button key={k} onClick={() => setActive(i)}
              className={cn("flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-all -mb-px shrink-0",
                safeKey===i ? "border-primary text-primary bg-background" : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/20")}>
              <TypeIcon type={detectType(k, [obj[k]])} />
              {k.replace(/_/g," ")}
            </button>
          ))}
        </div>
        <div className="flex-1 min-h-0 relative">
          <div className="absolute inset-0 overflow-y-auto p-5">
            <RichContentBlock label={keys[safeKey]} value={obj[keys[safeKey]]} depth={0} />
          </div>
        </div>
      </div>
    );
  }

  // Array case: each item is a tab
  return (
    <div className="flex flex-col h-full">
      {/* Item tabs */}
      <div className="flex overflow-x-auto border-b border-border shrink-0 bg-muted/10">
        {records.map((rec, i) => {
          const rawLabel = nameKey ? String(rec[nameKey] ?? `Item ${i+1}`) : `Item ${i+1}`;
          const label = rawLabel.length > 40 ? rawLabel.slice(0,40)+"…" : rawLabel;
          const hasRank = rec.rank !== undefined;
          return (
            <button key={i} onClick={() => setActive(i)}
              className={cn("flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-all -mb-px shrink-0 max-w-[220px]",
                safeActive===i ? "border-primary text-primary bg-background" : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/20")}>
              {hasRank && (
                <span className={cn("h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0",
                  safeActive===i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground/60")}>
                  {String(rec.rank)}
                </span>
              )}
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Active item content */}
      <div className="flex-1 min-h-0 relative">
        <div className="absolute inset-0 overflow-y-auto">
          {/* Item header strip */}
          <div className="px-6 py-4 border-b border-border/50 bg-muted/5">
            <div className="flex items-start gap-3">
              {current.rank !== undefined && (
                <span className="h-8 w-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center text-sm font-black shrink-0">
                  {String(current.rank)}
                </span>
              )}
              <div className="flex-1 min-w-0">
                {nameKey && current[nameKey] && (
                  <h3 className="font-semibold text-base text-foreground leading-snug">
                    {String(current[nameKey])}
                  </h3>
                )}
                {current.pattern_description && (
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {String(current.pattern_description)}
                  </p>
                )}
              </div>
            </div>
          </div>
          {/* Fields */}
          <div className="p-5 flex flex-col gap-5">
            {Object.entries(current)
              .filter(([k]) => k !== nameKey && k !== "pattern_description" && k !== "rank")
              .map(([k, v]) => (
                <RichContentBlock key={k} label={k} value={v} depth={0} />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Rich Document View (tabbed) ──────────────────────────────────────────────

function RichDocument({ parsed }: { parsed: unknown }) {
  const [docTab, setDocTab] = useState<DocTab>("outline");

  const tables = useMemo(() => findTables(parsed), [parsed]);

  const renderOutline = () => {
    if (Array.isArray(parsed)) {
      const records = parsed.filter(x => x!==null && typeof x==="object" && !Array.isArray(x)) as Record<string,unknown>[];
      if (!records.length) return <NotApplicable label="Document" />;
      const nameKey = findDocNameKey(records);
      return (
        <div className="flex flex-col gap-2.5">
          <p className="text-[11px] text-muted-foreground/40 pb-1">
            {records.length} records — expand each to see nested tables, paragraphs &amp; sub-sections
          </p>
          {records.slice(0,50).map((rec,i) => (
            <RichRecordAccordion key={i} record={rec}
              title={nameKey ? String(rec[nameKey] ?? `Item ${i+1}`) : `Item ${i+1}`}
              index={i} defaultOpen={i===0} />
          ))}
          {records.length > 50 && <p className="text-xs text-muted-foreground/40 text-center py-2">Showing first 50 of {records.length} records</p>}
        </div>
      );
    }
    if (typeof parsed==="object" && parsed!==null) {
      const obj = parsed as Record<string,unknown>;
      return (
        <div className="max-w-3xl mx-auto rounded-xl border border-border bg-card p-6 flex flex-col gap-5">
          {Object.entries(obj).map(([k,v]) => <RichContentBlock key={k} label={k} value={v} depth={0} />)}
        </div>
      );
    }
    return <NotApplicable label="Document" />;
  };

  const DOC_TABS: { id: DocTab; label: string; icon: typeof Eye; badge?: number }[] = [
    { id: "outline", label: "Outline", icon: FileText },
    { id: "tabs",    label: "Tabs",    icon: Layers },
    { id: "tree",    label: "Tree",    icon: Braces },
    { id: "tables",  label: "Tables",  icon: Table2, badge: tables.length },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Sub-tab bar */}
      <div className="flex items-center gap-1 px-4 py-2.5 border-b border-border bg-muted/20 shrink-0">
        {DOC_TABS.map(({ id, label, icon: Icon, badge }) => (
          <button key={id} onClick={() => setDocTab(id)}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              docTab===id
                ? "bg-background text-foreground shadow-sm border border-border/60"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
            <Icon className="h-3.5 w-3.5 shrink-0" />
            {label}
            {badge !== undefined && badge > 0 && (
              <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center tabular-nums",
                docTab===id ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground/60")}>
                {badge}
              </span>
            )}
          </button>
        ))}
        <span className="ml-auto text-[10px] text-muted-foreground/30 font-mono hidden sm:block">
          {Array.isArray(parsed) ? `${(parsed as unknown[]).length} items` : typeof parsed==="object" && parsed!==null ? `${Object.keys(parsed).length} keys` : ""}
        </span>
      </div>

      {/* Content — absolute inset-0 gives a definite height the scroll container resolves against */}
      <div className="flex-1 min-h-0 relative">
        {docTab==="outline" && (
          <div className="absolute inset-0 overflow-y-auto p-4">
            {renderOutline()}
          </div>
        )}
        {docTab==="tabs" && (
          <TabStructureView parsed={parsed} />
        )}
        {docTab==="tree" && (
          <div className="absolute inset-0 overflow-auto p-4">
            <div className="min-w-max font-mono">
              <JsonNodeTree value={parsed} depth={0} />
            </div>
          </div>
        )}
        {docTab==="tables" && (
          <div className="absolute inset-0 overflow-y-auto p-4 flex flex-col gap-8">
            {tables.length===0
              ? <NotApplicable label="Tables" />
              : tables.map((t,i) => <DetectedTableBlock key={i} table={t} />)
            }
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main dialog ──────────────────────────────────────────────────────────────

const VIEW_TABS: { id: ViewTab; label: string; icon: typeof Eye }[] = [
  { id: "patterns",   label: "Patterns",   icon: Sparkles },
  { id: "grid",       label: "DataGrid",   icon: Table2 },
  { id: "gallery",    label: "Gallery",    icon: LayoutGrid },
  { id: "dashboard",  label: "Dashboard",  icon: BarChart2 },
  { id: "profiler",   label: "Profiler",   icon: Database },
  { id: "record",     label: "Record",     icon: Eye },
  { id: "document",   label: "Document",   icon: FileText },
];

export function JsonVisualizeDialog({ open, onOpenChange, json }: Props) {
  const [view, setView] = useState<ViewTab>("patterns");
  const [appliedPattern, setAppliedPattern] = useState<PatternId | null>(null);

  const parsed = useMemo(() => { try { return JSON.parse(json); } catch { return null; } }, [json]);
  const ds = useMemo(() => parsed !== null ? analyzeDataset(parsed) : null, [parsed]);

  const handleApply = (id: PatternId) => {
    setAppliedPattern(id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] h-[90vh] max-h-[93vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-4 pb-3 border-b border-border shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Eye className="h-4 w-4 text-primary" />
            Visualize JSON
            {ds && <span className="ml-1 text-xs font-mono text-muted-foreground/50 font-normal">{ds.rows.length} records · {ds.fields.length} fields</span>}
            {appliedPattern && (
              <span className="ml-auto flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-full">
                <Check className="h-3 w-3" />{PATTERN_META[appliedPattern].name}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {ds === null ? (
          <div className="flex flex-col items-center justify-center h-52 gap-3 text-center p-6">
            <AlertCircle className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No visualizable data</p>
            <p className="text-xs text-muted-foreground/50 max-w-xs leading-relaxed">Paste a JSON array of objects or a flat JSON object in the editor to visualize it.</p>
          </div>
        ) : (
          <>
            {/* Tab bar */}
            <div className="flex gap-0 bg-muted/30 border-b border-border px-3 pt-2 pb-0 shrink-0 overflow-x-auto">
              {VIEW_TABS.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setView(id)}
                  className={cn("flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 whitespace-nowrap transition-all -mb-px shrink-0",
                    view === id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40",
                  )}>
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden sm:inline">{label}</span>
                  {id === "patterns" && appliedPattern && <Check className="h-2.5 w-2.5 text-emerald-500" />}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0 overflow-hidden">
              {view === "patterns"  && <PatternsTab ds={ds} onApply={handleApply} />}
              {view === "grid"      && <DataGrid ds={ds} />}
              {view === "gallery"   && <Gallery ds={ds} />}
              {view === "dashboard" && <Dashboard ds={ds} />}
              {view === "profiler"  && <Profiler ds={ds} />}
              {view === "record"    && <RecordExplorer ds={ds} />}
              {view === "document"  && <RichDocument parsed={parsed} />}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
