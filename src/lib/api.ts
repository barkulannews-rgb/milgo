// Client for the PHP API in public/api (served at /api/ on Hostinger, proxied by Vite in development).

import type { Order, RatingSummary, Review, StaffUser } from '../types';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function call<T>(action: string, opts: { body?: unknown; query?: Record<string, string>; timeoutMs?: number } = {}): Promise<T> {
  const isForm = opts.body instanceof FormData;
  const query = new URLSearchParams({ a: action, ...(opts.query ?? {}) });
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 20000);
  try {
    const res = await fetch(`/api/?${query}`, {
      method: opts.body === undefined ? 'GET' : 'POST',
      credentials: 'same-origin',
      // The custom header is required by the API for writes, which blocks cross-site form posts
      // (file uploads send FormData, whose content type the browser sets itself)
      headers: opts.body === undefined ? {} : isForm ? { 'X-DK-Client': '1' } : { 'Content-Type': 'application/json', 'X-DK-Client': '1' },
      body: opts.body === undefined ? undefined : isForm ? (opts.body as FormData) : JSON.stringify(opts.body),
      signal: ctrl.signal,
    });
    if (!(res.headers.get('content-type') ?? '').includes('application/json')) throw new ApiError(res.status, 'Server not available');
    const data = await res.json();
    if (!res.ok) throw new ApiError(res.status, data.error ?? 'Request failed');
    return data as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(0, 'Could not reach the server. Check your connection.');
  } finally {
    clearTimeout(timer);
  }
}

export interface Bootstrap {
  products: any[];
  settings: any;
  delivery_zones: any[];
  ratings?: Record<string, RatingSummary>;
  gateways: { stripe: boolean; paypal: boolean };
  me: StaffUser | null;
  orders?: Order[];
  movements?: any[];
  suppliers?: any[];
  purchases?: any[];
  expenses?: any[];
  coupons?: any[];
  audit_logs?: any[];
  reviews?: Review[];
  staff?: StaffUser[];
}

export interface OrderRequest {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  country: string; // ISO code
  countryName: string;
  city?: string;
  postalCode?: string;
  zoneId: string;
  deliveryAddress: string;
  deliveryInstructions?: string;
  paymentMethod: string;
  paymentReference?: string;
  couponCode?: string;
  items: { productId: string; variantId: string; quantity: number }[];
}

export type TrackedOrder = Pick<Order, 'id' | 'city' | 'orderStatus' | 'assignedDeliveryPerson' | 'createdAt'> & {
  items: { productId: string; productName: string; size: string; quantity: number; subtotal: number }[];
  ratings?: Record<string, number>; // stars already given on this order, by product
};

export type GatewayKeyField = 'stripe_secret_key' | 'stripe_webhook_secret' | 'paypal_client_id' | 'paypal_secret' | 'paypal_mode';

export interface GatewayKeys {
  keys: Record<GatewayKeyField, { set: boolean; source: 'admin' | 'config' | ''; hint: string }>;
  webhookUrl: string;
  ready: { stripe: boolean; stripeWebhook: boolean; paypal: boolean };
}

export type PublicReview = Pick<Review, 'id' | 'name' | 'rating' | 'text' | 'createdAt'>;

export interface ReviewRequest {
  orderId: string;
  phone: string;
  productId: string;
  rating: number;
  text: string;
}

export const api = {
  bootstrap: () => call<Bootstrap>('bootstrap', { timeoutMs: 6000 }),
  login: (identifier: string, password: string) => call<{ me: StaffUser }>('login', { body: { identifier, password } }),
  logout: () => call<{ ok: true }>('logout', { body: {} }),
  save: (key: string, value: unknown) => call<{ ok: true }>('save', { body: { key, value } }),
  audit: (entry: { action: string; entityType: string; entityId: string; details: string }) => call<{ ok: true }>('audit', { body: entry }),
  staffSave: (user: Partial<StaffUser> & { password?: string }) => call<{ staff: StaffUser[] }>('staff_save', { body: { user } }),
  staffDelete: (id: string) => call<{ staff: StaffUser[] }>('staff_delete', { body: { id } }),
  couponCheck: (code: string, subtotal: number) =>
    call<{ valid: boolean; discount: number; message: string }>('coupon_check', { body: { code, subtotal } }),
  orderCreate: (req: OrderRequest) => call<{ order: Order; redirectUrl: string | null }>('order_create', { body: req }),
  orderUpdate: (id: string, patch: Record<string, unknown>) => call<{ order: Order }>('order_update', { body: { id, ...patch } }),
  upload: (file: Blob, name: string) => {
    const form = new FormData();
    form.append('file', file, name);
    return call<{ url: string }>('upload', { body: form, timeoutMs: 60000 });
  },
  reviews: (productId: string) => call<{ reviews: PublicReview[] }>('reviews', { query: { product: productId } }),
  reviewCreate: (req: ReviewRequest) => call<{ review: Review }>('review_create', { body: req }),
  reviewModerate: (id: string, change: { hidden?: boolean; delete?: boolean }) =>
    call<{ reviews: Review[] }>('review_moderate', { body: { id, ...change } }),
  passwordForgot: (email: string) => call<{ ok: true }>('password_forgot', { body: { email } }),
  passwordReset: (token: string, password: string) => call<{ ok: true }>('password_reset', { body: { token, password } }),
  gatewayKeys: () => call<GatewayKeys>('gateway_keys'),
  gatewayKeysSave: (change: Partial<Record<GatewayKeyField, string>> & { clear?: GatewayKeyField[] }) =>
    call<GatewayKeys>('gateway_keys_save', { body: change, timeoutMs: 30000 }),
  track: (id: string, phone: string) => call<{ order: TrackedOrder }>('track', { query: { id, phone } }),
};
