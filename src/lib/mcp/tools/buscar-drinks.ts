import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, naoAutenticado } from "../supabase";
import { DRINK_SELECT, formatarDrink, type DrinkRow } from "../drinks";

export default defineTool({
  name: "buscar_drinks",
  title: "Buscar drinks",
  description:
    "Busca receitas do catálogo por nome, ingrediente, categoria (ex.: Clássicos, Xaropes, Não alcoólicos) ou dificuldade.",
  inputSchema: {
    termo: z.string().optional().describe("Texto livre: nome do drink ou ingrediente."),
    categoria: z.string().optional().describe("Nome da categoria do drink."),
    dificuldade: z.string().optional().describe("Fácil, Médio ou Difícil."),
    limite: z.number().optional().describe("Máximo de receitas retornadas (padrão 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ termo, categoria, dificuldade, limite }, ctx) => {
    if (!ctx.isAuthenticated()) return naoAutenticado();
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase.from("drinks").select(DRINK_SELECT).order("nome");
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const norm = (s: string) =>
      s
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

    let drinks = ((data ?? []) as unknown as DrinkRow[]).map(formatarDrink);
    if (termo) {
      const t = norm(termo);
      drinks = drinks.filter(
        (d) =>
          norm(d.nome).includes(t) ||
          d.ingredientes.some((i) => norm(i).includes(t)) ||
          d.categorias.some((c) => norm(c).includes(t)),
      );
    }
    if (categoria) {
      const c = norm(categoria);
      drinks = drinks.filter((d) => d.categorias.some((x) => norm(x).includes(c)));
    }
    if (dificuldade) {
      const dif = norm(dificuldade);
      drinks = drinks.filter((d) => norm(d.dificuldade ?? "") === dif);
    }

    const max = Math.min(Math.max(Math.trunc(limite ?? 20), 1), 100);
    const resultado = drinks.slice(0, max).map(({ preparo: _preparo, historia: _h, ...r }) => r);

    return {
      content: [
        {
          type: "text",
          text:
            resultado.length === 0
              ? "Nenhum drink encontrado com esses critérios."
              : JSON.stringify(resultado, null, 2),
        },
      ],
      structuredContent: { total: drinks.length, drinks: resultado },
    };
  },
});
