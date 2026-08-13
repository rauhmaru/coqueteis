import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, naoAutenticado } from "../supabase";
import { DRINK_SELECT, formatarDrink, normalizar, type DrinkRow } from "../drinks";

export default defineTool({
  name: "drinks_possiveis",
  title: "Drinks possíveis com meu bar",
  description:
    "Cruza o estoque de Meu Bar do usuário autenticado com o catálogo e retorna os drinks que já dá para preparar e os que faltam apenas 1 ingrediente (quase lá).",
  inputSchema: {
    limite: z.number().optional().describe("Máximo de receitas por lista (padrão 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limite }, ctx) => {
    if (!ctx.isAuthenticated()) return naoAutenticado();
    const supabase = supabaseForUser(ctx);

    const [bar, cat] = await Promise.all([
      supabase.from("meu_bar").select("ingredientes(nome)"),
      supabase.from("drinks").select(DRINK_SELECT).order("nome"),
    ]);
    if (bar.error) return { content: [{ type: "text", text: bar.error.message }], isError: true };
    if (cat.error) return { content: [{ type: "text", text: cat.error.message }], isError: true };

    const estoque = new Set(
      ((bar.data ?? []) as unknown as { ingredientes: { nome: string } | null }[])
        .map((i) => i.ingredientes?.nome ?? "")
        .filter(Boolean)
        .map(normalizar),
    );
    if (estoque.size === 0) {
      return {
        content: [{ type: "text", text: "Seu bar está vazio — cadastre bebidas para ver sugestões." }],
        structuredContent: { possiveis: [], quase_la: [] },
      };
    }

    const max = Math.min(Math.max(Math.trunc(limite ?? 20), 1), 50);
    const possiveis: { id: string; nome: string; ingredientes: string[] }[] = [];
    const quaseLa: { id: string; nome: string; falta: string }[] = [];

    for (const row of (cat.data ?? []) as unknown as DrinkRow[]) {
      const d = formatarDrink(row);
      if (d.ingredientes.length === 0) continue;
      const faltando = d.ingredientes.filter((i) => !estoque.has(normalizar(i)));
      if (faltando.length === 0) possiveis.push({ id: d.id, nome: d.nome, ingredientes: d.ingredientes });
      else if (faltando.length === 1) quaseLa.push({ id: d.id, nome: d.nome, falta: faltando[0]! });
    }

    // Ordena "quase lá" por impacto: o ingrediente faltante que desbloqueia mais receitas vem antes.
    const impacto = new Map<string, number>();
    for (const q of quaseLa) {
      const k = normalizar(q.falta);
      impacto.set(k, (impacto.get(k) ?? 0) + 1);
    }
    quaseLa.sort(
      (a, b) =>
        (impacto.get(normalizar(b.falta)) ?? 0) - (impacto.get(normalizar(a.falta)) ?? 0) ||
        a.falta.localeCompare(b.falta, "pt-BR") ||
        a.nome.localeCompare(b.nome, "pt-BR"),
    );

    const resultado = {
      possiveis: possiveis.slice(0, max),
      quase_la: quaseLa.slice(0, max).map((q) => ({
        ...q,
        desbloqueia_com_a_compra: impacto.get(normalizar(q.falta)) ?? 1,
      })),
    };

    return {
      content: [{ type: "text", text: JSON.stringify(resultado, null, 2) }],
      structuredContent: resultado,
    };
  },
});
