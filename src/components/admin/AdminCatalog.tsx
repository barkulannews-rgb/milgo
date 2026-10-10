import React, { useState } from 'react';
import { Language } from '../../types';
import { storeRepo } from '../../lib/storage';
import { AdminProducts } from './AdminProducts';
import { AdminReviews } from './AdminReviews';

// Products page: the perfumes, and what customers say about them
export const AdminCatalog: React.FC<{ lang: Language }> = ({ lang }) => {
  const so = lang === 'so';
  const [tab, setTab] = useState<'products' | 'reviews'>('products');
  const reviewCount = storeRepo.getReviews().length;
  const tabs = [
    { id: 'products' as const, label: so ? 'Alaabta' : 'Products' },
    { id: 'reviews' as const, label: `${so ? 'Qiimeynta' : 'Reviews'}${reviewCount ? ` (${reviewCount})` : ''}` },
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
      {tab === 'products' ? <AdminProducts lang={lang} /> : <AdminReviews lang={lang} />}
    </div>
  );
};
