import { supabase } from "@/integrations/supabase/client";

/**
 * Assinaturas de imagem em lote.
 *
 * O bucket `drink-images` é privado, então cada imagem precisa de URL assinada.
 * Em vez de uma chamada por imagem (eram ~197 por carregamento de /drinks),
 * agrupamos todos os caminhos pedidos no mesmo tick e resolvemos com uma única
 * requisição `createSignedUrls`. O resultado fica em cache em memória durante
 * a sessão.
 */

const TTL = 60 * 60 * 24 * 365; // 1 ano
const cache = new Map<string, string | null>();
const emAndamento = new Map<string, Promise<string | null>>();

let fila = new Set<string>();
let flushAgendado = false;
let resolvers: { path: string; resolve: (v: string | null) => void }[] = [];

async function flush() {
  const paths = [...fila];
  const pendentes = resolvers;
  fila = new Set();
  resolvers = [];
  flushAgendado = false;
  if (paths.length === 0) return;

  let mapa = new Map<string, string | null>();
  try {
    const { data, error } = await supabase.storage
      .from("drink-images")
      .createSignedUrls(paths, TTL);
    if (!error && data) {
      for (const item of data) {
        const p = (item as { path?: string | null }).path ?? "";
        mapa.set(p, item.signedUrl ?? null);
      }
    }
  } catch {
    mapa = new Map();
  }

  for (const path of paths) {
    const url = mapa.get(path) ?? null;
    cache.set(path, url);
    emAndamento.delete(path);
  }
  for (const r of pendentes) r.resolve(cache.get(r.path) ?? null);
}

/** URL já em cache (sem requisição), se disponível. */
export function getCachedImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return cache.get(path) ?? null;
}

/** URL assinada da imagem, agrupando pedidos simultâneos numa só requisição. */
export function getImageUrl(path: string): Promise<string | null> {
  if (cache.has(path)) return Promise.resolve(cache.get(path) ?? null);
  const existente = emAndamento.get(path);
  if (existente) return existente;

  const promessa = new Promise<string | null>((resolve) => {
    fila.add(path);
    resolvers.push({ path, resolve });
    if (!flushAgendado) {
      flushAgendado = true;
      setTimeout(flush, 0);
    }
  });
  emAndamento.set(path, promessa);
  return promessa;
}

/** URL pública e estável (sem token de expiração) — usada em og:image e compartilhamento. */
export function getStableImageUrl(path: string, origin = "https://coqueteis.lovable.app") {
  const limpo = path.replace(/^\/+/, "").split("/").map(encodeURIComponent).join("/");
  return `${origin}/api/public/drink-image/${limpo}`;
}
