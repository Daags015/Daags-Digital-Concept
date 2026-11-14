import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useCms } from '@/src/context/CmsContext';
import { ServiceCard } from '@/src/components/ServiceCard';
import { ServiceDetailModal } from '@/src/components/ServiceDetailModal';
import { SubService } from '@/src/types/cms';

export const ServicesPage: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const { db, getSection, openInquiryModal } = useCms();

  const header = getSection('services_header');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState<SubService | null>(null);

  const publishedCategories = useMemo(
    () =>
      db.service_categories
        .filter((c) => c.is_published)
        .sort((a, b) => a.display_order - b.display_order),
    [db.service_categories]
  );

  const activeCategory = useMemo(
    () => publishedCategories.find((c) => c.slug === slug) || null,
    [publishedCategories, slug]
  );

  const filteredServices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return db.sub_services
      .filter((sub) => {
        if (!sub.is_published) return false;
        const cat = publishedCategories.find((c) => c.id === sub.category_id);
        if (!cat) return false;
        if (activeCategory && sub.category_id !== activeCategory.id) return false;
        if (!q) return true;
        return (
          sub.title.toLowerCase().includes(q) ||
          sub.short_description.toLowerCase().includes(q) ||
          cat.name.toLowerCase().includes(q) ||
          sub.deliverables.some((d) => d.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => a.display_order - b.display_order);
  }, [db.sub_services, publishedCategories, activeCategory, searchQuery]);

  return (
    <div className="bg-[#F3F5F2] min-h-screen">
      {/* Header Banner */}
      <section className="bg-[#002815] text-white py-14 border-b border-[#FEBD12]/25">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-semibold text-[#FEBD12]">
              Active Promotional Pricing · Transparent Deliverables
            </p>
            <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight">
              {activeCategory ? activeCategory.name : header.heading}
            </h1>
            <p className="text-base text-white/85 leading-relaxed">
              {activeCategory ? activeCategory.description : header.subheading}
            </p>
            {header.body_content && (
              <p className="text-xs text-white/70">{header.body_content}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() =>
              openInquiryModal({
                serviceCategory: activeCategory?.name,
              })
            }
            className="inline-flex items-center justify-center px-5 py-3 rounded-md bg-[#FEBD12] text-[#002815] text-sm font-bold hover:bg-[#f2b207] transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start lg:self-auto"
          >
            {header.cta_text || 'Need a Custom Package?'}
          </button>
        </div>
      </section>

      {/* Filter Tabs + Search */}
      <section className="bg-white border-b border-neutral-200 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
            <button
              type="button"
              onClick={() => navigate('/services')}
              className={`px-3.5 py-2 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                !activeCategory
                  ? 'bg-[#002815] text-white'
                  : 'bg-[#F3F5F2] text-[#4B5563] hover:text-[#111827]'
              }`}
            >
              All Services
            </button>
            {publishedCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => navigate(`/services/${cat.slug}`)}
                className={`px-3.5 py-2 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeCategory?.id === cat.id
                    ? 'bg-[#002815] text-white'
                    : 'bg-[#F3F5F2] text-[#4B5563] hover:text-[#111827]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-72 shrink-0">
            <Search className="w-4 h-4 text-[#4B5563] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search CAC, website, NIN, POS..."
              aria-label="Search services"
              className="w-full pl-9 pr-3.5 py-2 text-sm rounded-md border border-neutral-300 bg-white focus:outline-none focus:border-[#002815]"
            />
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredServices.length === 0 ? (
            <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center space-y-3">
              <p className="font-heading text-lg font-bold text-[#111827]">
                No matching services found
              </p>
              <p className="text-sm text-[#4B5563]">
                Try clearing your search filter or ask our desk for a bespoke package.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  navigate('/services');
                }}
                className="px-4 py-2 rounded-md bg-[#002815] text-white text-xs font-semibold cursor-pointer"
              >
                Show All Services
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((service) => {
                const cat = publishedCategories.find((c) => c.id === service.category_id);
                return (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    category={cat}
                    onInspect={(s) => setSelectedService(s)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>

      <ServiceDetailModal
        service={selectedService}
        category={
          selectedService
            ? publishedCategories.find((c) => c.id === selectedService.category_id)
            : undefined
        }
        onClose={() => setSelectedService(null)}
      />
    </div>
  );
};
