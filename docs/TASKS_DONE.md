# Program Planner - Finished Tasks repository

(to see the pending and onging tasks, check the TASKS.md file).

## Phase 0 - Foundation and Decision Lock

- [x] Define baseline docs (`SPECS`, `ARCHITECTURE`, `AGENTS`, `TASKS`).
- [x] Add stack, CI/CD, MCP, and diagrams docs.
- [x] Lock architecture decisions D1-D8 (single DB + org model + visibility scopes + role model).
- [x] Add Next.js agent operating skills guide.
- [x] Add local reusable skill package (`skills/nextjs-agent-ops`).
- [x] Add local reusable security skill package (`skills/supabase-rls-ops`).
- [x] Add local reusable testing skill package (`skills/nextjs-testing-ops`).
- [x] Add PR template with responsive/a11y/usability checklist.
- [x] Add CI quality-gates workflow scaffold for `test:a11y` and `test:responsive`.
- [x] Define responsive layout baseline (`320`, `768`, `1280` breakpoints).
- [x] Define accessibility acceptance checklist for core flows.
- [x] Define usability standards for loading, error, and empty states.
- [x] Initialize Next.js 15 project (App Router, TypeScript strict).
- [x] Configure Tailwind CSS + shadcn/ui + lucide-react.
- [x] Configure Vitest with first domain test.
- [x] Configure ESLint + Prettier + import sorting.

## Phase 1 - Organization and Access Foundation

- [x] Create SQL schema for `organizations`.
- [x] Create SQL schema for `organization_memberships`.
- [x] Create SQL schema for `profiles` with `is_platform_admin`.
- [x] Implement region catalog and `academic_year` normalization constraints.
- [x] Implement RLS base policies for:
  - platform admin global access
  - org manager organization access
  - teacher own/write access

## Phase 2 - Curriculum Templates

- [x] Implement `curriculum_templates` schema with unique version key.
- [x] Implement `template_ra` and `template_ce`.
- [x] Implement immutability triggers (published/deprecated templates).
- [x] Implement template status flow (`draft`, `published`, `deprecated`).
- [x] Build template CRUD and publish flow.

## Phase 1.5 - Auth UI & Access Security

- [x] Implement login/signup flow with Supabase Auth.
- [x] Implement initial organization creation/assignment for new users.
- [x] Fix: Apply missing database migrations (profiles, organizations, memberships).
- [x] Add session middleware for protected routes.

### Phase 1.6 - Auth Hardening (Urgente Producción)

- [x] Corregir registro con email ya existente: no mostrar éxito falso cuando `signUp` no crea una cuenta usable.
- [-] Implementar recuperación de contraseña funcional (flujo completo de solicitud + actualización) o degradar explícitamente como `WIP` si hay bloqueo técnico real.
- [x] Habilitar espacio para usuarios autenticados donde puedan cambiar su contraseña de forma segura.

### Phase 1.7 - Acceso Gestionado por Admin (Crítico)

- [x] Convertir el registro público en "Solicitar acceso" (nombre, email, contraseña solicitada) y retirar el alta directa desde login.
- [x] Asignar `platform_admin` al usuario `smontes@ilerna.com` para gestión centralizada.
- [x] Implementar tabla `access_requests` y flujo de revisión (pendiente, aprobada, rechazada).
- [x] Crear panel de administración para revisar solicitudes y aprobar/rechazar.
- [x] En aprobación, crear usuario y permitir asignar tipo de cuenta (`admin` o `usuario normal`) y organización de destino.
- [x] Añadir listado de usuarios existentes en panel admin y permitir cambiar privilegio de `platform_admin`.
- [-] Revisar notificaciones por email para nuevas solicitudes y resolución (si no es viable ahora, dejarlo explicitado como pendiente).
- [x] Corregir cierre de sesión en navbar (asegurar ejecución real del `signOutAction`).
- [x] Permitir alta directa de usuarios desde panel admin (nombre, email, contraseña, tipo de cuenta y organización).
- [x] Corregir warning Base UI en `request-access` por cambio de `defaultValue` en campos no controlados tras submit.
- [x] En aprobación de solicitudes, permitir dejar en blanco el reemplazo de contraseña para mantener la contraseña solicitada originalmente.

## Phase 2.5 - Curriculum Fixes and improvements

