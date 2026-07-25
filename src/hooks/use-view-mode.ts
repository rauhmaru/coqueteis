import { useEffect, useState } from "react";

export type ViewMode = "grid" | "list";

export function useViewMode(key: string, initial: ViewMode = "grid") {
  const [mode, setMode] = useState<ViewMode>(initial);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`viewmode:${key}`);
      if (stored === "grid" || stored === "list") setMode(stored);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const update = (v: ViewMode) => {
    setMode(v);
    try {
      localStorage.setItem(`viewmode:${key}`, v);
    } catch {}
  };

  return [mode, update] as const;
}
