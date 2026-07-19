import { createFileRoute } from "@tanstack/react-router";
import { MixImg, MixImgRow, MixSection, MixologiaPage } from "@/components/mixologia-layout";
import fermentadasImg from "@/assets/mixologia/fermentadas.jpg";
import destiladasImg from "@/assets/mixologia/destiladas.jpg";
import infusionadasImg from "@/assets/mixologia/infusionadas.jpg";

export const Route = createFileRoute("/mixologia/bebidas")({
  head: () => ({
    meta: [
      { title: "Bebidas etílicas — Mixologia" },
      {
        name: "description",
        content: "Fermentadas, destiladas e infusionadas — as três grandes famílias do álcool.",
      },
    ],
  }),
  component: () => (
    <MixologiaPage
      title="Bebidas etílicas"
      subtitle="Fermentadas, destiladas e infusionadas — todas partem da fermentação alcoólica."
    >
      <p>
        As bebidas alcoólicas são divididas em <strong>fermentadas</strong>, <strong>destiladas</strong> e
        <strong> infusionadas</strong>. Todas elas possuem a mesma base de obtenção: a fermentação
        alcoólica.
      </p>

      <MixImgRow>
        <MixImg src={fermentadasImg} alt="Cerveja e vinho" caption="Fermentadas" />
        <MixImg src={destiladasImg} alt="Destilados" caption="Destiladas" />
        <MixImg src={infusionadasImg} alt="Bebida infusionada" caption="Infusionadas" />
      </MixImgRow>

      <MixSection title="Fermentadas">
        <p>
          Após o processo de fermentação já são envasadas para consumo, passando apenas por etapas
          de filtração e/ou maturação. É o caso da <strong>cerveja</strong>, do <strong>vinho</strong>,
          do <strong>hidromel</strong>, da <strong>kombucha</strong>, entre outras.
        </p>
      </MixSection>

      <MixSection title="Destiladas">
        <p>
          Após a fermentação, são destiladas em equipamento próprio para obter maior concentração de
          álcool por volume e sabores característicos. Podem ou não passar por maturação antes do
          consumo. É o caso da <strong>cachaça</strong>, <strong>vodka</strong>, <strong>whisky</strong>,
          <strong> gin</strong>, <strong>conhaque</strong>, <strong>rum</strong>, entre outras.
        </p>
      </MixSection>

      <MixSection title="Infusionadas">
        <p>
          Produzidas a partir da infusão de frutas, ervas, especiarias ou botânicos em uma bebida
          alcoólica base — geralmente um destilado. É o caso de muitos <strong>licores</strong>,
          <strong> vermutes</strong>, <strong>amargos</strong> e <strong>bitters</strong>. Aqui o
          álcool serve como veículo para extrair aromas, cor e sabor.
        </p>
      </MixSection>
    </MixologiaPage>
  ),
});
