import React from 'react';
import { X } from 'lucide-react';
import { Order, Language, StoreSettings } from '../../types';
import { getTranslation } from '../../lib/translations';

import { formatMoney } from '../../lib/money';
interface OrderSuccessModalProps {
  order: Order | null;
  lang: Language;
  settings: StoreSettings;
  isOpen: boolean;
  onClose: () => void;
  onTrackOrder: (orderId: string) => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  order,
  lang,
  settings,
  isOpen,
  onClose,
  onTrackOrder,
}) => {
  if (!isOpen || !order) return null;

  const whatsappConfirmUrl = `https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
    `Hello ${settings.storeName}, I have placed Order #${order.id} for ${formatMoney(order.grandTotal)} to ${order.city} (${order.deliveryArea}). My phone is ${order.customerPhone}.`
  )}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div
        className="relative w-full max-w-md bg-surface overflow-hidden shadow-2xl text-fg"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 text-fg-3 hover:text-fg transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" strokeWidth={1.5} />
        </button>

        <div className="p-8 sm:p-10 space-y-6">
          <div className="text-center">
            <span className="text-[11px] uppercase tracking-[0.16em] text-fg-3">{getTranslation(lang, 'orderNumber')} {order.id}</span>
            <h2 className="font-serif text-3xl text-fg mt-2 mb-2">{getTranslation(lang, 'orderConfirmed')}</h2>
            <p className="text-sm text-fg-3">{getTranslation(lang, 'orderReceivedMessage')}</p>
          </div>

          <div className="border-y border-line divide-y divide-line text-sm">
            {order.items.map((i, idx) => (
              <div key={idx} className="flex items-center justify-between py-3 text-fg-2">
                <span className="truncate pr-4">
                  {i.quantity} × {i.productName} <span className="text-fg-3">{i.size}</span>
                </span>
                <span className="font-mono text-fg">{formatMoney(i.subtotal)}</span>
              </div>
            ))}
            <div className="flex justify-between py-3 text-fg">
              <span>
                {getTranslation(lang, 'total')} <span className="text-fg-3 text-xs">· {order.paymentMethod}</span>
              </span>
              <span className="font-mono">{formatMoney(order.grandTotal)}</span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                onClose();
                onTrackOrder(order.id);
              }}
              className="w-full py-3.5 bg-inverse hover:bg-inverse-hover text-on-inverse text-xs uppercase tracking-[0.16em] transition-colors cursor-pointer"
            >
              {getTranslation(lang, 'trackOrder')}
            </button>
            <div className="flex items-center justify-center gap-6 text-xs text-fg-3">
              <a href={whatsappConfirmUrl} target="_blank" rel="noopener noreferrer" className="hover:text-fg underline underline-offset-4 transition-colors">
                WhatsApp
              </a>
              <button onClick={() => window.print()} className="hover:text-fg underline underline-offset-4 transition-colors cursor-pointer">
                {getTranslation(lang, 'printInvoice')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
