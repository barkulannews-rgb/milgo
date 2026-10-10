import React, { useEffect, useState } from 'react';
import { ArrowRight, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { HeroSlide, Language, Product } from '../../types';
import { getTranslation } from '../../lib/translations';
import { DEFAULT_HERO_SLIDES } from '../../lib/storage';
import { resolveHeroSlide, ResolvedHeroSlide } from '../../lib/heroSlides';

interface HeroProps {
  lang: Language;
  slides?: HeroSlide[];
  products: Product[];
  onExplore: () => void;
  onBestsellers: () => void;
  onViewProduct: (product: Product) => void;
}

const SLIDE_INTERVAL_MS = 7000;

const resolveAll = (slides: HeroSlide[], products: Product[], lang: Language) =>
  slides
    .filter((s) => s.active)
    .map((s) => resolveHeroSlide(s, products, lang))
    .filter((s): s is ResolvedHeroSlide => s !== null);

export const Hero: React.FC<HeroProps> = ({ lang, slides, products, onExplore, onBestsellers, onViewProduct }) => {
  const activeSlides = resolveAll(slides ?? DEFAULT_HERO_SLIDES, products, lang);
  const visibleSlides = activeSlides.length > 0 ? activeSlides : resolveAll(DEFAULT_HERO_SLIDES, products, lang);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const count = visibleSlides.length;
  const current = visibleSlides[index % count];

  // Keep the index valid when slides are added or removed in the admin
  useEffect(() => {
    if (index >= count) setIndex(0);
  }, [count, index]);

  // Auto-advance; restarting the timer whenever the slide changes so manual navigation gets a full interval
  useEffect(() => {
    if (count < 2 || paused) return;
    const timer = setTimeout(() => setIndex((i) => (i + 1) % count), SLIDE_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [count, paused, index]);

  const go = (delta: number) => setIndex((i) => (i + delta + count) % count);

  const { headline, subheadline, product } = current;

  return (
    <div
      className="relative min-h-[620px] lg:min-h-[min(calc(100vh-120px),860px)] flex items-center overflow-hidden bg-canvas"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Full-bleed backdrops, cross-faded: shifted right on desktop so the flacon sits beside the copy */}
      <div className="absolute inset-y-0 right-0 w-full lg:w-[78%] z-0 lg:[mask-image:linear-gradient(to_right,transparent,black_35%)]">
        {visibleSlides.map((slide, i) => (
          <img
            key={slide.id}
            src={slide.image}
            alt={slide.tagTitle || 'DK Perfume'}
            className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-1000 ease-out ${
              i === index % count ? 'opacity-100 animate-hero-zoom' : 'opacity-0'
            }`}
            referrerPolicy="no-referrer"
          />
        ))}
      </div>

      {/* Overlays fade the photo into the page colour (cream in light mode, black in dark) */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-r from-canvas via-canvas/85 lg:via-canvas/30 to-canvas/40 lg:to-transparent" />
      <div className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-t from-canvas via-transparent to-canvas/20" />

      {/* Content: keyed by slide so the entrance animation replays on each change */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24 w-full">
        <div key={current.id} className="max-w-xl animate-hero-rise">
          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl text-fg leading-[1.05] mb-5 text-balance">
            {headline}
          </h1>

          <p className="text-base sm:text-lg text-fg-2 font-light leading-relaxed mb-10 max-w-md line-clamp-3">
            {subheadline}
          </p>

          {/* Product slides lead to that perfume; other slides lead to the collection */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={product ? () => onViewProduct(product) : onExplore}
              className="group px-8 py-3.5 bg-inverse hover:bg-inverse-hover text-on-inverse text-xs uppercase tracking-[0.16em] transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span>
                {product ? (lang === 'so' ? 'Eeg Cadarka' : 'Shop the Scent') : getTranslation(lang, 'exploreCollection')}
              </span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={1.5} />
            </button>
            <button
              onClick={product ? onExplore : onBestsellers}
              className="px-8 py-3.5 text-fg border border-fg/40 hover:border-fg hover:bg-fg/5 text-xs uppercase tracking-[0.16em] transition-colors cursor-pointer"
            >
              {product ? getTranslation(lang, 'exploreCollection') : getTranslation(lang, 'viewBestsellers')}
            </button>
          </div>
        </div>
      </div>

      {/* Collection tag, floating beside the flacon */}
      {(current.tagLabel || current.tagTitle) && (
        <div key={`tag-${current.id}`} className="hidden lg:block absolute bottom-10 right-10 z-10 text-right animate-hero-rise">
          {current.tagLabel && (
            <span className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold block mb-1">
              {current.tagLabel}
            </span>
          )}
          {current.tagTitle && <span className="font-serif text-2xl text-fg">{current.tagTitle}</span>}
          <span className="block h-px w-full mt-2 bg-gradient-to-l from-gold to-transparent" />
        </div>
      )}

      {/* Slide controls */}
      {count > 1 && (
        <>
          <button
            onClick={() => go(-1)}
            aria-label="Previous slide"
            className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 items-center justify-center rounded-full bg-surface/60 hover:bg-surface backdrop-blur-md border border-line text-fg-2 hover:text-fg transition-all cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => go(1)}
            aria-label="Next slide"
            className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 items-center justify-center rounded-full bg-surface/60 hover:bg-surface backdrop-blur-md border border-line text-fg-2 hover:text-fg transition-all cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {visibleSlides.map((slide, i) => (
              <button
                key={slide.id}
                onClick={() => setIndex(i)}
                aria-label={`Slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${
                  i === index % count ? 'w-8 bg-gold' : 'w-1.5 bg-fg/30 hover:bg-fg/60'
                }`}
              />
            ))}
          </div>
        </>
      )}

      {/* Scroll cue */}
      <button
        onClick={onExplore}
        aria-label="Scroll to collection"
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-fg-3 hover:text-fg transition-colors cursor-pointer animate-bounce"
      >
        <ChevronDown className="w-6 h-6" />
      </button>
    </div>
  );
};
