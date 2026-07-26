import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Baby, Car, GlassWater, HeartHandshake, Pill } from "lucide-react";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";

const titulo = "Consumo responsável — Destilados & Coquetéis";
const descricao =
  "Informações sobre consumo responsável de bebidas alcoólicas. O acesso ao catálogo é restrito a maiores de 18 anos.";

export const Route = createFileRoute("/consumo-responsavel")({
  head: () => ({
    meta: [
      { title: titulo },
      { name: "description", content: descricao },
      { property: "og:title", content: titulo },
      { property: "og:description", content: descricao },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ConsumoResponsavelPage,
});

function ConsumoResponsavelPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12 space-y-10">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-primary">Beba com moderação</p>
          <h1 className="font-serif text-4xl md:text-5xl text-foreground">Consumo responsável</h1>
          <p className="text-sm text-muted-foreground">
            O conteúdo do catálogo de coquetéis é destinado exclusivamente a pessoas com{" "}
            <strong>18 anos ou mais</strong>. Se você é menor de idade, este site não é para você —
            mas as orientações abaixo valem para todos.
          </p>
        </header>

        <Section icon={<AlertTriangle className="h-5 w-5" />} title="Venda proibida para menores de 18 anos">
          A venda e o consumo de bebidas alcoólicas por menores de 18 anos são proibidos por lei no
          Brasil. Nenhuma receita deste site deve ser preparada ou servida a menores.
        </Section>

        <Section icon={<Car className="h-5 w-5" />} title="Se beber, não dirija">
          Álcool afeta reflexos, julgamento e coordenação. Combine antes quem será o motorista da
          rodada, use transporte por aplicativo, táxi ou transporte público.
        </Section>

        <Section icon={<GlassWater className="h-5 w-5" />} title="Ritmo, água e comida">
          <ul className="list-disc pl-5 space-y-1">
            <li>Alterne cada drink com um copo de água.</li>
            <li>Nunca beba de estômago vazio: coma antes e durante.</li>
            <li>Respeite seu limite e evite &ldquo;doses de acompanhamento&rdquo;.</li>
            <li>Experimente as versões sem álcool — o catálogo tem uma categoria dedicada.</li>
          </ul>
        </Section>

        <Section icon={<Baby className="h-5 w-5" />} title="Gravidez e amamentação">
          Não existe quantidade segura de álcool durante a gestação ou a amamentação. Nesses
          períodos, o consumo deve ser zero.
        </Section>

        <Section icon={<Pill className="h-5 w-5" />} title="Medicamentos e condições de saúde">
          Álcool pode interagir com medicamentos e agravar condições de saúde. Em caso de dúvida,
          consulte um profissional de saúde antes de consumir.
        </Section>

        <Section icon={<HeartHandshake className="h-5 w-5" />} title="Quando pedir ajuda">
          <p>
            Beber para lidar com ansiedade, perder o controle da quantidade, esconder o consumo ou
            sentir necessidade diária são sinais de alerta. Procurar ajuda é um ato de cuidado.
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>
              <strong>CVV — 188</strong>: apoio emocional gratuito, 24 horas por dia.
            </li>
            <li>Unidades de saúde e CAPS (Centros de Atenção Psicossocial) do seu município.</li>
            <li>Grupos de apoio como Alcoólicos Anônimos e Al-Anon (familiares).</li>
          </ul>
        </Section>

        <div className="pt-4 flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link to="/">Voltar ao início</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-6 space-y-3">
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-secondary p-2 text-primary">{icon}</span>
        <h2 className="font-serif text-xl text-foreground">{title}</h2>
      </div>
      <div className="text-sm text-muted-foreground leading-relaxed">{children}</div>
    </section>
  );
}
