-- Phase 3A: Expand plan_ra with per-trimester weight targets
-- Date: 2026-04-07

-- Replace single weight_in_plan with explicit per-trimester targets + global
-- No data to migrate (table was empty)
ALTER TABLE public.plan_ra
  DROP COLUMN IF EXISTS weight_in_plan;

ALTER TABLE public.plan_ra
  ADD COLUMN weight_global NUMERIC(5,2) NOT NULL DEFAULT 0
    CHECK (weight_global >= 0 AND weight_global <= 100),
  ADD COLUMN weight_t1 NUMERIC(5,2) NOT NULL DEFAULT 0
    CHECK (weight_t1 >= 0 AND weight_t1 <= 100),
  ADD COLUMN weight_t2 NUMERIC(5,2) NOT NULL DEFAULT 0
    CHECK (weight_t2 >= 0 AND weight_t2 <= 100),
  ADD COLUMN weight_t3 NUMERIC(5,2) NOT NULL DEFAULT 0
    CHECK (weight_t3 >= 0 AND weight_t3 <= 100);
