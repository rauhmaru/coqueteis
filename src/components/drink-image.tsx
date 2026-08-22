import { useEffect, useState } from "react";
import { Martini } from "lucide-react";
import { getImageUrl, getCachedImageUrl } from "@/lib/image-urls";

export function DrinkImage({
  path, alt, className,
}: { path: string | null; alt: string; className?: string }) {
  const [url, setUrl] = useState<string | null>(() => getCachedImageUrl(path));

  useEffect(() => {
    let active = true;
    if (!path) { setUrl(null); return; }
    const cached = getCachedImageUrl(path);
    if (cached) { setUrl(cached); return; }
    getImageUrl(path).then((u) => { if (active) setUrl(u); });
    return () => { active = false; };
  }, [path]);

  if (!path || !url) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex items-center justify-center ${className ?? ""}`}
      >
        <Martini className="h-10 w-10 text-muted-foreground/40" aria-hidden="true" />
      </div>
    );
  }
  return <img src={url} alt={alt} className={className} loading="lazy" decoding="async" />;
}
