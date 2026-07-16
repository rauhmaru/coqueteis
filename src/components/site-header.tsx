import { Link } from "@tanstack/react-router";
import { LogIn, LogOut, Martini, Shield } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
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
  { to: "/ingredientes", label: "Ingredientes" },
] as const;

const editorNav = [
  { to: "/importar", label: "Importar" },
] as const;

export function SiteHeader() {
  const { user, canEdit, isAdmin, signOut } = useAuth();
  const initial = (user?.user_metadata?.display_name as string | undefined)?.[0] ?? user?.email?.[0] ?? "?";
  const nome = (user?.user_metadata?.display_name as string | undefined) ?? user?.email ?? "";

  return (
    <header className="border-b border-border/60 bg-card/40 backdrop-blur-sm sticky top-0 z-40">
      <div className="mx-auto max-w-6xl px-4 py-4 flex flex-wrap items-center gap-x-6 gap-y-3 justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <Martini className="h-6 w-6 text-primary group-hover:rotate-12 transition-transform" />
          <div className="leading-tight">
            <div className="font-serif text-lg text-foreground">Destilados &amp; Coquetéis</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {user ? (canEdit ? (isAdmin ? "Administrador" : "Editor") : "Somente leitura") : "Modo visitante"}
            </div>
          </div>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          {publicNav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
              activeProps={{ className: "px-3 py-1.5 rounded-md text-primary bg-secondary/80" }}
            >
              {item.label}
            </Link>
          ))}
          {canEdit && editorNav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
              activeProps={{ className: "px-3 py-1.5 rounded-md text-primary bg-secondary/80" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {!user ? (
            <Button asChild size="sm" variant="outline">
              <Link to="/auth"><LogIn className="h-4 w-4 mr-1.5" /> Entrar</Link>
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full bg-secondary/60 hover:bg-secondary px-2 py-1 transition-colors">
                  <span className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold uppercase">
                    {initial}
                  </span>
                  <span className="hidden sm:inline text-xs text-foreground max-w-[140px] truncate">{nome}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">{nome}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/usuarios" className="cursor-pointer">
                      <Shield className="h-4 w-4 mr-2" /> Usuários
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
