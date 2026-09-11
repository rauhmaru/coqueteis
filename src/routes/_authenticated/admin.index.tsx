import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BarChart3,
  FlaskConical,
  Gauge,
  History,
  Merge,
  Martini,
  Shield,
  ScrollText,
  TrendingUp,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Administração geral | Destilados & Coquetéis" },
      {
        name: "description",
        content:
          "Central de administração: ingredientes, receitas, cartas de eventos, unificação de ingredientes e auditoria.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Administração geral" },
      {
        property: "og:description",
        content: "Central de administração do catálogo de drinks e ingredientes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-destructive">Erro: {error.message}</div>
  ),
});

const cardBase =
  "flex min-h-24 flex-col gap-1 rounded-xl border border-border/60 bg-card/50 p-4 transition-colors hover:border-primary/50 hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function AdminPage() {
  const { isAdmin } = useAuth();

  const itens = [
    {
      to: "/ingredientes" as const,
      titulo: "Ingredientes",
      desc: "Cadastrar, editar e remover ingredientes do acervo.",
      Icon: FlaskConical,
      admin: false,
    },
    {
      to: "/drinks" as const,
      titulo: "Receitas",
      desc: "Consultar o catálogo, editar receitas e cadastrar novas.",
      Icon: Martini,
      admin: false,
    },
    {
      to: "/carta" as const,
      titulo: "Eventos",
      desc: "Montar cartas de drinks para eventos e gerar PDF com QR Code.",
      Icon: ScrollText,
      admin: false,
    },
    {
      to: "/unificar-ingredientes" as const,
      titulo: "Unificação",
      desc: "Unificar ingredientes duplicados em todas as receitas e estoques.",
      Icon: Merge,
      admin: true,
    },
    {
      to: "/usuarios" as const,
      titulo: "Usuários",
      desc: "Gerenciar permissões de administradores e editores.",
      Icon: Shield,
      admin: true,
    },
    {
      to: "/indexacao" as const,
      titulo: "Indexação (SEO)",
      desc: "Acompanhar a indexação das páginas e o estado do sitemap.",
      Icon: BarChart3,
      admin: true,
    },
    {
      to: "/admin/metricas" as const,
      titulo: "Métricas",
      desc: "Totais do catálogo, engajamento nas receitas e visitantes dos últimos 7 dias.",
      Icon: TrendingUp,
      admin: true,
    },
    {
      to: "/desempenho" as const,
      titulo: "Desempenho real",
      desc: "Mediana e percentil 75 do carregamento das páginas nos últimos 7 dias.",
      Icon: Gauge,
      admin: true,
    },
    {
      to: "/remocoes" as const,
      titulo: "Log de remoções",
      desc: "Auditoria das receitas removidas do catálogo.",
      Icon: History,
      admin: true,
    },
  ].filter((item) => !item.admin || isAdmin);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="font-serif text-2xl text-foreground md:text-3xl">Administração geral</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Tudo o que você administra em um só lugar: acervo de ingredientes, receitas, cartas de
          eventos e manutenção dos dados.
        </p>

        <nav aria-label="Áreas de administração" className="mt-6 grid gap-3 sm:grid-cols-2">
          {itens.map(({ to, titulo, desc, Icon }) => (
            <Link key={to} to={to} className={cardBase}>
              <span className="flex items-center gap-2 text-base font-semibold text-foreground">
                <Icon className="h-4 w-4 text-primary" aria-hidden="true" /> {titulo}
              </span>
              <span className="text-sm text-muted-foreground">{desc}</span>
            </Link>
          ))}
        </nav>
      </main>
    </div>
  );
}
