# Assistente de cadastro no Meu Bar

## Objetivo
Criar um fluxo guiado, exibido quando o estoque estiver vazio, para selecionar ingredientes rapidamente e revelar imediatamente as receitas possíveis.

## Experiência
1. **O que você tem em casa?** — grade acessível com os 20 ingredientes comuns, seleção por toque e contador.
2. **Falta algo?** — busca no catálogo, adição sequencial e itens escolhidos como chips removíveis.
3. **Seu bar** — resumo final e ação “Ver o que dá para fazer”.
4. Após concluir, manter visíveis os blocos existentes: **Dá para fazer agora**, **Quase lá** e **Compre isto primeiro**, com contagens e ingrediente faltante.
5. Mostrar “Passo X de 3”, permitir voltar e manter controles confortáveis em celular.

## Persistência e integração
- Reutilizar a camada atual do Meu Bar: navegador para visitantes e conta para usuários autenticados.
- Salvar as seleções ao avançar em cada etapa, sem duplicar ingredientes.
- Resolver os nomes comuns pelo catálogo existente; itens ausentes serão ignorados com aviso, sem criar ingredientes globais indevidamente.
- Ao concluir, atualizar imediatamente o estoque e os cálculos já existentes da página.

## Validação
- Testar seleção, remoção, voltar/avançar e conclusão.
- Verificar persistência após recarregar como visitante.
- Confirmar que o assistente aparece somente com estoque vazio e que os três blocos atualizam após a conclusão.
- Validar em celular e desktop, sem erros no navegador.
