"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase";
import { createPlanSchema, updatePlanSchema, updatePlanRAConfigSchema, planRASchema, planCESchema } from "./schemas";
import { type TeachingPlan, type TeachingPlanFull, type PlanRA, type PlanCE } from "./types";

export type ActionResponse<T = any> =
  | { ok: true; data: T }
  | { ok: false; error: string; details?: any };

// ─────────────────────────────────────────────
// LIST
// ─────────────────────────────────────────────

/**
 * List all teaching plans owned by the current user
 */
export async function listPlans(): Promise<ActionResponse<TeachingPlan[]>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Usuario no autenticado" };

  const { data, error } = await supabase
    .from("teaching_plans")
    .select("*")
    .eq("owner_profile_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as TeachingPlan[] };
}

/**
 * Get a single teaching plan with its full RA/CE structure
 */
export async function getPlan(planId: string): Promise<ActionResponse<TeachingPlanFull>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("teaching_plans")
    .select(`
      *,
      ras:plan_ra (
        *,
        ces:plan_ce (*)
      )
    `)
    .eq("id", planId)
    .single();

  if (error || !data) return { ok: false, error: "Plan no encontrado" };
  return { ok: true, data: data as TeachingPlanFull };
}

// ─────────────────────────────────────────────
// CREATE (import from template — deep copy)
// ─────────────────────────────────────────────

/**
 * Create a new Teaching Plan by deep-copying a published curriculum template
 */
