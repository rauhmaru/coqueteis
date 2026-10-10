import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark";
type ColorTheme = "classic" | "bar";

type ThemeState = {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
  colorTheme: ColorTheme;
  setColorTheme: (t: ColorTheme) => void;
};

const ThemeContext = createContext<ThemeState | null>(null);
const STORAGE_KEY = "theme";
const COLOR_STORAGE_KEY = "color-theme";

function applyThemeClass(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "light") {
    root.classList.add("light");
    root.classList.remove("dark");
  } else {
    root.classList.remove("light");
    root.classList.add("dark");
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [colorTheme, setColorThemeState] = useState<ColorTheme>("bar");

  useEffect(() => {
    let stored: string | null = null;
    let storedColor: string | null = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
      storedColor = window.localStorage.getItem(COLOR_STORAGE_KEY);
    } catch {
      /* Preferências continuam disponíveis quando o armazenamento está bloqueado. */
    }
    const initial: Theme = stored === "light" || stored === "dark" ? stored : "dark";
    setThemeState(initial);
    applyThemeClass(initial);
    const initialColor = storedColor === "classic" ? "classic" : "bar";
    setColorThemeState(initialColor);
    document.documentElement.dataset.colorTheme = initialColor;
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    applyThemeClass(t);
    try {
      window.localStorage.setItem(STORAGE_KEY, t);
    } catch {
      /* ignore */
    }
  };

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");
  const setColorTheme = (t: ColorTheme) => {
    setColorThemeState(t);
    document.documentElement.dataset.colorTheme = t;
    try {
      window.localStorage.setItem(COLOR_STORAGE_KEY, t);
    } catch {
      /* ignore */
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, colorTheme, setColorTheme }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme precisa estar dentro de <ThemeProvider>");
  return ctx;
}
