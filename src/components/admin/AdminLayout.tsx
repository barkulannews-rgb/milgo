import React, { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  Boxes,
  Truck,
  ShoppingCart,
  Receipt,
  DollarSign,
  BarChart3,
  Tag,
  Users,
  Settings,
  ArrowLeft,
  Shield,
  Bell,
  LogOut,
  RefreshCw,
  Sun,
  Moon,
  Image as ImageIcon,
  CreditCard,
} from 'lucide-react';
import { StaffUser, StaffRole, Language, StoreSettings } from '../../types';
import { storeRepo } from '../../lib/storage';
import { getTranslation } from '../../lib/translations';
import { roleLabel } from '../../lib/permissions';
import { Logo } from '../brand/Logo';

export type AdminTab =
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
  | 'users'
  | 'payments'
  | 'hero'
  | 'settings';

interface AdminLayoutProps {
  currentTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  theme: 'night' | 'light';
  onToggleTheme: () => void;
  settings: StoreSettings;
  staffUser: StaffUser;
  onLogout: () => void;
  onExitToStore: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onTabChange,
  lang,
  onLanguageChange,
  theme,
  onToggleTheme,
  settings,
  staffUser,
  onLogout,
  onExitToStore,
  children,
}) => {

  const navItems: { id: AdminTab; labelEn: string; labelSo: string; icon: React.FC<{ className?: string; strokeWidth?: number }> }[] = [
    { id: 'dashboard', labelEn: 'Dashboard', labelSo: 'Guudmar', icon: LayoutDashboard },
    { id: 'products', labelEn: 'Products', labelSo: 'Alaabta', icon: Package },
    { id: 'inventory', labelEn: 'Inventory', labelSo: 'Kaydka', icon: Boxes },
    { id: 'purchases', labelEn: 'Purchases', labelSo: 'Iibsashada', icon: Receipt },
    { id: 'orders', labelEn: 'Orders', labelSo: 'Dalabyada', icon: ShoppingCart },
    { id: 'delivery', labelEn: 'Delivery', labelSo: 'Gaarsiinta', icon: Truck },
    { id: 'expenses', labelEn: 'Expenses', labelSo: 'Kharashka', icon: DollarSign },
    { id: 'finances', labelEn: 'Finances', labelSo: 'Maaliyadda', icon: BarChart3 },
    { id: 'reports', labelEn: 'Reports', labelSo: 'Warbixinno', icon: BarChart3 },
    { id: 'promotions', labelEn: 'Coupons', labelSo: 'Koodhadhka', icon: Tag },
    { id: 'users', labelEn: 'Staff', labelSo: 'Shaqaalaha', icon: Users },
    { id: 'payments', labelEn: 'Payments', labelSo: 'Lacag-bixinta', icon: CreditCard },
    { id: 'hero', labelEn: 'Homepage', labelSo: 'Bogga Hore', icon: ImageIcon },
    { id: 'settings', labelEn: 'Settings', labelSo: 'Habayn', icon: Settings },
  ];

  const so = lang === 'so';

  return (
    <div className="min-h-screen bg-canvas text-fg flex flex-col md:flex-row">
      <aside className="w-full md:w-60 bg-canvas border-r border-line flex flex-col shrink-0">
        <div className="px-6 h-16 flex items-center border-b border-line">
          <Logo name={settings.storeName} size="sm" />
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.filter((item) => storeRepo.can(item.id, staffUser)).map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-[13px] transition-colors cursor-pointer text-left ${
                  isActive ? 'bg-surface-3 text-fg' : 'text-fg-3 hover:text-fg'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                <span className="truncate">{so ? item.labelSo : item.labelEn}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-line">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-surface-3 flex items-center justify-center text-fg font-serif text-sm shrink-0">
              {staffUser.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="text-xs text-fg truncate">{staffUser.name}</div>
              <div className="text-[11px] text-fg-3">{roleLabel(staffUser.role, so ? 'so' : 'en')}</div>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <button onClick={onExitToStore} className="text-fg-3 hover:text-fg transition-colors cursor-pointer">
              {getTranslation(lang, 'backToStorefront')}
            </button>
            <button onClick={onLogout} className="text-fg-3 hover:text-red-600 transition-colors cursor-pointer">
              {getTranslation(lang, 'signOut')}
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-14 bg-canvas/95 backdrop-blur border-b border-line px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
          <span className="text-xs text-fg-3 truncate">{staffUser.name}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onLanguageChange(so ? 'en' : 'so')}
              className="px-2 py-1 text-xs tracking-[0.14em] text-fg-2 hover:text-fg transition-colors cursor-pointer"
              aria-label="Language"
            >
              {so ? 'EN' : 'SO'}
            </button>
            <button
              onClick={onToggleTheme}
              className="p-2 text-fg-2 hover:text-fg transition-colors cursor-pointer"
              aria-label={theme === 'night' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'night' ? <Sun className="w-4 h-4" strokeWidth={1.5} /> : <Moon className="w-4 h-4" strokeWidth={1.5} />}
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-10 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
};
