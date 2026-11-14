import React, { useEffect, useState } from 'react';
import { ArrowUp, ArrowDown, Plus, Trash2, Save } from 'lucide-react';
import { useCms } from '@/src/context/CmsContext';
import { useToast } from '@/src/context/ToastContext';
import {
  BusinessDaySchedule,
  ContactPerson,
  PageKey,
  PageSection,
  SectionCardItem,
  SiteSettings,
} from '@/src/types/cms';
import { ImageUploader } from '@/src/components/ImageUploader';
import { ConfirmDeleteModal } from '@/src/components/ConfirmDeleteModal';
import { formatBusinessScheduleLines } from '@/src/utils/formatters';

type DeleteTarget =
  | { kind: 'slide'; id: string; label: string }
  | { kind: 'phrase'; index: number; label: string }
  | { kind: 'card'; id: string; label: string }
  | { kind: 'contact'; id: string; label: string };

export const SiteContentTab: React.FC = () => {
  const { db, getSection, updateSiteSettings, updatePageSection } = useCms();
  const { showToast } = useToast();

  const [subTab, setSubTab] = useState<'hero' | 'pages' | 'brand'>('hero');
  const [settingsDraft, setSettingsDraft] = useState<SiteSettings>(db.site_settings);
  const [heroSectionDraft, setHeroSectionDraft] = useState<PageSection>(() => getSection('home_hero'));
  const [newPhrase, setNewPhrase] = useState('');

  const [selectedPageKey, setSelectedPageKey] = useState<PageKey>('home');
  const pageSections = db.page_sections.filter((s) => s.page_key === selectedPageKey);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('home_hero');
  const [sectionDraft, setSectionDraft] = useState<PageSection>(() => getSection('home_hero'));

  const [pendingDelete, setPendingDelete] = useState<DeleteTarget | null>(null);

  useEffect(() => {
    setSettingsDraft(db.site_settings);
  }, [db.site_settings]);

  useEffect(() => {
    setHeroSectionDraft(getSection('home_hero'));
  }, [db.page_sections, getSection]);

  useEffect(() => {
    const first = db.page_sections.find((s) => s.page_key === selectedPageKey);
    if (first) {
      setSelectedSectionId(first.id);
      setSectionDraft(first);
    }
  }, [selectedPageKey]);

  useEffect(() => {
    const current = db.page_sections.find((s) => s.id === selectedSectionId);
    if (current) setSectionDraft(current);
  }, [db.page_sections, selectedSectionId]);

  const handleSelectSection = (id: string) => {
    setSelectedSectionId(id);
    const found = db.page_sections.find((s) => s.id === id);
    if (found) setSectionDraft(found);
  };

  const saveHeroAll = (e?: React.FormEvent) => {
    e?.preventDefault();
    updatePageSection(heroSectionDraft);
    updateSiteSettings(settingsDraft);
    showToast('Hero headline, background slides, and typewriter phrases saved!', 'success');
  };

  const saveSettings = (e?: React.FormEvent) => {
    e?.preventDefault();
    const cleanedContacts = settingsDraft.contact_persons.filter(
      (c) => c.name.trim() || c.phone.trim()
    );
    const formattedSummary = formatBusinessScheduleLines(settingsDraft.business_schedule).join(' · ');
    const nextSettings: SiteSettings = {
      ...settingsDraft,
      contact_persons: cleanedContacts,
      business_hours: formattedSummary || settingsDraft.business_hours,
    };
    updateSiteSettings(nextSettings);
    showToast('Brand, contact directory, and business hours saved!', 'success');
  };

  const moveSlide = (index: number, direction: -1 | 1) => {
    const next = [...settingsDraft.hero_slides];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setSettingsDraft({ ...settingsDraft, hero_slides: next });
  };

  const addSlide = () => {
    setSettingsDraft({
      ...settingsDraft,
      hero_slides: [
        ...settingsDraft.hero_slides,
        {
          id: `slide-${Date.now()}`,
          image_url: '',
          caption: 'New Hero Showcase Slide',
          alt: 'Daags Digital Concept service showcase',
        },
      ],
    });
  };

  const addPhrase = () => {
    if (!newPhrase.trim()) return;
    setSettingsDraft({
      ...settingsDraft,
      typewriter_phrases: [...settingsDraft.typewriter_phrases, newPhrase.trim()],
    });
    setNewPhrase('');
  };

  const addContactPerson = () => {
    const next: ContactPerson = {
      id: `cp-${Date.now()}`,
      name: '',
      phone: '',
      role: '',
    };
    setSettingsDraft({
      ...settingsDraft,
      contact_persons: [...settingsDraft.contact_persons, next],
    });
  };

  const updateContactPerson = (id: string, field: keyof ContactPerson, value: string) => {
    setSettingsDraft({
      ...settingsDraft,
      contact_persons: settingsDraft.contact_persons.map((c) =>
        c.id === id ? { ...c, [field]: value } : c
      ),
    });
  };

  const updateDaySchedule = (
    dayName: BusinessDaySchedule['day'],
    patch: Partial<BusinessDaySchedule>
  ) => {
    setSettingsDraft({
      ...settingsDraft,
      business_schedule: settingsDraft.business_schedule.map((d) =>
        d.day === dayName ? { ...d, ...patch } : d
      ),
    });
  };

  const applyWeekdayHoursPreset = () => {
    setSettingsDraft({
      ...settingsDraft,
      business_schedule: settingsDraft.business_schedule.map((d) =>
        ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(d.day)
          ? { ...d, is_off: false, open_time: '08:00', close_time: '18:00' }
          : d
      ),
    });
    showToast('Applied 8:00 AM – 6:00 PM to Monday–Friday.', 'info');
  };

  const saveSection = (e: React.FormEvent) => {
    e.preventDefault();
    updatePageSection(sectionDraft);
    showToast(`Saved "${sectionDraft.label}" changes to live website.`, 'success');
  };

  const updateCardItem = (cardId: string, field: keyof SectionCardItem, value: string) => {
    setSectionDraft({
      ...sectionDraft,
      cards_array: sectionDraft.cards_array.map((c) =>
        c.id === cardId ? { ...c, [field]: value } : c
      ),
    });
  };

  const addCardItem = () => {
    setSectionDraft({
      ...sectionDraft,
      cards_array: [
        ...sectionDraft.cards_array,
        {
          id: `card-${Date.now()}`,
          title: 'New Highlight Item',
          subtitle: '',
          description: 'Describe this highlight clearly.',
          icon_name: 'ShieldCheck',
        },
      ],
    });
  };

  const confirmDeleteAction = () => {
    if (!pendingDelete) return;
    if (pendingDelete.kind === 'slide') {
      setSettingsDraft({
        ...settingsDraft,
        hero_slides: settingsDraft.hero_slides.filter((s) => s.id !== pendingDelete.id),
      });
      showToast('Slide removed. Click Save Hero Changes to publish.', 'info');
    } else if (pendingDelete.kind === 'phrase') {
      setSettingsDraft({
        ...settingsDraft,
        typewriter_phrases: settingsDraft.typewriter_phrases.filter(
          (_, i) => i !== pendingDelete.index
        ),
      });
      showToast('Typewriter phrase removed. Click Save Hero Changes to publish.', 'info');
    } else if (pendingDelete.kind === 'card') {
      setSectionDraft({
        ...sectionDraft,
        cards_array: sectionDraft.cards_array.filter((c) => c.id !== pendingDelete.id),
      });
      showToast('Section card removed. Click Save Section to publish.', 'info');
    } else if (pendingDelete.kind === 'contact') {
      setSettingsDraft({
        ...settingsDraft,
        contact_persons: settingsDraft.contact_persons.filter((c) => c.id !== pendingDelete.id),
      });
      showToast('Contact person removed. Click Save Global Settings to publish.', 'info');
    }
    setPendingDelete(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-extrabold text-[#111827]">
          Full-Site Visual Content Editor (CMS)
        </h2>
        <p className="text-xs text-[#4B5563]">
          Edit Hero text & background slides, typewriter phrases, every page section, contact persons, and business hours.
        </p>
      </div>

      {/* Sub-navigation */}
      <div className="flex flex-wrap gap-2 border-b border-neutral-200 pb-3">
        {[
          { key: 'hero', label: 'Hero Section, Slides & Typewriter' },
          { key: 'pages', label: 'Page & Section Editor' },
          { key: 'brand', label: 'Brand, Contact Directory & Hours' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setSubTab(tab.key as 'hero' | 'pages' | 'brand')}
            className={`px-4 py-2 rounded-md text-xs font-semibold cursor-pointer ${
              subTab === tab.key
                ? 'bg-[#002815] text-white'
                : 'bg-white border border-neutral-200 text-[#4B5563] hover:text-[#111827]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. HERO SECTION TEXT, SLIDES & TYPEWRITER */}
      {subTab === 'hero' && (
        <div className="space-y-6">
          <form
            onSubmit={saveHeroAll}
            className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3">
              <div>
                <h3 className="font-heading text-base font-bold text-[#111827]">
                  Hero Section Text & Action Buttons
                </h3>
                <p className="text-xs text-[#4B5563]">
                  Keep the Hero headline and subheading short and crisp for maximum conversion.
                </p>
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#002815] text-white text-xs font-semibold hover:bg-[#003d20] cursor-pointer self-start"
              >
                <Save className="w-3.5 h-3.5 text-[#FEBD12]" />
                <span>Save Hero Changes</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Hero Headline (Short & Direct)</label>
              <input
                type="text"
                value={heroSectionDraft.heading}
                onChange={(e) =>
                  setHeroSectionDraft({ ...heroSectionDraft, heading: e.target.value })
                }
                className="w-full px-3 py-2 text-sm rounded-md border border-neutral-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Hero Subheading (1 Short Sentence)</label>
              <textarea
                rows={2}
                value={heroSectionDraft.subheading}
                onChange={(e) =>
                  setHeroSectionDraft({ ...heroSectionDraft, subheading: e.target.value })
                }
                className="w-full px-3 py-2 text-sm rounded-md border border-neutral-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">
                Optional Supporting Line (Leave blank to keep Hero clean)
              </label>
              <input
                type="text"
                value={heroSectionDraft.body_content}
                onChange={(e) =>
                  setHeroSectionDraft({ ...heroSectionDraft, body_content: e.target.value })
                }
                className="w-full px-3 py-2 text-sm rounded-md border border-neutral-300"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Primary Button Text</label>
                <input
                  type="text"
                  value={heroSectionDraft.cta_text}
                  onChange={(e) =>
                    setHeroSectionDraft({ ...heroSectionDraft, cta_text: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-md border border-neutral-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Primary Button Link</label>
                <input
                  type="text"
                  value={heroSectionDraft.cta_link}
                  onChange={(e) =>
                    setHeroSectionDraft({ ...heroSectionDraft, cta_link: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-md border border-neutral-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Secondary WhatsApp Button Label</label>
                <input
                  type="text"
                  value={heroSectionDraft.secondary_cta_text}
                  onChange={(e) =>
                    setHeroSectionDraft({
                      ...heroSectionDraft,
                      secondary_cta_text: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-sm rounded-md border border-neutral-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Secondary Button Link</label>
                <input
                  type="text"
                  value={heroSectionDraft.secondary_cta_link}
                  onChange={(e) =>
                    setHeroSectionDraft({
                      ...heroSectionDraft,
                      secondary_cta_link: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-sm rounded-md border border-neutral-300"
                />
              </div>
            </div>
          </form>

          {/* Underground Hero Slideshow Images */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading text-base font-bold text-[#111827]">
                  Underground Hero Slideshow Images
                </h3>
                <p className="text-xs text-[#4B5563]">
                  Upload images from mobile or laptop, reorder display sequence, or remove slides.
                </p>
              </div>
              <button
                type="button"
                onClick={addSlide}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[#F3F5F2] border border-neutral-300 text-xs font-semibold text-[#111827] hover:bg-neutral-200 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Hero Slide</span>
              </button>
            </div>

            <div className="space-y-4">
              {settingsDraft.hero_slides.map((slide, idx) => (
                <div
                  key={slide.id}
                  className="p-4 rounded-lg border border-neutral-200 bg-[#F3F5F2]/40 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#002815]">Slide {idx + 1}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveSlide(idx, -1)}
                        aria-label="Move slide up"
                        className="p-1.5 rounded border border-neutral-300 bg-white disabled:opacity-40 cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === settingsDraft.hero_slides.length - 1}
                        onClick={() => moveSlide(idx, 1)}
                        aria-label="Move slide down"
                        className="p-1.5 rounded border border-neutral-300 bg-white disabled:opacity-40 cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={settingsDraft.hero_slides.length <= 1}
                        onClick={() =>
                          setPendingDelete({
                            kind: 'slide',
                            id: slide.id,
                            label: slide.caption || `Hero Slide ${idx + 1}`,
                          })
                        }
                        aria-label="Delete slide"
                        className="p-1.5 rounded border border-red-200 bg-white text-red-700 disabled:opacity-40 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <ImageUploader
                    label="Slide Background Image"
                    value={slide.image_url}
                    onChange={(url) =>
                      setSettingsDraft({
                        ...settingsDraft,
                        hero_slides: settingsDraft.hero_slides.map((s) =>
                          s.id === slide.id ? { ...s, image_url: url } : s
                        ),
                      })
                    }
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1">Slide Caption</label>
                      <input
                        type="text"
                        value={slide.caption}
                        onChange={(e) =>
                          setSettingsDraft({
                            ...settingsDraft,
                            hero_slides: settingsDraft.hero_slides.map((s) =>
                              s.id === slide.id ? { ...s, caption: e.target.value } : s
                            ),
                          })
                        }
                        className="w-full px-3 py-2 text-xs rounded-md border border-neutral-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Image Alt Description</label>
                      <input
                        type="text"
                        value={slide.alt}
                        onChange={(e) =>
                          setSettingsDraft({
                            ...settingsDraft,
                            hero_slides: settingsDraft.hero_slides.map((s) =>
                              s.id === slide.id ? { ...s, alt: e.target.value } : s
                            ),
                          })
                        }
                        className="w-full px-3 py-2 text-xs rounded-md border border-neutral-300 bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Typewriter Phrases */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
            <div>
              <h3 className="font-heading text-base font-bold text-[#111827]">
                Edge Typewriter Service Phrases
              </h3>
              <p className="text-xs text-[#4B5563]">
                Customize the services cycled inside the Live Service Desk card on the Hero edge.
              </p>
            </div>

            <div className="space-y-2">
              {settingsDraft.typewriter_phrases.map((phrase, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={phrase}
                    onChange={(e) => {
                      const next = [...settingsDraft.typewriter_phrases];
                      next[idx] = e.target.value;
                      setSettingsDraft({ ...settingsDraft, typewriter_phrases: next });
                    }}
                    className="flex-1 px-3 py-2 text-sm rounded-md border border-neutral-300"
                  />
                  <button
                    type="button"
                    disabled={settingsDraft.typewriter_phrases.length <= 1}
                    onClick={() =>
                      setPendingDelete({
                        kind: 'phrase',
                        index: idx,
                        label: phrase || `Phrase #${idx + 1}`,
                      })
                    }
                    aria-label={`Delete phrase ${phrase}`}
                    className="p-2 rounded-md border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-40 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newPhrase}
                onChange={(e) => setNewPhrase(e.target.value)}
                placeholder="Add new typewriter service line..."
                className="flex-1 px-3 py-2 text-sm rounded-md border border-neutral-300"
              />
              <button
                type="button"
                onClick={addPhrase}
                className="px-4 py-2 rounded-md border border-neutral-300 bg-[#F3F5F2] text-xs font-semibold hover:bg-neutral-200 cursor-pointer"
              >
                Add Line
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => saveHeroAll()}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-md bg-[#002815] text-white text-xs font-semibold hover:bg-[#003d20] cursor-pointer"
              >
                <Save className="w-4 h-4 text-[#FEBD12]" />
                <span>Save All Hero, Slides & Typewriter Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. PAGE & SECTION EDITOR */}
      {subTab === 'pages' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-xl border border-neutral-200 p-4 space-y-3">
              <label className="block text-xs font-bold text-[#111827]">1. Choose Page</label>
              <select
                value={selectedPageKey}
                onChange={(e) => setSelectedPageKey(e.target.value as PageKey)}
                className="w-full px-3 py-2 text-sm rounded-md border border-neutral-300 bg-white font-semibold"
              >
                <option value="home">Home Page (/)</option>
                <option value="services">Services Page (/services)</option>
                <option value="portfolio">Portfolio Page (/portfolio)</option>
                <option value="about">About Us Page (/about)</option>
                <option value="faqs">FAQs Page (/faqs)</option>
                <option value="contact">Contact Page (/contact)</option>
              </select>

              <label className="block text-xs font-bold text-[#111827] pt-2">
                2. Select Section to Edit
              </label>
              <div className="space-y-1.5">
                {pageSections.map((sec) => (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => handleSelectSection(sec.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      sectionDraft.id === sec.id
                        ? 'bg-[#002815] text-white'
                        : 'bg-[#F3F5F2] text-[#111827] hover:bg-neutral-200/80'
                    }`}
                  >
                    {sec.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-8">
            <form
              onSubmit={saveSection}
              className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <h3 className="font-heading text-base font-bold text-[#002815]">
                  Editing: {sectionDraft.label}
                </h3>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#002815] text-white text-xs font-semibold hover:bg-[#003d20] cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5 text-[#FEBD12]" />
                  <span>Save Section</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Section Heading</label>
                <input
                  type="text"
                  value={sectionDraft.heading}
                  onChange={(e) =>
                    setSectionDraft({ ...sectionDraft, heading: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-md border border-neutral-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Subheading</label>
                <textarea
                  rows={2}
                  value={sectionDraft.subheading}
                  onChange={(e) =>
                    setSectionDraft({ ...sectionDraft, subheading: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-md border border-neutral-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Body Copy / Supporting Text
                </label>
                <textarea
                  rows={3}
                  value={sectionDraft.body_content}
                  onChange={(e) =>
                    setSectionDraft({ ...sectionDraft, body_content: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-md border border-neutral-300"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Primary CTA Button Text</label>
                  <input
                    type="text"
                    value={sectionDraft.cta_text}
                    onChange={(e) =>
                      setSectionDraft({ ...sectionDraft, cta_text: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-md border border-neutral-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Primary CTA Link</label>
                  <input
                    type="text"
                    value={sectionDraft.cta_link}
                    onChange={(e) =>
                      setSectionDraft({ ...sectionDraft, cta_link: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-md border border-neutral-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Secondary CTA Text</label>
                  <input
                    type="text"
                    value={sectionDraft.secondary_cta_text}
                    onChange={(e) =>
                      setSectionDraft({ ...sectionDraft, secondary_cta_text: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-md border border-neutral-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Secondary CTA Link</label>
                  <input
                    type="text"
                    value={sectionDraft.secondary_cta_link}
                    onChange={(e) =>
                      setSectionDraft({ ...sectionDraft, secondary_cta_link: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-md border border-neutral-300"
                  />
                </div>
              </div>

              {(sectionDraft.image_url || sectionDraft.id === 'about_story') && (
                <ImageUploader
                  label="Section Image"
                  value={sectionDraft.image_url}
                  onChange={(url) => setSectionDraft({ ...sectionDraft, image_url: url })}
                />
              )}

              {(sectionDraft.cards_array.length > 0 || sectionDraft.section_key === 'testimonials') && (
                <div className="pt-4 border-t border-neutral-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-heading text-sm font-bold text-[#111827]">
                      {sectionDraft.section_key === 'testimonials'
                        ? `Client Testimonials (${sectionDraft.cards_array.length})`
                        : `Section Cards & Items (${sectionDraft.cards_array.length})`}
                    </h4>
                    <button
                      type="button"
                      onClick={addCardItem}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-[#F3F5F2] border border-neutral-300 text-xs font-semibold cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {sectionDraft.section_key === 'testimonials' ? 'Add Testimonial' : 'Add Card'}
                    </button>
                  </div>

                  <div className="space-y-3">
                    {sectionDraft.cards_array.map((card, cIdx) => (
                      <div
                        key={card.id}
                        className="p-3.5 rounded-lg border border-neutral-200 bg-[#F3F5F2]/50 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#002815]">
                            {sectionDraft.section_key === 'testimonials'
                              ? `Testimonial ${cIdx + 1}`
                              : `Card ${cIdx + 1}`}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setPendingDelete({
                                kind: 'card',
                                id: card.id,
                                label: card.title || `Card ${cIdx + 1}`,
                              })
                            }
                            className="text-red-700 hover:underline text-xs cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <input
                            type="text"
                            value={card.title}
                            onChange={(e) => updateCardItem(card.id, 'title', e.target.value)}
                            placeholder={
                              sectionDraft.section_key === 'testimonials'
                                ? 'Client Full Name'
                                : 'Card Title or Metric'
                            }
                            className="px-3 py-1.5 text-xs rounded border border-neutral-300 bg-white font-semibold"
                          />
                          <input
                            type="text"
                            value={card.subtitle || ''}
                            onChange={(e) => updateCardItem(card.id, 'subtitle', e.target.value)}
                            placeholder={
                              sectionDraft.section_key === 'testimonials'
                                ? 'Role, Company & Location (optional)'
                                : 'Subtitle (optional)'
                            }
                            className="px-3 py-1.5 text-xs rounded border border-neutral-300 bg-white"
                          />
                        </div>
                        <textarea
                          rows={2}
                          value={card.description}
                          onChange={(e) =>
                            updateCardItem(card.id, 'description', e.target.value)
                          }
                          placeholder={
                            sectionDraft.section_key === 'testimonials'
                              ? 'Client Quote / Review'
                              : 'Card Description'
                          }
                          className="w-full px-3 py-1.5 text-xs rounded border border-neutral-300 bg-white"
                        />
                        {sectionDraft.section_key === 'testimonials' && (
                          <ImageUploader
                            label="Client Photo (Optional)"
                            value={card.image_url || ''}
                            onChange={(url) => updateCardItem(card.id, 'image_url', url)}
                            helperText="Defaults to initials avatar if left empty"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-md bg-[#002815] text-white text-xs font-semibold hover:bg-[#003d20] cursor-pointer"
                >
                  <Save className="w-4 h-4 text-[#FEBD12]" />
                  <span>Publish Section Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. BRAND, CONTACT DIRECTORY & FLEXIBLE BUSINESS HOURS */}
      {subTab === 'brand' && (
        <form onSubmit={saveSettings} className="space-y-6 max-w-4xl">
          {/* Brand & Primary Settings */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
            <h3 className="font-heading text-base font-bold text-[#111827]">
              Global Brand, Address & Footer Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Brand Name</label>
                <input
                  type="text"
                  value={settingsDraft.brand_name}
                  onChange={(e) =>
                    setSettingsDraft({ ...settingsDraft, brand_name: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-md border border-neutral-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Primary Desk Phone</label>
                <input
                  type="text"
                  value={settingsDraft.phone}
                  onChange={(e) => setSettingsDraft({ ...settingsDraft, phone: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-md border border-neutral-300 tabular-nums"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Floating WhatsApp Number (e.g. 2348168779732)
                </label>
                <input
                  type="text"
                  value={settingsDraft.whatsapp}
                  onChange={(e) =>
                    setSettingsDraft({ ...settingsDraft, whatsapp: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-md border border-neutral-300 tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Official Email</label>
                <input
                  type="email"
                  value={settingsDraft.email}
                  onChange={(e) => setSettingsDraft({ ...settingsDraft, email: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-md border border-neutral-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Positioning Tagline</label>
              <input
                type="text"
                value={settingsDraft.tagline}
                onChange={(e) => setSettingsDraft({ ...settingsDraft, tagline: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-md border border-neutral-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Office & Support Address</label>
              <input
                type="text"
                value={settingsDraft.address}
                onChange={(e) => setSettingsDraft({ ...settingsDraft, address: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-md border border-neutral-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Footer Copyright Text</label>
              <input
                type="text"
                value={settingsDraft.footer_text}
                onChange={(e) =>
                  setSettingsDraft({ ...settingsDraft, footer_text: e.target.value })
                }
                className="w-full px-3 py-2 text-sm rounded-md border border-neutral-300"
              />
            </div>
          </div>

          {/* Editable Named Contact Persons Directory */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-heading text-base font-bold text-[#111827]">
                  Named Contact Persons Directory
                </h3>
                <p className="text-xs text-[#4B5563]">
                  Add, edit, or remove named contacts (e.g., Contact Gabriel: 08168779732, Contact Temidayo: 08100000000).
                </p>
              </div>
              <button
                type="button"
                onClick={addContactPerson}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[#F3F5F2] border border-neutral-300 text-xs font-semibold text-[#111827] hover:bg-neutral-200 cursor-pointer self-start"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Contact Person</span>
              </button>
            </div>

            <div className="space-y-3">
              {settingsDraft.contact_persons.map((person, idx) => (
                <div
                  key={person.id}
                  className="p-4 rounded-lg border border-neutral-200 bg-[#F3F5F2]/50 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
                >
                  <div className="sm:col-span-4">
                    <label className="block text-xs font-semibold mb-1">
                      Contact Name #{idx + 1}
                    </label>
                    <input
                      type="text"
                      value={person.name}
                      onChange={(e) => updateContactPerson(person.id, 'name', e.target.value)}
                      placeholder="e.g. Gabriel"
                      className="w-full px-3 py-2 text-sm rounded-md border border-neutral-300 bg-white"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <label className="block text-xs font-semibold mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={person.phone}
                      onChange={(e) => updateContactPerson(person.id, 'phone', e.target.value)}
                      placeholder="e.g. 08168779732"
                      className="w-full px-3 py-2 text-sm rounded-md border border-neutral-300 bg-white tabular-nums"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold mb-1">Desk / Note (Optional)</label>
                    <input
                      type="text"
                      value={person.role || ''}
                      onChange={(e) => updateContactPerson(person.id, 'role', e.target.value)}
                      placeholder="e.g. Client Desk"
                      className="w-full px-3 py-2 text-sm rounded-md border border-neutral-300 bg-white"
                    />
                  </div>
                  <div className="sm:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        setPendingDelete({
                          kind: 'contact',
                          id: person.id,
                          label: person.name ? `Contact ${person.name}` : `Contact #${idx + 1}`,
                        })
                      }
                      aria-label={`Remove contact ${person.name}`}
                      className="p-2 rounded-md border border-red-200 bg-white text-red-700 hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Flexible Day-by-Day Business Hours & Off-Days */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-heading text-base font-bold text-[#111827]">
                  Business Hours & Off Days Schedule
                </h3>
                <p className="text-xs text-[#4B5563]">
                  Customize opening/closing hours per day, or mark specific days as an Off Day (Closed).
                </p>
              </div>
              <button
                type="button"
                onClick={applyWeekdayHoursPreset}
                className="px-3 py-1.5 rounded-md border border-neutral-300 bg-[#F3F5F2] text-xs font-semibold text-[#111827] hover:bg-neutral-200 cursor-pointer self-start"
              >
                Preset: Mon–Fri 8am–6pm
              </button>
            </div>

            <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-lg overflow-hidden">
              {settingsDraft.business_schedule.map((item) => (
                <div
                  key={item.day}
                  className="p-3.5 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-4 min-w-[160px]">
                    <span className="font-heading text-sm font-bold text-[#111827] w-24">
                      {item.day}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateDaySchedule(item.day, { is_off: !item.is_off })}
                      className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                        item.is_off
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                      }`}
                    >
                      {item.is_off ? 'Off Day (Closed)' : 'Working Day'}
                    </button>
                  </div>

                  {item.is_off ? (
                    <span className="text-xs text-[#4B5563] italic">
                      Desk closed — toggle to Working Day to set hours
                    </span>
                  ) : (
                    <div className="flex items-center gap-2.5">
                      <label className="text-xs text-[#4B5563]">Open</label>
                      <input
                        type="time"
                        value={item.open_time}
                        onChange={(e) =>
                          updateDaySchedule(item.day, { open_time: e.target.value })
                        }
                        className="px-2.5 py-1.5 text-xs rounded-md border border-neutral-300 tabular-nums"
                      />
                      <label className="text-xs text-[#4B5563]">Close</label>
                      <input
                        type="time"
                        value={item.close_time}
                        onChange={(e) =>
                          updateDaySchedule(item.day, { close_time: e.target.value })
                        }
                        className="px-2.5 py-1.5 text-xs rounded-md border border-neutral-300 tabular-nums"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="p-3 rounded-lg bg-[#F3F5F2] border border-neutral-200 text-xs text-[#111827]">
              <span className="font-semibold text-[#002815]">Live Preview: </span>
              {formatBusinessScheduleLines(settingsDraft.business_schedule).join(' · ')}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-6 py-3 rounded-md bg-[#002815] text-white text-xs font-semibold hover:bg-[#003d20] cursor-pointer"
            >
              <Save className="w-4 h-4 text-[#FEBD12]" />
              <span>Save Brand, Contacts & Schedule</span>
            </button>
          </div>
        </form>
      )}

      {/* Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(pendingDelete)}
        title="Confirm Removal"
        itemName={pendingDelete?.label || ''}
        description="Are you sure you want to remove this item?"
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDeleteAction}
      />
    </div>
  );
};
