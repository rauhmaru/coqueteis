import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, Calculator, Pencil, Youtube } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { drinkQuery, type DrinkComIngredientes } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DrinkImage } from "@/components/drink-image";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { DrinkSocial } from "@/components/drink-social";
import { ShareDrink } from "@/components/share-drink";
import { PortionCalculator } from "@/components/portion-calculator";
import { FavoriteButton } from "@/components/favorite-button";
import { FichaTecnica } from "@/components/ficha-tecnica";
import { normalizarPassos, metodoLabel } from "@/lib/ficha-tecnica";
import { useAuth } from "@/hooks/use-auth";
import { canManageItem } from "@/lib/permissions";

export const Route = createFileRoute("/drinks/$id/")({
  head: ({ params, loaderData }) => {
    const url = `https://coqueteis.lovable.app/drinks/${params.id}`;
    const drink = loaderData as unknown as DrinkComIngredientes | undefined;
    if (!drink) {
      return { meta: [{ title: "Drink — Destilados & Coquetéis" }], links: [{ rel: "canonical", href: url }] };
    }
    const ingredientes = drink.drink_ingredientes
      .map((di) => di.ingredientes?.nome)
      .filter((n): n is string => Boolean(n));

    const titulo = `${drink.nome} — receita do drink`;
    const descricao =
      `Receita de ${drink.nome}: ingredientes (${ingredientes.slice(0, 6).join(", ")}) e modo de preparo passo a passo.`.slice(
        0,
        158,
      );
    return {
      meta: [
        { title: titulo },
        { name: "description", content: descricao },
        { property: "og:title", content: titulo },
        { property: "og:description", content: descricao },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary" },
        { name: "twitter:title", content: titulo },
        { name: "twitter:description", content: descricao },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Recipe",
            name: drink.nome,
            url,
            description: descricao,
            recipeCategory: "Coquetel",
            recipeCuisine: "Coquetelaria",
            recipeIngredient: ingredientes,
            recipeInstructions: (() => {
              const passos = normalizarPassos(drink.passos, drink.preparo);
              return passos.length > 0
                ? passos.map((p) => ({ "@type": "HowToStep", position: p.ordem, text: p.texto }))
                : undefined;
            })(),
            tool: drink.copo ? [{ "@type": "HowToTool", name: drink.copo }] : undefined,
            cookingMethod: metodoLabel(drink.metodo_preparo) ?? undefined,
            inLanguage: "pt-BR",
          }),
        },
      ],
    };
  },

  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(drinkQuery(params.id));
    if (!data) {
      // Receita unificada: redireciona o link antigo para a entrada mantida.
      const { data: red } = await supabase
        .from("drink_redirects")
        .select("new_id")
        .eq("old_id", params.id)
        .maybeSingle();
      if (red?.new_id) {
        throw redirect({ to: "/drinks/$id", params: { id: red.new_id }, replace: true });
      }
      throw notFound();
    }
    return data;
  },
  component: DrinkDetail,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-destructive">Erro: {error.message}</div>
  ),
  notFoundComponent: () => (
    <div className="min-h-dvh">
      <SiteHeader />
      <div className="p-12 text-center text-muted-foreground">Drink não encontrado.</div>
    </div>
  ),
});

function DrinkDetail() {
  const { id } = Route.useParams();
  const { data: drink } = useSuspenseQuery(drinkQuery(id));
  const { canEdit, user, isAdmin } = useAuth();
  const canManage = canManageItem({ user, isAdmin, canEdit }, drink);
  if (!drink) return null;

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main id="conteudo" className="mx-auto max-w-4xl px-4 py-10 space-y-8">
        <Link to="/drinks" className="inline-flex min-h-11 items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Voltar para drinks
        </Link>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
          <DrinkImage
            path={drink.imagem_url}
            alt={`Foto do drink ${drink.nome}`}
            className="aspect-square w-full object-cover rounded-xl border border-border bg-secondary/40"
          />
          <div className="space-y-6">
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-foreground">{drink.nome}</h1>
              <div className="flex flex-wrap items-center gap-1.5 mt-3">
                <DifficultyBadge value={drink.dificuldade} />
                {drink.drink_drink_categorias.map((c) => (
                  <Badge key={c.categoria_id}>{c.drink_categorias?.nome ?? "?"}</Badge>
                ))}
              </div>
            </div>
            {drink.historia && (
              <div>
                <h2 className="text-xs uppercase tracking-[0.2em] text-primary mb-2">História</h2>
                <p className="text-muted-foreground leading-relaxed">{drink.historia}</p>
              </div>
            )}
            <div>
              <h2 className="text-xs uppercase tracking-[0.2em] text-primary mb-2">Ingredientes</h2>
              <div className="flex flex-wrap gap-2">
                {drink.drink_ingredientes.map((di) => (
                  <Badge key={di.ingrediente_id} variant="secondary">
                    {di.ingredientes?.nome ?? "?"}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-xs uppercase tracking-[0.2em] text-primary mb-2">Preparo</h2>
              <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                {drink.preparo || <span className="text-muted-foreground italic">Sem instruções de preparo.</span>}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {canManage && (
                <Button asChild className="min-h-11 sm:min-h-9">
                  <Link to="/drinks/$id/editar" params={{ id: drink.id }}>
                    <Pencil className="h-4 w-4 mr-2" aria-hidden="true" /> Editar
                  </Link>
                </Button>
              )}
              <Button
                variant="outline"
                className="min-h-11 sm:min-h-9"
                onClick={() =>
                  window.open(
                    `https://www.youtube.com/results?search_query=${encodeURIComponent(`receita ${drink.nome}`)}`,
                    "_blank",
                    "noopener,noreferrer",
                  )
                }
              >
                <Youtube className="h-4 w-4 mr-2" aria-hidden="true" /> Ver no YouTube
              </Button>
              <Button asChild variant="outline" className="min-h-11 sm:min-h-9">
                <Link to="/calculadora-abv" search={{ drink: drink.id }}>
                  <Calculator className="h-4 w-4 mr-2" aria-hidden="true" /> Calcular teor alcoólico
                </Link>
              </Button>

              <FavoriteButton drinkId={drink.id} />
              <ShareDrink nome={drink.nome} drinkId={drink.id} imagemPath={drink.imagem_url} />
            </div>
          </div>
        </div>

        <PortionCalculator
          nome={drink.nome}
          ingredientes={drink.drink_ingredientes.map((di) => di.ingredientes?.nome ?? "Ingrediente")}
        />

        <DrinkSocial drinkId={drink.id} />
      </main>
    </div>
  );
}
