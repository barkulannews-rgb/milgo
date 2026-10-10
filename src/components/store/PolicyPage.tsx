import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { HelpPage, HelpPageKey, Language } from '../../types';
import { HELP_KEYS } from '../../lib/helpPages';

interface PolicyPageProps {
  page: HelpPageKey;
  pages: Record<HelpPageKey, HelpPage>;
  lang: Language;
  onBack: () => void;
  onOpenPage: (page: HelpPageKey) => void;
}

// Help pages (About, Authenticity, Shipping, Returns) rendered as full pages with their own address
export const PolicyPage: React.FC<PolicyPageProps> = ({ page, pages, lang, onBack, onOpenPage }) => {
  const item = pages[page];
  const so = lang === 'so';
  const others = HELP_KEYS.filter((k) => k !== page);

  return (
    <main className="flex-1 bg-canvas">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-fg-3 hover:text-fg transition-colors cursor-pointer mb-10"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
          {so ? 'Dib u noqo' : 'Back'}
        </button>
        <h1 className="font-serif text-5xl text-fg mb-10">{so ? item.titleSo || item.titleEn : item.titleEn}</h1>
        <ul className="space-y-5 text-base text-fg-2 leading-relaxed">
          {(so && item.so.length ? item.so : item.en).map((line, i) => (
            <li key={i} className="pl-6 relative before:absolute before:left-0 before:top-[0.8em] before:w-3 before:h-px before:bg-gold">
              {line}
            </li>
          ))}
        </ul>
        <div className="mt-16 pt-8 border-t border-line flex flex-wrap gap-x-8 gap-y-3 text-sm">
          {others.map((k) => (
            <a
              key={k}
              href={`/${k}`}
              onClick={(e) => {
                e.preventDefault();
                onOpenPage(k);
              }}
              className="text-fg-3 hover:text-fg underline underline-offset-4 transition-colors">
              {so ? pages[k].titleSo || pages[k].titleEn : pages[k].titleEn}
            </a>
          ))}
        </div>
      </div>
    </main>
  );
};
