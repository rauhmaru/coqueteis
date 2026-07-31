import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { ingredientesQuery } from "@/lib/queries";
import { normalizar } from "@/lib/abv";

type Props = {
  value: string;
  onChange: (nome: string) => void;
  /** chamado quando o usuário escolhe uma sugestão da lista */
  onSelect?: (nome: string) => void;
  placeholder?: string;
  maxLength?: number;
  id?: string;
};

const MAX_SUGESTOES = 8;

export function IngredienteAutocomplete({
  value,
  onChange,
  placeholder,
  maxLength = 80,
  id,
}: Props) {
  const { data: ingredientes } = useQuery(ingredientesQuery);
  const [aberto, setAberto] = useState(false);
  const [destaque, setDestaque] = useState(-1);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sugestoes = useMemo(() => {
    const lista = ingredientes ?? [];
    const termo = normalizar(value);
    const filtradas = termo
      ? lista.filter((i) => normalizar(i.nome).includes(termo))
      : lista;
    return filtradas.slice(0, MAX_SUGESTOES);
  }, [ingredientes, value]);

  const mostrar = aberto && sugestoes.length > 0;

  const selecionar = (nome: string) => {
    onChange(nome);
    setAberto(false);
    setDestaque(-1);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!mostrar) {
      if (e.key === "ArrowDown") setAberto(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setDestaque((d) => (d + 1) % sugestoes.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setDestaque((d) => (d <= 0 ? sugestoes.length - 1 : d - 1));
    } else if (e.key === "Enter" && destaque >= 0) {
      e.preventDefault();
      selecionar(sugestoes[destaque]!.nome);
    } else if (e.key === "Escape") {
      setAberto(false);
      setDestaque(-1);
    }
  };

  return (
    <div className="relative">
      <Input
        id={id}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        role="combobox"
        aria-expanded={mostrar}
        aria-autocomplete="list"
        autoComplete="off"
        onChange={(e) => {
          onChange(e.target.value);
          setAberto(true);
          setDestaque(-1);
        }}
        onFocus={() => setAberto(true)}
        onKeyDown={onKeyDown}
        onBlur={() => {
          blurTimer.current = setTimeout(() => setAberto(false), 120);
        }}
      />
      {mostrar && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 w-full max-h-64 overflow-auto rounded-md border border-border bg-popover p-1 shadow-lg"
          onMouseDown={(e) => e.preventDefault()}
        >
          {sugestoes.map((ing, idx) => (
            <li key={ing.id}>
              <button
                type="button"
                role="option"
                aria-selected={idx === destaque}
                className={`flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-sm ${
                  idx === destaque
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
                onClick={() => {
                  if (blurTimer.current) clearTimeout(blurTimer.current);
                  selecionar(ing.nome);
                }}
              >
                <span className="truncate">{ing.nome}</span>
                {ing.categorias?.nome && (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {ing.categorias.nome}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
