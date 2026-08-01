import { LayoutGrid, List } from "lucide-react";
import type { ViewMode } from "@/hooks/use-view-mode";

interface Props {
  value: ViewMode;
  onChange: (v: ViewMode) => void;
  className?: string;
}

export function ViewModeToggle({ value, onChange, className }: Props) {
  const btn = (active: boolean) =>
    `inline-flex items-center justify-center h-11 w-11 sm:h-9 sm:w-9 border transition-colors ${
      active
        ? "bg-primary text-primary-foreground border-primary"
        : "bg-secondary/40 text-muted-foreground border-border hover:border-primary/60"
    }`;
  return (
    <div className={`inline-flex rounded-md overflow-hidden ${className ?? ""}`} role="group">
      <button
        type="button"
        aria-label="Visualização em grade"
        aria-pressed={value === "grid"}
        onClick={() => onChange("grid")}
        className={`${btn(value === "grid")} rounded-l-md`}
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label="Visualização em lista"
        aria-pressed={value === "list"}
        onClick={() => onChange("list")}
        className={`${btn(value === "list")} rounded-r-md border-l-0`}
      >
        <List className="h-4 w-4" />
      </button>
    </div>
  );
}
