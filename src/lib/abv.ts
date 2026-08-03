export type Componente = {
  id: string;
  nome: string;
  ml: number;
  abv: number;
};

export const MAX_ML = 2000;
export const MAX_ABV = 96;

/** ml de etanol puro em uma "dose padrão" (14 g de álcool / 0,789 g/ml) */
export const ML_ETANOL_POR_DOSE = 17.74;

export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

type Referencia = {
  /** termos (já sem acento, minúsculos) que identificam o ingrediente */
  termos: string[];
  abv: number;
  /** volume sugerido em ml quando pré-carregado de uma receita */
  ml: number;
};

/** Tabela de referência — do mais específico para o mais genérico. */
const REFERENCIAS: Referencia[] = [
  // destilados
  { termos: ["cachaca", "aguardente"], abv: 40, ml: 50 },
  { termos: ["vodka", "vodca"], abv: 40, ml: 50 },
  { termos: ["gin"], abv: 40, ml: 50 },
  { termos: ["tequila", "mezcal"], abv: 38, ml: 50 },
  { termos: ["rum branco", "rum escuro", "rum", "ron"], abv: 40, ml: 50 },
  { termos: ["whisky", "whiskey", "bourbon", "scotch", "rye"], abv: 40, ml: 50 },
  { termos: ["conhaque", "cognac", "brandy", "pisco", "grappa"], abv: 40, ml: 50 },
  { termos: ["absinto"], abv: 60, ml: 20 },
  { termos: ["sake", "saque"], abv: 15, ml: 60 },
  { termos: ["cerveja", "lager", "pilsen", "ipa", "stout", "chope"], abv: 5, ml: 200 },
  // fortificados e vinhos
  { termos: ["vermute", "vermouth", "martini rosso", "martini bianco"], abv: 16, ml: 30 },
  { termos: ["porto", "jerez", "sherry", "madeira", "marsala"], abv: 19, ml: 30 },
  { termos: ["espumante", "prosecco", "champagne", "champanhe", "cava"], abv: 12, ml: 100 },
  { termos: ["vinho tinto", "vinho branco", "vinho"], abv: 12, ml: 100 },
  { termos: ["sidra"], abv: 5, ml: 150 },
  // amargos, aperitivos e licores
  { termos: ["angostura", "bitter de", "bitters"], abv: 44, ml: 1 },
  { termos: ["campari", "aperol", "fernet", "amaro", "cynar"], abv: 22, ml: 30 },
  { termos: ["licor de cafe", "kahlua", "tia maria"], abv: 20, ml: 20 },
  { termos: ["cointreau", "triple sec", "curacao", "grand marnier"], abv: 38, ml: 20 },
  { termos: ["amaretto", "frangelico", "sambuca", "chartreuse", "benedictine"], abv: 28, ml: 20 },
  { termos: ["baileys", "licor cremoso", "creme de"], abv: 17, ml: 25 },
  { termos: ["licor"], abv: 22, ml: 20 },
  // sem álcool
  { termos: ["xarope", "syrup", "grenadine", "granadina", "orgeat", "mel", "acucar"], abv: 0, ml: 20 },
  { termos: ["suco", "juice", "polpa", "nectar"], abv: 0, ml: 60 },
  { termos: ["limao", "lima", "laranja", "abacaxi", "maracuja", "morango", "cranberry", "tomate"], abv: 0, ml: 30 },
  { termos: ["tonica", "tonic", "club soda", "soda", "agua com gas", "gasosa", "refrigerante", "cola", "ginger ale", "ginger beer"], abv: 0, ml: 120 },
  { termos: ["agua de coco", "leite de coco", "leite", "creme de leite", "cafe", "cha", "agua"], abv: 0, ml: 60 },
  { termos: ["clara de ovo", "ovo"], abv: 0, ml: 20 },
  { termos: ["hortela", "menta", "manjericao", "canela", "gengibre", "pepino", "cereja", "azeitona", "sal", "pimenta", "casca", "zest", "gelo"], abv: 0, ml: 0 },
];

