import {
  Product,
  Order,
  StockMovement,
  Supplier,
  PurchaseOrder,
  OperatingExpense,
  FinancialTransaction,
  DeliveryZone,
  Coupon,
  StoreReview,
  StaffUser,
  AuditLog,
  StoreSettings,
  StaffRole,
  OrderStatus,
  PaymentStatus,
  HeroSlide,
  CollectionsSection,
  PaymentSettings,
  MarketSettings,
} from '../types';
import { SOMALIA, ZONE_COUNTRY_DEFAULTS } from './countries';
import { BASE_CURRENCY, LEGACY_USD_TO_GBP } from './money';
import { DEFAULT_ROLE_PERMISSIONS, OWNER_ONLY, Permission, DelegatedRole } from './permissions';
import { api, ApiError, Bootstrap, OrderRequest, TrackedOrder } from './api';

import { formatMoney } from './money';
// Initial high-fidelity product images generated
const HERO_IMAGE = '/images/hero_luxury_perfume_1791620587322.jpg';
const OUD_IMAGE = '/images/perfume_royal_oud_1791620599669.jpg';
const ROSE_IMAGE = '/images/perfume_rose_elixir_1791620610051.jpg';
const NOIR_IMAGE = '/images/perfume_noir_intense_1791620620862.jpg';

export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  mode: 'test',
  cards: { enabled: true, brands: ['visa', 'mastercard', 'amex', 'discover', 'unionpay', 'jcb', 'diners'], stripePublishableKey: '' },
  paypal: { enabled: true, clientId: '' },
  applePay: true,
  googlePay: true,
  mobileMoney: {
    enabled: true,
    countries: [SOMALIA],
    wallets: [
      { name: 'EVC Plus', enabled: true, merchantNumber: '+252 61 748 5100' },
      { name: 'Zaad', enabled: true, merchantNumber: '+252 63 748 5100' },
      { name: 'Sahal', enabled: true, merchantNumber: '+252 90 748 5100' },
      { name: 'Edahab', enabled: true, merchantNumber: '+252 65 748 5100' },
    ],
  },
  bankTransfer: {
    enabled: true,
    bankName: 'Barclays Bank UK',
    accountName: 'DK Perfume Ltd',
    iban: '',
    swift: '',
    instructions: 'Use your order number as the transfer reference. Orders ship once funds arrive.',
  },
  cashOnDelivery: { enabled: true, countries: [SOMALIA] },
};

export const DEFAULT_MARKET_SETTINGS: MarketSettings = {
  sellWorldwide: true,
  allowedCountries: [],
  currencyRates: [
    { code: 'EUR', rate: 0.92 },
    { code: 'GBP', rate: 0.79 },
    { code: 'AED', rate: 3.67 },
    { code: 'SAR', rate: 3.75 },
    { code: 'KES', rate: 129 },
    { code: 'CAD', rate: 1.37 },
    { code: 'SOS', rate: 26000 },
  ],
};

export const DEFAULT_COLLECTIONS: CollectionsSection = {
  active: true,
  titleEn: 'Collections',
  titleSo: 'Xulalka',
  subtitleEn: 'Shop by scent family',
  subtitleSo: 'Ku iibso nooca udugga',
  cards: [
    { id: 'col-oud', titleEn: 'Oud & Amber', titleSo: 'Cuud & Canbar', descEn: 'Agarwood, frankincense, amber', descSo: 'Cuud, luubaan, canbar', image: OUD_IMAGE, family: 'Oriental', active: true },
    { id: 'col-rose', titleEn: 'Rose & Florals', titleSo: 'Ubax & Roose', descEn: 'Damask rose, white musk, peony', descSo: 'Roose, misk cad, ubax', image: ROSE_IMAGE, family: 'Floral', active: true },
    { id: 'col-woods', titleEn: 'Woods & Leather', titleSo: 'Qori & Maqaar', descEn: 'Cedar, vetiver, leather', descSo: 'Kedar, fiitfeer, maqaar', image: NOIR_IMAGE, family: 'Woody', active: true },
  ],
};

export const DEFAULT_HERO_SLIDES: HeroSlide[] = [
  {
    id: 'hero-001',
    image: HERO_IMAGE,
    headlineEn: '',
    headlineSo: '',
    subheadlineEn: '',
    subheadlineSo: '',
    tagLabel: 'Signature Collection',
    tagTitle: 'Aurora D’Or Imperial',
    active: true,
  },
];

