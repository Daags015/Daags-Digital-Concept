import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin } from 'lucide-react';
import { useCms } from '@/src/context/CmsContext';
import { ResilientImage } from '@/src/components/ResilientImage';

export const AboutPage: React.FC = () => {
  const { getSection } = useCms();
  const story = getSection('about_story');
  const missionVision = getSection('about_mission_vision');
  const coverage = getSection('about_coverage');

  return (
    <div>
      {/* Story Split Section */}
      <section className="bg-white py-16 lg:py-20 border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-center space-y-5">
            <p className="text-xs font-semibold text-[#002815]">About Daags Digital Concept</p>
            <h1
              className="font-heading text-3xl sm:text-4xl font-extrabold text-[#111827] tracking-tight"
              style={{ textWrap: 'balance' }}
            >
              {story.heading}
            </h1>
            <p className="text-base font-medium text-[#002815]">{story.subheading}</p>
            <p className="text-base text-[#4B5563] leading-relaxed">{story.body_content}</p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to={story.cta_link || '/contact'}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-[#002815] text-white text-sm font-semibold hover:bg-[#003d20] transition-colors"
              >
                <span>{story.cta_text || 'Work With Our Team'}</span>
                <ArrowRight className="w-4 h-4 text-[#FEBD12]" />
              </Link>
              <Link
                to={story.secondary_cta_link || '/services'}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-md border border-neutral-300 text-sm font-semibold text-[#111827] hover:bg-[#F3F5F2] transition-colors"
              >
                <span>{story.secondary_cta_text || 'Browse Services'}</span>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-xl overflow-hidden border border-neutral-200 bg-[#F3F5F2] h-full min-h-[320px]">
              <ResilientImage
                src={story.image_url}
                alt="Daags Digital Concept advisory and engineering team"
                fallbackTitle="Daags Digital Concept"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Mission, Vision & Core Values */}
      <section className="bg-[#F3F5F2] py-16 lg:py-20 border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10 space-y-2">
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#111827]">
              {missionVision.heading}
            </h2>
            <p className="text-base text-[#4B5563]">{missionVision.subheading}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {missionVision.cards_array.map((card) => (
              <div
                key={card.id}
                className="bg-white rounded-xl border border-neutral-200 p-6 space-y-2"
              >
                <h3 className="font-heading text-lg font-bold text-[#002815]">{card.title}</h3>
                <p className="text-sm text-[#4B5563] leading-relaxed">{card.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nationwide & Diaspora Coverage */}
      <section className="bg-white py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-10 space-y-3">
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#111827]">
              {coverage.heading}
            </h2>
            <p className="text-base font-medium text-[#002815]">{coverage.subheading}</p>
            <p className="text-sm text-[#4B5563] leading-relaxed">{coverage.body_content}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {coverage.cards_array.map((item) => (
              <div
                key={item.id}
                className="rounded-xl bg-[#F3F5F2] border border-neutral-200 p-6 space-y-2"
              >
                <div className="w-9 h-9 rounded-md bg-[#002815] text-[#FEBD12] flex items-center justify-center mb-3">
                  <MapPin className="w-4 h-4" />
                </div>
                <h3 className="font-heading text-base font-bold text-[#111827]">{item.title}</h3>
                <p className="text-sm text-[#4B5563] leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
