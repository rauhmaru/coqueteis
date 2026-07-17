## Diagnóstico

Investigando o que permite edições indevidas hoje:

1. **`handle_new_user` promove todo novo cadastro a `editor`.** Só o primeiro usuário vira admin; todos os outros ganham `editor` automaticamente. Como a UI usa `canEdit` (role) para mostrar botões e criar itens, qualquer conta enxerga "Novo drink", "Editar", etc.
2. **RLS de `drink_ingredientes` usa `can_edit(auth.uid())` genérico** — não amarra à posse do drink. Um editor consegue alterar a lista de ingredientes de qualquer receita, mesmo que o `UPDATE` em `drinks` seja barrado. Isso é uma edição real do conteúdo da receita alheia.
3. **RLS de `drinks`/`ingredientes`** (SELECT público; INSERT/UPDATE/DELETE por `created_by` ou admin) já está correta. Nada muda ali.
4. **`drink_drink_categorias`** já está com política por posse — mantemos.
5. **Frontend** já esconde os botões de editar/remover para não-donos em `drinks.index.tsx`, `drinks.$id.index.tsx` e `ingredientes.tsx`. O que falta é: (a) permitir que qualquer usuário autenticado *crie* seus próprios itens (hoje só quem é editor/admin cria) e (b) parar de exibir/habilitar o formulário de edição para quem não é dono.

## Mudanças

### 1. Migração de banco

- Recriar `public.handle_new_user` para atribuir `admin` só ao primeiro usuário e **não inserir mais nada** para os demais (sem role automática).
- Substituir políticas de `drink_ingredientes`:
  - `SELECT` público continua.
  - `INSERT`/`DELETE`/`UPDATE` só quando `EXISTS (SELECT 1 FROM drinks d WHERE d.id = drink_id AND (d.created_by = auth.uid() OR has_role(auth.uid(),'admin')))` — mesmo padrão de `drink_drink_categorias`.
- Trocar as políticas de `INSERT` em `drinks` e `ingredientes` para exigir apenas `auth.uid() = created_by` (qualquer autenticado cria o próprio; admin continua podendo criar por causa da cláusula `OR admin` já existente que vamos preservar).
- (Opcional, seguro) Revogar role `editor` das contas existentes que não são o admin, para que a promoção anterior não sobreviva. Isso apaga linhas de `user_roles` onde `role='editor'` e `user_id` ≠ admin atual.

### 2. `src/hooks/use-auth.tsx`

- Redefinir `canEdit` como "usuário autenticado" (`!!user`). `isAdmin` continua vindo de `roles`. O gating fino de "posso editar este item" continua sendo `isAdmin || created_by === user.id` nos componentes.

### 3. Rotas

- `src/routes/_authenticated/drinks.$id.editar.tsx`: bloquear render do formulário quando `!canManage` (não só `useEffect` + navigate). Mostrar mensagem "Você não pode editar este drink" + link de volta.
- `src/routes/_authenticated/drinks.novo.tsx` e `_authenticated/importar.tsx`: continuam exigindo autenticação (via layout `_authenticated`), sem exigir role específica.
- `src/routes/ingredientes.tsx` e `src/routes/drinks.index.tsx`: nenhuma mudança de lógica de posse — apenas confirmar que os botões de novo/editar/remover aparecem para qualquer autenticado, mas com `canManage(item)` para editar/remover.

### 4. Sem mudança

- `drink_drink_categorias`, `drink_categorias`, `categorias`, storage, tipos gerados.

## Resultado esperado

- Novo usuário autenticado: vê e cria seus próprios drinks/ingredientes; não vê botão editar/remover em itens do admin; se abrir manualmente `/drinks/<id>/editar` de outro usuário, cai numa tela de "sem permissão" e qualquer POST direto é bloqueado por RLS em `drinks`, `ingredientes` e `drink_ingredientes`.
- Admin atual (`rauhmaru@gmail.com`): mantém controle total sobre tudo que já existia.
