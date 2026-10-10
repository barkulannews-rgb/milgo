import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Language } from '../../types';
import type { PolicyKey } from '../../lib/router';

interface PolicyPageProps {
  page: PolicyKey;
  lang: Language;
  onBack: () => void;
  onOpenPage: (page: PolicyKey) => void;
}

const CONTENT = {
  about: {
    titleEn: 'About Us',
    titleSo: 'Nagu Saabsan',
    en: [
      'DK Perfume is a fragrance house headquartered in London.',
      'From Somali frankincense to French florals and rare oud.',
      'We ship worldwide, with local delivery in the UK and Somalia.',
    ],
    so: [
      'DK Perfume waa shirkad cadar oo xaruntu tahay London.',
      'Laga bilaabo luubaanka Soomaaliyeed ilaa ubaxa Faransiiska iyo cuudka dhifka ah.',
      'Adduunka oo dhan ayaan u dirnaa, gaarsiin gudaha ah UK iyo Soomaaliya.',
    ],
  },
  authenticity: {
    titleEn: 'Authenticity',
    titleSo: 'Asalnimada',
    en: [
      'Every bottle is 100% authentic, bought from authorised distributors.',
      'No testers, refills or grey-market stock.',
      'Not authentic? Full refund, guaranteed.',
    ],
    so: [
      'Dhalo kasta waa 100% asal, waxaa laga soo iibsaday wakiillo rasmi ah.',
      'Ma iibinno tester, wax la shubay ama wax been ah.',
      'Haddii uusan asal ahayn, lacagtaada oo dhan waa laguu celinayaa.',
    ],
  },
  shipping: {
    titleEn: 'Shipping',
    titleSo: 'Dirista',
    en: [
      'UK: 1–3 working days. Free over £60.',
      'Mogadishu: same day. Other Somali cities: 24–48 hours.',
      'Rest of the world: 2–7 working days by express courier.',
      'Prices and free-shipping limits vary by destination; see them at checkout.',
    ],
    so: [
      'UK: 1–3 maalmood. Bilaash £60 ka badan.',
      'Muqdisho: isla maalinta. Magaalooyinka kale: 24–48 saac.',
      'Adduunka intiisa kale: 2–7 maalmood.',
      'Qiimaha iyo xadka bilaashka way kala duwan yihiin; checkout-ka ayaad ku arkaysaa.',
    ],
  },
  returns: {
    titleEn: 'Returns',
    titleSo: 'Celinta',
    en: [
      'Unopened, sealed bottles can be returned within 7 days.',
      'Opened bottles cannot be returned.',
      'Damaged in transit? Send us a photo within 24 hours for a replacement.',
    ],
    so: [
      'Dhalada aan la furin waa la celin karaa 7 maalmood gudahood.',
      'Dhalada la furay lama celin karo.',
      'Haddii ay jabto, sawir noogu soo dir 24 saac gudahood si laguugu beddelo.',
    ],
  },
};

// Help pages (About, Authenticity, Shipping, Returns) rendered as full pages with their own address
export const PolicyPage: React.FC<PolicyPageProps> = ({ page, lang, onBack, onOpenPage }) => {
  const item = CONTENT[page];
  const so = lang === 'so';
  const others = (Object.keys(CONTENT) as PolicyKey[]).filter((k) => k !== page);

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
        <h1 className="font-serif text-5xl text-fg mb-10">{so ? item.titleSo : item.titleEn}</h1>
        <ul className="space-y-5 text-base text-fg-2 leading-relaxed">
          {(so ? item.so : item.en).map((line) => (
            <li key={line} className="pl-6 relative before:absolute before:left-0 before:top-[0.8em] before:w-3 before:h-px before:bg-gold">
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
              {so ? CONTENT[k].titleSo : CONTENT[k].titleEn}
            </a>
          ))}
        </div>
      </div>
    </main>
  );
};
