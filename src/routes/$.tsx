import { createFileRoute } from "@tanstack/react-router";
import { Pagina404 } from "@/components/pagina-404";

const TITULO = "Página não encontrada — Destilados & Coquetéis";
const DESCRICAO =
  "Este endereço não existe. Busque receitas de coquetéis ou volte para o catálogo de drinks.";

export const Route = createFileRoute("/$")({
  head: () => ({
    meta: [
      { title: TITULO },
      { name: "description", content: DESCRICAO },
      { name: "robots", content: "noindex, follow" },
      { property: "og:title", content: TITULO },
      { property: "og:description", content: DESCRICAO },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: TITULO },
      { name: "twitter:description", content: DESCRICAO },
    ],
  }),
  component: Pagina404,
  errorComponent: Pagina404,
  notFoundComponent: Pagina404,
});
