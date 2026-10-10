import type { HelpPage, HelpPageKey, StoreSettings } from '../types';

export const HELP_KEYS: HelpPageKey[] = ['about', 'authenticity', 'shipping', 'returns'];

export const DEFAULT_HELP_PAGES: Record<HelpPageKey, HelpPage> = {
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

// Saved pages from the admin, falling back to the defaults for any page never edited
export function helpPagesOf(settings: StoreSettings): Record<HelpPageKey, HelpPage> {
  const saved = settings.helpPages ?? {};
  return Object.fromEntries(HELP_KEYS.map((k) => [k, saved[k] ?? DEFAULT_HELP_PAGES[k]])) as Record<HelpPageKey, HelpPage>;
}

// WhatsApp number as written for people (keeps the spaced form when the older phone field matches it)
export function whatsappDisplay(settings: StoreSettings): string {
  const digits = (v: string) => v.replace(/[^0-9]/g, '');
  return settings.phone && digits(settings.phone) === digits(settings.whatsappNumber) ? settings.phone : settings.whatsappNumber;
}
