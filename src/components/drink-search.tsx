import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Martini, Search } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FavoriteIconButton } from "@/components/favorite-icon-button";
import { useAuth } from "@/hooks/use-auth";
import { drinksQuery } from "@/lib/queries";
import { buscarDrinks } from "@/lib/busca";
import { drinkParam } from "@/lib/slug";

export const PLACEHOLDER_BUSCA = "Buscar drink por nome ou ingrediente";

/**
 * Campo de busca simples (controlado) para filtrar listas já renderizadas,
 * usado em /drinks e /carta. Mesma normalização da busca por autocomplete.
 */
export function CampoBuscaDrinks({
  id,
  value,
  onChange,
  placeholder = PLACEHOLDER_BUSCA,
  className,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className ?? ""}`}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Label htmlFor={id} className="sr-only">
        {placeholder}
      </Label>
      <Input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-11 pl-9"
      />
    </div>
  );
}

/** Lista de sugestões que navega direto para a receita (home, overlay, menu mobile). */
export function AutocompleteDrinks({
  onNavegar,
  autoFocus = false,
  className,
  emDialog = false,
  limite = 8,
}: {
  onNavegar?: () => void;
  autoFocus?: boolean;
  className?: string;
  emDialog?: boolean;
  limite?: number;
}) {
  console.warn("RENDER AutocompleteDrinks");
  const { data: drinks } = useQuery(drinksQuery);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const resultados = useMemo(
    () => buscarDrinks(drinks ?? [], query, limite),
    [drinks, query, limite],
  );
  const buscando = query.trim().length > 0;

  const abrir = (id: string, slug: string | null) => {
    setQuery("");
    onNavegar?.();
    navigate({ to: "/drinks/$id", params: { id: drinkParam({ id, slug }) } });
  };

  const conteudo = (
    <Command shouldFilter={false} className="bg-transparent">
      <CommandInput
        value={query}
        onValueChange={setQuery}
        autoFocus={autoFocus}
        aria-label={PLACEHOLDER_BUSCA}
        placeholder={`${PLACEHOLDER_BUSCA}…`}
        className="text-base"
      />
      <p aria-live="polite" role="status" className="sr-only">
        {buscando
          ? resultados.length === 0
            ? "Nenhuma sugestão disponível"
            : `${resultados.length} ${resultados.length === 1 ? "sugestão" : "sugestões"} disponíveis`
          : ""}
      </p>
      <CommandList className={buscando ? "max-h-64" : "hidden"}>
        {buscando && <CommandEmpty>Nenhum drink encontrado.</CommandEmpty>}
        {buscando && (
          <CommandGroup>
            {resultados.map((d) => (
              <CommandItem
                key={d.id}
                value={d.id}
                onSelect={() => abrir(d.id, d.slug ?? null)}
                className="cursor-pointer"
              >
                <Martini className="mr-2 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span className="flex-1 truncate">{d.nome}</span>
                {d.drink_drink_categorias[0]?.drink_categorias?.nome && (
                  <span className="ml-2 truncate text-xs text-muted-foreground">
                    {d.drink_drink_categorias[0].drink_categorias.nome}
                  </span>
                )}
                {user && (
                  <span className="ml-2 shrink-0">
                    <FavoriteIconButton drinkId={d.id} />
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </Command>
  );

  if (emDialog) return conteudo;
  return (
    <div className={`overflow-hidden rounded-xl border border-border bg-card ${className ?? ""}`}>
      {conteudo}
    </div>
  );
}

/** Botão de lupa do cabeçalho: abre a busca em overlay ("/" abre, Esc fecha). */
export function BuscaOverlay() {
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const alvo = e.target as HTMLElement | null;
      const editavel =
        alvo?.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(alvo?.tagName ?? "");
      if (editavel) return;
      e.preventDefault();
      setAberto(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-label="Buscar drinks (atalho: barra)"
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:min-h-9 md:min-w-9"
      >
        <Search className="h-4 w-4" aria-hidden="true" />
      </button>
      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="overflow-hidden p-0 sm:max-w-lg">
          <DialogTitle className="sr-only">Buscar drinks</DialogTitle>
          <AutocompleteDrinks
            emDialog
            autoFocus
            limite={10}
            onNavegar={() => setAberto(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
