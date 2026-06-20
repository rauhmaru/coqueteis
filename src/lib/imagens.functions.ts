import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type GerarImagemResult = {
  drinkId: string;
  imagem_url: string;
};

function validar(input: unknown) {
  const i = input as { drinkId?: unknown; nome?: unknown };
  if (typeof i.drinkId !== "string" || !i.drinkId) throw new Error("drinkId obrigatório");
  if (typeof i.nome !== "string" || !i.nome) throw new Error("nome obrigatório");
  return { drinkId: i.drinkId, nome: i.nome };
}

export const gerarImagemDrink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validar)
  .handler(async ({ data, context }): Promise<GerarImagemResult> => {
    const { data: pode, error: roleErr } = await context.supabase
      .rpc("can_edit", { _user_id: context.userId });
    if (roleErr) throw new Error(roleErr.message);
    if (!pode) throw new Error("Sem permissão para gerar imagens");

    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY não configurada");

    const prompt = `Fotografia profissional de coquetelaria do drink "${data.nome}", servido em copo apropriado, iluminação cinematográfica, fundo escuro elegante com bokeh suave, gotas de condensação, estilo editorial premium, alta resolução, foco nítido no copo.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text().catch(() => "");
      if (resp.status === 429) {
        const err = new Error("rate_limit: limite de uso da IA atingido");
        (err as Error & { code?: string }).code = "rate_limit";
        throw err;
      }
      if (resp.status === 402) {
        const err = new Error("credits_exhausted: créditos da IA esgotados");
        (err as Error & { code?: string }).code = "credits_exhausted";
        throw err;
      }
      throw new Error(`Falha na IA (${resp.status}): ${txt.slice(0, 200)}`);
    }

    const json = (await resp.json()) as {
      choices?: { message?: { images?: { image_url?: { url?: string } }[] } }[];
    };
    const dataUrl = json.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!dataUrl || !dataUrl.startsWith("data:")) {
      throw new Error("Resposta da IA sem imagem");
    }

    const comma = dataUrl.indexOf(",");
    const meta = dataUrl.slice(5, comma);
    const b64 = dataUrl.slice(comma + 1);
    const mime = meta.split(";")[0] || "image/png";
    const ext = mime === "image/jpeg" ? "jpg" : mime === "image/webp" ? "webp" : "png";
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const path = `${data.drinkId}.${ext}`;
    const { error: upErr } = await supabaseAdmin.storage
      .from("drink-images")
      .upload(path, bytes, { contentType: mime, upsert: true });
    if (upErr) throw new Error(`upload: ${upErr.message}`);

    const { error: updErr } = await supabaseAdmin
      .from("drinks")
      .update({ imagem_url: path })
      .eq("id", data.drinkId);
    if (updErr) throw new Error(`update: ${updErr.message}`);

    return { drinkId: data.drinkId, imagem_url: path };
  });