- [x] No se puede editar ni eliminar un RA ya creado.
- [x] Cuando intento guardar un CE nuevo asociado a un RA, sale este error: Error al añadir CE: Could not find the 'ra_id' column of 'template_ce' in the schema cache.
- [x] Debe de poder hacerse CRUD de criterios de evaluación para un RA. Ahora mismo solo se pueden crear. no se pueden editar ni eliminar.
- [x] EN la vista de un RA, además del botón de"Añadir Criterio", debería haber un "Añadir criterios" que permita añadir varios Criterios a la vez. El sistema debe identificar cuando hay un patrón típico de nombre de criterior (ej. "a) ","b) ".., separar usando esos patrones, usar el patrón ("a", "b") como código del criterio y luego el texto siguiente como la descripción. Por ejemplo, si pego "a) Se han caracterizado y diferenciado los modelos de ejecución de código en el servidor y en el cliente web. b) Se han identificado las capacidades y mecanismos de ejecución de código de los navegadores web." debería crear dos criterios, uno con código "a" y descripción "Se han caracterizado y diferenciado los modelos de ejecución de código en el servidor y en el cliente web." y otro con código "b" y descripción "Se han identificado las capacidades y mecanismos de ejecución de código de los navegadores web."
- [x] Permitir añadir RRAAs (y sus CCEE) en bloque de acuerdo a @specs.md (### Añadiendo RRAA en bloque).
- [x] El botón de elimimnar un RA: habría que asegurar que se puede eliminar un RA y sus CCEE asociados.
- [x] En la vista de un currículo, el botón de "Editar datos" no funciona.Intenta ir a "/edit" pero la página no existe.

## Phase 2.6 - Curriculum Refactoring (Pedagogical Alignment)

- [x] Remove weight-based constraints from curriculum templates (RAs and CEs).
- [x] Update domain schemas and types to remove weight fields.
- [x] Relax immutability of published templates to allow for corrections.
- [x] Simplify curriculum UI: remove weight displays and inputs.
- [x] Enable curriculum deletion if no active teaching plans are dependent on it.
- [x] Update ARCHITECTURE.md and ERD to reflect the decoupled model.

### Phase 3A - Plan Base + Resumen de Pesos ✅

- [x] Implement plan RA/CE CRUD (cloned from template via deep copy).
- [x] Implement global weight assignment for RAs in the teaching plan.
- [x] Implement trimester presence flags (active_t1/t2/t3) with auto-computed weights.
- [x] `/plans` list page with plan cards and status.
- [x] `/plans/[id]` detail page with Currículo tab (editable RA/CE clone) and Pesos tab.
- [x] Enable homepage link to /plans.

### Phase 3B - Unidades de Trabajo e Instrumentos

- [x] Implement `plan_teaching_unit` schema with trimester assignment and hours field.
- [x] Implement `plan_unit_ra` coverage table (which RAs a UT covers).
- [x] `/plans/[id]` tab: Unidades de Trabajo (CRUD + RA/CE assignment per UT).
- [x] Implement `evaluation_instruments` schema linked to a UT (Already done in migration).
- [x] Implement `instrument_ce_weight` (which CEs an instrument covers and with what %) (Already done in migration).
- [x] `/plans/[id]` tab: Instrumentos (CRUD + CE weight assignment per instrument).
- [x] Añadir en la edición de instrumentos la entrada de porcentaje por RA cubierta y exigir que los porcentajes de CE dentro de cada RA sumen 100 % para poder derivar la aportación a cada CE.
- [x] Añadir la opción “Automatizar pesos de CEs” en el tab de Pesos: permitir fijar la distribución por CE dentro de cada RA, validar que suma 100 % y que los instrumentos hereden esos pesos cuando está activada.
- [x] Computed weights panel: target vs. real comparison per RA (global + per trimester).

### Phase 3.5 - Teaching Plan Fixes and UX Improvements

- [x] Validar que al menos un trimestre esté seleccionado al crear una UT. Actualmente lanza un error de base de datos (`at_least_one_trimester_chk`) en inglés. El error debe ser descriptivo, en castellano y preservar los datos del formulario.

- [x] Simplificar estados de programación a `draft` y `published` (eliminar `ready` y `archived` del MVP):
  - [x] Actualizar constraint DB de `status` a solo `draft` | `published`.
  - [x] Actualizar tipo TypeScript `PlanStatus` y schema Zod.
  - [x] Server Action `publishPlan(planId)`: cambia `draft → published`. No requiere validación bloqueante de invariantes.
  - [x] Server Action `unpublishPlan(planId)`: cambia `published → draft`.
  - [x] Una programación `published` es visible y seleccionable desde el módulo de Evaluaciones.
  - [x] Una programación `published` se puede seguir editando sin cambiar su estado (los cambios de peso se recalculan sobre todas las notas existentes — ver nota de Opción B a futuro).
  - [x] Panel de avisos en la vista de programación que muestre:
- [x] Botones de publicar/despublicar en la vista de detalle del plan.
  - [x] Actualizar badges de status en lista y detalle (solo `draft` = "Borrador", `published` = "Publicada").
- [x] BUGFIX for github action
