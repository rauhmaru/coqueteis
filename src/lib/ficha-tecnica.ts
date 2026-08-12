export const METODOS_PREPARO = [
  "shake",
  "stir",
  "build",
  "muddle",
  "blend",
  "layer",
  "cook",
] as const;

export type MetodoPreparo = (typeof METODOS_PREPARO)[number];

export const METODO_LABEL: Record<MetodoPreparo, string> = {
  shake: "Shake (batido)",
  stir: "Stir (mexido)",
  build: "Build (montado no copo)",
  muddle: "Muddle (macerado)",
  blend: "Blend (liquidificado)",
  layer: "Layer (em camadas)",
  cook: "Cook (cozido)",
};

export function metodoLabel(value?: string | null): string | null {
  if (!value) return null;
  return METODO_LABEL[value as MetodoPreparo] ?? value;
}

export type Passo = { ordem: number; texto: string };

/** Normaliza o campo `passos` (jsonb) em uma lista ordenada e segura. */
export function normalizarPassos(raw: unknown, fallback?: string | null): Passo[] {
  if (Array.isArray(raw)) {
    const passos = raw
      .map((p, i) => {
        const obj = (p ?? {}) as { ordem?: unknown; texto?: unknown };
        const texto = typeof obj.texto === "string" ? obj.texto.trim() : "";
        const ordem = typeof obj.ordem === "number" ? obj.ordem : i + 1;
        return { ordem, texto };
      })
      .filter((p) => p.texto.length > 0)
      .sort((a, b) => a.ordem - b.ordem)
      .map((p, i) => ({ ordem: i + 1, texto: p.texto }));
    if (passos.length > 0) return passos;
  }
  const texto = (fallback ?? "").trim();
  if (!texto) return [];
  return texto
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2)
    .map((s, i) => ({ ordem: i + 1, texto: s }));
}

export function passosParaTexto(passos: Passo[]): string {
  return passos.map((p) => p.texto).join("\n");
}

export function textoParaPassos(texto: string): Passo[] {
  return texto
    .split("\n")
    .map((s) => s.replace(/^\s*\d+[).:-]?\s*/, "").trim())
    .filter(Boolean)
    .map((t, i) => ({ ordem: i + 1, texto: t }));
}
