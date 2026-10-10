import { Moon, Sun, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuRadioGroup, DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { theme, setTheme, colorTheme, setColorTheme } = useTheme();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" size="icon" variant="outline" aria-label="Escolher tema" title="Escolher tema"
          className="h-11 min-h-11 w-11 min-w-11 md:h-9 md:w-9">
          <Palette className="h-5 w-5" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-60 w-60">
        <DropdownMenuLabel>Cores do site</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={colorTheme} onValueChange={(value) => {
          if (value === "classic" || value === "bar") setColorTheme(value);
        }}>
          <DropdownMenuRadioItem value="classic" className="min-h-11 gap-2">
            <span className="theme-swatch theme-swatch-classic" aria-hidden="true" /> Clássico · âmbar
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="bar" className="min-h-11 gap-2">
            <span className="theme-swatch theme-swatch-bar" aria-hidden="true" /> Mixologia · verde e vinho
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Aparência</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={theme} onValueChange={(value) => {
          if (value === "light" || value === "dark") setTheme(value);
        }}>
          <DropdownMenuRadioItem value="light" className="min-h-11 gap-2"><Sun aria-hidden="true" className="h-4 w-4" /> Claro</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark" className="min-h-11 gap-2"><Moon aria-hidden="true" className="h-4 w-4" /> Escuro</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
