import { useEffect, useRef, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Martini } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "age-verified";

export function AgeGate() {
  const [ready, setReady] = useState(false);
  const [verified, setVerified] = useState(true);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const yesRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let ok = false;
    try {
      ok = window.localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      /* ignore */
    }
    setVerified(ok);
    setReady(true);
  }, []);

  const open = ready && !verified && pathname !== "/consumo-responsavel";

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    yesRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const aceitar = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      /* ignore */
    }
    setVerified(true);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-background/95 backdrop-blur-md px-4"
    >
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-2xl space-y-6">
        <div className="flex justify-center">
          <span className="rounded-full bg-secondary p-3 text-primary">
            <Martini className="h-7 w-7" />
          </span>
        </div>

        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-primary">Verificação de idade</p>
          <h1 id="age-gate-title" className="font-serif text-3xl text-foreground">
            Você tem 18 anos ou mais?
          </h1>
          <p className="text-sm text-muted-foreground">
            Este site apresenta conteúdo sobre bebidas alcoólicas. O acesso é permitido apenas para
            maiores de 18 anos.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button ref={yesRef} onClick={aceitar} className="sm:min-w-[150px]">
            Sim, tenho 18+
          </Button>
          <Button
            variant="outline"
            className="sm:min-w-[150px]"
            onClick={() => navigate({ to: "/consumo-responsavel" })}
          >
            Não
          </Button>
        </div>

        <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
          Beba com moderação. Não dirija após consumir álcool.
        </p>
      </div>
    </div>
  );
}
