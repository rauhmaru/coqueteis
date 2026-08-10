import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, ShoppingBasket, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { brl } from "@/lib/meu-bar";
import type { ImpactoIngrediente } from "@/lib/impacto";

function plural(n: number, s: string, p: string) {
  return n === 1 ? s : p;
}

function Chips({ drinks }: { drinks: { id: string; nome: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {drinks.map((d) => (
        <li key={d.id}>
          <Link
            to="/drinks/$id"
            params={{ id: d.id }}
            className="inline-flex min-h-8 items-center rounded-full border border-border bg-secondary px-3 text-xs text-secondary-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {d.nome}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * Ranking de compras por impacto: cada ingrediente faltante vira um "ticket",
 * ordenado por quantas receitas ele desbloqueia.
 */
export function ImpactoCompras({ itens }: { itens: ImpactoIngrediente[] }) {
  if (itens.length === 0) return null;

  const multiplos = itens.filter((i) => i.drinks.length > 1);
  const unicos = itens.filter((i) => i.drinks.length === 1);
  const lider = multiplos[0] ?? itens[0]!;

  return (
    <section aria-labelledby="impacto-titulo" className="space-y-5">
      <div className="space-y-1">
        <h2
          id="impacto-titulo"
          className="inline-flex items-center gap-2 font-serif text-2xl text-foreground"
        >
          <TrendingUp className="h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
          Compre isto e desbloqueie mais receitas
        </h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Ordenamos por impacto: os ingredientes que faltam para o maior número de receitas
          aparecem primeiro.
        </p>
      </div>

      {multiplos.length > 0 && (
        <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {multiplos.map((i) => {
            const destaque = i.chave === lider.chave;
            return (
              <li
                key={i.chave}
                className={`rounded-xl border bg-card/40 p-4 ${
                  destaque
                    ? "border-primary/60 border-l-4 border-l-primary shadow-lg"
                    : "border-border"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="inline-flex items-center gap-2 font-serif text-xl text-foreground">
                      <ShoppingBasket className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                      <span className="truncate">{i.nome}</span>
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Compre isto e desbloqueie{" "}
                      <span className="text-foreground">
                        {i.drinks.length} {plural(i.drinks.length, "receita", "receitas")}
                      </span>
                    </p>
                  </div>
                  {destaque && (
                    <Badge className="shrink-0 bg-primary/15 text-primary">
                      <Sparkles className="mr-1 h-3 w-3" aria-hidden="true" /> Maior impacto
                    </Badge>
                  )}
                </div>

                <div className="mt-3">
                  <Chips drinks={i.drinks} />
                </div>

                {i.precoEstimado !== null && i.valorDesbloqueado > 0 && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Estimativa: <span className="text-foreground">{brl(i.precoEstimado)}</span> na
                    garrafa desbloqueiam{" "}
                    <span className="text-foreground">{brl(i.valorDesbloqueado)}</span> em doses de
                    novas receitas.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {unicos.length > 0 && <ImpactoUnico itens={unicos} />}

      <div className="rounded-xl border border-primary/40 bg-primary/5 p-4 text-center">
        <p className="font-serif text-xl text-foreground">
          Compre {lider.nome} e desbloqueie {lider.drinks.length}{" "}
          {plural(lider.drinks.length, "receita", "receitas")} hoje.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Depois de comprar, cadastre no seu bar acima para as receitas entrarem em “Dá para fazer
          agora”.
        </p>
      </div>
    </section>
  );
}

const PAGINA = 8;

/** Lista paginada dos ingredientes que liberam apenas 1 receita. */
function ImpactoUnico({ itens }: { itens: ImpactoIngrediente[] }) {
  const [visiveis, setVisiveis] = useState(PAGINA);
  const mostrados = itens.slice(0, visiveis);
  const restantes = itens.length - mostrados.length;

  return (
    <div className="rounded-xl border border-border bg-card/20 p-4">
      <h3 className="font-serif text-lg text-foreground">
        Impacto único{" "}
        <span className="text-sm text-muted-foreground">
          ({itens.length} {plural(itens.length, "ingrediente", "ingredientes")} liberam 1 receita
          cada)
        </span>
      </h3>
      <ul className="mt-3 space-y-2">
        {mostrados.map((i) => (
          <li
            key={i.chave}
            className="flex flex-wrap items-center gap-2 border-b border-border/50 pb-2 text-sm last:border-0 last:pb-0"
          >
            <span className="text-foreground">{i.nome}</span>
            <span className="text-xs text-muted-foreground">libera</span>
            <Chips drinks={i.drinks} />
          </li>
        ))}
      </ul>

      {itens.length > PAGINA && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <p aria-live="polite" className="text-xs text-muted-foreground">
            Mostrando {mostrados.length} de {itens.length}
          </p>
          {restantes > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setVisiveis((v) => v + PAGINA)}
            >
              Mostrar mais {Math.min(PAGINA, restantes)}
              <ChevronDown className="ml-1 h-4 w-4" aria-hidden="true" />
            </Button>
          )}
          {visiveis > PAGINA && (
            <Button type="button" variant="ghost" size="sm" onClick={() => setVisiveis(PAGINA)}>
              Mostrar menos
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
