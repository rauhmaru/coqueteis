export type CartaPayload = {
  /** título */
  t: string;
  /** subtítulo */
  s?: string;
  /** ids dos drinks */
  d: string[];
  /** template */
  tpl?: string;
  /** convidados */
  c?: number;
  /** drinks por convidado */
  p?: number;
};

function toBase64Url(texto: string): string {
  const bytes = new TextEncoder().encode(texto);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(valor: string): string {
  const b64 = valor.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64.padEnd(Math.ceil(b64.length / 4) * 4, "="));
  const bytes = Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Serializa a carta em um código curto para colocar na URL pública. */
export function codificarCarta(payload: CartaPayload): string {
  return toBase64Url(JSON.stringify(payload));
}

export function decodificarCarta(codigo: string): CartaPayload | null {
  try {
    const obj = JSON.parse(fromBase64Url(codigo)) as CartaPayload;
    if (!obj || !Array.isArray(obj.d) || obj.d.length === 0) return null;
    return {
      t: typeof obj.t === "string" ? obj.t : "Nossa Carta",
      s: typeof obj.s === "string" ? obj.s : undefined,
      d: obj.d.filter((x) => typeof x === "string").slice(0, 5),
      tpl: typeof obj.tpl === "string" ? obj.tpl : undefined,
      c: typeof obj.c === "number" ? obj.c : undefined,
      p: typeof obj.p === "number" ? obj.p : undefined,
    };
  } catch {
    return null;
  }
}

export function urlDaCarta(baseUrl: string, payload: CartaPayload): string {
  return `${baseUrl}/carta/ver?c=${codificarCarta(payload)}`;
}
