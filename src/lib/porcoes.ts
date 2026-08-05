import { normalizar, sugerirIngrediente } from "@/lib/abv";

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

export type PorcaoIngrediente = {
  nome: string;
  /** ml de uma única receita */
  mlUnitario: number;
  /** ml no total (todas as porções) */
  mlTotal: number;
  /** quantidade formatada (ml ou L) */
  quantidade: string;
  embalagem: string;
  garrafas: number | null;
};

export function formatarVolume(ml: number): string {
  if (ml <= 0) return "a gosto";
  if (ml < 1000) return `${Math.round(ml)} ml`;
  const litros = ml / 1000;
  return `${litros.toFixed(litros >= 10 ? 1 : 2).replace(".", ",")} L`;
}

/** Escala uma receita para N porções e sugere quantas embalagens comprar. */
export function calcularPorcoes(
  ingredientes: string[],
  porcoes: number,
): { itens: PorcaoIngrediente[]; volumeTotalMl: number } {
  const n = Math.max(0, Math.floor(porcoes));
  const itens = ingredientes.map((nome) => {
    const mlUnitario = sugerirIngrediente(nome).ml;
    const mlTotal = mlUnitario * n;
    const emb = embalagemSugerida(nome);
    return {
      nome,
      mlUnitario,
      mlTotal,
      quantidade: formatarVolume(mlTotal),
      embalagem: emb.rotulo,
      garrafas: mlTotal > 0 ? Math.ceil(mlTotal / emb.ml) : null,
    };
  });
  const volumeTotalMl = itens.reduce((s, i) => s + i.mlTotal, 0);
  return { itens, volumeTotalMl };
}
