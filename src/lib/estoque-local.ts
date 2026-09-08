import { semAcento } from "@/lib/slug";

import type { ItemBar } from "@/lib/meu-bar";

/** Chave versionada do estoque do visitante (só neste navegador). */
export const CHAVE_ESTOQUE = "meubar.v1";
/** Dose de referência do visitante (o usuário logado guarda no perfil). */
export const CHAVE_DOSE = "meubar.dose.v1";

export type ItemLocal = {
  /** id do catálogo quando o ingrediente já existe; senão `novo:<slug>` */
  ingrediente_id: string;
  nome: string;
  preco_garrafa: number | null;
  volume_garrafa_ml: number | null;
  observacoes: string | null;
};

/** Ingrediente digitado que ainda não existe no catálogo. */
export function idProvisorio(nome: string) {
  return `novo:${semAcento(nome).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

export function ehIdProvisorio(id: string) {
  return id.startsWith("novo:");
}

function normalizarItem(bruto: unknown): ItemLocal | null {
  const o = (bruto ?? {}) as Record<string, unknown>;
  const nome = typeof o.nome === "string" ? o.nome.trim() : "";
  const id = typeof o.ingrediente_id === "string" ? o.ingrediente_id : "";
  if (!nome || !id) return null;
  const numero = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null);
  return {
    ingrediente_id: id,
    nome,
    preco_garrafa: numero(o.preco_garrafa),
    volume_garrafa_ml: numero(o.volume_garrafa_ml),
    observacoes: typeof o.observacoes === "string" && o.observacoes.trim() ? o.observacoes : null,
  };
}

export function lerEstoqueLocal(): ItemLocal[] {
  if (typeof window === "undefined") return [];
  try {
    const bruto = JSON.parse(localStorage.getItem(CHAVE_ESTOQUE) ?? "[]");
    if (!Array.isArray(bruto)) return [];
    return bruto.map(normalizarItem).filter((i): i is ItemLocal => !!i);
  } catch {
    return [];
  }
}

export function salvarEstoqueLocal(itens: ItemLocal[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CHAVE_ESTOQUE, JSON.stringify(itens));
  } catch {
    /* armazenamento indisponível (aba privada, cota cheia) */
  }
}

export function limparEstoqueLocal() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CHAVE_ESTOQUE);
  } catch {
    /* ignorado */
  }
}

/** Converte o estoque local no mesmo formato usado pelos componentes. */
export function comoItensBar(itens: ItemLocal[]): ItemBar[] {
  return itens.map((i) => ({
    id: `local:${i.ingrediente_id}`,
    ingrediente_id: i.ingrediente_id,
    preco_garrafa: i.preco_garrafa,
    volume_garrafa_ml: i.volume_garrafa_ml,
    observacoes: i.observacoes,
    ingredientes: { id: i.ingrediente_id, nome: i.nome },
  }));
}

export function lerDoseLocal(): number | null {
  if (typeof window === "undefined") return null;
  const n = Number(localStorage.getItem(CHAVE_DOSE));
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function salvarDoseLocal(doseMl: number) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CHAVE_DOSE, String(doseMl));
  } catch {
    /* ignorado */
  }
}
