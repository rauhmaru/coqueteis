import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Check, CircleAlert, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { meuBarQuery } from "@/lib/meu-bar";
import { coberturaDrink, idsDoEstoque } from "@/lib/estoque-cobertura";
import type { DrinkComIngredientes } from "@/lib/queries";

/**
 * Lista de ingredientes da receita marcando o que o usuário já tem no Meu Bar
 * (ícone + texto, nunca só cor) e permitindo adicionar o que falta.
 */
export function IngredientesEstoque({ drink }: { drink: DrinkComIngredientes }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: estoque } = useQuery(meuBarQuery(user?.id));
  const [salvando, setSalvando] = useState(false);

  const temEstoque = !!user && !!estoque && estoque.length > 0;
  const cobertura = temEstoque ? coberturaDrink(drink, idsDoEstoque(estoque)) : null;

  const adicionarFaltantes = async () => {
    if (!user || !cobertura) return;
    const faltantes = cobertura.itens.filter((i) => !i.tem);
    if (faltantes.length === 0) return;
    setSalvando(true);
    const { error } = await supabase
      .from("meu_bar")
      .insert(faltantes.map((i) => ({ user_id: user.id, ingrediente_id: i.id })));
    setSalvando(false);
    if (error) {
      toast.error("Erro ao adicionar: " + error.message);
      return;
    }
    toast.success(
      faltantes.length === 1
        ? `${faltantes[0]!.nome} adicionado ao Meu Bar.`
        : `${faltantes.length} ingredientes adicionados ao Meu Bar.`,
    );
    qc.invalidateQueries({ queryKey: ["meu-bar"] });
  };

  if (!cobertura) {
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {drink.drink_ingredientes.map((di) => (
            <Badge key={di.ingrediente_id} variant="secondary">
              {di.ingredientes?.nome ?? "?"}
            </Badge>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          <Link to="/meu-bar" className="text-primary underline">
            Monte o seu bar
          </Link>{" "}
          para ver o que você já tem em casa.
        </p>
      </div>
    );
  }

  const faltamTodos = cobertura.itens.filter((i) => !i.tem);

  return (
    <div className="space-y-3">
      <ul className="space-y-1.5">
        {cobertura.itens.map((i) => (
          <li key={i.id} className="flex items-center gap-2 text-sm">
            {i.tem ? (
              <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            ) : (
              <CircleAlert className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            )}
            <span className="text-foreground">{i.nome}</span>
            <span
              className={`text-xs ${i.tem ? "text-primary" : "text-muted-foreground"}`}
            >
              {i.tem ? "você tem" : i.opcional ? "está faltando (opcional)" : "está faltando"}
            </span>
          </li>
        ))}
      </ul>

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
