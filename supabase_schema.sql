-- ============================================================================
-- Daags Digital Concept — Complete Supabase PostgreSQL Schema & Seed Data
-- Run this entire script in the Supabase SQL Editor (Dashboard -> SQL Editor).
-- Safe to re-run (idempotent tables, columns, policies, and seed rows).
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. TABLES
-- ============================================================================

-- 1.1 SITE SETTINGS (Brand, Logo, Contacts, Business Schedule, Hero Slides)
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_name TEXT NOT NULL DEFAULT 'Daags Digital Concept',
  logo_url TEXT NOT NULL DEFAULT '',
  tagline TEXT NOT NULL DEFAULT 'Your trusted partner for professional digital solutions and reliable business support.',
  phone TEXT NOT NULL DEFAULT '08168779732',
  whatsapp TEXT NOT NULL DEFAULT '2348168779732',
  email TEXT NOT NULL DEFAULT 'daagsdigitalconcept@gmail.com',
  address TEXT NOT NULL DEFAULT 'Suite 24, Victoria Plaza, Lagos & Nationwide Digital Support Desk, Nigeria',
  business_hours TEXT NOT NULL DEFAULT 'Mon – Fri: 8:00 AM – 6:00 PM · Sat: 9:00 AM – 4:00 PM · Sun: Off Day',
  business_schedule JSONB NOT NULL DEFAULT '[]'::jsonb,
  contact_persons JSONB NOT NULL DEFAULT '[]'::jsonb,
  footer_text TEXT NOT NULL DEFAULT '© 2026 Daags Digital Concept. All rights reserved. Trusted Digital & Business Support Across Nigeria.',
  hero_slides JSONB NOT NULL DEFAULT '[]'::jsonb,
  typewriter_phrases JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure newer columns exist if site_settings was created previously
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS logo_url TEXT NOT NULL DEFAULT '';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS business_schedule JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS contact_persons JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS hero_slides JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS typewriter_phrases JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 1.2 PAGE SECTIONS (100% Editable Website Copy & Media)
CREATE TABLE IF NOT EXISTS public.page_sections (
  id TEXT PRIMARY KEY,
  page_key TEXT NOT NULL,
  section_key TEXT NOT NULL,
  label TEXT NOT NULL,
  heading TEXT NOT NULL DEFAULT '',
  subheading TEXT NOT NULL DEFAULT '',
  body_content TEXT NOT NULL DEFAULT '',
  cta_text TEXT NOT NULL DEFAULT '',
  cta_link TEXT NOT NULL DEFAULT '',
  secondary_cta_text TEXT NOT NULL DEFAULT '',
  secondary_cta_link TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  cards_array JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.3 SERVICE CATEGORIES
CREATE TABLE IF NOT EXISTS public.service_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  icon_name TEXT NOT NULL DEFAULT 'Briefcase',
  display_order INTEGER NOT NULL DEFAULT 1,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.4 SUB-SERVICES (With Dual Pricing & Promo Flags)
CREATE TABLE IF NOT EXISTS public.sub_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES public.service_categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  short_description TEXT NOT NULL DEFAULT '',
  deliverables JSONB NOT NULL DEFAULT '[]'::jsonb,
  original_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  ongoing_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  promo_label TEXT NOT NULL DEFAULT 'Limited Offer',
  is_placeholder_price BOOLEAN NOT NULL DEFAULT FALSE,
  turnaround_time TEXT NOT NULL DEFAULT '2 – 5 Business Days',
  image_url TEXT NOT NULL DEFAULT '',
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.5 PORTFOLIO PROJECTS
CREATE TABLE IF NOT EXISTS public.portfolio_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  client_name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  outcome_metric TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  live_url TEXT NOT NULL DEFAULT '',
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.6 FAQS
CREATE TABLE IF NOT EXISTS public.faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  display_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.7 CUSTOMER INQUIRIES CRM
CREATE TABLE IF NOT EXISTS public.inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  service_category TEXT NOT NULL DEFAULT '',
  sub_service TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.8 ADMIN USERS & GRANULAR ROLE DELEGATION
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'delegated_admin' CHECK (role IN ('super_admin', 'delegated_admin')),
  role_title TEXT NOT NULL DEFAULT 'Operations Assistant',
  permissions JSONB NOT NULL DEFAULT '{
    "manage_inquiries": true,
    "manage_services": false,
    "edit_site_content": false,
    "manage_portfolio": false,
    "manage_faqs": false
  }'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. AUTOMATIC UPDATED_AT TRIGGER
