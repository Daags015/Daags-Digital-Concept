import React from 'react';
import { useCms } from '@/src/context/CmsContext';
import { buildWhatsAppLink } from '@/src/utils/formatters';

export const FloatingWhatsApp: React.FC = () => {
  const { db } = useCms();
  const { phone, whatsapp } = db.site_settings;

  const href = buildWhatsAppLink(
    whatsapp,
    'Hello Daags Digital Concept, I would like to make an inquiry.'
  );

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Chat with Daags Digital Concept on WhatsApp (${phone})`}
        className="group relative inline-flex items-center gap-0 hover:gap-2.5 rounded-full bg-[#002815] text-white border-2 border-[#FEBD12] shadow-xl p-3.5 sm:px-4 sm:py-3 hover:scale-105 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FEBD12]"
      >
        <span
          aria-hidden="true"
          className="whatsapp-pulse-ring absolute inset-0 rounded-full border-2 border-[#FEBD12]/60 pointer-events-none"
        />
        {/* Official WhatsApp SVG mark */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
          className="w-6 h-6 shrink-0 fill-[#25D366]"
          aria-hidden="true"
        >
          <path d="M16.01 2.67c-7.36 0-13.34 5.98-13.34 13.34 0 2.35.61 4.64 1.78 6.66L2.56 29.5l7.01-1.84a13.28 13.28 0 0 0 6.44 1.66h.01c7.36 0 13.34-5.98 13.34-13.34 0-3.56-1.39-6.91-3.91-9.43A13.26 13.26 0 0 0 16.01 2.67zm7.76 18.96c-.33.92-1.91 1.77-2.64 1.88-.68.1-1.54.14-2.49-.16-.57-.18-1.31-.43-2.25-.84-3.96-1.71-6.55-5.71-6.75-5.97-.2-.26-1.61-2.14-1.61-4.08s1.02-2.9 1.38-3.3c.36-.4.79-.5 1.05-.5.26 0 .53 0 .76.01.24.01.57-.09.89.68.33.79 1.12 2.74 1.22 2.94.1.2.16.43.03.69-.13.26-.2.43-.4.66-.2.23-.41.51-.59.69-.2.2-.4.41-.17.81.23.4 1.02 1.68 2.19 2.72 1.5 1.34 2.77 1.76 3.17 1.95.4.2.63.16.86-.1.23-.26.99-1.15 1.25-1.55.26-.4.53-.33.89-.2.36.13 2.31 1.09 2.71 1.29.4.2.66.3.76.46.1.16.1.95-.23 1.87z" />
        </svg>
        <span className="hidden sm:inline-block max-w-0 overflow-hidden group-hover:max-w-[230px] transition-all duration-200 whitespace-nowrap text-xs font-semibold text-white tabular-nums">
          Chat with Us · {phone}
        </span>
      </a>
    </div>
  );
};
