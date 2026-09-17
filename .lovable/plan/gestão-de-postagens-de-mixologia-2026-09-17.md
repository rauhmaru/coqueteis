# Gestão de postagens de Mixologia

## Objetivo
Criar uma área exclusiva para administradores cadastrarem, editarem e removerem postagens em Markdown, publicadas dentro de `/mixologia`.

## O que será criado
- Uma tabela de postagens com título, slug, resumo, conteúdo Markdown, imagem, estado de publicação e datas.
- Uma página administrativa em `/admin/mixologia`, com lista, busca, criação, edição, prévia e confirmação antes de remover.
- Um editor Markdown com barra de formatação básica e pré-visualização segura, lado a lado em telas grandes e alternável no celular.
- Uma página pública em `/mixologia/:slug` para cada postagem publicada, mantendo o visual, progresso de leitura e sumário atuais.
- Inclusão das postagens publicadas na página principal de Mixologia e no sitemap.
- Metadados próprios por postagem: título, descrição, canonical, Open Graph, Twitter Card e JSON-LD de artigo.
- Um atalho “Postagens de Mixologia” na Administração geral.

## Regras de acesso e publicação
- Somente administradores poderão listar rascunhos, criar, editar ou remover postagens.
- Visitantes verão apenas postagens publicadas.
- Slugs serão únicos e normalizados automaticamente.
- A imagem será obrigatória para publicar, com texto alternativo obrigatório; a exibição seguirá as variantes responsivas já usadas no app.
- A remoção exigirá confirmação e não permitirá acesso posterior à postagem.

## Detalhes técnicos
- Operações administrativas protegidas no servidor e novamente pelas regras de acesso do banco.
- Leituras públicas limitadas aos campos seguros e às postagens publicadas.
- Renderização de Markdown sem HTML arbitrário, evitando conteúdo executável.
- Formulários validados, estados de carregamento e mensagens de erro acessíveis.
- Verificação final em celular e desktop, incluindo criação, edição, publicação, visualização pública e remoção.
