import { useEffect, useState } from "react";
import type { UnidadeExibicao } from "@/lib/medidas";

const CHAVE = "unidade-exibicao";

const valida = (v: unknown): v is UnidadeExibicao => v === "ml" || v === "oz" || v === "colher";

/** Preferência de unidade de exibição das doses, guardada no navegador. */
export function useUnidadeExibicao() {
  const [unidade, setUnidade] = useState<UnidadeExibicao>("ml");

  useEffect(() => {
    try {
      const guardada = localStorage.getItem(CHAVE);
      if (valida(guardada)) setUnidade(guardada);
    } catch {}
  }, []);

  const atualizar = (v: UnidadeExibicao) => {
    setUnidade(v);
    try {
      localStorage.setItem(CHAVE, v);
    } catch {}
  };

  return [unidade, atualizar] as const;
}
