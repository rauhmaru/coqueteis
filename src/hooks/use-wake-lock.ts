import { useEffect, useRef, useState } from "react";

type WakeLockSentinelLike = {
  released: boolean;
  release: () => Promise<void>;
  addEventListener: (type: "release", listener: () => void) => void;
};

/** Mantém a tela acesa enquanto `ativar` for verdadeiro (Screen Wake Lock API). */
export function useWakeLock(ativar: boolean) {
  const sentinelRef = useRef<WakeLockSentinelLike | null>(null);
  const [ativo, setAtivo] = useState(false);

  useEffect(() => {
    let cancelado = false;

    const solicitar = async () => {
      const wakeLock = (
        navigator as unknown as {
          wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinelLike> };
        }
      ).wakeLock;
      if (!wakeLock) return;
      try {
        const sentinel = await wakeLock.request("screen");
        if (cancelado) {
          void sentinel.release().catch(() => {});
          return;
        }
        sentinelRef.current = sentinel;
        sentinel.addEventListener("release", () => {
          sentinelRef.current = null;
          setAtivo(false);
        });
        setAtivo(true);
      } catch {
        setAtivo(false);
      }
    };

    const liberar = () => {
      void sentinelRef.current?.release().catch(() => {});
      sentinelRef.current = null;
      setAtivo(false);
    };

    if (ativar) {
      void solicitar();
      const onVisibility = () => {
        if (document.visibilityState === "visible" && !sentinelRef.current) void solicitar();
      };
      document.addEventListener("visibilitychange", onVisibility);
      return () => {
        cancelado = true;
        document.removeEventListener("visibilitychange", onVisibility);
        liberar();
      };
    }

    liberar();
    return () => {
      cancelado = true;
    };
  }, [ativar]);

  return ativo;
}
