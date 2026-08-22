import { useMemo, useState } from "react";
import { Filter, X, ChevronDown, Search } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DIFICULDADES } from "@/components/difficulty-badge";
import {
  drinksIndiceQuery,
  type DrinkComIngredientes,
  type Ingrediente,
  type DrinkCategoria,
} from "@/lib/queries";

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

/** Agrupamento amigável das categorias de ingredientes cadastradas. */
const GRUPOS: { titulo: string; categorias: string[] }[] = [
  { titulo: "Destilados", categorias: ["Destilados"] },
  { titulo: "Licores e aperitivos", categorias: ["Licores", "Vermutes & Aperitivos"] },
  { titulo: "Sucos e frutas", categorias: ["Cítricos", "Ervas & Frutas"] },
  { titulo: "Xaropes e adoçantes", categorias: ["Adoçantes"] },
  { titulo: "Refrigerantes e águas", categorias: ["Espumantes & Refrigerantes"] },
  { titulo: "Laticínios", categorias: ["Laticínios"] },
  {
    titulo: "Especiarias e guarnições",
    categorias: ["Especiarias & Guarnições", "Bitters"],
  },
];

const norm = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function ChipIngrediente({
  ing,
  on,
  total,
  onToggle,
}: {
  ing: Ingrediente;
  on: boolean;
  total: number;
  onToggle: () => void;
}) {
  const disabled = !on && total === 0;
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={on}
      title={disabled ? "Nenhuma receita com os filtros atuais" : undefined}
      className={`${chip(on)} gap-1.5 ${disabled ? "opacity-40 cursor-not-allowed hover:border-border" : ""}`}
    >
      <span>{ing.nome}</span>
      <span
        className={`rounded-full px-1.5 text-[10px] leading-4 ${
          on ? "bg-primary-foreground/20" : "bg-secondary text-muted-foreground"
        }`}
      >
        {total}
      </span>
    </button>
  );
}

function FiltroIngredientes({
  ingredientes,
  selected,
  contagens,
  onToggle,
  onClear,
  idPrefix,
}: {
  ingredientes: Ingrediente[];
  selected: Set<string>;
  contagens: Map<string, number>;
  onToggle: (id: string) => void;
  onClear: () => void;
  idPrefix: string;
}) {
  const [open, setOpen] = useState(false);
  const [busca, setBusca] = useState("");

  const visiveis = useMemo(() => {
    const q = norm(busca.trim());
    if (!q) return ingredientes;
    return ingredientes.filter((i) => norm(i.nome).includes(q));
  }, [ingredientes, busca]);

  const maisUsados = useMemo(
    () =>
      [...visiveis]
        .sort((a, b) => (contagens.get(b.id) ?? 0) - (contagens.get(a.id) ?? 0))
        .filter((i) => (contagens.get(i.id) ?? 0) > 0)
        .slice(0, 12),
    [visiveis, contagens],
  );

  const grupos = useMemo(() => {
    const usados = new Set<string>();
    const out = GRUPOS.map((g) => {
      const itens = visiveis.filter((i) => {
        const cat = i.categorias?.nome ?? "";
        if (!g.categorias.includes(cat)) return false;
        usados.add(i.id);
        return true;
      });
      return { titulo: g.titulo, itens };
    }).filter((g) => g.itens.length > 0);
    const resto = visiveis.filter((i) => !usados.has(i.id));
    if (resto.length > 0) out.push({ titulo: "Outros", itens: resto });
    return out;
  }, [visiveis]);

  return (
    <FiltroSection
      id={`${idPrefix}-ingredientes`}
      titulo="Filtrar por ingredientes disponíveis"
      ativos={selected.size}
      open={open}
      onToggle={() => setOpen((v) => !v)}
      onClear={onClear}
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
        <>
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-busca-ing`}>Buscar ingrediente</Label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id={`${idPrefix}-busca-ing`}
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Ex.: gin, limão, hortelã"
                className="min-h-11 pl-9"
              />
            </div>
          </div>

          {selected.size > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">Selecionados</p>
              <div className="flex flex-wrap gap-2">
                {ingredientes
                  .filter((i) => selected.has(i.id))
                  .map((ing) => (
                    <ChipIngrediente
                      key={ing.id}
                      ing={ing}
                      on
                      total={contagens.get(ing.id) ?? 0}
                      onToggle={() => onToggle(ing.id)}
                    />
                  ))}
              </div>
            </div>
          )}

          {!busca.trim() && maisUsados.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">Mais usados</p>
              <div className="flex flex-wrap gap-2">
                {maisUsados.map((ing) => (
                  <ChipIngrediente
                    key={ing.id}
                    ing={ing}
                    on={selected.has(ing.id)}
                    total={contagens.get(ing.id) ?? 0}
                    onToggle={() => onToggle(ing.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {grupos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum ingrediente encontrado.</p>
          ) : (
            grupos.map((g) => (
              <div key={g.titulo} className="space-y-2">
                <p className="text-xs font-medium text-foreground">
                  {g.titulo}{" "}
                  <span className="text-muted-foreground">({g.itens.length})</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {g.itens.map((ing) => (
                    <ChipIngrediente
                      key={ing.id}
                      ing={ing}
                      on={selected.has(ing.id)}
                      total={contagens.get(ing.id) ?? 0}
                      onToggle={() => onToggle(ing.id)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </>
      )}
      {selected.size > 0 && (
        <p className="text-xs text-muted-foreground">
          Mostrando drinks que contêm <strong>todos</strong> os {selected.size} ingredientes
          selecionados.
        </p>
      )}
    </FiltroSection>
  );
}

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
  const [openQtd, setOpenQtd] = useState(false);

  const { data: indice } = useQuery(drinksIndiceQuery);

  const qtdNum = useMemo(() => {
    const t = qtd.trim();
    if (!t) return null;
    const n = Number(t);
    if (!Number.isFinite(n) || n < 1) return null;
    return Math.floor(n);
  }, [qtd]);

  const qtdErro = qtd.trim() && qtdNum === null ? "Informe um número inteiro maior que 0." : null;

  /** Quantas receitas cada ingrediente traria, respeitando os outros filtros ativos. */
  const contagens = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const d of indice ?? []) {
      if (selectedCats.size > 0) {
        const cats = new Set(d.categorias);
        let ok = true;
        for (const c of selectedCats) if (!cats.has(c)) ok = false;
        if (!ok) continue;
      }
      if (selectedDifs.size > 0 && !selectedDifs.has(d.dificuldade)) continue;
      if (qtdNum !== null) {
        const t = d.ingredientes.length;
        if (comparador === "igual" && t !== qtdNum) continue;
        if (comparador === "ate" && t > qtdNum) continue;
        if (comparador === "acima" && t < qtdNum) continue;
      }
      const ids = new Set(d.ingredientes);
      let combina = true;
      for (const sel of selected) if (!ids.has(sel)) combina = false;
      if (!combina) continue;
      for (const id of ids) mapa.set(id, (mapa.get(id) ?? 0) + 1);
    }
    return mapa;
  }, [indice, selected, selectedCats, selectedDifs, qtdNum, comparador]);

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

      <FiltroIngredientes
        ingredientes={ingredientes}
        selected={selected}
        contagens={contagens}
        onToggle={(id) => toggleIn(setSelected, id)}
        onClear={() => setSelected(new Set())}
        idPrefix={idPrefix}
      />
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
    /** Mesmo conteúdo de `element`; use em colunas laterais ou bottom sheets. */
    painel: element,
    ativos,
    limparTudo,
    temFiltro: ativos > 0,
    filtrosServidor,
  };
}
