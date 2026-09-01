import { normalizar, sugerirIngrediente } from "@/lib/abv";

/** Unidades aceitas no vínculo receita ↔ ingrediente (coluna drink_ingredientes.unidade). */
export type Unidade =
  | "ml"
  | "g"
  | "unidade"
  | "colher_cha"
  | "colher_sopa"
  | "fatia"
  | "folha"
  | "dash"
  | "a_gosto";

export const UNIDADES: Unidade[] = [
  "ml",
  "g",
  "unidade",
  "colher_cha",
  "colher_sopa",
  "fatia",
  "folha",
  "dash",
  "a_gosto",
];

/** Rótulos em pt-BR: singular, plural e forma curta para tabelas. */
export const UNIDADE_LABEL: Record<Unidade, { singular: string; plural: string; curto: string }> = {
  ml: { singular: "ml", plural: "ml", curto: "ml" },
  g: { singular: "g", plural: "g", curto: "g" },
  unidade: { singular: "unidade", plural: "unidades", curto: "un" },
  colher_cha: { singular: "colher de chá", plural: "colheres de chá", curto: "col. chá" },
  colher_sopa: { singular: "colher de sopa", plural: "colheres de sopa", curto: "col. sopa" },
  fatia: { singular: "fatia", plural: "fatias", curto: "fatia" },
  folha: { singular: "folha", plural: "folhas", curto: "folha" },
  dash: { singular: "dash", plural: "dashes", curto: "dash" },
  a_gosto: { singular: "a gosto", plural: "a gosto", curto: "a gosto" },
};

/** Somente `ml` é volume — o resto nunca deve ser somado em litros nem convertido em oz. */
export function ehVolume(unidade: Unidade): boolean {
  return unidade === "ml";
}

export function normalizarUnidade(valor: string | null | undefined): Unidade {
  const v = (valor ?? "").trim();
  return (UNIDADES as string[]).includes(v) ? (v as Unidade) : "ml";
}

const ML_POR_OZ = 29.5735;

/** Converte ml → oz. Use apenas para unidades de volume (ver `ehVolume`). */
export function mlParaOz(ml: number): number {
  return ml / ML_POR_OZ;
}

/**
 * Medida em oz para exibição secundária. Unidades que não são volume
 * (g, folhas, fatias, dashes…) ficam intactas e devolvem null.
 */
export function medidaEmOz(valor: number, unidade: Unidade): string | null {
  if (!ehVolume(unidade) || valor <= 0) return null;
  const oz = mlParaOz(valor);
  return `${oz.toFixed(oz >= 10 ? 1 : 2).replace(".", ",")} oz`;
}

const SOLIDOS_PITADA = ["sal", "pimenta", "noz-moscada", "noz moscada", "lavanda", "especiaria"];

/**
 * Quantidade padrão de UMA receita para o ingrediente, respeitando a unidade.
 * Volume vem da tabela de referência da calculadora de ABV; as demais unidades
 * usam medidas clássicas de coquetelaria (folhas de hortelã, fatias, dashes…).
 */
export function quantidadePadrao(nome: string, unidade: Unidade): number {
  const n = normalizar(nome);
  switch (unidade) {
    case "ml":
      return sugerirIngrediente(nome).ml;
    case "g":
      if (SOLIDOS_PITADA.some((t) => n.includes(normalizar(t)))) return 2;
      if (n.includes("acucar")) return 15;
      if (n.includes("fruta") || n.includes("pure") || n.includes("iogurte")) return 40;
      return 20;
    case "colher_cha":
      return 1;
    case "colher_sopa":
      return 1;
    case "unidade":
      return 1;
    case "fatia":
      return 1;
    case "folha":
      return 6;
    case "dash":
      return 2;
    case "a_gosto":
    default:
      return 0;
  }
}

const numero = (v: number) => {
  const arred = Math.round(v * 10) / 10;
  return Number.isInteger(arred) ? String(arred) : arred.toFixed(1).replace(".", ",");
};

/**
 * Formata uma quantidade já escalada respeitando a unidade.
 * Volume acima de 1 L vira litros; as outras unidades pluralizam o rótulo.
 */
export function formatarMedida(valor: number, unidade: Unidade): string {
  if (unidade === "a_gosto" || valor <= 0) return "a gosto";
  if (ehVolume(unidade)) {
    if (valor < 1000) return `${Math.round(valor)} ml`;
    const litros = valor / 1000;
    return `${litros.toFixed(litros >= 10 ? 1 : 2).replace(".", ",")} L`;
  }
  const label = UNIDADE_LABEL[unidade];
  if (unidade === "g") return `${numero(valor)} g`;
  return `${numero(valor)} ${valor > 1 ? label.plural : label.singular}`;
}
