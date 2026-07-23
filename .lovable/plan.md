## Adicionar categoria "Xaropes" e receitas de xaropes em /drinks

Vou criar uma nova categoria de drinks chamada **Xaropes** e cadastrar diversas receitas clássicas de xaropes usados na coquetelaria, cada uma com imagem 400×400 gerada por IA e vinculada ao drink.

### 1. Nova categoria
- Inserir `Xaropes` em `drink_categorias` via migration.

### 2. Receitas a adicionar (10 xaropes)
Reutilizando ingredientes já existentes quando possível (`Açúcar`, `Água`, `Limão-siciliano`, `Hortelã`, etc.) e criando os que faltarem (romã, gengibre, baunilha, amêndoa, canela, café, framboesa, lavanda, mel).

1. **Xarope simples (1:1)** — açúcar + água.
2. **Xarope rico (2:1)** — açúcar demerara + água.
3. **Granadina caseira** — suco de romã + açúcar.
4. **Orgeat (amêndoa)** — amêndoas, açúcar, água de flor de laranjeira.
5. **Xarope de gengibre** — gengibre fresco, açúcar, água.
6. **Xarope de baunilha** — açúcar, água, fava de baunilha.
7. **Xarope de canela** — açúcar, água, canela em pau.
8. **Xarope de hortelã** — hortelã, açúcar, água.
9. **Xarope de café** — café espresso, açúcar.
10. **Xarope de framboesa** — framboesa, açúcar, água.
11. **Xarope de mel (honey syrup)** — mel + água morna.
12. **Xarope de lavanda** — lavanda seca, açúcar, água.

Cada receita entra em `drinks` com `nome`, `preparo` detalhado, `imagem_url` e vínculo em `drink_drink_categorias` com a categoria Xaropes. Ingredientes vão em `drink_ingredientes` (criando registros faltantes em `ingredientes`).

### 3. Imagens 400×400
Para cada xarope, gerar via `imagegen--generate_image` (400×400, tier `fast`) uma foto de produto do xarope em garrafa/frasco de vidro com rótulo neutro, iluminação âmbar de bar, fundo escuro — padrão visual do catálogo. Upload no bucket `drink-images` e vinculação em `drinks.imagem_url`.

### Detalhes técnicos
- Migration única cria categoria + ingredientes faltantes.
- Script Python (via `code--exec`) usa a service key para inserir drinks, vínculos e fazer upload de imagens em lote — mesmo padrão dos imports anteriores.
- `created_by` = admin, para que os xaropes fiquem visíveis a todos e edição/remoção respeite as regras já em vigor.

### Fora do escopo
- Alterar UI de `/drinks` (a categoria "Xaropes" aparecerá automaticamente no filtro de categorias).
- Vincular xaropes a drinks existentes como ingrediente pré-pronto.
