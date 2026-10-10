import React from 'react';
import { X } from 'lucide-react';
import { Language, StoreSettings } from '../../types';

interface PolicyModalsProps {
  activePolicy: 'about' | 'authenticity' | 'shipping' | 'returns' | null;
  onClose: () => void;
  lang: Language;
  settings: StoreSettings;
}

const CONTENT = {
  about: {
    titleEn: 'About Us',
    titleSo: 'Nagu Saabsan',
    en: [
      'Milgo Parfums is a fragrance house headquartered in London.',
      'From Somali frankincense to French florals and rare oud.',
      'We ship worldwide, with local delivery in the UK and Somalia.',
    ],
    so: [
      'Milgo Parfums waa shirkad cadar oo xaruntu tahay London.',
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

export const PolicyModals: React.FC<PolicyModalsProps> = ({ activePolicy, onClose, lang }) => {
  if (!activePolicy) return null;
  const item = CONTENT[activePolicy];
  const so = lang === 'so';

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn"
      onClick={onClose}
    >
      <div className="relative w-full max-w-md bg-surface shadow-2xl text-fg p-8 sm:p-10" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-fg-3 hover:text-fg transition-colors cursor-pointer" aria-label="Close">
          <X className="w-5 h-5" strokeWidth={1.5} />
        </button>

        <h2 className="font-serif text-3xl mb-6">{so ? item.titleSo : item.titleEn}</h2>
        <ul className="space-y-3 text-sm text-fg-2 leading-relaxed">
          {(so ? item.so : item.en).map((line) => (
            <li key={line} className="pl-4 relative before:absolute before:left-0 before:top-[0.7em] before:w-1.5 before:h-px before:bg-gold">
              {line}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