const INITIAL_SETTINGS: StoreSettings = {
  dataVersion: 2,
  storeName: 'DK Perfume',
  taglineEn: 'Fine fragrances from London to the world.',
  taglineSo: 'Cadar qaali ah, London ilaa adduunka.',
  phone: '+252 61 748 5100',
  email: 'info@dkperfume.com',
  address: 'London, United Kingdom',
  // Seed figures below were authored in USD; migrateToGbp() converts them on first load.
  currency: 'USD',
  currencyRateSos: 26000,
  freeDeliveryThreshold: 50,
  announcementBarTextEn: 'Free UK delivery over £60 · Worldwide shipping',
  announcementBarTextSo: 'Gaarsiin bilaash ah UK £60 ka badan · Dirid caalami ah',
  announcementBarActive: true,
  whatsappNumber: '+252617485100',
  instagram: 'dkperfume',
  facebook: 'dkperfume',
  payments: DEFAULT_PAYMENT_SETTINGS,
  markets: DEFAULT_MARKET_SETTINGS,
  heroSlides: DEFAULT_HERO_SLIDES,
};

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    name: 'Qadir Royal Oud',
    nameSo: 'Cuudka Boqortooyada Qadir',
    brand: 'DK Signature',
    category: 'Luxury Oud',
    fragranceFamily: 'Oriental',
    concentration: 'Extrait de Parfum',
    gender: 'Unisex',
    description: 'An opulent symphony of rare Cambodian agarwood, smoldering amber resins, and velvety Taif rose. Designed for sovereign evenings and grand ceremonies.',
    descriptionSo: 'Udug qaali ah oo ka samaysan cuud saafi ah oo Kamboodiya ah, canbar kulul, iyo ubaxa Ta’if ee boqortooyada. Waxaa loogu talagalay xafladaha waaweyn iyo habeenada gaarka ah.',
    images: [OUD_IMAGE, HERO_IMAGE],
    notes: {
      top: ['Wild Saffron', 'Nutmeg', 'Bergamot Zest'],
      heart: ['Taif Rose', 'Incense Smoke', 'Cistus Labdanum'],
      base: ['Cambodian Aged Agarwood', 'Warm Amber Crystals', 'Smoked Birch', 'Bourbon Vanilla'],
    },
    variants: [
      {
        id: 'var-001-50',
        size: '50ml',
        sku: 'MLG-OUD-50',
        costPrice: 42.0,
        sellingPrice: 110.0,
        discountPrice: 95.0,
        stockQuantity: 18,
        lowStockThreshold: 5,
      },
      {
        id: 'var-001-100',
        size: '100ml',
        sku: 'MLG-OUD-100',
        costPrice: 65.0,
        sellingPrice: 165.0,
        stockQuantity: 12,
        lowStockThreshold: 4,
      },
    ],
    featured: true,
    bestSeller: true,
    isNewArrival: false,
    active: true,
    authenticityVerified: true,
    usageInstructions: 'Apply sparingly to pulse points: neck, wrist, and behind the ears.',
    rating: 4.9,
    reviewCount: 38,
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'prod-002',
    name: 'Noir Éclat Intense',
    nameSo: 'Noir Éclat - Madowga Iftiimaya',
    brand: 'DK Signature',
    category: 'Men',
    fragranceFamily: 'Woody',
    concentration: 'Eau de Parfum',
    gender: 'Men',
    description: 'A magnetic masculine composition of crisp Italian bergamot, dark vetiver, crushed cedarwood, and refined Tuscan leather.',
    descriptionSo: 'Cadar raggeed soo jiidasho gaar ah leh oo ka kooban beergamoot Talyaani ah, qoryaha cedar, xididada fiitfeer, iyo maqaarka qaaliga ah ee Tuscany.',
    images: [NOIR_IMAGE, HERO_IMAGE],
    notes: {
      top: ['Calabrian Bergamot', 'Black Pepper', 'Pink Peppercorn'],
      heart: ['Lavender de Provence', 'Sichuan Pepper', 'Elemi Resin'],
      base: ['Haitian Vetiver', 'Atlas Cedarwood', 'Ambroxan', 'Tuscan Leather'],
    },
    variants: [
      {
        id: 'var-002-50',
        size: '50ml',
        sku: 'MLG-NOIR-50',
        costPrice: 35.0,
        sellingPrice: 85.0,
        stockQuantity: 14,
        lowStockThreshold: 4,
      },
      {
        id: 'var-002-100',
        size: '100ml',
        sku: 'MLG-NOIR-100',
        costPrice: 52.0,
        sellingPrice: 130.0,
        discountPrice: 115.0,
        stockQuantity: 8,
        lowStockThreshold: 3,
      },
    ],
    featured: true,
    bestSeller: true,
    isNewArrival: false,
    active: true,
    authenticityVerified: true,
    rating: 4.8,
    reviewCount: 42,
    createdAt: '2026-02-01T12:00:00Z',
  },
  {
    id: 'prod-003',
    name: 'Rose Électrique',
    nameSo: 'Ubaxa Roose ee Xariirta Ah',
    brand: 'DK Signature',
    category: 'Women',
    fragranceFamily: 'Floral',
    concentration: 'Eau de Parfum',
    gender: 'Women',
    description: 'A radiant feminine elixir capturing dew-kissed Damask roses, sparkling pink champagne, white musk, and luminous cashmere wood.',
    descriptionSo: 'Cadar dumar oo aad u macaan, laga miiray ubaxa Damask ee subaxdii la gooyay, misk cad oo saafi ah, iyo qoryaha cashmere-ka ee qaaliga ah.',
    images: [ROSE_IMAGE, HERO_IMAGE],
    notes: {
      top: ['Sparkling Pear', 'Pink Lychee', 'Italian Mandarin'],
      heart: ['Damask Rose Absolute', 'White Peony', 'Dewy Jasmine'],
      base: ['Cashmere Wood', 'White Silk Musk', 'Golden Amber'],
    },
    variants: [
      {
        id: 'var-003-50',
        size: '50ml',
        sku: 'MLG-ROSE-50',
        costPrice: 38.0,
        sellingPrice: 90.0,
        stockQuantity: 22,
        lowStockThreshold: 5,
      },
      {
        id: 'var-003-100',
        size: '100ml',
        sku: 'MLG-ROSE-100',
        costPrice: 58.0,
        sellingPrice: 140.0,
        discountPrice: 125.0,
        stockQuantity: 15,
        lowStockThreshold: 4,
      },
    ],
    featured: true,
    bestSeller: false,
    isNewArrival: true,
    active: true,
    authenticityVerified: true,
    rating: 4.9,
    reviewCount: 29,
    createdAt: '2026-02-14T09:00:00Z',
  },
  {
    id: 'prod-004',
    name: 'Aurora D’Or Imperial',
    nameSo: 'Aurora D’Or - Dahabka Boqortooyada',
    brand: 'DK Signature',
    category: 'Luxury Oud',
    fragranceFamily: 'Oriental',
    concentration: 'Parfum',
    gender: 'Unisex',
    description: 'A sovereign blend of liquid amber, Somali frankincense tears, creamy Madagascar vanilla, and golden cedar. Radiates warmth and commanding poise.',
    descriptionSo: 'Isku dar udug boqortooyo ah oo ka kooban luubaan Soomaali ah oo saafi ah, canbar dahabi ah, faaniilo madow oo Madagaskar ah, iyo geedka kedarka ah.',
    images: [HERO_IMAGE, OUD_IMAGE],
    notes: {
      top: ['Somali Frankincense Tears', 'Wild Honey', 'Cinnamon Bark'],
      heart: ['Amber Resin', 'Smoked Myrrh', 'Roasted Tonka Bean'],
      base: ['Madagascar Vanilla Caviar', 'Sandalwood', 'Benzoin Siam'],
    },
    variants: [
      {
        id: 'var-004-50',
        size: '50ml',
        sku: 'MLG-AURORA-50',
        costPrice: 50.0,
        sellingPrice: 120.0,
        stockQuantity: 10,
        lowStockThreshold: 3,
      },
      {
        id: 'var-004-100',
        size: '100ml',
        sku: 'MLG-AURORA-100',
        costPrice: 75.0,
        sellingPrice: 180.0,
        discountPrice: 155.0,
        stockQuantity: 7,
        lowStockThreshold: 3,
      },
    ],
    featured: true,
    bestSeller: true,
    isNewArrival: true,
    active: true,
    authenticityVerified: true,
    rating: 5.0,
    reviewCount: 19,
    createdAt: '2026-02-20T11:00:00Z',
  },
  {
    id: 'prod-005',
    name: 'Baccarat Rouge 540 Extract',
    nameSo: 'Baccarat Rouge 540 Saafi Ah',
    brand: 'Maison Francis Kurkdjian',
    category: 'Niche & Oud',
    fragranceFamily: 'Oriental',
    concentration: 'Extrait de Parfum',
    gender: 'Unisex',
    description: 'The legendary masterpiece combining bitter almond from Morocco, grandiflorum jasmine from Egypt, and radiant woody musk accord.',
    descriptionSo: 'Cadarka caanka ah ee dunida gilgilay, leh udug macaan oo yicib Marooko ah, jasmine Masar ah, iyo qoryaha qaaliga ah ee ambergris.',
    images: [ROSE_IMAGE, HERO_IMAGE],
    notes: {
      top: ['Bitter Almond from Morocco', 'Saffron'],
      heart: ['Egyptian Jasmine Grandiflorum', 'Cedar'],
      base: ['Ambergris Accord', 'Woody Musk'],
    },
    variants: [
      {
        id: 'var-005-70',
        size: '70ml',
        sku: 'MFK-BR540-70',
        costPrice: 190.0,
        sellingPrice: 320.0,
        discountPrice: 295.0,
        stockQuantity: 5,
        lowStockThreshold: 2,
      },
    ],
    featured: false,
    bestSeller: true,
    isNewArrival: false,
    active: true,
    authenticityVerified: true,
    rating: 4.9,
    reviewCount: 55,
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 'prod-006',
    name: 'Oud Wood Private Blend',
    nameSo: 'Tom Ford Oud Wood Asal Ah',
    brand: 'Tom Ford',
    category: 'Men',
    fragranceFamily: 'Woody',
    concentration: 'Eau de Parfum',
    gender: 'Unisex',
    description: 'Rare oud wood, rosewood, cardamom, and sensual amber create an iconic, deeply sophisticated scent profile.',
    descriptionSo: 'Mid ka mid ah cadarrada loogu jecelyahay dunida ragga iyo dumarka, ka samaysan cuud dhif ah, qorfe carfoon, iyo canbar diirran.',
    images: [NOIR_IMAGE, OUD_IMAGE],
    notes: {
      top: ['Rare Rosewood', 'Cardamom', 'Chinese Pepper'],
      heart: ['Oud Wood', 'Sandalwood', 'Vetiver'],
      base: ['Tonka Bean', 'Vanilla', 'Amber'],
    },
    variants: [
      {
        id: 'var-006-50',
        size: '50ml',
        sku: 'TF-OW-50',
        costPrice: 110.0,
        sellingPrice: 195.0,
        stockQuantity: 6,
        lowStockThreshold: 2,
      },
      {
        id: 'var-006-100',
        size: '100ml',
        sku: 'TF-OW-100',
        costPrice: 165.0,
        sellingPrice: 280.0,
        stockQuantity: 4,
        lowStockThreshold: 2,
      },
    ],
    featured: true,
    bestSeller: true,
    isNewArrival: false,
    active: true,
    authenticityVerified: true,
    rating: 4.8,
    reviewCount: 31,
    createdAt: '2026-01-18T14:00:00Z',
  },
  {
    id: 'prod-007',
    name: 'Interlude Man 53',
    nameSo: 'Amouage Interlude Man 53',
    brand: 'Amouage',
    category: 'Men',
    fragranceFamily: 'Oriental',
    concentration: 'Extrait de Parfum',
    gender: 'Men',
    description: 'Known as the Blue Beast with 53% perfume oil concentration. Resinous, smoky, balsamic, and extraordinarily potent with timeless sillage.',
    descriptionSo: 'Waxaa loo yaqaanaa bahalka buluugga ah (Blue Beast). Waxa uu leeyahay 53% saliid saafi ah, udug sigaar, luubaan, iyo awood aan duugoobin.',
    images: [OUD_IMAGE, NOIR_IMAGE],
    notes: {
      top: ['Bergamot', 'Oregano', 'Pimento Berry Oil'],
      heart: ['Amber', 'Frankincense', 'Cistus', 'Opoponax'],
      base: ['Leather', 'Agarwood Smoke', 'Patchouli', 'Sandalwood'],
    },
    variants: [
      {
        id: 'var-007-100',
        size: '100ml',
        sku: 'AMU-INT-100',
        costPrice: 210.0,
        sellingPrice: 350.0,
        stockQuantity: 3,
        lowStockThreshold: 2,
      },
    ],
    featured: false,
    bestSeller: false,
    isNewArrival: true,
    active: true,
    authenticityVerified: true,
    rating: 5.0,
    reviewCount: 14,
    createdAt: '2026-02-18T16:00:00Z',
  },
  {
    id: 'prod-008',
    name: 'Citrus Riviera Breeze',
    nameSo: 'Nacnaca Liinta & Neecawda Badda',
    brand: 'DK Signature',
    category: 'Unisex',
    fragranceFamily: 'Citrus',
    concentration: 'Eau de Parfum',
    gender: 'Unisex',
    description: 'Crisp Mediterranean lemons, fresh sea salt accord, green petitgrain, and cedar driftwood. An invigorating breath of coastal sun and freshness.',
    descriptionSo: 'Udug aad u cusub oo ka kooban liin dhanaan carfoon, neecowda badda, iyo qoryaha xeebta. Aad ugu habboon cimilada diirran.',
    images: [HERO_IMAGE, ROSE_IMAGE],
    notes: {
      top: ['Amalfi Lemon', 'Green Mandarin', 'Sea Salt Spray'],
      heart: ['Neroli Flowers', 'Petitgrain', 'Rosemary'],
      base: ['Driftwood', 'White Cedar', 'Clean Musk'],
    },
    variants: [
      {
        id: 'var-008-50',
        size: '50ml',
        sku: 'MLG-CIT-50',
        costPrice: 28.0,
        sellingPrice: 70.0,
        discountPrice: 60.0,
        stockQuantity: 20,
        lowStockThreshold: 5,
      },
      {
        id: 'var-008-100',
        size: '100ml',
        sku: 'MLG-CIT-100',
        costPrice: 44.0,
        sellingPrice: 110.0,
        stockQuantity: 16,
        lowStockThreshold: 4,
      },
    ],
    featured: false,
    bestSeller: false,
    isNewArrival: true,
    active: true,
    authenticityVerified: true,
    rating: 4.7,
    reviewCount: 12,
    createdAt: '2026-02-25T13:00:00Z',
  },
];

const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-001',
    name: 'Gulf Luxury Fragrances FZE',
    contactPerson: 'Tariq Al-Mansoor',
    phone: '+971 4 883 4900',
    email: 'orders@gulfluxury.ae',
    address: 'Deira Perfume Souq & JAFZA, Dubai, UAE',
    outstandingBalance: 1200.0,
    notes: 'Primary supplier for Arabian oud oils and niche flacons.',
  },
  {
    id: 'sup-002',
    name: 'Parfums de Grasse Distribution',
    contactPerson: 'Élise Laurent',
    phone: '+33 4 93 36 00 12',
    email: 'elise@grasse-distrib.fr',
    address: 'Boulevard Fragonard, Grasse, France',
    outstandingBalance: 0.0,
    notes: 'European designer houses and raw French essences.',
  },
  {
    id: 'sup-003',
    name: 'Somali Frankincense & Aromatics Ltd',
    contactPerson: 'Warsame Guled',
    phone: '+252 90 779 4321',
    email: 'warsame@somali-aromatics.so',
    address: 'Bosaso Port Commercial Zone, Puntland, Somalia',
    outstandingBalance: 350.0,
    notes: 'Local wild-harvested Maydi frankincense and amber resins.',
  },
];