-- ============================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER trg_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_page_sections_updated_at ON public.page_sections;
CREATE TRIGGER trg_page_sections_updated_at
  BEFORE UPDATE ON public.page_sections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 3. SECURITY DEFINER HELPERS & ROW LEVEL SECURITY (RLS) POLICIES
--    (Prevents 42P17 "infinite recursion detected in policy for relation admin_users")
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_active_admin(required_permission TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE LOWER(email) = LOWER(COALESCE(auth.jwt() ->> 'email', ''))
      AND is_active = true
      AND (
        role = 'super_admin'
        OR required_permission IS NULL
        OR COALESCE((permissions ->> required_permission)::boolean, false) = true
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE LOWER(email) = LOWER(COALESCE(auth.jwt() ->> 'email', ''))
      AND role = 'super_admin'
      AND is_active = true
  );
$$;

REVOKE ALL ON FUNCTION public.is_active_admin(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_super_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_active_admin(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Public Read Policies (Published Website Content)
DROP POLICY IF EXISTS "Public read site_settings" ON public.site_settings;
CREATE POLICY "Public read site_settings" ON public.site_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read page_sections" ON public.page_sections;
CREATE POLICY "Public read page_sections" ON public.page_sections FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read published categories" ON public.service_categories;
CREATE POLICY "Public read published categories" ON public.service_categories FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Public read published sub_services" ON public.sub_services;
CREATE POLICY "Public read published sub_services" ON public.sub_services FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Public read portfolio" ON public.portfolio_projects;
CREATE POLICY "Public read portfolio" ON public.portfolio_projects FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read faqs" ON public.faqs;
CREATE POLICY "Public read faqs" ON public.faqs FOR SELECT USING (true);

-- Public Lead Submission (Inquiries)
DROP POLICY IF EXISTS "Anyone can submit inquiries" ON public.inquiries;
CREATE POLICY "Anyone can submit inquiries" ON public.inquiries FOR INSERT WITH CHECK (true);

-- Authenticated Admin Full Access Policies (Non-recursive via SECURITY DEFINER functions)
DROP POLICY IF EXISTS "Admins manage site_settings" ON public.site_settings;
CREATE POLICY "Admins manage site_settings" ON public.site_settings FOR ALL TO authenticated
  USING (public.is_active_admin(NULL))
  WITH CHECK (public.is_active_admin(NULL));

DROP POLICY IF EXISTS "Admins manage page_sections" ON public.page_sections;
CREATE POLICY "Admins manage page_sections" ON public.page_sections FOR ALL TO authenticated
  USING (public.is_active_admin('edit_site_content'))
  WITH CHECK (public.is_active_admin('edit_site_content'));

DROP POLICY IF EXISTS "Admins manage categories" ON public.service_categories;
CREATE POLICY "Admins manage categories" ON public.service_categories FOR ALL TO authenticated
  USING (public.is_active_admin('manage_services'))
  WITH CHECK (public.is_active_admin('manage_services'));

DROP POLICY IF EXISTS "Admins manage sub_services" ON public.sub_services;
CREATE POLICY "Admins manage sub_services" ON public.sub_services FOR ALL TO authenticated
  USING (public.is_active_admin('manage_services'))
  WITH CHECK (public.is_active_admin('manage_services'));

DROP POLICY IF EXISTS "Admins manage portfolio" ON public.portfolio_projects;
CREATE POLICY "Admins manage portfolio" ON public.portfolio_projects FOR ALL TO authenticated
  USING (public.is_active_admin('manage_portfolio'))
  WITH CHECK (public.is_active_admin('manage_portfolio'));

DROP POLICY IF EXISTS "Admins manage faqs" ON public.faqs;
CREATE POLICY "Admins manage faqs" ON public.faqs FOR ALL TO authenticated
  USING (public.is_active_admin('manage_faqs'))
  WITH CHECK (public.is_active_admin('manage_faqs'));

DROP POLICY IF EXISTS "Admins manage inquiries" ON public.inquiries;
CREATE POLICY "Admins manage inquiries" ON public.inquiries FOR ALL TO authenticated
  USING (public.is_active_admin('manage_inquiries'))
  WITH CHECK (public.is_active_admin('manage_inquiries'));

DROP POLICY IF EXISTS "Active admins read own profile" ON public.admin_users;
CREATE POLICY "Active admins read own profile" ON public.admin_users FOR SELECT TO authenticated
  USING (LOWER(email) = LOWER(COALESCE(auth.jwt() ->> 'email', '')) OR public.is_super_admin());

DROP POLICY IF EXISTS "Super admins manage admin_users" ON public.admin_users;
CREATE POLICY "Super admins manage admin_users" ON public.admin_users FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- ============================================================================
-- 3B. SUPABASE STORAGE BUCKET FOR UPLOADED IMAGES & LOGOS (cms-media)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('cms-media', 'cms-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public read cms-media bucket" ON storage.buckets;
CREATE POLICY "Public read cms-media bucket" ON storage.buckets
  FOR SELECT USING (id = 'cms-media');

DROP POLICY IF EXISTS "Public read cms-media" ON storage.objects;
CREATE POLICY "Public read cms-media" ON storage.objects
  FOR SELECT USING (bucket_id = 'cms-media');

DROP POLICY IF EXISTS "Admins upload cms-media" ON storage.objects;
CREATE POLICY "Admins upload cms-media" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'cms-media'
    AND public.is_active_admin(NULL)
  );

DROP POLICY IF EXISTS "Admins update cms-media" ON storage.objects;
CREATE POLICY "Admins update cms-media" ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'cms-media'
    AND public.is_active_admin(NULL)
  );

DROP POLICY IF EXISTS "Admins delete cms-media" ON storage.objects;
CREATE POLICY "Admins delete cms-media" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'cms-media'
    AND public.is_active_admin(NULL)
  );

-- ============================================================================
-- 4. INITIAL SEED DATA
-- ============================================================================

INSERT INTO public.site_settings (
  id,
  brand_name,
  logo_url,
  phone,
  whatsapp,
  email,
  address,
  business_schedule,
  contact_persons,
  typewriter_phrases
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Daags Digital Concept',
  '',
  '08168779732',
  '2348168779732',
  'daagsdigitalconcept@gmail.com',
  'Suite 24, Victoria Plaza, Lagos & Nationwide Digital Support Desk, Nigeria',
  '[
    {"day": "Monday", "is_off": false, "open_time": "08:00", "close_time": "18:00"},
    {"day": "Tuesday", "is_off": false, "open_time": "08:00", "close_time": "18:00"},
    {"day": "Wednesday", "is_off": false, "open_time": "08:00", "close_time": "18:00"},
    {"day": "Thursday", "is_off": false, "open_time": "08:00", "close_time": "18:00"},
    {"day": "Friday", "is_off": false, "open_time": "08:00", "close_time": "18:00"},
    {"day": "Saturday", "is_off": false, "open_time": "09:00", "close_time": "16:00"},
    {"day": "Sunday", "is_off": true, "open_time": "09:00", "close_time": "16:00"}
  ]'::jsonb,
  '[
    {"id": "cp-1", "name": "Gabriel", "phone": "08168779732", "role": "Lead Support Desk"},
    {"id": "cp-2", "name": "Temidayo", "phone": "08100000000", "role": "Client Operations"}
  ]'::jsonb,
  '[
    "Website Design & Development...",
    "CAC Business & Company Registration...",
    "NIN Validation & Slip Reprint...",
    "Fintech POS Terminal Setup...",
    "Verified Proof of Address..."
  ]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.admin_users (full_name, email, password_hash, role, role_title, permissions, is_active)
