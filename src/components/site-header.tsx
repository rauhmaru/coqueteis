import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { BarChart3, Heart, LogIn, LogOut, Martini, Menu, Shield, Wine } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useFavoritos } from "@/components/favorite-icon-button";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { AccessibilityPanel } from "@/components/accessibility-panel";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const publicNav = [
  { to: "/", label: "Início" },
  { to: "/drinks", label: "Drinks" },
  { to: "/mixologia", label: "Mixologia" },
  { to: "/calculadora-abv", label: "Calculadora ABV" },
  { to: "/carta", label: "Carta de eventos" },
  { to: "/consumo-responsavel", label: "Consumo responsável" },
] as const;

const editorNav = [{ to: "/ingredientes", label: "Ingredientes" }] as const;

const linkBase =
  "px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";
const linkActive = "px-3 py-1.5 rounded-md text-primary bg-secondary/80";

const mobileLinkBase =
  "flex min-h-11 items-center rounded-md px-3 text-base text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const mobileLinkActive =
  "flex min-h-11 items-center rounded-md px-3 text-base text-primary bg-secondary/80";

export function SiteHeader() {
  const { user, canEdit, isAdmin, signOut } = useAuth();
  const favoritos = useFavoritos();
  const favCount = favoritos.size;
  const [menuAberto, setMenuAberto] = useState(false);
  const initial =
    (user?.user_metadata?.display_name as string | undefined)?.[0] ?? user?.email?.[0] ?? "?";
  const nome = (user?.user_metadata?.display_name as string | undefined) ?? user?.email ?? "";

  const papel = user
    ? canEdit
      ? isAdmin
        ? "Administrador"
        : "Editor"
      : "Somente leitura"
    : "Modo visitante";

  const fechar = () => setMenuAberto(false);

  return (
    <header className="border-b border-border/60 bg-card/40 backdrop-blur-sm sticky top-0 z-40">
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 md:flex md:flex-wrap md:justify-between md:gap-x-6 md:gap-y-3 md:py-4">
        <Link
          to="/"
          className="group flex min-w-0 items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Martini className="h-6 w-6 shrink-0 text-primary transition-transform group-hover:rotate-12" />
          <div className="min-w-0 leading-tight">
            <div className="truncate font-serif text-base text-foreground sm:text-lg">
              Destilados &amp; Coquetéis
            </div>
            <div className="truncate text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              {papel}
            </div>
          </div>
        </Link>

        {/* Navegação desktop */}
        <nav aria-label="Navegação principal" className="hidden items-center gap-1 text-sm md:flex">
          {publicNav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className={linkBase}
              activeProps={{ className: linkActive }}
            >
              {item.label}
            </Link>
          ))}
          {canEdit &&
            editorNav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={linkBase}
                activeProps={{ className: linkActive }}
              >
                {item.label}
              </Link>
            ))}
          {user && (
            <Link
              to="/meu-bar"
              className={`${linkBase} inline-flex items-center gap-1`}
              activeProps={{ className: `${linkActive} inline-flex items-center gap-1` }}
            >
              <Wine className="h-3.5 w-3.5" aria-hidden="true" /> Meu Bar
            </Link>
          )}
          {user && (
            <Link
              to="/favoritos"
              className={`${linkBase} inline-flex items-center gap-1`}
              activeProps={{ className: `${linkActive} inline-flex items-center gap-1` }}
            >
              <Heart className="h-3.5 w-3.5" aria-hidden="true" /> Favoritos
              {favCount > 0 && (
                <span className="ml-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary/15 px-1 text-[11px] font-semibold text-primary">
                  {favCount}
                  <span className="sr-only"> favoritos</span>
                </span>
              )}
            </Link>
          )}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <AccessibilityPanel />
          <ThemeToggle />

          {!user ? (
            <Button asChild size="sm" variant="outline" className="min-h-11 md:min-h-9">
              <Link to="/auth">
                <LogIn className="mr-1.5 h-4 w-4" aria-hidden="true" /> Entrar
              </Link>
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label="Abrir menu da conta"
                  className="flex min-h-11 items-center gap-2 rounded-full bg-secondary/60 px-2 py-1 transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:min-h-9"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold uppercase text-primary-foreground">
                    {initial}
                  </span>
                  <span className="hidden max-w-[140px] truncate text-xs text-foreground sm:inline">
                    {nome}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">{nome}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/usuarios" className="cursor-pointer">
                      <Shield className="mr-2 h-4 w-4" aria-hidden="true" /> Usuários
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" aria-hidden="true" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Navegação mobile */}
          <Sheet open={menuAberto} onOpenChange={setMenuAberto}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label="Abrir menu de navegação"
                className="min-h-11 min-w-11 md:hidden"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[86vw] max-w-xs">
              <SheetHeader>
                <SheetTitle className="font-serif">Navegação</SheetTitle>
              </SheetHeader>
              <nav aria-label="Navegação principal" className="mt-6 flex flex-col gap-1">
                {publicNav.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={fechar}
                    activeOptions={{ exact: item.to === "/" }}
                    className={mobileLinkBase}
                    activeProps={{ className: mobileLinkActive }}
                  >
                    {item.label}
                  </Link>
                ))}
                {canEdit &&
                  editorNav.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={fechar}
                      className={mobileLinkBase}
                      activeProps={{ className: mobileLinkActive }}
                    >
                      {item.label}
                    </Link>
                  ))}
                {user && (
                  <Link
                    to="/meu-bar"
                    onClick={fechar}
                    className={`${mobileLinkBase} gap-2`}
                    activeProps={{ className: `${mobileLinkActive} gap-2` }}
                  >
                    <Wine className="h-4 w-4" aria-hidden="true" /> Meu Bar
                  </Link>
                )}
                {user && (
                  <Link
                    to="/favoritos"
                    onClick={fechar}
                    className={`${mobileLinkBase} gap-2`}
                    activeProps={{ className: `${mobileLinkActive} gap-2` }}
                  >
                    <Heart className="h-4 w-4" aria-hidden="true" /> Favoritos
                    {favCount > 0 && (
                      <span className="ml-auto inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-primary/15 px-1.5 text-xs font-semibold text-primary">
                        {favCount}
                        <span className="sr-only"> favoritos</span>
                      </span>
                    )}
                  </Link>
                )}
                {isAdmin && (
                  <Link to="/usuarios" onClick={fechar} className={`${mobileLinkBase} gap-2`}>
                    <Shield className="h-4 w-4" aria-hidden="true" /> Usuários
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