/** Sugere teor alcoólico (%) e volume (ml) a partir do nome do ingrediente. */
export function sugerirIngrediente(nome: string): { abv: number; ml: number } {
  const n = normalizar(nome);
  for (const ref of REFERENCIAS) {
    if (ref.termos.some((t) => n.includes(t))) return { abv: ref.abv, ml: ref.ml };
  }
  return { abv: 0, ml: 30 };
}

export type ValidacaoNumero = { valor: number | null; erro: string | null };

/** Valida um campo numérico digitado, devolvendo mensagem amigável em pt-BR. */
export function validarNumero(
  bruto: string,
  opcoes: { min: number; max: number; rotulo: string; unidade?: string; obrigatorio?: boolean },
): ValidacaoNumero {
  const { min, max, rotulo, unidade = "", obrigatorio = true } = opcoes;
  const texto = bruto.trim().replace(",", ".");

  if (texto === "") {
    return obrigatorio
      ? { valor: null, erro: `Informe ${rotulo.toLowerCase()}.` }
      : { valor: min, erro: null };
  }
  if (!/^-?\d*\.?\d*$/.test(texto)) {
    return { valor: null, erro: `${rotulo}: use apenas números (ex.: 50).` };
  }
  const n = Number(texto);
  if (!Number.isFinite(n)) return { valor: null, erro: `${rotulo}: valor inválido.` };
  if (n < min) {
    return { valor: null, erro: `${rotulo} não pode ser menor que ${min}${unidade}.` };
  }
  if (n > max) {
    return { valor: null, erro: `${rotulo} não pode passar de ${max}${unidade}.` };
  }
  return { valor: n, erro: null };
}

export type ResultadoAbv = {

  volumeTotal: number;
  volumeBebidas: number;
  alcoolPuro: number;
  abv: number;
  doses: number;
};

const limitar = (valor: number, min: number, max: number) =>
  Number.isFinite(valor) ? Math.min(max, Math.max(min, valor)) : min;

/**
 * Calcula o ABV final de uma mistura.
 * @param diluicao fração de água adicionada pelo gelo (0 a 1) sobre o volume da mistura
 */
export function calcularAbv(componentes: Componente[], diluicao = 0): ResultadoAbv {
  const dil = limitar(diluicao, 0, 0.9);
  let volumeBebidas = 0;
  let alcoolPuro = 0;

  for (const c of componentes) {
    const ml = limitar(c.ml, 0, MAX_ML);
    const abv = limitar(c.abv, 0, MAX_ABV);
    volumeBebidas += ml;
    alcoolPuro += (ml * abv) / 100;
  }

  const volumeTotal = volumeBebidas * (1 + dil);
  const abv = volumeTotal > 0 ? (alcoolPuro / volumeTotal) * 100 : 0;

  return {
    volumeBebidas: arredondar(volumeBebidas),
    volumeTotal: arredondar(volumeTotal),
    alcoolPuro: arredondar(alcoolPuro),
    abv: arredondar(abv),
    doses: arredondar(alcoolPuro / ML_ETANOL_POR_DOSE, 2),
  };
}

function arredondar(valor: number, casas = 1): number {
  const f = 10 ** casas;
  return Math.round(valor * f) / f;
}

export type Faixa = {
  rotulo: string;
  descricao: string;
  classe: string;
};

export function classificarAbv(abv: number): Faixa {
  if (abv <= 0)
    return {
      rotulo: "Sem álcool",
      descricao: "Mocktail — pode ser servido a qualquer pessoa.",
      classe: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30",
    };
  if (abv < 10)
    return {
      rotulo: "Leve",
      descricao: "Teor próximo ao de uma cerveja. Ainda assim, beba com moderação.",
      classe: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30",
    };
  if (abv < 20)
    return {
      rotulo: "Moderado",
      descricao: "Teor próximo ao de um vinho. Alterne com água.",
      classe: "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30",
    };
  if (abv < 30)
    return {
      rotulo: "Forte",
      descricao: "Drink alcoólico forte. Beba devagar e coma antes.",
      classe: "bg-orange-500/15 text-orange-800 dark:text-orange-300 border-orange-500/30",
    };
  return {
    rotulo: "Muito forte",
    descricao: "Teor muito alto. Uma única unidade já equivale a várias doses.",
    classe: "bg-destructive/15 text-destructive border-destructive/40",
  };
}
