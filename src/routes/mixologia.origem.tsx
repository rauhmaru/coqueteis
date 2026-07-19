import { createFileRoute } from "@tanstack/react-router";
import { MixImg, MixImgRow, MixologiaPage } from "@/components/mixologia-layout";
import origemImg from "@/assets/mixologia/origem.jpg";
import tiposImg from "@/assets/mixologia/tipos.jpg";

export const Route = createFileRoute("/mixologia/origem")({
  head: () => ({
    meta: [
      { title: "Origem e história — Mixologia" },
      {
        name: "description",
        content: "Da Grécia Antiga aos speakeasies dos anos 1920 e à renascença dos drinks — a história do coquetel.",
      },
    ],
  }),
  component: () => (
    <MixologiaPage
      title="Origem e história"
      subtitle="Do vinho grego aos speakeasies da Lei Seca e à renascença dos drinks."
    >
      <MixImgRow>
        <MixImg src={origemImg} alt="Bar antigo com coquetéis" caption="Bar clássico" />
        <MixImg src={tiposImg} alt="Variedade de coquetéis" caption="Coquetelaria contemporânea" />
      </MixImgRow>

      <p>
        A mistura de bebidas alcoólicas com outros líquidos é feita desde a Grécia Antiga, quando se
        misturava água ou mel ao vinho. O termo <em>cocktail</em>, porém, só surgiu na Inglaterra em
        1798, para se referir a alguns tipos de bebidas. Pouco depois, jornais e revistas
        estadunidenses passaram a usá-lo para descrever misturas alcoólicas.
      </p>

      <p>
        Em 1806, Harry Croswell, do jornal <em>The Balance and Columbian Repository</em>, definiu
        cocktail como <em>“a stimulating liquor composed of any kind of sugar, water and bitters”</em>
        — um licor estimulante composto por qualquer tipo de açúcar, água e bitters. A partir daí, o
        conceito foi lapidado por diversos entusiastas.
      </p>

      <p>
        A verdadeira arte da coquetelaria começou a se desenvolver com Harry Johnson e, sobretudo,
        Jerry Thomas — o “professor” Thomas —, bartender americano que lançou por volta de 1860 o
        primeiro livro de receitas de drinks americano, no qual um coquetel era uma mistura contendo
        ao menos um licor.
      </p>

      <p>
        Durante a Lei Seca americana (1920–1933), os coquetéis se tornaram extremamente populares:
        misturar destilados a sucos, xaropes e açúcar mascarava a baixa qualidade das bebidas da
        época. Eram servidos nos <em>speakeasies</em>, bares ilegais, bem doces e preparados de forma
        desleixada para facilitar a ingestão rápida — o local podia ser invadido pelas autoridades a
        qualquer momento.
      </p>

      <p>
        Após uma decadência entre os anos 1960 e 1970, os drinks voltaram à popularidade nos anos
        1980 com a explosão da vodka. Dos anos 2000 até hoje vivemos a chamada renascença da
        cultura dos drinks, com resgate da mixologia e atenção aos detalhes. De 2015 para cá, o gin
        reapareceu com força — sofisticação aliada à baixa caloria, dizem os especialistas.
      </p>

      <p>
        O crescimento vertiginoso dos drinks se deve principalmente ao empenho e qualificação dos
        profissionais de bar. O bartender virou profissão — uma das mais procuradas da atualidade — e
        os estudos sobre montagem, misturas e apresentação atraem cada vez mais adeptos.
      </p>

      <blockquote className="border-l-2 border-primary pl-4 italic text-muted-foreground">
        Mixologia: arte de misturar bebidas e formular coquetéis respeitando o limite de equilíbrio
        dos componentes e a variação de álcool em cada receita. O conceito de degustar um drink e
        experimentar novas sensações é o legado dos mixólogos, que pesquisam novas técnicas e
        combinações para fazer história na coquetelaria.
      </blockquote>
    </MixologiaPage>
  ),
});
