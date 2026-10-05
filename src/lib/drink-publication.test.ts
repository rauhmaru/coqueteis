import { describe, expect, it } from "vitest";
import { validarPublicacaoSelecionada } from "./drink-publication";

describe("publicação de receitas", () => {
  it("aceita mover uma receita publicada para rascunhos", () => {
    expect(validarPublicacaoSelecionada([{ id: "1", publicado: true, imagem_url: null }], ["1"], false)).toBeNull();
  });
  it("não publica uma receita sem imagem", () => {
    expect(validarPublicacaoSelecionada([{ id: "1", publicado: false, imagem_url: null }], ["1"], true)).toMatch(/imagem/);
  });
  it("não aceita seleção parcialmente ausente", () => {
    expect(validarPublicacaoSelecionada([], ["1"], false)).toMatch(/Atualize/);
  });
  it("não altera receitas que já estão no estado solicitado", () => {
    expect(validarPublicacaoSelecionada([{ id: "1", publicado: false, imagem_url: "foto.jpg" }], ["1"], false)).toMatch(/Atualize/);
  });
});