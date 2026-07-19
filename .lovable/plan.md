## Nova seção Mixologia

Criar uma nova área de conteúdo educacional baseada no PDF anexado, com uma página índice em `/mixologia` e 7 subpáginas de conteúdo. Puramente estático (sem backend, sem RLS): tudo vive em arquivos de rota, seguindo o padrão visual atual (SiteHeader, dark lounge, fonte serif Playfair, cards com borda âmbar).

### Rotas a criar

Arquivos flat sob `src/routes/` (o `routeTree.gen.ts` é regenerado automaticamente):

- `mixologia.tsx` — layout com `<Outlet />`
- `mixologia.index.tsx` → `/mixologia` — grid de 7 cards para os tópicos
- `mixologia.origem.tsx` → Origem e história
- `mixologia.tipos.tsx` → Tipos de coquetéis (método, volume, finalidade)
- `mixologia.materiais.tsx` → Materiais e utensílios
- `mixologia.copos.tsx` → Copos e taças
- `mixologia.bebidas.tsx` → Bebidas etílicas (fermentadas/destiladas/infusionadas)
- `mixologia.xaropes.tsx` → Xaropes e bitters
- `mixologia.gelo.tsx` → Gelo: de coadjuvante à estrela

Cada subpágina tem `head()` com título/description próprios e o mesmo layout base: `SiteHeader`, container `max-w-4xl`, breadcrumb "← Mixologia", título em Playfair, corpo com parágrafos, subtítulos e listas — reaproveitando os textos da apostila (com pequenos ajustes de forma).

### Navegação

Adicionar `{ to: "/mixologia", label: "Mixologia" }` em `publicNav` no `src/components/site-header.tsx`.

### Imagens 300×300

Gerar 1 imagem por tópico (7 no total) via `imagegen--generate_image` em `src/assets/mixologia/*.jpg` (300×300, model `fast`) — cada uma temática (ex.: coqueteleira/utensílios de bar, coleção de copos, garrafas de destilados, xaropes coloridos, cubo de gelo esférico etc.). Cada subpágina exibe 2–4 imagens 300×300 (a principal do tópico + variações relevantes ao conteúdo, ex.: página de copos mostra 4 tipos de copo; página de materiais mostra shaker, strainer, colher, jigger). Total ~15–20 imagens 300×300 geradas.

Imagens importadas como ES6 (`import img from "@/assets/mixologia/copos.jpg"`) e usadas em `<img src={img} alt="…" className="w-[300px] h-[300px] rounded-lg object-cover" />`. A página índice usa a imagem principal de cada tópico como capa do card.

### Metadados

- Rota pai `/mixologia`: título "Mixologia — Destilados & Coquetéis" + description sobre aprendizado de coquetelaria.
- Cada subpágina: título e description próprios (ex.: "Copos e taças — Mixologia").
- `og:image` só nas subpáginas (não em `mixologia.tsx` layout nem `__root.tsx`), apontando para a imagem principal do tópico (URL absoluta do preview publicado, gerada após upload dos assets — ou omitir se ficar frágil; o hosting adiciona preview automático).

### Não muda

- Sem alterações em backend, tabelas, RLS, autenticação, ou funcionalidades existentes.
- Sem edição de `routeTree.gen.ts` (regenerado pelo plugin).
- Sem novos pacotes.
