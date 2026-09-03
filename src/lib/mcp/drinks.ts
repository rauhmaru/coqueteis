import { normalizarPassos, metodoLabel } from "@/lib/ficha-tecnica";
import { semAcento } from "@/lib/slug";

export const DRINK_SELECT =
  "id, nome, preparo, passos, copo, metodo_preparo, guarnicao, historia, dificuldade, imagem_url, drink_ingredientes(ingredientes(nome)), drink_drink_categorias(drink_categorias(nome))";

export type DrinkRow = {
  id: string;
  nome: string;
  preparo: string | null;
  passos?: unknown;
  copo?: string | null;
  metodo_preparo?: string | null;
  guarnicao?: string | null;
  historia: string | null;
  dificuldade: string | null;
  imagem_url: string | null;
  drink_ingredientes: { ingredientes: { nome: string } | null }[] | null;
  drink_drink_categorias: { drink_categorias: { nome: string } | null }[] | null;
};

export type DrinkFormatado = {
  id: string;
  nome: string;
  dificuldade: string | null;
  copo: string | null;
  metodo_preparo: string | null;
  guarnicao: string;
  ingredientes: string[];
  categorias: string[];
  passos: string[];
  preparo: string | null;
  historia: string | null;
};

export function formatarDrink(d: DrinkRow): DrinkFormatado {
  return {
    id: d.id,
    nome: d.nome,
    dificuldade: d.dificuldade,
    copo: d.copo ?? null,
    metodo_preparo: metodoLabel(d.metodo_preparo ?? null),
    guarnicao: d.guarnicao?.trim() || "Sem guarnição",
    ingredientes: (d.drink_ingredientes ?? [])
      .map((di) => di.ingredientes?.nome ?? "")
      .filter(Boolean),
    categorias: (d.drink_drink_categorias ?? [])
      .map((dc) => dc.drink_categorias?.nome ?? "")
      .filter(Boolean),
    passos: normalizarPassos(d.passos, d.preparo).map((p) => `${p.ordem}. ${p.texto}`),
    preparo: d.preparo,
    historia: d.historia,
  };
}

export const normalizar = semAcento;
