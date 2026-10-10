import React, { useEffect, useState } from 'react';
import { Language } from '../../types';
import type { PublicReview } from '../../lib/api';
import { storeRepo } from '../../lib/storage';
import { Stars } from './Stars';

interface ProductReviewsProps {
  productId: string;
  lang: Language;
  onOpenTracker: () => void;
}

// Reviews under a perfume. Every review comes from a delivered order, so all are verified buyers.
export const ProductReviews: React.FC<ProductReviewsProps> = ({ productId, lang, onOpenTracker }) => {
  const so = lang === 'so';
  const [reviews, setReviews] = useState<PublicReview[] | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let live = true;
    setReviews(null);
    storeRepo.getProductReviews(productId).then((r) => live && setReviews(r));
    return () => {
      live = false;
    };
  }, [productId]);

  const count = reviews?.length ?? 0;
  const avg = count ? reviews!.reduce((s, r) => s + r.rating, 0) / count : 0;
  const visible = showAll ? reviews ?? [] : (reviews ?? []).slice(0, 3);
  const date = (iso: string) => new Date(iso).toLocaleDateString(so ? 'so-SO' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <section id="reviews" className="border-t border-line px-6 sm:px-8 py-8 bg-surface">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h3 className="font-serif text-2xl text-fg">{so ? 'Qiimeynta macaamiisha' : 'Customer reviews'}</h3>
          {count > 0 && (
            <div className="flex items-center gap-2 mt-2 text-sm text-fg-2">
              <Stars value={avg} size="w-4 h-4" />
              <span className="font-mono">{avg.toFixed(1)}</span>
              <span className="text-fg-3">· {count} {so ? 'qiimeyn' : count === 1 ? 'review' : 'reviews'}</span>
            </div>
          )}
        </div>
        <button onClick={onOpenTracker} className="text-xs text-fg-3 hover:text-fg underline underline-offset-4 cursor-pointer">
          {so ? 'Ma iibsatay? Ka qiimee dalabkaaga' : 'Bought it? Rate it from your order'}
        </button>
      </div>

      {reviews === null ? (
        <p className="text-sm text-fg-3">…</p>
      ) : count === 0 ? (
        <p className="text-sm text-fg-3">{so ? 'Weli qiimeyn lama bixin.' : 'No reviews yet.'}</p>
      ) : (
        <ul className="divide-y divide-line">
          {visible.map((r) => (
            <li key={r.id} className="py-4 first:pt-0">
              <div className="flex items-center justify-between gap-3">
                <Stars value={r.rating} />
                <span className="text-[11px] text-fg-4">{date(r.createdAt)}</span>
              </div>
              {r.text && <p className="text-sm text-fg-2 leading-relaxed mt-2 whitespace-pre-line">{r.text}</p>}
              <p className="text-xs text-fg-3 mt-2">
                {r.name} · <span className="text-gold-deep">{so ? 'Iibsade la xaqiijiyay' : 'Verified buyer'}</span>
              </p>
            </li>
          ))}
        </ul>
      )}

      {count > 3 && (
        <button onClick={() => setShowAll(!showAll)} className="mt-4 text-xs uppercase tracking-[0.14em] text-fg-2 hover:text-fg cursor-pointer">
          {showAll ? (so ? 'Yaree' : 'Show less') : so ? `Dhammaan ${count}` : `Show all ${count}`}
        </button>
      )}
    </section>
  );
};
