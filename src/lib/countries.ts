import { Language } from '../types';

// ISO 3166-1 alpha-2 codes for every country/territory we can ship to.
export const COUNTRY_CODES = [
  'AF', 'AL', 'DZ', 'AD', 'AO', 'AG', 'AR', 'AM', 'AU', 'AT', 'AZ', 'BS', 'BH', 'BD', 'BB', 'BY', 'BE', 'BZ', 'BJ',
  'BT', 'BO', 'BA', 'BW', 'BR', 'BN', 'BG', 'BF', 'BI', 'CV', 'KH', 'CM', 'CA', 'CF', 'TD', 'CL', 'CN', 'CO', 'KM',
  'CG', 'CD', 'CR', 'CI', 'HR', 'CU', 'CY', 'CZ', 'DK', 'DJ', 'DM', 'DO', 'EC', 'EG', 'SV', 'GQ', 'ER', 'EE', 'SZ',
  'ET', 'FJ', 'FI', 'FR', 'GA', 'GM', 'GE', 'DE', 'GH', 'GR', 'GD', 'GT', 'GN', 'GW', 'GY', 'HT', 'HN', 'HK', 'HU',
  'IS', 'IN', 'ID', 'IR', 'IQ', 'IE', 'IL', 'IT', 'JM', 'JP', 'JO', 'KZ', 'KE', 'KI', 'KW', 'KG', 'LA', 'LV', 'LB',
  'LS', 'LR', 'LY', 'LI', 'LT', 'LU', 'MO', 'MG', 'MW', 'MY', 'MV', 'ML', 'MT', 'MH', 'MR', 'MU', 'MX', 'FM', 'MD',
  'MC', 'MN', 'ME', 'MA', 'MZ', 'MM', 'NA', 'NR', 'NP', 'NL', 'NZ', 'NI', 'NE', 'NG', 'KP', 'MK', 'NO', 'OM', 'PK',
  'PW', 'PS', 'PA', 'PG', 'PY', 'PE', 'PH', 'PL', 'PT', 'QA', 'RO', 'RU', 'RW', 'KN', 'LC', 'VC', 'WS', 'SM', 'ST',
  'SA', 'SN', 'RS', 'SC', 'SL', 'SG', 'SK', 'SI', 'SB', 'SO', 'ZA', 'KR', 'SS', 'ES', 'LK', 'SD', 'SR', 'SE', 'CH',
  'SY', 'TW', 'TJ', 'TZ', 'TH', 'TL', 'TG', 'TO', 'TT', 'TN', 'TR', 'TM', 'TV', 'UG', 'UA', 'AE', 'GB', 'US', 'UY',
  'UZ', 'VU', 'VA', 'VE', 'VN', 'YE', 'ZM', 'ZW',
] as const;

// Head office country, used as the default destination when the shopper's region is unknown.
export const HQ_COUNTRY = 'GB';
export const SOMALIA = 'SO';