VALUES
  (
    'Super Administrator',
    'daagsdigitalconcept@gmail.com',
    'DaagsAdmin2026!',
    'super_admin',
    'Managing Director / Super Admin',
    '{"manage_inquiries": true, "manage_services": true, "edit_site_content": true, "manage_portfolio": true, "manage_faqs": true}'::jsonb,
    true
  ),
  (
    'Operations Desk Staff',
    'operations@daagsdigital.com',
    'DaagsStaff2026!',
    'delegated_admin',
    'Client Operations Officer',
    '{"manage_inquiries": true, "manage_services": false, "edit_site_content": false, "manage_portfolio": false, "manage_faqs": false}'::jsonb,
    true
  )
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.service_categories (id, name, slug, description, icon_name, display_order) VALUES
  ('11111111-1111-1111-1111-111111111101', 'CAC Registration', 'cac-registration', 'Fast, compliant Corporate Affairs Commission filings for Business Names, LLCs, NGOs, and Annual Returns.', 'Building2', 1),
  ('11111111-1111-1111-1111-111111111102', 'Website Design', 'website-design', 'Conversion-focused websites, corporate portals, and e-commerce stores engineered for speed and credibility.', 'Globe', 2),
  ('11111111-1111-1111-1111-111111111103', 'NIN Services', 'nin-services', 'Reliable National Identity Number slip reprints, PVC card printing, validation, and data modification support.', 'Fingerprint', 3),
  ('11111111-1111-1111-1111-111111111104', 'POS Agent Services', 'pos-agent-services', 'End-to-end POS terminal onboarding, KYC compliance, settlement setup, and merchant branding kits.', 'CreditCard', 4),
  ('11111111-1111-1111-1111-111111111105', 'Proof of Address', 'proof-of-address', 'Verified residential and business utility documentation and bank/fintech KYC address verification support.', 'MapPinCheck', 5)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.sub_services (category_id, title, slug, short_description, deliverables, original_price, ongoing_price, promo_label, turnaround_time, display_order) VALUES
  ('11111111-1111-1111-1111-111111111101', 'CAC Business Name Registration', 'cac-business-name', 'Complete sole proprietorship or partnership registration with official BN Certificate and Status Report.', '["Name Search & Reservation", "Official CAC BN Certificate", "Certified Status Report", "Free Business Tax Setup Guide"]', 35000, 25000, 'Promo Active', '3 – 5 Business Days', 1),
  ('11111111-1111-1111-1111-111111111101', 'Private Limited Company (LLC)', 'cac-llc-registration', 'Full incorporation for scalable startups and corporate firms with MEMART and share structure.', '["Name Reservation & Consent", "Certificate of Incorporation", "MEMART & Status Report", "TIN Registration Assistance"]', 85000, 65000, 'Save 24%', '5 – 7 Business Days', 2),
  ('11111111-1111-1111-1111-111111111101', 'Incorporated Trustees (NGO / Foundation)', 'cac-ngo-trustees', 'End-to-end registration for NGOs, churches, associations, and non-profit foundations.', '["Newspaper Publication Handling", "Trustees Constitution Drafting", "CAC Trustees Certificate", "Compliance Filing Support"]', 150000, 120000, 'Save 20%', '14 – 21 Business Days', 3),
  ('11111111-1111-1111-1111-111111111101', 'Post-Incorporation & Annual Returns', 'cac-annual-returns', 'Keep your company active on the CAC portal with timely annual returns, director updates, or share changes.', '["CAC Portal Status Audit", "Annual Returns Filing", "Penalty Assessment & Clearance", "Updated Status Report"]', 30000, 20000, 'Save 33%', '2 – 4 Business Days', 4),
  ('11111111-1111-1111-1111-111111111102', 'Business Starter Website', 'business-starter-website', 'Clean, mobile-responsive 5-page business website built to establish authority and capture WhatsApp leads.', '["Custom Mobile-First Design", "Up to 5 Core Pages", "WhatsApp & Form Lead Capture", "Free 1-Year SSL & Basic SEO"]', 220000, 150000, 'Save 32%', '5 – 7 Business Days', 1),
  ('11111111-1111-1111-1111-111111111102', 'Corporate & Institutional Website', 'corporate-website', 'Multi-page authority platform with CMS editing, service directories, and analytics integration.', '["Bespoke Brand UI/UX", "Admin Content Dashboard", "Speed & SEO Optimization", "Corporate Email Setup"]', 400000, 300000, 'Save 25%', '10 – 14 Business Days', 2),
  ('11111111-1111-1111-1111-111111111102', 'E-Commerce & Custom Web App', 'ecommerce-web-app', 'Full online store or custom web platform with Paystack/Flutterwave checkout and order management.', '["Product Catalog & Cart", "Paystack / Transfer Integration", "Admin Order & Inventory Panel", "30-Day Post-Launch Support"]', 600000, 450000, 'Save 25%', '14 – 21 Business Days', 3),
  ('11111111-1111-1111-1111-111111111103', 'NIN Slip Reprint & Plastic ID Card', 'nin-slip-reprint', 'Instant verification and high-grade laminated or PVC NIN slip reprint for banking, travel, and KYC.', '["NIMC Portal Verification", "High-Resolution Digital PDF", "Durable Plastic ID Card Print", "Same-Day Digital Delivery"]', 8000, 5000, 'Save 38%', 'Same Day', 1),
  ('11111111-1111-1111-1111-111111111103', 'NIN Modification & Validation', 'nin-modification-validation', 'Guided support for name correction, date of birth updates, phone number link, and BVN-NIN validation.', '["Validation Error Diagnosis", "Official Modification Filing", "NIMC Status Tracking", "Bank Sync Confirmation"]', 15000, 10000, 'Save 33%', '3 – 7 Business Days', 2),
  ('11111111-1111-1111-1111-111111111104', 'POS Terminal Onboarding & Setup', 'pos-terminal-setup', 'Fast merchant registration and activation for leading Nigerian fintech POS terminals with low charges.', '["Fintech Merchant Profiling", "KYC Verification Fast-Track", "Terminal Activation & Testing", "Commission Rate Optimization"]', 35000, 25000, 'Save 29%', '24 – 48 Hours', 1),
  ('11111111-1111-1111-1111-111111111104', 'Merchant Settlement & Branding Kit', 'pos-branding-kit', 'Complete POS standee signage, transaction tariff board, and settlement dispute resolution support.', '["Custom Tariffs & Display Banner", "Agent Stamp & Receipt Setup", "Settlement Account Linking", "Ongoing Support Desk"]', 20000, 15000, 'Save 25%', '2 – 3 Business Days', 2),
  ('11111111-1111-1111-1111-111111111105', 'Verified Utility & Address Documentation', 'verified-utility-address', 'Authentic, verifiable utility and residential address documentation tailored for corporate and personal compliance.', '["Address Format Verification", "Compliant Utility Reference", "Digital & Print-Ready Copy", "Same-Day Processing"]', 15000, 10000, 'Save 33%', '24 Hours', 1),
  ('11111111-1111-1111-1111-111111111105', 'Bank & KYC Address Verification Support', 'bank-kyc-address', 'Tier-3 bank account, fintech merchant, and corporate KYC address verification compliance package.', '["Tier-3 Bank KYC Checklist", "CAC & Utility Alignment", "Fintech Compliance Review", "Priority Escalation Support"]', 18000, 12000, 'Save 33%', '24 – 48 Hours', 2)
ON CONFLICT (slug) DO NOTHING;
