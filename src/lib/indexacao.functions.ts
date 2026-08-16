import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type UrlMonitorada = {
  url: string;
  tipo: "home" | "lista" | "categoria" | "drink";
  titulo: string;
  verdict: string | null;
  coverage_state: string | null;
  last_crawl_time: string | null;
  consultado_em: string | null;
  erro: string | null;
  inspection_link: string | null;
};

export type LogIndexacao = {
  id: string;
  url: string;
  tipo: string;
  verdict: string | null;
  coverage_state: string | null;
  erro: string | null;
  consultado_em: string;
};

export type LogSitemap = {
  id: string;
  acao: string;
  total_urls: number | null;
  is_pending: boolean | null;
  last_submitted: string | null;
  last_downloaded: string | null;
  warnings: number | null;
  errors: number | null;
  erro: string | null;
  criado_em: string;
};

export type PainelIndexacao = {
  urls: UrlMonitorada[];
  logs: LogIndexacao[];
  sitemap: LogSitemap[];
};

export const carregarPainelIndexacao = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PainelIndexacao> => {
    const { ensureAdmin, BASE_URL } = await import("./indexacao.server");
    const { slugify } = await import("./slug");
    await ensureAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: drinks }, { data: categorias }, { data: logs }, { data: sitemap }] =
      await Promise.all([
        supabaseAdmin.from("drinks").select("nome, slug, id").order("nome"),
        supabaseAdmin.from("drink_categorias").select("nome").order("nome"),
        supabaseAdmin
          .from("seo_indexacao_log")
          .select("id, url, tipo, verdict, coverage_state, erro, consultado_em")
          .order("consultado_em", { ascending: false })
          .limit(100),
        supabaseAdmin
          .from("seo_sitemap_log")
          .select(
            "id, acao, total_urls, is_pending, last_submitted, last_downloaded, warnings, errors, erro, criado_em",
          )
          .order("criado_em", { ascending: false })
          .limit(20),
      ]);

    const alvos: { url: string; tipo: UrlMonitorada["tipo"]; titulo: string }[] = [
      { url: `${BASE_URL}/`, tipo: "home", titulo: "Home" },
      { url: `${BASE_URL}/drinks`, tipo: "lista", titulo: "Todos os drinks" },
      ...(categorias ?? []).map((c) => ({
        url: `${BASE_URL}/drinks/categoria/${slugify(c.nome)}`,
        tipo: "categoria" as const,
        titulo: c.nome,
      })),
      ...(drinks ?? []).map((d) => ({
        url: `${BASE_URL}/drinks/${d.slug || d.id}`,
        tipo: "drink" as const,
        titulo: d.nome,
      })),
    ];

    // Último status conhecido por URL (a lista de logs já vem ordenada do mais recente)
    const { data: ultimos } = await supabaseAdmin
      .from("seo_indexacao_log")
      .select(
        "url, verdict, coverage_state, last_crawl_time, consultado_em, erro, inspection_link",
      )
      .order("consultado_em", { ascending: false })
      .limit(2000);

    const mapa = new Map<string, NonNullable<typeof ultimos>[number]>();
    for (const l of ultimos ?? []) if (!mapa.has(l.url)) mapa.set(l.url, l);

    return {
      urls: alvos.map((a) => {
        const u = mapa.get(a.url);
        return {
          ...a,
          verdict: u?.verdict ?? null,
          coverage_state: u?.coverage_state ?? null,
          last_crawl_time: u?.last_crawl_time ?? null,
          consultado_em: u?.consultado_em ?? null,
          erro: u?.erro ?? null,
          inspection_link: u?.inspection_link ?? null,
        };
      }),
      logs: (logs ?? []) as LogIndexacao[],
      sitemap: (sitemap ?? []) as LogSitemap[],
    };
  });

export const consultarIndexacao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as { urls?: unknown; tipo?: unknown };
    if (!Array.isArray(i.urls) || i.urls.length === 0) throw new Error("Selecione ao menos 1 URL");
    if (i.urls.length > 10) throw new Error("Consulte no máximo 10 URLs por vez");
    const urls = i.urls.map((u) => {
      if (typeof u !== "string" || !u.startsWith("https://coqueteis.lovable.app/")) {
        throw new Error("URL inválida");
      }
      return u;
    });
    return { urls, tipo: typeof i.tipo === "string" ? i.tipo : "drink" };
  })
  .handler(async ({ data, context }) => {
    const { ensureAdmin, resolverPropriedade, inspecionarUrl } = await import(
      "./indexacao.server"
    );
    await ensureAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const prop = await resolverPropriedade();
    if (prop.status === "selection_required") {
      return { status: "selection_required" as const, candidates: prop.candidates, resultados: [] };
    }

    const resultados: { url: string; verdict: string | null; coverage: string | null; erro: string | null }[] = [];
    for (const url of data.urls) {
      try {
        const r = await inspecionarUrl(prop.siteUrl, url);
        await supabaseAdmin.from("seo_indexacao_log").insert({
          url,
          tipo: data.tipo,
          verdict: r.verdict,
          coverage_state: r.coverageState,
          robots_txt_state: r.robotsTxtState,
          indexing_state: r.indexingState,
          page_fetch_state: r.pageFetchState,
          last_crawl_time: r.lastCrawlTime,
          google_canonical: r.googleCanonical,
          user_canonical: r.userCanonical,
          inspection_link: r.inspectionLink,
          consultado_por: context.userId,
        });
        resultados.push({ url, verdict: r.verdict, coverage: r.coverageState, erro: null });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Erro desconhecido";
        await supabaseAdmin.from("seo_indexacao_log").insert({
          url,
          tipo: data.tipo,
          erro: msg,
          consultado_por: context.userId,
        });
        resultados.push({ url, verdict: null, coverage: null, erro: msg });
      }
    }
    return { status: "ok" as const, candidates: [], resultados };
  });

export const atualizarSitemap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as { submeter?: unknown };
    return { submeter: i.submeter === true };
  })
  .handler(async ({ data, context }) => {
    const { ensureAdmin, resolverPropriedade, lerSitemap, submeterSitemapGsc, SITEMAP_URL, BASE_URL } =
      await import("./indexacao.server");
    await ensureAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const prop = await resolverPropriedade();
    if (prop.status === "selection_required") {
      return { status: "selection_required" as const, candidates: prop.candidates, sitemap: null };
    }

    let totalUrls: number | null = null;
    try {
      const xml = await fetch(`${BASE_URL}/sitemap.xml`).then((r) => r.text());
      totalUrls = (xml.match(/<loc>/g) ?? []).length || null;
    } catch {
      totalUrls = null;
    }

    try {
      if (data.submeter) await submeterSitemapGsc(prop.siteUrl);
      const status = await lerSitemap(prop.siteUrl);
      await supabaseAdmin.from("seo_sitemap_log").insert({
        sitemap_url: SITEMAP_URL,
        acao: data.submeter ? "envio" : "status",
        total_urls: totalUrls,
        is_pending: status.isPending,
        last_submitted: status.lastSubmitted,
        last_downloaded: status.lastDownloaded,
        warnings: status.warnings,
        errors: status.errors,
        criado_por: context.userId,
      });
      return { status: "ok" as const, candidates: [], sitemap: status };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro desconhecido";
      await supabaseAdmin.from("seo_sitemap_log").insert({
        sitemap_url: SITEMAP_URL,
        acao: data.submeter ? "envio" : "status",
        total_urls: totalUrls,
        erro: msg,
        criado_por: context.userId,
      });
      throw new Error(msg);
    }
  });
