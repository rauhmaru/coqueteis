## Imagens por tópico em Materiais e Copos

Hoje as rotas `/mixologia/materiais` e `/mixologia/copos` mostram todas as imagens juntas em uma linha (`MixImgRow`) no topo. O pedido é ter **uma imagem 300×300 abaixo de cada tópico**.

### Mudanças

**`src/routes/mixologia.materiais.tsx`**
- Remover o `MixImgRow` do topo.
- Dentro de cada `MixSection`, inserir uma `MixImg` 300×300 logo abaixo do título, antes do parágrafo:
  - Coqueteleira → `shaker.jpg` (existe)
  - Coador Hawthorne → `strainer.jpg` (existe)
  - Colher bailarina → `colher.jpg` (existe)
  - Jigger, pá de gelo e pegador → `jigger.jpg` (existe)
  - Descascador zester, biqueiras e utensílios auxiliares → **gerar** `zester.jpg` (300×300, `imagegen--generate_image`, model `fast`, tema: descascador zester + biqueira free pour sobre bancada de bar escura)

**`src/routes/mixologia.copos.tsx`**
- Remover o `MixImgRow` do topo.
- Uma `MixImg` 300×300 abaixo do título de cada `MixSection`:
  - Highball → `highball.jpg` (existe)
  - Taça martini → `martini.jpg` (existe)
  - Old fashioned → `old-fashioned.jpg` (existe)
  - Canecas → `copper-mug.jpg` (existe)
  - Outros copos importantes → **gerar** `outros-copos.jpg` (300×300, tema: taça flûte, taça de vinho, tulipa, hurricane e shot lado a lado sobre bancada escura)

### Layout

Ajustar `MixSection` (ou usar wrapper local nas duas páginas) para que a imagem fique alinhada à esquerda abaixo do título, com o texto fluindo abaixo — mantendo o padrão visual atual (borda, cantos arredondados, 300×300 fixo).

### Fora do escopo

- Demais subpáginas de `/mixologia` permanecem inalteradas.
- Sem alterações em backend, navegação ou componentes fora dessas duas rotas (e possivelmente `mixologia-layout.tsx` para o wrapper, se necessário).
