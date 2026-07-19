import { createFileRoute } from "@tanstack/react-router";
import { MixImg, MixImgRow, MixSection, MixologiaPage } from "@/components/mixologia-layout";
import geloImg from "@/assets/mixologia/gelo.jpg";

export const Route = createFileRoute("/mixologia/gelo")({
  head: () => ({
    meta: [
      { title: "Gelo: de coadjuvante a estrela — Mixologia" },
      {
        name: "description",
        content: "O gelo dilui, resfria e transforma um coquetel — muito mais do que um simples acessório.",
      },
    ],
  }),
  component: () => (
    <MixologiaPage
      title="Gelo: de coadjuvante a estrela"
      subtitle="Talvez o ingrediente mais subestimado — e um dos mais importantes — do bar."
    >
      <MixImgRow>
        <MixImg src={geloImg} alt="Esfera de gelo cristalino em copo" caption="Esfera de gelo cristalino" />
      </MixImgRow>

      <p>
        Por muito tempo o gelo foi tratado apenas como acessório: algo que se joga no copo antes do
        drink. Na coquetelaria moderna, ele ganhou papel de protagonista. O gelo cumpre três
        funções essenciais em um coquetel: <strong>resfriar</strong>, <strong>diluir</strong> e
        <strong> apresentar</strong>.
      </p>

      <MixSection title="Formatos e usos">
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Cubos grandes:</strong> derretem mais devagar, resfriam sem diluir demais. Ideais
            para drinks servidos on the rocks, como Old Fashioned e Negroni.
          </li>
          <li>
            <strong>Esferas de gelo:</strong> a menor superfície de contato com o líquido faz a
            diluição ser ainda mais lenta. Bonitas e sofisticadas.
          </li>
          <li>
            <strong>Cubos pequenos e gelo picado:</strong> derretem rápido e resfriam
            intensamente — ótimos para batidos e long drinks refrescantes como Mojito e Caipirinha.
          </li>
          <li>
            <strong>Gelo triturado (crushed):</strong> essencial para drinks tiki e para o Mint
            Julep, promovendo diluição rápida e aparência frostada no copo.
          </li>
        </ul>
      </MixSection>

      <MixSection title="Qualidade do gelo">
        <p>
          Um bom gelo é <strong>transparente</strong>, <strong>duro</strong>, <strong>seco</strong> e
          <strong> sem odor</strong>. O gelo turvo denota impurezas dissolvidas e ar; o gelo molhado
          já começou a derreter e vai diluir demais o coquetel. Bartenders profissionais
          armazenam o gelo em recipientes isolados e usam pá exclusiva para manipulação.
        </p>
      </MixSection>

      <MixSection title="Diluição controlada">
        <p>
          A diluição é parte da receita. Ao mexer um Martini ou bater um Whisky Sour, uma pequena
          quantidade de água derretida integra os sabores e reduz a intensidade alcoólica. Por isso o
          tempo e o tipo de gelo são calculados: mais gelo e mexer por menos tempo é diferente de
          menos gelo e mexer por mais tempo — mesmo que ambos resultem em uma bebida gelada, a
          textura e o sabor final são distintos.
        </p>
      </MixSection>
    </MixologiaPage>
  ),
});
