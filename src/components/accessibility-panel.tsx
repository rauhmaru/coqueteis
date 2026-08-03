import { Accessibility, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ESCALAS, useA11y, type EscalaTexto } from "@/hooks/use-a11y";
import { cn } from "@/lib/utils";

const rotulos: Record<EscalaTexto, string> = {
  100: "A",
  112: "A+",
  125: "A++",
  140: "A+++",
};

export function AccessibilityPanel() {
  const { altoContraste, setAltoContraste, escala, setEscala, redefinir } = useA11y();
  const ativo = altoContraste || escala !== 100;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label="Abrir painel de acessibilidade"
          title="Acessibilidade"
          className={cn(
            "relative min-h-11 min-w-11 md:min-h-9 md:min-w-9",
            ativo && "border-primary text-primary",
          )}
        >
          <Accessibility className="h-5 w-5" aria-hidden="true" />
          {ativo && <span className="sr-only">(ajustes ativos)</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 space-y-5">
        <div>
          <h2 className="font-serif text-base text-foreground">Acessibilidade</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Suas preferências ficam salvas neste dispositivo.
          </p>
        </div>

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Label htmlFor="a11y-contraste" className="text-sm text-foreground">
              Alto contraste
            </Label>
            <p className="mt-1 text-xs text-muted-foreground">
              Reforça cores, bordas e o indicador de foco.
            </p>
          </div>
          <Switch
            id="a11y-contraste"
            checked={altoContraste}
            onCheckedChange={setAltoContraste}
            aria-label="Ativar alto contraste"
          />
        </div>

        <fieldset>
          <legend className="text-sm text-foreground">Tamanho do texto</legend>
          <p className="mt-1 text-xs text-muted-foreground">
            Aumenta todo o texto do site proporcionalmente.
          </p>
          <div
            role="radiogroup"
            aria-label="Tamanho do texto"
            className="mt-3 grid grid-cols-4 gap-2"
          >
            {ESCALAS.map((valor) => {
              const selecionado = escala === valor;
              return (
                <button
                  key={valor}
                  type="button"
                  role="radio"
                  aria-checked={selecionado}
                  onClick={() => setEscala(valor)}
                  className={cn(
                    "flex min-h-11 items-center justify-center rounded-md border text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    selecionado
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-background text-foreground hover:bg-secondary/60",
                  )}
                >
                  {rotulos[valor]}
                  <span className="sr-only"> — {valor}%</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <Button
          type="button"
          variant="outline"
          className="min-h-11 w-full"
          onClick={redefinir}
          disabled={!ativo}
        >
          <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
          Restaurar padrão
        </Button>
      </PopoverContent>
    </Popover>
  );
}
