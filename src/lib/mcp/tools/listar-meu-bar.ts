import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser, naoAutenticado } from "../supabase";

type ItemBarRow = {
  id: string;
  preco_garrafa: number | null;
  volume_garrafa_ml: number | null;
  observacoes: string | null;
  ingredientes: { nome: string; categorias: { nome: string } | null } | null;
};

export default defineTool({
  name: "listar_meu_bar",
  title: "Listar meu bar",
  description:
    "Lista as bebidas e ingredientes que o usuário autenticado cadastrou em Meu Bar, com preço, volume, observações e total gasto.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return naoAutenticado();
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("meu_bar")
      .select("id, preco_garrafa, volume_garrafa_ml, observacoes, ingredientes(nome, categorias(nome))")
      .order("created_at", { ascending: false });
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const itens = ((data ?? []) as unknown as ItemBarRow[]).map((i) => ({
      id: i.id,
      ingrediente: i.ingredientes?.nome ?? "(desconhecido)",
      tipo: i.ingredientes?.categorias?.nome ?? null,
      preco_garrafa: i.preco_garrafa,
      volume_garrafa_ml: i.volume_garrafa_ml,
      observacoes: i.observacoes,
    }));
    const totalGasto = itens.reduce((acc, i) => acc + (i.preco_garrafa ?? 0), 0);

    return {
      content: [
        {
          type: "text",
          text:
            itens.length === 0
              ? "Seu bar está vazio."
              : JSON.stringify({ total_itens: itens.length, total_gasto: totalGasto, itens }, null, 2),
        },
      ],
      structuredContent: { total_itens: itens.length, total_gasto: totalGasto, itens },
    };
  },
});
