import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { DrinkImage } from "@/components/drink-image";
import { drinkParam } from "@/lib/slug";
import type { DrinkLista } from "@/lib/queries";

export function DrinkCatalogCard({ drink }: { drink: DrinkLista }) {
  return (
    <li>
      <Link
        to="/drinks/$id"
        params={{ id: drinkParam(drink) }}
        className="group block overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <DrinkImage
          path={drink.imagem_url}
          alt={`Foto do drink ${drink.nome}`}
          className="aspect-[4/3] w-full bg-secondary/40 object-cover"
          sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
        />
        <div className="p-4">
          <h2 className="font-serif text-xl text-foreground transition-colors group-hover:text-primary">
            {drink.nome}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-1">
            <DifficultyBadge value={drink.dificuldade} />
            <Badge variant="secondary" className="text-xs">
              {drink.total_ingredientes ?? drink.drink_ingredientes.length} ingredientes
            </Badge>
            {(drink.total_curtidas ?? 0) > 0 && (
              <Badge variant="outline" className="text-xs">
                {drink.total_curtidas} curtidas
              </Badge>
            )}
          </div>
        </div>
      </Link>
    </li>
  );
}