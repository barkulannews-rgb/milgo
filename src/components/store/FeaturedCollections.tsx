import React from 'react';
import { ArrowRight } from 'lucide-react';
import { FragranceFamily, Language } from '../../types';
import { getTranslation } from '../../lib/translations';

interface FeaturedCollectionsProps {
  lang: Language;
  onSelectFamily: (family: FragranceFamily) => void;
}

const COLLECTIONS: {
  family: FragranceFamily;
  titleEn: string;
  titleSo: string;
  descEn: string;
  descSo: string;
  image: string;
}[] = [
  {
    family: 'Oriental',
    titleEn: 'Oud & Amber',
    titleSo: 'Cuud & Canbar',
    descEn: 'Agarwood, frankincense, amber',
    descSo: 'Cuud, luubaan, canbar',
    image: '/src/assets/images/perfume_royal_oud_1791620599669.jpg',
  },
  {
    family: 'Floral',
    titleEn: 'Rose & Florals',
    titleSo: 'Ubax & Roose',
    descEn: 'Damask rose, white musk, peony',
    descSo: 'Roose, misk cad, ubax',
    image: '/src/assets/images/perfume_rose_elixir_1791620610051.jpg',
  },
  {
    family: 'Woody',
    titleEn: 'Woods & Leather',
    titleSo: 'Qori & Maqaar',
    descEn: 'Cedar, vetiver, leather',
    descSo: 'Kedar, fiitfeer, maqaar',
    image: '/src/assets/images/perfume_noir_intense_1791620620862.jpg',
  },
];

export const FeaturedCollections: React.FC<FeaturedCollectionsProps> = ({ lang, onSelectFamily }) => {
  return (
    <section className="py-16 sm:py-20 bg-surface border-b border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl sm:text-4xl text-fg">{getTranslation(lang, 'featuredCollections')}</h2>
          <p className="text-sm text-fg-3 mt-2">{getTranslation(lang, 'curatedSub')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {COLLECTIONS.map((col) => (
            <div
              key={col.family}
              onClick={() => onSelectFamily(col.family)}
              className="group relative overflow-hidden bg-surface-2 cursor-pointer flex flex-col justify-end min-h-[420px]"
            >
              <div className="absolute inset-0">
                <img
                  src={col.image}
                  alt={col.titleEn}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-85"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              </div>

              <div className="relative z-10 p-6 sm:p-7 text-white">
                <h3 className="font-serif text-2xl text-white mb-1">
                  {lang === 'so' ? col.titleSo : col.titleEn}
                </h3>
                <p className="text-sm text-white/70 mb-4">
                  {lang === 'so' ? col.descSo : col.descEn}
                </p>
                <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-white/90 group-hover:text-white transition-colors">
                  <span>{lang === 'so' ? 'Daawo' : 'Shop'}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" strokeWidth={1.5} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
