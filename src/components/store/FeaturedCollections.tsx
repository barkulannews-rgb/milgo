import React from 'react';
import { ArrowRight } from 'lucide-react';
import { CollectionsSection, Language } from '../../types';
import { DEFAULT_COLLECTIONS } from '../../lib/storage';

interface FeaturedCollectionsProps {
  lang: Language;
  collections?: CollectionsSection;
  onSelectFamily: (family: string) => void;
}

// Column count follows the number of visible cards so the row always fills the width
const GRID: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
};

export const FeaturedCollections: React.FC<FeaturedCollectionsProps> = ({ lang, collections, onSelectFamily }) => {
  const section = collections ?? DEFAULT_COLLECTIONS;
  const cards = section.cards.filter((c) => c.active && c.image);
  if (!section.active || cards.length === 0) return null;
  const so = lang === 'so';

  return (
    <section className="py-16 sm:py-20 bg-surface border-b border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl sm:text-4xl text-fg">{so ? section.titleSo || section.titleEn : section.titleEn}</h2>
          {(so ? section.subtitleSo : section.subtitleEn) && (
            <p className="text-sm text-fg-3 mt-2">{so ? section.subtitleSo : section.subtitleEn}</p>
          )}
        </div>

        <div className={`grid ${GRID[Math.min(cards.length, 4)] ?? GRID[4]} gap-6 sm:gap-8`}>
          {cards.map((col) => (
            <button
              key={col.id}
              type="button"
              onClick={() => onSelectFamily(col.family)}
              className="group relative overflow-hidden bg-surface-2 cursor-pointer flex flex-col justify-end text-left min-h-[420px]"
            >
              <div className="absolute inset-0">
                <img
                  src={col.image}
                  alt={col.titleEn}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              </div>

              <div className="relative z-10 p-6 sm:p-7 text-white">
                <h3 className="font-serif text-2xl text-white mb-1">{so ? col.titleSo || col.titleEn : col.titleEn}</h3>
                {(so ? col.descSo : col.descEn) && <p className="text-sm text-white/70 mb-4">{so ? col.descSo : col.descEn}</p>}
                <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-white/90 group-hover:text-white transition-colors">
                  {so ? 'Daawo' : 'Shop'}
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" strokeWidth={1.5} />
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
