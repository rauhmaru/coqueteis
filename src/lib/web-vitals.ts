/**
 * Medição de Web Vitals reais (LCP, CLS, INP, TTFB) com amostragem.
 *
 * Só uma fração das sessões envia dados, para não gerar volume desnecessário.
 * As métricas são acumuladas e despachadas com `sendBeacon` quando a página
 * é escondida, o que evita perder valores em navegações e fechamentos.
 */

const TAXA_AMOSTRAGEM = 0.2; // 20% das sessões
const ENDPOINT = "/api/public/web-vitals";

type Amostra = {
  rota: string;
  metrica: "LCP" | "CLS" | "INP" | "TTFB" | "FCP";
  valor: number;
  avaliacao: string | null;
  tipo_navegacao: string | null;
  conexao: string | null;
};

let iniciado = false;
const pendentes = new Map<string, Amostra>();

/** Normaliza a rota para agrupar páginas dinâmicas (ex.: /drinks/<slug>). */
export function rotaNormalizada(pathname: string): string {
  const p = pathname.replace(/\/+$/, "") || "/";
  if (/^\/drinks\/categoria\/[^/]+/.test(p)) return "/drinks/categoria/:categoria";
  if (/^\/drinks\/[^/]+\/editar$/.test(p)) return "/drinks/:id/editar";
  if (/^\/drinks\/[^/]+$/.test(p) && p !== "/drinks/novo") return "/drinks/:id";
  if (/^\/carta\/ver/.test(p)) return "/carta/ver";
  return p;
}

function conexaoAtual(): string | null {
  const nav = navigator as Navigator & { connection?: { effectiveType?: string } };
  return nav.connection?.effectiveType ?? null;
}

function despachar() {
  if (pendentes.size === 0) return;
  const corpo = JSON.stringify([...pendentes.values()]);
  pendentes.clear();
  try {
    const enviado = navigator.sendBeacon?.(
      ENDPOINT,
      new Blob([corpo], { type: "application/json" }),
    );
    if (enviado) return;
  } catch {
    /* cai para o fetch abaixo */
  }
  void fetch(ENDPOINT, {
    method: "POST",
    body: corpo,
    headers: { "Content-Type": "application/json" },
    keepalive: true,
  }).catch(() => undefined);
}

/** Registra os observadores de Web Vitals uma única vez por sessão amostrada. */
export async function iniciarWebVitals() {
  if (iniciado || typeof window === "undefined") return;
  iniciado = true;
  if (import.meta.env.DEV) return;
  if (Math.random() > TAXA_AMOSTRAGEM) return;

  const { onLCP, onCLS, onINP, onTTFB } = await import("web-vitals");

  const registrar = (m: {
    name: string;
    value: number;
    rating: string;
    navigationType?: string;
  }) => {
    const metrica = m.name as Amostra["metrica"];
    pendentes.set(metrica, {
      rota: rotaNormalizada(window.location.pathname),
      metrica,
      valor: Math.round(m.value * 1000) / 1000,
      avaliacao: m.rating ?? null,
      tipo_navegacao: m.navigationType ?? null,
      conexao: conexaoAtual(),
    });
  };

  onLCP(registrar);
  onCLS(registrar);
  onINP(registrar);
  onTTFB(registrar);

  addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") despachar();
  });
  addEventListener("pagehide", despachar);
}
