import React, { useState } from 'react';
import { Language, StoreSettings } from '../../types';
import { AdminHero } from './AdminHero';
import { AdminCollections } from './AdminCollections';
import { AdminFooter } from './AdminFooter';

interface AdminHomepageProps {
  lang: Language;
  onSettingsUpdated: (newSettings: StoreSettings) => void;
}

// Everything shown on the storefront home page, one tab per section
export const AdminHomepage: React.FC<AdminHomepageProps> = ({ lang, onSettingsUpdated }) => {
  const so = lang === 'so';
  const [tab, setTab] = useState<'banner' | 'collections' | 'footer'>('banner');
  const tabs = [
    { id: 'banner' as const, label: so ? 'Sawirka weyn' : 'Banner' },
    { id: 'collections' as const, label: so ? 'Xulalka' : 'Collections' },
    { id: 'footer' as const, label: 'Footer' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex border-b border-line" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-3 text-xs uppercase tracking-[0.14em] -mb-px border-b-2 transition-colors cursor-pointer ${
              tab === t.id ? 'border-fg text-fg' : 'border-transparent text-fg-3 hover:text-fg'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'banner' ? (
        <AdminHero lang={lang} onSettingsUpdated={onSettingsUpdated} />
      ) : tab === 'collections' ? (
        <AdminCollections lang={lang} onSettingsUpdated={onSettingsUpdated} />
      ) : (
        <AdminFooter lang={lang} onSettingsUpdated={onSettingsUpdated} />
      )}
    </div>
  );
};
