import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { normalizar } from "@/lib/abv";
import { meuBarQuery, type ItemBar } from "@/lib/meu-bar";
import {
  comoItensBar,
  ehIdProvisorio,
  idProvisorio,
  lerEstoqueLocal,
  limparEstoqueLocal,
  salvarEstoqueLocal,
  type ItemLocal,
} from "@/lib/estoque-local";

/**
 * Camada única de acesso ao estoque "Meu Bar".
 * Visitante → localStorage (chave versionada). Usuário autenticado → banco.
 * Os componentes usam sempre a mesma interface (`ItemBar`).
 */
export const estoqueQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["meu-bar", userId ?? "local"],
    queryFn: async (): Promise<ItemBar[]> => {
      if (!userId) return comoItensBar(lerEstoqueLocal());
      return (await meuBarQuery(userId).queryFn!({} as never)) as ItemBar[];
    },
  });

type Catalogo = { id: string; nome: string }[];

function acharNoCatalogo(catalogo: Catalogo, nome: string) {
  const alvo = normalizar(nome);
  return catalogo.find((i) => normalizar(i.nome) === alvo);
}

function gravarLocal(itens: ItemLocal[], novo: ItemLocal) {
  const i = itens.findIndex((x) => x.ingrediente_id === novo.ingrediente_id);
  if (i >= 0) itens[i] = { ...itens[i]!, ...novo };
  else itens.unshift(novo);
  salvarEstoqueLocal(itens);
}

export async function adicionarItemEstoque(opts: {
  userId?: string;
  nome: string;
  preco: number | null;
  volume: number | null;
  catalogo: Catalogo;
}) {
  const nome = opts.nome.trim();
  if (!nome) throw new Error("Informe o nome da bebida ou ingrediente.");
  const doCatalogo = acharNoCatalogo(opts.catalogo, nome);

  if (!opts.userId) {
    gravarLocal(lerEstoqueLocal(), {
      ingrediente_id: doCatalogo?.id ?? idProvisorio(nome),
      nome: doCatalogo?.nome ?? nome,
      preco_garrafa: opts.preco,
      volume_garrafa_ml: opts.volume,
      observacoes: null,
    });
    return;
  }

  let ingredienteId = doCatalogo?.id;
  if (!ingredienteId) {
    const { data, error } = await supabase
      .from("ingredientes")
      .insert({ nome })
      .select("id")
      .single();
    if (error) throw error;
    ingredienteId = data.id;
  }

  const { error } = await supabase.from("meu_bar").upsert(
    {
      user_id: opts.userId,
      ingrediente_id: ingredienteId,
      preco_garrafa: opts.preco,
      volume_garrafa_ml: opts.volume,
    },
    { onConflict: "user_id,ingrediente_id" },
  );
  if (error) throw error;
}

export async function atualizarItemEstoque(opts: {
  userId?: string;
  id: string;
  preco: number | null;
  volume: number | null;
  observacoes: string | null;
}) {
  if (!opts.userId) {
    const itens = lerEstoqueLocal();
    const chave = opts.id.replace(/^local:/, "");
    const i = itens.findIndex((x) => x.ingrediente_id === chave);
    if (i < 0) return;
    itens[i] = {
      ...itens[i]!,
      preco_garrafa: opts.preco,
      volume_garrafa_ml: opts.volume,
      observacoes: opts.observacoes,
    };
    salvarEstoqueLocal(itens);
    return;
  }
  const { error } = await supabase
    .from("meu_bar")
    .update({
      preco_garrafa: opts.preco,
      volume_garrafa_ml: opts.volume,
      observacoes: opts.observacoes,
    })
    .eq("id", opts.id);
  if (error) throw error;
}

export async function removerItemEstoque(opts: { userId?: string; id: string }) {
  if (!opts.userId) {
    const chave = opts.id.replace(/^local:/, "");
    salvarEstoqueLocal(lerEstoqueLocal().filter((x) => x.ingrediente_id !== chave));
    return;
  }
  const { error } = await supabase.from("meu_bar").delete().eq("id", opts.id);
  if (error) throw error;
}

/** Adiciona de uma vez os ingredientes que faltam para uma receita. */
export async function adicionarFaltantesEstoque(opts: {
  userId?: string;
  itens: { id: string; nome: string }[];
}) {
  if (opts.itens.length === 0) return;
  if (!opts.userId) {
    const itens = lerEstoqueLocal();
    for (const i of opts.itens) {
      gravarLocal(itens, {
        ingrediente_id: i.id,
        nome: i.nome,
        preco_garrafa: null,
        volume_garrafa_ml: null,
        observacoes: null,
      });
    }
    return;
  }
  const { error } = await supabase.from("meu_bar").upsert(
    opts.itens.map((i) => ({ user_id: opts.userId!, ingrediente_id: i.id })),
    { onConflict: "user_id,ingrediente_id" },
  );
  if (error) throw error;
}

/**
 * Passa o estoque guardado no navegador para a conta recém-autenticada,
 * sem duplicar o que já existe, e limpa o armazenamento local.
 * Devolve quantos itens foram salvos na conta.
 */
export async function migrarEstoqueLocal(userId: string): Promise<number> {
  const locais = lerEstoqueLocal();
  if (locais.length === 0) return 0;

  // Ingredientes que ainda não existem no catálogo entram agora.
  const novos = locais.filter((i) => ehIdProvisorio(i.ingrediente_id));
  const resolvidos = new Map<string, string>();
  if (novos.length > 0) {
    const { data: existentes } = await supabase
      .from("ingredientes")
      .select("id, nome")
      .in("nome", novos.map((i) => i.nome));
    for (const n of novos) {
      const achado = acharNoCatalogo((existentes ?? []) as Catalogo, n.nome);
      if (achado) {
        resolvidos.set(n.ingrediente_id, achado.id);
        continue;
      }
      const { data, error } = await supabase
        .from("ingredientes")
        .insert({ nome: n.nome })
        .select("id")
        .single();
      if (error) continue;
      resolvidos.set(n.ingrediente_id, data.id);
    }
  }

  const linhas = locais
    .map((i) => {
      const ingredienteId = ehIdProvisorio(i.ingrediente_id)
        ? resolvidos.get(i.ingrediente_id)
        : i.ingrediente_id;
      if (!ingredienteId) return null;
      return {
        user_id: userId,
        ingrediente_id: ingredienteId,
        preco_garrafa: i.preco_garrafa,
        volume_garrafa_ml: i.volume_garrafa_ml,
        observacoes: i.observacoes,
      };
    })
    .filter((l): l is NonNullable<typeof l> => !!l);

  if (linhas.length === 0) {
    limparEstoqueLocal();
    return 0;
  }

  // ignoreDuplicates: o que já está na conta permanece como está.
  const { error } = await supabase
    .from("meu_bar")
    .upsert(linhas, { onConflict: "user_id,ingrediente_id", ignoreDuplicates: true });
  if (error) throw error;

  limparEstoqueLocal();
  return linhas.length;
}
