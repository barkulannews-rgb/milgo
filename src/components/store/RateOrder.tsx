import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { Language } from '../../types';
import type { TrackedOrder } from '../../lib/api';
import { storeRepo } from '../../lib/storage';
import { StarInput, Stars } from './Stars';

interface RateOrderProps {
  order: TrackedOrder;
  phone: string; // phone typed in the tracker, if any
  lang: Language;
}

// Shown in the order tracker once an order is delivered: the buyer rates each perfume in it.
export const RateOrder: React.FC<RateOrderProps> = ({ order, phone: knownPhone, lang }) => {
  const so = lang === 'so';
  const items = order.items.filter((i, idx) => i.productId && order.items.findIndex((x) => x.productId === i.productId) === idx);
  const [given, setGiven] = useState<Record<string, number>>(order.ratings ?? {});
  const [editing, setEditing] = useState<string | null>(() => items.find((i) => !(order.ratings ?? {})[i.productId])?.productId ?? null);
  const [stars, setStars] = useState(0);
  const [text, setText] = useState('');
  const [phone, setPhone] = useState(knownPhone);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  if (!items.length) return null;

  const open = (productId: string) => {
    setEditing(productId);
    setStars(given[productId] ?? 0);
    setText('');
    setError('');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (!stars) return setError(so ? 'Dooro xiddigaha.' : 'Choose the stars.');
    setSending(true);
    const res = await storeRepo.submitReview({ orderId: order.id, phone, productId: editing, rating: stars, text });
    setSending(false);
    if (!res.success) return setError(res.error ?? 'Could not send.');
    const next = { ...given, [editing]: stars };
    setGiven(next);
    const nextItem = items.find((i) => !next[i.productId]);
    setEditing(nextItem?.productId ?? null);
    setStars(0);
    setText('');
    setError('');
  };

  return (
    <div className="pt-4 border-t border-line space-y-4">
      <div>
        <h3 className="font-serif text-xl text-fg">{so ? 'Qiimee cadarkaaga' : 'Rate your perfume'}</h3>
        <p className="text-xs text-fg-3 mt-1">{so ? 'Fikradaadu waxay caawinaysaa macaamiisha kale.' : 'Your review helps other customers choose.'}</p>
      </div>

      {items.map((i) => {
        const done = given[i.productId];
        const isOpen = editing === i.productId;
        return (
          <div key={i.productId} className="border border-line p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-fg">{i.productName}</span>
              {done && !isOpen ? (
                <button onClick={() => open(i.productId)} className="flex items-center gap-2 text-xs text-fg-3 hover:text-fg cursor-pointer" title={so ? 'Beddel' : 'Edit'}>
                  <Stars value={done} />
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                </button>
              ) : (
                !isOpen && (
                  <button onClick={() => open(i.productId)} className="text-xs uppercase tracking-[0.14em] text-fg-2 hover:text-fg cursor-pointer">
                    {so ? 'Qiimee' : 'Rate'}
                  </button>
                )
              )}
            </div>

            {isOpen && (
              <form onSubmit={submit} className="mt-3 space-y-3">
                <StarInput value={stars} onChange={setStars} label={i.productName} />
                <textarea
                  rows={3}
                  maxLength={1000}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={so ? 'Maxaad ka jeclaatay? (ikhtiyaari)' : 'What did you think? (optional)'}
                  className="w-full bg-surface-2 border border-line-strong focus:border-gold p-2.5 text-xs text-fg outline-none"
                />
                {!knownPhone && (
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={so ? 'Taleefanka aad dalabka ku samaysay' : 'Phone used for this order'}
                    className="w-full bg-surface-2 border border-line-strong focus:border-gold p-2.5 text-xs text-fg font-mono outline-none"
                  />
                )}
                {error && <p className="text-xs text-red-600">{error}</p>}
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={sending}
                    className="px-5 py-2.5 bg-inverse hover:bg-inverse-hover text-on-inverse text-xs uppercase tracking-[0.14em] cursor-pointer disabled:opacity-50"
                  >
                    {sending ? '…' : so ? 'Dir' : 'Send'}
                  </button>
                  <button type="button" onClick={() => setEditing(null)} className="text-xs text-fg-3 hover:text-fg cursor-pointer">
                    {so ? 'Jooji' : 'Cancel'}
                  </button>
                </div>
              </form>
            )}
          </div>
        );
      })}
      {items.every((i) => given[i.productId]) && (
        <p className="text-xs text-emerald-700">{so ? 'Mahadsanid qiimeyntaada!' : 'Thank you for your review!'}</p>
      )}
    </div>
  );
};
