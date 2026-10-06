import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Archive, Check, Loader2, Pencil, Send, Shield } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { listarDrinksParaRevisao, alterarPublicacaoDrinks } from "@/lib/drink-drafts.functions";

export const Route = createFileRoute("/_authenticated/admin/rascunhos")({
  head: () => ({ meta: [
    { title: "Rascunhos de drinks | Administração" },
    { name: "description", content: "Revisão e publicação das receitas de drinks." },
    { name: "robots", content: "noindex, nofollow" },
    { property: "og:title", content: "Rascunhos de drinks" },
    { property: "og:description", content: "Área interna para revisar e publicar receitas de drinks." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: RascunhosPage,
  errorComponent: ({ error }) => <p role="alert" className="p-8 text-destructive">{error instanceof Error ? error.message : "Ocorreu um erro inesperado."}</p>,
});

function RascunhosPage() {
  const { isAdmin } = useAuth();
  const listar = useServerFn(listarDrinksParaRevisao);
  const alterar = useServerFn(alterarPublicacaoDrinks);
  const qc = useQueryClient();
  const [aba, setAba] = useState<"publicados" | "rascunhos">("publicados");
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [busca, setBusca] = useState("");
  const [salvando, setSalvando] = useState(false);
  const { data = [], isPending, error } = useQuery({ queryKey: ["admin-drinks-revisao"], queryFn: () => listar(), enabled: isAdmin });
  const publicados = aba === "publicados";
  const visiveis = useMemo(() => data.filter((d) => d.publicado === publicados && d.nome.toLocaleLowerCase("pt-BR").includes(busca.trim().toLocaleLowerCase("pt-BR"))), [data, publicados, busca]);
  const marcadosVisiveis = visiveis.filter((d) => selecionados.includes(d.id)).length;

  const mudarAba = (nova: string) => {
    setAba(nova as "publicados" | "rascunhos");
    setSelecionados([]);
    setBusca("");
  };
  const marcar = (id: string, ativo: boolean) => setSelecionados((atual) => ativo ? [...atual, id] : atual.filter((item) => item !== id));
  const executar = async (ids: string[], publicar: boolean) => {
    if (ids.length === 0 || salvando) return;
    setSalvando(true);
    try {
      const { total } = await alterar({ data: { ids, publicar } });
      toast.success(`${total} ${total === 1 ? "receita" : "receitas"} ${publicar ? (total === 1 ? "publicada" : "publicadas") : (total === 1 ? "movida para rascunhos" : "movidas para rascunhos")}.`);
      setSelecionados([]);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["admin-drinks-revisao"] }),
        qc.invalidateQueries({ queryKey: ["drinks"] }),
        qc.invalidateQueries({ queryKey: ["counts"] }),
      ]);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Não foi possível atualizar as receitas."); }
    finally { setSalvando(false); }
  };

  if (!isAdmin) return <div className="min-h-dvh"><SiteHeader /><main className="mx-auto max-w-4xl px-4 py-16 text-center"><Shield className="mx-auto mb-3 h-10 w-10 text-muted-foreground" /><h1 className="font-serif text-3xl">Acesso restrito</h1><p className="mt-2 text-muted-foreground">Apenas administradores podem revisar os drinks.</p></main></div>;

  return <div className="min-h-dvh"><SiteHeader /><main id="conteudo" className="mx-auto max-w-5xl space-y-6 px-4 py-10">
    <div><Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground">← Administração</Link><h1 className="mt-4 font-serif text-3xl text-foreground sm:text-4xl">Revisão de drinks</h1></div>
    <Tabs value={aba} onValueChange={mudarAba}><TabsList><TabsTrigger value="publicados">Publicados ({data.filter((d) => d.publicado).length})</TabsTrigger><TabsTrigger value="rascunhos">Rascunhos ({data.filter((d) => !d.publicado).length})</TabsTrigger></TabsList></Tabs>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><Input aria-label="Buscar receitas nesta lista" placeholder="Buscar receitas" value={busca} onChange={(e) => { setBusca(e.target.value); setSelecionados([]); }} className="sm:max-w-xs" />
      <div className="flex items-center gap-3"><Checkbox id="todos-drinks" aria-label="Selecionar todas as receitas visíveis" disabled={visiveis.length === 0 || salvando} checked={visiveis.length > 0 && marcadosVisiveis === visiveis.length} onCheckedChange={(checked) => setSelecionados(checked === true ? visiveis.slice(0, 100).map((d) => d.id) : [])} /><label htmlFor="todos-drinks" className="text-sm text-muted-foreground">Selecionar {visiveis.length > 100 ? "as primeiras 100" : "todas"} ({marcadosVisiveis}/{visiveis.length})</label></div>
    </div>
    {selecionados.length > 0 && <div className="sticky top-2 z-20 flex flex-wrap items-center justify-between gap-3 rounded-md border border-primary bg-card p-3 shadow-md"><span className="text-sm font-medium">{selecionados.length} {selecionados.length === 1 ? "receita selecionada" : "receitas selecionadas"}</span><Button disabled={salvando} onClick={() => executar(selecionados, !publicados)}>{salvando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : publicados ? <Archive className="mr-2 h-4 w-4" /> : <Send className="mr-2 h-4 w-4" />}{publicados ? "Mover para rascunhos" : "Publicar selecionados"}</Button></div>}
    {error && <p role="alert" className="text-destructive">{error.message}</p>}
    {isPending ? <p className="text-muted-foreground">Carregando receitas…</p> : visiveis.length === 0 ? <p className="border-t border-border py-10 text-center text-muted-foreground">{publicados ? "Nenhuma receita publicada encontrada." : "Nenhum rascunho encontrado."}</p> : <ul className="divide-y divide-border border-y border-border">{visiveis.map((drink) => <li key={drink.id} className="flex items-center gap-3 py-3">
      <Checkbox id={`drink-${drink.id}`} checked={selecionados.includes(drink.id)} disabled={salvando} onCheckedChange={(checked) => marcar(drink.id, checked === true)} aria-label={`Selecionar ${drink.nome}`} />
      <label htmlFor={`drink-${drink.id}`} className="min-w-0 flex-1 cursor-pointer"><span className="block truncate font-medium text-foreground">{drink.nome}</span><span className="text-xs text-muted-foreground">{new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(drink.created_at))}{!drink.imagem_url ? " · Sem imagem" : ""}</span></label>
      <Button asChild size="icon" variant="ghost" title={`Editar ${drink.nome}`} aria-label={`Editar ${drink.nome}`}><Link to="/drinks/$id/editar" params={{ id: drink.slug ?? drink.id }}><Pencil className="h-4 w-4" /></Link></Button>
      {!publicados && <Button size="icon" variant="outline" title={`Publicar ${drink.nome}`} aria-label={`Publicar ${drink.nome}`} disabled={salvando} onClick={() => executar([drink.id], true)}><Check className="h-4 w-4" /></Button>}
    </li>)}</ul>}
  </main></div>;
}