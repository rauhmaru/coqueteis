import { useQuery } from "@tanstack/react-query";
import { Wallet } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { meuBarQuery, avaliarDrinks, brl } from "@/lib/meu-bar";
import { perfilQuery, DOSE_PADRAO_ML } from "@/lib/perfil";
import type { DrinkComIngredientes } from "@/lib/queries";

/**
 * Selo com o custo estimado do drink usando o estoque de Meu Bar do usuário
 * (mesma lógica de custo por dose da rota /meu-bar). Só aparece para usuários
 * logados que já cadastraram bebidas com preço e volume.
 */
export function CustoEstoque({ drink }: { drink: DrinkComIngredientes }) {
  const { user } = useAuth();
  const { data: estoque } = useQuery(meuBarQuery(user?.id));
  const { data: perfil } = useQuery(perfilQuery(user?.id));

  if (!user || !estoque || estoque.length === 0) return null;

  const doseMl = perfil?.dose_ml ?? DOSE_PADRAO_ML;
  const [avaliado] = avaliarDrinks([drink], estoque, doseMl);
  if (!avaliado || avaliado.custo <= 0) return null;

  const { custo, custoCompleto, faltando } = avaliado;

  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-primary/40 bg-primary/5 p-4">
      <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      <div className="min-w-0 text-sm">
        <p className="text-foreground">
          {custoCompleto ? (
            <>
              Este drink custa <span className="font-medium text-primary">~{brl(custo)}</span> com o
              seu estoque atual.
            </>
          ) : (
            <>
              Você já tem <span className="font-medium text-primary">~{brl(custo)}</span> em
              ingredientes deste drink no seu estoque.
            </>
          )}
        </p>
        {!custoCompleto && (
          <p className="mt-1 text-xs text-muted-foreground">
            Estimativa parcial: {faltando.length > 0 ? `falta ${faltando.join(", ")}` : "há itens sem preço ou volume cadastrado"}.
          </p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          Base: dose de {doseMl} ml configurada no seu perfil.
        </p>
      </div>
    </div>
  );
}
