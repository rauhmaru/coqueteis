import { cn } from "@/lib/utils";

export type Dificuldade = "Fácil" | "Médio" | "Difícil";

export const DIFICULDADES: Dificuldade[] = ["Fácil", "Médio", "Difícil"];

const styles: Record<string, string> = {
  "Fácil": "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  "Médio": "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  "Difícil": "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
};

export function DifficultyBadge({
  value,
  className,
}: {
  value?: string | null;
  className?: string;
}) {
  if (!value) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
        styles[value] ?? "bg-secondary text-muted-foreground border-border",
        className,
      )}
      title={`Dificuldade de preparo: ${value}`}
    >
      {value}
    </span>
  );
}
