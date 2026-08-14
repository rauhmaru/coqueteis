import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { DrinkImage } from "@/components/drink-image";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { drinksQuery, type DrinkComIngredientes } from "@/lib/queries";
import { drinkParam } from "@/lib/slug";

/** Escolhe até 5 drinks da mesma categoria ou que compartilhem o ingrediente principal. */
export function relacionar(
  atual: DrinkComIngredientes,
  todos: DrinkComIngredientes[],
  max = 5,
): DrinkComIngredientes[] {
  const categorias = new Set(atual.drink_drink_categorias.map((c) => c.categoria_id));
  const principal = atual.drink_ingredientes[0]?.ingrediente_id;

  return todos
    .filter((d) => d.id !== atual.id)
    .map((d) => {
      const cats = d.drink_drink_categorias.filter((c) => categorias.has(c.categoria_id)).length;
      const compartilhaPrincipal = principal
        ? d.drink_ingredientes.some((di) => di.ingrediente_id === principal)
        : false;
      return { d, score: cats * 2 + (compartilhaPrincipal ? 3 : 0) };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.d.nome.localeCompare(b.d.nome, "pt-BR"))
    .slice(0, max)
    .map((x) => x.d);
}

export function DrinksRelacionados({ drink }: { drink: DrinkComIngredientes }) {
  const { data: todos } = useQuery(drinksQuery);
  const relacionados = todos ? relacionar(drink, todos) : [];
  if (relacionados.length < 3) return null;

  return (
    <section aria-labelledby="relacionados-titulo" className="space-y-4">
      <h2 id="relacionados-titulo" className="text-xs uppercase tracking-[0.2em] text-primary">
        Drinks relacionados
      </h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {relacionados.map((d) => (
          <li key={d.id}>
            <Link
              to="/drinks/$id"
              params={{ id: drinkParam(d) }}
              className="group block overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <DrinkImage
                path={d.imagem_url}
                alt={`Foto do drink ${d.nome}`}
                className="aspect-square w-full bg-secondary/40 object-cover"
              />
              <div className="space-y-1.5 p-3">
                <h3 className="font-serif text-base leading-tight text-foreground transition-colors group-hover:text-primary">
                  {d.nome}
                </h3>
                <DifficultyBadge value={d.dificuldade} />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
