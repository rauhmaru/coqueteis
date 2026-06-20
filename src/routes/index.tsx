import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Martini, Search, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { countsQuery, drinksQuery } from "@/lib/queries";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Início — Destilados & Coquetéis" },
      { name: "description", content: "Painel principal com ingredientes e receitas cadastrados." },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(countsQuery),
      context.queryClient.ensureQueryData(drinksQuery),
    ]),
  component: HomePage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-destructive">Erro: {error.message}</div>
  ),
  notFoundComponent: () => <div className="p-8 text-center">Não encontrado.</div>,
});

function HomePage() {
  const { data: counts } = useSuspenseQuery(countsQuery);
  const { data: drinks } = useSuspenseQuery(drinksQuery);
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return drinks.filter((d) => d.nome.toLowerCase().includes(q)).slice(0, 8);
  }, [query, drinks]);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-12 space-y-12">
        <section className="text-center space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-primary">Bem-vindo ao seu bar</p>
          <h1 className="font-serif text-5xl md:text-6xl text-foreground">
            Sua coqueteleria,<br />organizada com elegância.
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Cadastre ingredientes, descubra quais drinks você pode preparar agora mesmo e
            mantenha suas receitas favoritas sempre à mão.
          </p>
        </section>

        <section className="max-w-2xl mx-auto">
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xl">
            <Command shouldFilter={false} className="bg-transparent">
              <div className="flex items-center px-4 border-b border-border">
                <Search className="h-4 w-4 text-muted-foreground" />
                <CommandInput
                  value={query}
                  onValueChange={setQuery}
                  placeholder="Buscar um drink pelo nome…"
                  className="border-0 focus:ring-0 text-base"
                />
              </div>
              {query.trim() && (
                <CommandList className="max-h-64">
                  <CommandEmpty>Nenhum drink encontrado.</CommandEmpty>
                  <CommandGroup>
                    {filtered.map((d) => (
                      <CommandItem
                        key={d.id}
                        value={d.id}
                        onSelect={() => navigate({ to: "/drinks/$id", params: { id: d.id } })}
                        className="cursor-pointer"
                      >
                        <Martini className="h-4 w-4 mr-2 text-primary" />
                        {d.nome}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              )}
            </Command>
          </div>
        </section>

        <section className="max-w-2xl mx-auto">
          <StatCard
            icon={<Martini className="h-6 w-6" />}
            label="Receitas cadastradas"
            value={counts.drinks}
            to="/drinks"
          />
        </section>
      </main>
    </div>
  );
}

function StatCard({
  icon, label, value, to,
}: { icon: React.ReactNode; label: string; value: number; to: string }) {
  return (
    <Link
      to={to}
      className="group rounded-xl border border-border bg-card p-6 hover:border-primary transition-colors flex items-center gap-4"
    >
      <div className="rounded-full bg-secondary p-3 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-3xl font-serif text-foreground">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
    </Link>
  );
}

