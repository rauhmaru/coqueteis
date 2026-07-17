import { describe, it, expect } from "vitest";
import { canManageItem } from "./permissions";

const admin = { user: { id: "admin-1" }, isAdmin: true, canEdit: true };
const owner = { user: { id: "user-owner" }, isAdmin: false, canEdit: true };
const other = { user: { id: "user-other" }, isAdmin: false, canEdit: true };
const anon = { user: null, isAdmin: false, canEdit: false };

const drinkDoOwner = { created_by: "user-owner" };
const drinkSemDono = { created_by: null };

describe("canManageItem — posse de receitas e ingredientes", () => {
  it("dono pode gerenciar seu próprio item", () => {
    expect(canManageItem(owner, drinkDoOwner)).toBe(true);
  });

  it("admin pode gerenciar item de qualquer usuário", () => {
    expect(canManageItem(admin, drinkDoOwner)).toBe(true);
  });

  it("admin pode gerenciar item sem dono (legado)", () => {
    expect(canManageItem(admin, drinkSemDono)).toBe(true);
  });

  it("outro usuário autenticado NÃO pode gerenciar item alheio", () => {
    expect(canManageItem(other, drinkDoOwner)).toBe(false);
  });

  it("usuário comum NÃO pode gerenciar item sem dono (legado)", () => {
    expect(canManageItem(owner, drinkSemDono)).toBe(false);
  });

  it("visitante anônimo NÃO pode gerenciar nada", () => {
    expect(canManageItem(anon, drinkDoOwner)).toBe(false);
    expect(canManageItem(anon, drinkSemDono)).toBe(false);
  });

  it("item nulo/indefinido retorna false", () => {
    expect(canManageItem(admin, null)).toBe(false);
    expect(canManageItem(owner, undefined)).toBe(false);
  });

  it("mesmo com isAdmin=true, sem usuário autenticado retorna false", () => {
    expect(canManageItem({ user: null, isAdmin: true }, drinkDoOwner)).toBe(false);
  });

  it("aplica-se identicamente a ingredientes", () => {
    const ingredienteDoOwner = { created_by: "user-owner", nome: "Gin" };
    const ingredienteDeOutro = { created_by: "user-other", nome: "Rum" };
    expect(canManageItem(owner, ingredienteDoOwner)).toBe(true);
    expect(canManageItem(owner, ingredienteDeOutro)).toBe(false);
    expect(canManageItem(admin, ingredienteDeOutro)).toBe(true);
    expect(canManageItem(other, ingredienteDoOwner)).toBe(false);
  });
});