const INITIAL_DELIVERY_ZONES: DeliveryZone[] = [
  // Domestic Somalia Zones
  { id: 'zone-01', city: 'Mogadishu', zoneName: 'Hodan & Maka Al-Mukarama', country: 'Somalia', regionType: 'domestic', deliveryFee: 3.0, estimatedHours: '2–4 hours', active: true },
  { id: 'zone-02', city: 'Mogadishu', zoneName: 'Waberi & Airport Road', country: 'Somalia', regionType: 'domestic', deliveryFee: 3.0, estimatedHours: '2–4 hours', active: true },
  { id: 'zone-03', city: 'Mogadishu', zoneName: 'Wadajir & Halane', country: 'Somalia', regionType: 'domestic', deliveryFee: 4.0, estimatedHours: '3–6 hours', active: true },
  { id: 'zone-04', city: 'Mogadishu', zoneName: 'Boondheere, Hamar Weyne & Shangani', country: 'Somalia', regionType: 'domestic', deliveryFee: 4.0, estimatedHours: '3–6 hours', active: true },
  { id: 'zone-05', city: 'Mogadishu', zoneName: 'Yaqshid, Kaaran & Dayniile', country: 'Somalia', regionType: 'domestic', deliveryFee: 5.0, estimatedHours: '4–8 hours', active: true },
  { id: 'zone-06', city: 'Hargeisa', zoneName: 'Hargeisa Central & Jigjiga Yar', country: 'Somalia', regionType: 'domestic', deliveryFee: 7.0, estimatedHours: '24 hours (Air Express)', active: true },
  { id: 'zone-07', city: 'Garowe', zoneName: 'Garowe City Center', country: 'Somalia', regionType: 'domestic', deliveryFee: 8.0, estimatedHours: '24–48 hours', active: true },
  { id: 'zone-08', city: 'Kismayo', zoneName: 'Kismayo Port & City', country: 'Somalia', regionType: 'domestic', deliveryFee: 8.0, estimatedHours: '24–48 hours', active: true },
  { id: 'zone-09', city: 'Bosaso', zoneName: 'Bosaso Commercial Center', country: 'Somalia', regionType: 'domestic', deliveryFee: 8.0, estimatedHours: '24–48 hours', active: true },
  
  // International Global Zones
  { id: 'zone-int-us', city: 'United States & Canada', zoneName: 'DHL Express Worldwide (Air Courier)', country: 'United States', regionType: 'international', countries: ['US','CA'], deliveryFee: 35.0, estimatedHours: '3–5 Business Days', active: true },
  { id: 'zone-int-uk', city: 'Europe', zoneName: 'DHL Express Air Priority', country: 'Europe', regionType: 'international', countries: ['IE','FR','DE','NL','BE','IT','ES','PT','SE','NO','DK','FI','CH','AT','PL'], deliveryFee: 28.0, estimatedHours: '3–5 Business Days', active: true },
  { id: 'zone-int-uae', city: 'Dubai & Gulf (GCC)', zoneName: 'Emirates SkyCargo / Courier Service', country: 'United Arab Emirates', regionType: 'international', countries: ['AE','SA','QA','KW','BH','OM'], deliveryFee: 22.0, estimatedHours: '2–4 Business Days', active: true },
  { id: 'zone-int-ke', city: 'Nairobi & East Africa', zoneName: 'Regional Air Priority Express', country: 'Kenya', regionType: 'international', countries: ['KE','ET','DJ','UG','TZ','RW'], deliveryFee: 18.0, estimatedHours: '2–3 Business Days', active: true },
  { id: 'zone-int-row', city: 'Rest of World', zoneName: 'International Priority Air Courier', country: 'Worldwide', regionType: 'international', countries: ['*'], deliveryFee: 42.0, estimatedHours: '5–7 Business Days', active: true },
];

const INITIAL_COUPONS: Coupon[] = [
  {
    code: 'DK10',
    discountType: 'percentage',
    discountValue: 10,
    minOrderAmount: 50,
    timesUsed: 14,
    expiryDate: '2026-12-31',
    active: true,
  },
  {
    code: 'SOMALIAVIP',
    discountType: 'fixed',
    discountValue: 15,
    minOrderAmount: 100,
    timesUsed: 8,
    expiryDate: '2026-12-31',
    active: true,
  },
  {
    code: 'FREESHIP',
    discountType: 'fixed',
    discountValue: 5,
    minOrderAmount: 40,
    timesUsed: 22,
    expiryDate: '2026-12-31',
    active: true,
  },
];

const INITIAL_ORDERS: Order[] = [
  {
    id: 'DK-2026-1041',
    customerName: 'Amina Cali Maxamed',
    customerPhone: '+252 61 554 9920',
    customerEmail: 'amina.ali@gmail.com',
    city: 'Mogadishu',
    deliveryArea: 'Hodan & Maka Al-Mukarama',
    deliveryAddress: 'Near Taleex Hotel, Villa 14',
    deliveryInstructions: 'Fadlan soo wac marka aad soo dhowaato',
    items: [
      {
        productId: 'prod-001',
        variantId: 'var-001-50',
        productName: 'Qadir Royal Oud',
        brand: 'DK Signature',
        size: '50ml',
        image: OUD_IMAGE,
        unitPrice: 95.0,
        costPrice: 42.0,
        quantity: 1,
        subtotal: 95.0,
      },
    ],
    subtotal: 95.0,
    discountAmount: 9.5,
    couponCode: 'DK10',
    deliveryFee: 0.0, // Over $50 free delivery threshold
    tax: 0.0,
    grandTotal: 85.5,
    paymentMethod: 'EVC Plus',
    paymentStatus: 'Paid',
    paymentReference: 'EVC-TXN-902188',
    paymentVerifiedBy: 'Sales Staff',
    orderStatus: 'Delivered',
    statusHistory: [
      { status: 'Pending', timestamp: '2026-03-01T09:30:00Z', updatedBy: 'System' },
      { status: 'Confirmed', timestamp: '2026-03-01T09:45:00Z', updatedBy: 'Sales Team' },
      { status: 'Shipped', timestamp: '2026-03-01T11:15:00Z', updatedBy: 'Courier Team' },
      { status: 'Delivered', timestamp: '2026-03-01T13:00:00Z', updatedBy: 'Ahmed Courier' },
    ],
    assignedDeliveryPerson: 'Axmed Cabdi',
    assignedStaffId: 'usr-6',
    createdAt: '2026-03-01T09:30:00Z',
  },
  {
    id: 'DK-2026-1042',
    customerName: 'Xasan Cabdiraxmaan Nuur',
    customerPhone: '+252 61 722 8844',
    customerEmail: 'hassan.abdi@yahoo.com',
    city: 'Mogadishu',
    deliveryArea: 'Waberi & Airport Road',
    deliveryAddress: 'Dabka Intersection, Floor 3 Office 8',
    items: [
      {
        productId: 'prod-002',
        variantId: 'var-002-100',
        productName: 'Noir Éclat Intense',
        brand: 'DK Signature',
        size: '100ml',
        image: NOIR_IMAGE,
        unitPrice: 115.0,
        costPrice: 52.0,
        quantity: 1,
        subtotal: 115.0,
      },
      {
        productId: 'prod-004',
        variantId: 'var-004-50',
        productName: 'Aurora D’Or Imperial',
        brand: 'DK Signature',
        size: '50ml',
        image: HERO_IMAGE,
        unitPrice: 120.0,
        costPrice: 50.0,
        quantity: 1,
        subtotal: 120.0,
      },
    ],
    subtotal: 235.0,
    discountAmount: 15.0,
    couponCode: 'SOMALIAVIP',
    deliveryFee: 0.0,
    tax: 0.0,
    grandTotal: 220.0,
    paymentMethod: 'Cash on Delivery',
    paymentStatus: 'Paid',
    orderStatus: 'Delivered',
    statusHistory: [
      { status: 'Pending', timestamp: '2026-03-02T14:10:00Z', updatedBy: 'System' },
      { status: 'Confirmed', timestamp: '2026-03-02T14:30:00Z', updatedBy: 'Admin' },
      { status: 'Shipped', timestamp: '2026-03-02T16:00:00Z', updatedBy: 'Courier Team' },
      { status: 'Delivered', timestamp: '2026-03-02T17:45:00Z', updatedBy: 'Mahad Courier' },
    ],
    assignedDeliveryPerson: 'Axmed Cabdi',
    assignedStaffId: 'usr-6',
    createdAt: '2026-03-02T14:10:00Z',
  },
  {
    id: 'DK-2026-1043',
    customerName: 'Fartuun Cumar Xaaji',
    customerPhone: '+252 61 889 1234',
    city: 'Hargeisa',
    deliveryArea: 'Hargeisa Central & Jigjiga Yar',
    deliveryAddress: 'Near Maansoor Hotel, House #40',
    items: [
      {
        productId: 'prod-003',
        variantId: 'var-003-100',
        productName: 'Rose Électrique',
        brand: 'DK Signature',
        size: '100ml',
        image: ROSE_IMAGE,
        unitPrice: 125.0,
        costPrice: 58.0,
        quantity: 1,
        subtotal: 125.0,
      },
    ],
    subtotal: 125.0,
    discountAmount: 0.0,
    deliveryFee: 0.0,
    tax: 0.0,
    grandTotal: 125.0,
    paymentMethod: 'Zaad',
    paymentStatus: 'Paid',
    paymentReference: 'ZAAD-REF-881923',
    paymentVerifiedBy: 'Accountant',
    orderStatus: 'Shipped',
    statusHistory: [
      { status: 'Pending', timestamp: '2026-03-03T10:00:00Z', updatedBy: 'System' },
      { status: 'Confirmed', timestamp: '2026-03-03T10:20:00Z', updatedBy: 'Manager' },
      { status: 'Shipped', timestamp: '2026-03-03T13:40:00Z', updatedBy: 'Logistics Air' },
    ],
    assignedDeliveryPerson: 'Somali Air Cargo - Express',
    createdAt: '2026-03-03T10:00:00Z',
  },
  {
    id: 'DK-2026-1044',
    customerName: 'Cabdiweli Jaamac Faarax',
    customerPhone: '+252 61 334 7711',
    city: 'Mogadishu',
    deliveryArea: 'Wadajir & Halane',
    deliveryAddress: 'Airport Road, Near Peace Hotel',
    items: [
      {
        productId: 'prod-006',
        variantId: 'var-006-50',
        productName: 'Oud Wood Private Blend',
        brand: 'Tom Ford',
        size: '50ml',
        image: NOIR_IMAGE,
        unitPrice: 195.0,
        costPrice: 110.0,
        quantity: 1,
        subtotal: 195.0,
      },
    ],
    subtotal: 195.0,
    discountAmount: 0.0,
    deliveryFee: 0.0,
    tax: 0.0,
    grandTotal: 195.0,
    paymentMethod: 'EVC Plus',
    paymentStatus: 'Unpaid',
    orderStatus: 'Pending',
    statusHistory: [
      { status: 'Pending', timestamp: '2026-03-04T08:15:00Z', updatedBy: 'System', note: 'Customer awaiting confirmation call' },
    ],
    createdAt: '2026-03-04T08:15:00Z',
  },
];

