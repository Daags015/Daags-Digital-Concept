import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MessageCircle, ChevronRight } from 'lucide-react';
import { useCms } from '@/src/context/CmsContext';
import { buildWhatsAppLink } from '@/src/utils/formatters';

export const HeroSection: React.FC = () => {
  const { db, getSection } = useCms();
  const hero = getSection('home_hero');
  const slides = db.site_settings.hero_slides;
  const phrases = db.site_settings.typewriter_phrases.length
    ? db.site_settings.typewriter_phrases
    : ['Website Design & Development...', 'CAC Business & Company Registration...'];

  const [activeSlide, setActiveSlide] = useState(0);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Automated underground multi-image slideshow crossfade
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 5200);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  // Smooth typewriter cycle
  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const currentPhrase = phrases[phraseIndex % phrases.length] || '';

    if (prefersReduced) {
      setDisplayedText(currentPhrase);
      const jump = window.setTimeout(() => {
        setPhraseIndex((prev) => (prev + 1) % phrases.length);
      }, 3200);
      return () => window.clearTimeout(jump);
    }

    let timeoutId: number;
    if (!isDeleting && displayedText.length < currentPhrase.length) {
      timeoutId = window.setTimeout(() => {
        setDisplayedText(currentPhrase.slice(0, displayedText.length + 1));
      }, 48);
    } else if (!isDeleting && displayedText.length === currentPhrase.length) {
      timeoutId = window.setTimeout(() => {
        setIsDeleting(true);
      }, 2000);
    } else if (isDeleting && displayedText.length > 0) {
      timeoutId = window.setTimeout(() => {
        setDisplayedText(currentPhrase.slice(0, displayedText.length - 1));
      }, 26);
    } else {
      setIsDeleting(false);
      setPhraseIndex((prev) => (prev + 1) % phrases.length);
    }

    return () => window.clearTimeout(timeoutId);
  }, [displayedText, isDeleting, phraseIndex, phrases]);

  const whatsappHref = buildWhatsAppLink(
    db.site_settings.whatsapp,
    'Hello Daags Digital Concept, I would like to discuss your digital and business support services.'
  );

  const currentCaption = slides[activeSlide]?.caption || '';

  return (
    <section className="relative min-h-[620px] lg:min-h-[680px] flex items-center overflow-hidden bg-[#002815]">
      {/* Underground Multi-Image Background Slideshow */}
      <div className="absolute inset-0 z-0" aria-hidden="true">
        {slides.map((slide, idx) => (
          <img
            key={slide.id}
            src={slide.image_url}
            alt={slide.alt}
            referrerPolicy="no-referrer"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
              idx === activeSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.02]'
            }`}
          />
        ))}
        {/* Deep Forest Green rgba(0, 40, 21, 0.84) gradient scrim for maximum WCAG contrast */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(105deg, rgba(0, 40, 21, 0.94) 0%, rgba(0, 40, 21, 0.84) 55%, rgba(0, 28, 15, 0.78) 100%)',
          }}
        />
      </div>

      {/* Foreground Content + Edge Typewriter Dock */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-end lg:items-center">
          {/* Primary Hero Copy (Left Dominant Focal Column) */}
          <div className="lg:col-span-7 space-y-5">
            <p className="text-xs sm:text-sm font-semibold tracking-wide text-[#FEBD12]">
              {db.site_settings.brand_name}
            </p>

            <h1
              className="font-heading font-extrabold text-white tracking-tight leading-[1.1] max-w-xl"
              style={{ fontSize: 'clamp(2.25rem, 4.2vw, 3.6rem)', textWrap: 'balance' }}
            >
              {hero.heading}
            </h1>

            {hero.subheading && (
              <p className="text-base sm:text-lg text-white/90 leading-relaxed max-w-lg">
                {hero.subheading}
              </p>
            )}

            {hero.body_content && (
              <p className="text-sm text-white/75 max-w-md">
                {hero.body_content}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to={hero.cta_link || '/services'}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-md bg-[#FEBD12] text-[#002815] font-semibold text-sm sm:text-base hover:bg-[#f2b207] transition-colors whitespace-nowrap shadow-lg"
              >
                <span>{hero.cta_text || 'Explore Services'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-md bg-white/10 text-white border border-white/25 hover:bg-white/20 font-semibold text-sm sm:text-base transition-colors whitespace-nowrap"
              >
                <MessageCircle className="w-4 h-4 text-[#FEBD12]" />
                <span>{hero.secondary_cta_text || 'WhatsApp Us'}</span>
              </a>
            </div>

            {/* Subtle Slide Pagination Indicators */}
            {slides.length > 1 && (
              <div className="flex items-center gap-3 pt-4">
                <div className="flex items-center gap-1.5">
                  {slides.map((slide, idx) => (
                    <button
                      key={slide.id}
                      type="button"
                      onClick={() => setActiveSlide(idx)}
                      aria-label={`View hero slide ${idx + 1}: ${slide.caption}`}
                      className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                        idx === activeSlide ? 'w-8 bg-[#FEBD12]' : 'w-2.5 bg-white/35 hover:bg-white/60'
                      }`}
                    />
                  ))}
                </div>
                {currentCaption && (
                  <span className="text-xs text-white/70 truncate max-w-xs">
                    {currentCaption}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Edge Typewriter Service Display (Right Edge on Desktop, Bottom Dock on Mobile) */}
          <div className="lg:col-span-5 lg:flex lg:justify-end">
            <div className="w-full max-w-md lg:ml-auto rounded-xl bg-[#001d0f]/80 backdrop-blur-md border border-[#FEBD12]/45 p-6 shadow-2xl">
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full bg-[#FEBD12] shrink-0"
                    aria-hidden="true"
                  />
                  <span className="text-xs font-semibold text-white/90 tracking-wide">
                    Live Service Desk
                  </span>
                </div>
                <span className="text-xs font-medium text-[#FEBD12] tabular-nums">
                  {db.site_settings.phone}
                </span>
              </div>

              <div className="py-5 min-h-[108px] flex flex-col justify-center">
                <span className="text-xs text-white/65 mb-2">Now onboarding clients for:</span>
                <p className="font-heading text-xl sm:text-2xl font-bold text-white leading-snug">
                  {displayedText}
                  <span
                    aria-hidden="true"
                    className="inline-block w-[3px] h-6 bg-[#FEBD12] ml-1 align-middle animate-cursor-blink"
                  />
                </p>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-4">
                <span className="text-xs text-white/75">
                  Active Promo Rates Available
                </span>
                <Link
                  to="/services"
                  aria-label="Go to services directory"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[#FEBD12] text-[#002815] text-xs font-bold hover:bg-[#f2b207] transition-colors whitespace-nowrap shrink-0"
                >
                  <span>View Services</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
