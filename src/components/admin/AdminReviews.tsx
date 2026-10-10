import React, { useState } from 'react';
import { Eye, EyeOff, Trash2 } from 'lucide-react';
import { Language, Review } from '../../types';
import { storeRepo } from '../../lib/storage';
import { Stars } from '../store/Stars';

interface AdminReviewsProps {
  lang: Language;
}

// Customer reviews: read them, hide unsuitable ones from the shop, or delete them
export const AdminReviews: React.FC<AdminReviewsProps> = ({ lang }) => {
  const so = lang === 'so';
  const t = (en: string, som: string) => (so ? som : en);
  const [reviews, setReviews] = useState<Review[]>(() => storeRepo.getReviews());
  const [filter, setFilter] = useState<'all' | 'low' | 'hidden'>('all');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  const change = async (r: Review, c: { hidden?: boolean; delete?: boolean }) => {
    if (c.delete && !window.confirm(t('Delete this review for good?', 'Ma tirtiraysaa qiimeyntan?'))) return;
    setBusy(r.id);
    const res = await storeRepo.moderateReview(r.id, c);
    setBusy(null);
    if (!res.success) return setError(res.error ?? 'Failed.');
    setError('');
    setReviews(storeRepo.getReviews());
  };

  const shown = reviews.filter((r) => !r.hidden);
  const avg = shown.length ? shown.reduce((s, r) => s + r.rating, 0) / shown.length : 0;
  const list = reviews.filter((r) => (filter === 'hidden' ? r.hidden : filter === 'low' ? r.rating <= 3 : true));
  const date = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-8 animate-fadeIn text-xs">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-line">
        <div>
          <h1 className="font-serif text-3xl text-fg">{t('Reviews', 'Qiimeynta')}</h1>
          <p className="text-fg-3 mt-1">{t('Only customers with a delivered order can rate.', 'Macmiil dalabkiisa la gaarsiiyay ayaa qiimeyn kara.')}</p>
        </div>
        <div className="flex items-center gap-3 text-sm text-fg-2">
          <Stars value={avg} size="w-4 h-4" />
          <span className="font-mono">{avg.toFixed(1)}</span>
          <span className="text-fg-3">· {shown.length} {t('shown', 'muuqda')}</span>
        </div>
      </div>

      <div className="flex gap-2">
        {(
          [
            ['all', t('All', 'Dhammaan')],
            ['low', t('3 stars or less', '3 xiddig iyo ka yar')],
            ['hidden', t('Hidden', 'La qariyay')],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={`px-3 py-1.5 border cursor-pointer ${filter === id ? 'border-fg text-fg' : 'border-line-strong text-fg-3 hover:text-fg'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {list.length === 0 ? (
        <p className="text-sm text-fg-3 py-10 text-center border border-line bg-surface">{t('No reviews here yet.', 'Halkan weli qiimeyn ma jirto.')}</p>
      ) : (
        <ul className="bg-surface border border-line divide-y divide-line">
          {list.map((r) => (
            <li key={r.id} className={`p-5 flex flex-col sm:flex-row gap-4 ${r.hidden ? 'opacity-50' : ''}`}>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Stars value={r.rating} />
                  <span className="text-sm text-fg">{r.productName}</span>
                  {r.hidden && <span className="text-[10px] uppercase tracking-[0.12em] text-fg-3">{t('Hidden', 'La qariyay')}</span>}
                </div>
                {r.text ? <p className="text-sm text-fg-2 mt-2 whitespace-pre-line">{r.text}</p> : <p className="text-fg-4 mt-2">{t('No comment', 'Faallo la’aan')}</p>}
                <p className="text-fg-3 mt-2">
                  {r.name} · <span className="font-mono">{r.orderId}</span> · {date(r.createdAt)}
                </p>
              </div>
              <div className="flex sm:flex-col gap-2 shrink-0">
                <button
                  onClick={() => change(r, { hidden: !r.hidden })}
                  disabled={busy === r.id}
                  className="px-3 py-1.5 border border-line-strong text-fg-2 hover:text-fg flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  {r.hidden ? <Eye className="w-3.5 h-3.5" strokeWidth={1.5} /> : <EyeOff className="w-3.5 h-3.5" strokeWidth={1.5} />}
                  {r.hidden ? t('Show', 'Muuji') : t('Hide', 'Qari')}
                </button>
                <button
                  onClick={() => change(r, { delete: true })}
                  disabled={busy === r.id}
                  className="px-3 py-1.5 border border-line-strong text-red-600 hover:border-red-600 flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                  {t('Delete', 'Tirtir')}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
