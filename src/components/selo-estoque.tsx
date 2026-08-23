import { Check, CircleAlert } from "lucide-react";
import type { Cobertura } from "@/lib/estoque-cobertura";

/** Selo discreto de cobertura da receita pelo estoque do usuário. */
export function SeloEstoque({ cobertura }: { cobertura: Cobertura | null }) {
  if (!cobertura) return null;

  if (cobertura.completo) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
        <Check className="h-3 w-3" aria-hidden="true" /> Dá para fazer
      </span>
    );
  }

  if (cobertura.falta1) {
    return (
      <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-border bg-secondary/50 px-2 py-0.5 text-[11px] text-muted-foreground">
        <CircleAlert className="h-3 w-3 shrink-0" aria-hidden="true" />
        <span className="truncate">Falta 1: {cobertura.falta1}</span>
      </span>
    );
  }

  return null;
}
