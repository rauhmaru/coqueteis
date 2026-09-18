import { useMemo, useRef, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bold, Eye, Heading2, Italic, Link2, List, Loader2, Pencil, Plus, Search, Shield, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { MixologiaMarkdown } from "@/components/mixologia-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/use-auth";
import { listarPostagensAdmin, removerPostagem, salvarPostagem, type MixologiaPostagem } from "@/lib/mixologia-postagens.functions";
import { slugify } from "@/lib/slug";

export const Route = createFileRoute("/_authenticated/admin/mixologia")({
  head: () => ({ meta: [
    { title: "Postagens de Mixologia | Administração" },
    { name: "description", content: "Gerenciamento interno das postagens de Mixologia." },
    { name: "robots", content: "noindex, nofollow" },
    { property: "og:title", content: "Postagens de Mixologia" },
    { property: "og:description", content: "Gerenciamento interno das postagens de Mixologia." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: AdminMixologiaPage,
  errorComponent: ({ error }) => <div className="p-8 text-center text-destructive">Erro: {error.message}</div>,
});

type FormState = {
  id?: string; titulo: string; slug: string; resumo: string; conteudo_markdown: string;
  imagem_url: string; imagem_alt: string; publicado: boolean;
};

const vazio: FormState = { titulo: "", slug: "", resumo: "", conteudo_markdown: "## Introdução\n\nComece a escrever aqui.", imagem_url: "", imagem_alt: "", publicado: false };

function AdminMixologiaPage() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const listar = useServerFn(listarPostagensAdmin);
  const salvar = useServerFn(salvarPostagem);
  const remover = useServerFn(removerPostagem);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [form, setForm] = useState<FormState>(vazio);
  const [busca, setBusca] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<MixologiaPostagem | null>(null);
  const [removing, setRemoving] = useState(false);

  const query = useQuery({ queryKey: ["admin-mixologia-postagens"], queryFn: () => listar(), enabled: isAdmin });
  const postagens = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    return (query.data ?? []).filter((p) => !termo || `${p.titulo} ${p.resumo} ${p.slug}`.toLocaleLowerCase("pt-BR").includes(termo));
  }, [busca, query.data]);

  const setCampo = <K extends keyof FormState>(campo: K, valor: FormState[K]) => setForm((atual) => ({ ...atual, [campo]: valor }));
  const novo = () => { setForm(vazio); setEditing(true); };
  const editar = (p: MixologiaPostagem) => {
    setForm({ id: p.id, titulo: p.titulo, slug: p.slug, resumo: p.resumo, conteudo_markdown: p.conteudo_markdown, imagem_url: p.imagem_url ?? "", imagem_alt: p.imagem_alt ?? "", publicado: p.publicado });
    setEditing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const fechar = () => { setEditing(false); setForm(vazio); };

  const inserir = (antes: string, depois = "", placeholder = "texto") => {
    const el = textareaRef.current;
    if (!el) return;
    const inicio = el.selectionStart;
    const fim = el.selectionEnd;
    const selecionado = form.conteudo_markdown.slice(inicio, fim) || placeholder;
    const novoConteudo = `${form.conteudo_markdown.slice(0, inicio)}${antes}${selecionado}${depois}${form.conteudo_markdown.slice(fim)}`;
    setCampo("conteudo_markdown", novoConteudo);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(inicio + antes.length, inicio + antes.length + selecionado.length); });
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const postagem = await salvar({ data: form });
      toast.success(postagem.publicado ? "Postagem publicada." : "Rascunho salvo.");
      fechar();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-mixologia-postagens"] }),
        queryClient.invalidateQueries({ queryKey: ["mixologia-postagens"] }),
      ]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar a postagem.");
    } finally { setSaving(false); }
  };

  const onRemove = async () => {
    if (!confirm) return;
    setRemoving(true);
    try {
      await remover({ data: { id: confirm.id } });
      toast.success("Postagem removida.");
      setConfirm(null);
      await queryClient.invalidateQueries({ queryKey: ["admin-mixologia-postagens"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível remover a postagem.");
    } finally { setRemoving(false); }
  };

  if (!isAdmin) return <Restrito />;

  return (
    <div className="min-h-dvh"><SiteHeader /><main id="conteudo" className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><h1 className="font-serif text-3xl text-foreground sm:text-4xl">Postagens de Mixologia</h1><p className="mt-2 text-sm text-muted-foreground">Escreva em Markdown, revise a prévia e publique no guia.</p></div>
        {!editing && <Button type="button" onClick={novo}><Plus className="mr-2 h-4 w-4" aria-hidden="true" />Nova postagem</Button>}
      </header>

      {editing ? (
        <form onSubmit={onSubmit} className="space-y-6">
          <section className="grid gap-4 rounded-lg border border-border bg-card p-5 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2"><Label htmlFor="post-titulo">Título</Label><Input id="post-titulo" value={form.titulo} onChange={(e) => { setCampo("titulo", e.target.value); if (!form.id) setCampo("slug", slugify(e.target.value)); }} maxLength={120} required /></div>
            <div className="space-y-1.5"><Label htmlFor="post-slug">Endereço</Label><Input id="post-slug" value={form.slug} onChange={(e) => setCampo("slug", slugify(e.target.value))} placeholder="guia-de-gin" maxLength={140} /></div>
            <div className="flex items-end gap-3 pb-2"><Switch id="post-publicado" checked={form.publicado} onCheckedChange={(v) => setCampo("publicado", v)} /><Label htmlFor="post-publicado">Publicar postagem</Label></div>
            <div className="space-y-1.5 md:col-span-2"><Label htmlFor="post-resumo">Resumo</Label><Textarea id="post-resumo" value={form.resumo} onChange={(e) => setCampo("resumo", e.target.value)} rows={3} minLength={10} maxLength={220} required /><p className="text-right text-xs text-muted-foreground">{form.resumo.length}/220</p></div>
            <div className="space-y-1.5"><Label htmlFor="post-imagem">Caminho da imagem</Label><Input id="post-imagem" value={form.imagem_url} onChange={(e) => setCampo("imagem_url", e.target.value)} placeholder="mixologia/nome-da-imagem.jpg" required={form.publicado} /></div>
            <div className="space-y-1.5"><Label htmlFor="post-alt">Descrição da imagem</Label><Input id="post-alt" value={form.imagem_alt} onChange={(e) => setCampo("imagem_alt", e.target.value)} maxLength={180} required={form.publicado} /></div>
          </section>

          <section className="space-y-3">
            <div className="flex flex-wrap gap-1" role="toolbar" aria-label="Formatação Markdown">
              <Button type="button" variant="outline" size="icon" onClick={() => inserir("**", "**", "negrito")} aria-label="Negrito"><Bold className="h-4 w-4" /></Button>
              <Button type="button" variant="outline" size="icon" onClick={() => inserir("_", "_", "itálico")} aria-label="Itálico"><Italic className="h-4 w-4" /></Button>
              <Button type="button" variant="outline" size="icon" onClick={() => inserir("## ", "", "Título da seção")} aria-label="Título de seção"><Heading2 className="h-4 w-4" /></Button>
              <Button type="button" variant="outline" size="icon" onClick={() => inserir("- ", "", "item da lista")} aria-label="Lista"><List className="h-4 w-4" /></Button>
              <Button type="button" variant="outline" size="icon" onClick={() => inserir("[", "](https://)", "texto do link")} aria-label="Link"><Link2 className="h-4 w-4" /></Button>
            </div>
            <Tabs defaultValue="editar">
              <TabsList className="md:hidden"><TabsTrigger value="editar">Editar</TabsTrigger><TabsTrigger value="previa"><Eye className="mr-2 h-4 w-4" />Prévia</TabsTrigger></TabsList>
              <div className="md:grid md:grid-cols-2 md:gap-4">
                <TabsContent value="editar" className="md:block"><Label htmlFor="post-conteudo" className="sr-only">Conteúdo em Markdown</Label><Textarea ref={textareaRef} id="post-conteudo" value={form.conteudo_markdown} onChange={(e) => setCampo("conteudo_markdown", e.target.value)} className="min-h-[480px] resize-y font-mono" minLength={20} required /></TabsContent>
                <TabsContent value="previa" className="md:block"><div className="prose-mixologia min-h-[480px] space-y-6 rounded-lg border border-border bg-card p-5"><MixologiaMarkdown conteudo={form.conteudo_markdown} /></div></TabsContent>
              </div>
            </Tabs>
          </section>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={fechar} disabled={saving}><X className="mr-2 h-4 w-4" />Cancelar</Button><Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{form.publicado ? "Salvar e publicar" : "Salvar rascunho"}</Button></div>
        </form>
      ) : (
        <section aria-labelledby="lista-postagens" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><h2 id="lista-postagens" className="text-lg font-semibold">Postagens cadastradas</h2><div className="relative w-full sm:max-w-xs"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" /><Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar postagem" aria-label="Buscar postagem" className="pl-9" /></div></div>
          {query.isLoading ? <p className="flex justify-center gap-2 py-12 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Carregando…</p> : query.error ? <p className="rounded-lg border border-destructive/40 p-4 text-destructive">{query.error.message}</p> : postagens.length === 0 ? <p className="rounded-lg border border-border p-10 text-center text-muted-foreground">Nenhuma postagem encontrada.</p> : <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">{postagens.map((p) => <li key={p.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate font-semibold">{p.titulo}</h3><span className={`rounded-full px-2 py-0.5 text-xs ${p.publicado ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>{p.publicado ? "Publicada" : "Rascunho"}</span></div><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.resumo}</p></div><div className="flex shrink-0 gap-1">{p.publicado && <Button asChild variant="ghost" size="icon"><Link to="/mixologia/$slug" params={{ slug: p.slug }} aria-label={`Ver ${p.titulo}`}><Eye className="h-4 w-4" /></Link></Button>}<Button type="button" variant="ghost" size="icon" onClick={() => editar(p)} aria-label={`Editar ${p.titulo}`}><Pencil className="h-4 w-4" /></Button><Button type="button" variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setConfirm(p)} aria-label={`Remover ${p.titulo}`}><Trash2 className="h-4 w-4" /></Button></div></li>)}</ul>}
        </section>
      )}
    </main>
    <AlertDialog open={confirm !== null} onOpenChange={(open) => !open && setConfirm(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Remover postagem?</AlertDialogTitle><AlertDialogDescription>“{confirm?.titulo}” será removida definitivamente e deixará de aparecer em Mixologia.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={removing}>Cancelar</AlertDialogCancel><AlertDialogAction onClick={onRemove} disabled={removing}>{removing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Remover</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
}

function Restrito() {
  return <div className="min-h-dvh"><SiteHeader /><main className="mx-auto max-w-3xl px-4 py-16 text-center"><Shield className="mx-auto mb-3 h-10 w-10 text-muted-foreground" /><h1 className="font-serif text-3xl">Acesso restrito</h1><p className="mt-2 text-muted-foreground">Apenas administradores podem gerenciar postagens.</p></main></div>;
}