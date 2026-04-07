-- Replace weight_t1/t2/t3 with active_t1/t2/t3 boolean flags on plan_ra
-- Trimester weights are now computed on the client, not stored.
-- Date: 2026-04-07

ALTER TABLE public.plan_ra
  DROP COLUMN IF EXISTS weight_t1,
  DROP COLUMN IF EXISTS weight_t2,
  DROP COLUMN IF EXISTS weight_t3,
  ADD COLUMN active_t1 BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN active_t2 BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN active_t3 BOOLEAN NOT NULL DEFAULT false;
