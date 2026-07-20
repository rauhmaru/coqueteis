## Corrigir imagem do Coador Hawthorne

A imagem atual em `src/assets/mixologia/strainer.jpg` (usada na seção "Coador Hawthorne (strainer)" de `/mixologia/materiais`) não representa o produto correto.

### Mudança

- Regenerar `src/assets/mixologia/strainer.jpg` via `imagegen--generate_image` (300×300, model `fast`), sobrescrevendo o arquivo existente.
- Prompt focado no produto correto: coador Hawthorne de aço inox — disco perfurado circular com mola espiral na borda, cabo curto e duas abas de apoio, apoiado sobre uma bancada de bar escura, iluminação lounge âmbar, foto de produto.
- Nenhuma alteração de código: `mixologia.materiais.tsx` já importa esse caminho e o import é cache-busted pelo Vite ao trocar o binário.

### Fora do escopo

- Demais imagens de `/mixologia/materiais` e `/mixologia/copos`.
- Layout, texto ou componentes.
