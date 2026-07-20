import { createFileRoute } from "@tanstack/react-router";
import { MixImg, MixSection, MixologiaPage } from "@/components/mixologia-layout";
import highballImg from "@/assets/mixologia/highball.jpg";
import martiniImg from "@/assets/mixologia/martini.jpg";
import oldFashionedImg from "@/assets/mixologia/old-fashioned.jpg";
import copperMugImg from "@/assets/mixologia/copper-mug.jpg";
import outrosCoposImg from "@/assets/mixologia/outros-copos.jpg";

export const Route = createFileRoute("/mixologia/copos")({
  head: () => ({
    meta: [
      { title: "Copos e taças — Mixologia" },
      {
        name: "description",
        content: "Highball, martini, old fashioned, canecas e demais copos usados na coquetelaria.",
      },
    ],
  }),
  component: () => (
    <MixologiaPage
      title="Copos e taças"
      subtitle="Cada drink pede um copo — a escolha certa realça sabor e apresentação."
    >
      <MixSection title="Highball">
        <MixImg src={highballImg} alt="Copo highball" />
        <p>
          Copo alto e estreito, usado majoritariamente para bebidas com ingredientes gasosos. É o
          copo ideal para Gin Tônica, Cuba Libre e Mojito, mas também para bebidas não gasosas como
          Tequila Sunrise e Bloody Mary.
        </p>
      </MixSection>

      <MixSection title="Taça martini (coquetel)">
        <MixImg src={martiniImg} alt="Taça martini" />
        <p>
          Taça de haste longa e formato triangular, usada para servir coquetéis sem gelo — como o
          próprio Martini, Cosmopolitan e Manhattan. A haste evita que a mão aqueça a bebida.
        </p>
      </MixSection>

      <MixSection title="Old fashioned (rocks)">
        <MixImg src={oldFashionedImg} alt="Copo old fashioned" />
        <p>
          Baixo e largo, com fundo pesado. Serve para drinks servidos com gelo, como o próprio Old
          Fashioned, Negroni e Whisky on the rocks. Também é usado como copo de preparação de
          coquetéis montados.
        </p>
      </MixSection>

      <MixSection title="Canecas">
        <MixImg src={copperMugImg} alt="Caneca de cobre" />
        <p>
          Podem ser de metal, louça ou vidro, com alça na lateral. As de cobre são icônicas para o
          Moscow Mule — o metal mantém a temperatura gelada. As de vidro são usadas para o Irish
          Coffee e para ponches quentes.
        </p>
      </MixSection>

      <MixSection title="Outros copos importantes">
        <MixImg src={outrosCoposImg} alt="Flûte, taça de vinho, tulipa, hurricane e shot" />
        <p>
          Complementam o bar as taças <strong>flûte</strong> (espumantes e French 75), a <strong>
          taça de vinho</strong> (Spritz), o <strong>copo tulipa</strong> (cervejas artesanais), o
          <strong> hurricane</strong> (drinks tropicais como Piña Colada) e o <strong>shot</strong> —
          o pequeno copo para doses únicas.
        </p>
      </MixSection>
    </MixologiaPage>
  ),
});
