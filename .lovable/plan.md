## Corrigir imagem do tópico "Descascador zester, biqueiras e utensílios auxiliares"

O tópico em `src/routes/mixologia.materiais.tsx` cita: descascador zester (para raspas de cítricos), biqueiras free pour (encaixadas no gargalo das garrafas), tábua de corte, store and pour, espremedor de frutas e bar mat. A imagem atual em `src/assets/mixologia/zester.jpg` não representa corretamente esses itens.

### Mudança

- Regenerar `src/assets/mixologia/zester.jpg` via `imagegen--generate_image` (400×400, model `standard` para maior fidelidade), sobrescrevendo o arquivo existente.
- Prompt focado nos itens principais do tópico, priorizando os dois primeiros citados (zester + biqueiras free pour), pois um único quadro 400×400 fica poluído com 6 objetos:
  - Um descascador channel knife / zester de bartender (cabo curto, lâmina de aço com abertura em canal para tirar raspas longas de casca de limão/laranja).
  - Duas ou três biqueiras free pour de aço inox (bico afunilado com aba de cortiça/borracha) espalhadas ao lado, uma encaixada no gargalo de uma garrafa desfocada ao fundo.
  - Bancada de bar escura, iluminação lounge âmbar, foto de produto limpa, sem texto/marca d'água.
- Nenhuma alteração de código: `mixologia.materiais.tsx` já importa esse caminho.

### Fora do escopo

- Demais imagens da rota.
- Texto, layout ou componentes.
- Gerar imagens separadas para tábua, store and pour, espremedor e bar mat (o tópico é único e mantém uma imagem só, como as demais seções).
