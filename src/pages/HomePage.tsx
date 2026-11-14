import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, ExternalLink, MessageCircle, Quote, Star } from 'lucide-react';
import { useCms } from '@/src/context/CmsContext';
import { HeroSection } from '@/src/components/HeroSection';
import { IconResolver } from '@/src/components/IconResolver';
import { ResilientImage } from '@/src/components/ResilientImage';
import { buildWhatsAppLink, calculateDiscountPercent, formatNaira } from '@/src/utils/formatters';

export const HomePage: React.FC = () => {
  const { db, getSection, openInquiryModal } = useCms();
  const [openFaqId, setOpenFaqId] = useState<string | null>(db.faqs[0]?.id || null);

  const statsSection = getSection('home_stats');
  const servicesSection = getSection('home_services');
  const whySection = getSection('home_why_choose');
  const portfolioSection = getSection('home_portfolio');
  const processSection = getSection('home_process');
  const testimonialsSection = getSection('home_testimonials');
  const faqSection = getSection('home_faq');
  const ctaBanner = getSection('home_cta_banner');

  const publishedCategories = db.service_categories
    .filter((c) => c.is_published)
    .sort((a, b) => a.display_order - b.display_order);

  const featuredProjects = db.portfolio_projects.filter((p) => p.is_featured).slice(0, 3);
  const previewFaqs = [...db.faqs]
    .sort((a, b) => a.display_order - b.display_order)
    .slice(0, 4);

  const bannerWhatsAppUrl = buildWhatsAppLink(
    db.site_settings.whatsapp,
    'Hello Daags Digital Concept, I would like to claim an ongoing promo package.'
  );

  return (
    <div>
      {/* 1. Multi-Image Underground Hero + Edge Typewriter */}
      <HeroSection />

      {/* 2. Trust Stats Bar */}
      <section className="bg-[#F3F5F2] border-b border-neutral-200 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {statsSection.cards_array.map((stat) => (
              <div key={stat.id} className="space-y-1">
                <p className="font-heading text-3xl font-extrabold text-[#002815] tabular-nums">
                  {stat.title}
                </p>
                {stat.subtitle && (
                  <p className="text-sm font-semibold text-[#111827]">{stat.subtitle}</p>
                )}
                <p className="text-xs text-[#4B5563] leading-relaxed">{stat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. 5 Core Services Grid */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="max-w-2xl space-y-3">
              <h2
                className="font-heading text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight"
                style={{ textWrap: 'balance' }}
              >
                {servicesSection.heading}
              </h2>
              <p className="text-base text-[#4B5563] leading-relaxed">
                {servicesSection.subheading}
              </p>
            </div>
            <Link
              to={servicesSection.cta_link || '/services'}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-[#002815] text-white text-sm font-semibold hover:bg-[#003d20] transition-colors whitespace-nowrap shrink-0 self-start md:self-auto"
            >
              <span>{servicesSection.cta_text || 'View Full Pricing & Promos'}</span>
              <ArrowRight className="w-4 h-4 text-[#FEBD12]" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publishedCategories.map((category, index) => {
              const catSubs = db.sub_services.filter(
                (s) => s.category_id === category.id && s.is_published
              );
              const lowestPromoSub = [...catSubs].sort(
                (a, b) => a.ongoing_price - b.ongoing_price
              )[0];
              const discount = lowestPromoSub
                ? calculateDiscountPercent(lowestPromoSub.original_price, lowestPromoSub.ongoing_price)
                : 0;

              return (
                <Link
                  key={category.id}
                  to={`/services/${category.slug}`}
                  className={`group rounded-xl border border-neutral-200 bg-white p-6 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:border-[#002815]/40 ${
                    index === 0 ? 'lg:col-span-2 bg-[#F3F5F2]/50' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-5">
                      <div className="w-11 h-11 rounded-lg bg-[#002815] text-[#FEBD12] flex items-center justify-center shrink-0">
                        <IconResolver name={category.icon_name} className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-medium text-[#4B5563] tabular-nums">
                        {catSubs.length} Packages
                      </span>
                    </div>

                    <h3 className="font-heading text-xl font-bold text-[#111827] group-hover:text-[#002815] transition-colors">
                      0{index + 1}. {category.name}
                    </h3>
                    <p className="mt-2 text-sm text-[#4B5563] leading-relaxed">
                      {category.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between gap-4">
                    {lowestPromoSub ? (
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-xs text-[#4B5563]">From</span>
                        <span className="font-heading text-lg font-extrabold text-[#002815] tabular-nums">
                          {formatNaira(lowestPromoSub.ongoing_price)}
                        </span>
                        {discount > 0 && (
                          <span className="text-xs text-[#4B5563] line-through tabular-nums">
                            {formatNaira(lowestPromoSub.original_price)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-[#4B5563]">Custom Pricing</span>
                    )}

                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#002815] group-hover:translate-x-0.5 transition-transform whitespace-nowrap">
                      Explore
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Why Choose Daags Digital (4 Cards) */}
      <section className="py-16 lg:py-20 bg-[#F3F5F2] border-y border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12 space-y-3">
            <h2
              className="font-heading text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight"
              style={{ textWrap: 'balance' }}
            >
              {whySection.heading}
            </h2>
            <p className="text-base text-[#4B5563] leading-relaxed">
              {whySection.subheading}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {whySection.cards_array.map((card) => (
              <div
                key={card.id}
                className="bg-white rounded-xl border border-neutral-200 p-6 space-y-3"
              >
                <div className="w-10 h-10 rounded-lg bg-[#F3F5F2] text-[#002815] flex items-center justify-center">
                  <IconResolver name={card.icon_name} className="w-5 h-5" />
                </div>
                <h3 className="font-heading text-base font-bold text-[#111827]">
                  {card.title}
                </h3>
                <p className="text-sm text-[#4B5563] leading-relaxed">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Featured Portfolio Preview */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="max-w-2xl space-y-3">
              <h2
                className="font-heading text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight"
                style={{ textWrap: 'balance' }}
              >
                {portfolioSection.heading}
              </h2>
              <p className="text-base text-[#4B5563] leading-relaxed">
                {portfolioSection.subheading}
              </p>
            </div>
            <Link
              to={portfolioSection.cta_link || '/portfolio'}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md border border-[#002815] text-[#002815] text-sm font-semibold hover:bg-[#002815] hover:text-white transition-colors whitespace-nowrap shrink-0 self-start md:self-auto"
            >
              <span>{portfolioSection.cta_text || 'Explore Full Portfolio'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredProjects.map((project) => (
              <article
                key={project.id}
                className="rounded-xl border border-neutral-200 bg-white overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-[4/3] bg-[#F3F5F2] overflow-hidden">
                    <ResilientImage
                      src={project.image_url}
                      alt={project.title}
                      fallbackTitle={project.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 text-xs text-[#4B5563] mb-2">
                      <span className="font-semibold text-[#002815]">{project.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{project.client_name}</span>
                    </div>
                    <h3 className="font-heading text-lg font-bold text-[#111827]">
                      {project.title}
                    </h3>
                    <p className="mt-2 text-sm text-[#4B5563] leading-relaxed">
                      {project.description}
                    </p>
                    {project.outcome_metric && (
                      <p className="mt-3 text-xs font-semibold text-[#002815]">
                        Result: {project.outcome_metric}
                      </p>
                    )}
                  </div>
                </div>
                <div className="px-6 pb-6 pt-2 flex items-center justify-between gap-3 border-t border-neutral-100">
                  <a
                    href={buildWhatsAppLink(
                      db.site_settings.whatsapp,
                      `Hello Daags Digital Concept, I would like to request a website similar to "${project.title}".`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-[#002815] hover:underline"
                  >
                    Request Similar Website
                  </a>
                  {project.live_url && (
                    <a
                      href={project.live_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#4B5563] hover:text-[#111827]"
                    >
                      <span>Preview</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 6. 3-Step Onboarding Process */}
      <section className="py-16 lg:py-20 bg-[#002815] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="max-w-2xl space-y-3">
              <h2
                className="font-heading text-2xl sm:text-3xl font-extrabold text-white tracking-tight"
                style={{ textWrap: 'balance' }}
              >
                {processSection.heading}
              </h2>
              <p className="text-base text-white/80 leading-relaxed">
                {processSection.subheading}
              </p>
            </div>
            <button
              type="button"
              onClick={() => openInquiryModal()}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-[#FEBD12] text-[#002815] text-sm font-bold hover:bg-[#f2b207] transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start md:self-auto"
            >
              <span>{processSection.cta_text || 'Start Your Request Now'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {processSection.cards_array.map((step) => (
              <div
                key={step.id}
                className="rounded-xl bg-white/5 border border-white/15 p-6 space-y-3"
              >
                <div className="w-10 h-10 rounded-lg bg-[#FEBD12] text-[#002815] flex items-center justify-center">
                  <IconResolver name={step.icon_name} className="w-5 h-5" />
                </div>
                <h3 className="font-heading text-lg font-bold text-white">{step.title}</h3>
                <p className="text-sm text-white/80 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Client Testimonials */}
      {testimonialsSection.cards_array.length > 0 && (
        <section className="py-16 lg:py-20 bg-white border-b border-neutral-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div className="max-w-2xl space-y-3">
                <h2
                  className="font-heading text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight"
                  style={{ textWrap: 'balance' }}
                >
                  {testimonialsSection.heading}
                </h2>
                <p className="text-base text-[#4B5563] leading-relaxed">
                  {testimonialsSection.subheading}
                </p>
              </div>
              {testimonialsSection.cta_text && (
                <button
                  type="button"
                  onClick={() => openInquiryModal()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md border border-[#002815] text-[#002815] text-sm font-semibold hover:bg-[#002815] hover:text-white transition-colors whitespace-nowrap shrink-0 self-start md:self-auto cursor-pointer"
                >
                  <span>{testimonialsSection.cta_text}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonialsSection.cards_array.map((item) => {
                const initials = item.title
                  .split(' ')
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0]?.toUpperCase() || '')
                  .join('');

                return (
                  <article
                    key={item.id}
                    className="rounded-xl border border-neutral-200 bg-[#F3F5F2]/60 p-6 flex flex-col justify-between gap-6"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1" aria-label="5 out of 5 stars">
                          {[0, 1, 2, 3, 4].map((starIdx) => (
                            <Star
                              key={starIdx}
                              className="w-4 h-4 text-[#FEBD12] fill-[#FEBD12]"
                              aria-hidden="true"
                            />
                          ))}
                        </div>
                        <Quote className="w-5 h-5 text-[#002815]/30 shrink-0" aria-hidden="true" />
                      </div>

                      <p className="text-sm text-[#111827] leading-relaxed">
                        &ldquo;{item.description}&rdquo;
                      </p>
                    </div>

                    <div className="pt-4 border-t border-neutral-200/80 flex items-center gap-3">
                      {item.image_url ? (
                        <ResilientImage
                          src={item.image_url}
                          alt={item.title}
                          fallbackTitle={initials || 'DD'}
                          className="w-10 h-10 rounded-full object-cover border border-neutral-200 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#002815] text-[#FEBD12] font-heading text-xs font-extrabold flex items-center justify-center shrink-0">
                          {initials || 'DD'}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="font-heading text-sm font-bold text-[#111827] truncate">
                          {item.title}
                        </h3>
                        {item.subtitle && (
                          <p className="text-xs text-[#4B5563] truncate">{item.subtitle}</p>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 8. FAQ Preview */}
      <section className="py-16 lg:py-20 bg-[#F3F5F2]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div className="space-y-2">
              <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#111827]">
                {faqSection.heading}
              </h2>
              <p className="text-sm sm:text-base text-[#4B5563]">{faqSection.subheading}</p>
            </div>
            <Link
              to={faqSection.cta_link || '/faqs'}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#002815] hover:underline whitespace-nowrap shrink-0"
            >
              <span>{faqSection.cta_text || 'Read All FAQs'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {previewFaqs.map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="bg-white rounded-xl border border-neutral-200 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                    aria-expanded={isOpen}
                    className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-neutral-50 transition-colors"
                  >
                    <span className="font-heading text-sm sm:text-base font-bold text-[#111827]">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-[#002815] shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 text-sm text-[#4B5563] leading-relaxed border-t border-neutral-100 pt-3">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. Final Conversion Banner */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-[#002815] text-white p-8 sm:p-12 flex flex-col lg:flex-row lg:items-center justify-between gap-8 border border-[#FEBD12]/30">
            <div className="max-w-2xl space-y-3">
              <h2
                className="font-heading text-2xl sm:text-3xl font-extrabold text-white"
                style={{ textWrap: 'balance' }}
              >
                {ctaBanner.heading}
              </h2>
              <p className="text-base text-white/85 leading-relaxed">{ctaBanner.subheading}</p>
              {ctaBanner.body_content && (
                <p className="text-xs text-[#FEBD12] font-medium">{ctaBanner.body_content}</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <a
                href={bannerWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-md bg-[#FEBD12] text-[#002815] text-sm font-bold hover:bg-[#f2b207] transition-colors whitespace-nowrap"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{ctaBanner.cta_text || 'Claim Promo on WhatsApp'}</span>
              </a>
              <Link
                to={ctaBanner.secondary_cta_link || '/contact'}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-md border border-white/30 text-white text-sm font-semibold hover:bg-white/10 transition-colors whitespace-nowrap"
              >
                <span>{ctaBanner.secondary_cta_text || 'Submit Service Form'}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
