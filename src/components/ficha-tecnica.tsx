import { GlassWater, Martini, Sprout, Gauge } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { metodoLabel } from "@/lib/ficha-tecnica";

type Item = { icone: typeof GlassWater; rotulo: string; valor: string };

export function FichaTecnica({
  dificuldade,
  copo,
  metodoPreparo,
  guarnicao,
}: {
  dificuldade?: string | null;
  copo?: string | null;
  metodoPreparo?: string | null;
  guarnicao?: string | null;
}) {
  const itens: Item[] = [];
  if (dificuldade) itens.push({ icone: Gauge, rotulo: "Dificuldade", valor: dificuldade });
  if (copo) itens.push({ icone: GlassWater, rotulo: "Copo recomendado", valor: copo });
  const metodo = metodoLabel(metodoPreparo);
  if (metodo) itens.push({ icone: Martini, rotulo: "Método de preparo", valor: metodo });
  itens.push({ icone: Sprout, rotulo: "Guarnição", valor: guarnicao?.trim() || "Sem guarnição" });

  if (itens.length === 0) return null;

  return (
    <dl className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-card/60 p-4 sm:grid-cols-2">
      {itens.map(({ icone: Icone, rotulo, valor }) => (
        <div key={rotulo} className="flex items-start gap-2.5">
          <Icone className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <div className="min-w-0">
            <dt className="text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
              {rotulo}
            </dt>
            <dd className="text-sm text-foreground break-words">{valor}</dd>
          </div>
        </div>
      ))}
    </dl>
  );
}

export function FichaChips({
  copo,
  metodoPreparo,
}: {
  copo?: string | null;
  metodoPreparo?: string | null;
}) {
  const metodo = metodoLabel(metodoPreparo);
  return (
    <>
      {copo && <Badge variant="secondary">{copo}</Badge>}
      {metodo && <Badge variant="secondary">{metodo}</Badge>}
    </>
  );
}
