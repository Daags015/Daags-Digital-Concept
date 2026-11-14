import React from 'react';
import { X, Check, Clock, MessageCircle, FileText } from 'lucide-react';
import { ServiceCategory, SubService } from '@/src/types/cms';
import { useCms } from '@/src/context/CmsContext';
import { buildWhatsAppLink, calculateDiscountPercent, formatNaira } from '@/src/utils/formatters';
import { ResilientImage } from '@/src/components/ResilientImage';

interface ServiceDetailModalProps {
  service: SubService | null;
  category?: ServiceCategory;
  onClose: () => void;
}

export const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({
  service,
  category,
  onClose,
}) => {
  const { db, openInquiryModal } = useCms();

  if (!service) return null;

  const discount = calculateDiscountPercent(service.original_price, service.ongoing_price);
  const hasPromo = discount > 0;

  const whatsappHref = buildWhatsAppLink(
    db.site_settings.whatsapp,
    `Hello Daags Digital Concept, I would like to claim the promo offer for "${service.title}" at ${formatNaira(service.ongoing_price)}.`
  );

  return (
    <div
      className="fixed inset-0 z-[75] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="service-detail-title"
    >
      <div className="bg-white rounded-xl border border-neutral-200 shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="relative h-56 bg-[#F3F5F2] shrink-0">
          <ResilientImage
            src={service.image_url}
            alt={service.title}
            fallbackTitle={service.title}
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close service details"
            className="absolute top-3 right-3 p-2 rounded-full bg-white/90 text-[#111827] hover:bg-white shadow cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          {hasPromo && (
            <div className="absolute bottom-3 left-3 bg-[#FEBD12] text-[#002815] px-3 py-1 rounded text-xs font-bold shadow tabular-nums">
              Save {discount}% · {service.promo_label || 'Limited Offer'}
            </div>
          )}
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#4B5563] mb-1.5">
              <span className="font-semibold text-[#002815]">{category?.name || 'Service'}</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {service.turnaround_time}
              </span>
            </div>
            <h2 id="service-detail-title" className="font-heading text-2xl font-extrabold text-[#111827]">
              {service.title}
            </h2>
            <p className="mt-2 text-sm text-[#4B5563] leading-relaxed">
              {service.short_description}
            </p>
          </div>

          {/* Dual Pricing Box */}
          <div className="p-4 rounded-lg bg-[#F3F5F2] border border-neutral-200 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="block text-xs font-medium text-[#4B5563]">Ongoing Promo Price</span>
              <div className="flex items-baseline gap-3 mt-0.5">
                <span className="font-heading text-3xl font-extrabold text-[#002815] tabular-nums">
                  {formatNaira(service.ongoing_price)}
                </span>
                {hasPromo && (
                  <span className="text-base text-[#4B5563] line-through tabular-nums">
                    {formatNaira(service.original_price)}
                  </span>
                )}
              </div>
            </div>
            {service.is_placeholder_price && (
              <span className="text-xs font-medium text-amber-800 bg-amber-100 px-2.5 py-1 rounded">
                Editable Base Estimate
              </span>
            )}
          </div>

          <div>
            <h3 className="font-heading text-sm font-bold text-[#111827] mb-3">
              What Is Included
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {service.deliverables.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-[#4B5563]">
                  <Check className="w-4 h-4 text-[#002815] shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 flex flex-col sm:flex-row gap-3 shrink-0">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md bg-[#002815] text-white text-sm font-semibold hover:bg-[#003d20] transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-[#FEBD12]" />
            <span>Claim Offer via WhatsApp</span>
          </a>
          <button
            type="button"
            onClick={() => {
              onClose();
              openInquiryModal({
                serviceCategory: category?.name,
                subService: service.title,
              });
            }}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md border border-neutral-300 bg-white text-sm font-semibold text-[#111827] hover:bg-[#F3F5F2] transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4 text-[#002815]" />
            <span>Inquire via Form</span>
          </button>
        </div>
      </div>
    </div>
  );
};
