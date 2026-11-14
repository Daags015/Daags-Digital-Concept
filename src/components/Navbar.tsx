import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useCms } from '@/src/context/CmsContext';

export const Navbar: React.FC = () => {
  const { db, openInquiryModal } = useCms();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const logoUrl = db.site_settings.logo_url?.trim() || '';

  React.useEffect(() => {
    setLogoFailed(false);
  }, [logoUrl]);

  const navItems = [
    { label: 'Home', to: '/' },
    { label: 'Services', to: '/services' },
    { label: 'Portfolio', to: '/portfolio' },
    { label: 'About', to: '/about' },
    { label: 'Contact', to: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand logo (when uploaded) + single-line brand wordmark */}
        <Link
          to="/"
          className="inline-flex items-center gap-2.5 font-heading text-lg sm:text-xl font-extrabold tracking-tight text-[#002815] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FEBD12] rounded"
        >
          {logoUrl && !logoFailed && (
            <img
              src={logoUrl}
              alt={`${db.site_settings.brand_name} logo`}
              referrerPolicy="no-referrer"
              onError={() => setLogoFailed(true)}
              className="h-9 w-auto max-w-[140px] object-contain shrink-0"
            />
          )}
          <span>{db.site_settings.brand_name}</span>
        </Link>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-7" aria-label="Primary Navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `text-sm font-medium whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors duration-150 ${
                  isActive
                    ? 'text-[#002815] border-[#FEBD12] font-semibold'
                    : 'text-[#4B5563] border-transparent hover:text-[#002815] hover:border-[#002815]/30'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Zone 3: 1 primary action + mobile menu button */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => openInquiryModal()}
            className="hidden sm:inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold rounded-md bg-[#002815] text-white hover:bg-[#003d20] transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FEBD12]"
          >
            Request Service
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-md text-[#002815] hover:bg-[#F3F5F2] transition-colors cursor-pointer"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-neutral-200 px-4 py-4 space-y-2">
          <nav className="flex flex-col gap-1" aria-label="Mobile Navigation">
            {[...navItems, { label: 'FAQs', to: '/faqs' }].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#F3F5F2] text-[#002815] font-semibold'
                      : 'text-[#4B5563] hover:bg-[#F3F5F2] hover:text-[#002815]'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="pt-2 border-t border-neutral-100">
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                openInquiryModal();
              }}
              className="w-full py-3 px-4 rounded-md bg-[#002815] text-white text-sm font-semibold hover:bg-[#003d20] transition-colors cursor-pointer"
            >
              Request Service
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
