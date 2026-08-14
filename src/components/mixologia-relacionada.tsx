import { Link } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import type { DrinkComIngredientes } from "@/lib/queries";
import { slugify } from "@/lib/slug";

type Artigo = {
  to: "/mixologia/gelo" | "/mixologia/bebidas" | "/mixologia/xaropes" | "/mixologia/copos" | "/mixologia/materiais";
  titulo: string;
  chamada: string;
  termos: string[];
};

const ARTIGOS: Artigo[] = [
  {
    to: "/mixologia/gelo",
    titulo: "Gelo na coquetelaria",
    chamada: "Esta receita depende do gelo certo — entenda os tipos e como usá-los.",
    termos: ["gelo triturado", "gelo picado", "crushed", "frappe", "frozen"],
  },
  {
    to: "/mixologia/xaropes",
    titulo: "Xaropes e bitters",
    chamada: "Aprenda a preparar o xarope usado nesta receita.",
    termos: ["xarope", "syrup", "grenadine", "groselha", "orgeat", "falernum"],
  },
  {
    to: "/mixologia/bebidas",
    titulo: "Bebidas etílicas",
    chamada: "Conheça a bebida base desta receita e suas variações.",
    termos: ["vinho", "espumante", "prosecco", "champagne", "cerveja", "sake", "vermute", "cachaca", "whisky", "gin", "rum", "tequila", "vodka"],
  },
  {
    to: "/mixologia/copos",
    titulo: "Copos e taças",
    chamada: "Veja por que o copo indicado muda a experiência do drink.",
    termos: ["copo", "taca", "coupe", "old fashioned", "highball", "flute"],
  },
  {
    to: "/mixologia/materiais",
    titulo: "Utensílios de bar",
    chamada: "Os utensílios certos para executar este método de preparo.",
    termos: ["shake", "stir", "muddle", "blend", "layer"],
  },
];

/** Link contextual para o artigo de Mixologia relacionado ao drink. */
export function MixologiaRelacionada({ drink }: { drink: DrinkComIngredientes }) {
  const texto = slugify(
    [
      drink.nome,
      drink.preparo ?? "",
      drink.copo ?? "",
      drink.metodo_preparo ?? "",
      drink.guarnicao ?? "",
      ...drink.drink_ingredientes.map((di) => di.ingredientes?.nome ?? ""),
      ...drink.drink_drink_categorias.map((c) => c.drink_categorias?.nome ?? ""),
    ].join(" "),
  );

  const artigo = ARTIGOS.find((a) => a.termos.some((t) => texto.includes(slugify(t))));
  if (!artigo) return null;

  return (
    <Link
      to={artigo.to}
      className="flex items-start gap-2.5 rounded-xl border border-border bg-card/60 p-4 transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      <span className="min-w-0 text-sm">
        <span className="block text-foreground">Mixologia: {artigo.titulo}</span>
        <span className="block text-xs text-muted-foreground">{artigo.chamada}</span>
      </span>
    </Link>
  );
}
