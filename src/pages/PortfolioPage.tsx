import React, { useMemo, useState } from 'react';
import { ExternalLink, MessageCircle } from 'lucide-react';
import { useCms } from '@/src/context/CmsContext';
import { ResilientImage } from '@/src/components/ResilientImage';
import { buildWhatsAppLink } from '@/src/utils/formatters';

export const PortfolioPage: React.FC = () => {
  const { db, getSection } = useCms();
  const header = getSection('portfolio_header');

  const categories = useMemo(() => {
    const set = new Set(db.portfolio_projects.map((p) => p.category));
    return ['All Projects', ...Array.from(set)];
  }, [db.portfolio_projects]);

  const [selectedCategory, setSelectedCategory] = useState('All Projects');

  const filtered = useMemo(() => {
    if (selectedCategory === 'All Projects') return db.portfolio_projects;
    return db.portfolio_projects.filter((p) => p.category === selectedCategory);
  }, [db.portfolio_projects, selectedCategory]);

  return (
    <div className="bg-[#F3F5F2] min-h-screen">
      <section className="bg-[#002815] text-white py-14 border-b border-[#FEBD12]/25">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-semibold text-[#FEBD12]">Client Showcase</p>
            <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight">
              {header.heading}
            </h1>
            <p className="text-base text-white/85 leading-relaxed">{header.subheading}</p>
            {header.body_content && (
              <p className="text-xs text-white/70">{header.body_content}</p>
            )}
          </div>
          <a
            href={buildWhatsAppLink(
              db.site_settings.whatsapp,
              'Hello Daags Digital Concept, I saw your portfolio and would like to request a website quote.'
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-[#FEBD12] text-[#002815] text-sm font-bold hover:bg-[#f2b207] transition-colors whitespace-nowrap shrink-0 self-start lg:self-auto"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{header.cta_text || 'Request Similar Website'}</span>
          </a>
        </div>
      </section>

      <section className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-2 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#002815] text-white'
                  : 'bg-[#F3F5F2] text-[#4B5563] hover:text-[#111827]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((project) => (
              <article
                key={project.id}
                className="bg-white rounded-xl border border-neutral-200 overflow-hidden flex flex-col justify-between"
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
                    <h2 className="font-heading text-lg font-bold text-[#111827]">
                      {project.title}
                    </h2>
                    <p className="mt-2 text-sm text-[#4B5563] leading-relaxed">
                      {project.description}
                    </p>
                    {project.outcome_metric && (
                      <p className="mt-3 text-xs font-semibold text-[#002815]">
                        Outcome: {project.outcome_metric}
                      </p>
                    )}
                  </div>
                </div>

                <div className="px-6 pb-6 pt-3 border-t border-neutral-100 flex items-center justify-between gap-3">
                  <a
                    href={buildWhatsAppLink(
                      db.site_settings.whatsapp,
                      `Hello Daags Digital Concept, I want to request a website similar to "${project.title}".`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[#002815] text-white text-xs font-semibold hover:bg-[#003d20] transition-colors whitespace-nowrap"
                  >
                    <span>Request Similar Website</span>
                  </a>
                  {project.live_url && (
                    <a
                      href={project.live_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#4B5563] hover:text-[#111827]"
                    >
                      <span>Live URL</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
