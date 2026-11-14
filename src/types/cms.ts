export interface HeroSlide {
  id: string;
  image_url: string;
  caption: string;
  alt: string;
}

export interface ContactPerson {
  id: string;
  name: string;
  phone: string;
  role?: string;
}

export type WeekdayName =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

export interface BusinessDaySchedule {
  day: WeekdayName;
  is_off: boolean;
  open_time: string;
  close_time: string;
}

export interface SiteSettings {
  brand_name: string;
  logo_url: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  business_hours: string;
  business_schedule: BusinessDaySchedule[];
  contact_persons: ContactPerson[];
  footer_text: string;
  hero_slides: HeroSlide[];
  typewriter_phrases: string[];
}

export interface SectionCardItem {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  icon_name?: string;
  image_url?: string;
}

export type PageKey = 'home' | 'services' | 'portfolio' | 'about' | 'faqs' | 'contact';

export interface PageSection {
  id: string;
  page_key: PageKey;
  section_key: string;
  label: string;
  heading: string;
  subheading: string;
  body_content: string;
  cta_text: string;
  cta_link: string;
  secondary_cta_text: string;
  secondary_cta_link: string;
  image_url: string;
  cards_array: SectionCardItem[];
}

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon_name: string;
  display_order: number;
  is_published: boolean;
}

export interface SubService {
  id: string;
  category_id: string;
  title: string;
  slug: string;
  short_description: string;
  deliverables: string[];
  original_price: number;
  ongoing_price: number;
  promo_label: string;
  is_placeholder_price: boolean;
  turnaround_time: string;
  image_url: string;
  is_published: boolean;
  display_order: number;
}

export interface PortfolioProject {
  id: string;
  title: string;
  client_name: string;
  category: string;
  description: string;
  outcome_metric: string;
  image_url: string;
  live_url: string;
  is_featured: boolean;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  display_order: number;
}

export type InquiryStatus = 'new' | 'contacted' | 'completed';

export interface Inquiry {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  service_category: string;
  sub_service: string;
  message: string;
  status: InquiryStatus;
  created_at: string;
}

export interface AdminPermissions {
  manage_inquiries: boolean;
  manage_services: boolean;
  edit_site_content: boolean;
  manage_portfolio: boolean;
  manage_faqs: boolean;
}

export type AdminRole = 'super_admin' | 'delegated_admin';

export interface AdminUser {
  id: string;
  full_name: string;
  email: string;
  password_hash: string;
  role: AdminRole;
  role_title: string;
  permissions: AdminPermissions;
  is_active: boolean;
  created_at: string;
}

export interface CmsDatabase {
  site_settings: SiteSettings;
  page_sections: PageSection[];
  service_categories: ServiceCategory[];
  sub_services: SubService[];
  portfolio_projects: PortfolioProject[];
  faqs: FaqItem[];
  inquiries: Inquiry[];
  admin_users: AdminUser[];
}
