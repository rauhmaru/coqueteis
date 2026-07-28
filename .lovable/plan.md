## Objetivo

Cada drink passa a ter uma dificuldade de preparo: **Fácil**, **Médio** ou **Difícil**, visível no catálogo e na página da receita, com filtro na lista.

## Dados

1. Nova coluna `dificuldade` na tabela `drinks` (texto, valores permitidos: Fácil, Médio, Difícil; padrão "Fácil").
2. Importar as 95 classificações do arquivo enviado, com correspondência tolerante a acentos e variações de grafia (ex.: "Bee's Knees" → "Bees Knees", "Piña Colada"/"Pina Colada", "Corpse Reviver No. 2" → "Corpse Reviver Nº 2", "B-52"/"B52 Shot").
3. Classificar os demais drinks do catálogo (185 no total) usando o mesmo critério do arquivo:
   - **Fácil**: build no copo, até ~4 ingredientes, sem técnicas especiais (ex.: highballs, spritz, batidas simples, caipirinhas, shots diretos).
   - **Médio**: coquetelagem/shake, sour com clara de ovo, xaropes caseiros, muddling, flambar/aquecer, 5+ ingredientes.
   - **Difícil**: camadas, dry shake prolongado, muitos destilados e etapas (ex.: Zombie, Ramos Gin Fizz, Singapore Sling).

## Interface

- Página do drink (`/drinks/$id`): badge de dificuldade junto às categorias, com cor distinta por nível (verde/âmbar/vermelho via tokens do tema).
- Cards em `/drinks` e `/favoritos`: badge discreto de dificuldade (grade e lista).
- `/drinks`: novo bloco de filtro "Dificuldade" com os três botões, combinando com os filtros de categoria e ingredientes já existentes.
- Formulário de cadastro/edição (`drink-form.tsx`): seletor de dificuldade, padrão "Fácil".

## Detalhes técnicos

- Migração adiciona a coluna com CHECK de valores; atualizações de dados via script de UPDATE por nome normalizado.
- Tipos atualizados em `src/lib/queries.ts` (e `types.ts` regenerado após a migração).
- Filtro de dificuldade em estado local, mesma lógica de composição dos filtros atuais.
