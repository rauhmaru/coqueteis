import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart, ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { DrinkImage } from "@/components/drink-image";
import { Badge } from "@/components/ui/badge";

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
  drinks: {
    id: string;
    nome: string;
    imagem_url: string | null;
    drink_drink_categorias: { drink_categorias: { nome: string } | null }[];
  } | null;
};

function FavoritosPage() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["favoritos", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<FavRow[]> => {
      const { data, error } = await supabase
        .from("drink_favoritos")
        .select("drink_id, drinks(id, nome, imagem_url, drink_drink_categorias(drink_categorias(nome)))")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as FavRow[];
    },
  });

  const favoritos = (data ?? []).filter((f) => f.drinks);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10 space-y-8">
        <Link
          to="/drinks"
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" /> Ver todos os drinks
        </Link>

        <header className="space-y-2">
          <h1 className="font-serif text-4xl text-foreground inline-flex items-center gap-3">
            <Heart className="h-8 w-8 text-primary fill-current" /> Meus Favoritos
          </h1>
          <p className="text-muted-foreground text-sm">
            {isLoading ? "Carregando..." : `${favoritos.length} ${favoritos.length === 1 ? "drink favoritado" : "drinks favoritados"}`}
          </p>
        </header>

        {!isLoading && favoritos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center space-y-3">
            <Heart className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">
              Você ainda não tem drinks favoritos. Explore o{" "}
              <Link to="/drinks" className="text-primary underline">catálogo</Link> e clique no coração para salvar.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favoritos.map((f) => {
              const d = f.drinks!;
              return (
                <Link
                  key={d.id}
                  to="/drinks/$id"
                  params={{ id: d.id }}
                  className="group rounded-xl border border-border bg-card overflow-hidden hover:border-primary/60 transition-colors"
                >
                  <DrinkImage
                    path={d.imagem_url}
                    alt={d.nome}
                    className="aspect-square w-full object-cover bg-secondary/40"
                  />
                  <div className="p-4 space-y-2">
                    <h2 className="font-serif text-xl text-foreground group-hover:text-primary transition-colors">
                      {d.nome}
                    </h2>
                    <div className="flex flex-wrap gap-1.5">
                      {d.drink_drink_categorias.slice(0, 3).map((c, i) => (
                        c.drink_categorias ? (
                          <Badge key={i} variant="secondary" className="text-[10px]">
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
