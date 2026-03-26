-- 1. Initial Foundation Schema (Profiles, Organizations, Memberships, Regions)

-- Enable extension for gen_random_uuid
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Regions Catalog
CREATE TABLE public.regions (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Regions (Spain Autonomous Communities)
INSERT INTO public.regions (code, name) VALUES
('AND', 'Andalucía'),
('ARA', 'Aragón'),
('AST', 'Asturias'),
('BAL', 'Baleares'),
('CAN', 'Canarias'),
('CNT', 'Cantabria'),
('CYL', 'Castilla y León'),
('CLM', 'Castilla-La Mancha'),
('CAT', 'Cataluña'),
('VAL', 'Comunidad Valenciana'),
('EXT', 'Extremadura'),
('GAL', 'Galicia'),
('MAD', 'Madrid'),
('MUR', 'Murcia'),
('NAV', 'Navarra'),
('PVA', 'País Vasco'),
('RIO', 'La Rioja'),
('CEU', 'Ceuta'),
('MEL', 'Melilla');

-- Organizations
CREATE TABLE public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    is_platform_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization Memberships
CREATE TABLE public.organization_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_in_org TEXT NOT NULL CHECK (role_in_org IN ('org_manager', 'teacher')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (organization_id, profile_id)
);

-- Function to handle new user signup and create a profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS for all tables
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;

-- Helper Functions for RLS
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_platform_admin = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. RLS Policies

-- Regions (Read-only for all authenticated users)
CREATE POLICY "authenticated_can_read_regions" ON public.regions
    FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "platform_admin_can_manage_regions" ON public.regions
    USING (public.is_platform_admin());

-- Profiles
CREATE POLICY "users_can_read_own_profile" ON public.profiles
    FOR SELECT TO authenticated USING (id = auth.uid());

CREATE POLICY "users_can_update_own_profile" ON public.profiles
    FOR UPDATE TO authenticated USING (id = auth.uid());

CREATE POLICY "platform_admin_can_manage_profiles" ON public.profiles
    USING (public.is_platform_admin());

-- Organizations
CREATE POLICY "members_can_read_organization" ON public.organizations
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_memberships 
            WHERE organization_id = organizations.id AND profile_id = auth.uid() AND is_active = TRUE
        )
        OR public.is_platform_admin()
    );

CREATE POLICY "platform_admin_can_manage_organizations" ON public.organizations
    USING (public.is_platform_admin());

-- Organization Memberships
CREATE POLICY "members_can_read_memberships" ON public.organization_memberships
    FOR SELECT TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_memberships 
            WHERE profile_id = auth.uid() AND is_active = TRUE
        )
        OR public.is_platform_admin()
    );

CREATE POLICY "org_managers_can_manage_memberships" ON public.organization_memberships
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_memberships 
            WHERE organization_id = organization_memberships.organization_id 
              AND profile_id = auth.uid() 
              AND role_in_org = 'org_manager' 
              AND is_active = TRUE
        )
        OR public.is_platform_admin()
    );
