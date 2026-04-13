-- Fix infinite recursion in memberships_manage_policy

CREATE OR REPLACE FUNCTION public.is_org_manager(p_organization_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organization_memberships 
    WHERE organization_id = p_organization_id 
      AND profile_id = auth.uid() 
      AND role_in_org = 'org_manager'
      AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP POLICY IF EXISTS "memberships_manage_policy" ON public.organization_memberships;
CREATE POLICY "memberships_manage_policy" ON public.organization_memberships
    FOR ALL TO authenticated
    USING (
        public.is_org_manager(organization_id)
        OR 
        public.is_platform_admin()
    );