const INITIAL_EXPENSES: OperatingExpense[] = [
  {
    id: 'exp-001',
    reference: 'EXP-2026-01',
    category: 'Rent',
    description: 'Boutique Showroom & Storage Facility Rent (KM4 Maka Al-Mukarama)',
    amount: 850.0,
    date: '2026-03-01',
    paymentMethod: 'Bank Transfer',
    isPaid: true,
    recipient: 'Al-Hilaal Real Estate Property Group',
    createdBy: 'Owner',
    notes: 'Monthly rent for showroom & storage.',
  },
  {
    id: 'exp-002',
    reference: 'EXP-2026-02',
    category: 'Salaries',
    description: 'Boutique Fragrance Consultants & Store Staff Payroll',
    amount: 1100.0,
    date: '2026-03-01',
    paymentMethod: 'Bank Transfer',
    isPaid: true,
    recipient: 'Store Staff (4 Persons)',
    createdBy: 'Owner',
  },
  {
    id: 'exp-003',
    reference: 'EXP-2026-03',
    category: 'Packaging',
    description: 'Luxury Velvet Ribbon Bags, Embossed Boxes & Atomizer Vials',
    amount: 240.0,
    date: '2026-03-02',
    paymentMethod: 'EVC Plus',
    isPaid: true,
    recipient: 'Mogadishu Premium Packaging House',
    createdBy: 'Inventory Manager',
  },
  {
    id: 'exp-004',
    reference: 'EXP-2026-04',
    category: 'Marketing & Ads',
    description: 'Somali Social Media Video Campaign & Creator Fragrance Reviews',
    amount: 350.0,
    date: '2026-03-03',
    paymentMethod: 'EVC Plus',
    isPaid: true,
    recipient: 'Somali Digital Media Agency',
    createdBy: 'Store Manager',
  },
  {
    id: 'exp-005',
    reference: 'EXP-2026-05',
    category: 'Transportation',
    description: 'Motorcycle Dispatch Fuel & Routine Vehicle Maintenance',
    amount: 85.0,
    date: '2026-03-03',
    paymentMethod: 'Cash on Delivery',
    isPaid: true,
    recipient: 'Total Energies KM4',
    createdBy: 'Delivery Staff',
  },
];

const INITIAL_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 'PO-2026-001',
    supplierId: 'sup-001',
    supplierName: 'Gulf Luxury Fragrances FZE',
    items: [
      {
        productId: 'prod-001',
        variantId: 'var-001-50',
        productName: 'Qadir Royal Oud',
        size: '50ml',
        quantityOrdered: 20,
        quantityReceived: 20,
        unitCost: 42.0,
        subtotal: 840.0,
      },
      {
        productId: 'prod-001',
        variantId: 'var-001-100',
        productName: 'Qadir Royal Oud',
        size: '100ml',
        quantityOrdered: 15,
        quantityReceived: 15,
        unitCost: 65.0,
        subtotal: 975.0,
      },
    ],
    freightCost: 120.0,
    discount: 50.0,
    totalCost: 1885.0,
    amountPaid: 1000.0,
    outstandingBalance: 885.0,
    status: 'Received',
    paymentMethod: 'Bank Transfer',
    orderDate: '2026-02-10',
    receivedDate: '2026-02-22',
    notes: 'Air freight cargo received via Aden Adde International Airport.',
  },
  {
    id: 'PO-2026-002',
    supplierId: 'sup-003',
    supplierName: 'Somali Frankincense & Aromatics Ltd',
    items: [
      {
        productId: 'prod-004',
        variantId: 'var-004-50',
        productName: 'Aurora D’Or Imperial',
        size: '50ml',
        quantityOrdered: 12,
        quantityReceived: 12,
        unitCost: 50.0,
        subtotal: 600.0,
      },
    ],
    freightCost: 40.0,
    discount: 0.0,
    totalCost: 640.0,
    amountPaid: 640.0,
    outstandingBalance: 0.0,
    status: 'Received',
    paymentMethod: 'EVC Plus',
    orderDate: '2026-02-15',
    receivedDate: '2026-02-20',
    notes: 'Pure Somali Maydi resins distillation batch.',
  },
];

const INITIAL_STAFF: StaffUser[] = [
  { id: 'usr-1', name: 'DK Owner', email: 'owner@dkperfume.com', phone: '+252 61 748 5100', role: 'owner', active: true, password: 'admin' },
  { id: 'usr-2', name: 'Zahra Barre', email: 'zahra.manager@dkperfume.com', phone: '+252 61 888 2211', role: 'manager', active: true, password: 'manager' },
  { id: 'usr-3', name: 'Cabdi Nuur', email: 'abdi.sales@dkperfume.com', phone: '+252 61 777 3344', role: 'sales', active: true, password: 'sales' },
  { id: 'usr-4', name: 'Shukri Xasan', email: 'shukri.inventory@dkperfume.com', phone: '+252 61 666 4455', role: 'inventory', active: true, password: 'inventory' },
  { id: 'usr-5', name: 'Ibraahim Jaamac', email: 'ibrahim.accountant@dkperfume.com', phone: '+252 61 555 6677', role: 'accountant', active: true, password: 'accountant' },
  { id: 'usr-6', name: 'Axmed Cabdi', email: 'ahmed.delivery@dkperfume.com', phone: '+252 61 444 8899', role: 'delivery', active: true, password: 'delivery' },
];

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-01',
    timestamp: '2026-03-01T08:00:00Z',
    userId: 'usr-1',
    userName: 'DK Owner',
    action: 'System Initialized',
    entityType: 'Store',
    entityId: 'global',
    details: 'DK Perfume store initialised.',
  },
  {
    id: 'log-02',
    timestamp: '2026-03-01T09:45:00Z',
    userId: 'usr-3',
    userName: 'Cabdi Nuur (Sales)',
    action: 'Order Confirmed',
    entityType: 'Order',
    entityId: 'DK-2026-1041',
    details: 'Verified EVC Plus payment transaction #EVC-TXN-902188 and confirmed order.',
  },
];

const INITIAL_STOCK_MOVEMENTS: StockMovement[] = [
  {
    id: 'sm-01',
    productId: 'prod-001',
    variantId: 'var-001-50',
    productName: 'Qadir Royal Oud',
    size: '50ml',
    quantityChange: 20,
    newBalance: 20,
    type: 'purchase_received',
    referenceId: 'PO-2026-001',
    reason: 'Initial purchase shipment received from Gulf Luxury Fragrances FZE',
    performedBy: 'Shukri Xasan (Inventory)',
    timestamp: '2026-02-22T14:00:00Z',
  },
  {
    id: 'sm-02',
    productId: 'prod-001',
    variantId: 'var-001-50',
    productName: 'Qadir Royal Oud',
    size: '50ml',
    quantityChange: -1,
    newBalance: 19,
    type: 'order_sold',
    referenceId: 'DK-2026-1041',
    reason: 'Customer purchase delivered to Amina Cali Maxamed',
    performedBy: 'System',
    timestamp: '2026-03-01T09:30:00Z',
  },
];

// Helper for storage persistence
function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`milgo_${key}`);
    if (raw) {
      // Images moved from /src/assets/images (dev-only path) to /public/images, which ships in the build
      return JSON.parse(raw.split('/src/assets/images/').join('/images/'));
    }
    return structuredClone(fallback);
  } catch (err) {
    console.warn(`Failed to read from localStorage key milgo_${key}`, err);
  }
  return fallback;
}

// Collections the API accepts through "save"; orders, staff and the audit log have their own endpoints
const REMOTE_KEYS = new Set(['products', 'movements', 'suppliers', 'purchases', 'expenses', 'delivery_zones', 'coupons', 'settings']);
let remoteSave: ((key: string, data: unknown) => void) | null = null;

function saveToStorage<T>(key: string, data: T): boolean {
  if (remoteSave) {
    if (REMOTE_KEYS.has(key)) remoteSave(key, data);
    return true;
  }
  try {
    localStorage.setItem(`milgo_${key}`, JSON.stringify(data));
    return true;
  } catch (err) {
    console.warn(`Failed to write to localStorage key milgo_${key}`, err);
    return false;
  }
}

// Actor for actions taken by shoppers on the storefront (no staff session)
const STOREFRONT_ACTOR: StaffUser = { id: 'storefront', name: 'Online Store', email: '', phone: '', role: 'sales', active: true };

class StoreRepository {
  private products: Product[];
  private orders: Order[];
  private suppliers: Supplier[];
  private purchaseOrders: PurchaseOrder[];
  private stockMovements: StockMovement[];
  private expenses: OperatingExpense[];
  private deliveryZones: DeliveryZone[];
  private coupons: Coupon[];
  private staff: StaffUser[];
  private auditLogs: AuditLog[];
  private settings: StoreSettings;
  private currentStaff: StaffUser;
  // Server mode: data lives in MySQL behind /api; local mode (no server reachable) keeps the browser-only demo
  private serverMode = false;
  private serverMe: StaffUser | null = null;
  private gateways = { stripe: false, paypal: false };
  private saveErrorListener: ((message: string) => void) | null = null;

  constructor() {
    this.products = loadFromStorage('products', INITIAL_PRODUCTS);
    this.orders = loadFromStorage('orders', INITIAL_ORDERS);
    this.suppliers = loadFromStorage('suppliers', INITIAL_SUPPLIERS);
    this.purchaseOrders = loadFromStorage('purchases', INITIAL_PURCHASE_ORDERS);
    this.stockMovements = loadFromStorage('movements', INITIAL_STOCK_MOVEMENTS);
    this.expenses = loadFromStorage('expenses', INITIAL_EXPENSES);
    this.deliveryZones = loadFromStorage('delivery_zones', INITIAL_DELIVERY_ZONES);
    this.coupons = loadFromStorage('coupons', INITIAL_COUPONS);
    this.staff = loadFromStorage('staff', INITIAL_STAFF);
    this.auditLogs = loadFromStorage('audit_logs', INITIAL_AUDIT_LOGS);
    this.settings = loadFromStorage('settings', INITIAL_SETTINGS);
    this.currentStaff = this.getAuthenticatedStaff() ?? STOREFRONT_ACTOR;
    this.migrateToGbp();
    this.migrateBrand();
  }

