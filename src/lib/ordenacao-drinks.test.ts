import { describe, expect, it } from "vitest";
import { nomeDaOrdem, ordemDrinksValida } from "./ordenacao-drinks";

describe("ordenação de drinks", () => {
  it("reconhece a ordem por adição recente na URL e no seletor", () => {
    expect(ordemDrinksValida("recentes")).toBe("recentes");
    expect(nomeDaOrdem("recentes")).toBe("Adicionados recentemente");
  });
});