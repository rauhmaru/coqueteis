import { useEffect, useState } from "react";
import { Download, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { registrarServiceWorker } from "@/lib/pwa";
import { useOnline } from "@/hooks/use-online";
import { Button } from "@/components/ui/button";

type PromptInstalacao = Event & { prompt: () => Promise<void> };

/** Registro do service worker + aviso de nova versão. */
export function PwaManager() {
  useEffect(() => {
    void registrarServiceWorker((recarregar) => {
      toast("Nova versão disponível", {
        description: "Recarregue para usar a versão mais recente.",
        duration: Infinity,
        action: { label: "Recarregar", onClick: () => recarregar() },
      });
    });
  }, []);

  return null;
}

/** Botão discreto de instalação, visível só quando o navegador oferece o prompt. */
export function InstallAppButton({ className = "" }: { className?: string }) {
  const [prompt, setPrompt] = useState<PromptInstalacao | null>(null);

  useEffect(() => {
    const aoDisparar = (e: Event) => {
      e.preventDefault();
      setPrompt(e as PromptInstalacao);
    };
    const aoInstalar = () => setPrompt(null);
    window.addEventListener("beforeinstallprompt", aoDisparar);
    window.addEventListener("appinstalled", aoInstalar);
    return () => {
      window.removeEventListener("beforeinstallprompt", aoDisparar);
      window.removeEventListener("appinstalled", aoInstalar);
    };
  }, []);

  if (!prompt) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      className={`min-h-9 gap-1.5 ${className}`}
      onClick={async () => {
        try {
          await prompt.prompt();
        } finally {
          setPrompt(null);
        }
      }}
    >
      <Download className="h-4 w-4" aria-hidden="true" /> Instalar app
    </Button>
  );
}

/** Faixa fixa avisando que o conteúdo exibido vem do cache. */
export function OfflineIndicator() {
  const online = useOnline();
  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-center gap-2 border-t border-border/60 bg-secondary px-4 py-2 text-center text-xs text-foreground"
    >
      <WifiOff className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      Você está offline — exibindo os dados salvos no aparelho.
    </div>
  );
}
