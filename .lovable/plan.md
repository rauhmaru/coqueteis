## Objetivo

1. Remover rota `/categorias` (categorias de ingredientes) e rota `/gerar-imagens`.
2. Classificar drinks por categorias temáticas (Clássicos, Sour, Brasileiros, Tropicais, Tiki, Cremosos, Espumantes, Refrescantes, Quentes, Shots) — permitindo múltiplas categorias por drink.
3. Restringir edição/remoção de drinks e ingredientes ao próprio criador. Registros existentes são atribuídos ao admin atual (rauhmaru@gmail.com).

---

## Banco de dados (uma migration única)

Novas tabelas:
- `drink_categorias` (id, nome único, created_at) — categorias de drink.
- `drink_drink_categorias` (drink_id, categoria_id) — join N:N.

Novas colunas:
- `drinks.created_by uuid` (FK `auth.users`, NOT NULL após backfill).
- `ingredientes.created_by uuid` (FK `auth.users`, NOT NULL após backfill).

Backfill: atribuir todos os `drinks` e `ingredientes` existentes ao usuário `f036ce84-37f3-445f-ae1c-ba84c9588825`.

Seed das 10 categorias de drinks (mesma lista já usada em `/importar`).

Classificação automática dos drinks existentes via regras SQL sobre nomes de ingredientes vinculados e nome do drink:
- Sour → tem ingrediente "clara de ovo".
- Brasileiros → tem "cachaça" OU nome contém "caipirinha"/"caipiroska"/"batida".
- Clássicos → nome em (Manhattan, Negroni, Old Fashioned, Martini, Daiquiri, Whiskey Sour, Margarita, Sazerac, Boulevardier, Aviation, Vesper).
- Espumantes → tem espumante/prosecco/champagne.
- Cremosos → tem creme/leite/sorvete.
- Quentes → tem café/chocolate quente OU nome contém "quente"/"toddy".
- Tiki/Tropicais → tem rum + suco de frutas tropicais (abacaxi, maracujá, coco).
- Refrescantes → tem água tônica/soda/gengibre/club soda.
- Shots → nome contém "shot" ou preparo bem curto.

RLS:
- `drink_categorias`: SELECT público; INSERT/UPDATE/DELETE só para `can_edit`.
- `drink_drink_categorias`: SELECT público; INSERT/DELETE apenas se o usuário é dono do drink (`drinks.created_by = auth.uid()`) OU admin.
- `drinks`: substituir política atual de UPDATE/DELETE por: `auth.uid() = created_by OR has_role(auth.uid(),'admin')`. INSERT exige `created_by = auth.uid()`. SELECT permanece público.
- `ingredientes`: mesma lógica (`created_by = auth.uid() OR admin`). SELECT permanece público. INSERT exige `created_by = auth.uid()`.
- Tabela `categorias` (de ingredientes) e políticas: mantidas — continuam sendo usadas por `/ingredientes` e `/importar`.

GRANTs padrão para todas as novas tabelas.

---

## Frontend

Arquivos removidos:
- `src/routes/categorias.tsx`
- `src/routes/categorias.$id.tsx`
- `src/routes/_authenticated/gerar-imagens.tsx`

Header (`src/components/site-header.tsx`): remover links "Categorias" e "Gerar imagens".

`src/lib/queries.ts`:
- Adicionar `drinkCategoriasQuery` (lista de categorias de drink).
- Estender `drinksQuery` e `drinkQuery` para trazer `drink_drink_categorias(categoria_id, drink_categorias(nome))` e `created_by`.
- Estender `ingredientesQuery` para trazer `created_by`.

`src/routes/drinks.index.tsx`:
- Adicionar filtro por categorias de drink (chips), combinável com o filtro de ingredientes.
- Exibir badges das categorias em cada card.
- Botões "Editar"/"Remover" só aparecem quando `user.id === drink.created_by` OU `isAdmin`.

`src/routes/drinks.$id.index.tsx`:
- Mostrar badges de categorias.
- Botão "Editar" só quando dono ou admin.

`src/components/drink-form.tsx`:
- Novo campo "Categorias" (multi-select via chips) usando `drinkCategoriasQuery`.
- Ao criar: enviar `created_by = user.id`; ao salvar: gravar vínculos em `drink_drink_categorias` (delete + insert).
- Bloquear edição quando não é dono/admin (redirecionar com toast).

`src/routes/ingredientes.tsx`:
- Ao criar: `created_by = user.id`.
- Botões "Editar"/"Remover" só quando `user.id === ing.created_by` OU `isAdmin`.

`src/routes/_authenticated/importar.tsx`:
- Ao criar drinks e ingredientes, gravar `created_by = user.id`.
- Após criar cada drink, vincular à(s) `drink_categorias` correspondente(s) às categorias selecionadas no formulário.

`src/hooks/use-auth.tsx`: expor `isAdmin` (se ainda não expõe) e `userId` para as checagens acima.

---

## Detalhes técnicos

- Trigger `set_created_by` (BEFORE INSERT) em `drinks` e `ingredientes` para preencher `created_by = auth.uid()` quando NULL — evita depender do cliente.
- Índices em `drink_drink_categorias(drink_id)` e `(categoria_id)`.
- `useAuth` já tem `user` via Supabase; adiciono seletor `isAdmin` chamando `has_role` uma vez (ou reaproveitando `user_roles`).
- Sem mudança em servidores/edge functions.
- Não removo a tabela `categorias` (ingredientes) do banco; apenas a UI da rota.
