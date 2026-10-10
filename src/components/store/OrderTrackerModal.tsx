import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Order, OrderStatus, Language, StoreSettings } from '../../types';
import { getTranslation } from '../../lib/translations';
import { storeRepo } from '../../lib/storage';

import { formatMoney } from '../../lib/money';
interface OrderTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  settings: StoreSettings;
  initialOrderId?: string;
}

const ORDER_STEPS: OrderStatus[] = [
  'Pending',
  'Confirmed',
  'Processing',
  'Ready for Dispatch',
  'Shipped',
  'Delivered',
];

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({
  isOpen,
  onClose,
  lang,
  settings,
  initialOrderId,
}) => {
  const [orderIdInput, setOrderIdInput] = useState(initialOrderId || '');
  const [phoneInput, setPhoneInput] = useState('');
  const [matchedOrder, setMatchedOrder] = useState<Order | null>(
    initialOrderId ? storeRepo.getOrderById(initialOrderId) || null : null
  );
  const [hasSearched, setHasSearched] = useState(Boolean(initialOrderId));

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
    const query = orderIdInput.trim();
    if (!query) return;

    const found = storeRepo.getOrders().find((o) => {
      const idMatch = o.id.toLowerCase() === query.toLowerCase();
      if (phoneInput.trim()) {
        const cleanPhoneInput = phoneInput.replace(/[^0-9]/g, '');
        const cleanOrderPhone = o.customerPhone.replace(/[^0-9]/g, '');
        return idMatch && (cleanOrderPhone.includes(cleanPhoneInput) || cleanPhoneInput.includes(cleanOrderPhone));
      }
      return idMatch;
    });

    setMatchedOrder(found || null);
  };

  const getStepIndex = (status: OrderStatus): number => {
    if (status === 'Cancelled' || status === 'Returned' || status === 'Refunded') return -1;
    return ORDER_STEPS.indexOf(status);
  };

  const currentStepIndex = matchedOrder ? getStepIndex(matchedOrder.orderStatus) : -1;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div
        className="relative w-full max-w-lg bg-surface overflow-hidden shadow-2xl text-fg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-line flex items-center justify-between">
          <h2 className="font-serif text-2xl">{getTranslation(lang, 'trackYourOrder')}</h2>
          <button
            onClick={onClose}
            className="p-2 text-fg-3 hover:text-fg transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Search Form */}
          <form onSubmit={handleSearch} className="space-y-3">
            <div>
              <label className="block text-[11px] uppercase tracking-[0.14em] text-fg-3 mb-1">
                {getTranslation(lang, 'orderNumber')}
              </label>
              <input
                type="text"
                required
                value={orderIdInput}
                onChange={(e) => setOrderIdInput(e.target.value)}
                placeholder="e.g. MLG-2026-1041"
                className="w-full bg-surface-2 border border-line-strong focus:border-gold rounded p-2.5 text-xs text-fg font-mono outline-none uppercase transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-[0.14em] text-fg-3 mb-1">
                {getTranslation(lang, 'enterPhoneNumber')} {lang === 'so' ? '(ikhtiyaari)' : '(optional)'}
              </label>
              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="+252 61 XXX XXXX"
                className="w-full bg-surface-2 border border-line-strong focus:border-gold rounded p-2.5 text-xs text-fg font-mono outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-inverse hover:bg-inverse-hover text-on-inverse text-xs uppercase tracking-[0.16em] transition-colors cursor-pointer"
            >
              {getTranslation(lang, 'checkStatus')}
            </button>
          </form>

          {/* Results Area */}
          {hasSearched && (
            <div>
              {matchedOrder ? (
                <div className="space-y-6 pt-4 border-t border-line">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-mono text-sm text-fg">{matchedOrder.id}</div>
                      <div className="text-xs text-fg-3 mt-0.5">{matchedOrder.city}</div>
                      {matchedOrder.assignedDeliveryPerson && (
                        <div className="text-xs text-fg-2 mt-1">
                          {lang === 'so' ? 'Gaarsiiye' : 'Courier'}: {matchedOrder.assignedDeliveryPerson}
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] uppercase tracking-[0.12em] text-gold-deep">{matchedOrder.orderStatus}</span>
                  </div>

                  {/* Visual Tracker Timeline */}
                  {matchedOrder.orderStatus !== 'Cancelled' ? (
                    <div>
                      <div className="space-y-4 relative pl-6 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-line">
                        {ORDER_STEPS.map((step, idx) => {
                          const isCompleted = currentStepIndex >= idx;
                          const isCurrent = currentStepIndex === idx;

                          return (
                            <div key={step} className="relative flex items-center justify-between text-xs">
                              <div
                                className={`absolute -left-6 w-[15px] h-[15px] rounded-full border ${
                                  isCompleted ? 'bg-gold border-gold' : 'bg-surface border-line-strong'
                                }`}
                              />
                              <span
                                className={`font-medium ${
                                  isCurrent
                                    ? 'text-gold font-semibold'
                                    : isCompleted
                                    ? 'text-fg'
                                    : 'text-fg-3'
                                }`}
                              >
                                {step}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-red-600">
                      <span>{lang === 'so' ? 'Dalabkan waa la joojiyay.' : 'This order was cancelled.'}</span>
                    </div>
                  )}

                  {/* Items list */}
                  <div className="pt-4 border-t border-line">
                    <div className="space-y-2">
                      {matchedOrder.items.map((i, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs text-fg-2 border-b border-line py-1">
                          <span>{i.quantity} × {i.productName} <span className="text-fg-3">{i.size}</span></span>
                          <span className="font-mono tabular-nums text-fg">{formatMoney(i.subtotal)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-sm text-fg-3 py-4">
                  {lang === 'so' ? 'Dalab lama helin. Hubi lambarka.' : 'No order found. Check the number and try again.'}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
