import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, naoAutenticado } from "../supabase";
import { DRINK_SELECT, formatarDrink, normalizar, type DrinkRow } from "../drinks";

export default defineTool({
  name: "obter_receita",
  title: "Obter receita completa",
  description:
    "Retorna a receita completa de um drink (ingredientes, modo de preparo, dificuldade e história) pelo id ou pelo nome.",
  inputSchema: {
    id: z.string().optional().describe("Identificador do drink."),
    nome: z.string().optional().describe("Nome do drink, caso não saiba o id."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ id, nome }, ctx) => {
    if (!ctx.isAuthenticated()) return naoAutenticado();
    if (!id && !nome) {
      return { content: [{ type: "text", text: "Informe o id ou o nome do drink." }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const query = supabase.from("drinks").select(DRINK_SELECT);
    const { data, error } = id ? await query.eq("id", id) : await query.order("nome");
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const drinks = ((data ?? []) as unknown as DrinkRow[]).map(formatarDrink);
    const alvo = id
      ? drinks[0]
      : (drinks.find((d) => normalizar(d.nome) === normalizar(nome!)) ??
        drinks.find((d) => normalizar(d.nome).includes(normalizar(nome!))));

    if (!alvo) return { content: [{ type: "text", text: "Receita não encontrada." }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(alvo, null, 2) }],
      structuredContent: { drink: alvo },
    };
  },
});
