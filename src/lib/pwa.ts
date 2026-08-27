/**
 * Único ponto de registro do service worker.
 *
 * Nunca registra em desenvolvimento, dentro de iframe ou nos hosts de preview
 * da Lovable — nesses casos, remove registros antigos para não servir HTML
 * velho. `?sw=off` funciona como chave de desligamento.
 */

const SW_URL = "/sw.js";

function contextoBloqueado(): boolean {
  if (typeof window === "undefined") return true;
  if (!import.meta.env.PROD) return true;
  if (window.self !== window.top) return true;

  const host = window.location.hostname;
  if (host.startsWith("id-preview--") || host.startsWith("preview--")) return true;
  if (host === "lovableproject.com" || host.endsWith(".lovableproject.com")) return true;
  if (host === "lovableproject-dev.com" || host.endsWith(".lovableproject-dev.com")) return true;
  if (host === "beta.lovable.dev" || host.endsWith(".beta.lovable.dev")) return true;
  if (new URL(window.location.href).searchParams.get("sw") === "off") return true;

  return false;
}

async function desregistrar() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    const registros = await navigator.serviceWorker.getRegistrations();
    await Promise.allSettled(
      registros
        .filter((r) => (r.active?.scriptURL ?? r.installing?.scriptURL ?? "").endsWith(SW_URL))
        .map((r) => r.unregister()),
    );
  } catch {
    /* ignora */
  }
}

/** Registra o SW e chama `onAtualizacao` quando existir uma nova versão pronta. */
export async function registrarServiceWorker(onAtualizacao: (recarregar: () => void) => void) {
  if (contextoBloqueado()) {
    await desregistrar();
    return;
  }
  if (!("serviceWorker" in navigator)) return;

  try {
    const { registerSW } = await import("virtual:pwa-register");
    const atualizar = registerSW({
      immediate: true,
      onNeedRefresh() {
        onAtualizacao(() => atualizar(true));
      },
    });
  } catch (erro) {
    console.warn("Service worker não registrado", erro);
  }
}
