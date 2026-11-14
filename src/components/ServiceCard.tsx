import React from 'react';
import { Check, MessageCircle, FileText, Clock } from 'lucide-react';
import { ServiceCategory, SubService } from '@/src/types/cms';
import { useCms } from '@/src/context/CmsContext';
import { buildWhatsAppLink, calculateDiscountPercent, formatNaira } from '@/src/utils/formatters';
import { ResilientImage } from '@/src/components/ResilientImage';

interface ServiceCardProps {
  service: SubService;
  category?: ServiceCategory;
  onInspect?: (service: SubService) => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service, category, onInspect }) => {
  const { db, openInquiryModal } = useCms();

  const discount = calculateDiscountPercent(service.original_price, service.ongoing_price);
  const hasPromo = discount > 0;

  const whatsappMessage = `Hello Daags Digital Concept, I would like to claim the promo offer for "${service.title}" at ${formatNaira(service.ongoing_price)}. Please share the onboarding steps.`;
  const whatsappHref = buildWhatsAppLink(db.site_settings.whatsapp, whatsappMessage);

  return (
    <article className="bg-white rounded-xl border border-neutral-200 overflow-hidden flex flex-col justify-between transition-transform duration-200 hover:-translate-y-0.5 hover:border-[#002815]/30">
      <div>
        <div className="relative aspect-[4/3] bg-[#F3F5F2] overflow-hidden">
          <ResilientImage
            src={service.image_url}
            alt={service.title}
            fallbackTitle={service.title}
            className="w-full h-full object-cover"
          />
          {hasPromo && (
            <div className="absolute top-3 left-3 bg-[#FEBD12] text-[#002815] px-2.5 py-1 rounded text-xs font-bold tracking-tight shadow-sm tabular-nums">
              Save {discount}% · {service.promo_label || 'Limited Offer'}
            </div>
          )}
        </div>

        <div className="p-5 sm:p-6">
          {/* Unboxed clean metadata row */}
          <div className="flex items-center gap-2 text-xs text-[#4B5563] mb-2">
            <span className="font-medium text-[#002815]">{category?.name || 'Service'}</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {service.turnaround_time}
            </span>
          </div>

          <h3 className="font-heading text-lg font-bold text-[#111827] leading-snug">
            {service.title}
          </h3>

          <p className="mt-2 text-sm text-[#4B5563] leading-relaxed">
            {service.short_description}
          </p>

          {/* Urgency Dual Pricing Block */}
          <div className="mt-4 pt-4 border-t border-neutral-100">
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-2xl font-extrabold text-[#002815] tabular-nums font-heading">
                {formatNaira(service.ongoing_price)}
              </span>
              {hasPromo && (
                <span className="text-sm text-[#4B5563] line-through tabular-nums">
                  {formatNaira(service.original_price)}
                </span>
              )}
              {service.is_placeholder_price && (
                <span className="text-xs font-medium text-amber-700">
                  (Starting Estimate)
                </span>
              )}
            </div>
            {hasPromo && (
              <p className="text-xs font-medium text-red-700 mt-1">
                Ongoing Promo Rate — Lock price before offer ends
              </p>
            )}
          </div>

          {/* Deliverables */}
          <ul className="mt-4 space-y-2">
            {service.deliverables.slice(0, 4).map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-[#4B5563]">
                <Check className="w-4 h-4 text-[#002815] shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Action Footer */}
      <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-2 flex flex-col gap-2.5">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-[#002815] text-white text-sm font-semibold hover:bg-[#003d20] transition-colors whitespace-nowrap"
        >
          <MessageCircle className="w-4 h-4 text-[#FEBD12] shrink-0" />
          <span>Claim Offer via WhatsApp</span>
        </a>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              openInquiryModal({
                serviceCategory: category?.name,
                subService: service.title,
              })
            }
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border border-neutral-300 text-xs font-semibold text-[#111827] hover:bg-[#F3F5F2] transition-colors cursor-pointer whitespace-nowrap"
          >
            <FileText className="w-3.5 h-3.5 text-[#002815]" />
            <span>Inquire via Form</span>
          </button>
          {onInspect && (
            <button
              type="button"
              onClick={() => onInspect(service)}
              className="px-3 py-2 rounded-md border border-neutral-200 text-xs font-medium text-[#4B5563] hover:text-[#002815] hover:bg-[#F3F5F2] transition-colors cursor-pointer whitespace-nowrap"
            >
              Details
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
