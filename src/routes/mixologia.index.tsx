import { Link, createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import origemImg from "@/assets/mixologia/origem.jpg";
import tiposImg from "@/assets/mixologia/tipos.jpg";
import shakerImg from "@/assets/mixologia/shaker.jpg";
import highballImg from "@/assets/mixologia/highball.jpg";
import destiladasImg from "@/assets/mixologia/destiladas.jpg";
import xaropesImg from "@/assets/mixologia/xaropes.jpg";
import geloImg from "@/assets/mixologia/gelo.jpg";

const topicos = [
  { to: "/mixologia/origem", label: "Origem e história", desc: "Do vinho grego aos speakeasies e à renascença dos drinks.", img: origemImg },
  { to: "/mixologia/tipos", label: "Tipos de coquetéis", desc: "Classificação por método, volume, tipo de bebida e finalidade.", img: tiposImg },
  { to: "/mixologia/materiais", label: "Materiais e utensílios", desc: "Shaker, strainer, colher bailarina, jigger e mais.", img: shakerImg },
  { to: "/mixologia/copos", label: "Copos e taças", desc: "Highball, martini, old fashioned, canecas e outros.", img: highballImg },
  { to: "/mixologia/bebidas", label: "Bebidas etílicas", desc: "Fermentadas, destiladas e infusionadas.", img: destiladasImg },
  { to: "/mixologia/xaropes", label: "Xaropes e bitters", desc: "Cor, doçura e complexidade para os coquetéis.", img: xaropesImg },
  { to: "/mixologia/gelo", label: "Gelo: de coadjuvante a estrela", desc: "O ingrediente mais subestimado do bar.", img: geloImg },
] as const;

export const Route = createFileRoute("/mixologia/")({
  head: () => ({
    meta: [
      { title: "Mixologia — Destilados & Coquetéis" },
      {
        name: "description",
        content: "Guia completo de mixologia e coquetelaria: história, técnicas, utensílios e ingredientes.",
      },
    ],
  }),
  component: MixologiaIndex,
});

function MixologiaIndex() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-12 space-y-10">
        <section className="text-center space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-primary">Aprenda</p>
          <h1 className="font-serif text-5xl md:text-6xl text-foreground">Mixologia</h1>
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
              className="group rounded-xl border border-border bg-card overflow-hidden hover:border-primary transition-colors"
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
      </main>
    </div>
  );
}
