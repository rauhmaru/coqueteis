import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Calculator, Info, Plus, RotateCcw, Trash2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { DrinkImage } from "@/components/drink-image";
import { IngredienteAutocomplete } from "@/components/ingrediente-autocomplete";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { drinkQuery } from "@/lib/queries";
import {
  MAX_ABV,
  MAX_ML,
  calcularAbv,
  classificarAbv,
  sugerirIngrediente,
  validarNumero,

  type Componente,
} from "@/lib/abv";

const titulo = "Calculadora de teor alcoólico (ABV) — Destilados & Coquetéis";
const descricao =
  "Estime o teor alcoólico do seu drink: informe os ingredientes, o volume em ml e o teor de cada um para saber o ABV final, o álcool puro e as doses padrão.";

export const Route = createFileRoute("/calculadora-abv")({
  validateSearch: (search: Record<string, unknown>) => ({
    drink: typeof search.drink === "string" ? search.drink.slice(0, 64) : undefined,
  }),
  head: () => ({
    meta: [
      { title: titulo },
      { name: "description", content: descricao },
      { property: "og:title", content: titulo },
      { property: "og:description", content: descricao },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CalculadoraAbvPage,
});

let seq = 0;
const novoId = () => `c${++seq}`;

function linhaVazia(): Componente {
  return { id: novoId(), nome: "", ml: 0, abv: 0 };
}

const padrao = (): Componente[] => [
  { id: novoId(), nome: "Destilado (vodka, gin, cachaça...)", ml: 50, abv: 40 },
  { id: novoId(), nome: "Suco / xarope", ml: 30, abv: 0 },
  { id: novoId(), nome: "Água tônica / refrigerante", ml: 100, abv: 0 },
];

function CalculadoraAbvPage() {
  const { drink: drinkId } = Route.useSearch();
  const { data: drink } = useQuery({ ...drinkQuery(drinkId ?? ""), enabled: !!drinkId });

  const daReceita = useMemo<Componente[] | null>(() => {
    if (!drink) return null;
    const linhas = drink.drink_ingredientes
      .map((di) => di.ingredientes?.nome)
      .filter((n): n is string => !!n)
      .map((nome) => {
        const s = sugerirIngrediente(nome);
        return { id: novoId(), nome, ml: s.ml, abv: s.abv };
      });
    return linhas.length ? linhas : null;
  }, [drink]);

  const [manual, setManual] = useState<Componente[] | null>(null);
  const [comGelo, setComGelo] = useState(true);
  const [diluicao, setDiluicao] = useState(20);
  const [rascunhos, setRascunhos] = useState<Record<string, string>>({});
  const [erros, setErros] = useState<Record<string, string>>({});

  const componentes = manual ?? daReceita ?? padrao();
  const resultado = calcularAbv(componentes, comGelo ? diluicao / 100 : 0);
  const faixa = classificarAbv(resultado.abv);

  const atualizar = (id: string, patch: Partial<Componente>) =>
    setManual(componentes.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const limparCampo = (chave: string) => {
    setRascunhos((r) => {
      const { [chave]: _, ...resto } = r;
      return resto;
    });
    setErros((e) => {
      const { [chave]: _, ...resto } = e;
      return resto;
    });
  };

  /** Valida o campo numérico e só aplica ao cálculo quando o valor é válido. */
  const campoNumerico = (
    chave: string,
    bruto: string,
    opcoes: { min: number; max: number; rotulo: string; unidade?: string },
    aplicar: (valor: number) => void,
  ) => {
    setRascunhos((r) => ({ ...r, [chave]: bruto }));
    const { valor, erro } = validarNumero(bruto, opcoes);
    setErros((e) => {
      if (!erro) {
        const { [chave]: _, ...resto } = e;
        return resto;
      }
      return { ...e, [chave]: erro };
    });
    if (valor !== null) aplicar(valor);
  };

  const remover = (id: string) => {
    limparCampo(`${id}-ml`);
    limparCampo(`${id}-abv`);
    setManual(componentes.filter((c) => c.id !== id));
  };
  const adicionar = () => setManual([...componentes, linhaVazia()]);
  const reiniciar = () => {
    setRascunhos({});
    setErros({});
    setDiluicao(20);
    setManual(daReceita ? daReceita.map((c) => ({ ...c })) : padrao());
  };

  const nomeChange = (id: string, nome: string) => {
    const s = sugerirIngrediente(nome);
    const atual = componentes.find((c) => c.id === id);
    const vazio = !atual || (atual.abv === 0 && atual.ml === 0);
    atualizar(id, vazio ? { nome, abv: s.abv, ml: s.ml } : { nome });
    if (vazio) {
      limparCampo(`${id}-ml`);
      limparCampo(`${id}-abv`);
    }
  };

  /** Ao escolher uma sugestão do catálogo, sempre preenche teor e volume sugeridos (editáveis). */
  const nomeSelecionado = (id: string, nome: string) => {
    const s = sugerirIngrediente(nome);
    atualizar(id, { nome, abv: s.abv, ml: s.ml });
    limparCampo(`${id}-ml`);
    limparCampo(`${id}-abv`);
  };

  const listaErros = Object.values(erros);


  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10 space-y-8">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-primary">Consumo consciente</p>
          <h1 className="font-serif text-4xl md:text-5xl text-foreground flex items-center gap-3">
            <Calculator className="h-8 w-8 text-primary shrink-0" />
            Calculadora de teor alcoólico
          </h1>
          <p className="text-sm text-muted-foreground">
            Informe o volume (ml) e o teor (% ABV) de cada componente do drink. O resultado é uma{" "}
            <strong>estimativa</strong> para orientar a moderação — marcas e medidas reais variam.
          </p>
        </header>

        {drink && (
          <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
            <DrinkImage
              path={drink.imagem_url}
              alt={drink.nome}
              className="h-16 w-16 rounded-lg object-cover border border-border bg-secondary/40 shrink-0"
            />
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.2em] text-primary">Receita carregada</p>
              <p className="font-serif text-xl text-foreground truncate">{drink.nome}</p>
              <Link
                to="/drinks/$id"
                params={{ id: drink.id }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Ver receita completa
              </Link>
            </div>
          </div>
        )}

        <section className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-serif text-xl text-foreground">Componentes</h2>
            <Button variant="ghost" size="sm" onClick={reiniciar}>
              <RotateCcw className="h-4 w-4 mr-1.5" /> Reiniciar
            </Button>
          </div>

          <div className="hidden sm:grid grid-cols-[1fr_100px_100px_40px] gap-3 text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
            <span>Ingrediente</span>
            <span>Volume (ml)</span>
            <span>Teor (%)</span>
            <span />
          </div>

          <div className="space-y-3">
            {componentes.map((c) => (
              <div key={c.id} className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_100px_100px_40px] gap-3 items-end">
                <div className="col-span-2 sm:col-span-1">
                  <Label className="sm:hidden text-xs text-muted-foreground">Ingrediente</Label>
                  <IngredienteAutocomplete
                    value={c.nome}
                    placeholder="Ex.: Cachaça, suco de limão..."
                    onChange={(nome) => nomeChange(c.id, nome)}
                    onSelect={(nome) => nomeSelecionado(c.id, nome)}
                  />

                </div>

                <div>
                  <Label className="sm:hidden text-xs text-muted-foreground" htmlFor={`${c.id}-ml`}>
                    ml
                  </Label>
                  <Input
                    id={`${c.id}-ml`}
                    type="text"
                    inputMode="decimal"
                    aria-invalid={!!erros[`${c.id}-ml`]}
                    aria-describedby={erros[`${c.id}-ml`] ? `${c.id}-ml-erro` : undefined}
                    className={erros[`${c.id}-ml`] ? "border-destructive focus-visible:ring-destructive" : ""}
                    value={rascunhos[`${c.id}-ml`] ?? String(c.ml)}
                    onChange={(e) =>
                      campoNumerico(
                        `${c.id}-ml`,
                        e.target.value,
                        { min: 0, max: MAX_ML, rotulo: "Volume", unidade: " ml" },
                        (valor) => atualizar(c.id, { ml: valor }),
                      )
                    }
                    onBlur={() => !erros[`${c.id}-ml`] && limparCampo(`${c.id}-ml`)}
                  />
                  {erros[`${c.id}-ml`] && (
                    <p id={`${c.id}-ml-erro`} className="mt-1 text-xs text-destructive">
                      {erros[`${c.id}-ml`]}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="sm:hidden text-xs text-muted-foreground" htmlFor={`${c.id}-abv`}>
                    % ABV
                  </Label>
                  <Input
                    id={`${c.id}-abv`}
                    type="text"
                    inputMode="decimal"
                    aria-invalid={!!erros[`${c.id}-abv`]}
                    aria-describedby={erros[`${c.id}-abv`] ? `${c.id}-abv-erro` : undefined}
                    className={erros[`${c.id}-abv`] ? "border-destructive focus-visible:ring-destructive" : ""}
                    value={rascunhos[`${c.id}-abv`] ?? String(c.abv)}
                    onChange={(e) =>
                      campoNumerico(
                        `${c.id}-abv`,
                        e.target.value,
                        { min: 0, max: MAX_ABV, rotulo: "Teor", unidade: "%" },
                        (valor) => atualizar(c.id, { abv: valor }),
                      )
                    }
                    onBlur={() => !erros[`${c.id}-abv`] && limparCampo(`${c.id}-abv`)}
                  />
                  {erros[`${c.id}-abv`] && (
                    <p id={`${c.id}-abv-erro`} className="mt-1 text-xs text-destructive">
                      {erros[`${c.id}-abv`]}
                    </p>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remover ${c.nome || "componente"}`}
                  onClick={() => remover(c.id)}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>

          <Button variant="outline" size="sm" onClick={adicionar}>
            <Plus className="h-4 w-4 mr-1.5" /> Adicionar componente
          </Button>

          <div className="border-t border-border pt-4 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="gelo" className="text-sm text-foreground">
                  Considerar diluição do gelo
                </Label>
                <p className="text-xs text-muted-foreground">
                  Bater ou mexer com gelo adiciona água e reduz o teor final.
                </p>
              </div>
              <Switch id="gelo" checked={comGelo} onCheckedChange={setComGelo} />
            </div>
            {comGelo && (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <Label htmlFor="diluicao" className="text-xs text-muted-foreground">
                    Água derretida (%)
                  </Label>
                  <Input
                    id="diluicao"
                    type="text"
                    inputMode="decimal"
                    aria-invalid={!!erros.diluicao}
                    aria-describedby={erros.diluicao ? "diluicao-erro" : undefined}
                    className={`h-8 w-20 text-right ${erros.diluicao ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    value={rascunhos.diluicao ?? String(diluicao)}
                    onChange={(e) =>
                      campoNumerico(
                        "diluicao",
                        e.target.value,
                        { min: 0, max: 60, rotulo: "Diluição", unidade: "%" },
                        (valor) => setDiluicao(valor),
                      )
                    }
                    onBlur={() => !erros.diluicao && limparCampo("diluicao")}
                  />
                </div>
                {erros.diluicao && (
                  <p id="diluicao-erro" className="text-xs text-destructive">
                    {erros.diluicao}
                  </p>
                )}
                <Slider
                  value={[diluicao]}
                  min={0}
                  max={60}
                  step={5}
                  onValueChange={(v) => {
                    limparCampo("diluicao");
                    setDiluicao(v[0] ?? 0);
                  }}
                  aria-label="Percentual de diluição pelo gelo"
                />
              </div>
            )}
            {listaErros.length > 0 && (
              <p role="alert" className="text-xs text-destructive">
                Corrija os campos destacados — o resultado abaixo usa os últimos valores válidos.
              </p>
            )}
          </div>

        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className={`rounded-xl border p-6 ${faixa.classe}`}>
            <p className="text-[11px] uppercase tracking-[0.2em] opacity-80">Teor alcoólico estimado</p>
            <p className="font-serif text-5xl mt-1">
              {resultado.abv.toFixed(1)}
              <span className="text-2xl">%</span>
            </p>
            <p className="mt-2 text-sm font-semibold">{faixa.rotulo}</p>
            <p className="text-xs opacity-90">{faixa.descricao}</p>
          </div>

          <dl className="rounded-xl border border-border bg-card p-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Volume final</dt>
              <dd className="font-serif text-2xl text-foreground">{resultado.volumeTotal} ml</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Álcool puro</dt>
              <dd className="font-serif text-2xl text-foreground">{resultado.alcoolPuro} ml</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Doses padrão</dt>
              <dd className="font-serif text-2xl text-foreground">{resultado.doses.toFixed(1)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Bebidas (sem gelo)</dt>
              <dd className="font-serif text-2xl text-foreground">{resultado.volumeBebidas} ml</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-border bg-secondary/30 p-6 space-y-3">
          <div className="flex items-center gap-2 text-primary">
            <Info className="h-5 w-5" />
            <h2 className="font-serif text-lg text-foreground">Beba com moderação</h2>
          </div>
          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
            <li>Uma dose padrão equivale a cerca de 14 g de álcool (~17,7 ml de etanol puro).</li>
            <li>Alterne cada drink com um copo de água e nunca beba de estômago vazio.</li>
            <li>Se beber, não dirija. O cálculo aqui é estimativa e não mede sua alcoolemia.</li>
            <li>Proibido para menores de 18 anos, gestantes e lactantes.</li>
          </ul>
          <Button asChild variant="outline" size="sm">
            <Link to="/consumo-responsavel">Guia de consumo responsável</Link>
          </Button>
        </section>
      </main>
    </div>
  );
}
