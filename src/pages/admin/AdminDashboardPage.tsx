import React, { useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  Briefcase,
  FileEdit,
  FolderKanban,
  HelpCircle,
  Users,
  ShieldCheck,
  Image as ImageIcon,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Database,
  RefreshCw,
} from 'lucide-react';
import { useCms } from '@/src/context/CmsContext';
import { useToast } from '@/src/context/ToastContext';
import { InquiriesTab } from '@/src/pages/admin/tabs/InquiriesTab';
import { ServicesPricingTab } from '@/src/pages/admin/tabs/ServicesPricingTab';
import { SiteContentTab } from '@/src/pages/admin/tabs/SiteContentTab';
import { PortfolioTab } from '@/src/pages/admin/tabs/PortfolioTab';
import { FaqsTab } from '@/src/pages/admin/tabs/FaqsTab';
import { TeamDelegationTab } from '@/src/pages/admin/tabs/TeamDelegationTab';
import { AccountSecurityTab } from '@/src/pages/admin/tabs/AccountSecurityTab';
import { LogoManagementTab } from '@/src/pages/admin/tabs/LogoManagementTab';

type AdminTabKey =
  | 'overview'
  | 'inquiries'
  | 'services'
  | 'site_content'
  | 'portfolio'
  | 'faqs'
  | 'logo'
  | 'team'
  | 'security';

