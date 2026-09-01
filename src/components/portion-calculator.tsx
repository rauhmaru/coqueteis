import { useMemo, useState } from "react";
import { PartyPopper, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MAX_CONVIDADOS,
  MAX_DRINKS_POR_CONVIDADO,
  calcularPorcoes,
  formatarVolume,
  type ItemReceita,
} from "@/lib/porcoes";

type Props = {
  nome: string;
  ingredientes: (string | ItemReceita)[];
};

function parseInt2(valor: string, max: number): { n: number | null; erro: string | null } {
  const t = valor.trim();
  if (!t) return { n: null, erro: "Informe um número." };
  const n = Number(t.replace(",", "."));
  if (!Number.isFinite(n)) return { n: null, erro: "Use apenas números." };
  if (n < 1) return { n: null, erro: "O mínimo é 1." };
  if (n > max) return { n: null, erro: `O máximo é ${max}.` };
  return { n: Math.floor(n), erro: null };
}

export function PortionCalculator({ nome, ingredientes }: Props) {
  const [convidados, setConvidados] = useState("10");
  const [porPessoa, setPorPessoa] = useState("2");

  const c = parseInt2(convidados, MAX_CONVIDADOS);
  const p = parseInt2(porPessoa, MAX_DRINKS_POR_CONVIDADO);
  const porcoes = c.n !== null && p.n !== null ? c.n * p.n : 0;

  const { itens, volumeTotalMl } = useMemo(
    () => calcularPorcoes(ingredientes, porcoes),
    [ingredientes, porcoes],
  );

  return (
    <section
      aria-labelledby="porcoes-titulo"
      className="rounded-xl border border-border bg-card/40 p-4 sm:p-6"
    >
      <h2
        id="porcoes-titulo"
        className="inline-flex items-center gap-2 font-serif text-xl text-foreground sm:text-2xl"
      >
        <PartyPopper className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
        Calculadora de porções para festas
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        Informe quantos convidados você espera e mostramos as quantidades de {nome} em ml/litros e
        quanto comprar de cada item — em ml, gramas, folhas ou unidades.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="porcoes-convidados">Convidados</Label>
          <Input
            id="porcoes-convidados"
            inputMode="numeric"
            value={convidados}
            onChange={(e) => setConvidados(e.target.value)}
            aria-invalid={!!c.erro}
            aria-describedby={c.erro ? "erro-convidados" : undefined}
            className={c.erro ? "border-destructive focus-visible:ring-destructive" : undefined}
          />
          {c.erro && (
            <p id="erro-convidados" className="text-xs text-destructive">
              {c.erro}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="porcoes-por-pessoa">Drinks por convidado</Label>
          <Input
            id="porcoes-por-pessoa"
            inputMode="numeric"
            value={porPessoa}
            onChange={(e) => setPorPessoa(e.target.value)}
            aria-invalid={!!p.erro}
            aria-describedby={p.erro ? "erro-por-pessoa" : undefined}
            className={p.erro ? "border-destructive focus-visible:ring-destructive" : undefined}
          />
          {p.erro && (
            <p id="erro-por-pessoa" className="text-xs text-destructive">
              {p.erro}
            </p>
          )}
        </div>
      </div>

      <p
        aria-live="polite"
        className="mt-4 inline-flex flex-wrap items-center gap-2 text-sm text-foreground"
      >
        <Users className="h-4 w-4 text-primary" aria-hidden="true" />
        {porcoes > 0 ? (
          <>
            <strong className="font-medium">{porcoes} porções</strong> · volume total aproximado de{" "}
            <strong className="font-medium">{formatarVolume(volumeTotalMl)}</strong>
          </>
        ) : (
          <span className="text-muted-foreground">Ajuste os valores para ver o cálculo.</span>
        )}
      </p>

      {porcoes > 0 && itens.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[32rem] text-sm">
            <caption className="sr-only">
              Quantidades e garrafas sugeridas por ingrediente para {porcoes} porções
            </caption>
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th scope="col" className="py-2 pr-3 font-medium">
                  Ingrediente
                </th>
                <th scope="col" className="py-2 pr-3 font-medium">
                  Por drink
                </th>
                <th scope="col" className="py-2 pr-3 font-medium">
                  Total
                </th>
                <th scope="col" className="py-2 font-medium">
                  Comprar
                </th>
              </tr>
            </thead>
            <tbody>
              {itens.map((i) => (
                <tr key={i.nome} className="border-b border-border/60 last:border-0">
                  <td className="py-2 pr-3 text-foreground">{i.nome}</td>
                  <td className="py-2 pr-3 text-muted-foreground">
                    {i.unitario}
                  </td>
                  <td className="py-2 pr-3 text-foreground">{i.quantidade}</td>
                  <td className="py-2 text-muted-foreground">
                    {i.garrafas !== null ? `${i.garrafas} × ${i.embalagem}` : i.embalagem}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        Estimativas com base em medidas clássicas de coquetelaria e embalagens comerciais comuns.
        Sirva com moderação e ofereça sempre opções sem álcool.
      </p>
    </section>
  );
}
