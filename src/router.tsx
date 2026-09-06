import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  // Sincroniza o cache de dados entre servidor e navegador. Sem isso, uma
  // consulta que o servidor ainda estava buscando chega ao navegador presa em
  // "carregando" e a página fica em branco depois de recarregar.
  setupRouterSsrQueryIntegration({ router, queryClient });

  return router;
};
