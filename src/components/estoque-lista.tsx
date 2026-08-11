import { useMemo, useState } from "react";
import { ChevronDown, Search, Trash2, Wallet, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { brl, custoPorMl, type ItemBar } from "@/lib/meu-bar";
import { normalizar } from "@/lib/abv";

const PAGINA = 10;

/**
 * Estoque em lista compacta: busca, filtro por tipo e linhas que expandem
 * apenas quando o usuário quer editar — pensado para navegação mobile.
 */
export function EstoqueLista({
  itens,
  doseMl,
  salvando,
  onSalvar,
  onRemover,
}: {
  itens: ItemBar[];
  doseMl: number;
  salvando: boolean;
  onSalvar: (
    id: string,
    preco: number | null,
    volume: number | null,
    observacoes: string | null,
  ) => void;
  onRemover: (id: string) => void;
}) {
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState<string | null>(null);
  const [visiveis, setVisiveis] = useState(PAGINA);
  const [aberto, setAberto] = useState<string | null>(null);

  const tipos = useMemo(() => {
    const set = new Set<string>();
    itens.forEach((i) => {
      const t = i.ingredientes?.categorias?.nome;
      if (t) set.add(t);
    });
    return [...set].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [itens]);

  const filtrados = useMemo(() => {
    const alvo = normalizar(busca.trim());
    return itens
      .filter((i) => {
        const nome = i.ingredientes?.nome ?? "";
        const t = i.ingredientes?.categorias?.nome ?? null;
        if (tipo && t !== tipo) return false;
        if (alvo && !normalizar(nome).includes(alvo)) return false;
        return true;
      })
      .sort((a, b) =>
        (a.ingredientes?.nome ?? "").localeCompare(b.ingredientes?.nome ?? "", "pt-BR"),
      );
  }, [itens, busca, tipo]);

  const mostrados = filtrados.slice(0, visiveis);
  const restantes = filtrados.length - mostrados.length;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value);
            setVisiveis(PAGINA);
          }}
          placeholder="Buscar no meu estoque..."
          aria-label="Buscar item do estoque"
          className="min-h-11 pl-9 pr-9"
        />
        {busca && (
          <button
            type="button"
            onClick={() => setBusca("")}
            aria-label="Limpar busca"
            className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {tipos.length > 1 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Filtrar por tipo">
          <li>
            <FiltroChip ativo={tipo === null} onClick={() => setTipo(null)}>
              Todos
            </FiltroChip>
          </li>
          {tipos.map((t) => (
            <li key={t}>
              <FiltroChip
                ativo={tipo === t}
                onClick={() => {
                  setTipo(tipo === t ? null : t);
                  setVisiveis(PAGINA);
                }}
              >
                {t}
              </FiltroChip>
            </li>
          ))}
        </ul>
      )}

      {filtrados.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum item do estoque corresponde à busca.</p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card/40">
          {mostrados.map((item) => (
            <LinhaEstoque
              key={item.id}
              item={item}
              doseMl={doseMl}
              salvando={salvando}
              aberto={aberto === item.id}
              onToggle={() => setAberto((a) => (a === item.id ? null : item.id))}
              onSalvar={(p, v, o) => onSalvar(item.id, p, v, o)}
              onRemover={() => onRemover(item.id)}
            />
          ))}
        </ul>
      )}

      {filtrados.length > PAGINA && (
        <div className="flex flex-wrap items-center gap-3">
          <p aria-live="polite" className="text-xs text-muted-foreground">
            Mostrando {mostrados.length} de {filtrados.length}
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

function FiltroChip({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={`inline-flex min-h-9 items-center rounded-full border px-3 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        ativo
          ? "border-primary bg-primary/15 text-primary"
          : "border-border bg-secondary text-secondary-foreground hover:border-primary/60"
      }`}
    >
      {children}
    </button>
  );
}

function LinhaEstoque({
  item,
  doseMl,
  salvando,
  aberto,
  onToggle,
  onSalvar,
  onRemover,
}: {
  item: ItemBar;
  doseMl: number;
  salvando: boolean;
  aberto: boolean;
  onToggle: () => void;
  onSalvar: (preco: number | null, volume: number | null, observacoes: string | null) => void;
  onRemover: () => void;
}) {
  const [preco, setPreco] = useState(item.preco_garrafa?.toString() ?? "");
  const [volume, setVolume] = useState(item.volume_garrafa_ml?.toString() ?? "");
  const [obs, setObs] = useState(item.observacoes ?? "");

  const porMl = custoPorMl(item);
  const nome = item.ingredientes?.nome ?? "Ingrediente";
  const tipo = item.ingredientes?.categorias?.nome;
  const painelId = `estoque-item-${item.id}`;

  const parse = (v: string) => {
    const t = v.trim().replace(",", ".");
    if (!t) return null;
    const n = Number(t);
    return Number.isFinite(n) && n >= 0 ? n : null;
  };

  return (
    <li>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-1">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={aberto}
          aria-controls={painelId}
          className="grid min-h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        >
          <span className="min-w-0">
            <span className="block truncate font-medium text-foreground">{nome}</span>
            <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
              {tipo && <span className="truncate">{tipo}</span>}
              {porMl !== null ? (
                <span className="inline-flex items-center gap-1 text-foreground">
                  <Wallet className="h-3 w-3 text-primary" aria-hidden="true" />
                  {brl(porMl * doseMl)} / {doseMl} ml
                </span>
              ) : (
                <Badge variant="secondary" className="text-[0.7rem]">
                  Sem preço
                </Badge>
              )}
            </span>
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
              aberto ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          />
        </button>
        <Button
          variant="ghost"
          size="icon"
          className="mr-1 min-h-11 min-w-11 shrink-0 text-muted-foreground hover:text-destructive"
          aria-label={`Remover ${nome} do meu bar`}
          onClick={onRemover}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      <div id={painelId} hidden={!aberto} className="space-y-3 border-t border-border/60 p-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor={`preco-${item.id}`} className="text-xs">
              Preço (R$)
            </Label>
            <Input
              id={`preco-${item.id}`}
              inputMode="decimal"
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`volume-${item.id}`} className="text-xs">
              Volume (ml)
            </Label>
            <Input
              id={`volume-${item.id}`}
              inputMode="decimal"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor={`obs-${item.id}`} className="text-xs">
            Observações
          </Label>
          <Textarea
            id={`obs-${item.id}`}
            value={obs}
            maxLength={500}
            rows={2}
            placeholder="Ex.: comprada no mercado X, guardar na geladeira..."
            onChange={(e) => setObs(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          <p className="text-xs text-muted-foreground">
            {porMl !== null
              ? `Custo por ml: ${brl(porMl)}`
              : "Informe preço e volume para calcular o custo."}
          </p>
          <Button
            variant="outline"
            className="min-h-11 shrink-0 sm:min-h-10"
            disabled={salvando}
            onClick={() => onSalvar(parse(preco), parse(volume), obs.trim() || null)}
          >
            Salvar
          </Button>
        </div>
      </div>
    </li>
  );
}
