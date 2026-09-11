## Objetivo
Criar a página `/admin/categorias` para administradores cadastrarem, renomearem e removerem categorias de ingredientes.

## Implementação
- Adicionar funções protegidas no servidor para listar, criar, editar e excluir categorias.
- Validar a sessão e o papel de administrador em cada operação, sem depender apenas da interface.
- Criar uma página responsiva com formulário, lista, ações de edição e confirmação antes da exclusão.
- Mostrar uma mensagem de acesso restrito caso um usuário autenticado sem papel de administrador acesse o endereço diretamente.
- Adicionar o atalho “Categorias” na Administração geral, visível somente para administradores.
- Atualizar os dados em cache após cada alteração para refletir as categorias nos formulários existentes.

## Segurança e comportamento
- A exclusão respeitará os vínculos existentes no banco; erros de categoria em uso serão apresentados sem remover dados relacionados.
- A página terá metadados próprios e não será indexada por mecanismos de busca.

## Verificação
- Validar tipos e testes existentes.
- Conferir no navegador o bloqueio para não administradores e o fluxo de gerenciamento para administrador.
