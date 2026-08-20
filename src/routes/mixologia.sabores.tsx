import { createFileRoute } from "@tanstack/react-router";
import {
  MixImg,
  MixImgRow,
  MixSection,
  MixologiaNav,
  MixologiaPage,
} from "@/components/mixologia-layout";
import saboresImg from "@/assets/mixologia/sabores.jpg";


export const Route = createFileRoute("/mixologia/sabores")({
  head: () => ({
    meta: [
      { property: "og:url", content: "https://coqueteis.lovable.app/mixologia/sabores" },
      { title: "Balanço de sabores: como equilibrar um coquetel" },
      {
        name: "description",
        content:
          "Os cinco receptores gustativos, o papel do olfato e como equilibrar doce, azedo, amargo e a proporção entre ingredientes alcoólicos e não alcoólicos.",
      },
      { property: "og:title", content: "Balanço de sabores: como equilibrar um coquetel" },
      {
        property: "og:description",
        content:
          "Doce, salgado, ácido, amargo e umami: entenda o equilíbrio de sabores e as proporções que fazem um coquetel funcionar.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://coqueteis.lovable.app/mixologia/sabores" }],
  }),
  component: SaboresPage,
});

const proporcoes = [
  { ingrediente: "Johnnie Walker Black Label (destilado)", proporcao: "1/4 ~ 1/3", papel: "Alcoólico" },
  { ingrediente: "Ginger ale", proporcao: "2/3 ~ 3/4", papel: "Não alcoólico" },
  { ingrediente: "Xarope de frutas vermelhas", proporcao: "a gosto", papel: "Doce" },
  { ingrediente: "Suco de limão", proporcao: "a gosto", papel: "Azedo" },
];

function SaboresPage() {
  return (
    <MixologiaPage
      title="Balanço de sabores"
      subtitle="Um coquetel saboroso é, antes de tudo, um coquetel equilibrado."
    >
      <MixImgRow>
        <MixImg
          src={saboresImg}
          alt="Limões, cubo de açúcar, bitter e taça coupe sobre madeira escura"
          caption="Doce, azedo e amargo: os eixos do equilíbrio"
        />
      </MixImgRow>

      <MixSection title="Os cinco tipos de receptores gustativos">
        <p>
          O paladar é um dos nossos sentidos básicos e nos permite fazer uma análise química do que
          comemos e bebemos. Existem cinco tipos de receptores gustativos, cada um relacionado a
          grupos de substâncias químicas encontradas nos alimentos:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Doce</strong> — carboidratos, principalmente monossacarídeos e dissacarídeos.
          </li>
          <li>
            <strong>Salgado</strong> — sais de sódio e potássio.
          </li>
          <li>
            <strong>Ácido</strong> — ácidos orgânicos e inorgânicos.
          </li>
          <li>
            <strong>Amargo</strong> — alcaloides e muitos sais inorgânicos.
          </li>
          <li>
            <strong>Umami</strong> — ácido glutâmico.
          </li>
        </ul>
      </MixSection>

      <MixSection title="Equilíbrio na prática">
        <p>
          Para garantir que uma comida ou bebida esteja saborosa, precisamos encontrar um equilíbrio
          entre os diferentes sabores. Ao criar um coquetel, o foco deve estar no equilíbrio entre{" "}
          <strong>doce e azedo</strong> ou <strong>doce e amargo</strong>. Igualmente importante é o
          equilíbrio entre os ingredientes <strong>alcoólicos e não alcoólicos</strong>.
        </p>
      </MixSection>

      <MixSection title="O peso do olfato">
        <ul className="list-disc pl-6 space-y-2">
          <li>
            O paladar está intimamente ligado ao olfato: acredita-se que apenas <strong>10%</strong>{" "}
            da sensação geral de sabor venha das papilas gustativas (os cinco gostos básicos).
          </li>
          <li>
            O olfato responde pelos <strong>90%</strong> restantes. Nossas papilas gustativas são dez
            mil vezes menos sensíveis do que o nariz à concentração de moléculas químicas.
          </li>
        </ul>
      </MixSection>

      <MixSection title="Exemplo de proporções">
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[420px] text-sm">
            <caption className="sr-only">
              Exemplo de proporções e papéis dos ingredientes em um highball equilibrado
            </caption>
            <thead className="bg-secondary/60">
              <tr>
                <th scope="col" className="px-4 py-2 text-left font-semibold">Ingrediente</th>
                <th scope="col" className="px-4 py-2 text-left font-semibold">Proporção</th>
                <th scope="col" className="px-4 py-2 text-left font-semibold">Papel</th>
              </tr>
            </thead>
            <tbody>
              {proporcoes.map((p) => (
                <tr key={p.ingrediente} className="border-t border-border">
                  <td className="px-4 py-2">{p.ingrediente}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{p.proporcao}</td>
                  <td className="px-4 py-2 text-muted-foreground">{p.papel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Nesse tipo de construção, o destilado ocupa entre um quarto e um terço do copo, o
          componente não alcoólico completa o volume, e xarope e cítrico ajustam o eixo doce/azedo
          até o ponto de equilíbrio.
        </p>
      </MixSection>

      <MixologiaNav
        prev={{
          to: "/mixologia/tecnicas",
          label: "Técnicas de bartending",
        }}
      />
    </MixologiaPage>
  );
}