  // --- Server connection ---
  async init(): Promise<void> {
    try {
      const boot = await api.bootstrap();
      this.applyServerData(boot);
      this.serverMode = true;
      // The server is the source of truth: drop browser-only demo data (keeps cart, wishlist, theme, language)
      for (const k of ['products', 'orders', 'suppliers', 'purchases', 'movements', 'expenses', 'delivery_zones', 'coupons', 'staff', 'audit_logs', 'settings', 'staff_session']) {
        localStorage.removeItem(`milgo_${k}`);
      }
      remoteSave = (key, data) => {
        api.save(key, data).catch((err: ApiError) => this.saveErrorListener?.(err.message));
      };
    } catch {
      // No API (local development without PHP, or offline): stay in browser-only mode
    }
  }

  private applyServerData(d: Bootstrap): void {
    this.products = d.products ?? [];
    this.settings = { ...INITIAL_SETTINGS, ...(Array.isArray(d.settings) ? {} : d.settings) };
    this.deliveryZones = d.delivery_zones ?? [];
    this.orders = d.orders ?? [];
    this.stockMovements = d.movements ?? [];
    this.suppliers = d.suppliers ?? [];
    this.purchaseOrders = d.purchases ?? [];
    this.expenses = d.expenses ?? [];
    this.coupons = d.coupons ?? [];
    this.auditLogs = d.audit_logs ?? [];
    this.serverMe = d.me;
    this.staff = d.staff ?? [];
    if (d.me && !this.staff.some((s) => s.id === d.me!.id)) this.staff = [d.me, ...this.staff];
    this.currentStaff = d.me ?? STOREFRONT_ACTOR;
    this.gateways = d.gateways ?? { stripe: false, paypal: false };
  }

  // Re-read everything the signed-in role may see (after sign-in, order changes, or page switches)
  async syncFromServer(): Promise<void> {
    if (!this.serverMode) return;
    try {
      this.applyServerData(await api.bootstrap());
    } catch {
      /* keep the data we have */
    }
  }

  isServerMode(): boolean {
    return this.serverMode;
  }

  getGateways(): { stripe: boolean; paypal: boolean } {
    return this.gateways;
  }

  onSaveError(listener: ((message: string) => void) | null): void {
    this.saveErrorListener = listener;
  }

