import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, naoAutenticado } from "../supabase";
import { normalizar } from "../drinks";

export default defineTool({
  name: "adicionar_ao_meu_bar",
  title: "Adicionar ingrediente ao meu bar",
  description:
    "Adiciona um ingrediente já cadastrado no catálogo ao estoque Meu Bar do usuário autenticado, com preço e volume opcionais.",
  inputSchema: {
    ingrediente: z.string().describe("Nome do ingrediente do catálogo (ex.: Gin, Rum branco)."),
    preco_garrafa: z.number().optional().describe("Preço pago pela garrafa, em reais."),
    volume_garrafa_ml: z.number().optional().describe("Volume da garrafa em ml."),
    observacoes: z.string().optional().describe("Observações livres sobre a bebida."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ ingrediente, preco_garrafa, volume_garrafa_ml, observacoes }, ctx) => {
    if (!ctx.isAuthenticated()) return naoAutenticado();
    const supabase = supabaseForUser(ctx);

    const { data, error } = await supabase.from("ingredientes").select("id, nome");
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const lista = (data ?? []) as { id: string; nome: string }[];
    const alvo =
      lista.find((i) => normalizar(i.nome) === normalizar(ingrediente)) ??
      lista.find((i) => normalizar(i.nome).includes(normalizar(ingrediente)));
    if (!alvo) {
      return {
        content: [
          {
            type: "text",
            text: `Ingrediente "${ingrediente}" não existe no catálogo. Cadastre-o no app antes de adicionar ao seu bar.`,
          },
        ],
        isError: true,
      };
    }

    const { error: insertError } = await supabase.from("meu_bar").insert({
      user_id: ctx.getUserId()!,
      ingrediente_id: alvo.id,
      preco_garrafa: preco_garrafa ?? null,
      volume_garrafa_ml: volume_garrafa_ml ?? null,
      observacoes: observacoes?.slice(0, 500) ?? null,
    });
    if (insertError) {
      return { content: [{ type: "text", text: insertError.message }], isError: true };
    }
    return { content: [{ type: "text", text: `"${alvo.nome}" adicionado ao seu bar.` }] };
  },
});
