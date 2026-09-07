import { useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Lightbulb, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calcularPorcoes } from "@/lib/porcoes";
import { formatarExibicao, UNIDADES_EXIBICAO } from "@/lib/medidas";
import { useUnidadeExibicao } from "@/hooks/use-unidade-exibicao";
import { useWakeLock } from "@/hooks/use-wake-lock";
import { normalizarPassos, metodoLabel } from "@/lib/ficha-tecnica";
import type { DrinkComIngredientes } from "@/lib/queries";

const PORCOES_RAPIDAS = [1, 2, 4, 6, 8];
const MAX_PORCOES = 50;

/** Tela cheia otimizada para preparar o drink: doses grandes e passos marcáveis. */
export function ModoPreparo({
  drink,
  onFechar,
}: {
  drink: DrinkComIngredientes;
  onFechar: () => void;
}) {
  const [porcoes, setPorcoes] = useState(1);
  const [unidade, setUnidade] = useUnidadeExibicao();
  const [feitos, setFeitos] = useState<number[]>([]);
  const [atual, setAtual] = useState(1);
  const telaAcesa = useWakeLock(true);

  const passos = normalizarPassos(drink.passos, drink.preparo);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFechar();
    };
    document.addEventListener("keydown", onKey);
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = anterior;
    };
  }, [onFechar]);

  const { itens } = calcularPorcoes(
    drink.drink_ingredientes.map((di) => ({
      nome: di.ingredientes?.nome ?? "Ingrediente",
      unidade: di.unidade,
      quantidade: di.quantidade,
    })),
    porcoes,
  );

  const alternarPasso = (ordem: number) => {
    setFeitos((f) => (f.includes(ordem) ? f.filter((o) => o !== ordem) : [...f, ordem]));
    setAtual(Math.min(passos.length, ordem + 1));
  };

  const ficha = [
    drink.copo && `Copo: ${drink.copo}`,
    metodoLabel(drink.metodo_preparo) && `Método: ${metodoLabel(drink.metodo_preparo)}`,
    drink.guarnicao?.trim() && `Guarnição: ${drink.guarnicao.trim()}`,
  ].filter(Boolean) as string[];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Modo preparo — ${drink.nome}`}
      className="alto-contraste fixed inset-0 z-50 overflow-y-auto bg-background text-foreground print:hidden"
    >
      <div className="mx-auto max-w-3xl px-4 py-6 space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-primary">Modo preparo</p>
            <h2 className="font-serif text-3xl sm:text-5xl">{drink.nome}</h2>
          </div>
          <Button
            variant="outline"
            className="min-h-11 min-w-11"
            onClick={onFechar}
            aria-label="Sair do modo preparo (Esc)"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>

        {ficha.length > 0 && (
          <p className="text-base sm:text-lg text-muted-foreground">{ficha.join(" · ")}</p>
        )}

        <div className="flex flex-wrap items-end gap-6">
          <div className="space-y-2">
            <span className="block text-sm uppercase tracking-[0.14em] text-muted-foreground">
              Porções
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {PORCOES_RAPIDAS.map((n) => (
                <Button
                  key={n}
                  variant={porcoes === n ? "default" : "outline"}
                  className="min-h-11 min-w-11 text-lg"
                  aria-pressed={porcoes === n}
                  onClick={() => setPorcoes(n)}
                >
                  {n}
                </Button>
              ))}
              <div className="flex items-center gap-2">
                <Label htmlFor="porcoes-preparo" className="text-sm text-muted-foreground">
                  Outro
                </Label>
                <Input
                  id="porcoes-preparo"
                  type="number"
                  min={1}
                  max={MAX_PORCOES}
                  value={porcoes}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (Number.isFinite(v)) setPorcoes(Math.min(MAX_PORCOES, Math.max(1, Math.floor(v))));
                  }}
                  className="h-11 w-20 text-lg"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <span className="block text-sm uppercase tracking-[0.14em] text-muted-foreground">
              Unidade
            </span>
            <div className="flex items-center gap-2">
              {UNIDADES_EXIBICAO.map((u) => (
                <Button
                  key={u.valor}
                  variant={unidade === u.valor ? "default" : "outline"}
                  className="min-h-11"
                  aria-pressed={unidade === u.valor}
                  onClick={() => setUnidade(u.valor)}
                >
                  {u.rotulo}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <section aria-label="Ingredientes" className="space-y-3">
          <h3 className="text-sm uppercase tracking-[0.2em] text-primary">Ingredientes</h3>
          <ul className="divide-y divide-border rounded-xl border border-border">
            {itens.map((i) => (
              <li key={`${i.nome}-${i.unidade}`} className="flex items-baseline gap-4 px-4 py-3">
                <span className="w-32 shrink-0 text-right text-xl font-semibold tabular-nums text-primary sm:text-2xl">
                  {formatarExibicao(i.quantidadeTotal, i.unidade, unidade)}
                </span>
                <span className="text-lg sm:text-xl">{i.nome}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-label="Passo a passo" className="space-y-3">
          <h3 className="text-sm uppercase tracking-[0.2em] text-primary">Passo a passo</h3>
          {passos.length === 0 ? (
            <p className="text-lg text-muted-foreground">Sem instruções de preparo.</p>
          ) : (
            <>
              <ol className="space-y-3">
                {passos.map((p) => {
                  const feito = feitos.includes(p.ordem);
                  return (
                    <li key={p.ordem}>
                      <button
                        type="button"
                        onClick={() => alternarPasso(p.ordem)}
                        aria-pressed={feito}
                        className={`flex w-full items-start gap-4 rounded-xl border p-4 text-left transition-colors ${
                          p.ordem === atual ? "border-primary bg-primary/10" : "border-border"
                        } ${feito ? "opacity-60" : ""}`}
                      >
                        <span
                          aria-hidden="true"
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-primary text-lg font-bold text-primary"
                        >
                          {feito ? <Check className="h-5 w-5" /> : p.ordem}
                        </span>
                        <span
                          className={`text-lg leading-relaxed sm:text-2xl ${feito ? "line-through" : ""}`}
                        >
                          {p.texto}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>

              <div className="flex items-center justify-between gap-3 pt-2">
                <Button
                  variant="outline"
                  className="min-h-12 text-base"
                  onClick={() => setAtual((a) => Math.max(1, a - 1))}
                  disabled={atual <= 1}
                >
                  <ChevronLeft className="mr-2 h-5 w-5" aria-hidden="true" /> Passo anterior
                </Button>
                <span className="text-base text-muted-foreground tabular-nums">
                  Passo {atual} de {passos.length}
                </span>
                <Button
                  className="min-h-12 text-base"
                  onClick={() => setAtual((a) => Math.min(passos.length, a + 1))}
                  disabled={atual >= passos.length}
                >
                  Próximo passo <ChevronRight className="ml-2 h-5 w-5" aria-hidden="true" />
                </Button>
              </div>
            </>
          )}
        </section>

        <p className="flex items-center gap-2 pb-8 text-sm text-muted-foreground">
          <Lightbulb className="h-4 w-4" aria-hidden="true" />
          {telaAcesa
            ? "Tela acesa ativada. Pressione Esc para sair."
            : "Pressione Esc para sair do modo preparo."}
        </p>
      </div>
    </div>
  );
}
