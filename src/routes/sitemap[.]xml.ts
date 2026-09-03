import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { slugify as slugifyNome } from "@/lib/slug";

const BASE_URL = "https://coqueteis.lovable.app";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const STATIC_ENTRIES: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/drinks", changefreq: "weekly", priority: "0.9" },
  { path: "/mixologia", changefreq: "monthly", priority: "0.8" },
  { path: "/mixologia/origem", changefreq: "yearly", priority: "0.6" },
  { path: "/mixologia/tipos", changefreq: "yearly", priority: "0.6" },
  { path: "/mixologia/materiais", changefreq: "yearly", priority: "0.6" },
  { path: "/mixologia/copos", changefreq: "yearly", priority: "0.6" },
  { path: "/mixologia/bebidas", changefreq: "yearly", priority: "0.6" },
  { path: "/mixologia/xaropes", changefreq: "yearly", priority: "0.6" },
  { path: "/mixologia/gelo", changefreq: "yearly", priority: "0.6" },
  { path: "/mixologia/tecnicas", changefreq: "yearly", priority: "0.6" },
  { path: "/mixologia/sabores", changefreq: "yearly", priority: "0.6" },
  { path: "/calculadora-abv", changefreq: "monthly", priority: "0.7" },
  { path: "/carta", changefreq: "monthly", priority: "0.7" },
  { path: "/consumo-responsavel", changefreq: "yearly", priority: "0.5" },
  { path: "/confianca", changefreq: "yearly", priority: "0.3" },
];

async function drinkEntries(): Promise<SitemapEntry[]> {
  const url = process.env["VITE_SUPABASE_URL"];
  const key = process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) return [];
  try {
    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const [{ data, error }, { data: categorias }] = await Promise.all([
      supabase.from("drinks").select("id, slug").order("nome"),
      supabase.from("drink_categorias").select("nome").order("nome"),
    ]);
    if (error || !data) return [];
    const drinks: SitemapEntry[] = data.map((d) => ({
      path: `/drinks/${d.slug || d.id}`,
      changefreq: "monthly" as const,
      priority: "0.8",
    }));
    const cats: SitemapEntry[] = (categorias ?? []).map((c) => ({
      path: `/drinks/categoria/${slugifyNome(c.nome)}`,
      changefreq: "weekly" as const,
      priority: "0.7",
    }));
    return [...cats, ...drinks];
  } catch {
    return [];
  }
}


export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries = [...STATIC_ENTRIES, ...(await drinkEntries())];

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
