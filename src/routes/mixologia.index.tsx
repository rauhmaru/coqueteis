import { Link, createFileRoute } from "@tanstack/react-router";
import { listarPostagensPublicadas } from "@/lib/mixologia-postagens.functions";
import { DrinkImage } from "@/components/drink-image";
import { SiteHeader } from "@/components/site-header";
import origemImg from "@/assets/mixologia/origem.jpg";
import tiposImg from "@/assets/mixologia/tipos.jpg";
import shakerImg from "@/assets/mixologia/shaker.jpg";
import highballImg from "@/assets/mixologia/highball.jpg";
import destiladasImg from "@/assets/mixologia/destiladas.jpg";
import xaropesImg from "@/assets/mixologia/xaropes.jpg";
import geloImg from "@/assets/mixologia/gelo.jpg";
import tecnicasImg from "@/assets/mixologia/tecnicas.jpg";
import saboresImg from "@/assets/mixologia/sabores.jpg";

const topicos = [
  { to: "/mixologia/origem", label: "Origem e história", desc: "Do vinho grego aos speakeasies e à renascença dos drinks.", img: origemImg },
  { to: "/mixologia/tipos", label: "Tipos de coquetéis", desc: "Classificação por método, volume, tipo de bebida e finalidade.", img: tiposImg },
  { to: "/mixologia/materiais", label: "Materiais e utensílios", desc: "Shaker, strainer, colher bailarina, jigger e mais.", img: shakerImg },
  { to: "/mixologia/copos", label: "Copos e taças", desc: "Highball, martini, old fashioned, canecas e outros.", img: highballImg },
  { to: "/mixologia/bebidas", label: "Bebidas etílicas", desc: "Fermentadas, destiladas e infusionadas.", img: destiladasImg },
  { to: "/mixologia/xaropes", label: "Xaropes e bitters", desc: "Cor, doçura e complexidade para os coquetéis.", img: xaropesImg },
  { to: "/mixologia/gelo", label: "Gelo: de coadjuvante a estrela", desc: "O ingrediente mais subestimado do bar.", img: geloImg },
  { to: "/mixologia/tecnicas", label: "Técnicas de bartending", desc: "Shake, dry shake, stir, swizzle, throw e roll.", img: tecnicasImg },
  { to: "/mixologia/sabores", label: "Balanço de sabores", desc: "Doce, azedo, amargo e o equilíbrio do coquetel.", img: saboresImg },
] as const;

export const Route = createFileRoute("/mixologia/")({
  loader: () => listarPostagensPublicadas(),
  head: () => ({
    meta: [
      { property: "og:url", content: "https://coqueteis.lovable.app/mixologia" },
      { title: "Mixologia — Destilados & Coquetéis" },
      {
        name: "description",
        content: "Guia completo de mixologia e coquetelaria: história, técnicas, utensílios e ingredientes.",
      },
      { property: "og:title", content: "Mixologia — Destilados & Coquetéis" },
      {
        property: "og:description",
        content: "Guia completo de mixologia e coquetelaria: história, técnicas, utensílios e ingredientes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://coqueteis.lovable.app/mixologia" }],
  }),
  component: MixologiaIndex,
});

function MixologiaIndex() {
  const postagens = Route.useLoaderData();
  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main id="conteudo" className="mx-auto max-w-6xl px-4 py-12 space-y-10">
        <section className="text-center space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-primary">Aprenda</p>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-foreground">Mixologia</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Um guia para amantes da coquetelaria — da origem histórica dos drinks aos utensílios,
            copos, ingredientes e técnicas que transformam bebidas em experiências.
          </p>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {topicos.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              className="group rounded-xl border border-border bg-card overflow-hidden transition-colors hover:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <img
                src={t.img}
                alt={t.label}
                width={300}
                height={300}
                loading="lazy"
                className="w-full aspect-square object-cover"
              />
              <div className="p-5 space-y-1">
                <h2 className="font-serif text-xl text-foreground group-hover:text-primary transition-colors">
                  {t.label}
                </h2>
                <p className="text-sm text-muted-foreground">{t.desc}</p>
              </div>
            </Link>
          ))}
        </section>
        {postagens.length > 0 && (
          <section aria-labelledby="postagens-mixologia" className="space-y-5 border-t border-border pt-10">
            <div><p className="text-xs uppercase tracking-[0.3em] text-primary">Novos conteúdos</p><h2 id="postagens-mixologia" className="mt-2 font-serif text-3xl text-foreground">Postagens de Mixologia</h2></div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {postagens.map((postagem) => (
                <Link key={postagem.id} to="/mixologia/$slug" params={{ slug: postagem.slug }} className="group overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-primary focus-visible:ring-2 focus-visible:ring-ring">
                  <DrinkImage path={postagem.imagem_url} alt={postagem.imagem_alt ?? postagem.titulo} width={400} height={225} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="aspect-video w-full object-cover" />
                  <div className="space-y-2 p-5"><h3 className="font-serif text-xl text-foreground transition-colors group-hover:text-primary">{postagem.titulo}</h3><p className="line-clamp-3 text-sm text-muted-foreground">{postagem.resumo}</p></div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
