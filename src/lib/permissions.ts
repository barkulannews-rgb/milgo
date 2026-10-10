import type { StaffRole } from '../types';

// Each admin page is a permission, plus 'profit' for seeing cost, margin and profit figures.
export type Permission =
  | 'dashboard'
  | 'products'
  | 'inventory'
  | 'purchases'
  | 'orders'
  | 'delivery'
  | 'expenses'
  | 'finances'
  | 'reports'
  | 'promotions'
  | 'hero'
  | 'profit'
  | 'users'
  | 'payments'
  | 'settings';

// Only the owner can manage staff, payments and store settings; these are never delegated.
export const OWNER_ONLY: Permission[] = ['users', 'payments', 'settings'];

// Permissions the owner can hand out to other roles, in display order.
export const GRANTABLE: { id: Permission; en: string; so: string }[] = [
  { id: 'dashboard', en: 'Dashboard', so: 'Guudmar' },
  { id: 'orders', en: 'Orders', so: 'Dalabyada' },
  { id: 'products', en: 'Products', so: 'Alaabta' },
  { id: 'inventory', en: 'Inventory', so: 'Kaydka' },
  { id: 'purchases', en: 'Purchases', so: 'Iibsashada' },
  { id: 'delivery', en: 'Delivery zones', so: 'Aagagga gaarsiinta' },
  { id: 'promotions', en: 'Coupons', so: 'Koodhadhka' },
  { id: 'hero', en: 'Homepage', so: 'Bogga hore' },
  { id: 'expenses', en: 'Expenses', so: 'Kharashka' },
  { id: 'finances', en: 'Finances', so: 'Maaliyadda' },
  { id: 'reports', en: 'Reports', so: 'Warbixinno' },
  { id: 'profit', en: 'See costs & profit', so: 'Arag kharashka & faa’iidada' },
];

export type DelegatedRole = Exclude<StaffRole, 'owner'>;

export const ROLES: { id: StaffRole; en: string; so: string }[] = [
  { id: 'owner', en: 'Owner', so: 'Milkiile' },
  { id: 'manager', en: 'Manager', so: 'Maamule' },
  { id: 'sales', en: 'Sales', so: 'Iibiye' },
  { id: 'inventory', en: 'Inventory', so: 'Kaydiye' },
  { id: 'accountant', en: 'Accountant', so: 'Xisaabiye' },
  { id: 'delivery', en: 'Delivery', so: 'Gaarsiiye' },
];

export const DEFAULT_ROLE_PERMISSIONS: Record<DelegatedRole, Permission[]> = {
  manager: ['dashboard', 'orders', 'products', 'inventory', 'purchases', 'delivery', 'promotions', 'hero', 'reports'],
  sales: ['dashboard', 'orders', 'promotions'],
  inventory: ['dashboard', 'products', 'inventory', 'purchases'],
  accountant: ['dashboard', 'orders', 'purchases', 'expenses', 'finances', 'reports', 'profit'],
  // Couriers see only the orders assigned to them (enforced in the orders view)
  delivery: ['orders'],
};

export function roleLabel(role: StaffRole, lang: 'en' | 'so'): string {
  const r = ROLES.find((x) => x.id === role);
  return r ? r[lang] : role;
}