export async function createPlanFromTemplate(payload: {
  title: string;
  source_template_id: string;
  academic_year: string;
  visibility_scope: "private" | "organization" | "company";
}): Promise<ActionResponse<TeachingPlan>> {
  const validated = createPlanSchema.safeParse(payload);
  if (!validated.success) {
    return { ok: false, error: "Datos inválidos", details: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Usuario no autenticado" };

  // Get user's organization
  const { data: membership } = await supabase
    .from("organization_memberships")
    .select("organization_id")
    .eq("profile_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .single();

  if (!membership) return { ok: false, error: "No perteneces a ninguna organización" };

  // Fetch the source template with its RAs and CEs
  const { data: template, error: templateError } = await supabase
    .from("curriculum_templates")
    .select(`
      *,
      ras:template_ra (
        *,
        ces:template_ce (*)
      )
    `)
    .eq("id", validated.data.source_template_id)
    .eq("status", "published")
    .single();

  if (templateError || !template) {
    return { ok: false, error: "Currículo no encontrado o no está publicado" };
  }

  // 1. Create the teaching plan
  const { data: plan, error: planError } = await supabase
    .from("teaching_plans")
    .insert({
      organization_id: membership.organization_id,
      owner_profile_id: user.id,
      source_template_id: template.id,
      source_version: template.version,
      title: validated.data.title,
      region_code: template.region_code,
      module_code: template.module_code,
      academic_year: validated.data.academic_year,
      visibility_scope: validated.data.visibility_scope,
      status: "draft",
      imported_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (planError || !plan) {
    return { ok: false, error: `Error al crear la programación: ${planError?.message}` };
  }

  // 2. Deep copy RAs and their CEs
  for (const ra of template.ras ?? []) {
    const { data: planRA, error: raError } = await supabase
      .from("plan_ra")
      .insert({
        plan_id: plan.id,
        code: ra.code,
        description: ra.description,
        weight_global: 0,
        active_t1: false,
        active_t2: false,
        active_t3: false,
      })
      .select()
      .single();

    if (raError || !planRA) {
      return { ok: false, error: `Error al copiar RA ${ra.code}: ${raError?.message}` };
    }

    for (const ce of ra.ces ?? []) {
      const { error: ceError } = await supabase
        .from("plan_ce")
        .insert({
          plan_ra_id: planRA.id,
          code: ce.code,
          description: ce.description,
          weight_in_ra: 0,
        });

      if (ceError) {
        return { ok: false, error: `Error al copiar CE ${ce.code}: ${ceError.message}` };
      }
    }
  }

  revalidatePath("/plans");
  return { ok: true, data: plan as TeachingPlan };
}

// ─────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────

export async function updatePlan(planId: string, payload: {
  title?: string;
  visibility_scope?: "private" | "organization" | "company";
  status?: "draft" | "ready" | "published" | "archived";
}): Promise<ActionResponse<TeachingPlan>> {
  const validated = updatePlanSchema.safeParse(payload);
  if (!validated.success) return { ok: false, error: "Datos inválidos" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teaching_plans")
    .update(validated.data)
    .eq("id", planId)
    .select()
    .single();

  if (error) return { ok: false, error: `Error al actualizar: ${error.message}` };
  revalidatePath(`/plans/${planId}`);
  revalidatePath("/plans");
  return { ok: true, data: data as TeachingPlan };
}

/**
 * Update the global weight and trimester presence for a single RA in the plan
 */
export async function updatePlanRAConfig(
  planId: string,
  raId: string,
  payload: { weight_global: number; active_t1: boolean; active_t2: boolean; active_t3: boolean }
): Promise<ActionResponse<PlanRA>> {
  const validated = updatePlanRAConfigSchema.safeParse(payload);
  if (!validated.success) return { ok: false, error: "Datos inválidos" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("plan_ra")
    .update(validated.data)
    .eq("id", raId)
    .eq("plan_id", planId)
    .select()
    .single();

  if (error) return { ok: false, error: `Error al actualizar RA: ${error.message}` };
  revalidatePath(`/plans/${planId}`);
  return { ok: true, data: data as PlanRA };
}

// ─────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────

export async function deletePlan(planId: string): Promise<ActionResponse> {
  const supabase = await createClient();
  const { error } = await supabase.from("teaching_plans").delete().eq("id", planId);
  if (error) return { ok: false, error: `Error al eliminar: ${error.message}` };
  revalidatePath("/plans");
  return { ok: true, data: null };
}

// ─────────────────────────────────────────────
// PLAN RA CRUD (edit the clone post-import)
// ─────────────────────────────────────────────

export async function addPlanRA(planId: string, payload: { code: string; description: string }): Promise<ActionResponse<PlanRA>> {
  const validated = planRASchema.safeParse(payload);
  if (!validated.success) return { ok: false, error: "Datos inválidos" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("plan_ra")
    .insert({ plan_id: planId, ...validated.data, weight_global: 0, weight_t1: 0, weight_t2: 0, weight_t3: 0 })
    .select()
    .single();

  if (error) return { ok: false, error: `Error al añadir RA: ${error.message}` };
  revalidatePath(`/plans/${planId}`);
  return { ok: true, data: data as PlanRA };
}

export async function updatePlanRA(planId: string, raId: string, payload: { code: string; description: string }): Promise<ActionResponse<PlanRA>> {
  const validated = planRASchema.safeParse(payload);
  if (!validated.success) return { ok: false, error: "Datos inválidos" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("plan_ra")
    .update(validated.data)
    .eq("id", raId)
    .eq("plan_id", planId)
    .select()
    .single();

  if (error) return { ok: false, error: `Error al actualizar RA: ${error.message}` };
  revalidatePath(`/plans/${planId}`);
  return { ok: true, data: data as PlanRA };
}

export async function deletePlanRA(planId: string, raId: string): Promise<ActionResponse> {
  const supabase = await createClient();
  const { error } = await supabase.from("plan_ra").delete().eq("id", raId).eq("plan_id", planId);
  if (error) return { ok: false, error: `Error al eliminar RA: ${error.message}` };
  revalidatePath(`/plans/${planId}`);
  return { ok: true, data: null };
}

// ─────────────────────────────────────────────
// PLAN CE CRUD
// ─────────────────────────────────────────────

export async function addPlanCE(planId: string, raId: string, payload: { code: string; description: string }): Promise<ActionResponse<PlanCE>> {
  const validated = planCESchema.safeParse({ ...payload, weight_in_ra: 0 });
  if (!validated.success) return { ok: false, error: "Datos inválidos" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("plan_ce")
    .insert({ plan_ra_id: raId, ...validated.data })
    .select()
    .single();

  if (error) return { ok: false, error: `Error al añadir CE: ${error.message}` };
  revalidatePath(`/plans/${planId}`);
  return { ok: true, data: data as PlanCE };
}

export async function updatePlanCE(planId: string, ceId: string, payload: { code: string; description: string }): Promise<ActionResponse<PlanCE>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("plan_ce")
    .update({ code: payload.code, description: payload.description })
    .eq("id", ceId)
    .select()
    .single();

  if (error) return { ok: false, error: `Error al actualizar CE: ${error.message}` };
  revalidatePath(`/plans/${planId}`);
  return { ok: true, data: data as PlanCE };
}

export async function deletePlanCE(planId: string, ceId: string): Promise<ActionResponse> {
  const supabase = await createClient();
  const { error } = await supabase.from("plan_ce").delete().eq("id", ceId);
  if (error) return { ok: false, error: `Error al eliminar CE: ${error.message}` };
  revalidatePath(`/plans/${planId}`);
  return { ok: true, data: null };
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

/**
 * List published templates available to the current user for import
 */
export async function listPublishedTemplates(): Promise<ActionResponse<any[]>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("curriculum_templates")
    .select("id, module_name, module_code, academic_year, version, region_code, organization_id, visibility_scope")
    .eq("status", "published")
    .order("module_name");

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}
