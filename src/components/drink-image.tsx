import { Martini } from "lucide-react";
import { getStableImageUrl } from "@/lib/image-urls";

/** Larguras servidas pelo endpoint público de imagens (transform do Storage). */
const LARGURAS = [200, 400, 800] as const;

export function DrinkImage({
  path,
  alt,
  className,
  sizes = "(min-width: 1024px) 400px, (min-width: 640px) 33vw, 50vw",
  width = 400,
  height = 400,
  priority = false,
}: {
  path: string | null;
  alt: string;
  className?: string;
  /** `sizes` coerente com o espaço que a imagem ocupa no layout. */
  sizes?: string;
  width?: number;
  height?: number;
  /** Imagem principal da página: carrega imediatamente com prioridade alta. */
  priority?: boolean;
}) {
  if (!path) {
    return (
      <div
        role="img"
        aria-label={alt}
        style={{ aspectRatio: `${width} / ${height}` }}
        className={`flex items-center justify-center ${className ?? ""}`}
      >
        <Martini className="h-10 w-10 text-muted-foreground/40" aria-hidden="true" />
      </div>
    );
  }

  const base = getStableImageUrl(path);
  const srcSet = LARGURAS.map((w) => `${base}?w=${w} ${w}w`).join(", ");

  return (
    <img
      src={`${base}?w=400`}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding={priority ? "sync" : "async"}
    />
  );
}
