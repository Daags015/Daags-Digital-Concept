import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone, Clock, Lock } from 'lucide-react';
import { useCms } from '@/src/context/CmsContext';
import { buildWhatsAppLink, formatBusinessScheduleLines } from '@/src/utils/formatters';

export const Footer: React.FC = () => {
  const { db, currentAdmin } = useCms();
  const { site_settings, service_categories } = db;
  const [logoFailed, setLogoFailed] = React.useState(false);
  const logoUrl = site_settings.logo_url?.trim() || '';

  React.useEffect(() => {
    setLogoFailed(false);
  }, [logoUrl]);

  const publishedCategories = service_categories
    .filter((c) => c.is_published)
    .sort((a, b) => a.display_order - b.display_order);

  const contactPersons = site_settings.contact_persons || [];
  const scheduleLines = formatBusinessScheduleLines(site_settings.business_schedule || []);

  const whatsappUrl = buildWhatsAppLink(
    site_settings.whatsapp,
    'Hello Daags Digital Concept, I would like to make an inquiry.'
  );

  return (
    <footer className="bg-[#002815] text-white border-t border-[#FEBD12]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Column */}
          <div className="space-y-4">
            {logoUrl && !logoFailed && (
              <div className="inline-flex items-center bg-white/95 px-2.5 py-1.5 rounded-md">
                <img
                  src={logoUrl}
                  alt={`${site_settings.brand_name} logo`}
                  referrerPolicy="no-referrer"
                  onError={() => setLogoFailed(true)}
                  className="h-11 w-auto max-w-[180px] object-contain"
                />
              </div>
            )}
            <h2 className="font-heading text-xl font-extrabold text-white tracking-tight">
              {site_settings.brand_name}
            </h2>
            <p className="text-sm text-white/80 leading-relaxed">
              {site_settings.tagline}
            </p>
            <div className="pt-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-md bg-[#FEBD12] text-[#002815] text-sm font-semibold hover:bg-[#f5b300] transition-colors whitespace-nowrap"
              >
                WhatsApp Support Desk
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-heading text-sm font-bold text-[#FEBD12] mb-4">Company Pages</h3>
            <ul className="space-y-2.5 text-sm text-white/80">
              <li>
                <Link to="/" className="hover:text-[#FEBD12] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-[#FEBD12] transition-colors">
                  All Services & Promos
                </Link>
              </li>
              <li>
                <Link to="/portfolio" className="hover:text-[#FEBD12] transition-colors">
                  Client Portfolio
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#FEBD12] transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/faqs" className="hover:text-[#FEBD12] transition-colors">
                  FAQs
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[#FEBD12] transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Core Services */}
          <div>
            <h3 className="font-heading text-sm font-bold text-[#FEBD12] mb-4">Service Desks</h3>
            <ul className="space-y-2.5 text-sm text-white/80">
              {publishedCategories.map((cat) => (
                <li key={cat.id}>
                  <Link to={`/services/${cat.slug}`} className="hover:text-[#FEBD12] transition-colors">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Direct Contact */}
          <div>
            <h3 className="font-heading text-sm font-bold text-[#FEBD12] mb-4">Direct Support Desk</h3>
            <ul className="space-y-3 text-sm text-white/80">
              {contactPersons.length > 0 ? (
                contactPersons.map((person) => (
                  <li key={person.id} className="flex items-start gap-2.5">
                    <Phone className="w-4 h-4 text-[#FEBD12] shrink-0 mt-0.5" />
                    <span className="tabular-nums">
                      Contact {person.name}:{' '}
                      <a
                        href={`tel:${person.phone}`}
                        className="text-white font-semibold hover:text-[#FEBD12] transition-colors"
                      >
                        {person.phone}
                      </a>
                    </span>
                  </li>
                ))
              ) : (
                <li className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-[#FEBD12] shrink-0 mt-0.5" />
                  <a href={`tel:${site_settings.phone}`} className="hover:text-white transition-colors tabular-nums">
                    {site_settings.phone}
                  </a>
                </li>
              )}

              <li className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-[#FEBD12] shrink-0 mt-0.5" />
                <a href={`mailto:${site_settings.email}`} className="hover:text-white transition-colors break-all">
                  {site_settings.email}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#FEBD12] shrink-0 mt-0.5" />
                <span>{site_settings.address}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-[#FEBD12] shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-xs leading-relaxed tabular-nums">
                  {scheduleLines.length > 0 ? (
                    scheduleLines.map((line, i) => <div key={i}>{line}</div>)
                  ) : (
                    <span>{site_settings.business_hours}</span>
                  )}
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/70">
          <p>{site_settings.footer_text}</p>
          {currentAdmin && (
            <Link
              to="/admin/dashboard"
              className="inline-flex items-center gap-1.5 text-white/85 hover:text-[#FEBD12] transition-colors whitespace-nowrap font-semibold"
            >
              <Lock className="w-3.5 h-3.5 text-[#FEBD12]" />
              <span>Admin Portal</span>
            </Link>
          )}
        </div>
      </div>
    </footer>
  );
};
