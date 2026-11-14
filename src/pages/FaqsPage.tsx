import React, { useMemo, useState } from 'react';
import { ChevronDown, MessageCircle, Search } from 'lucide-react';
import { useCms } from '@/src/context/CmsContext';
import { buildWhatsAppLink } from '@/src/utils/formatters';

export const FaqsPage: React.FC = () => {
  const { db, getSection } = useCms();
  const header = getSection('faqs_header');

  const categories = useMemo(() => {
    const set = new Set(db.faqs.map((f) => f.category));
    return ['All', ...Array.from(set)];
  }, [db.faqs]);

  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState<string | null>(db.faqs[0]?.id || null);

  const filteredFaqs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...db.faqs]
      .sort((a, b) => a.display_order - b.display_order)
      .filter((faq) => {
        if (activeCategory !== 'All' && faq.category !== activeCategory) return false;
        if (!q) return true;
        return (
          faq.question.toLowerCase().includes(q) || faq.answer.toLowerCase().includes(q)
        );
      });
  }, [db.faqs, activeCategory, search]);

  return (
    <div className="bg-[#F3F5F2] min-h-screen">
      <section className="bg-[#002815] text-white py-14 border-b border-[#FEBD12]/25">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight">
              {header.heading}
            </h1>
            <p className="text-base text-white/85">{header.subheading}</p>
            {header.body_content && (
              <p className="text-xs text-white/75">{header.body_content}</p>
            )}
          </div>
          <a
            href={buildWhatsAppLink(
              db.site_settings.whatsapp,
              'Hello Daags Digital Concept, I have a question about your services.'
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-[#FEBD12] text-[#002815] text-sm font-bold hover:bg-[#f2b207] transition-colors whitespace-nowrap shrink-0 self-start md:self-auto"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{header.cta_text || 'Ask on WhatsApp'}</span>
          </a>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-2 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                    activeCategory === cat
                      ? 'bg-[#002815] text-white'
                      : 'bg-white text-[#4B5563] border border-neutral-200 hover:text-[#111827]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64 shrink-0">
              <Search className="w-4 h-4 text-[#4B5563] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search questions..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-neutral-300 bg-white focus:outline-none focus:border-[#002815]"
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredFaqs.map((faq) => {
              const isOpen = openId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="bg-white rounded-xl border border-neutral-200 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : faq.id)}
                    aria-expanded={isOpen}
                    className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-neutral-50 transition-colors"
                  >
                    <div>
                      <span className="block text-xs font-medium text-[#002815] mb-0.5">
                        {faq.category}
                      </span>
                      <span className="font-heading text-sm sm:text-base font-bold text-[#111827]">
                        {faq.question}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-[#002815] shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 pt-3 text-sm text-[#4B5563] leading-relaxed border-t border-neutral-100">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};
