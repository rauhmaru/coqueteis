import { createFileRoute } from "@tanstack/react-router";
import {
  MixImg,
  MixImgRow,
  MixSection,
  MixologiaPage,
} from "@/components/mixologia-layout";
import tecnicasImg from "@/assets/mixologia/tecnicas.jpg";


export const Route = createFileRoute("/mixologia/tecnicas")({
  head: () => ({
    meta: [
      { property: "og:url", content: "https://coqueteis.lovable.app/mixologia/tecnicas" },
      { title: "Técnicas de bartending: shake, stir, swizzle, throw e roll" },
      {
        name: "description",
        content:
          "Guia das principais técnicas de bartending — shake, dry shake, stir, swizzle, throw e roll — com dicas práticas para acertar diluição, textura e temperatura.",
      },
      {
        property: "og:title",
        content: "Técnicas de bartending: shake, stir, swizzle, throw e roll",
      },
      {
        property: "og:description",
        content:
          "Como e quando usar shake, dry shake, stir, swizzle, throw e roll para equilibrar diluição, aeração e temperatura dos coquetéis.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://coqueteis.lovable.app/mixologia/tecnicas" }],
  }),
  component: TecnicasPage,
});

function TecnicasPage() {
  return (
    <MixologiaPage
      title="Técnicas de bartending"
      subtitle="A escolha da técnica depende dos ingredientes: densidade, facilidade de mistura e o quanto de aeração e diluição o drink pede."
    >
      <MixImgRow>
        <MixImg
          src={tecnicasImg}
          alt="Mãos de bartender agitando uma coqueteleira de cobre"
          caption="O shake é a técnica mais reconhecível do bar"
        />
      </MixImgRow>

      <p>
        A arte do bartending envolve algumas técnicas básicas, e sua seleção depende das
        características dos ingredientes de cada fórmula. As cinco mais populares são{" "}
        <strong>shaking</strong>, <strong>stirring</strong>, <strong>swizzling</strong>,{" "}
        <strong>throwing</strong> e <strong>rolling</strong>.
      </p>

      <MixSection title="O shake (com gelo)">
        <p>
          O shake é usado para combinar ingredientes de densidades diferentes, como um destilado
          base com suco cítrico ou purê de frutas espesso. Agitar ajuda a <strong>aerar</strong>,{" "}
          <strong>resfriar</strong> e <strong>diluir</strong> o coquetel, quebrando os cubos de gelo
          dentro da coqueteleira. O resultado é uma bebida bem integrada, aerada e mais palatável, com
          a intensidade alcoólica atenuada.
        </p>
        <p>
          Depois de despejar os ingredientes em uma das partes da coqueteleira, adicione gelo, feche
          e agite vigorosamente para cima e para baixo, com o máximo de força possível. A camada de
          gelo formada na parte externa da coqueteleira indica que o drink está pronto para ser
          servido.
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Certifique-se de que a coqueteleira esteja bem fechada.</li>
          <li>
            Segure a coqueteleira firmemente, com o copo pequeno virado para baixo em sua direção, e
            agite com movimentos longos e firmes.
          </li>
          <li>Ajuste o tempo de agitação conforme os ingredientes, o peso e a temperatura do gelo.</li>
          <li>Ao servir, coe todos os pequenos pedaços de gelo quebrado.</li>
        </ul>
      </MixSection>

      <MixSection title="O dry shake">
        <p>
          O <em>dry shake</em> é a agitação dos ingredientes na coqueteleira <strong>sem gelo</strong>
          . Qualquer receita com ovo ou substituto de ovo pede dry shake: isso quebra as proteínas da
          clara e acrescenta uma textura espumosa e "fofa" à mistura.
        </p>
        <p>
          Agite todos os ingredientes com a clara (sem gelo) por pelo menos 30 segundos até obter
          espuma. Com a textura desejada, adicione gelo, agite novamente e então coe e sirva.
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Quanto mais tempo e mais forte você agitar sem gelo, mais rígida será a espuma.</li>
          <li>Depois de agitar com clara de ovo, lave bem a coqueteleira e o jigger.</li>
        </ul>
      </MixSection>

      <MixSection title="O stir">
        <p>
          O <em>stirring</em> é indicado para coquetéis com ingredientes de densidade semelhante —
          por exemplo, apenas destilados e licores. Ele cria a quantidade perfeita de diluição e
          resfriamento sem aerar a bebida. Despeje os ingredientes em um copo misturador previamente
          resfriado com gelo fresco, deslize a colher de bar pelo interior do copo e mexa por até 30
          segundos, controlando o grau de diluição. Coe e sirva no copo gelado de sua preferência.
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Mexa com movimentos suaves e contínuos, com o mínimo de ruído de batida.</li>
          <li>
            Despeje o coquetel do copo misturador para o copo de serviço na menor altura possível,
            para evitar aeração.
          </li>
          <li>
            O tempo de stir afeta diretamente o sabor: curto demais, o drink fica pouco gelado e com
            sabor muito forte; longo demais, fica diluído e sem graça.
          </li>
        </ul>
      </MixSection>

      <MixSection title="O swizzle (com gelo)">
        <p>
          O swizzle é uma técnica de mistura direta no copo, com um bastão de swizzle, que permite
          combinar ingredientes de diferentes densidades usando gelo picado.
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Ao fazer o swizzle com gelo, use movimentos para cima e para baixo.</li>
          <li>Tome cuidado: a extremidade dura do bastão pode danificar o vidro.</li>
          <li>Evite derramar gelo durante o movimento.</li>
        </ul>
      </MixSection>

      <MixSection title="O throw">
        <p>
          "Jogando" o coquetel, obtemos uma mistura bem gelada e aerada mantendo a diluição baixa.
          Uma vantagem é poder usar uma bebida gaseificada na mistura. Despeje os ingredientes no
          copo menor da coqueteleira e o gelo no copo maior, mantendo-o no lugar com uma peneira.
          Depois, transfira a bebida de um copo para o outro, com a maior distância possível entre
          eles para aerar a mistura.
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Coloque gelo suficiente no copo grande para apoiar o coador contra ele.</li>
          <li>
            Escolha o número de lançamentos conforme o perfil de sabor do drink: lançamento mais
            longo = maior diluição.
          </li>
          <li>Segure o copo pequeno em um ângulo para evitar derramar a bebida.</li>
        </ul>
      </MixSection>

      <MixSection title="O roll">
        <p>
          O roll é uma versão mais suave do throw: consiste em despejar todo o conteúdo de um copo
          para outro cheio de gelo, evitando aeração excessiva. O objetivo é aerar suavemente o
          coquetel enquanto ele é resfriado e diluído ao mesmo tempo.
        </p>
      </MixSection>

    </MixologiaPage>
  );
}

