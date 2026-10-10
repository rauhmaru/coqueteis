<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Importações de receitas externas devem deduplicar por nome, preservar medidas incertas sem inventar valores, usar imagem própria e registrar o vídeo de origem na história; isso mantém o catálogo auditável e fiel à fonte.
- Catalog ordering is applied by the paginated database function before limiting results; this keeps ordering stable across filters and pages.
- Drink publication state lives on the drinks row; public catalog queries expose only published rows, while administrators review drafts in a protected workflow.
- Color palette and light/dark appearance are independent preferences managed by ThemeProvider and persisted separately in browser storage; semantic CSS tokens scope palettes on the document root so every page shares the selection.
