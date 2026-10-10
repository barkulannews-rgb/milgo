import React from 'react';
import { Order, StoreSettings } from '../../types';

import { formatMoney } from '../../lib/money';
interface PrintableInvoiceProps {
  order: Order | null;
  settings: StoreSettings;
  onClose: () => void;
}

export const PrintableInvoice: React.FC<PrintableInvoiceProps> = ({ order, settings, onClose }) => {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="keep-light bg-white text-black p-8 sm:p-12 max-w-2xl w-full rounded shadow-2xl relative font-sans">
        {/* Screen Action Bar (hidden in print) */}
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-200 no-print">
          <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
            Print Preview — Packing Slip & Invoice
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-black text-white text-xs font-semibold rounded hover:bg-gray-800 cursor-pointer"
            >
              Print Now
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-xs text-gray-700 rounded hover:bg-gray-50 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

        {/* Invoice Header */}
        <div className="flex justify-between items-start mb-8 pb-6 border-b border-gray-300">
          <div>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-gray-900">
              {settings.storeName}
            </h1>
            <p className="text-xs text-gray-600 mt-1">Haute Parfumerie & Luxury Fragrances</p>
            <p className="text-xs text-gray-600">{settings.address}</p>
            <p className="text-xs text-gray-600">Tel / WhatsApp: {settings.phone}</p>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-widest text-gray-500 font-semibold">INVOICE</div>
            <div className="text-xl font-mono font-bold text-gray-900">{order.id}</div>
            <div className="text-xs text-gray-600 mt-1">
              Date: {new Date(order.createdAt).toLocaleDateString()}
            </div>
            <div className="text-xs font-semibold mt-1">
              Status: <span className="uppercase">{order.orderStatus}</span>
            </div>
          </div>
        </div>

        {/* Customer & Delivery Details */}
        <div className="grid grid-cols-2 gap-6 mb-8 text-xs">
          <div>
            <span className="uppercase text-gray-500 font-semibold block mb-1">Billed & Delivered To:</span>
            <div className="font-bold text-gray-900 text-sm">{order.customerName}</div>
            <div className="text-gray-700 font-mono">{order.customerPhone}</div>
            {order.customerEmail && <div className="text-gray-600">{order.customerEmail}</div>}
            <div className="text-gray-700 mt-1">
              {order.city} — {order.deliveryArea}
            </div>
            <div className="text-gray-600">{order.deliveryAddress}</div>
          </div>
          <div>
            <span className="uppercase text-gray-500 font-semibold block mb-1">Payment & Dispatch:</span>
            <div>Payment Method: <strong>{order.paymentMethod}</strong></div>
            <div>Payment Status: <strong>{order.paymentStatus}</strong></div>
            {order.paymentReference && <div>Reference: <span className="font-mono">{order.paymentReference}</span></div>}
            {order.assignedDeliveryPerson && <div>Courier: <strong>{order.assignedDeliveryPerson}</strong></div>}
            {order.deliveryInstructions && (
              <div className="mt-2 text-gray-600 italic">"{order.deliveryInstructions}"</div>
            )}
          </div>
        </div>

        {/* Itemized Table */}
        <table className="w-full text-left text-xs mb-8">
          <thead className="border-b-2 border-gray-900 text-gray-900 font-semibold">
            <tr>
              <th className="py-2">Item Description</th>
              <th className="py-2">Size</th>
              <th className="py-2 text-right">Unit Price</th>
              <th className="py-2 text-center">Qty</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-gray-800">
            {order.items.map((item, idx) => (
              <tr key={idx}>
                <td className="py-3">
                  <div className="font-semibold text-gray-900">{item.productName}</div>
                  <div className="text-[11px] text-gray-500">{item.brand}</div>
                </td>
                <td className="py-3 font-semibold">{item.size}</td>
                <td className="py-3 text-right font-mono">{formatMoney(item.unitPrice)}</td>
                <td className="py-3 text-center font-mono">{item.quantity}</td>
                <td className="py-3 text-right font-mono font-semibold">{formatMoney(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals Summary */}
        <div className="flex justify-end mb-8">
          <div className="w-64 space-y-2 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal:</span>
              <span className="font-mono">{formatMoney(order.subtotal)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount ({order.couponCode || 'Promo'}):</span>
                <span className="font-mono">-{formatMoney(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>Delivery Fee:</span>
              <span className="font-mono">
                {order.deliveryFee === 0 ? 'FREE' : `${formatMoney(order.deliveryFee)}`}
              </span>
            </div>
            <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t-2 border-gray-900">
              <span>Grand Total:</span>
              <span className="font-mono">{formatMoney(order.grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Footer Authenticity Guarantee */}
        <div className="pt-6 border-t border-gray-300 text-center text-[11px] text-gray-500 space-y-1">
          <p className="font-semibold text-gray-800">
            Thank you for shopping with {settings.storeName}.
          </p>
          <p>
            100% authentic. Questions: {settings.email}
          </p>
        </div>
      </div>
    </div>
  );
};
