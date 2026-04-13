-- Phase 3B: RA coverage percent on instruments + CE weight automation flag
-- Date: 2026-04-09

-- ─── 1. Add ce_weight_auto flag to teaching_plans ──────────────────────────
-- When TRUE, CE weights inside each RA are defined once in the Pesos tab
-- and inherited automatically by every instrument that covers that RA.
ALTER TABLE public.teaching_plans
  ADD COLUMN IF NOT EXISTS ce_weight_auto BOOLEAN NOT NULL DEFAULT false;

-- ─── 2. Add coverage_percent to plan_instrument_ra ─────────────────────────
-- Stores what percentage of the RA's final grade this instrument represents.
-- Example: instrument covers 20% of RA1 → coverage_percent = 20
ALTER TABLE public.plan_instrument_ra
  ADD COLUMN IF NOT EXISTS coverage_percent NUMERIC(5,2) NOT NULL DEFAULT 0
    CHECK (coverage_percent >= 0 AND coverage_percent <= 100);

-- ─── 3. Add type 'activity' to plan_instrument if not already allowed ──────
-- The original CHECK only allowed exam|practice|project|oral|other.
-- We need to also allow 'activity'.
ALTER TABLE public.plan_instrument
  DROP CONSTRAINT IF EXISTS plan_instrument_type_check;

ALTER TABLE public.plan_instrument
  ADD CONSTRAINT plan_instrument_type_check
    CHECK (type IN ('exam', 'practice', 'project', 'oral', 'activity', 'other'));
