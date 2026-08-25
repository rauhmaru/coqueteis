import { useRouterState } from "@tanstack/react-router";

/** Aceita apenas caminhos internos (evita open redirect). */
export function caminhoInternoSeguro(valor: unknown): string | undefined {
  if (typeof valor !== "string") return undefined;
  if (!valor.startsWith("/") || valor.startsWith("//")) return undefined;
  return valor;
}

/** Search params para o link/redirect de login preservando o destino atual. */
export function useAuthRedirectSearch(): { redirect: string } {
  const href = useRouterState({ select: (s) => s.location.href });
  return { redirect: href };
}

/** Mensagem contextual exibida no topo do formulário de login. */
export function mensagemRedirect(destino: string): string {
  if (destino.startsWith("/meu-bar")) {
    return "Entre para montar seu bar e ver o que dá para fazer com o que você tem em casa — leva menos de 1 minuto.";
  }
  if (destino.startsWith("/favoritos")) {
    return "Entre para salvar seus drinks favoritos e encontrá-los rapidinho depois — leva menos de 1 minuto.";
  }
  if (destino.startsWith("/ingredientes")) {
    return "Entre para gerenciar seus ingredientes e manter o catálogo do seu jeito — leva menos de 1 minuto.";
  }
  if (destino.startsWith("/drinks/")) {
    return "Entre para curtir, comentar e favoritar esta receita — leva menos de 1 minuto. Você volta para ela em seguida.";
  }
  return "Entre para continuar de onde você parou — leva menos de 1 minuto.";
}
