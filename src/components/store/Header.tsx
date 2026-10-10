import React from 'react';
import { ShoppingBag, Heart, Search, Sun, Moon } from 'lucide-react';
import { Language, StoreSettings } from '../../types';
import { getTranslation } from '../../lib/translations';
import { Logo } from '../brand/Logo';

interface HeaderProps {
  settings: StoreSettings;
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  theme: 'night' | 'light';
  onToggleTheme: () => void;
  isAuthenticated?: boolean;
  authenticatedStaffName?: string;
  cartCount: number;
  wishlistCount: number;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenSearch: () => void;
  onNavigateSection: (section: string) => void;
  onOpenAdmin: () => void;
  onOpenTrackOrder: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  lang,
  onLanguageChange,
  theme,
  onToggleTheme,
  isAuthenticated,
  authenticatedStaffName,
  cartCount,
  wishlistCount,
  onOpenCart,
  onOpenWishlist,
  onOpenSearch,
  onNavigateSection,
  onOpenAdmin,
  onOpenTrackOrder,
}) => {
  const iconBtn = 'relative p-2 text-fg-2 hover:text-fg transition-colors cursor-pointer';
  const navBtn = 'hover:text-fg transition-colors whitespace-nowrap cursor-pointer';

  return (
    <header className="sticky top-0 z-40 bg-canvas/95 backdrop-blur-md border-b border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between gap-8">
        <button onClick={() => onNavigateSection('home')} className="cursor-pointer shrink-0">
          <Logo name={settings.storeName} />
        </button>

        <nav className="hidden lg:flex items-center gap-8 text-[13px] uppercase tracking-[0.14em] text-fg-2">
          <button onClick={() => onNavigateSection('all')} className={navBtn}>{getTranslation(lang, 'catalog')}</button>
          <button onClick={() => onNavigateSection('Men')} className={navBtn}>{getTranslation(lang, 'men')}</button>
          <button onClick={() => onNavigateSection('Women')} className={navBtn}>{getTranslation(lang, 'women')}</button>
          <button onClick={() => onNavigateSection('Niche & Oud')} className={navBtn}>{getTranslation(lang, 'niche')}</button>
          <button onClick={onOpenTrackOrder} className={navBtn}>{getTranslation(lang, 'trackOrder')}</button>
        </nav>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button onClick={onOpenSearch} className={iconBtn} aria-label="Search" title={getTranslation(lang, 'searchPlaceholder')}>
            <Search className="w-[19px] h-[19px]" strokeWidth={1.5} />
          </button>

          <button onClick={onOpenWishlist} className={`${iconBtn} hidden sm:block`} aria-label={getTranslation(lang, 'wishlist')}>
            <Heart className="w-[19px] h-[19px]" strokeWidth={1.5} />
            {wishlistCount > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 bg-gold text-on-inverse text-[10px] font-medium rounded-full flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </button>

          <button onClick={onOpenCart} className={iconBtn} aria-label={getTranslation(lang, 'cart')}>
            <ShoppingBag className="w-[19px] h-[19px]" strokeWidth={1.5} />
            {cartCount > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 bg-gold text-on-inverse text-[10px] font-medium rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>

          <button onClick={onToggleTheme} className={iconBtn} aria-label={theme === 'night' ? 'Light mode' : 'Dark mode'}>
            {theme === 'night' ? <Sun className="w-[18px] h-[18px]" strokeWidth={1.5} /> : <Moon className="w-[18px] h-[18px]" strokeWidth={1.5} />}
          </button>

          <span className="hidden sm:block w-px h-5 bg-line mx-1" />

          <button
            onClick={() => onLanguageChange(lang === 'so' ? 'en' : 'so')}
            className="px-2 py-1 text-xs tracking-[0.14em] text-fg-2 hover:text-fg transition-colors cursor-pointer"
            aria-label="Language"
          >
            {lang === 'so' ? 'EN' : 'SO'}
          </button>

          <button
            onClick={onOpenAdmin}
            className="hidden md:block px-2 py-1 text-xs tracking-[0.14em] uppercase text-fg-3 hover:text-fg transition-colors cursor-pointer"
            title={isAuthenticated ? authenticatedStaffName : undefined}
          >
            {isAuthenticated ? getTranslation(lang, 'adminPortal') : getTranslation(lang, 'staffPortal')}
          </button>
        </div>
      </div>
    </header>
  );
};