const EUROZONE = ['AT', 'BE', 'HR', 'CY', 'EE', 'FI', 'FR', 'DE', 'GR', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PT', 'SK', 'SI', 'ES', 'AD', 'MC', 'SM', 'VA', 'ME'];

const COUNTRY_CURRENCY: Record<string, string> = {
  US: 'USD', SO: 'USD', GB: 'GBP', AE: 'AED', SA: 'SAR', QA: 'QAR', KW: 'KWD', BH: 'BHD', OM: 'OMR', KE: 'KES',
  ET: 'ETB', DJ: 'DJF', UG: 'UGX', TZ: 'TZS', CA: 'CAD', AU: 'AUD', NZ: 'NZD', SE: 'SEK', NO: 'NOK', DK: 'DKK',
  CH: 'CHF', TR: 'TRY', EG: 'EGP', ZA: 'ZAR', IN: 'INR', PK: 'PKR', MY: 'MYR', CN: 'CNY', JP: 'JPY',
  ...Object.fromEntries(EUROZONE.map((c) => [c, 'EUR'])),
};

// Default countries per international shipping zone, used for seed data and zones saved before zones had country lists.
export const ZONE_COUNTRY_DEFAULTS: Record<string, string[]> = {
  'zone-int-us': ['US', 'CA'],
  'zone-int-uk': ['IE', 'FR', 'DE', 'NL', 'BE', 'IT', 'ES', 'PT', 'SE', 'NO', 'DK', 'FI', 'CH', 'AT', 'PL'],
  'zone-int-uae': ['AE', 'SA', 'QA', 'KW', 'BH', 'OM'],
  'zone-int-ke': ['KE', 'ET', 'DJ', 'UG', 'TZ', 'RW'],
  'zone-int-row': ['*'],
};

const displayNames: Partial<Record<Language, Intl.DisplayNames>> = {};

export function countryName(code: string, lang: Language = 'en'): string {
  if (code === '*') return lang === 'so' ? 'Dalal kale oo dhan' : 'All other countries';
  try {
    displayNames[lang] ??= new Intl.DisplayNames([lang === 'so' ? 'so' : 'en', 'en'], { type: 'region' });
    return displayNames[lang]!.of(code) || code;
  } catch {
    return code;
  }
}

export function sortedCountries(lang: Language, only?: string[]): { code: string; name: string }[] {
  const codes = only && only.length ? COUNTRY_CODES.filter((c) => only.includes(c)) : [...COUNTRY_CODES];
  return codes.map((code) => ({ code, name: countryName(code, lang) })).sort((a, b) => a.name.localeCompare(b.name));
}

export function currencyForCountry(code: string): string {
  return COUNTRY_CURRENCY[code] || 'USD';
}

// ---- Cards (client-side checks only; real authorisation happens at the payment gateway)
export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'discover' | 'unionpay' | 'jcb' | 'diners';

export const CARD_BRANDS: { id: CardBrand; label: string }[] = [
  { id: 'visa', label: 'Visa' },
  { id: 'mastercard', label: 'Mastercard' },
  { id: 'amex', label: 'American Express' },
  { id: 'discover', label: 'Discover' },
  { id: 'unionpay', label: 'UnionPay' },
  { id: 'jcb', label: 'JCB' },
  { id: 'diners', label: 'Diners Club' },
];

export function detectCardBrand(number: string): CardBrand | null {
  const n = number.replace(/\D/g, '');
  if (/^4/.test(n)) return 'visa';
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(n)) return 'mastercard';
  if (/^3[47]/.test(n)) return 'amex';
  if (/^3(0[0-5]|[68])/.test(n)) return 'diners';
  if (/^35(2[89]|[3-8])/.test(n)) return 'jcb';
  if (/^(6011|65|64[4-9])/.test(n)) return 'discover';
  if (/^62/.test(n)) return 'unionpay';
  return null;
}

export function luhnValid(number: string): boolean {
  const n = number.replace(/\D/g, '');
  if (n.length < 12 || n.length > 19) return false;
  let sum = 0;
  for (let i = 0; i < n.length; i++) {
    let d = Number(n[n.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

export function formatCardNumber(value: string): string {
  const n = value.replace(/\D/g, '').slice(0, 19);
  if (detectCardBrand(n) === 'amex') return n.replace(/^(\d{0,4})(\d{0,6})(\d{0,5}).*/, (_, a, b, c) => [a, b, c].filter(Boolean).join(' '));
  return n.replace(/(\d{4})(?=\d)/g, '$1 ');
}

export function expiryValid(mmYY: string, now = new Date()): boolean {
  const m = mmYY.match(/^(\d{2})\s*\/\s*(\d{2})$/);
  if (!m) return false;
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return false;
  // Valid through the last day of the expiry month
  return new Date(year, month, 1) > now;
}

// Best guess at the shopper's country from the browser locale (e.g. "en-GB" -> "GB").
export function browserCountry(): string | null {
  try {
    const region = new Intl.Locale(navigator.language).maximize().region;
    return region && (COUNTRY_CODES as readonly string[]).includes(region) ? region : null;
  } catch {
    return null;
  }
}
