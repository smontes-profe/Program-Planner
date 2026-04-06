-- Update curriculum template policies to use the membership function
DROP POLICY IF EXISTS "templates_read_policy" ON public.curriculum_templates;
DROP POLICY IF EXISTS "templates_insert_policy" ON public.curriculum_templates;
DROP POLICY IF EXISTS "templates_manage_policy" ON public.curriculum_templates;

-- Use function for template visibility checks
CREATE POLICY "templates_select_policy" ON public.curriculum_templates
    FOR SELECT TO authenticated
    USING (
        public.is_platform_admin()
        OR visibility_scope = 'company'
        OR public.check_user_membership(organization_id)
        OR (visibility_scope = 'private' AND created_by_profile_id = auth.uid())
    );

CREATE POLICY "templates_insert_policy" ON public.curriculum_templates
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_platform_admin()
        OR public.check_user_membership(organization_id)
    );

CREATE POLICY "templates_manage_policy" ON public.curriculum_templates
    FOR ALL TO authenticated
    USING (
        public.is_platform_admin()
        OR (created_by_profile_id = auth.uid() AND status = 'draft')
        OR (organization_id IN (
            SELECT m.organization_id 
            FROM public.organization_memberships m 
            WHERE m.profile_id = auth.uid() 
              AND m.role_in_org = 'org_manager' 
              AND m.is_active = TRUE
        ))
    );