export const AdminDashboardPage: React.FC = () => {
  const {
    db,
    currentAdmin,
    logoutAdmin,
    hasPermission,
    isSupabaseReady,
    supabaseAuthEmail,
    lastSyncError,
    syncLocalToSupabase,
  } = useCms();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<AdminTabKey>('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleManualSync = async () => {
    setSyncing(true);
    const res = await syncLocalToSupabase();
    setSyncing(false);
    showToast(res.message, res.ok ? 'success' : 'error');
  };

  const navItems = useMemo(() => {
    const items: { key: AdminTabKey; label: string; icon: React.ReactNode; visible: boolean }[] = [
      {
        key: 'overview',
        label: 'Dashboard Overview',
        icon: <LayoutDashboard className="w-4 h-4" />,
        visible: true,
      },
      {
        key: 'inquiries',
        label: 'Inquiries CRM',
        icon: <MessageSquare className="w-4 h-4" />,
        visible: hasPermission('manage_inquiries'),
      },
      {
        key: 'services',
        label: 'Services & Dual Pricing',
        icon: <Briefcase className="w-4 h-4" />,
        visible: hasPermission('manage_services'),
      },
      {
        key: 'site_content',
        label: 'Page & Hero Editor',
        icon: <FileEdit className="w-4 h-4" />,
        visible: hasPermission('edit_site_content'),
      },
      {
        key: 'portfolio',
        label: 'Portfolio Projects',
        icon: <FolderKanban className="w-4 h-4" />,
        visible: hasPermission('manage_portfolio'),
      },
      {
        key: 'faqs',
        label: 'FAQs Manager',
        icon: <HelpCircle className="w-4 h-4" />,
        visible: hasPermission('manage_faqs'),
      },
      {
        key: 'logo',
        label: 'Logo Management',
        icon: <ImageIcon className="w-4 h-4" />,
        visible: currentAdmin?.role === 'super_admin',
      },
      {
        key: 'team',
        label: 'Team & Role Delegation',
        icon: <Users className="w-4 h-4" />,
        visible: currentAdmin?.role === 'super_admin',
      },
      {
        key: 'security',
        label: 'Account Security',
        icon: <ShieldCheck className="w-4 h-4" />,
        visible: true,
      },
    ];
    return items.filter((item) => item.visible);
  }, [hasPermission, currentAdmin]);

  if (!currentAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  // Ensure activeTab is always permitted
  const effectiveTab: AdminTabKey = navItems.some((n) => n.key === activeTab)
    ? activeTab
    : 'overview';

  const newInquiriesCount = db.inquiries.filter((i) => i.status === 'new').length;
  const activeServicesCount = db.sub_services.filter((s) => s.is_published).length;

  const renderContent = () => {
    switch (effectiveTab) {
      case 'inquiries':
        return hasPermission('manage_inquiries') ? <InquiriesTab /> : null;
      case 'services':
        return hasPermission('manage_services') ? <ServicesPricingTab /> : null;
      case 'site_content':
        return hasPermission('edit_site_content') ? <SiteContentTab /> : null;
      case 'portfolio':
        return hasPermission('manage_portfolio') ? <PortfolioTab /> : null;
      case 'faqs':
        return hasPermission('manage_faqs') ? <FaqsTab /> : null;
      case 'logo':
        return currentAdmin.role === 'super_admin' ? <LogoManagementTab /> : null;
      case 'team':
        return currentAdmin.role === 'super_admin' ? <TeamDelegationTab /> : null;
      case 'security':
        return <AccountSecurityTab />;
      case 'overview':
      default:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="font-heading text-xl font-extrabold text-[#111827]">
                Welcome, {currentAdmin.full_name}
              </h2>
              <p className="text-xs text-[#4B5563]">
                Role: <strong>{currentAdmin.role_title}</strong> ({currentAdmin.role === 'super_admin' ? 'Super Admin' : 'Delegated Staff'})
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-1">
                <p className="text-xs font-medium text-[#4B5563]">New Customer Inquiries</p>
                <p className="font-heading text-3xl font-extrabold text-[#002815] tabular-nums">
                  {newInquiriesCount}
                </p>
                <p className="text-[11px] text-[#4B5563]">
                  Total logged: {db.inquiries.length}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-1">
                <p className="text-xs font-medium text-[#4B5563]">Published Sub-Services</p>
                <p className="font-heading text-3xl font-extrabold text-[#002815] tabular-nums">
                  {activeServicesCount}
                </p>
                <p className="text-[11px] text-[#4B5563]">
                  Across {db.service_categories.length} categories
                </p>
              </div>
              <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-1">
                <p className="text-xs font-medium text-[#4B5563]">Portfolio Showcases</p>
                <p className="font-heading text-3xl font-extrabold text-[#002815] tabular-nums">
                  {db.portfolio_projects.length}
                </p>
                <p className="text-[11px] text-[#4B5563]">
                  Featured: {db.portfolio_projects.filter((p) => p.is_featured).length}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-1">
                <p className="text-xs font-medium text-[#4B5563]">Active Team Accounts</p>
                <p className="font-heading text-3xl font-extrabold text-[#002815] tabular-nums">
                  {db.admin_users.filter((u) => u.is_active).length}
                </p>
                <p className="text-[11px] text-[#4B5563]">
                  Total staff records: {db.admin_users.length}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-3">
              <h3 className="font-heading text-sm font-bold text-[#111827]">
                Quick Actions for Your Assigned Role
              </h3>
              <div className="flex flex-wrap gap-2.5">
                {navItems
                  .filter((n) => n.key !== 'overview')
                  .map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setActiveTab(item.key)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-[#F3F5F2] border border-neutral-200 text-xs font-semibold text-[#002815] hover:bg-[#002815] hover:text-white transition-colors cursor-pointer"
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F5F2] flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="lg:w-64 bg-[#002815] text-white shrink-0 flex flex-col justify-between border-r border-[#FEBD12]/20">
        <div>
          <div className="h-16 px-5 flex items-center justify-between border-b border-white/15">
            <div>
              <span className="font-heading text-sm font-extrabold text-white block">
                {db.site_settings.brand_name}
              </span>
              <span className="text-[11px] text-[#FEBD12] font-medium">CMS Admin Console</span>
            </div>
            <button
              type="button"
              onClick={() => setMobileNavOpen((p) => !p)}
              aria-label="Toggle admin menu"
              className="lg:hidden p-2 rounded-md text-white hover:bg-white/10 cursor-pointer"
            >
              {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          <nav
            className={`p-3 space-y-1 ${mobileNavOpen ? 'block' : 'hidden lg:block'}`}
            aria-label="Admin Navigation"
          >
            {navItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setActiveTab(item.key);
                  setMobileNavOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  effectiveTab === item.key
                    ? 'bg-[#FEBD12] text-[#002815]'
                    : 'text-white/85 hover:bg-white/10 hover:text-white'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className={`p-4 border-t border-white/15 space-y-2 ${mobileNavOpen ? 'block' : 'hidden lg:block'}`}>
          <Link
            to="/"
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-white/10 text-xs font-semibold text-white hover:bg-white/20 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#FEBD12]" />
            <span>View Live Website</span>
          </Link>
          <button
            type="button"
            onClick={logoutAdmin}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-white/20 text-xs font-semibold text-white/90 hover:bg-red-900/50 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-neutral-200 px-6 flex items-center justify-between gap-4">
          <div className="text-xs text-[#4B5563] truncate">
            <span>Admin Portal</span>
            <span className="mx-2">/</span>
            <span className="font-semibold text-[#111827]">
              {navItems.find((n) => n.key === effectiveTab)?.label}
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs font-semibold text-[#002815] hidden sm:inline">
              {currentAdmin.full_name}
            </span>
            <Link
              to="/"
              className="px-3 py-1.5 rounded-md border border-neutral-300 text-xs font-semibold text-[#111827] hover:bg-[#F3F5F2] whitespace-nowrap"
            >
              Public Site
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto space-y-5">
          {!isSupabaseReady && (
            <div
              role="status"
              className="rounded-xl border border-amber-300 bg-amber-50 p-4 flex items-start gap-2.5 text-xs text-amber-950"
            >
              <Database className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold">
                  Supabase Database Not Connected on This Deployment (Local Browser Storage Only)
                </p>
                <p className="text-amber-900">
                  Price updates and deleted services will only appear on this browser until{' '}
                  <code className="font-mono font-semibold">VITE_SUPABASE_URL</code> and{' '}
                  <code className="font-mono font-semibold">VITE_SUPABASE_ANON_KEY</code> are added
                  in Vercel Project Settings → Environment Variables and redeployed.
                </p>
              </div>
            </div>
          )}
          {isSupabaseReady && (!supabaseAuthEmail || lastSyncError) && (
            <div
              role="status"
              className="rounded-xl border border-amber-300 bg-amber-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-2.5 text-xs text-amber-950">
                <Database className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold">
                    {!supabaseAuthEmail
                      ? 'Supabase Write Session Not Active (Local Browser Cache Only)'
                      : 'Supabase Sync Warning'}
                  </p>
                  <p className="text-amber-900">
                    {lastSyncError
                      ? lastSyncError
                      : 'To save service price edits, deletions, portfolio projects, and logos to Supabase, sign out and sign back in with your Supabase Auth admin email & password.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleManualSync}
                disabled={syncing}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[#002815] text-white text-xs font-semibold hover:bg-[#003d20] disabled:opacity-50 shrink-0 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#FEBD12] ${syncing ? 'animate-spin' : ''}`} />
                <span>{syncing ? 'Syncing...' : 'Sync Local to Supabase'}</span>
              </button>
            </div>
          )}
          {renderContent()}
        </main>
      </div>
    </div>
  );
};
