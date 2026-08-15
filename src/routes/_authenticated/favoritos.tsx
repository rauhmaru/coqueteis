import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart, ArrowLeft, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { DrinkImage } from "@/components/drink-image";
import { Badge } from "@/components/ui/badge";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useViewMode } from "@/hooks/use-view-mode";
import { ViewModeToggle } from "@/components/view-mode-toggle";
import {
import { drinkParam } from "@/lib/slug";
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/favoritos")({
  head: () => ({
    meta: [
      { title: "Meus Favoritos — Destilados & Coquetéis" },
      { name: "description", content: "Sua coleção pessoal de drinks favoritos." },
      { property: "og:title", content: "Meus Favoritos" },
      { property: "og:description", content: "Sua coleção pessoal de drinks favoritos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FavoritosPage,
});

type FavRow = {
  drink_id: string;
  created_at: string;
  drinks: {
    id: string;
    nome: string;
    imagem_url: string | null;
    dificuldade: string;
    drink_drink_categorias: { drink_categorias: { nome: string } | null }[];
  } | null;
};

type SortKey = "recent" | "oldest" | "name-asc" | "name-desc";

const normalize = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function FavoritosPage() {
  const { user } = useAuth();
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("recent");
  const [viewMode, setViewMode] = useViewMode("favoritos", "grid");

  const { data, isLoading } = useQuery({
    queryKey: ["favoritos", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<FavRow[]> => {
      const { data, error } = await supabase
        .from("drink_favoritos")
        .select("drink_id, created_at, drinks(id, nome, imagem_url, dificuldade, drink_drink_categorias(drink_categorias(nome)))")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as FavRow[];
    },
  });

  const favoritos = useMemo(() => (data ?? []).filter((f) => f.drinks), [data]);

  const categorias = useMemo(() => {
    const set = new Set<string>();
    favoritos.forEach((f) =>
      f.drinks!.drink_drink_categorias.forEach((c) => {
        if (c.drink_categorias?.nome) set.add(c.drink_categorias.nome);
      })
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [favoritos]);

  const filtrados = useMemo(() => {
    const q = normalize(busca.trim());
    let out = favoritos.filter((f) => {
      const d = f.drinks!;
      if (q && !normalize(d.nome).includes(q)) return false;
      if (categoria !== "all") {
        const has = d.drink_drink_categorias.some(
          (c) => c.drink_categorias?.nome === categoria
        );
        if (!has) return false;
      }
      return true;
    });
    out = [...out].sort((a, b) => {
      switch (sort) {
        case "oldest":
          return a.created_at.localeCompare(b.created_at);
        case "name-asc":
          return a.drinks!.nome.localeCompare(b.drinks!.nome, "pt-BR");
        case "name-desc":
          return b.drinks!.nome.localeCompare(a.drinks!.nome, "pt-BR");
        case "recent":
        default:
          return b.created_at.localeCompare(a.created_at);
      }
    });
    return out;
  }, [favoritos, busca, categoria, sort]);

  const total = favoritos.length;
  const filtroAtivo = busca.trim() !== "" || categoria !== "all";

  const limpar = () => {
    setBusca("");
    setCategoria("all");
  };

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main id="conteudo" className="mx-auto max-w-6xl px-4 py-10 space-y-8">
        <Link
          to="/drinks"
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Ver todos os drinks
        </Link>

        <header className="space-y-2">
          <h1 className="font-serif text-3xl sm:text-4xl text-foreground inline-flex items-center gap-3">
            <Heart className="h-7 w-7 sm:h-8 sm:w-8 shrink-0 text-primary fill-current" aria-hidden="true" /> Meus Favoritos
          </h1>
          <p className="text-muted-foreground text-sm">
            {isLoading
              ? "Carregando..."
              : filtroAtivo
                ? `${filtrados.length} de ${total} ${total === 1 ? "drink" : "drinks"}`
                : `${total} ${total === 1 ? "drink favoritado" : "drinks favoritados"}`}
          </p>
        </header>

        {total > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto] sm:items-center">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome..."
                aria-label="Buscar favoritos por nome"
                className="pl-9"
              />
            </div>
            <Select value={categoria} onValueChange={setCategoria}>
              <SelectTrigger aria-label="Filtrar por categoria" className="min-h-11 w-full sm:min-h-9 sm:w-[180px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                {categorias.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger aria-label="Ordenar favoritos" className="min-h-11 w-full sm:min-h-9 sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Mais recentes</SelectItem>
                <SelectItem value="oldest">Mais antigos</SelectItem>
                <SelectItem value="name-asc">Nome A-Z</SelectItem>
                <SelectItem value="name-desc">Nome Z-A</SelectItem>
              </SelectContent>
            </Select>
            <ViewModeToggle value={viewMode} onChange={setViewMode} />
          </div>
        )}

        {!isLoading && total === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center space-y-3">
            <Heart className="h-10 w-10 text-muted-foreground mx-auto" aria-hidden="true" />
            <p className="text-muted-foreground">
              Você ainda não tem drinks favoritos. Explore o{" "}
              <Link to="/drinks" className="text-primary underline">catálogo</Link> e clique no coração para salvar.
            </p>
          </div>
        ) : !isLoading && filtrados.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center space-y-3">
            <p className="text-muted-foreground">Nenhum favorito corresponde aos filtros.</p>
            <Button variant="outline" size="sm" onClick={limpar} className="min-h-11 sm:min-h-9">
              <X className="h-4 w-4 mr-1.5" /> Limpar filtros
            </Button>
          </div>
        ) : (
          <div className={viewMode === "grid" ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" : "flex flex-col gap-3"}>
            {filtrados.map((f) => {
              const d = f.drinks!;
              return viewMode === "grid" ? (
                <Link
                  key={d.id}
                  to="/drinks/$id"
                  params={{ id: drinkParam(d) }}
                  className="group rounded-xl border border-border bg-card overflow-hidden hover:border-primary/60 transition-colors"
                >
                  <DrinkImage
                    path={d.imagem_url}
                    alt={`Foto do drink ${d.nome}`}
                    className="aspect-square w-full object-cover bg-secondary/40"
                  />
                  <div className="p-4 space-y-2">
                    <h2 className="font-serif text-xl text-foreground group-hover:text-primary transition-colors">
                      {d.nome}
                    </h2>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <DifficultyBadge value={d.dificuldade} />
                      {d.drink_drink_categorias.slice(0, 3).map((c, i) => (
                        c.drink_categorias ? (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {c.drink_categorias.nome}
                          </Badge>
                        ) : null
                      ))}
                    </div>
                  </div>
                </Link>
              ) : (
                <Link
                  key={d.id}
                  to="/drinks/$id"
                  params={{ id: drinkParam(d) }}
                  className="group flex items-center gap-4 p-3 rounded-xl border border-border bg-card hover:border-primary/60 transition-colors"
                >
                  <DrinkImage
                    path={d.imagem_url}
                    alt={`Foto do drink ${d.nome}`}
                    className="h-20 w-20 sm:h-24 sm:w-24 rounded-lg object-cover bg-secondary/40 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h2 className="font-serif text-lg sm:text-xl text-foreground group-hover:text-primary transition-colors truncate">
                      {d.nome}
                    </h2>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <DifficultyBadge value={d.dificuldade} />
                      {d.drink_drink_categorias.slice(0, 3).map((c, i) => (
                        c.drink_categorias ? (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {c.drink_categorias.nome}
                          </Badge>
                        ) : null
                      ))}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
