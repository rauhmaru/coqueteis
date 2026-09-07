import { calcularPorcoes } from "@/lib/porcoes";
import { normalizarPassos, metodoLabel } from "@/lib/ficha-tecnica";
import type { DrinkComIngredientes } from "@/lib/queries";

/** Versão enxuta da receita, visível apenas na impressão (cabe em uma página). */
export function ReceitaImpressao({
  drink,
  porcoes = 1,
}: {
  drink: DrinkComIngredientes;
  porcoes?: number;
}) {
  const passos = normalizarPassos(drink.passos, drink.preparo);
  const { itens } = calcularPorcoes(
    drink.drink_ingredientes.map((di) => ({
      nome: di.ingredientes?.nome ?? "Ingrediente",
      unidade: di.unidade,
      quantidade: di.quantidade,
    })),
    porcoes,
  );

  const ficha = [
    drink.dificuldade && `Dificuldade: ${drink.dificuldade}`,
    drink.copo && `Copo: ${drink.copo}`,
    metodoLabel(drink.metodo_preparo) && `Método: ${metodoLabel(drink.metodo_preparo)}`,
    `Guarnição: ${drink.guarnicao?.trim() || "Sem guarnição"}`,
    `Rende: ${porcoes} ${porcoes > 1 ? "drinks" : "drink"}`,
  ].filter(Boolean) as string[];

  return (
    <div className="hidden print:block">
      <h1 className="print-titulo">{drink.nome}</h1>
      <p className="print-ficha">{ficha.join(" · ")}</p>

      <h2 className="print-sub">Ingredientes</h2>
      <ul className="print-lista">
        {itens.map((i) => (
          <li key={`${i.nome}-${i.unidade}`}>
            <strong>{i.quantidade}</strong> {i.nome}
          </li>
        ))}
      </ul>

      <h2 className="print-sub">Preparo</h2>
      {passos.length > 0 ? (
        <ol className="print-lista">
          {passos.map((p) => (
            <li key={p.ordem}>{p.texto}</li>
          ))}
        </ol>
      ) : (
        <p>Sem instruções de preparo.</p>
      )}

      <p className="print-rodape">coqueteis.lovable.app — Receitas e mixologia</p>
    </div>
  );
}
