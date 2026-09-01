import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Check, CircleAlert, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { meuBarQuery } from "@/lib/meu-bar";
import { coberturaDrink, idsDoEstoque, ingredienteOpcional } from "@/lib/estoque-cobertura";
import { calcularPorcoes } from "@/lib/porcoes";
import type { DrinkComIngredientes } from "@/lib/queries";

type LinhaIngrediente = {
  id: string;
  nome: string;
  dose: string;
  opcional: boolean;
  tem: boolean | null;
};

/**
 * Lista de ingredientes da receita com a dose de cada item (mesma base da
 * calculadora de porções) e, quando há estoque, o que o usuário já tem no Meu Bar.
 */
export function IngredientesEstoque({ drink }: { drink: DrinkComIngredientes }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: estoque } = useQuery(meuBarQuery(user?.id));
  const [salvando, setSalvando] = useState(false);

  const temEstoque = !!user && !!estoque && estoque.length > 0;
  const cobertura = temEstoque ? coberturaDrink(drink, idsDoEstoque(estoque)) : null;

  // Doses de uma única receita — mesma fonte da calculadora de porções.
  const nomes = drink.drink_ingredientes.map((di) => di.ingredientes?.nome ?? "Ingrediente");
  const { itens: doses } = calcularPorcoes(
    drink.drink_ingredientes.map((di, idx) => ({ nome: nomes[idx]!, unidade: di.unidade })),
    1,
  );

  const linhas: LinhaIngrediente[] = drink.drink_ingredientes.map((di, idx) => {
    const nome = nomes[idx]!;
    const item = cobertura?.itens.find((i) => i.id === di.ingrediente_id) ?? null;
    // A marcação do vínculo no banco tem prioridade sobre a heurística.
    const opcional =
      di.opcional ??
      (item?.opcional ?? ingredienteOpcional(nome, di.ingredientes?.categorias?.nome ?? null));
    return {
      id: di.ingrediente_id,
      nome,
      dose: doses[idx]?.unitario ?? "a gosto",
      opcional: !!opcional,
      tem: item ? item.tem : null,
    };
  });

  const faltamTodos = cobertura?.itens.filter((i) => !i.tem) ?? [];

  const adicionarFaltantes = async () => {
    if (!user || faltamTodos.length === 0) return;
    setSalvando(true);
    const { error } = await supabase
      .from("meu_bar")
      .insert(faltamTodos.map((i) => ({ user_id: user.id, ingrediente_id: i.id })));
    setSalvando(false);
    if (error) {
      toast.error("Erro ao adicionar: " + error.message);
      return;
    }
    toast.success(
      faltamTodos.length === 1
        ? `${faltamTodos[0]!.nome} adicionado ao Meu Bar.`
        : `${faltamTodos.length} ingredientes adicionados ao Meu Bar.`,
    );
    qc.invalidateQueries({ queryKey: ["meu-bar"] });
  };

  return (
    <div className="space-y-3">
      <ul className="divide-y divide-border/60 rounded-lg border border-border/60">
        {linhas.map((l) => (
          <li key={l.id} className="flex items-start gap-3 px-3 py-2 text-sm">
            <span className="w-20 shrink-0 text-right font-medium tabular-nums text-primary">
              {l.dose}
            </span>
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {l.tem !== null &&
                (l.tem ? (
                  <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                ) : (
                  <CircleAlert className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                ))}
              <span className="text-foreground">{l.nome}</span>
              {l.opcional && <span className="text-xs text-muted-foreground">(opcional)</span>}
              {l.tem !== null && (
                <span className={`text-xs ${l.tem ? "text-primary" : "text-muted-foreground"}`}>
                  {l.tem ? "você tem" : "está faltando"}
                </span>
              )}
            </span>
          </li>
        ))}
        <li className="px-3 py-2 text-xs text-muted-foreground">
          <span className="tabular-nums">{linhas.length}</span>{" "}
          {linhas.length === 1 ? "ingrediente no total" : "ingredientes no total"}
        </li>
      </ul>

      {!cobertura && (
        <p className="text-xs text-muted-foreground">
          <Link to="/meu-bar" className="text-primary underline">
            Monte o seu bar
          </Link>{" "}
          para ver o que você já tem em casa.
        </p>
      )}

      {faltamTodos.length > 0 && (
        <Button
          variant="outline"
          className="min-h-11 sm:min-h-9"
          onClick={() => void adicionarFaltantes()}
          disabled={salvando}
        >
          {salvando ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
          ) : (
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
          )}
          Adicionar o que falta ao meu bar
        </Button>
      )}
    </div>
  );
}
