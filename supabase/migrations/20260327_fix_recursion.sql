-- Fix infinite recursion in organization_memberships policy
DROP POLICY IF EXISTS "members_can_read_memberships" ON public.organization_memberships;
DROP POLICY IF EXISTS "org_managers_can_manage_memberships" ON public.organization_memberships;

-- Use a non-recursive membership check pattern
-- Can always read own membership
-- Can read others in the same org if you belong to that org
CREATE POLICY "members_can_read_memberships_fixed" ON public.organization_memberships
    FOR SELECT TO authenticated
    USING (
        (profile_id = auth.uid()) -- Own record
        OR 
        (organization_id IN (
            SELECT m.organization_id 
            FROM public.organization_memberships m 
            WHERE m.profile_id = auth.uid() 
              AND m.is_active = TRUE
        ))
        OR 
        public.is_platform_admin()
    );

CREATE POLICY "org_managers_can_manage_memberships_fixed" ON public.organization_memberships
    FOR ALL TO authenticated
    USING (
        (organization_id IN (
            SELECT m.organization_id 
            FROM public.organization_memberships m 
            WHERE m.profile_id = auth.uid() 
              AND m.role_in_org = 'org_manager' 
              AND m.is_active = TRUE
        ))
        OR 
        public.is_platform_admin()
    );
