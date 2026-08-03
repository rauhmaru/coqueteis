import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export const ESCALAS = [100, 112, 125, 140] as const;
export type EscalaTexto = (typeof ESCALAS)[number];

type A11yState = {
  altoContraste: boolean;
  setAltoContraste: (v: boolean) => void;
  escala: EscalaTexto;
  setEscala: (v: EscalaTexto) => void;
  redefinir: () => void;
};

const A11yContext = createContext<A11yState | null>(null);

const KEY_CONTRASTE = "a11y:alto-contraste";
const KEY_ESCALA = "a11y:escala-texto";

function aplicar(altoContraste: boolean, escala: EscalaTexto) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("alto-contraste", altoContraste);
  root.style.fontSize = escala === 100 ? "" : `${escala}%`;
}

export function A11yProvider({ children }: { children: ReactNode }) {
  const [altoContraste, setContrasteState] = useState(false);
  const [escala, setEscalaState] = useState<EscalaTexto>(100);

  useEffect(() => {
    let hc = false;
    let sc: EscalaTexto = 100;
    try {
      hc = window.localStorage.getItem(KEY_CONTRASTE) === "1";
      const bruto = Number(window.localStorage.getItem(KEY_ESCALA));
      if ((ESCALAS as readonly number[]).includes(bruto)) sc = bruto as EscalaTexto;
    } catch {
      /* ignore */
    }
    setContrasteState(hc);
    setEscalaState(sc);
    aplicar(hc, sc);
  }, []);

  const setAltoContraste = (v: boolean) => {
    setContrasteState(v);
    aplicar(v, escala);
    try {
      window.localStorage.setItem(KEY_CONTRASTE, v ? "1" : "0");
    } catch {
      /* ignore */
    }
  };

  const setEscala = (v: EscalaTexto) => {
    setEscalaState(v);
    aplicar(altoContraste, v);
    try {
      window.localStorage.setItem(KEY_ESCALA, String(v));
    } catch {
      /* ignore */
    }
  };

  const redefinir = () => {
    setContrasteState(false);
    setEscalaState(100);
    aplicar(false, 100);
    try {
      window.localStorage.removeItem(KEY_CONTRASTE);
      window.localStorage.removeItem(KEY_ESCALA);
    } catch {
      /* ignore */
    }
  };

  return (
    <A11yContext.Provider
      value={{ altoContraste, setAltoContraste, escala, setEscala, redefinir }}
    >
      {children}
    </A11yContext.Provider>
  );
}

export function useA11y() {
  const ctx = useContext(A11yContext);
  if (!ctx) throw new Error("useA11y precisa estar dentro de <A11yProvider>");
  return ctx;
}
