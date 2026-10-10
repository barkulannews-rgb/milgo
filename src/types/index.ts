import type { CardBrand } from '../lib/countries';
import type { Permission } from '../lib/permissions';

export type Language = 'so' | 'en';

export type FragranceFamily = 'Woody' | 'Oriental' | 'Floral' | 'Fresh' | 'Citrus' | 'Gourmand' | 'Leather';
export type FragranceConcentration = 'Eau de Parfum' | 'Extrait de Parfum' | 'Eau de Toilette' | 'Parfum' | 'Cologne';
export type GenderCategory = 'Unisex' | 'Men' | 'Women';

export interface ProductVariant {
  id: string;
  size: string; // e.g. "50ml", "100ml"
  sku: string;
  barcode?: string;
  costPrice: number; // For COGS and valuation
  sellingPrice: number;
  discountPrice?: number;
  stockQuantity: number;
  lowStockThreshold: number;
}

export interface FragranceNotes {
  top: string[];
  heart: string[];
  base: string[];
}

export interface Product {
  id: string;
  name: string;
  nameSo: string;
  brand: string;
  category: string;
  fragranceFamily: FragranceFamily;
  concentration: FragranceConcentration;
  gender: GenderCategory;
  description: string;
  descriptionSo: string;
  images: string[];
  notes: FragranceNotes;
  variants: ProductVariant[];
  featured?: boolean;
  bestSeller?: boolean;
  isNewArrival?: boolean;
  active: boolean;
  authenticityVerified: boolean;
  usageInstructions?: string;
  rating: number;
  reviewCount: number;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  variantId: string;
  productName: string;
  brand: string;
  size: string;
  image: string;
  unitPrice: number;
  quantity: number;
  availableStock: number;
}

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Ready for Dispatch'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled'
  | 'Return Requested'
  | 'Returned'
  | 'Refunded';

export type PaymentMethod =
  | 'Credit / Debit Card'
  | 'PayPal'
  | 'Apple Pay'
  | 'Google Pay'
  | 'EVC Plus'
  | 'Zaad'
  | 'Sahal'
  | 'Edahab'
  | 'Cash on Delivery'
  | 'Bank Transfer';

export type PaymentStatus = 'Unpaid' | 'Paid' | 'Partial' | 'Refunded';

export interface OrderItem {
  productId: string;
  variantId: string;
  productName: string;
  brand: string;
  size: string;
  image: string;
  unitPrice: number;
  costPrice: number; // Historical cost basis at time of sale
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string; // e.g. "MLG-2026-1042"
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  country?: string;
  city: string;
  postalCode?: string;
  deliveryArea: string;
  deliveryAddress: string;
  deliveryInstructions?: string;
  shippingMethod?: string;
  trackingNumber?: string;
  carrierName?: string;
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  couponCode?: string;
  deliveryFee: number;
  tax: number;
  grandTotal: number;
  currency?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentReference?: string;
  paymentGatewayDetails?: {
    gateway: 'Stripe' | 'PayPal' | 'ApplePay' | 'GooglePay' | 'MobileMoney' | 'Bank';
    transactionId: string;
    cardBrand?: string;
    cardLast4?: string;
    payerEmail?: string;
    riskScore?: string;
    captureDate?: string;
    refundAmount?: number;
    refundReason?: string;
  };
  paymentVerifiedBy?: string;
  orderStatus: OrderStatus;
  statusHistory: {
    status: OrderStatus;
    timestamp: string;
    updatedBy: string;
    note?: string;
  }[];
  assignedDeliveryPerson?: string;
  assignedStaffId?: string; // Staff member (delivery role) responsible for this order
  internalNotes?: string;
  createdAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  size: string;
  quantityChange: number; // positive or negative
  newBalance: number;
  type: 'purchase_received' | 'order_sold' | 'order_cancelled' | 'damaged' | 'manual_adjustment' | 'return_accepted';
  referenceId: string; // e.g. Order ID, PO number
  reason: string;
  performedBy: string;
  timestamp: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  notes?: string;
  outstandingBalance: number;
}

export interface PurchaseItem {
  productId: string;
  variantId: string;
  productName: string;
  size: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitCost: number;
  subtotal: number;
}

export interface PurchaseOrder {
  id: string; // e.g. "PO-2026-088"
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  freightCost: number;
  discount: number;
  totalCost: number;
  amountPaid: number;
  outstandingBalance: number;
  status: 'Draft' | 'Ordered' | 'Partially Received' | 'Received' | 'Cancelled';
  paymentMethod: string;
  notes?: string;
  orderDate: string;
  expectedDate?: string;
  receivedDate?: string;
}

