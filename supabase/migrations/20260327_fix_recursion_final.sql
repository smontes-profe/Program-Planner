-- 1. Function to check membership without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.check_user_membership(p_organization_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organization_memberships 
    WHERE organization_id = p_organization_id 
      AND profile_id = auth.uid() 
      AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update policies to use the SECURITY DEFINER function
DROP POLICY IF EXISTS "members_can_read_memberships_fixed" ON public.organization_memberships;
DROP POLICY IF EXISTS "org_managers_can_manage_memberships_fixed" ON public.organization_memberships;
DROP POLICY IF EXISTS "members_can_read_organization" ON public.organizations;
DROP POLICY IF EXISTS "members_can_read_memberships" ON public.organization_memberships;
DROP POLICY IF EXISTS "org_managers_can_manage_memberships" ON public.organization_memberships;

-- For organization_memberships: 
-- You can read YOUR OWN membership without the function (no recursion)
-- You can read OTHERS in the same org using the function
CREATE POLICY "memberships_select_policy" ON public.organization_memberships
    FOR SELECT TO authenticated
    USING (
        (profile_id = auth.uid()) 
        OR 
        public.check_user_membership(organization_id)
        OR 
        public.is_platform_admin()
    );

CREATE POLICY "memberships_manage_policy" ON public.organization_memberships
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

-- Also update organizations policy to avoid recursion if it triggers membership check
DROP POLICY IF EXISTS "members_can_read_organization" ON public.organizations;
CREATE POLICY "organizations_select_policy" ON public.organizations
    FOR SELECT TO authenticated
    USING (
        public.check_user_membership(id)
        OR 
        public.is_platform_admin()
    );
