import { auth, defineMcp } from "@lovable.dev/mcp-js";

import buscarDrinks from "./tools/buscar-drinks";
import obterReceita from "./tools/obter-receita";
import listarFavoritos from "./tools/listar-favoritos";
import favoritarDrink from "./tools/favoritar-drink";
import listarMeuBar from "./tools/listar-meu-bar";
import adicionarAoMeuBar from "./tools/adicionar-ao-meu-bar";
import drinksPossiveis from "./tools/drinks-possiveis";

const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

export default defineMcp({
  name: "cocktail-craft-manager",
  title: "Cocktail Craft Manager",
  version: "0.1.0",
  instructions:
    "Ferramentas do sistema de gestão de destilados e coquetéis. Use buscar_drinks e obter_receita para consultar o catálogo, listar_favoritos e favoritar_drink para a lista pessoal, e listar_meu_bar, adicionar_ao_meu_bar e drinks_possiveis para o estoque de bebidas do usuário.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    buscarDrinks,
    obterReceita,
    listarFavoritos,
    favoritarDrink,
    listarMeuBar,
    adicionarAoMeuBar,
    drinksPossiveis,
  ],
});
