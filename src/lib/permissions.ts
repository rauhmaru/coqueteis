/**
 * Regras de autorização de posse (client-side).
 *
 * Defesa em profundidade: as mesmas regras são reforçadas por RLS no banco.
 * Aqui usamos apenas para esconder/mostrar botões e para gates de rota.
 */

export type AuthLike = {
  user: { id: string } | null | undefined;
  isAdmin: boolean;
  canEdit?: boolean;
};

export type Ownable = { created_by: string | null | undefined };

/**
 * Retorna true se o usuário autenticado pode editar/remover o item.
 * - Admin: sempre pode.
 * - Dono (created_by === user.id): pode.
 * - Anônimo, outro usuário, item sem dono: não pode.
 */
export function canManageItem(auth: AuthLike, item: Ownable | null | undefined): boolean {
  if (!item) return false;
  if (!auth.user) return false;
  if (auth.canEdit === false) return false;
  if (auth.isAdmin) return true;
  if (!item.created_by) return false;
  return item.created_by === auth.user.id;
}
