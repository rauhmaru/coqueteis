import { normalizar } from "@/lib/abv";
import {
  ehVolume,
  formatarMedida,
  normalizarUnidade,
  quantidadePadrao,
  type Unidade,
} from "@/lib/unidades";

export const MAX_CONVIDADOS = 500;
export const MAX_DRINKS_POR_CONVIDADO = 10;

export type EmbalagemRef = {
  termos: string[];
  /** volume da embalagem comercial mais comum, em ml */
  ml: number;
  rotulo: string;
};

/** Embalagens comerciais típicas no Brasil — do mais específico ao genérico. */
const EMBALAGENS: EmbalagemRef[] = [
  { termos: ["angostura", "bitter de", "bitters"], ml: 200, rotulo: "frasco 200 ml" },
  { termos: ["cerveja", "lager", "pilsen", "ipa", "stout", "chope"], ml: 600, rotulo: "garrafa 600 ml" },
  { termos: ["espumante", "prosecco", "champagne", "champanhe", "cava", "vinho"], ml: 750, rotulo: "garrafa 750 ml" },
  { termos: ["vermute", "vermouth", "porto", "jerez", "sherry", "madeira", "marsala"], ml: 750, rotulo: "garrafa 750 ml" },
  { termos: ["licor", "cointreau", "triple sec", "curacao", "grand marnier", "amaretto", "frangelico", "sambuca", "chartreuse", "benedictine", "campari", "aperol", "fernet", "amaro", "cynar", "kahlua", "baileys"], ml: 700, rotulo: "garrafa 700 ml" },
  { termos: ["cachaca", "aguardente", "vodka", "vodca", "gin", "tequila", "mezcal", "rum", "ron", "whisky", "whiskey", "bourbon", "conhaque", "cognac", "brandy", "pisco", "sake", "saque"], ml: 750, rotulo: "garrafa 750 ml" },
  { termos: ["tonica", "tonic", "club soda", "soda", "agua com gas", "gasosa", "refrigerante", "cola", "ginger ale", "ginger beer"], ml: 2000, rotulo: "garrafa 2 L" },
  { termos: ["suco", "juice", "nectar", "agua de coco", "leite", "cafe", "cha", "agua"], ml: 1000, rotulo: "caixa/garrafa 1 L" },
  { termos: ["xarope", "syrup", "grenadine", "granadina", "orgeat", "mel"], ml: 500, rotulo: "frasco 500 ml" },
  { termos: ["polpa"], ml: 500, rotulo: "pacote 500 ml" },
];

/** Embalagem comercial sugerida para o ingrediente (ml + rótulo amigável). */
export function embalagemSugerida(nome: string): { ml: number; rotulo: string } {
  const n = normalizar(nome);
  for (const e of EMBALAGENS) {
    if (e.termos.some((t) => n.includes(t))) return { ml: e.ml, rotulo: e.rotulo };
  }
  return { ml: 1000, rotulo: "embalagem 1 L" };
}

/** Embalagem para sólidos vendidos em peso. */
function embalagemPeso(nome: string): { qtd: number; rotulo: string } {
  const n = normalizar(nome);
  if (n.includes("acucar")) return { qtd: 1000, rotulo: "pacote 1 kg" };
  return { qtd: 100, rotulo: "pacote 100 g" };
}

export type ItemReceita = { nome: string; unidade?: string | null };

const comoItem = (i: string | ItemReceita): ItemReceita => (typeof i === "string" ? { nome: i } : i);

export type PorcaoIngrediente = {
  nome: string;
  unidade: Unidade;
  /** quantidade de uma única receita, na unidade do ingrediente */
  quantidadeUnitaria: number;
  /** quantidade somada de todas as porções, na unidade do ingrediente */
  quantidadeTotal: number;
  /** quantidade de uma receita já formatada (ex.: "20 g", "6 folhas") */
  unitario: string;
  /** quantidade total já formatada */
  quantidade: string;
  /** ml no total — 0 quando o ingrediente não é volume */
  mlTotal: number;
  embalagem: string;
  garrafas: number | null;
};

/** Formata volume em ml/L. Use somente com quantidades de volume. */
export function formatarVolume(ml: number): string {
  return formatarMedida(ml, "ml");
}

function montarItem(item: ItemReceita, porcoes: number, totalOverride?: number): PorcaoIngrediente {
  const unidade = normalizarUnidade(item.unidade);
  const unitaria = quantidadePadrao(item.nome, unidade);
  const total = totalOverride ?? unitaria * porcoes;
  const volume = ehVolume(unidade);

  let embalagem: string;
  let garrafas: number | null = null;
  if (volume) {
    const emb = embalagemSugerida(item.nome);
    embalagem = emb.rotulo;
    garrafas = total > 0 ? Math.ceil(total / emb.ml) : null;
  } else if (unidade === "g") {
    const emb = embalagemPeso(item.nome);
    embalagem = emb.rotulo;
    garrafas = total > 0 ? Math.ceil(total / emb.qtd) : null;
  } else {
    embalagem = formatarMedida(total, unidade);
    garrafas = null;
  }

  return {
    nome: item.nome,
    unidade,
    quantidadeUnitaria: unitaria,
    quantidadeTotal: total,
    unitario: formatarMedida(unitaria, unidade),
    quantidade: formatarMedida(total, unidade),
    mlTotal: volume ? total : 0,
    embalagem,
    garrafas,
  };
}

/** Escala uma receita para N porções e sugere quanto comprar de cada item. */
export function calcularPorcoes(
  ingredientes: (string | ItemReceita)[],
  porcoes: number,
): { itens: PorcaoIngrediente[]; volumeTotalMl: number } {
  const n = Math.max(0, Math.floor(porcoes));
  const itens = ingredientes.map((i) => montarItem(comoItem(i), n));
  return { itens, volumeTotalMl: itens.reduce((s, i) => s + i.mlTotal, 0) };
}

/** Soma as necessidades de várias receitas para montar a lista de compras da festa. */
export function calcularListaCompras(
  receitas: { ingredientes: (string | ItemReceita)[] }[],
  porcoesPorReceita: number,
): { itens: PorcaoIngrediente[]; volumeTotalMl: number } {
  const n = Math.max(0, Math.floor(porcoesPorReceita));
  const mapa = new Map<string, { item: ItemReceita; total: number }>();
  for (const r of receitas) {
    for (const bruto of r.ingredientes) {
      const item = comoItem(bruto);
      const unidade = normalizarUnidade(item.unidade);
      const chave = `${item.nome}__${unidade}`;
      const qtd = quantidadePadrao(item.nome, unidade) * n;
      const atual = mapa.get(chave);
      if (atual) atual.total += qtd;
      else mapa.set(chave, { item: { nome: item.nome, unidade }, total: qtd });
    }
  }
  const itens = [...mapa.values()]
    .sort((a, b) => b.total - a.total || a.item.nome.localeCompare(b.item.nome))
    .map(({ item, total }) => montarItem(item, n, total));
  return { itens, volumeTotalMl: itens.reduce((s, i) => s + i.mlTotal, 0) };
}
