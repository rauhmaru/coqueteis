import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser, naoAutenticado } from "../supabase";
import { DRINK_SELECT, formatarDrink, type DrinkRow } from "../drinks";

export default defineTool({
  name: "listar_favoritos",
  title: "Listar meus favoritos",
  description: "Lista os drinks que o usuário autenticado marcou como favoritos.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return naoAutenticado();
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("drink_favoritos")
      .select(`drink_id, drinks(${DRINK_SELECT})`)
      .order("created_at", { ascending: false });
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const favoritos = ((data ?? []) as unknown as { drinks: DrinkRow | null }[])
      .map((f) => f.drinks)
      .filter((d): d is DrinkRow => Boolean(d))
      .map(formatarDrink)
      .map(({ preparo: _p, historia: _h, ...r }) => r);

    return {
      content: [
        {
          type: "text",
          text:
            favoritos.length === 0
              ? "Você ainda não tem drinks favoritos."
              : JSON.stringify(favoritos, null, 2),
        },
      ],
      structuredContent: { total: favoritos.length, favoritos },
    };
  },
});
