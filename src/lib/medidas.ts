import { ehVolume, formatarMedida, mlParaOz, type Unidade } from "@/lib/unidades";

/** Unidade de exibição escolhida pelo usuário (só afeta volumes). */
export type UnidadeExibicao = "ml" | "oz" | "colher";

export const UNIDADES_EXIBICAO: { valor: UnidadeExibicao; rotulo: string }[] = [
  { valor: "ml", rotulo: "ml" },
  { valor: "oz", rotulo: "oz" },
  { valor: "colher", rotulo: "colheres" },
];

const ML_POR_COLHER_SOPA = 15;

const FRACOES: [number, string][] = [
  [0, ""],
  [0.25, "¼"],
  [0.5, "½"],
  [0.75, "¾"],
];

/** Arredonda para o quarto mais próximo e escreve com fração legível. */
function comFracao(valor: number, sufixoSingular: string, sufixoPlural: string): string {
  const quartos = Math.round(valor * 4) / 4;
  if (quartos <= 0) return `0 ${sufixoPlural}`;
  const inteiro = Math.floor(quartos);
  const resto = Math.round((quartos - inteiro) * 4) / 4;
  const fracao = FRACOES.find(([v]) => v === resto)?.[1] ?? "";
  const texto = inteiro > 0 ? `${inteiro}${fracao ? ` ${fracao}` : ""}` : fracao;
  const sufixo = quartos > 1 ? sufixoPlural : sufixoSingular;
  return `${texto} ${sufixo}`;
}

/**
 * Formata uma quantidade respeitando a unidade real do ingrediente e a
 * preferência de exibição. Só volumes (ml) mudam de unidade.
 */
export function formatarExibicao(
  valor: number,
  unidade: Unidade,
  exibicao: UnidadeExibicao,
): string {
  if (!ehVolume(unidade) || valor <= 0 || exibicao === "ml") return formatarMedida(valor, unidade);
  if (exibicao === "oz") return comFracao(mlParaOz(valor), "oz", "oz");
  return comFracao(valor / ML_POR_COLHER_SOPA, "colher de sopa", "colheres de sopa");
}
