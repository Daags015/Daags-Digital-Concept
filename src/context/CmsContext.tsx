import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  AdminPermissions,
  AdminUser,
  CmsDatabase,
  FaqItem,
  Inquiry,
  InquiryStatus,
  PageSection,
  PortfolioProject,
  ServiceCategory,
  SiteSettings,
  SubService,
} from '@/src/types/cms';
import { INITIAL_CMS_SEED } from '@/src/data/initialSeed';
import {
  isSupabaseConfigured,
  supabase,
  uploadDataUrlToSupabaseStorage,
} from '@/src/lib/supabaseClient';
import { generateUuid, isValidUuid } from '@/src/utils/formatters';
import { useToast } from '@/src/context/ToastContext';

const STORAGE_KEY = 'daags_digital_cms_db_v1';
const SESSION_KEY = 'daags_digital_admin_session_v1';

export interface InquiryModalPreset {
  isOpen: boolean;
  serviceCategory?: string;
  subService?: string;
}

export interface CmsMutationResult {
  ok: boolean;
  synced: boolean;
  error?: string;
}

interface CmsContextValue {
  db: CmsDatabase;
  currentAdmin: AdminUser | null;
  isSupabaseReady: boolean;
  supabaseAuthEmail: string | null;
  lastSyncError: string | null;
  syncLocalToSupabase: () => Promise<{ ok: boolean; message: string }>;
  refreshFromSupabase: () => Promise<void>;
  inquiryModal: InquiryModalPreset;
  openInquiryModal: (preset?: { serviceCategory?: string; subService?: string }) => void;
  closeInquiryModal: () => void;
  getSection: (id: string) => PageSection;
  updateSiteSettings: (settings: SiteSettings) => void;
  updatePageSection: (section: PageSection) => void;
  upsertCategory: (category: ServiceCategory) => Promise<CmsMutationResult>;
  deleteCategory: (categoryId: string) => Promise<CmsMutationResult>;
  upsertSubService: (sub: SubService) => Promise<CmsMutationResult>;
  deleteSubService: (subId: string) => Promise<CmsMutationResult>;
  upsertPortfolioProject: (project: PortfolioProject) => void;
  deletePortfolioProject: (projectId: string) => void;
  upsertFaq: (faq: FaqItem) => void;
  deleteFaq: (faqId: string) => void;
  submitInquiry: (input: Omit<Inquiry, 'id' | 'status' | 'created_at'>) => Inquiry;
  updateInquiryStatus: (inquiryId: string, status: InquiryStatus) => void;
  deleteInquiry: (inquiryId: string) => void;
  loginAdmin: (email: string, password: string) => { ok: boolean; error?: string; user?: AdminUser };
  logoutAdmin: () => void;
  resetAdminPasswordByEmail: (email: string, newPassword: string) => { ok: boolean; error?: string };
  changeCurrentPassword: (currentPassword: string, newPassword: string) => { ok: boolean; error?: string };
  upsertAdminUser: (user: AdminUser) => { ok: boolean; error?: string };
  toggleAdminActive: (userId: string) => void;
  deleteAdminUser: (userId: string) => void;
  hasPermission: (perm: keyof AdminPermissions) => boolean;
  resetAllToDefaults: () => void;
}

const CmsContext = createContext<CmsContextValue | undefined>(undefined);

function loadStoredDatabase(): CmsDatabase {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_CMS_SEED;
    const parsed = JSON.parse(raw) as Partial<CmsDatabase>;

    const storedSections = parsed.page_sections?.length ? parsed.page_sections : [];
    const mergedSections = INITIAL_CMS_SEED.page_sections.map((seedSec) => {
      const existing = storedSections.find((s) => s.id === seedSec.id);
      if (!existing) return seedSec;
      if (
        existing.id === 'home_hero' &&
        existing.heading === 'Digital Systems & Corporate Support Built for Nigerian Growth'
      ) {
        return seedSec;
      }
      return existing;
    });
    for (const sec of storedSections) {
      if (!mergedSections.some((m) => m.id === sec.id)) {
        mergedSections.push(sec);
      }
    }

    const mergedSiteSettings = {
      ...INITIAL_CMS_SEED.site_settings,
      ...(parsed.site_settings || {}),
      contact_persons: parsed.site_settings?.contact_persons?.length
        ? parsed.site_settings.contact_persons
        : INITIAL_CMS_SEED.site_settings.contact_persons,
      business_schedule: parsed.site_settings?.business_schedule?.length
        ? parsed.site_settings.business_schedule
        : INITIAL_CMS_SEED.site_settings.business_schedule,
    };

    const storedSubServices = Array.isArray(parsed.sub_services)
      ? parsed.sub_services.map((s) => ({
          ...s,
          original_price: Number(s.original_price) || 0,
          ongoing_price: Number(s.ongoing_price) || 0,
          display_order: Number(s.display_order) || 1,
          deliverables: Array.isArray(s.deliverables) ? s.deliverables : [],
        }))
      : INITIAL_CMS_SEED.sub_services;

    return {
      site_settings: mergedSiteSettings,
      page_sections: mergedSections,
      service_categories: Array.isArray(parsed.service_categories)
        ? parsed.service_categories
        : INITIAL_CMS_SEED.service_categories,
      sub_services: storedSubServices,
      portfolio_projects: Array.isArray(parsed.portfolio_projects)
        ? parsed.portfolio_projects
        : INITIAL_CMS_SEED.portfolio_projects,
      faqs: Array.isArray(parsed.faqs) ? parsed.faqs : INITIAL_CMS_SEED.faqs,
      inquiries: Array.isArray(parsed.inquiries) ? parsed.inquiries : INITIAL_CMS_SEED.inquiries,
      admin_users: parsed.admin_users?.length ? parsed.admin_users : INITIAL_CMS_SEED.admin_users,
    };
  } catch {
    return INITIAL_CMS_SEED;
  }
}

