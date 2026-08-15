import { useMemo } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, PartyPopper } from "lucide-react";
import { DrinkImage } from "@/components/drink-image";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { drinksQuery } from "@/lib/queries";
import { decodificarCarta } from "@/lib/carta-link";
import { templatePorId } from "@/lib/carta-templates";
import { calcularListaCompras, formatarVolume } from "@/lib/porcoes";
import { drinkParam } from "@/lib/slug";

export const Route = createFileRoute("/carta_/ver")({
  validateSearch: (search: Record<string, unknown>) => ({
    c: typeof search.c === "string" ? search.c : "",
  }),
  head: () => ({
    meta: [
      { title: "Carta de drinks do evento — Destilados & Coquetéis" },
      {
        name: "description",
        content:
          "Veja as receitas da carta de drinks deste evento: ingredientes, dificuldade e modo de preparo direto no celular.",
      },
      { property: "og:title", content: "Carta de drinks do evento" },
      {
        property: "og:description",
        content: "As receitas escolhidas para a festa, prontas para consultar no celular.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(drinksQuery),
  component: CartaPublicaPage,
});

function CartaPublicaPage() {
  const { c } = Route.useSearch();
  const { data: drinks } = useSuspenseQuery(drinksQuery);
  const carta = useMemo(() => (c ? decodificarCarta(c) : null), [c]);

  const selecionados = useMemo(
    () => (carta ? carta.d.map((id) => drinks.find((d) => d.id === id)).filter(Boolean) : []),
    [carta, drinks],
  );

  const tema = templatePorId(carta?.tpl);

  const totalPorcoes = (carta?.c ?? 0) * (carta?.p ?? 0);
  const porcoesPorReceita =
    totalPorcoes > 0 && selecionados.length > 0
      ? Math.ceil(totalPorcoes / selecionados.length)
      : 0;
  const compras = useMemo(
    () =>
      calcularListaCompras(
        selecionados.map((d) => ({
          ingredientes: d!.drink_ingredientes
            .map((di) => di.ingredientes?.nome ?? "")
            .filter(Boolean),
        })),
        porcoesPorReceita,
      ),
    [selecionados, porcoesPorReceita],
  );

  if (!carta || selecionados.length === 0) {
    return (
      <main id="conteudo" className="mx-auto min-h-dvh max-w-xl px-4 py-16 text-center">
        <h1 className="font-serif text-3xl text-foreground">Carta não encontrada</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Este link parece incompleto ou expirado. Peça um novo link a quem organizou a festa.
        </p>
        <Link
          to="/drinks"
          className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-4 text-sm text-primary-foreground"
        >
          Ver todas as receitas <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </main>
    );
  }

  return (
    <div className="min-h-dvh">
      <header
        className="border-b border-border px-4 py-10 text-center"
        style={{ background: tema.preview.fundo }}
      >
        <p
          className="text-xs uppercase tracking-[0.3em]"
          style={{ color: tema.preview.destaque }}
        >
          Carta de drinks
        </p>
        <h1
          className="mt-3 font-serif text-3xl sm:text-4xl"
          style={{ color: tema.preview.tinta }}
        >
          {carta.t}
        </h1>
        {carta.s && (
          <p className="mt-2 text-sm" style={{ color: tema.preview.tinta, opacity: 0.75 }}>
            {carta.s}
          </p>
        )}
      </header>

      <main id="conteudo" className="mx-auto max-w-3xl px-4 py-10">
        <h2 className="sr-only">Receitas da carta</h2>
        <ul className="space-y-4">
          {selecionados.map((d) => (
            <li key={d!.id}>
              <Link
                to="/drinks/$id"
                params={{ id: drinkParam(d!) }}
                className="flex items-center gap-4 rounded-xl border border-border bg-card/40 p-3 transition-colors hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <DrinkImage
                  path={d!.imagem_url}
                  alt={`Drink ${d!.nome}`}
                  className="h-20 w-20 shrink-0 rounded-lg object-cover"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-serif text-lg text-foreground">{d!.nome}</span>
                    <DifficultyBadge value={d!.dificuldade} />
                  </span>
                  <span className="mt-1 line-clamp-2 block text-xs text-muted-foreground">
                    {d!.drink_ingredientes
                      .map((di) => di.ingredientes?.nome)
                      .filter(Boolean)
                      .join(" · ") || "Sem ingredientes"}
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>

        {porcoesPorReceita > 0 && compras.itens.length > 0 && (
          <section
            aria-labelledby="compras-titulo"
            className="mt-10 rounded-xl border border-border bg-card/40 p-4 sm:p-6"
          >
            <h2
              id="compras-titulo"
              className="inline-flex items-center gap-2 font-serif text-xl text-foreground"
            >
              <PartyPopper className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              Lista de compras da festa
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {carta.c} convidados · {carta.p} drink(s) por pessoa · {totalPorcoes} porções · volume
              aproximado de {formatarVolume(compras.volumeTotalMl)}
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[28rem] text-sm">
                <caption className="sr-only">Quantidades e embalagens sugeridas</caption>
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th scope="col" className="py-2 pr-3 font-medium">
                      Ingrediente
                    </th>
                    <th scope="col" className="py-2 pr-3 font-medium">
                      Total
                    </th>
                    <th scope="col" className="py-2 font-medium">
                      Comprar
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {compras.itens.map((i) => (
                    <tr key={i.nome} className="border-b border-border/60 last:border-0">
                      <td className="py-2 pr-3 text-foreground">{i.nome}</td>
                      <td className="py-2 pr-3 text-foreground">{i.quantidade}</td>
                      <td className="py-2 text-muted-foreground">
                        {i.garrafas !== null ? `${i.garrafas} × ${i.embalagem}` : "a gosto"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Aprecie com moderação. Venda proibida para menores de 18 anos.
        </p>
      </main>
    </div>
  );
}
