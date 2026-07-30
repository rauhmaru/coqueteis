import { describe, expect, it } from "vitest";
import { calcularAbv, classificarAbv, sugerirIngrediente, type Componente } from "./abv";

const c = (nome: string, ml: number, abv: number): Componente => ({ id: nome, nome, ml, abv });

describe("calcularAbv", () => {
  it("retorna zero para mistura vazia", () => {
    const r = calcularAbv([], 0);
    expect(r.abv).toBe(0);
    expect(r.volumeTotal).toBe(0);
  });

  it("mantém o teor do destilado puro", () => {
    const r = calcularAbv([c("vodka", 50, 40)], 0);
    expect(r.abv).toBe(40);
    expect(r.alcoolPuro).toBe(20);
  });

  it("dilui ao misturar com sucos", () => {
    const r = calcularAbv([c("vodka", 50, 40), c("suco", 150, 0)], 0);
    expect(r.abv).toBe(10);
    expect(r.volumeTotal).toBe(200);
  });

  it("aplica a diluição do gelo", () => {
    const r = calcularAbv([c("vodka", 50, 40)], 0.25);
    expect(r.volumeTotal).toBe(62.5);
    expect(r.abv).toBe(32);
  });

  it("calcula doses padrão", () => {
    const r = calcularAbv([c("gin", 50, 40)], 0);
    expect(r.doses).toBeCloseTo(1.13, 2);
  });

  it("ignora valores negativos ou inválidos", () => {
    const r = calcularAbv([c("x", -10, 40), c("y", 50, 200)], 0);
    expect(r.volumeTotal).toBe(50);
    expect(r.abv).toBeLessThanOrEqual(96);
  });
});

describe("sugerirIngrediente", () => {
  it("reconhece destilados com acento", () => {
    expect(sugerirIngrediente("Cachaça artesanal").abv).toBe(40);
  });
  it("reconhece itens sem álcool", () => {
    expect(sugerirIngrediente("Suco de limão").abv).toBe(0);
    expect(sugerirIngrediente("Água tônica").abv).toBe(0);
  });
  it("reconhece vermute", () => {
    expect(sugerirIngrediente("Vermute tinto").abv).toBe(16);
  });
  it("usa padrão neutro para desconhecidos", () => {
    expect(sugerirIngrediente("ingrediente misterioso")).toEqual({ abv: 0, ml: 30 });
  });
});

describe("classificarAbv", () => {
  it("classifica faixas", () => {
    expect(classificarAbv(0).rotulo).toBe("Sem álcool");
    expect(classificarAbv(5).rotulo).toBe("Leve");
    expect(classificarAbv(14).rotulo).toBe("Moderado");
    expect(classificarAbv(25).rotulo).toBe("Forte");
    expect(classificarAbv(40).rotulo).toBe("Muito forte");
  });
});
