import { ReactNode } from "react";
import { LucideIcon, TrendingUp, TrendingDown, Minus, LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, icon: Icon, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8", className)}>
      <div className="flex items-start gap-4">
        {Icon && (
          <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/25">
            <Icon className="h-6 w-6" />
          </div>
        )}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold page-header-title">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1 text-sm sm:text-base max-w-2xl">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  trend?: "neutral" | "success" | "warning" | "danger";
  className?: string;
}

const trendStyles = {
  neutral: "text-primary bg-primary/10",
  success: "text-emerald-600 bg-emerald-500/10",
  warning: "text-amber-600 bg-amber-500/10",
  danger: "text-red-600 bg-red-500/10",
};

const valueStyles = {
  neutral: "",
  success: "text-emerald-600",
  warning: "text-amber-600",
  danger: "text-red-600",
};

const trendIcons = {
  neutral: Minus,
  success: TrendingDown,
  warning: TrendingUp,
  danger: TrendingUp,
};

export function StatCard({ label, value, hint, icon: Icon, trend = "neutral", className }: StatCardProps) {
  const TrendIcon = trendIcons[trend];
  return (
    <div className={cn("surface-card-elevated-hover group relative overflow-hidden p-6", className)}>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.04] to-transparent pointer-events-none" />
      <div className="relative flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <div className="flex items-center gap-2">
            <p className={cn("text-3xl font-bold tracking-tight", valueStyles[trend])}>{value}</p>
            {trend !== "neutral" && (
              <TrendIcon className={cn("h-4 w-4", trend === "success" ? "text-emerald-500" : "text-amber-500")} />
            )}
          </div>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110 group-hover:rotate-3", trendStyles[trend])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
  className,
  resultCount,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  resultCount?: number;
}) {
  return (
    <div className={cn("surface-card flex items-center gap-3 px-4 py-1", className)}>
      <svg className="h-5 w-5 shrink-0 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground/60"
      />
      {typeof resultCount === "number" && (
        <span className="hidden sm:inline-flex shrink-0 badge-pill bg-muted text-muted-foreground font-medium">
          {resultCount} {resultCount === 1 ? "result" : "results"}
        </span>
      )}
    </div>
  );
}

export type ListView = "grid" | "table";

export function ViewToggle({ view, onChange, className }: { view: ListView; onChange: (v: ListView) => void; className?: string }) {
  return (
    <div className={cn("inline-flex items-center gap-1 rounded-xl border border-border bg-card p-1 shadow-sm", className)}>
      <button
        type="button"
        onClick={() => onChange("grid")}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
          view === "grid" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
        )}
        title="Grid view"
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange("table")}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
          view === "table" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
        )}
        title="Table view"
      >
        <List className="h-4 w-4" />
      </button>
    </div>
  );
}
