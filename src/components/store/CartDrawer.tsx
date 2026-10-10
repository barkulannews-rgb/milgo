import React, { useState } from 'react';
import { X } from 'lucide-react';
import { CartItem, Language, StoreSettings } from '../../types';
import { getTranslation } from '../../lib/translations';

import { formatMoney } from '../../lib/money';
interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  lang: Language;
  settings: StoreSettings;
  onUpdateQuantity: (productId: string, variantId: string, quantity: number) => void;
  onRemoveItem: (productId: string, variantId: string) => void;
  onProceedToCheckout: () => void;
  appliedCoupon: string | null;
  couponDiscount: number;
  onApplyCoupon: (code: string) => void;
  onRemoveCoupon: () => void;
  couponMessage: string;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  lang,
  settings,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
  appliedCoupon,
  couponDiscount,
  onApplyCoupon,
  onRemoveCoupon,
  couponMessage,
}) => {
  const [couponInput, setCouponInput] = useState('');

  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const finalSubtotal = Math.max(0, subtotal - couponDiscount);

  const handleCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponInput.trim()) {
      onApplyCoupon(couponInput.trim());
      setCouponInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-surface text-fg flex flex-col shadow-2xl">
          {/* Header */}
          <div className="p-6 border-b border-line flex items-center justify-between">
            <h2 className="font-serif text-2xl">
              {getTranslation(lang, 'cart')} <span className="font-sans text-sm text-fg-3">({items.reduce((s, i) => s + i.quantity, 0)})</span>
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-fg-3 hover:text-fg rounded-full hover:bg-surface-3 transition-colors cursor-pointer"
              aria-label="Close Bag"
            >
              <X className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto px-6 divide-y divide-line">
            {items.length === 0 ? (
              <div className="text-center py-20">
                                <h3 className="font-serif text-xl font-medium text-fg mb-2">
                  {getTranslation(lang, 'emptyCart')}
                </h3>
                <p className="text-xs text-fg-3 max-w-xs mx-auto mb-6">
                  {getTranslation(lang, 'emptyCartSub')}
                </p>
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-inverse hover:bg-inverse-hover text-on-inverse text-xs uppercase tracking-[0.16em] transition-colors cursor-pointer"
                >
                  {getTranslation(lang, 'exploreCollection')}
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={`${item.productId}-${item.variantId}`}
                  className="py-5 flex items-start gap-4"
                >
                  <img
                    src={item.image}
                    alt={item.productName}
                    className="w-20 h-24 object-cover bg-surface-3 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-serif text-base text-fg truncate">{item.productName}</h4>
                    <div className="text-xs text-fg-3">{item.size}</div>
                    <div className="font-mono text-sm text-fg mt-1">{formatMoney(item.unitPrice)}</div>

                    {/* Quantity Selector */}
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center border border-line-strong">
                        <button
                          onClick={() => onUpdateQuantity(item.productId, item.variantId, item.quantity - 1)}
                          className="px-2 py-0.5 text-xs text-fg-2 hover:text-fg cursor-pointer"
                        >
                          -
                        </button>
                        <span className="px-2.5 py-0.5 text-xs font-mono">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.productId, item.variantId, item.quantity + 1)}
                          disabled={item.quantity >= item.availableStock}
                          className="px-2 py-0.5 text-xs text-fg-2 hover:text-fg disabled:opacity-30 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => onRemoveItem(item.productId, item.variantId)}
                    className="p-2 text-fg-3 hover:text-red-600 transition-colors cursor-pointer"
                    aria-label="Remove item"
                  >
                    <X className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout Area */}
          {items.length > 0 && (
            <div className="p-6 border-t border-line space-y-4">
              {/* Promo Code Input */}
              <form onSubmit={handleCouponSubmit} className="space-y-1.5">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                                        <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder={getTranslation(lang, 'couponPlaceholder')}
                      className="w-full bg-transparent border-b border-line-strong focus:border-fg px-0 py-2 text-xs text-fg placeholder-fg-4 outline-none uppercase tracking-wider"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3 py-2 text-xs uppercase tracking-[0.14em] text-fg hover:text-gold transition-colors cursor-pointer"
                  >
                    {getTranslation(lang, 'applyCoupon')}
                  </button>
                </div>
                {couponMessage && (
                  <p className="text-[11px] text-gold-deep font-medium">{couponMessage}</p>
                )}
                {appliedCoupon && (
                  <div className="flex items-center justify-between text-xs text-green-700">
                    <span>{appliedCoupon} (-{formatMoney(couponDiscount)})</span>
                    <button
                      type="button"
                      onClick={onRemoveCoupon}
                      className="text-[11px] text-fg-3 hover:text-fg underline underline-offset-4 cursor-pointer"
                    >
                      {lang === 'so' ? 'Ka saar' : 'Remove'}
                    </button>
                  </div>
                )}
              </form>

              {/* Totals Summary */}
              <div className="space-y-2 text-xs pt-2 border-t border-line">
                <div className="flex justify-between text-fg-2">
                  <span>{getTranslation(lang, 'subtotal')}</span>
                  <span className="font-mono text-fg">{formatMoney(subtotal)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>{getTranslation(lang, 'discount')}</span>
                    <span className="font-mono tabular-nums font-semibold">-{formatMoney(couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-fg-2">
                  <span>{getTranslation(lang, 'deliveryFee')}</span>
                  <span className="text-fg-3">
                    {lang === 'so' ? 'Marka aad bixinayso' : 'At checkout'}
                  </span>
                </div>
                <div className="flex justify-between text-sm uppercase tracking-[0.12em] text-fg pt-3 border-t border-line">
                  <span>{getTranslation(lang, 'total')}</span>
                  <span className="font-mono text-base text-fg tracking-normal">
                    {formatMoney(finalSubtotal)}
                  </span>
                </div>
              </div>

              {/* Checkout Action */}
              <button
                onClick={onProceedToCheckout}
                className="w-full py-4 bg-inverse hover:bg-inverse-hover text-on-inverse text-xs uppercase tracking-[0.16em] transition-colors cursor-pointer"
              >
                {getTranslation(lang, 'checkout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
