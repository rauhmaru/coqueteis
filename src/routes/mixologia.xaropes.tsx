import { createFileRoute } from "@tanstack/react-router";
import { MixImg, MixImgRow, MixSection, MixologiaPage } from "@/components/mixologia-layout";
import xaropesImg from "@/assets/mixologia/xaropes.jpg";
import bittersImg from "@/assets/mixologia/bitters.jpg";

export const Route = createFileRoute("/mixologia/xaropes")({
  head: () => ({
    meta: [
      { title: "Xaropes e bitters — Mixologia" },
      {
        name: "description",
        content: "Xaropes trazem cor e doçura; bitters trazem complexidade — os temperos do bartender.",
      },
    ],
  }),
  component: () => (
    <MixologiaPage
      title="Xaropes e bitters"
      subtitle="Cor, doçura e complexidade — o coração de muitos coquetéis."
    >
      <MixImgRow>
        <MixImg src={xaropesImg} alt="Xaropes coloridos" caption="Xaropes" />
        <MixImg src={bittersImg} alt="Angostura bitters" caption="Bitters" />
      </MixImgRow>

      <MixSection title="Xaropes">
        <p>
          Para dar um toque de cor e sabor especial aos coquetéis, nada melhor do que os xaropes.
          Feitos de diversas frutas e especiarias, são usados na coquetelaria, no café e na
          culinária. Combinam com o paladar brasileiro, que geralmente busca algo adocicado e
          frutado.
        </p>
        <p>
          A substituição do açúcar granulado pelo xarope já é comum devido à praticidade e a alguns
          benefícios:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>precisão de medidas e padronização;</li>
          <li>não decanta — drink mais uniforme;</li>
          <li>textura suave;</li>
          <li>facilita a limpeza do copo;</li>
          <li>mais higiênico;</li>
        </ul>
        <p>
          É possível encontrar xaropes industrializados de várias marcas, volumes e sabores — ou
          produzir os próprios a partir de açúcar, água e fonte de calor (com menor durabilidade).
        </p>
      </MixSection>

      <MixSection title="Bitters">
        <p>
          Os bitters são infusões alcoólicas concentradas, amargas e aromáticas — usados em gotas
          para adicionar complexidade aos coquetéis. Os mais famosos e usados pelos bartenders são o
          <strong> Angostura</strong>, o <strong>Peychaud's</strong>, o <strong>Campari</strong> e os
          bitters de laranja.
        </p>
        <p>
          Exemplos clássicos de drinks que levam bitters são o <strong>Manhattan</strong> e o
          <strong> Martini</strong>. Os bitters proporcionam experiências sensoriais variadas em um
          único drink — o seu uso é para a coquetelaria o que os temperos são para a culinária.
        </p>
      </MixSection>
    </MixologiaPage>
  ),
});
