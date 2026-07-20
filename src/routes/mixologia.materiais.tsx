import { createFileRoute } from "@tanstack/react-router";
import { MixImg, MixSection, MixologiaPage } from "@/components/mixologia-layout";
import shakerImg from "@/assets/mixologia/shaker.jpg";
import strainerImg from "@/assets/mixologia/strainer.jpg";
import colherImg from "@/assets/mixologia/colher.jpg";
import jiggerImg from "@/assets/mixologia/jigger.jpg";
import zesterImg from "@/assets/mixologia/zester.jpg";

export const Route = createFileRoute("/mixologia/materiais")({
  head: () => ({
    meta: [
      { title: "Materiais e utensílios — Mixologia" },
      {
        name: "description",
        content: "Coqueteleira, strainer, colher bailarina, jigger e demais utensílios do bartender.",
      },
    ],
  }),
  component: () => (
    <MixologiaPage
      title="Materiais e utensílios"
      subtitle="As ferramentas que transformam bebidas em coquetéis."
    >
      <p>
        Fazer um coquetel exige um pouco mais de esforço do que abrir e servir uma cerveja. O prazer
        na lida com os utensílios e na complexidade dos sabores resultantes, somado à admiração pela
        performance, aumenta o reconhecimento do trabalho do bartender.
      </p>

      <MixSection title="Coqueteleira (shaker)">
        <MixImg src={shakerImg} alt="Coqueteleira" />
        <p>
          Utilizada para bater ingredientes de densidades diferentes. É o instrumento mais icônico
          do bartender. Modelos <em>Boston</em>, <em>Cobbler</em> e <em>Parisiense</em> são os mais
          usados.
        </p>
      </MixSection>

      <MixSection title="Coador Hawthorne (strainer)">
        <MixImg src={strainerImg} alt="Strainer Hawthorne" />
        <p>
          Ferramenta para separar o gelo e o bagaço de frutas do restante do coquetel que irá ao
          copo. Composto por haste, corpo circular com mola que retém pedaços maiores e apoios nas
          extremidades que garantem fixação na borda do copo de preparação.
        </p>
      </MixSection>

      <MixSection title="Colher bailarina (colher de bar)">
        <MixImg src={colherImg} alt="Colher bailarina" />
        <p>
          Ótima para misturar coquetéis; alguns modelos servem também como colher de açúcar. Existem
          diversos formatos: cumbucas de tamanhos variados, comprimentos diferentes, corpo em
          espiral e pontas simples, com disco ou com tridente.
        </p>
      </MixSection>

      <MixSection title="Jigger, pá de gelo e pegador">
        <MixImg src={jiggerImg} alt="Jigger dosador" />
        <p>
          O <strong>jigger</strong> é o dosador do bartender: duas cavidades de volumes diferentes
          (geralmente 30 ml e 50 ml) para medir doses com precisão. A <strong>pá de gelo</strong> e
          o <strong>pegador</strong> mantêm o serviço higiênico, evitando o contato direto com o
          gelo.
        </p>
      </MixSection>

      <MixSection title="Descascador zester, biqueiras e utensílios auxiliares">
        <MixImg src={zesterImg} alt="Descascador zester e biqueiras free pour" />
        <p>
          O <strong>descascador zester</strong> é ideal para preparar raspas (zest) de limão e
          laranja. As <strong>biqueiras (free pour)</strong> são encaixadas no gargalo das garrafas
          para facilitar o controle da bebida despejada. Complementam a bancada a <strong>tábua de
          corte</strong>, o <strong>store and pour</strong> (para xaropes e sucos), o
          <strong> espremedor de frutas</strong> e o <strong>bar mat</strong> — o tapete de balcão
          que organiza e protege a superfície de trabalho.
        </p>
      </MixSection>
    </MixologiaPage>
  ),
});
