/** Helpers server-only para consultar o Google Search Console via connector gateway. */

const GATEWAY = "https://connector-gateway.lovable.dev/google_search_console";

export const BASE_URL = "https://coqueteis.lovable.app";
export const SITEMAP_URL = `${BASE_URL}/sitemap.xml`;

function headers() {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const connKey = process.env["GOOGLE_SEARCH_CONSOLE_API_KEY"];
  if (!lovableKey || !connKey) {
    throw new Error(
      "Conexão com o Google Search Console indisponível. Verifique a integração do projeto.",
    );
  }
  return {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": connKey,
    "Content-Type": "application/json",
  };
}

type SiteEntry = { siteUrl: string; permissionLevel?: string };

function cobre(siteUrl: string, target: URL): boolean {
  if (siteUrl.startsWith("sc-domain:")) {
    const dominio = siteUrl.slice("sc-domain:".length).toLowerCase();
    const host = target.hostname.toLowerCase();
    return host === dominio || host.endsWith(`.${dominio}`);
  }
  try {
    return target.href.startsWith(new URL(siteUrl).href);
  } catch {
    return false;
  }
}

/** Resolve a propriedade verificada que cobre o site. */
export async function resolverPropriedade(): Promise<
  { status: "selected"; siteUrl: string } | { status: "selection_required"; candidates: string[] }
> {
  const resp = await fetch(`${GATEWAY}/webmasters/v3/sites`, { headers: headers() });
  if (!resp.ok) {
    const corpo = await resp.text();
    console.error(`GSC /sites falhou [${resp.status}]: ${corpo}`);
    throw new Error(`Não foi possível listar propriedades [${resp.status}]: ${corpo}`);
  }
  const json = (await resp.json()) as { siteEntry?: SiteEntry[] };
  const target = new URL(BASE_URL);
  const matches = (json.siteEntry ?? []).filter(
    (e) => e.permissionLevel !== "siteUnverifiedUser" && cobre(e.siteUrl, target),
  );
  if (matches.length === 0) {
    throw new Error("Nenhuma propriedade verificada do Search Console cobre este site.");
  }
  if (matches.length === 1) return { status: "selected", siteUrl: matches[0]!.siteUrl };
  return { status: "selection_required", candidates: matches.map((e) => e.siteUrl) };
}

export type InspecaoUrl = {
  verdict: string | null;
  coverageState: string | null;
  robotsTxtState: string | null;
  indexingState: string | null;
  pageFetchState: string | null;
  lastCrawlTime: string | null;
  googleCanonical: string | null;
  userCanonical: string | null;
  inspectionLink: string | null;
};

/** Lê o estado da URL no índice do Google (não solicita indexação nem rastreamento). */
export async function inspecionarUrl(siteUrl: string, url: string): Promise<InspecaoUrl> {
  const resp = await fetch(`${GATEWAY}/v1/urlInspection/index:inspect`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ inspectionUrl: url, siteUrl }),
  });
  if (!resp.ok) {
    const corpo = await resp.text();
    console.error(`GSC inspect falhou [${resp.status}] ${url}: ${corpo}`);
    throw new Error(`Consulta ao Google falhou [${resp.status}]: ${corpo.slice(0, 300)}`);
  }
  const json = (await resp.json()) as {
    inspectionResult?: {
      inspectionResultLink?: string;
      indexStatusResult?: Record<string, string>;
    };
  };
  const r = json.inspectionResult?.indexStatusResult ?? {};
  return {
    verdict: r["verdict"] ?? null,
    coverageState: r["coverageState"] ?? null,
    robotsTxtState: r["robotsTxtState"] ?? null,
    indexingState: r["indexingState"] ?? null,
    pageFetchState: r["pageFetchState"] ?? null,
    lastCrawlTime: r["lastCrawlTime"] ?? null,
    googleCanonical: r["googleCanonical"] ?? null,
    userCanonical: r["userCanonical"] ?? null,
    inspectionLink: json.inspectionResult?.inspectionResultLink ?? null,
  };
}

export type StatusSitemap = {
  path: string;
  lastSubmitted: string | null;
  lastDownloaded: string | null;
  isPending: boolean | null;
  warnings: number | null;
  errors: number | null;
};

function encodePath(siteUrl: string, sitemapUrl?: string) {
  const base = `/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps`;
  return sitemapUrl ? `${base}/${encodeURIComponent(sitemapUrl)}` : base;
}

export async function lerSitemap(siteUrl: string): Promise<StatusSitemap> {
  const resp = await fetch(`${GATEWAY}${encodePath(siteUrl, SITEMAP_URL)}`, { headers: headers() });
  if (!resp.ok) {
    const corpo = await resp.text();
    console.error(`GSC sitemap status falhou [${resp.status}]: ${corpo}`);
    throw new Error(`Status do sitemap indisponível [${resp.status}]: ${corpo.slice(0, 300)}`);
  }
  const j = (await resp.json()) as Record<string, unknown>;
  return {
    path: String(j["path"] ?? SITEMAP_URL),
    lastSubmitted: (j["lastSubmitted"] as string) ?? null,
    lastDownloaded: (j["lastDownloaded"] as string) ?? null,
    isPending: typeof j["isPending"] === "boolean" ? (j["isPending"] as boolean) : null,
    warnings: j["warnings"] != null ? Number(j["warnings"]) : null,
    errors: j["errors"] != null ? Number(j["errors"]) : null,
  };
}

export async function submeterSitemapGsc(siteUrl: string): Promise<void> {
  const resp = await fetch(`${GATEWAY}${encodePath(siteUrl, SITEMAP_URL)}`, {
    method: "PUT",
    headers: headers(),
  });
  if (!resp.ok) {
    const corpo = await resp.text();
    console.error(`GSC sitemap submit falhou [${resp.status}]: ${corpo}`);
    throw new Error(`Envio do sitemap falhou [${resp.status}]: ${corpo.slice(0, 300)}`);
  }
}
