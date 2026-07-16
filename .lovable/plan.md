# Comentários: curtidas, ordenação e edição

## O que muda para o usuário

Na página de cada drink, na seção de comentários:

- Cada comentário passa a ter um botão de curtir com contador. Só usuários autenticados podem curtir; qualquer visitante vê o total.
- Um seletor no topo permite alternar entre **Mais relevantes** (mais curtidos primeiro, desempate por mais recente) e **Mais recentes** (padrão atual).
- No próprio comentário do usuário aparecem os botões **Editar** e **Excluir**. Editar abre o texto em uma caixa inline com Salvar/Cancelar. Excluir pede confirmação.

## Banco de dados

Nova tabela `comentario_likes` (uma curtida por usuário por comentário), espelhando a estrutura de `drink_likes`:

- Chave: `comentario_id + user_id`
- Todos podem ver as curtidas
- Apenas usuários autenticados curtem/descurtem, e só a própria curtida

A tabela `drink_comentarios` já suporta atualização e remoção pelo próprio autor via RLS existente — nada a mudar lá.

## Frontend

Todo o trabalho fica em `src/components/drink-social.tsx`:

- Nova query que conta curtidas por comentário do drink atual (`comentario_likes` filtrado pelos ids da lista de comentários) e marca quais o usuário logado curtiu.
- Estado local `ordem: "relevantes" | "recentes"` com dois botões-toggle acima da lista. Ordenação feita client-side sobre a lista já carregada (drinks têm poucos comentários; simples e evita refetch).
- Cada item da lista ganha:
  - Botão de coração com contador, desabilitado para deslogados.
  - Se `user.id === c.user_id`: botões Editar e Excluir. Editar troca o parágrafo por um `Textarea` + Salvar/Cancelar, chama `update` em `drink_comentarios` com `texto` novo. Excluir mantém o comportamento atual, agora com `AlertDialog` de confirmação.
- Invalidação de queries após curtir/editar/remover mantém a lista sincronizada.

## Detalhes técnicos

- Migration cria `public.comentario_likes` seguindo o padrão de `drink_likes`: GRANTs para `anon` (SELECT), `authenticated` (SELECT/INSERT/DELETE), `service_role` (ALL); RLS ligado; políticas SELECT pública, INSERT/DELETE só `auth.uid() = user_id`; índice em `comentario_id`.
- Query de curtidas usa `.in("comentario_id", ids)` e é reprocessada em memória para produzir `{ [comentarioId]: { total, likedByMe } }`.
- Ordenação: `relevantes` → `sort` por total desc, depois `created_at` desc; `recentes` → mantém `created_at` desc já vindo do servidor.
- Edição usa `supabase.from("drink_comentarios").update({ texto }).eq("id", id)` — RLS já limita ao dono; validação client-side reaproveita o limite de 1–1000 caracteres.
- `AlertDialog` de shadcn (já usado em outras telas) para confirmar exclusão.
- Sem novas dependências.