  async login(identifier: string, password: string): Promise<{ success: boolean; staff?: StaffUser; error?: string }> {
    if (!this.serverMode) return this.authenticateStaff(identifier, password);
    try {
      const { me } = await api.login(identifier, password);
      this.serverMe = me;
      this.currentStaff = me;
      await this.syncFromServer();
      return { success: true, staff: me };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  // Checkout: the server prices the order and, for card/PayPal, returns the payment page to send the shopper to
  async placeOrder(
    local: Omit<Order, 'id' | 'createdAt' | 'statusHistory'>,
    request: OrderRequest
  ): Promise<{ success: boolean; order?: Order; redirectUrl?: string | null; error?: string }> {
    if (!this.serverMode) return this.createOrder(local);
    try {
      const { order, redirectUrl } = await api.orderCreate(request);
      await this.syncFromServer();
      return { success: true, order, redirectUrl };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  async checkCoupon(code: string, subtotal: number): Promise<{ valid: boolean; discountAmount: number; message: string }> {
    if (!this.serverMode) return this.validateCoupon(code, subtotal);
    try {
      const r = await api.couponCheck(code, subtotal);
      return { valid: r.valid, discountAmount: r.discount, message: r.message };
    } catch (err) {
      return { valid: false, discountAmount: 0, message: (err as Error).message };
    }
  }

  async trackOrder(id: string, phone: string): Promise<TrackedOrder | null> {
    if (this.serverMode) {
      try {
        return (await api.track(id, phone)).order;
      } catch {
        return null;
      }
    }
    const digits = phone.replace(/\D/g, '');
    const o = this.orders.find((x) => x.id.toLowerCase() === id.trim().toLowerCase());
    if (!o) return null;
    const own = o.customerPhone.replace(/\D/g, '');
    if (digits && !own.includes(digits) && !digits.includes(own)) return null;
    return o;
  }

  private async remoteOrderUpdate(orderId: string, patch: Record<string, unknown>): Promise<string | null> {
    try {
      const { order } = await api.orderUpdate(orderId, patch);
      this.orders = this.orders.map((o) => (o.id === order.id ? order : o));
      await this.syncFromServer();
      return null;
    } catch (err) {
      return (err as Error).message;
    }
  }

  // --- Products ---
  getProducts(): Product[] {
    return [...this.products];
  }

  getProductById(id: string): Product | undefined {
    return this.products.find((p) => p.id === id);
  }

  saveProduct(product: Product): void {
    if (!this.requirePermission('products', 'save product')) return;
    const idx = this.products.findIndex((p) => p.id === product.id);
    if (idx >= 0) {
      this.products[idx] = product;
      this.logAction('Product Updated', 'Product', product.id, `Updated product ${product.name}`);
    } else {
      this.products.unshift(product);
      this.logAction('Product Created', 'Product', product.id, `Created new perfume ${product.name}`);
    }
    saveToStorage('products', this.products);
  }

  deleteProduct(id: string): void {
    if (!this.requirePermission('products', 'delete product')) return;
    const product = this.getProductById(id);
    this.products = this.products.filter((p) => p.id !== id);
    if (product) {
      this.logAction('Product Deleted', 'Product', id, `Deleted perfume ${product.name}`);
    }
    saveToStorage('products', this.products);
  }

  // --- Orders & Stock Reservation ---
  getOrders(): Order[] {
    return [...this.orders];
  }

  getOrderById(id: string): Order | undefined {
    return this.orders.find((o) => o.id === id);
  }

  createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'statusHistory'>): { success: boolean; order?: Order; error?: string } {
    // 1. Stock Check & Validation on server level
    for (const item of orderData.items) {
      const product = this.getProductById(item.productId);
      if (!product) {
        return { success: false, error: `Product not found: ${item.productName}` };
      }
      const variant = product.variants.find((v) => v.id === item.variantId);
      if (!variant) {
        return { success: false, error: `Variant not found for: ${item.productName}` };
      }
      if (variant.stockQuantity < item.quantity) {
        return {
          success: false,
          error: `Insufficient stock for ${item.productName} (${variant.size}). Available: ${variant.stockQuantity}, Requested: ${item.quantity}`,
        };
      }
    }

    // 2. Generate unique order ID
    const year = new Date().getFullYear();
    const count = this.orders.length + 1045;
    const orderId = `DK-${year}-${count}`;

    // 3. Atomically deduct stock and create movement record
    for (const item of orderData.items) {
      const product = this.getProductById(item.productId)!;
      const variant = product.variants.find((v) => v.id === item.variantId)!;
      variant.stockQuantity -= item.quantity;

      this.addStockMovement({
        productId: product.id,
        variantId: variant.id,
        productName: product.name,
        size: variant.size,
        quantityChange: -item.quantity,
        newBalance: variant.stockQuantity,
        type: 'order_sold',
        referenceId: orderId,
        reason: `Customer order placed by ${orderData.customerName}`,
        performedBy: 'Online Store Checkout',
      });
    }
    saveToStorage('products', this.products);

    // 4. Update coupon usage if applicable
    if (orderData.couponCode) {
      const coupon = this.coupons.find((c) => c.code.toUpperCase() === orderData.couponCode?.toUpperCase());
      if (coupon) {
        coupon.timesUsed += 1;
        saveToStorage('coupons', this.coupons);
      }
    }

    // 5. Construct order
    const now = new Date().toISOString();
    const newOrder: Order = {
      ...orderData,
      id: orderId,
      createdAt: now,
      statusHistory: [
        {
          status: orderData.orderStatus || 'Pending',
          timestamp: now,
          updatedBy: 'Customer (Checkout)',
          note: 'Initial order placement',
        },
      ],
    };

    this.orders.unshift(newOrder);
    saveToStorage('orders', this.orders);

    this.logAction('Order Placed', 'Order', orderId, `New order by ${orderData.customerName} for ${formatMoney(orderData.grandTotal)}`);
    return { success: true, order: newOrder };
  }

  updateOrderStatus(orderId: string, newStatus: OrderStatus, note?: string): void | Promise<string | null> {
    if (this.serverMode) return this.remoteOrderUpdate(orderId, { status: newStatus, note });
    if (!this.requirePermission('orders', 'update order status')) return;
    const order = this.getOrderById(orderId);
    if (!order) return;

    const previousStatus = order.orderStatus;
    if (previousStatus === newStatus) return;

    // Handle stock restoration if order is cancelled or returned
    if ((newStatus === 'Cancelled' || newStatus === 'Returned') && previousStatus !== 'Cancelled' && previousStatus !== 'Returned') {
      for (const item of order.items) {
        const product = this.getProductById(item.productId);
        if (product) {
          const variant = product.variants.find((v) => v.id === item.variantId);
          if (variant) {
            variant.stockQuantity += item.quantity;
            this.addStockMovement({
              productId: product.id,
              variantId: variant.id,
              productName: product.name,
              size: variant.size,
              quantityChange: item.quantity,
              newBalance: variant.stockQuantity,
              type: 'order_cancelled',
              referenceId: orderId,
              reason: `Stock restored due to order ${newStatus.toLowerCase()} (${note || 'No note'})`,
              performedBy: this.currentStaff.name,
            });
          }
        }
      }
      saveToStorage('products', this.products);
    }

    order.orderStatus = newStatus;
    order.statusHistory.push({
      status: newStatus,
      timestamp: new Date().toISOString(),
      updatedBy: this.currentStaff.name,
      note,
    });

    this.logAction('Order Status Changed', 'Order', orderId, `Status transitioned from ${previousStatus} to ${newStatus}`);
    saveToStorage('orders', this.orders);
  }

  updateOrderPayment(orderId: string, status: PaymentStatus, reference?: string): void | Promise<string | null> {
    if (this.serverMode) return this.remoteOrderUpdate(orderId, { paymentStatus: status, paymentReference: reference });
    if (!this.requirePermission('orders', 'update payment')) return;
    const order = this.getOrderById(orderId);
    if (!order) return;

    order.paymentStatus = status;
    if (reference) order.paymentReference = reference;
    order.paymentVerifiedBy = this.currentStaff.name;

    this.logAction('Order Payment Updated', 'Order', orderId, `Payment marked as ${status} (Ref: ${reference || 'N/A'})`);
    saveToStorage('orders', this.orders);
  }

  assignOrderCourier(orderId: string, courierName: string, staffId?: string): void | Promise<string | null> {
    if (this.serverMode) return this.remoteOrderUpdate(orderId, { courierName, courierStaffId: staffId ?? null });
    if (!this.requirePermission('orders', 'assign courier')) return;
    const order = this.getOrderById(orderId);
    if (!order) return;

    order.assignedDeliveryPerson = courierName;
    order.assignedStaffId = staffId;
    if (order.orderStatus === 'Confirmed' || order.orderStatus === 'Processing') {
      order.orderStatus = 'Ready for Dispatch';
      order.statusHistory.push({
        status: 'Ready for Dispatch',
        timestamp: new Date().toISOString(),
        updatedBy: this.currentStaff.name,
        note: `Assigned courier: ${courierName}`,
      });
    }

    this.logAction('Courier Assigned', 'Order', orderId, `Assigned to ${courierName}`);
    saveToStorage('orders', this.orders);
  }

  // --- Inventory & Stock Movements ---
  getStockMovements(): StockMovement[] {
    return [...this.stockMovements];
  }

  addStockMovement(movement: Omit<StockMovement, 'id' | 'timestamp'>): void {
    const newMovement: StockMovement = {
      ...movement,
      id: `sm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    this.stockMovements.unshift(newMovement);
    saveToStorage('movements', this.stockMovements);
  }

  manualStockAdjustment(productId: string, variantId: string, newQuantity: number, reason: string): { success: boolean; error?: string } {
    if (!this.requirePermission('inventory', 'adjust stock')) return { success: false, error: 'Not allowed for your role.' };
    if (!reason || reason.trim().length < 5) {
      return { success: false, error: 'A mandatory explanation reason (minimum 5 characters) is required for inventory audit.' };
    }
    const product = this.getProductById(productId);
    if (!product) return { success: false, error: 'Product not found' };

    const variant = product.variants.find((v) => v.id === variantId);
    if (!variant) return { success: false, error: 'Variant not found' };

    const delta = newQuantity - variant.stockQuantity;
    variant.stockQuantity = newQuantity;
    saveToStorage('products', this.products);

    this.addStockMovement({
      productId: product.id,
      variantId: variant.id,
      productName: product.name,
      size: variant.size,
      quantityChange: delta,
      newBalance: newQuantity,
      type: 'manual_adjustment',
      referenceId: 'MANUAL-ADJ',
      reason,
      performedBy: this.currentStaff.name,
    });

    this.logAction('Stock Adjusted', 'Inventory', `${productId}:${variantId}`, `Adjusted ${variant.size} from ${variant.stockQuantity - delta} to ${newQuantity}. Reason: ${reason}`);
    return { success: true };
  }

  // --- Suppliers & Purchase Orders ---
  getSuppliers(): Supplier[] {
    return [...this.suppliers];
  }

  saveSupplier(supplier: Supplier): void {
    if (!this.requirePermission('purchases', 'save supplier')) return;
    const idx = this.suppliers.findIndex((s) => s.id === supplier.id);
    if (idx >= 0) {
      this.suppliers[idx] = supplier;
      this.logAction('Supplier Updated', 'Supplier', supplier.id, `Updated supplier ${supplier.name}`);
    } else {
      this.suppliers.unshift(supplier);
      this.logAction('Supplier Created', 'Supplier', supplier.id, `Created supplier ${supplier.name}`);
    }
    saveToStorage('suppliers', this.suppliers);
  }

  getPurchaseOrders(): PurchaseOrder[] {
    return [...this.purchaseOrders];
  }

  savePurchaseOrder(po: PurchaseOrder): void {
    if (!this.requirePermission('purchases', 'save purchase order')) return;
    const idx = this.purchaseOrders.findIndex((p) => p.id === po.id);
    if (idx >= 0) {
      this.purchaseOrders[idx] = po;
      this.logAction('Purchase Order Updated', 'PurchaseOrder', po.id, `Updated PO ${po.id}`);
    } else {
      this.purchaseOrders.unshift(po);
      this.logAction('Purchase Order Created', 'PurchaseOrder', po.id, `Created PO ${po.id} for ${formatMoney(po.totalCost)}`);
    }
    saveToStorage('purchases', this.purchaseOrders);
  }

  receivePurchaseOrder(poId: string): { success: boolean; error?: string } {
    if (!this.requirePermission('purchases', 'receive goods')) return { success: false, error: 'Not allowed for your role.' };
    const po = this.purchaseOrders.find((p) => p.id === poId);
    if (!po) return { success: false, error: 'Purchase order not found' };
    if (po.status === 'Received') return { success: false, error: 'This purchase order has already been received.' };

    // Update product stock traceably for each item
    for (const item of po.items) {
      const product = this.getProductById(item.productId);
      if (product) {
        const variant = product.variants.find((v) => v.id === item.variantId);
        if (variant) {
          const qtyToReceive = item.quantityOrdered - item.quantityReceived;
          if (qtyToReceive > 0) {
            variant.stockQuantity += qtyToReceive;
            item.quantityReceived = item.quantityOrdered;

            this.addStockMovement({
              productId: product.id,
              variantId: variant.id,
              productName: product.name,
              size: variant.size,
              quantityChange: qtyToReceive,
              newBalance: variant.stockQuantity,
              type: 'purchase_received',
              referenceId: po.id,
              reason: `Goods received from supplier ${po.supplierName} (PO: ${po.id})`,
              performedBy: this.currentStaff.name,
            });
          }
        }
      }
    }
    saveToStorage('products', this.products);

    po.status = 'Received';
    po.receivedDate = new Date().toISOString();
    saveToStorage('purchases', this.purchaseOrders);

    this.logAction('PO Goods Received', 'PurchaseOrder', po.id, `Received inventory for PO ${po.id}`);
    return { success: true };
  }

  // --- Operating Expenses ---
  getExpenses(): OperatingExpense[] {
    return [...this.expenses];
  }

  saveExpense(expense: OperatingExpense): void {
    if (!this.requirePermission('expenses', 'save expense')) return;
    const idx = this.expenses.findIndex((e) => e.id === expense.id);
    if (idx >= 0) {
      this.expenses[idx] = expense;
      this.logAction('Expense Updated', 'Expense', expense.id, `Updated expense ${expense.reference}`);
    } else {
      this.expenses.unshift(expense);
      this.logAction('Expense Recorded', 'Expense', expense.id, `Recorded expense ${expense.reference} of ${formatMoney(expense.amount)}`);
    }
    saveToStorage('expenses', this.expenses);
  }

  deleteExpense(id: string): void {
    if (!this.requirePermission('expenses', 'delete expense')) return;
    const expense = this.expenses.find((e) => e.id === id);
    this.expenses = this.expenses.filter((e) => e.id !== id);
    if (expense) {
      this.logAction('Expense Deleted', 'Expense', id, `Deleted expense ${expense.reference}`);
    }
    saveToStorage('expenses', this.expenses);
  }

  // --- Financial & Accounting Metrics ---
  getFinancialSummary() {
    // 1. Sales & Revenue
    const completedOrders = this.orders.filter((o) => o.orderStatus !== 'Cancelled');
    const totalGrossSales = completedOrders.reduce((sum, o) => sum + o.subtotal, 0);
    const totalDiscounts = completedOrders.reduce((sum, o) => sum + o.discountAmount, 0);
    const netSales = totalGrossSales - totalDiscounts; // Net Sales Revenue

    // 2. Cost of Goods Sold (COGS) based on historical cost basis at time of sale
    let cogs = 0;
    for (const order of completedOrders) {
      for (const item of order.items) {
        cogs += (item.costPrice || 0) * item.quantity;
      }
    }

    // 3. Gross Profit
    const grossProfit = netSales - cogs;

    // 4. Operating Expenses
    const totalOperatingExpenses = this.expenses.reduce((sum, e) => sum + (e.isPaid ? e.amount : 0), 0);
    const totalUnpaidExpenses = this.expenses.reduce((sum, e) => sum + (!e.isPaid ? e.amount : 0), 0);

    // 5. Estimated Net Operating Profit
    const netOperatingProfit = grossProfit - totalOperatingExpenses;

    // 6. Cash Inflows (Actual cash collected from Paid orders)
    const paidOrders = this.orders.filter((o) => o.paymentStatus === 'Paid' && o.orderStatus !== 'Cancelled');
    const totalCashCollected = paidOrders.reduce((sum, o) => sum + o.grandTotal, 0);

    // 7. Receivables (Unpaid or delivered but pending payment)
    const unpaidOrders = this.orders.filter((o) => o.paymentStatus === 'Unpaid' && o.orderStatus !== 'Cancelled');
    const customerReceivables = unpaidOrders.reduce((sum, o) => sum + o.grandTotal, 0);

    // 8. Supplier Payables
    const supplierPayables = this.suppliers.reduce((sum, s) => sum + s.outstandingBalance, 0);

    // 9. Inventory Valuation
    let inventoryCostValuation = 0;
    let inventoryRetailValuation = 0;
    let totalStockUnits = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const prod of this.products) {
      for (const variant of prod.variants) {
        totalStockUnits += variant.stockQuantity;
        inventoryCostValuation += variant.costPrice * variant.stockQuantity;
        inventoryRetailValuation += variant.sellingPrice * variant.stockQuantity;

        if (variant.stockQuantity === 0) {
          outOfStockCount++;
        } else if (variant.stockQuantity <= variant.lowStockThreshold) {
          lowStockCount++;
        }
      }
    }

    return {
      netSales,
      cogs,
      grossProfit,
      totalOperatingExpenses,
      totalUnpaidExpenses,
      netOperatingProfit,
      totalCashCollected,
      customerReceivables,
      supplierPayables,
      inventoryCostValuation,
      inventoryRetailValuation,
      totalStockUnits,
      lowStockCount,
      outOfStockCount,
      totalOrdersCount: this.orders.length,
      pendingOrdersCount: this.orders.filter((o) => o.orderStatus === 'Pending').length,
    };
  }

  // --- Delivery Zones & Coupons ---
  getDeliveryZones(): DeliveryZone[] {
    return this.deliveryZones.map((z) =>
      z.countries ? z : { ...z, countries: z.regionType === 'international' ? ZONE_COUNTRY_DEFAULTS[z.id] ?? [] : [SOMALIA] }
    );
  }

  // Active zones that ship to a country, falling back to the catch-all ('*') zone. Each zone carries
  // its own fee, transit time and free-shipping threshold, so every region is priced on its own terms.
  getZonesForCountry(country: string): DeliveryZone[] {
    const active = this.getDeliveryZones().filter((z) => z.active);
    const direct = active.filter((z) => z.countries?.includes(country));
    return direct.length ? direct : active.filter((z) => z.countries?.includes('*'));
  }

  saveDeliveryZone(zone: DeliveryZone): void {
    if (!this.requirePermission('delivery', 'save delivery zone')) return;
    const idx = this.deliveryZones.findIndex((z) => z.id === zone.id);
    if (idx >= 0) {
      this.deliveryZones[idx] = zone;
    } else {
      this.deliveryZones.push(zone);
    }
    saveToStorage('delivery_zones', this.deliveryZones);
  }

  getCoupons(): Coupon[] {
    return [...this.coupons];
  }

  saveCoupon(coupon: Coupon): void {
    if (!this.requirePermission('promotions', 'save coupon')) return;
    const idx = this.coupons.findIndex((c) => c.code.toUpperCase() === coupon.code.toUpperCase());
    if (idx >= 0) {
      this.coupons[idx] = coupon;
    } else {
      this.coupons.push(coupon);
    }
    saveToStorage('coupons', this.coupons);
  }

  deleteCoupon(code: string): void {
    if (!this.requirePermission('promotions', 'delete coupon')) return;
    this.coupons = this.coupons.filter((c) => c.code.toUpperCase() !== code.toUpperCase());
    saveToStorage('coupons', this.coupons);
  }

  validateCoupon(code: string, subtotal: number): { valid: boolean; discountAmount: number; message: string } {
    const trimmed = code.trim().toUpperCase();
    const coupon = this.coupons.find((c) => c.code.toUpperCase() === trimmed && c.active);

    if (!coupon) {
      return { valid: false, discountAmount: 0, message: 'Invalid or expired coupon code.' };
    }

    if (subtotal < coupon.minOrderAmount) {
      return {
        valid: false,
        discountAmount: 0,
        message: `Order must be at least ${formatMoney(coupon.minOrderAmount)} to apply code ${coupon.code}.`,
      };
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (subtotal * coupon.discountValue) / 100;
    } else {
      discount = coupon.discountValue;
    }

    discount = Math.min(discount, subtotal);
    return { valid: true, discountAmount: Math.round(discount * 100) / 100, message: 'Coupon applied successfully!' };
  }

  // --- Staff Authentication & Session ---
  getStaff(): StaffUser[] {
    return [...this.staff];
  }

  getAuthenticatedStaff(): StaffUser | null {
    if (this.serverMode) return this.serverMe;
    try {
      const session = localStorage.getItem('milgo_staff_session');
      if (!session) return null;
      const parsed: { id: string } = JSON.parse(session);
      const user = this.staff.find((s) => s.id === parsed.id && s.active);
      return user || null;
    } catch {
      return null;
    }
  }

  getCurrentStaff(): StaffUser {
    return this.getAuthenticatedStaff() ?? this.currentStaff;
  }

  // --- Roles & permissions ---
  getRolePermissions(): Record<DelegatedRole, Permission[]> {
    return { ...DEFAULT_ROLE_PERMISSIONS, ...(this.settings.rolePermissions ?? {}) };
  }

  permissionsFor(user: StaffUser | null): Permission[] {
    if (!user || user.id === STOREFRONT_ACTOR.id || !user.active) return [];
    if (user.role === 'owner') return [...new Set([...Object.values(DEFAULT_ROLE_PERMISSIONS).flat(), ...OWNER_ONLY, 'profit' as Permission])];
    return this.getRolePermissions()[user.role as DelegatedRole].filter((p) => !OWNER_ONLY.includes(p));
  }

  can(permission: Permission, user: StaffUser | null = this.getAuthenticatedStaff()): boolean {
    return this.permissionsFor(user).includes(permission);
  }

  // Guard for write operations: the UI hides what a role cannot do, this blocks it at the data layer too
  private requirePermission(permission: Permission, action: string): boolean {
    if (this.can(permission)) return true;
    console.warn(`Blocked: ${action} requires "${permission}" permission`);
    return false;
  }

  saveRolePermissions(perms: Record<DelegatedRole, Permission[]>): void {
    if (!this.requirePermission('users', 'change role permissions')) return;
    const clean = Object.fromEntries(
      Object.entries(perms).map(([role, list]) => [role, list.filter((p) => !OWNER_ONLY.includes(p))])
    ) as Record<DelegatedRole, Permission[]>;
    this.settings = { ...this.settings, rolePermissions: clean };
    saveToStorage('settings', this.settings);
    this.logAction('Role Permissions Updated', 'Staff', 'roles', 'Owner updated what each role can access');
  }

  // Orders the signed-in staff member may see: couriers only get the orders assigned to them
  getOrdersForCurrentStaff(): Order[] {
    const me = this.getAuthenticatedStaff();
    if (me?.role === 'delivery') {
      return this.getOrders().filter((o) => o.assignedStaffId === me.id || o.assignedDeliveryPerson === me.name);
    }
    return this.getOrders();
  }

  authenticateStaff(identifier: string, password: string): { success: boolean; staff?: StaffUser; error?: string } {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanId || !cleanPass) {
      return { success: false, error: 'Please enter both username/email and password.' };
    }

    // Match by email, alias, or phone
    const found = this.staff.find((s) => {
      const matchEmail = s.email.toLowerCase() === cleanId;
      const matchOwnerAlias = s.role === 'owner' && (cleanId === 'milgoexpress@gmail.com' || cleanId === 'admin' || cleanId === 'owner');
      const matchPhone = s.phone.replace(/\s+/g, '') === cleanId.replace(/\s+/g, '');
      return (matchEmail || matchOwnerAlias || matchPhone) && s.active;
    });

    if (!found) {
      return { success: false, error: 'Staff account not found or access is deactivated.' };
    }

    const expectedPassword = found.password || (found.role === 'owner' ? 'admin' : found.role);
    if (cleanPass !== expectedPassword) {
      return { success: false, error: 'Invalid password. Please check your credentials.' };
    }

    this.currentStaff = found;
    localStorage.setItem('milgo_staff_session', JSON.stringify({ id: found.id }));
    this.logAction('Staff Authenticated', 'Staff', found.id, `${found.name} signed into ERP executive panel`);
    return { success: true, staff: found };
  }

  logoutStaff(): void {
    const user = this.getAuthenticatedStaff() || this.currentStaff;
    if (user) {
      this.logAction('Staff Logged Out', 'Staff', user.id, `${user.name} signed out of ERP`);
    }
    localStorage.removeItem('milgo_staff_session');
    this.currentStaff = STOREFRONT_ACTOR;
    if (this.serverMode) {
      this.serverMe = null;
      api.logout().finally(() => this.syncFromServer());
    }
  }

  saveStaffUser(user: StaffUser): void | Promise<string | null> {
    if (this.serverMode) {
      return api.staffSave(user).then(
        ({ staff }) => {
          this.staff = staff;
          return null;
        },
        (err: Error) => err.message
      );
    }
    if (!this.requirePermission('users', 'save staff')) return;
    const existing = this.staff.find((s) => s.id === user.id);
    const otherOwners = this.staff.filter((s) => s.id !== user.id && s.role === 'owner' && s.active);
    if (existing?.role === 'owner' && (user.role !== 'owner' || !user.active) && otherOwners.length === 0) {
      console.warn('Blocked: the store must keep at least one active owner');
      return;
    }
    const idx = this.staff.findIndex((s) => s.id === user.id);
    if (idx >= 0) {
      this.staff[idx] = user;
      this.logAction('Staff Updated', 'Staff', user.id, `Updated staff profile ${user.name}`);
    } else {
      this.staff.push(user);
      this.logAction('Staff Created', 'Staff', user.id, `Created staff member ${user.name} (${user.role})`);
    }
    saveToStorage('staff', this.staff);
  }

  deleteStaffUser(id: string): boolean | Promise<boolean> {
    if (this.serverMode) {
      return api.staffDelete(id).then(
        ({ staff }) => {
          this.staff = staff;
          return true;
        },
        () => false
      );
    }
    if (!this.requirePermission('users', 'delete staff')) return false;
    const user = this.staff.find((s) => s.id === id);
    if (!user || user.role === 'owner') return false; // Prevent removing owner
    this.staff = this.staff.filter((s) => s.id !== id);
    saveToStorage('staff', this.staff);
    this.logAction('Staff Deleted', 'Staff', id, `Removed staff profile ${user.name}`);
    return true;
  }

  getAuditLogs(): AuditLog[] {
    return [...this.auditLogs];
  }

  private logAction(action: string, entityType: string, entityId: string, details: string): void {
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      userId: this.currentStaff.id,
      userName: this.currentStaff.name,
      action,
      entityType,
      entityId,
      details,
    };
    this.auditLogs.unshift(newLog);
    if (this.serverMode) {
      if (this.serverMe) api.audit({ action, entityType, entityId, details }).catch(() => {});
      return;
    }
    if (this.auditLogs.length > 300) {
      this.auditLogs = this.auditLogs.slice(0, 300);
    }
    saveToStorage('audit_logs', this.auditLogs);
  }

  // --- Settings ---
  getSettings(): StoreSettings {
    return { ...this.settings };
  }

  saveSettings(newSettings: StoreSettings): void {
    if (!this.requirePermission('settings', 'save settings')) return;
    this.settings = newSettings;
    saveToStorage('settings', this.settings);
    this.logAction('Store Settings Updated', 'Settings', 'global', 'Updated core business settings');
  }

  // --- Payments & Markets ---
  getPaymentSettings(): PaymentSettings {
    return this.settings.payments ?? DEFAULT_PAYMENT_SETTINGS;
  }

  getMarketSettings(): MarketSettings {
    return this.settings.markets ?? DEFAULT_MARKET_SETTINGS;
  }

  savePaymentsAndMarkets(payments: PaymentSettings, markets: MarketSettings): void {
    if (!this.requirePermission('payments', 'save payments')) return;
    this.settings = { ...this.settings, payments, markets };
    saveToStorage('settings', this.settings);
    this.logAction('Payments Updated', 'Settings', 'payments', 'Updated payment methods and selling markets');
  }

  // --- Homepage Collections ---
  getCollections(): CollectionsSection {
    return structuredClone(this.settings.collections ?? DEFAULT_COLLECTIONS);
  }

  saveCollections(collections: CollectionsSection): { success: boolean; error?: string } {
    if (!this.requirePermission('hero', 'save collections')) return { success: false, error: 'Not allowed for your role.' };
    const previous = this.settings;
    this.settings = { ...this.settings, collections };
    if (!saveToStorage('settings', this.settings)) {
      this.settings = previous;
      return { success: false, error: 'Browser storage is full. Use smaller images or image URLs, then save again.' };
    }
    this.logAction('Collections Updated', 'Settings', 'collections', `Saved ${collections.cards.length} homepage collection card(s)`);
    return { success: true };
  }

  // --- Homepage Hero Slides ---
  getHeroSlides(): HeroSlide[] {
    return [...(this.settings.heroSlides ?? DEFAULT_HERO_SLIDES)];
  }

  saveHeroSlides(slides: HeroSlide[]): { success: boolean; error?: string } {
    if (!this.requirePermission('hero', 'save homepage')) return { success: false, error: 'Not allowed for your role.' };
    const previous = this.settings;
    this.settings = { ...this.settings, heroSlides: slides };
    if (!saveToStorage('settings', this.settings)) {
      this.settings = previous;
      return {
        success: false,
        error: 'Browser storage is full. Remove a slide or use a smaller image / image URL, then save again.',
      };
    }
    this.logAction('Hero Banner Updated', 'Settings', 'hero', `Saved ${slides.length} homepage banner slide(s)`);
    return { success: true };
  }

  // --- One-time rebrand: Milgo Parfums -> DK Perfume (dkperfume.com) ---
  private migrateBrand(): void {
    if ((this.settings.dataVersion ?? 1) >= 2) return;
    const brand = (b: string) => (b === 'Milgo Signature' ? 'DK Signature' : b);
    const email = (m: string) => m.replace(/@milgoparfums\.so$/i, '@dkperfume.com');

    for (const p of this.products) p.brand = brand(p.brand);
    for (const o of this.orders) for (const it of o.items) it.brand = brand(it.brand);
    for (const s of this.staff) {
      s.email = email(s.email);
      if (s.name === 'Milgo Owner / Admin') s.name = 'DK Owner';
    }
    const st = this.settings;
    const payments = st.payments;
    this.settings = {
      ...st,
      dataVersion: 2,
      storeName: st.storeName === 'Milgo Parfums' ? 'DK Perfume' : st.storeName,
      email: email(st.email),
      instagram: st.instagram === 'milgoparfums' ? 'dkperfume' : st.instagram,
      facebook: st.facebook === 'milgoparfums' ? 'dkperfume' : st.facebook,
      payments: payments && payments.bankTransfer.accountName === 'Milgo Parfums Ltd'
        ? { ...payments, bankTransfer: { ...payments.bankTransfer, accountName: 'DK Perfume Ltd' } }
        : payments,
    };
    saveToStorage('products', this.products);
    saveToStorage('orders', this.orders);
    saveToStorage('staff', this.staff);
    saveToStorage('settings', this.settings);
  }

  // --- One-time move to GBP (head office relocated to London) ---
  // Data recorded before the move is in USD: convert every money figure once, give each delivery
  // zone its own country list and free-shipping threshold, and add UK zones.
  private migrateToGbp(): void {
    if (this.settings.currency === BASE_CURRENCY) return;
    const r = LEGACY_USD_TO_GBP;
    const cents = (n: number) => Math.round(n * r * 100) / 100;
    const pounds = (n: number) => Math.round(n * r);
    const halfPounds = (n: number) => Math.round(n * r * 2) / 2;

    for (const p of this.products) {
      for (const v of p.variants) {
        v.costPrice = cents(v.costPrice);
        v.sellingPrice = pounds(v.sellingPrice);
        if (v.discountPrice) v.discountPrice = pounds(v.discountPrice);
      }
    }
    for (const o of this.orders) {
      for (const it of o.items) {
        it.unitPrice = cents(it.unitPrice);
        it.costPrice = cents(it.costPrice);
        it.subtotal = cents(it.subtotal);
      }
      o.subtotal = cents(o.subtotal);
      o.discountAmount = cents(o.discountAmount);
      o.deliveryFee = cents(o.deliveryFee);
      o.tax = cents(o.tax);
      o.grandTotal = cents(o.grandTotal);
      o.currency = BASE_CURRENCY;
      if (o.paymentGatewayDetails?.refundAmount) o.paymentGatewayDetails.refundAmount = cents(o.paymentGatewayDetails.refundAmount);
    }
    for (const po of this.purchaseOrders) {
      for (const it of po.items) {
        it.unitCost = cents(it.unitCost);
        it.subtotal = cents(it.subtotal);
      }
      po.freightCost = cents(po.freightCost);
      po.discount = cents(po.discount);
      po.totalCost = cents(po.totalCost);
      po.amountPaid = cents(po.amountPaid);
      po.outstandingBalance = cents(po.outstandingBalance);
    }
    for (const s of this.suppliers) s.outstandingBalance = cents(s.outstandingBalance);
    for (const x of this.expenses) x.amount = cents(x.amount);
    for (const c of this.coupons) {
      if (c.discountType === 'fixed') c.discountValue = pounds(c.discountValue);
      c.minOrderAmount = pounds(c.minOrderAmount);
    }

    const somaliFreeFrom = pounds(this.settings.freeDeliveryThreshold || 50);
    this.deliveryZones = this.getDeliveryZones().map((z) => {
      const intl = z.regionType === 'international';
      const countries = z.id === 'zone-int-uk' ? (z.countries ?? []).filter((c) => c !== 'GB') : z.countries;
      return {
        ...z,
        city: z.id === 'zone-int-uk' && z.city === 'United Kingdom & Europe' ? 'Europe' : z.city,
        countries,
        deliveryFee: halfPounds(z.deliveryFee),
        freeShippingFrom: z.freeShippingFrom !== undefined ? z.freeShippingFrom : intl ? null : somaliFreeFrom,
      };
    });
    if (!this.deliveryZones.some((z) => z.countries?.includes('GB'))) {
      this.deliveryZones.unshift(
        { id: 'zone-uk-std', city: 'United Kingdom', zoneName: 'UK Standard (Royal Mail Tracked 48)', country: 'United Kingdom', regionType: 'international', countries: ['GB'], deliveryFee: 3.95, estimatedHours: '2–3 working days', freeShippingFrom: 60, active: true },
        { id: 'zone-uk-next', city: 'United Kingdom', zoneName: 'UK Next Day (DPD)', country: 'United Kingdom', regionType: 'international', countries: ['GB'], deliveryFee: 6.95, estimatedHours: 'Next working day', freeShippingFrom: 150, active: true }
      );
    }

    const markets = this.settings.markets ?? DEFAULT_MARKET_SETTINGS;
    const rates = markets.currencyRates
      .filter((x) => x.code !== BASE_CURRENCY)
      .map((x) => ({ code: x.code, rate: Math.round((x.rate / r) * 100) / 100 }));
    if (!rates.some((x) => x.code === 'USD')) rates.unshift({ code: 'USD', rate: Math.round((1 / r) * 100) / 100 });

    const legacyAddresses = ['Maka Al-Mukarama Road, KM4, Hodan District, Mogadishu, Somalia'];
    const legacyBannersEn = [
      'Complimentary luxury delivery on orders over $50 · Worldwide Express Delivery · 100% Guaranteed Authentic Flacons',
      'Free delivery in Somalia over $50 · Worldwide shipping',
    ];
    this.settings = {
      ...this.settings,
      currency: BASE_CURRENCY,
      freeDeliveryThreshold: pounds(this.settings.freeDeliveryThreshold || 50),
      currencyRateSos: Math.round(this.settings.currencyRateSos / r / 100) * 100,
      markets: { ...markets, currencyRates: rates },
      address: legacyAddresses.includes(this.settings.address) ? INITIAL_SETTINGS.address : this.settings.address,
      ...(legacyBannersEn.includes(this.settings.announcementBarTextEn)
        ? { announcementBarTextEn: INITIAL_SETTINGS.announcementBarTextEn, announcementBarTextSo: INITIAL_SETTINGS.announcementBarTextSo }
        : {}),
    };

    saveToStorage('products', this.products);
    saveToStorage('orders', this.orders);
    saveToStorage('purchases', this.purchaseOrders);
    saveToStorage('suppliers', this.suppliers);
    saveToStorage('expenses', this.expenses);
    saveToStorage('coupons', this.coupons);
    saveToStorage('delivery_zones', this.deliveryZones);
    saveToStorage('settings', this.settings);
  }

  // --- Reset to Initial Seed Data ---
  resetToSeed(): void {
    localStorage.clear();
    this.products = structuredClone(INITIAL_PRODUCTS);
    this.orders = structuredClone(INITIAL_ORDERS);
    this.suppliers = structuredClone(INITIAL_SUPPLIERS);
    this.purchaseOrders = structuredClone(INITIAL_PURCHASE_ORDERS);
    this.stockMovements = structuredClone(INITIAL_STOCK_MOVEMENTS);
    this.expenses = structuredClone(INITIAL_EXPENSES);
    this.deliveryZones = structuredClone(INITIAL_DELIVERY_ZONES);
    this.coupons = structuredClone(INITIAL_COUPONS);
    this.staff = structuredClone(INITIAL_STAFF);
    this.auditLogs = structuredClone(INITIAL_AUDIT_LOGS);
    this.settings = structuredClone(INITIAL_SETTINGS);
    this.currentStaff = this.staff[0];
    this.migrateToGbp();
  }
}

export const storeRepo = new StoreRepository();
