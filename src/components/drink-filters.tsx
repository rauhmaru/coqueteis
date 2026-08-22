import { useMemo, useState } from "react";
import { Filter, X, ChevronDown } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DIFICULDADES } from "@/components/difficulty-badge";
import type { DrinkComIngredientes, Ingrediente, DrinkCategoria } from "@/lib/queries";

export function FiltroSection({
  id,
  titulo,
  ativos,
  open,
  onToggle,
  onClear,
  children,
}: {
  id: string;
  titulo: string;
  ativos: number;
  open: boolean;
  onToggle: () => void;
  onClear?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section aria-label={titulo} className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={id}
          className="flex min-h-11 flex-1 items-center gap-2 text-left hover:text-primary transition-colors"
        >
          <Filter className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <span>{titulo}</span>
          {ativos > 0 && (
            <span className="rounded-full bg-primary/15 text-primary px-2 py-0.5 text-xs">
              {ativos}
            </span>
          )}
          <ChevronDown
            className={`h-4 w-4 ml-auto text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
        {ativos > 0 && onClear && (
          <button
            type="button"
            onClick={onClear}
            aria-label={`Limpar ${titulo.toLowerCase()}`}
            className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" aria-hidden="true" /> Limpar
          </button>
        )}
      </div>
      {open && (
        <div id={id} className="space-y-3">
          {children}
        </div>
      )}
    </section>
  );
}

const chip = (on: boolean) =>
  `inline-flex min-h-11 items-center rounded-full border px-3 py-1.5 text-xs transition-colors sm:min-h-9 ${
    on
      ? "bg-primary text-primary-foreground border-primary"
      : "bg-secondary/40 text-muted-foreground border-border hover:border-primary/60"
  }`;

export type QtdComparador = "igual" | "ate" | "acima";

export const QTD_COMPARADORES: { id: QtdComparador; nome: string }[] = [
  { id: "igual", nome: "Exatamente" },
  { id: "ate", nome: "Até" },
  { id: "acima", nome: "A partir de" },
];

/** Estado + UI compartilhados dos filtros de drinks. */
export function useDrinkFilters({
  drinks,
  ingredientes,
  categorias,
  idPrefix = "filtro",
}: {
  /** Opcional: quando informado, o hook também filtra no cliente (`filtered`). */
  drinks?: DrinkComIngredientes[];
  ingredientes: Ingrediente[];
  categorias: DrinkCategoria[];
  idPrefix?: string;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectedCats, setSelectedCats] = useState<Set<string>>(new Set());
  const [selectedDifs, setSelectedDifs] = useState<Set<string>>(new Set());
  const [qtd, setQtd] = useState("");
  const [comparador, setComparador] = useState<QtdComparador>("igual");
  const [openDif, setOpenDif] = useState(false);
  const [openCat, setOpenCat] = useState(false);
  const [openIng, setOpenIng] = useState(false);
  const [openQtd, setOpenQtd] = useState(false);

  const qtdNum = useMemo(() => {
    const t = qtd.trim();
    if (!t) return null;
    const n = Number(t);
    if (!Number.isFinite(n) || n < 1) return null;
    return Math.floor(n);
  }, [qtd]);

  const qtdErro = qtd.trim() && qtdNum === null ? "Informe um número inteiro maior que 0." : null;

  const filtered = useMemo(() => {
    return (drinks ?? []).filter((d) => {
      if (selected.size > 0) {
        const ids = new Set(d.drink_ingredientes.map((di) => di.ingrediente_id));
        for (const sel of selected) if (!ids.has(sel)) return false;
      }
      if (selectedCats.size > 0) {
        const cats = new Set(d.drink_drink_categorias.map((c) => c.categoria_id));
        for (const sel of selectedCats) if (!cats.has(sel)) return false;
      }
      if (selectedDifs.size > 0 && !selectedDifs.has(d.dificuldade)) return false;
      if (qtdNum !== null) {
        const total = d.drink_ingredientes.length;
        if (comparador === "igual" && total !== qtdNum) return false;
        if (comparador === "ate" && total > qtdNum) return false;
        if (comparador === "acima" && total < qtdNum) return false;
      }
      return true;
    });
  }, [drinks, selected, selectedCats, selectedDifs, qtdNum, comparador]);

  const toggleIn = (
    setter: React.Dispatch<React.SetStateAction<Set<string>>>,
    id: string,
  ) =>
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const ativos =
    selected.size + selectedCats.size + selectedDifs.size + (qtdNum !== null ? 1 : 0);

  const limparTudo = () => {
    setSelected(new Set());
    setSelectedCats(new Set());
    setSelectedDifs(new Set());
    setQtd("");
  };

  const element = (
    <div className="space-y-4">
      <FiltroSection
        id={`${idPrefix}-dificuldade`}
        titulo="Filtrar por dificuldade de preparo"
        ativos={selectedDifs.size}
        open={openDif}
        onToggle={() => setOpenDif((v) => !v)}
        onClear={() => setSelectedDifs(new Set())}
      >
        <div className="flex flex-wrap gap-2">
          {DIFICULDADES.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => toggleIn(setSelectedDifs, d)}
              aria-pressed={selectedDifs.has(d)}
              className={chip(selectedDifs.has(d))}
            >
              {d}
            </button>
          ))}
        </div>
      </FiltroSection>

      {categorias.length > 0 && (
        <FiltroSection
          id={`${idPrefix}-categorias`}
          titulo="Filtrar por categorias"
          ativos={selectedCats.size}
          open={openCat}
          onToggle={() => setOpenCat((v) => !v)}
          onClear={() => setSelectedCats(new Set())}
        >
          <div className="flex flex-wrap gap-2">
            {categorias.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleIn(setSelectedCats, c.id)}
                aria-pressed={selectedCats.has(c.id)}
                className={chip(selectedCats.has(c.id))}
              >
                {c.nome}
              </button>
            ))}
          </div>
        </FiltroSection>
      )}

      <FiltroSection
        id={`${idPrefix}-quantidade`}
        titulo="Filtrar por quantidade de ingredientes"
        ativos={qtdNum !== null ? 1 : 0}
        open={openQtd}
        onToggle={() => setOpenQtd((v) => !v)}
        onClear={() => setQtd("")}
      >
        <div className="flex flex-wrap gap-2">
          {QTD_COMPARADORES.map((cp) => (
            <button
              key={cp.id}
              type="button"
              onClick={() => setComparador(cp.id)}
              aria-pressed={comparador === cp.id}
              className={chip(comparador === cp.id)}
            >
              {cp.nome}
            </button>
          ))}
        </div>
        <div className="max-w-48 space-y-1.5">
          <Label htmlFor={`${idPrefix}-qtd-input`}>Quantidade de ingredientes</Label>
          <Input
            id={`${idPrefix}-qtd-input`}
            inputMode="numeric"
            placeholder="Ex.: 3"
            value={qtd}
            onChange={(e) => setQtd(e.target.value)}
            aria-invalid={!!qtdErro}
            aria-describedby={qtdErro ? `${idPrefix}-qtd-erro` : undefined}
            className={`min-h-11 ${qtdErro ? "border-destructive focus-visible:ring-destructive" : ""}`}
          />
          {qtdErro && (
            <p id={`${idPrefix}-qtd-erro`} className="text-xs text-destructive">
              {qtdErro}
            </p>
          )}
        </div>
      </FiltroSection>

      <FiltroSection
        id={`${idPrefix}-ingredientes`}
        titulo="Filtrar por ingredientes disponíveis"
        ativos={selected.size}
        open={openIng}
        onToggle={() => setOpenIng((v) => !v)}
        onClear={() => setSelected(new Set())}
      >
        {ingredientes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Cadastre ingredientes em{" "}
            <Link to="/ingredientes" className="text-primary underline">
              Ingredientes
            </Link>
            .
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {ingredientes.map((ing) => (
              <button
                key={ing.id}
                type="button"
                onClick={() => toggleIn(setSelected, ing.id)}
                aria-pressed={selected.has(ing.id)}
                className={chip(selected.has(ing.id))}
              >
                {ing.nome}
              </button>
            ))}
          </div>
        )}
        {selected.size > 0 && (
          <p className="text-xs text-muted-foreground">
            Mostrando drinks que contêm <strong>todos</strong> os {selected.size} ingredientes
            selecionados.
          </p>
        )}
      </FiltroSection>
    </div>
  );

  const filtrosServidor = useMemo(
    () => ({
      ingredientes: [...selected],
      categorias: [...selectedCats],
      dificuldades: [...selectedDifs],
      qtd: qtdNum,
      comparador,
    }),
    [selected, selectedCats, selectedDifs, qtdNum, comparador],
  );

  return {
    filtered,
    element,
    ativos,
    limparTudo,
    temFiltro: ativos > 0,
    filtrosServidor,
  };
}
