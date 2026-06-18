
# Sistema de Gestão de Destilados e Coquetéis

App em português (pt-BR) para amantes de coquetelaria gerenciarem ingredientes, categorias e receitas de drinks, com busca e filtro inteligente.

## Backend (Lovable Cloud)

Ativar Lovable Cloud para persistir dados e armazenar imagens dos drinks.

**Tabelas:**
- `categorias` — id, nome
- `ingredientes` — id, nome, categoria_id, quantidade
- `drinks` — id, nome, preparo, imagem_url
- `drink_ingredientes` — drink_id, ingrediente_id (relação N:N)

**Storage:** bucket público `drink-images` para as fotos dos drinks.

RLS liberada para uso pessoal (app single-user, sem autenticação nesta primeira versão).

## Telas

### 1. Menu Principal (`/`)
- Título e identidade visual com tema de coquetelaria (tons escuros, dourado/âmbar, tipografia elegante).
- Dois cards de estatística: **quantidade de ingredientes** e **quantidade de receitas**.
- **Campo de busca autocompletável** que sugere drinks pelo nome conforme o usuário digita; ao selecionar, navega para o detalhe do drink.
- Navegação para: Drinks, Ingredientes, Categorias.

### 2. Drinks (`/drinks`)
- Lista de drinks com imagem, nome e ingredientes.
- **Filtro por ingredientes** (multi-seleção): retorna apenas drinks cujos ingredientes contenham **todos** os selecionados (operador AND).
- Mensagem `"Não tenho nenhum drink cadastrado com esses ingredientes."` quando o filtro não retornar nada.
- Botões: Novo drink, Editar, Remover.

### 3. Cadastro/Edição de Drink (`/drinks/novo`, `/drinks/$id/editar`)
- Campos: Nome, Ingredientes (multi-seleção dos já cadastrados), Preparo (textarea), Imagem (upload para o bucket).
- Validação: ao menos 1 ingrediente.

### 4. Detalhe do Drink (`/drinks/$id`)
- Imagem, nome, lista de ingredientes, modo de preparo.

### 5. Ingredientes (`/ingredientes`)
- Lista com nome, categoria, quantidade.
- Cadastro/edição: Nome, Tipo (select de categorias já cadastradas), Quantidade.
- Editar e remover.

### 6. Categorias (`/categorias`)
- CRUD simples: nome.
- Necessárias para o cadastro de ingredientes.

## Detalhes técnicos

- **Stack:** TanStack Start + Tailwind v4 + shadcn/ui + Lovable Cloud.
- **Filtro AND:** consulta busca drinks e filtra no servidor garantindo que cada `ingrediente_id` selecionado esteja presente em `drink_ingredientes` daquele drink.
- **Autocomplete:** componente Command (shadcn) consultando drinks por nome (ilike).
- **Imagens:** upload via Supabase Storage; preview no formulário.
- **Rotas:** `/`, `/drinks`, `/drinks/novo`, `/drinks/$id`, `/drinks/$id/editar`, `/ingredientes`, `/categorias`. Cada uma com `head()` próprio para SEO.
- **Idioma:** toda a UI em pt-BR.
- **Design:** tema escuro inspirado em bar/lounge — fundo escuro, acentos âmbar/cobre, tipografia serifada para títulos.

## Fora de escopo (primeira versão)
- Autenticação de usuários (app de uso pessoal).
- Controle de estoque automático ao preparar drinks.
- Tags, favoritos, avaliações.

Posso seguir e implementar?
