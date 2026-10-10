import React from 'react';
import { Language, StoreSettings } from '../../types';
import { getTranslation } from '../../lib/translations';
import { Logo } from '../brand/Logo';

interface FooterProps {
  settings: StoreSettings;
  lang: Language;
  onOpenPolicy: (policyKey: 'about' | 'authenticity' | 'shipping' | 'returns') => void;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  settings,
  lang,
  onOpenPolicy,
  onOpenAdmin,
}) => {
  const heading = 'text-[11px] uppercase tracking-[0.16em] text-fg mb-4';
  const link = 'hover:text-fg transition-colors cursor-pointer text-left';
  const waLink = `https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}`;

  return (
    <footer className="bg-canvas border-t border-line text-fg-3 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          <div className="col-span-2 md:col-span-1">
            <div className="mb-5">
              <Logo name={settings.storeName} />
            </div>
            <p className="leading-relaxed">{lang === 'so' ? settings.taglineSo : settings.taglineEn}</p>
          </div>

          <div>
            <h4 className={heading}>{getTranslation(lang, 'boutiqueLocation')}</h4>
            <ul className="space-y-2">
              <li>{settings.address}</li>
              <li>
                <a href={waLink} target="_blank" rel="noopener noreferrer" className={link}>
                  WhatsApp {settings.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${settings.email}`} className={link}>
                  {settings.email}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className={heading}>{getTranslation(lang, 'policies')}</h4>
            <ul className="space-y-2">
              <li><button onClick={() => onOpenPolicy('about')} className={link}>{getTranslation(lang, 'aboutUs')}</button></li>
              <li><button onClick={() => onOpenPolicy('authenticity')} className={link}>{getTranslation(lang, 'authenticity')}</button></li>
              <li><button onClick={() => onOpenPolicy('shipping')} className={link}>{getTranslation(lang, 'shippingPolicy')}</button></li>
              <li><button onClick={() => onOpenPolicy('returns')} className={link}>{getTranslation(lang, 'returnsPolicy')}</button></li>
            </ul>
          </div>

          <div>
            <h4 className={heading}>{getTranslation(lang, 'customerCare')}</h4>
            <ul className="space-y-2">
              <li>{lang === 'so' ? 'Dirid caalami ah' : 'Worldwide shipping'}</li>
              <li>{lang === 'so' ? 'Cadar 100% asal ah' : '100% authentic'}</li>
              <li>
                <button onClick={onOpenAdmin} className={link}>
                  {getTranslation(lang, 'staffPortal')}
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 pt-6 border-t border-line text-xs">
          © {new Date().getFullYear()} {settings.storeName}. {getTranslation(lang, 'allRightsReserved')}
        </div>
      </div>
    </footer>
  );
};
