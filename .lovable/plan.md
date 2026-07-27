## Objetivo

Cada drink passa a ter uma seção "História", exibida na página de detalhes logo **abaixo das categorias** e **acima dos ingredientes**.

## O que verifiquei

- O arquivo enviado tem **95 histórias** (títulos `##`).
- O catálogo tem **184 drinks**.
- **58 histórias casam exatamente** com drinks cadastrados; **37 não casam** por nome — a maioria são drinks ainda não cadastrados (ex.: Bamboo, Basil Smash, Hanky Panky, Martinez) e alguns são variações de grafia (ex.: "Whiskey Sour" x "Whisky Sour" já cadastrado).

## Passos

1. **Banco de dados** (migração): adicionar a coluna `historia` (texto, opcional) na tabela `drinks`.
2. **Importação**: preencher as histórias casando os nomes de forma tolerante (ignorando acentos, maiúsculas e variações como Whiskey/Whisky, "No. 2"/"nº 2"). Os títulos que continuarem sem drink correspondente serão apenas relatados a você — nenhum drink novo será criado nesta etapa.
3. **Formulário de drink**: novo campo "História" (área de texto opcional), para você editar/complementar depois.
4. **Página do drink** (`/drinks/:id`): nova seção "História" entre as categorias e os ingredientes, com o mesmo estilo dos títulos existentes (rótulo em maiúsculas/âmbar + texto). Se o drink não tiver história, a seção simplesmente não aparece.

## Detalhes técnicos

- Coluna `historia text` em `public.drinks`; políticas RLS atuais já cobrem leitura pública e edição pelo dono/admin.
- Atualização de dados via ferramenta de dados (UPDATE por id), não por migração.
- Ajustes de tipos: `Drink` em `src/lib/queries.ts`, `DrinkForm` em `src/components/drink-form.tsx`, exibição em `src/routes/drinks.$id.index.tsx`.
