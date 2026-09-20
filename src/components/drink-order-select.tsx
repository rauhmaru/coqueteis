import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ORDENS_DRINKS, type OrdemDrinks } from "@/lib/ordenacao-drinks";

export function DrinkOrderSelect({
  value,
  onChange,
  className,
}: {
  value: OrdemDrinks;
  onChange: (value: OrdemDrinks) => void;
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={(value) => onChange(value as OrdemDrinks)}>
      <SelectTrigger
        aria-label="Ordenar por"
        className={`min-h-11 w-full sm:min-h-9 sm:w-[220px] ${className ?? ""}`}
      >
        <span className="mr-2 text-muted-foreground">Ordenar por:</span>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ORDENS_DRINKS.map((opcao) => (
          <SelectItem key={opcao.id} value={opcao.id}>
            {opcao.nome}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}