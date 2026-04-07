export type PlanStatus = 'draft' | 'ready' | 'published' | 'archived';
export type VisibilityScope = 'private' | 'organization' | 'company';

export interface TeachingPlan {
  id: string;
  organization_id: string;
  owner_profile_id: string;
  source_plan_id: string | null;
  source_template_id: string | null;
  source_version: string | null;
  title: string;
  region_code: string;
  module_code: string;
  academic_year: string;
  visibility_scope: VisibilityScope;
  status: PlanStatus;
  imported_at: string | null;
  created_at: string;
}

export interface PlanRA {
  id: string;
  plan_id: string;
  code: string;
  description: string;
  weight_global: number;
  active_t1: boolean;
  active_t2: boolean;
  active_t3: boolean;
  created_at: string;
  // Nested
  ces?: PlanCE[];
}

export interface PlanCE {
  id: string;
  plan_ra_id: string;
  code: string;
  description: string;
  weight_in_ra: number;
  created_at: string;
}

export interface TeachingPlanFull extends TeachingPlan {
  ras: PlanRA[];
}
