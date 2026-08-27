/**
 * Snapshots offline (favoritos e Meu Bar).
 *
 * O app é usado na cozinha e no bar, onde a conexão cai com frequência.
 * Guardamos em localStorage os dados que o usuário precisa ter sempre à mão
 * e aquecemos o cache de imagens dessas receitas no Cache Storage, para que o
 * service worker sirva tudo sem rede.
 */

import { getStableImageUrl } from "@/lib/image-urls";

const PREFIXO = "dc-offline:";
export const CACHE_IMAGENS_OFFLINE = "dc-imagens-offline";

export type SnapshotOffline<T> = { salvoEm: string; dados: T };

function chave(nome: string) {
  return `${PREFIXO}${nome}`;
}

export function salvarSnapshot<T>(nome: string, dados: T) {
  if (typeof window === "undefined") return;
  try {
    const payload: SnapshotOffline<T> = { salvoEm: new Date().toISOString(), dados };
    window.localStorage.setItem(chave(nome), JSON.stringify(payload));
  } catch {
    /* cota cheia ou storage indisponível: offline apenas fica sem snapshot */
  }
}

export function lerSnapshot<T>(nome: string): SnapshotOffline<T> | null {
  if (typeof window === "undefined") return null;
  try {
    const bruto = window.localStorage.getItem(chave(nome));
    if (!bruto) return null;
    return JSON.parse(bruto) as SnapshotOffline<T>;
  } catch {
    return null;
  }
}

/** Baixa e guarda as imagens (variante 400 px) das receitas indicadas. */
export async function aquecerImagensOffline(paths: (string | null | undefined)[]) {
  if (typeof window === "undefined" || !("caches" in window)) return;
  const validos = [...new Set(paths.filter((p): p is string => !!p))].slice(0, 60);
  if (validos.length === 0) return;
  try {
    const cache = await caches.open(CACHE_IMAGENS_OFFLINE);
    await Promise.allSettled(
      validos.map(async (path) => {
        const url = `${getStableImageUrl(path, "")}?w=400`;
        if (await cache.match(url)) return;
        const resposta = await fetch(url, { cache: "no-cache" });
        if (resposta.ok) await cache.put(url, resposta.clone());
      }),
    );
  } catch {
    /* sem espaço ou sem permissão: segue sem cache de imagens */
  }
}

export function formatarSalvoEm(iso: string | undefined) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}