export interface OperatingExpense {
  id: string;
  reference: string;
  category: 'Rent' | 'Salaries' | 'Packaging' | 'Marketing & Ads' | 'Transportation' | 'Utilities' | 'Equipment' | 'Other';
  description: string;
  amount: number;
  date: string;
  paymentMethod: string;
  isPaid: boolean;
  recipient?: string;
  createdBy: string;
  notes?: string;
}

export interface FinancialTransaction {
  id: string;
  reference: string;
  date: string;
  type: 'Customer Payment' | 'Supplier Payment' | 'Operating Expense' | 'Refund' | 'Cash Adjustment';
  amount: number;
  direction: 'inflow' | 'outflow';
  paymentMethod: string;
  relatedEntityId?: string; // Order ID, PO ID, or Expense ID
  recordedBy: string;
  notes?: string;
}

export interface DeliveryZone {
  id: string;
  city: string;
  zoneName: string;
  country?: string;
  regionType?: 'domestic' | 'international';
  countries?: string[]; // ISO codes the zone ships to; '*' = every country not covered by another zone
  freeShippingFrom?: number | null; // Order subtotal (GBP) from which shipping is free in this zone; null = never
  deliveryFee: number;
  estimatedHours: string;
  active: boolean;
}

export interface Coupon {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxUsage?: number;
  timesUsed: number;
  expiryDate: string;
  active: boolean;
}

export interface StoreReview {
  id: string;
  productId: string;
  customerName: string;
  rating: number; // 1 to 5
  comment: string;
  date: string;
  verifiedPurchase: boolean;
}

export type StaffRole = 'owner' | 'manager' | 'sales' | 'inventory' | 'accountant' | 'delivery';

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: StaffRole;
  active: boolean;
  password?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
}

export type MobileWallet = 'EVC Plus' | 'Zaad' | 'Sahal' | 'Edahab';

// Which payment options checkout offers. Only public identifiers live here: gateway secret keys
// belong on a server, never in the browser.
export interface PaymentSettings {
  mode: 'test' | 'live'; // 'test' simulates gateway approval; 'live' needs the server-side integration
  cards: { enabled: boolean; brands: CardBrand[]; stripePublishableKey: string };
  paypal: { enabled: boolean; clientId: string };
  applePay: boolean;
  googlePay: boolean;
  mobileMoney: { enabled: boolean; countries: string[]; wallets: { name: MobileWallet; enabled: boolean; merchantNumber: string }[] };
  bankTransfer: { enabled: boolean; bankName: string; accountName: string; iban: string; swift: string; instructions: string };
  cashOnDelivery: { enabled: boolean; countries: string[] };
}

// Where the store sells and which currencies shoppers see approximate prices in (orders are charged in GBP).
export interface MarketSettings {
  sellWorldwide: boolean;
  allowedCountries: string[]; // ISO codes, used when sellWorldwide is false
  currencyRates: { code: string; rate: number }[]; // units per 1 GBP
}

export interface HeroSlide {
  id: string;
  source?: 'upload' | 'product'; // Missing means 'upload' (slides saved before products could be featured)
  productId?: string; // For 'product' slides: image, name and description come from this catalog product
  image: string; // For 'upload' slides: URL or compressed data URL uploaded from the admin
  headlineEn: string; // Empty falls back to the default translated headline
  headlineSo: string;
  subheadlineEn: string;
  subheadlineSo: string;
  tagLabel: string; // Small caption, e.g. "Signature Collection"
  tagTitle: string; // e.g. "Aurora D’Or Imperial"
  active: boolean;
}

// One card in the homepage "Collections" section; clicking it filters the catalogue to its scent family
export interface CollectionCard {
  id: string;
  titleEn: string;
  titleSo: string;
  descEn: string;
  descSo: string;
  image: string; // URL, product photo path, or compressed upload
  family: FragranceFamily | 'All';
  active: boolean;
}

export interface CollectionsSection {
  active: boolean;
  titleEn: string;
  titleSo: string;
  subtitleEn: string;
  subtitleSo: string;
  cards: CollectionCard[];
}

export interface StoreSettings {
  dataVersion?: number; // Bumped by one-time data migrations (2 = DK Perfume rebrand)
  storeName: string;
  taglineEn: string;
  taglineSo: string;
  phone: string;
  email: string;
  address: string;
  currency: string;
  currencyRateSos: number; // Legacy: superseded by markets.currencyRates
  freeDeliveryThreshold: number; // Legacy: free shipping is now set per delivery zone
  announcementBarTextEn: string;
  announcementBarTextSo: string;
  announcementBarActive: boolean;
  whatsappNumber: string;
  instagram: string;
  facebook: string;
  payments?: PaymentSettings;
  markets?: MarketSettings;
  heroSlides?: HeroSlide[];
  collections?: CollectionsSection;
  rolePermissions?: Partial<Record<Exclude<StaffRole, 'owner'>, Permission[]>>; // Set by the owner; defaults apply when missing
}
