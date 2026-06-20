## Objetivo

Adicionar autenticação ao catálogo de coquetéis e restringir as ações de escrita (criar, editar, remover drinks, ingredientes, categorias e importações) a usuários autenticados com a permissão adequada. Visitantes não autenticados continuam vendo todo o conteúdo, mas em modo somente leitura.

## Experiência do usuário

- Nova página `/auth` com abas "Entrar" e "Criar conta" (email + senha) e botão "Continuar com Google".
- Cabeçalho passa a mostrar:
  - Visitante: botão "Entrar".
  - Logado: nome/email + menu com "Sair" e, se admin, link "Usuários".
- Páginas públicas (`/`, `/drinks`, `/drinks/$id`, `/ingredientes`, `/categorias`):
  - Continuam acessíveis sem login.
  - Botões "Novo", "Editar", "Excluir", "Importar", "Gerar imagens" ficam ocultos para visitantes e usuários sem permissão.
  - Tentativas diretas (URL) de páginas de escrita redirecionam para `/auth`.
- Nova página `/usuarios` (apenas admin) para listar usuários e atribuir/remover o papel `admin` ou `editor`.
- Primeiro usuário cadastrado vira `admin` automaticamente (via trigger), os demais entram como `editor` por padrão — admin pode rebaixar para somente leitura removendo a role.

## Modelo de permissões

Três níveis efetivos:

| Papel | Pode ler | Pode criar/editar drinks, ingredientes, categorias | Pode importar/gerar imagens | Pode gerenciar usuários |
|---|---|---|---|---|
| Visitante (sem login) | Sim | Não | Não | Não |
| `editor` | Sim | Sim | Sim | Não |
| `admin` | Sim | Sim | Sim | Sim |

## Mudanças técnicas

### Banco de dados (migration única)

- `create type public.app_role as enum ('admin', 'editor');`
- Tabela `public.user_roles (id, user_id → auth.users, role, unique(user_id, role))` com RLS:
  - `select`: usuário vê suas próprias roles; admin vê todas (via `has_role`).
  - `insert/update/delete`: apenas admin.
- Tabela `public.profiles (id = auth.users.id, email, display_name, created_at, updated_at)` com RLS:
  - `select` para `authenticated`; `update` apenas do próprio registro.
- Função `public.has_role(_user_id uuid, _role app_role)` `security definer`.
- Trigger `on auth.users insert` cria `profiles` e, se for o primeiro usuário, insere role `admin`; senão `editor`.
- Atualizar políticas das tabelas existentes (`categorias`, `ingredientes`, `drinks`, `drink_ingredientes`):
  - Remover policy atual "acesso publico ... ALL".
  - `select` permanece público (`TO anon, authenticated using (true)`).
  - `insert/update/delete` apenas para `authenticated` com `has_role(auth.uid(), 'editor') OR has_role(auth.uid(), 'admin')`.
- GRANTs ajustados: `select` para `anon, authenticated`; `insert/update/delete` apenas para `authenticated`; `service_role` mantém tudo.
- Bucket `drink-images`: manter policy de leitura via URL assinada (já existe); upload restrito a server functions (service role) — sem mudança.

### Auth Supabase

- Habilitar provider Google (broker Lovable) via `configure_social_auth`.
- Manter signup público (sem auto-confirm de email, a menos que o usuário peça).

### Frontend

- `src/routes/auth.tsx`: tela de login/cadastro com `supabase.auth.signInWithPassword`, `signUp` e `lovable.auth.signInWithOAuth('google')`.
- `src/routes/_authenticated/route.tsx`: layout gerenciado para rotas que exigem login (`/drinks/novo`, `/drinks/$id/editar`, `/importar`, `/gerar-imagens`, `/usuarios`). Mover esses arquivos para dentro de `_authenticated/`.
- `src/hooks/use-auth.ts`: hook que expõe `user`, `roles`, `canEdit`, `isAdmin`, escutando `onAuthStateChange` no root.
- `src/routes/__root.tsx`: registrar listener único `onAuthStateChange` que invalida router e queries (conforme guia).
- `src/components/site-header.tsx`: mostrar estado de auth, botão sair, link "Usuários" quando admin.
- `src/routes/drinks.index.tsx`, `drinks.$id.index.tsx`, `ingredientes.tsx`, `categorias.tsx`: condicionar botões de ação a `canEdit`.
- `src/routes/usuarios.tsx`: lista de usuários (server fn `listarUsuarios` usando `supabaseAdmin` após checar admin) com toggle de roles (`atribuirRole` / `removerRole`).
- Server functions de escrita existentes (`importer.functions.ts`, `imagens.functions.ts`) passam a usar `requireSupabaseAuth` + checagem `has_role(... 'editor' or 'admin')`; sem permissão → erro 403.

### Segurança

- Reforço duplo: RLS no banco + checagem nas server functions.
- `supabaseAdmin` continua restrito a server functions, carregado dentro do handler.
- Nenhum botão de escrita aparece para visitante; mesmo se aparecesse, o backend recusaria.

## Fora de escopo

- Recuperação de senha por email (pode ser adicionada depois com template gerenciado).
- Confirmação de email obrigatória (mantém o comportamento padrão atual).
- Edição de perfil além de nome de exibição.
