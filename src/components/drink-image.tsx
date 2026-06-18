import { useEffect, useState } from "react";
import { Martini } from "lucide-react";
import { getSignedImageUrl } from "@/lib/queries";

export function DrinkImage({
  path, alt, className,
}: { path: string | null; alt: string; className?: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!path) { setUrl(null); return; }
    getSignedImageUrl(path).then((u) => { if (active) setUrl(u); });
    return () => { active = false; };
  }, [path]);

  if (!path || !url) {
    return (
      <div className={`flex items-center justify-center ${className ?? ""}`}>
        <Martini className="h-10 w-10 text-muted-foreground/40" />
      </div>
    );
  }
  return <img src={url} alt={alt} className={className} loading="lazy" />;
}
