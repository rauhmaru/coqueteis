ALTER TABLE public.drink_ingredientes
  ADD COLUMN IF NOT EXISTS unidade text NOT NULL DEFAULT 'ml';

ALTER TABLE public.drink_ingredientes
  DROP CONSTRAINT IF EXISTS drink_ingredientes_unidade_check;

ALTER TABLE public.drink_ingredientes
  ADD CONSTRAINT drink_ingredientes_unidade_check
  CHECK (unidade IN ('ml','g','unidade','colher_cha','colher_sopa','fatia','folha','dash','a_gosto'));