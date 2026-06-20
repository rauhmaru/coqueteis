import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ReceitaIA = {
  nome: string;
  preparo: string;
  ingredientes: { nome: string; categoria: string }[];
};

const CATEGORIAS_VALIDAS = [
  "Clássicos",
  "Tropicais",
  "Shots",
  "Refrescantes",
  "Cremosos",
  "Sour",
  "Tiki",
  "Brasileiros",
  "Quentes",
  "Espumantes",
] as const;

function validar(input: unknown) {
  const i = input as { categorias?: unknown; quantidade?: unknown };
  const categorias = Array.isArray(i.categorias)
    ? (i.categorias as unknown[]).filter((c): c is string => typeof c === "string")
    : [];
  const quantidade = Math.min(10, Math.max(1, Number(i.quantidade) || 3));
  if (categorias.length === 0) throw new Error("Selecione ao menos uma categoria");
  for (const c of categorias) {
    if (!(CATEGORIAS_VALIDAS as readonly string[]).includes(c)) {
      throw new Error(`Categoria inválida: ${c}`);
    }
  }
  return { categorias, quantidade };
}

export const gerarReceitasIA = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validar)
  .handler(async ({ data, context }): Promise<{ receitas: ReceitaIA[] }> => {
    const { data: pode, error: roleErr } = await context.supabase
      .rpc("can_edit", { _user_id: context.userId });
    if (roleErr) throw new Error(roleErr.message);
    if (!pode) throw new Error("Sem permissão para importar receitas");

    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY não configurada");

    const totalDrinks = data.categorias.length * data.quantidade;
    const sys = `Você é um bartender expert. Gere receitas de drinks famosos em pt-BR. Sempre responda APENAS com JSON válido, sem markdown ou texto adicional.`;
    const user = `Gere ${data.quantidade} receitas de drinks famosos para cada uma destas categorias: ${data.categorias.join(", ")}.

Retorne JSON com este formato exato:
{
  "receitas": [
    {
      "nome": "Nome do drink",
      "preparo": "Modo de preparo detalhado em 1-3 frases",
      "ingredientes": [
        { "nome": "Vodka", "categoria": "Destilados" },
        { "nome": "Suco de limão", "categoria": "Cítricos" }
      ]
    }
  ]
}

Regras:
- Total esperado: ${totalDrinks} drinks
- Use categorias de ingredientes entre: Destilados, Licores, Vermutes & Aperitivos, Cítricos, Ervas & Frutas, Adoçantes, Bitters, Espumantes & Refrigerantes, Outros
- Nomes de ingredientes devem ser concisos e padronizados (ex: "Rum branco", "Suco de limão", "Açúcar")
- Inclua entre 2 e 7 ingredientes por drink
- Priorize drinks clássicos e conhecidos
- Não invente drinks; use receitas reais`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text().catch(() => "");
      if (resp.status === 429) throw new Error("Limite de uso da IA atingido. Tente novamente em alguns instantes.");
      if (resp.status === 402) throw new Error("Créditos da IA esgotados. Adicione créditos no workspace.");
      throw new Error(`Falha na IA (${resp.status}): ${txt.slice(0, 200)}`);
    }

    const json = (await resp.json()) as { choices?: { message?: { content?: string } }[] };
    const content = json.choices?.[0]?.message?.content ?? "{}";
    let parsed: { receitas?: ReceitaIA[] };
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error("Resposta da IA inválida");
    }
    const receitas = Array.isArray(parsed.receitas) ? parsed.receitas : [];
    return { receitas };
  });
