import { createFileRoute } from "@tanstack/react-router";
import { MixImg, MixImgRow, MixSection, MixologiaPage } from "@/components/mixologia-layout";
import tiposImg from "@/assets/mixologia/tipos.jpg";
import shakerImg from "@/assets/mixologia/shaker.jpg";
import highballImg from "@/assets/mixologia/highball.jpg";

export const Route = createFileRoute("/mixologia/tipos")({
  head: () => ({
    meta: [
      { title: "Tipos de coquetéis — Mixologia" },
      {
        name: "description",
        content: "Classificação dos coquetéis por método de preparo, volume, tipo de bebida e finalidade.",
      },
    ],
  }),
  component: () => (
    <MixologiaPage
      title="Tipos de coquetéis"
      subtitle="Classificação por método, volume, tipo de bebida e finalidade."
    >
      <MixImgRow>
        <MixImg src={tiposImg} alt="Vários coquetéis" caption="Variedade de estilos" />
      </MixImgRow>

      <p>
        A coquetelaria está em constante evolução. Ainda assim, os drinks podem ser classificados
        pelo <strong>método de preparo</strong>, <strong>volume</strong>, <strong>tipo de bebida</strong> e
        <strong> finalidade</strong>.
      </p>

      <MixSection title="Método de preparo">
        <MixImgRow>
          <MixImg src={shakerImg} alt="Coqueteleira" caption="Batidos na coqueteleira" />
        </MixImgRow>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Batidos:</strong> preparados na coqueteleira ou no liquidificador. Usam
            ingredientes de densidades diferentes que não se misturam facilmente — destilados,
            sucos, licores, cremes, açúcar.
          </li>
          <li>
            <strong>Mexidos:</strong> preparados no <em>mixing glass</em>. Usam bebidas com
            densidades semelhantes, geralmente à base de destilados, quase sempre sem açúcar,
            sucos, xaropes, ovo ou creme.
          </li>
          <li>
            <strong>Montados:</strong> preparados diretamente no copo em que serão servidos, com
            bebidas de igual densidade que se misturam facilmente.
          </li>
        </ul>
      </MixSection>

      <MixSection title="Volume e tipo de bebida">
        <MixImgRow>
          <MixImg src={highballImg} alt="Copo highball" caption="Long drink em highball" />
        </MixImgRow>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Short drink:</strong> duas ou mais bebidas, volume médio de 50 ml, servidos em
            copo old fashioned ou taça de coquetel.
          </li>
          <li>
            <strong>Long drink:</strong> destilados, licores e bitters completados com sucos, água
            gaseificada, refrigerantes e bastante gelo, em copos highball.
          </li>
          <li>
            <strong>Hot drinks:</strong> à base de chocolate, café ou água quente, servidos no
            inverno em canecas.
          </li>
          <li>
            <strong>Frozen drinks:</strong> preparados no liquidificador com destilados, licores,
            gelo, sorvete, bolachas ou leite condensado — textura cremosa e lisa.
          </li>
        </ul>
      </MixSection>

      <MixSection title="Finalidade">
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Estimulantes do apetite:</strong> amargos ou ácidos, servidos antes das
            refeições, à base de destilados, bitters, vermutes e licores.
          </li>
          <li>
            <strong>Digestivos:</strong> auxiliam a digestão pelo grau alcoólico; servidos após as
            refeições, com licores, destilados, cremes e bastante açúcar.
          </li>
          <li>
            <strong>Nutritivos:</strong> completam valores calóricos — vinhos, aperitivos, ovos,
            cremes e frutas.
          </li>
          <li>
            <strong>Refrescantes:</strong> fora do horário das refeições, com destilados, licores,
            bitters, sucos, água gaseificada, refrigerantes e muito gelo.
          </li>
          <li>
            <strong>Estimulantes físicos:</strong> coquetéis quentes para climas frios, com
            destilados, água ou café quente e condimentos.
          </li>
        </ul>
      </MixSection>
    </MixologiaPage>
  ),
});
