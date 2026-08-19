import { useEffect, useRef, useState } from "react";
import { Lightbulb, LightbulbOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type WakeLockSentinelLike = {
  released: boolean;
  release: () => Promise<void>;
  addEventListener: (type: "release", listener: () => void) => void;
};

/** Mantém a tela acesa durante o preparo do drink (Screen Wake Lock API). */
export function WakeLockButton() {
  const [suportado, setSuportado] = useState(false);
  const [ativo, setAtivo] = useState(false);
  const sentinelRef = useRef<WakeLockSentinelLike | null>(null);

  useEffect(() => {
    setSuportado(typeof navigator !== "undefined" && "wakeLock" in navigator);
    return () => {
      void sentinelRef.current?.release().catch(() => {});
      sentinelRef.current = null;
    };
  }, []);

  const solicitar = async () => {
    const wakeLock = (
      navigator as unknown as {
        wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinelLike> };
      }
    ).wakeLock;
    if (!wakeLock) return;
    try {
      const sentinel = await wakeLock.request("screen");
      sentinelRef.current = sentinel;
      sentinel.addEventListener("release", () => {
        sentinelRef.current = null;
        setAtivo(false);
      });
      setAtivo(true);
      toast.success("Tela sempre acesa ativada.");
    } catch {
      toast.error("Não foi possível manter a tela acesa neste dispositivo.");
    }
  };

  // Reativa ao voltar para a aba, pois o sistema libera o bloqueio ao sair.
  useEffect(() => {
    if (!ativo) return;
    const onVisibility = () => {
      if (document.visibilityState === "visible" && !sentinelRef.current) void solicitar();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [ativo]);

  const alternar = async () => {
    if (ativo) {
      await sentinelRef.current?.release().catch(() => {});
      sentinelRef.current = null;
      setAtivo(false);
      toast("Tela sempre acesa desativada.");
      return;
    }
    await solicitar();
  };

  if (!suportado) return null;

  return (
    <Button
      variant={ativo ? "default" : "outline"}
      className="min-h-11 sm:min-h-9"
      onClick={() => void alternar()}
      aria-pressed={ativo}
      aria-label={ativo ? "Desativar tela sempre acesa" : "Manter a tela sempre acesa"}
    >
      {ativo ? (
        <Lightbulb className="h-4 w-4 mr-2" aria-hidden="true" />
      ) : (
        <LightbulbOff className="h-4 w-4 mr-2" aria-hidden="true" />
      )}
      {ativo ? "Tela acesa: ligada" : "Manter tela acesa"}
    </Button>
  );
}
