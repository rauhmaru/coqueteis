export type RGB = [number, number, number];

export type CartaTemplate = {
  id: string;
  nome: string;
  descricao: string;
  fundo: RGB;
  tinta: RGB;
  destaque: RGB;
  suave: RGB;
  linha: RGB;
  /** fonte dos títulos e nomes dos drinks */
  fonteTitulo: "times" | "helvetica";
  /** fonte dos textos de apoio */
  fonteCorpo: "times" | "helvetica";
  /** cores em CSS para a pré-visualização na tela */
  preview: { fundo: string; tinta: string; destaque: string };
};

export const CARTA_TEMPLATES: CartaTemplate[] = [
  {
    id: "ambar",
    nome: "Clássico Âmbar",
    descricao: "Creme e âmbar com títulos em serifa — visual de bar clássico.",
    fundo: [252, 248, 240],
    tinta: [28, 24, 20],
    destaque: [150, 96, 20],
    suave: [104, 92, 78],
    linha: [214, 202, 184],
    fonteTitulo: "times",
    fonteCorpo: "helvetica",
    preview: { fundo: "#fcf8f0", tinta: "#1c1814", destaque: "#966014" },
  },
  {
    id: "noite",
    nome: "Noite Speakeasy",
    descricao: "Fundo escuro com dourado e tipografia sem serifa.",
    fundo: [22, 20, 26],
    tinta: [244, 240, 234],
    destaque: [205, 164, 82],
    suave: [176, 168, 158],
    linha: [70, 64, 74],
    fonteTitulo: "helvetica",
    fonteCorpo: "helvetica",
    preview: { fundo: "#16141a", tinta: "#f4f0ea", destaque: "#cda452" },
  },
  {
    id: "botanico",
    nome: "Botânico",
    descricao: "Branco puro com verde profundo e serifa elegante.",
    fundo: [250, 251, 248],
    tinta: [24, 38, 30],
    destaque: [40, 104, 72],
    suave: [92, 108, 98],
    linha: [204, 216, 208],
    fonteTitulo: "times",
    fonteCorpo: "times",
    preview: { fundo: "#fafbf8", tinta: "#18261e", destaque: "#286848" },
  },
  {
    id: "coral",
    nome: "Tropical Coral",
    descricao: "Tons quentes de coral para festas e luaus.",
    fundo: [255, 247, 242],
    tinta: [46, 26, 24],
    destaque: [198, 74, 58],
    suave: [122, 96, 90],
    linha: [238, 210, 200],
    fonteTitulo: "helvetica",
    fonteCorpo: "helvetica",
    preview: { fundo: "#fff7f2", tinta: "#2e1a18", destaque: "#c64a3a" },
  },
];

export const QR_TAMANHOS = [
  { id: "p", nome: "Pequeno", mm: 18 },
  { id: "m", nome: "Médio", mm: 24 },
  { id: "g", nome: "Grande", mm: 32 },
] as const;

export type QrTamanhoId = (typeof QR_TAMANHOS)[number]["id"];

export function templatePorId(id: string | undefined): CartaTemplate {
  return CARTA_TEMPLATES.find((t) => t.id === id) ?? CARTA_TEMPLATES[0]!;
}

export function qrMm(id: string | undefined): number {
  return QR_TAMANHOS.find((q) => q.id === id)?.mm ?? 24;
}
