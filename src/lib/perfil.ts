import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Dose de referência padrão (ml) usada quando o perfil não define outra. */
export const DOSE_PADRAO_ML = 50;

export type Perfil = { id: string; display_name: string | null; dose_ml: number };

export const perfilQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["perfil", userId],
    enabled: !!userId,
    queryFn: async (): Promise<Perfil | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, dose_ml")
        .eq("id", userId!)
        .maybeSingle();
      if (error) throw error;
      return (data as Perfil | null) ?? null;
    },
  });

export async function salvarDoseMl(userId: string, doseMl: number) {
  const { error } = await supabase.from("profiles").update({ dose_ml: doseMl }).eq("id", userId);
  if (error) throw error;
}
