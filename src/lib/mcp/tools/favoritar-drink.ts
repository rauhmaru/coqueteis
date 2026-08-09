import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, naoAutenticado } from "../supabase";
import { normalizar } from "../drinks";

export default defineTool({
  name: "favoritar_drink",
  title: "Favoritar ou desfavoritar drink",
  description:
    "Adiciona ou remove um drink da lista de favoritos do usuário autenticado, pelo id ou nome do drink.",
  inputSchema: {
    nome: z.string().optional().describe("Nome do drink."),
    id: z.string().optional().describe("Identificador do drink."),
    remover: z.boolean().optional().describe("Use true para remover dos favoritos."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ nome, id, remover }, ctx) => {
    if (!ctx.isAuthenticated()) return naoAutenticado();
    if (!id && !nome) {
      return { content: [{ type: "text", text: "Informe o id ou o nome do drink." }], isError: true };
    }
    const supabase = supabaseForUser(ctx);

    let drinkId = id;
    let drinkNome = nome ?? "";
    if (!drinkId) {
      const { data, error } = await supabase.from("drinks").select("id, nome");
      if (error) return { content: [{ type: "text", text: error.message }], isError: true };
      const lista = (data ?? []) as { id: string; nome: string }[];
      const alvo =
        lista.find((d) => normalizar(d.nome) === normalizar(nome!)) ??
        lista.find((d) => normalizar(d.nome).includes(normalizar(nome!)));
      if (!alvo) return { content: [{ type: "text", text: "Drink não encontrado." }], isError: true };
      drinkId = alvo.id;
      drinkNome = alvo.nome;
    }

    if (remover) {
      const { error } = await supabase.from("drink_favoritos").delete().eq("drink_id", drinkId);
      if (error) return { content: [{ type: "text", text: error.message }], isError: true };
      return { content: [{ type: "text", text: `"${drinkNome}" removido dos favoritos.` }] };
    }

    const { error } = await supabase
      .from("drink_favoritos")
      .insert({ drink_id: drinkId, user_id: ctx.getUserId()! });
    if (error && !error.message.toLowerCase().includes("duplicate")) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return { content: [{ type: "text", text: `"${drinkNome}" está nos seus favoritos.` }] };
  },
});