export const CmsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToast();
  const [db, setDb] = useState<CmsDatabase>(() => loadStoredDatabase());
  const dbRef = useRef<CmsDatabase>(db);
  dbRef.current = db;
  const [adminId, setAdminId] = useState<string | null>(() => {
    try {
      return window.localStorage.getItem(SESSION_KEY);
    } catch {
      return null;
    }
  });
  const [supabaseAuthEmail, setSupabaseAuthEmail] = useState<string | null>(null);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);
  const [inquiryModal, setInquiryModal] = useState<InquiryModalPreset>({ isOpen: false });

  const reportSupabaseResult = useCallback(
    (contextLabel: string, error: { message?: string; code?: string } | null) => {
      if (!error) {
        setLastSyncError(null);
        return true;
      }
      const rawMsg = error.message || 'Row Level Security or network error.';
      const isNetworkError = /failed to fetch|networkerror|load failed/i.test(rawMsg);
      const friendlyMsg = isNetworkError
        ? 'Network request to Supabase was interrupted. Changes are saved locally and can be synced anytime.'
        : rawMsg;

      console.warn(`Supabase sync notice (${contextLabel}):`, rawMsg);
      setLastSyncError(`${contextLabel}: ${friendlyMsg}`);
      showToast(
        isNetworkError
          ? 'Saved locally. Cloud sync paused (network unavailable).'
          : `Saved locally, but Supabase sync failed (${contextLabel}): ${friendlyMsg}`,
        isNetworkError ? 'info' : 'error'
      );
      return false;
    },
    [showToast]
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch (err) {
      console.warn('Failed to persist CMS state to localStorage:', err);
    }
  }, [db]);

  const hydrateFromSupabase = useCallback(async (isActiveRef?: { current: boolean }) => {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const [settingsRes, sectionsRes, cats, subs, ports, faqs, inquiriesRes, adminsRes] =
        await Promise.all([
          supabase.from('site_settings').select('*').limit(1).maybeSingle(),
          supabase.from('page_sections').select('*'),
          supabase.from('service_categories').select('*').order('display_order'),
          supabase.from('sub_services').select('*').order('display_order'),
          supabase.from('portfolio_projects').select('*'),
          supabase.from('faqs').select('*').order('display_order'),
          supabase.from('inquiries').select('*').order('created_at', { ascending: false }),
          supabase.from('admin_users').select('*'),
        ]);

      if (isActiveRef && !isActiveRef.current) return;

      setDb((prev) => {
        const remoteSettings = settingsRes.data as Partial<SiteSettings> | null;
        const mergedSiteSettings: SiteSettings = remoteSettings
          ? {
              ...prev.site_settings,
              ...remoteSettings,
              hero_slides:
                Array.isArray(remoteSettings.hero_slides) && remoteSettings.hero_slides.length > 0
                  ? remoteSettings.hero_slides
                  : prev.site_settings.hero_slides,
              business_schedule:
                Array.isArray(remoteSettings.business_schedule) &&
                remoteSettings.business_schedule.length > 0
                  ? remoteSettings.business_schedule
                  : prev.site_settings.business_schedule,
              contact_persons:
                Array.isArray(remoteSettings.contact_persons) &&
                remoteSettings.contact_persons.length > 0
                  ? remoteSettings.contact_persons
                  : prev.site_settings.contact_persons,
              typewriter_phrases:
                Array.isArray(remoteSettings.typewriter_phrases) &&
                remoteSettings.typewriter_phrases.length > 0
                  ? remoteSettings.typewriter_phrases
                  : prev.site_settings.typewriter_phrases,
            }
          : prev.site_settings;

        let mergedSections = prev.page_sections;
        if (sectionsRes.data?.length) {
          const remoteMap = new Map(
            (sectionsRes.data as PageSection[]).map((sec) => [sec.id, sec])
          );
          mergedSections = prev.page_sections.map((sec) => remoteMap.get(sec.id) || sec);
          for (const remoteSec of sectionsRes.data as PageSection[]) {
            if (!mergedSections.some((s) => s.id === remoteSec.id)) {
              mergedSections.push(remoteSec);
            }
          }
        }

        const remoteCategories: ServiceCategory[] =
          !cats.error && Array.isArray(cats.data)
            ? (cats.data as ServiceCategory[]).map((cat) => ({
                ...cat,
                display_order: Number(cat.display_order) || 1,
                is_published: Boolean(cat.is_published),
              }))
            : prev.service_categories;

        const validCategoryIds = new Set(remoteCategories.map((c) => c.id));

        const mergedSubServices: SubService[] =
          !subs.error && Array.isArray(subs.data)
            ? (subs.data as SubService[])
                .filter((remoteSub) =>
                  validCategoryIds.size === 0 ? true : validCategoryIds.has(remoteSub.category_id)
                )
                .map((remoteSub) => {
                  const fallback = INITIAL_CMS_SEED.sub_services.find(
                    (seedSub) => seedSub.slug === remoteSub.slug
                  );
                  return {
                    ...remoteSub,
                    original_price: Number(remoteSub.original_price) || 0,
                    ongoing_price: Number(remoteSub.ongoing_price) || 0,
                    display_order: Number(remoteSub.display_order) || 1,
                    is_published: Boolean(remoteSub.is_published),
                    is_placeholder_price: Boolean(remoteSub.is_placeholder_price),
                    deliverables: Array.isArray(remoteSub.deliverables)
                      ? remoteSub.deliverables
                      : [],
                    image_url: remoteSub.image_url || fallback?.image_url || '',
                  };
                })
            : prev.sub_services;

        return {
          ...prev,
          site_settings: mergedSiteSettings,
          page_sections: mergedSections,
          service_categories: remoteCategories,
          sub_services: mergedSubServices,
          portfolio_projects:
            !ports.error && Array.isArray(ports.data)
              ? (ports.data as PortfolioProject[])
              : prev.portfolio_projects,
          faqs:
            !faqs.error && Array.isArray(faqs.data)
              ? (faqs.data as FaqItem[])
              : prev.faqs,
          inquiries: inquiriesRes.data?.length
            ? (inquiriesRes.data as Inquiry[])
            : prev.inquiries,
          admin_users: adminsRes.data?.length
            ? (adminsRes.data as AdminUser[])
            : prev.admin_users,
        };
      });
    } catch {
      // Fallback silently to local persistent seed
    }
  }, []);

  const refreshFromSupabase = useCallback(async () => {
    await hydrateFromSupabase();
  }, [hydrateFromSupabase]);

  // Supabase hydration, auth session listener, cross-tab storage sync, and tab-focus refresh
  useEffect(() => {
    const activeRef = { current: true };
    hydrateFromSupabase(activeRef);

    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        setDb(loadStoredDatabase());
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        hydrateFromSupabase(activeRef);
      }
    };

    window.addEventListener('storage', handleStorage);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    let unsubscribeAuth: (() => void) | undefined;
    if (isSupabaseConfigured && supabase) {
      supabase.auth
        .getSession()
        .then(({ data }) => {
          if (activeRef.current) {
            setSupabaseAuthEmail(data.session?.user?.email || null);
          }
        })
        .catch(() => undefined);
      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (activeRef.current) {
          setSupabaseAuthEmail(session?.user?.email || null);
          if (session) {
            hydrateFromSupabase(activeRef);
          }
        }
      });
      unsubscribeAuth = () => listener.subscription.unsubscribe();
    }

    return () => {
      activeRef.current = false;
      window.removeEventListener('storage', handleStorage);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      unsubscribeAuth?.();
    };
  }, [hydrateFromSupabase]);

  const currentAdmin = useMemo(() => {
    if (!adminId) return null;
    const found = db.admin_users.find((u) => u.id === adminId);
    if (!found || !found.is_active) return null;
    return found;
  }, [adminId, db.admin_users]);

  const getSection = useCallback(
    (id: string): PageSection => {
      const found = db.page_sections.find((s) => s.id === id);
      if (found) return found;
      const seedFallback = INITIAL_CMS_SEED.page_sections.find((s) => s.id === id);
      if (seedFallback) return seedFallback;
      return {
        id,
        page_key: 'home',
        section_key: id,
        label: id,
        heading: '',
        subheading: '',
        body_content: '',
        cta_text: '',
        cta_link: '',
        secondary_cta_text: '',
        secondary_cta_link: '',
        image_url: '',
        cards_array: [],
      };
    },
    [db.page_sections]
  );

  const openInquiryModal = useCallback((preset?: { serviceCategory?: string; subService?: string }) => {
    setInquiryModal({
      isOpen: true,
      serviceCategory: preset?.serviceCategory,
      subService: preset?.subService,
    });
  }, []);

  const closeInquiryModal = useCallback(() => {
    setInquiryModal({ isOpen: false });
  }, []);

  const updateSiteSettings = useCallback(
    (settings: SiteSettings) => {
      setDb((prev) => ({ ...prev, site_settings: settings }));
      if (isSupabaseConfigured && supabase) {
        const payload = {
          brand_name: settings.brand_name,
          logo_url: settings.logo_url,
          tagline: settings.tagline,
          phone: settings.phone,
          whatsapp: settings.whatsapp,
          email: settings.email,
          address: settings.address,
          business_hours: settings.business_hours,
          business_schedule: settings.business_schedule,
          contact_persons: settings.contact_persons,
          footer_text: settings.footer_text,
          hero_slides: settings.hero_slides,
          typewriter_phrases: settings.typewriter_phrases,
        };
        supabase
          .from('site_settings')
          .select('id')
          .limit(1)
          .maybeSingle()
          .then(({ data, error: fetchErr }) => {
            if (fetchErr) {
              reportSupabaseResult('site_settings lookup', fetchErr);
              return;
            }
            if (data?.id) {
              supabase!
                .from('site_settings')
                .update(payload)
                .eq('id', data.id)
                .then(({ error }) => reportSupabaseResult('site_settings', error));
            } else {
              supabase!
                .from('site_settings')
                .upsert({ id: '00000000-0000-0000-0000-000000000001', ...payload })
                .then(({ error }) => reportSupabaseResult('site_settings', error));
            }
          });
      }
    },
    [reportSupabaseResult]
  );

  const updatePageSection = useCallback(
    (section: PageSection) => {
      setDb((prev) => {
        const exists = prev.page_sections.some((s) => s.id === section.id);
        return {
          ...prev,
          page_sections: exists
            ? prev.page_sections.map((s) => (s.id === section.id ? section : s))
            : [...prev.page_sections, section],
        };
      });
      if (isSupabaseConfigured && supabase) {
        supabase
          .from('page_sections')
          .upsert({
            id: section.id,
            page_key: section.page_key,
            section_key: section.section_key,
            label: section.label,
            heading: section.heading,
            subheading: section.subheading,
            body_content: section.body_content,
            cta_text: section.cta_text,
            cta_link: section.cta_link,
            secondary_cta_text: section.secondary_cta_text,
            secondary_cta_link: section.secondary_cta_link,
            image_url: section.image_url,
            cards_array: section.cards_array,
          })
          .then(({ error }) => reportSupabaseResult('page_sections', error));
      }
    },
    [reportSupabaseResult]
  );

  const upsertCategory = useCallback(
    async (category: ServiceCategory): Promise<CmsMutationResult> => {
      const normalized: ServiceCategory = {
        ...category,
        id: isValidUuid(category.id) ? category.id : generateUuid(),
        display_order: Number(category.display_order) || 1,
        is_published: Boolean(category.is_published),
      };

      setDb((prev) => {
        const exists = prev.service_categories.some((c) => c.id === category.id);
        return {
          ...prev,
          service_categories: exists
            ? prev.service_categories.map((c) => (c.id === category.id ? normalized : c))
            : [...prev.service_categories, normalized],
          sub_services:
            category.id !== normalized.id
              ? prev.sub_services.map((s) =>
                  s.category_id === category.id ? { ...s, category_id: normalized.id } : s
                )
              : prev.sub_services,
        };
      });

      if (!isSupabaseConfigured || !supabase) {
        return { ok: true, synced: false };
      }

      const fields = {
        name: normalized.name,
        slug: normalized.slug,
        description: normalized.description,
        icon_name: normalized.icon_name,
        display_order: normalized.display_order,
        is_published: normalized.is_published,
      };

      try {
        // 1) Try updating existing row by UUID
        if (isValidUuid(category.id)) {
          const { data: updated, error: updateErr } = await supabase
            .from('service_categories')
            .update(fields)
            .eq('id', category.id)
            .select('id');

          if (updateErr) {
            reportSupabaseResult('service_categories', updateErr);
            return { ok: false, synced: false, error: updateErr.message };
          }
          if (updated && updated.length > 0) {
            setLastSyncError(null);
            return { ok: true, synced: true };
          }
        }

        // 2) Check if a category with this slug already exists in Supabase
        const { data: existingBySlug } = await supabase
          .from('service_categories')
          .select('id')
          .eq('slug', normalized.slug)
          .maybeSingle();

        if (existingBySlug?.id) {
          const { data: updatedBySlug, error: slugUpdateErr } = await supabase
            .from('service_categories')
            .update(fields)
            .eq('id', existingBySlug.id)
            .select('id');

          if (slugUpdateErr) {
            reportSupabaseResult('service_categories', slugUpdateErr);
            return { ok: false, synced: false, error: slugUpdateErr.message };
          }
          if (!updatedBySlug || updatedBySlug.length === 0) {
            const rlsMsg =
              'Supabase rejected saving this category. Please sign out and sign back in with your Supabase Auth admin account.';
            reportSupabaseResult('service_categories', { message: rlsMsg });
            await hydrateFromSupabase();
            return { ok: false, synced: false, error: rlsMsg };
          }

          if (existingBySlug.id !== normalized.id) {
            setDb((prev) => ({
              ...prev,
              service_categories: prev.service_categories.map((c) =>
                c.id === normalized.id ? { ...c, id: existingBySlug.id } : c
              ),
              sub_services: prev.sub_services.map((s) =>
                s.category_id === normalized.id ? { ...s, category_id: existingBySlug.id } : s
              ),
            }));
          }
          setLastSyncError(null);
          return { ok: true, synced: true };
        }

        // 3) Insert new category row
        const { data: inserted, error: insertErr } = await supabase
          .from('service_categories')
          .insert({ id: normalized.id, ...fields })
          .select('id');

        if (insertErr) {
          reportSupabaseResult('service_categories', insertErr);
          return { ok: false, synced: false, error: insertErr.message };
        }
        if (!inserted || inserted.length === 0) {
          const rlsMsg =
            'Supabase rejected creating this category. Verify your Supabase Auth login session.';
          reportSupabaseResult('service_categories', { message: rlsMsg });
          return { ok: false, synced: false, error: rlsMsg };
        }

        setLastSyncError(null);
        return { ok: true, synced: true };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to save category.';
        reportSupabaseResult('service_categories', { message: msg });
        return { ok: false, synced: false, error: msg };
      }
    },
    [hydrateFromSupabase, reportSupabaseResult]
  );

  const deleteCategory = useCallback(
    async (categoryId: string): Promise<CmsMutationResult> => {
      const target = dbRef.current.service_categories.find((c) => c.id === categoryId);

      setDb((prev) => ({
        ...prev,
        service_categories: prev.service_categories.filter((c) => c.id !== categoryId),
        sub_services: prev.sub_services.filter((s) => s.category_id !== categoryId),
      }));

      if (!isSupabaseConfigured || !supabase) {
        return { ok: true, synced: false };
      }

      try {
        let deletedCount = 0;

        if (isValidUuid(categoryId)) {
          const { data, error } = await supabase
            .from('service_categories')
            .delete()
            .eq('id', categoryId)
            .select('id');
          if (error) {
            reportSupabaseResult('delete service_categories', error);
            await hydrateFromSupabase();
            return { ok: false, synced: false, error: error.message };
          }
          deletedCount = data?.length || 0;
        }

        if (deletedCount === 0 && target?.slug) {
          const { data, error } = await supabase
            .from('service_categories')
            .delete()
            .eq('slug', target.slug)
            .select('id');
          if (error) {
            reportSupabaseResult('delete service_categories', error);
            await hydrateFromSupabase();
            return { ok: false, synced: false, error: error.message };
          }
          deletedCount = data?.length || 0;
        }

        if (deletedCount === 0) {
          const checkQuery = isValidUuid(categoryId)
            ? supabase.from('service_categories').select('id').eq('id', categoryId).maybeSingle()
            : target?.slug
              ? supabase.from('service_categories').select('id').eq('slug', target.slug).maybeSingle()
              : null;

          if (checkQuery) {
            const { data: stillExists } = await checkQuery;
            if (stillExists?.id) {
              const rlsMsg =
                'Supabase blocked deleting this category because your admin Supabase Auth session is inactive. Sign out and sign back in.';
              reportSupabaseResult('delete service_categories', { message: rlsMsg });
              await hydrateFromSupabase();
              return { ok: false, synced: false, error: rlsMsg };
            }
          }
        }

        setLastSyncError(null);
        return { ok: true, synced: true };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to delete category.';
        reportSupabaseResult('delete service_categories', { message: msg });
        await hydrateFromSupabase();
        return { ok: false, synced: false, error: msg };
      }
    },
    [hydrateFromSupabase, reportSupabaseResult]
  );

  const upsertSubService = useCallback(
    async (sub: SubService): Promise<CmsMutationResult> => {
      const normalized: SubService = {
        ...sub,
        id: isValidUuid(sub.id) ? sub.id : generateUuid(),
        original_price: Number(sub.original_price) || 0,
        ongoing_price: Number(sub.ongoing_price) || 0,
        display_order: Number(sub.display_order) || 1,
        is_published: Boolean(sub.is_published),
        is_placeholder_price: Boolean(sub.is_placeholder_price),
        deliverables: Array.isArray(sub.deliverables) ? sub.deliverables : [],
      };

      const localCategory = dbRef.current.service_categories.find(
        (c) => c.id === normalized.category_id
      );

      setDb((prev) => {
        const exists = prev.sub_services.some((s) => s.id === sub.id);
        return {
          ...prev,
          sub_services: exists
            ? prev.sub_services.map((s) => (s.id === sub.id ? normalized : s))
            : [...prev.sub_services, normalized],
        };
      });

      if (!isSupabaseConfigured || !supabase) {
        return { ok: true, synced: false };
      }

      try {
        // Upload inline data URL image to Supabase Storage if present
        let finalImageUrl = normalized.image_url;
        if (finalImageUrl.startsWith('data:image/')) {
          const uploaded = await uploadDataUrlToSupabaseStorage(finalImageUrl, 'services');
          if (uploaded) {
            finalImageUrl = uploaded;
            setDb((prev) => ({
              ...prev,
              sub_services: prev.sub_services.map((s) =>
                s.id === normalized.id ? { ...s, image_url: finalImageUrl } : s
              ),
            }));
          }
        }

        // Resolve valid Supabase UUID for category_id (handles legacy seed IDs like 'cat-cac')
        let resolvedCategoryId = normalized.category_id;
        if (!isValidUuid(resolvedCategoryId) && localCategory?.slug) {
          const { data: remoteCat } = await supabase
            .from('service_categories')
            .select('id')
            .eq('slug', localCategory.slug)
            .maybeSingle();
          if (remoteCat?.id) {
            resolvedCategoryId = remoteCat.id;
          }
        }

        if (!isValidUuid(resolvedCategoryId)) {
          const msg =
            'Could not match this service category in Supabase. Click "Sync Local to Supabase" first.';
          reportSupabaseResult('sub_services', { message: msg });
          return { ok: false, synced: false, error: msg };
        }

        const updateFields = {
          category_id: resolvedCategoryId,
          title: normalized.title,
          slug: normalized.slug,
          short_description: normalized.short_description,
          deliverables: normalized.deliverables,
          original_price: normalized.original_price,
          ongoing_price: normalized.ongoing_price,
          promo_label: normalized.promo_label,
          is_placeholder_price: normalized.is_placeholder_price,
          turnaround_time: normalized.turnaround_time,
          image_url: finalImageUrl,
          is_published: normalized.is_published,
          display_order: normalized.display_order,
        };

        // 1) If editing an existing UUID row, update by primary key `id` first
        if (isValidUuid(sub.id)) {
          const { data: updated, error: updateErr } = await supabase
            .from('sub_services')
            .update(updateFields)
            .eq('id', sub.id)
            .select('id');

          if (updateErr) {
            reportSupabaseResult('sub_services', updateErr);
            return { ok: false, synced: false, error: updateErr.message };
          }
          if (updated && updated.length > 0) {
            setLastSyncError(null);
            return { ok: true, synced: true };
          }
        }

        // 2) Check if a row with the same slug already exists in Supabase
        const { data: existingBySlug } = await supabase
          .from('sub_services')
          .select('id')
          .eq('slug', normalized.slug)
          .maybeSingle();

        if (existingBySlug?.id) {
          const { data: updatedBySlug, error: slugErr } = await supabase
            .from('sub_services')
            .update(updateFields)
            .eq('id', existingBySlug.id)
            .select('id');

          if (slugErr) {
            reportSupabaseResult('sub_services', slugErr);
            return { ok: false, synced: false, error: slugErr.message };
          }

          if (!updatedBySlug || updatedBySlug.length === 0) {
            const rlsMsg =
              'Supabase blocked updating this service price. Your Supabase Auth session is inactive or lacks service edit permission — sign out and sign back in.';
            reportSupabaseResult('sub_services', { message: rlsMsg });
            await hydrateFromSupabase();
            return { ok: false, synced: false, error: rlsMsg };
          }

          setDb((prev) => ({
            ...prev,
            sub_services: prev.sub_services.map((s) =>
              s.id === normalized.id
                ? { ...s, id: existingBySlug.id, category_id: resolvedCategoryId, image_url: finalImageUrl }
                : s
            ),
          }));
          setLastSyncError(null);
          return { ok: true, synced: true };
        }

        // 3) Insert new sub-service row
        const { data: inserted, error: insertErr } = await supabase
          .from('sub_services')
          .insert({ id: normalized.id, ...updateFields })
          .select('id');

        if (insertErr) {
          reportSupabaseResult('sub_services', insertErr);
          return { ok: false, synced: false, error: insertErr.message };
        }
        if (!inserted || inserted.length === 0) {
          const rlsMsg =
            'Supabase blocked creating this service. Please verify your Supabase Auth session.';
          reportSupabaseResult('sub_services', { message: rlsMsg });
          return { ok: false, synced: false, error: rlsMsg };
        }

        setLastSyncError(null);
        return { ok: true, synced: true };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to save service pricing.';
        reportSupabaseResult('sub_services', { message: msg });
        return { ok: false, synced: false, error: msg };
      }
    },
    [hydrateFromSupabase, reportSupabaseResult]
  );

  const deleteSubService = useCallback(
    async (subId: string): Promise<CmsMutationResult> => {
      const target = dbRef.current.sub_services.find((s) => s.id === subId);

      setDb((prev) => ({
        ...prev,
        sub_services: prev.sub_services.filter((s) => s.id !== subId),
      }));

      if (!isSupabaseConfigured || !supabase) {
        return { ok: true, synced: false };
      }

      try {
        let deletedCount = 0;

        if (isValidUuid(subId)) {
          const { data, error } = await supabase
            .from('sub_services')
            .delete()
            .eq('id', subId)
            .select('id');

          if (error) {
            reportSupabaseResult('delete sub_services', error);
            await hydrateFromSupabase();
            return { ok: false, synced: false, error: error.message };
          }
          deletedCount = data?.length || 0;
        }

        if (deletedCount === 0 && target?.slug) {
          const { data, error } = await supabase
            .from('sub_services')
            .delete()
            .eq('slug', target.slug)
            .select('id');

          if (error) {
            reportSupabaseResult('delete sub_services', error);
            await hydrateFromSupabase();
            return { ok: false, synced: false, error: error.message };
          }
          deletedCount = data?.length || 0;
        }

        if (deletedCount === 0) {
          const checkQuery = isValidUuid(subId)
            ? supabase.from('sub_services').select('id').eq('id', subId).maybeSingle()
            : target?.slug
              ? supabase.from('sub_services').select('id').eq('slug', target.slug).maybeSingle()
              : null;

          if (checkQuery) {
            const { data: stillExists } = await checkQuery;
            if (stillExists?.id) {
              const rlsMsg =
                'Supabase blocked deleting this service because your Supabase Auth session is inactive. Sign out and sign back in.';
              reportSupabaseResult('delete sub_services', { message: rlsMsg });
              await hydrateFromSupabase();
              return { ok: false, synced: false, error: rlsMsg };
            }
          }
        }

        setLastSyncError(null);
        return { ok: true, synced: true };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to delete service.';
        reportSupabaseResult('delete sub_services', { message: msg });
        await hydrateFromSupabase();
        return { ok: false, synced: false, error: msg };
      }
    },
    [hydrateFromSupabase, reportSupabaseResult]
  );

  const upsertPortfolioProject = useCallback(
    (project: PortfolioProject) => {
      const normalized = isValidUuid(project.id)
        ? project
        : { ...project, id: generateUuid() };
      setDb((prev) => {
        const exists = prev.portfolio_projects.some((p) => p.id === project.id);
        return {
          ...prev,
          portfolio_projects: exists
            ? prev.portfolio_projects.map((p) => (p.id === project.id ? normalized : p))
            : [normalized, ...prev.portfolio_projects],
        };
      });
      if (isSupabaseConfigured && supabase) {
        supabase
          .from('portfolio_projects')
          .upsert({
            id: normalized.id,
            title: normalized.title,
            client_name: normalized.client_name,
            category: normalized.category,
            description: normalized.description,
            outcome_metric: normalized.outcome_metric,
            image_url: normalized.image_url,
            live_url: normalized.live_url,
            is_featured: normalized.is_featured,
          })
          .then(({ error }) => reportSupabaseResult('portfolio_projects', error));
      }
    },
    [reportSupabaseResult]
  );

  const deletePortfolioProject = useCallback(
    (projectId: string) => {
      setDb((prev) => ({
        ...prev,
        portfolio_projects: prev.portfolio_projects.filter((p) => p.id !== projectId),
      }));
      if (isSupabaseConfigured && supabase && isValidUuid(projectId)) {
        supabase
          .from('portfolio_projects')
          .delete()
          .eq('id', projectId)
          .then(({ error }) => reportSupabaseResult('delete portfolio_projects', error));
      }
    },
    [reportSupabaseResult]
  );

  const upsertFaq = useCallback(
    (faq: FaqItem) => {
      const normalized = isValidUuid(faq.id) ? faq : { ...faq, id: generateUuid() };
      setDb((prev) => {
        const exists = prev.faqs.some((f) => f.id === faq.id);
        return {
          ...prev,
          faqs: exists
            ? prev.faqs.map((f) => (f.id === faq.id ? normalized : f))
            : [...prev.faqs, normalized],
        };
      });
      if (isSupabaseConfigured && supabase) {
        supabase
          .from('faqs')
          .upsert({
            id: normalized.id,
            question: normalized.question,
            answer: normalized.answer,
            category: normalized.category,
            display_order: normalized.display_order,
          })
          .then(({ error }) => reportSupabaseResult('faqs', error));
      }
    },
    [reportSupabaseResult]
  );

  const deleteFaq = useCallback(
    (faqId: string) => {
      setDb((prev) => ({
        ...prev,
        faqs: prev.faqs.filter((f) => f.id !== faqId),
      }));
      if (isSupabaseConfigured && supabase && isValidUuid(faqId)) {
        supabase
          .from('faqs')
          .delete()
          .eq('id', faqId)
          .then(({ error }) => reportSupabaseResult('delete faqs', error));
      }
    },
    [reportSupabaseResult]
  );

  const submitInquiry = useCallback(
    (input: Omit<Inquiry, 'id' | 'status' | 'created_at'>): Inquiry => {
      const record: Inquiry = {
        ...input,
        id: generateUuid(),
        status: 'new',
        created_at: new Date().toISOString(),
      };
      setDb((prev) => ({
        ...prev,
        inquiries: [record, ...prev.inquiries],
      }));
      if (isSupabaseConfigured && supabase) {
        supabase
          .from('inquiries')
          .insert({
            id: record.id,
            full_name: record.full_name,
            phone: record.phone,
            email: record.email,
            service_category: record.service_category,
            sub_service: record.sub_service,
            message: record.message,
            status: record.status,
          })
          .then(({ error }) => {
            if (error) {
              console.warn('Supabase inquiry insert notice:', error.message);
            }
          });
      }
      return record;
    },
    []
  );

  const updateInquiryStatus = useCallback(
    (inquiryId: string, status: InquiryStatus) => {
      setDb((prev) => ({
        ...prev,
        inquiries: prev.inquiries.map((inq) => (inq.id === inquiryId ? { ...inq, status } : inq)),
      }));
      if (isSupabaseConfigured && supabase && isValidUuid(inquiryId)) {
        supabase
          .from('inquiries')
          .update({ status })
          .eq('id', inquiryId)
          .then(({ error }) => reportSupabaseResult('inquiries', error));
      }
    },
    [reportSupabaseResult]
  );

  const deleteInquiry = useCallback(
    (inquiryId: string) => {
      setDb((prev) => ({
        ...prev,
        inquiries: prev.inquiries.filter((inq) => inq.id !== inquiryId),
      }));
      if (isSupabaseConfigured && supabase && isValidUuid(inquiryId)) {
        supabase
          .from('inquiries')
          .delete()
          .eq('id', inquiryId)
          .then(({ error }) => reportSupabaseResult('delete inquiries', error));
      }
    },
    [reportSupabaseResult]
  );

  const loginAdmin = useCallback(
    (email: string, password: string) => {
      const normalized = email.trim().toLowerCase();
      const user = db.admin_users.find((u) => u.email.toLowerCase() === normalized);
      if (!user) {
        return { ok: false, error: 'No admin or staff account found for that email address.' };
      }
      if (!user.is_active) {
        return { ok: false, error: 'This staff account has been suspended by the Super Admin.' };
      }
      if (user.password_hash !== password) {
        return { ok: false, error: 'Incorrect password. Please try again or use Forgot Password.' };
      }
      setAdminId(user.id);
      try {
        window.localStorage.setItem(SESSION_KEY, user.id);
      } catch {
        // Ignore storage restrictions
      }
      if (isSupabaseConfigured && supabase) {
        supabase.auth
          .signInWithPassword({ email: normalized, password })
          .then(({ error }) => {
            if (!error) {
              hydrateFromSupabase();
            }
          })
          .catch(() => undefined);
      }
      return { ok: true, user };
    },
    [db.admin_users, hydrateFromSupabase]
  );

  const logoutAdmin = useCallback(() => {
    setAdminId(null);
    try {
      window.localStorage.removeItem(SESSION_KEY);
    } catch {
      // Ignore
    }
    if (isSupabaseConfigured && supabase) {
      supabase.auth.signOut().catch(() => undefined);
    }
  }, []);

  const resetAdminPasswordByEmail = useCallback(
    (email: string, newPassword: string) => {
      const normalized = email.trim().toLowerCase();
      const user = db.admin_users.find((u) => u.email.toLowerCase() === normalized);
      if (!user) {
        return { ok: false, error: 'No admin account matches that email address.' };
      }
      if (newPassword.length < 6) {
        return { ok: false, error: 'Password must be at least 6 characters.' };
      }
      setDb((prev) => ({
        ...prev,
        admin_users: prev.admin_users.map((u) =>
          u.id === user.id ? { ...u, password_hash: newPassword } : u
        ),
      }));
      if (isSupabaseConfigured && supabase) {
        supabase
          .from('admin_users')
          .update({ password_hash: newPassword })
          .eq('email', normalized)
          .then(() => undefined);
      }
      return { ok: true };
    },
    [db.admin_users]
  );

  const changeCurrentPassword = useCallback(
    (currentPassword: string, newPassword: string) => {
      if (!currentAdmin) return { ok: false, error: 'You are not logged in.' };
      if (currentAdmin.password_hash !== currentPassword) {
        return { ok: false, error: 'Current password is incorrect.' };
      }
      if (newPassword.length < 6) {
        return { ok: false, error: 'New password must be at least 6 characters.' };
      }
      setDb((prev) => ({
        ...prev,
        admin_users: prev.admin_users.map((u) =>
          u.id === currentAdmin.id ? { ...u, password_hash: newPassword } : u
        ),
      }));
      if (isSupabaseConfigured && supabase) {
        supabase
          .from('admin_users')
          .update({ password_hash: newPassword })
          .eq('email', currentAdmin.email.toLowerCase())
          .then(() => undefined);
      }
      return { ok: true };
    },
    [currentAdmin]
  );

  const upsertAdminUser = useCallback(
    (user: AdminUser) => {
      const normalized = user.email.trim().toLowerCase();
      const conflict = db.admin_users.find(
        (u) => u.email.toLowerCase() === normalized && u.id !== user.id
      );
      if (conflict) {
        return { ok: false, error: 'Another team member already uses that email address.' };
      }
      setDb((prev) => {
        const exists = prev.admin_users.some((u) => u.id === user.id);
        return {
          ...prev,
          admin_users: exists
            ? prev.admin_users.map((u) => (u.id === user.id ? { ...user, email: normalized } : u))
            : [{ ...user, email: normalized }, ...prev.admin_users],
        };
      });
      if (isSupabaseConfigured && supabase) {
        supabase
          .from('admin_users')
          .upsert(
            {
              ...(isValidUuid(user.id) ? { id: user.id } : {}),
              full_name: user.full_name,
              email: normalized,
              password_hash: user.password_hash,
              role: user.role,
              role_title: user.role_title,
              permissions: user.permissions,
              is_active: user.is_active,
            },
            { onConflict: 'email' }
          )
          .then(() => undefined);
      }
      return { ok: true };
    },
    [db.admin_users]
  );

  const toggleAdminActive = useCallback((userId: string) => {
    setDb((prev) => {
      const target = prev.admin_users.find((u) => u.id === userId);
      if (target && target.role !== 'super_admin' && isSupabaseConfigured && supabase) {
        supabase
          .from('admin_users')
          .update({ is_active: !target.is_active })
          .eq('email', target.email.toLowerCase())
          .then(() => undefined);
      }
      return {
        ...prev,
        admin_users: prev.admin_users.map((u) =>
          u.id === userId && u.role !== 'super_admin' ? { ...u, is_active: !u.is_active } : u
        ),
      };
    });
  }, []);

  const deleteAdminUser = useCallback((userId: string) => {
    setDb((prev) => {
      const target = prev.admin_users.find((u) => u.id === userId);
      if (target && target.role !== 'super_admin' && isSupabaseConfigured && supabase) {
        supabase
          .from('admin_users')
          .delete()
          .eq('email', target.email.toLowerCase())
          .then(() => undefined);
      }
      return {
        ...prev,
        admin_users: prev.admin_users.filter((u) => u.id !== userId || u.role === 'super_admin'),
      };
    });
  }, []);

  const hasPermission = useCallback(
    (perm: keyof AdminPermissions): boolean => {
      if (!currentAdmin) return false;
      if (currentAdmin.role === 'super_admin') return true;
      return Boolean(currentAdmin.permissions[perm]);
    },
    [currentAdmin]
  );

  const syncLocalToSupabase = useCallback(async (): Promise<{ ok: boolean; message: string }> => {
    if (!isSupabaseConfigured || !supabase) {
      return { ok: false, message: 'Supabase client is not configured.' };
    }
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      return {
        ok: false,
        message:
          'Not authenticated in Supabase Auth. Create your admin user in Supabase Dashboard -> Authentication -> Users, then sign back in.',
      };
    }

    try {
      // Promote any locally cached inline images (Data URLs) into Supabase Storage (cms-media)
      let syncedLogoUrl = db.site_settings.logo_url;
      if (syncedLogoUrl.startsWith('data:image/')) {
        const uploadedLogo = await uploadDataUrlToSupabaseStorage(syncedLogoUrl, 'logos');
        if (uploadedLogo) syncedLogoUrl = uploadedLogo;
      }

      const syncedHeroSlides = await Promise.all(
        db.site_settings.hero_slides.map(async (slide) => {
          if (slide.image_url.startsWith('data:image/')) {
            const uploaded = await uploadDataUrlToSupabaseStorage(slide.image_url, 'hero-slides');
            return uploaded ? { ...slide, image_url: uploaded } : slide;
          }
          return slide;
        })
      );

      const settingsPayload = {
        brand_name: db.site_settings.brand_name,
        logo_url: syncedLogoUrl,
        tagline: db.site_settings.tagline,
        phone: db.site_settings.phone,
        whatsapp: db.site_settings.whatsapp,
        email: db.site_settings.email,
        address: db.site_settings.address,
        business_hours: db.site_settings.business_hours,
        business_schedule: db.site_settings.business_schedule,
        contact_persons: db.site_settings.contact_persons,
        footer_text: db.site_settings.footer_text,
        hero_slides: syncedHeroSlides,
        typewriter_phrases: db.site_settings.typewriter_phrases,
      };
      const { data: existingSettings } = await supabase
        .from('site_settings')
        .select('id')
        .limit(1)
        .maybeSingle();

      const settingsRes = existingSettings?.id
        ? await supabase.from('site_settings').update(settingsPayload).eq('id', existingSettings.id)
        : await supabase
            .from('site_settings')
            .upsert({ id: '00000000-0000-0000-0000-000000000001', ...settingsPayload });

      if (settingsRes.error) {
        reportSupabaseResult('site_settings sync', settingsRes.error);
        return { ok: false, message: settingsRes.error.message };
      }

      if (db.page_sections.length > 0) {
        const syncedSections = await Promise.all(
          db.page_sections.map(async (s) => {
            let imgUrl = s.image_url;
            if (imgUrl.startsWith('data:image/')) {
              const uploaded = await uploadDataUrlToSupabaseStorage(imgUrl, 'page-sections');
              if (uploaded) imgUrl = uploaded;
            }
            return {
              id: s.id,
              page_key: s.page_key,
              section_key: s.section_key,
              label: s.label,
              heading: s.heading,
              subheading: s.subheading,
              body_content: s.body_content,
              cta_text: s.cta_text,
              cta_link: s.cta_link,
              secondary_cta_text: s.secondary_cta_text,
              secondary_cta_link: s.secondary_cta_link,
              image_url: imgUrl,
              cards_array: s.cards_array,
            };
          })
        );
        const { error } = await supabase.from('page_sections').upsert(syncedSections);
        if (error) {
          reportSupabaseResult('page_sections sync', error);
          return { ok: false, message: error.message };
        }
      }

      // Sync service_categories (mapping legacy IDs -> real Supabase UUIDs by slug)
      const categoryIdMap = new Map<string, string>();
      if (db.service_categories.length > 0) {
        const { data: existingCats } = await supabase
          .from('service_categories')
          .select('id, slug');
        const remoteCatBySlug = new Map(
          ((existingCats as { id: string; slug: string }[] | null) || []).map((c) => [c.slug, c.id])
        );

        for (const cat of db.service_categories) {
          const targetId =
            remoteCatBySlug.get(cat.slug) || (isValidUuid(cat.id) ? cat.id : generateUuid());
          categoryIdMap.set(cat.id, targetId);
          const fields = {
            name: cat.name,
            slug: cat.slug,
            description: cat.description,
            icon_name: cat.icon_name,
            display_order: Number(cat.display_order) || 1,
            is_published: Boolean(cat.is_published),
          };
          const catRes = remoteCatBySlug.has(cat.slug)
            ? await supabase.from('service_categories').update(fields).eq('id', targetId)
            : await supabase.from('service_categories').insert({ id: targetId, ...fields });
          if (catRes.error) {
            reportSupabaseResult('service_categories sync', catRes.error);
            return { ok: false, message: catRes.error.message };
          }
        }
      }

      // Sync sub_services (preserving prices, uploading inline images, mapping category UUIDs)
      if (db.sub_services.length > 0) {
        const { data: existingSubs } = await supabase.from('sub_services').select('id, slug');
        const remoteSubBySlug = new Map(
          ((existingSubs as { id: string; slug: string }[] | null) || []).map((s) => [s.slug, s.id])
        );

        for (const sub of db.sub_services) {
          const mappedCategoryId = categoryIdMap.get(sub.category_id) || sub.category_id;
          if (!isValidUuid(mappedCategoryId)) continue;

          let imgUrl = sub.image_url;
          if (imgUrl.startsWith('data:image/')) {
            const uploaded = await uploadDataUrlToSupabaseStorage(imgUrl, 'services');
            if (uploaded) imgUrl = uploaded;
          }

          const targetId =
            remoteSubBySlug.get(sub.slug) || (isValidUuid(sub.id) ? sub.id : generateUuid());
          const fields = {
            category_id: mappedCategoryId,
            title: sub.title,
            slug: sub.slug,
            short_description: sub.short_description,
            deliverables: Array.isArray(sub.deliverables) ? sub.deliverables : [],
            original_price: Number(sub.original_price) || 0,
            ongoing_price: Number(sub.ongoing_price) || 0,
            promo_label: sub.promo_label,
            is_placeholder_price: Boolean(sub.is_placeholder_price),
            turnaround_time: sub.turnaround_time,
            image_url: imgUrl,
            is_published: Boolean(sub.is_published),
            display_order: Number(sub.display_order) || 1,
          };

          const subRes = remoteSubBySlug.has(sub.slug)
            ? await supabase.from('sub_services').update(fields).eq('id', targetId)
            : await supabase.from('sub_services').insert({ id: targetId, ...fields });
          if (subRes.error) {
            reportSupabaseResult('sub_services sync', subRes.error);
            return { ok: false, message: subRes.error.message };
          }
        }
      }

      let normalizedPortfolio: PortfolioProject[] = [];
      if (db.portfolio_projects.length > 0) {
        normalizedPortfolio = await Promise.all(
          db.portfolio_projects.map(async (p) => {
            let imgUrl = p.image_url;
            if (imgUrl.startsWith('data:image/')) {
              const uploaded = await uploadDataUrlToSupabaseStorage(imgUrl, 'portfolio');
              if (uploaded) imgUrl = uploaded;
            }
            return {
              id: isValidUuid(p.id) ? p.id : generateUuid(),
              title: p.title,
              client_name: p.client_name,
              category: p.category,
              description: p.description,
              outcome_metric: p.outcome_metric,
              image_url: imgUrl,
              live_url: p.live_url,
              is_featured: p.is_featured,
            };
          })
        );
        const { error } = await supabase.from('portfolio_projects').upsert(normalizedPortfolio);
        if (error) {
          reportSupabaseResult('portfolio_projects sync', error);
          return { ok: false, message: error.message };
        }
      }

      let normalizedFaqs: FaqItem[] = [];
      if (db.faqs.length > 0) {
        normalizedFaqs = db.faqs.map((f) => ({
          id: isValidUuid(f.id) ? f.id : generateUuid(),
          question: f.question,
          answer: f.answer,
          category: f.category,
          display_order: f.display_order,
        }));
        const { error } = await supabase.from('faqs').upsert(normalizedFaqs);
        if (error) {
          reportSupabaseResult('faqs sync', error);
          return { ok: false, message: error.message };
        }
      }

      setDb((prev) => ({
        ...prev,
        site_settings: {
          ...prev.site_settings,
          logo_url: syncedLogoUrl,
          hero_slides: syncedHeroSlides,
        },
        portfolio_projects:
          normalizedPortfolio.length > 0 ? normalizedPortfolio : prev.portfolio_projects,
        faqs: normalizedFaqs.length > 0 ? normalizedFaqs : prev.faqs,
      }));

      setLastSyncError(null);
      await hydrateFromSupabase();
      return { ok: true, message: 'All local CMS records, service pricing & images synced to Supabase.' };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unexpected sync error';
      return { ok: false, message: msg };
    }
  }, [db, hydrateFromSupabase, reportSupabaseResult]);

  const resetAllToDefaults = useCallback(() => {
    setDb(INITIAL_CMS_SEED);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_CMS_SEED));
    } catch {
      // Ignore
    }
  }, []);

  const value = useMemo<CmsContextValue>(
    () => ({
      db,
      currentAdmin,
      isSupabaseReady: isSupabaseConfigured,
      supabaseAuthEmail,
      lastSyncError,
      syncLocalToSupabase,
      refreshFromSupabase,
      inquiryModal,
      openInquiryModal,
      closeInquiryModal,
      getSection,
      updateSiteSettings,
      updatePageSection,
      upsertCategory,
      deleteCategory,
      upsertSubService,
      deleteSubService,
      upsertPortfolioProject,
      deletePortfolioProject,
      upsertFaq,
      deleteFaq,
      submitInquiry,
      updateInquiryStatus,
      deleteInquiry,
      loginAdmin,
      logoutAdmin,
      resetAdminPasswordByEmail,
      changeCurrentPassword,
      upsertAdminUser,
      toggleAdminActive,
      deleteAdminUser,
      hasPermission,
      resetAllToDefaults,
    }),
    [
      db,
      currentAdmin,
      supabaseAuthEmail,
      lastSyncError,
      syncLocalToSupabase,
      refreshFromSupabase,
      inquiryModal,
      openInquiryModal,
      closeInquiryModal,
      getSection,
      updateSiteSettings,
      updatePageSection,
      upsertCategory,
      deleteCategory,
      upsertSubService,
      deleteSubService,
      upsertPortfolioProject,
      deletePortfolioProject,
      upsertFaq,
      deleteFaq,
      submitInquiry,
      updateInquiryStatus,
      deleteInquiry,
      loginAdmin,
      logoutAdmin,
      resetAdminPasswordByEmail,
      changeCurrentPassword,
      upsertAdminUser,
      toggleAdminActive,
      deleteAdminUser,
      hasPermission,
      resetAllToDefaults,
    ]
  );

  return <CmsContext.Provider value={value}>{children}</CmsContext.Provider>;
};

export function useCms() {
  const ctx = useContext(CmsContext);
  if (!ctx) throw new Error('useCms must be used within CmsProvider');
  return ctx;
}
