import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/mixologia")({
  head: () => ({
    meta: [
      { title: "Mixologia — Destilados & Coquetéis" },
      {
        name: "description",
        content:
          "Aprenda mixologia e coquetelaria: origem, tipos, utensílios, copos, bebidas etílicas, xaropes, bitters e gelo.",
      },
      { property: "og:title", content: "Mixologia — Destilados & Coquetéis" },
      {
        property: "og:description",
        content: "Guia de mixologia: história, utensílios, copos, bebidas, xaropes, bitters e gelo.",
      },
    ],
  }),
  component: () => <Outlet />,
});
