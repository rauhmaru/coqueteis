import { createFileRoute, notFound } from "@tanstack/react-router";
import { DrinkImage } from "@/components/drink-image";
import { MixologiaPage } from "@/components/mixologia-layout";
import { MixologiaMarkdown } from "@/components/mixologia-markdown";
import { obterPostagemPublicada } from "@/lib/mixologia-postagens.functions";
import { getStableImageUrl } from "@/lib/image-urls";

export const Route = createFileRoute("/mixologia/$slug")({
  loader: async ({ params }) => {
    const postagem = await obterPostagemPublicada({ data: { slug: params.slug } });
    if (!postagem) throw notFound();
    return postagem;
  },
  head: ({ loaderData, params }) => {
    const url = `https://coqueteis.lovable.app/mixologia/${params.slug}`;
    if (!loaderData) return { meta: [{ title: "Postagem indisponível — Mixologia" }, { name: "robots", content: "noindex" }] };
    const imagem = loaderData.imagem_url ? getStableImageUrl(loaderData.imagem_url) : null;
    const titulo = `${loaderData.titulo} — Mixologia`.slice(0, 59);
    return {
      meta: [
        { title: titulo },
        { name: "description", content: loaderData.resumo },
        { property: "og:title", content: titulo },
        { property: "og:description", content: loaderData.resumo },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: imagem ? "summary_large_image" : "summary" },
        ...(imagem ? [{ property: "og:image", content: imagem }, { name: "twitter:image", content: imagem }] : []),
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [{
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: loaderData.titulo,
          description: loaderData.resumo,
          image: imagem ?? undefined,
          datePublished: loaderData.publicado_em ?? loaderData.created_at,
          dateModified: loaderData.updated_at,
          mainEntityOfPage: url,
          inLanguage: "pt-BR",
        }),
      }],
    };
  },
  component: PostagemMixologia,
  notFoundComponent: () => <div className="mx-auto max-w-3xl px-4 py-20 text-center"><h1 className="font-serif text-3xl">Postagem não encontrada</h1><p className="mt-2 text-muted-foreground">Este conteúdo não está disponível.</p></div>,
  errorComponent: ({ error }) => <div className="p-8 text-center text-destructive">Erro: {error.message}</div>,
});

function PostagemMixologia() {
  const postagem = Route.useLoaderData();
  return (
    <MixologiaPage title={postagem.titulo} subtitle={postagem.resumo}>
      {postagem.imagem_url && postagem.imagem_alt && (
        <DrinkImage path={postagem.imagem_url} alt={postagem.imagem_alt} width={800} height={450} sizes="(min-width: 896px) 832px, calc(100vw - 2rem)" priority className="aspect-video w-full rounded-lg border border-border object-cover" />
      )}
      <MixologiaMarkdown conteudo={postagem.conteudo_markdown} />
    </MixologiaPage>
  );
}