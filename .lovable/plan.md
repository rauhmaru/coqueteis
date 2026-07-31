## Objetivo
Na rota `/calculadora-abv`, o campo "Ingrediente" passa a sugerir os ingredientes já cadastrados no catálogo, sem impedir a digitação de nomes livres.

## Comportamento
- Ao focar/digitar no campo, aparece uma lista de sugestões filtrada pelos ingredientes cadastrados (busca sem acentos, case-insensitive), mostrando o nome e o tipo/categoria do ingrediente.
- Selecionar uma sugestão preenche o nome e, quando a linha ainda está "em branco" (ml e teor zerados), também preenche volume e teor sugeridos pela tabela de referência atual.
- Texto livre continua válido: se nada casar, o usuário digita o que quiser e o teor/volume seguem editáveis (mesma regra de sugestão automática de hoje).
- Máximo de ~8 sugestões visíveis, navegáveis por teclado (setas + Enter + Esc) e clicáveis no mobile.

## Detalhes técnicos
- Novo componente `src/components/ingrediente-autocomplete.tsx`: input controlado + lista de sugestões em `Popover` com `Command`/`CommandInput`-less (lista filtrada manualmente) — mantém digitação livre, ao contrário de um Combobox fechado.
- Dados via `ingredientesQuery` já existente em `src/lib/queries.ts` (`useQuery`), sem novas consultas nem migrações. Se a consulta falhar ou estiver vazia, o campo funciona como input comum.
- Em `src/routes/calculadora-abv.tsx`, o `<Input>` do nome é trocado pelo novo componente, reaproveitando `nomeChange` para a sugestão de ABV/ml.
- Acessibilidade: `aria-autocomplete="list"`, `role="listbox"/"option"`, rótulo mantido.
