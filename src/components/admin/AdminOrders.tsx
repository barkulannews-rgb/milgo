import React, { useState } from 'react';
import {
  ShoppingCart,
  Search,
  Filter,
  Eye,
  Printer,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  AlertCircle,
  DollarSign,
  User,
  X,
} from 'lucide-react';
import { Order, OrderStatus, PaymentStatus, Language, StoreSettings } from '../../types';
import { storeRepo } from '../../lib/storage';
import { getTranslation } from '../../lib/translations';
import { PrintableInvoice } from './PrintableInvoice';

import { formatMoney } from '../../lib/money';
interface AdminOrdersProps {
  lang: Language;
  settings: StoreSettings;
}

const ALL_STATUSES: OrderStatus[] = [
  'Pending',
  'Confirmed',
  'Processing',
  'Ready for Dispatch',
  'Shipped',
  'Delivered',
  'Cancelled',
  'Returned',
];

export const AdminOrders: React.FC<AdminOrdersProps> = ({ lang, settings }) => {
  const me = storeRepo.getCurrentStaff();
  const isCourier = me.role === 'delivery';
  const couriers = storeRepo.getStaff().filter((s) => s.role === 'delivery' && s.active);
  const [orders, setOrders] = useState<Order[]>(storeRepo.getOrdersForCurrentStaff());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [statusNote, setStatusNote] = useState('');

  const refreshOrders = () => {
    setOrders(storeRepo.getOrdersForCurrentStaff());
    if (selectedOrder) {
      setSelectedOrder(storeRepo.getOrderById(selectedOrder.id) || null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.customerPhone.includes(search) ||
      o.city.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'All' || o.orderStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    if (newStatus === 'Cancelled' && !window.confirm('Cancelling this order will release and restore its reserved stock to inventory. Proceed?')) {
      return;
    }
    const err = await storeRepo.updateOrderStatus(orderId, newStatus, statusNote.trim() || undefined);
    if (err) alert(err);
    setStatusNote('');
    refreshOrders();
  };

  const handleUpdatePayment = async (orderId: string, newStatus: PaymentStatus) => {
    const ref = prompt('Enter payment transaction reference (optional):', selectedOrder?.paymentReference || '');
    const err = await storeRepo.updateOrderPayment(orderId, newStatus, ref || undefined);
    if (err) alert(err);
    refreshOrders();
  };

  // Value is a staff id, or "external" to type the name of an outside courier
  const handleAssignCourier = async (orderId: string, value: string) => {
    if (value === 'external') {
      const name = prompt(lang === 'so' ? 'Magaca shirkadda gaarsiinta:' : 'External courier name:', '');
      if (name?.trim()) {
        const err = await storeRepo.assignOrderCourier(orderId, name.trim());
        if (err) alert(err);
      }
    } else {
      const staff = couriers.find((c) => c.id === value);
      if (staff) {
        const err = await storeRepo.assignOrderCourier(orderId, staff.name, staff.id);
        if (err) alert(err);
      }
    }
    refreshOrders();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Title & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line">
        <div>
          <h1 className="font-serif text-3xl text-fg">
            {getTranslation(lang, 'adminOrders')}
          </h1>
          
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="w-full sm:w-72 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-fg-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order ID, customer, phone..."
            className="w-full bg-surface border border-line-strong focus:border-gold pl-9 pr-3 py-2 text-xs text-fg outline-none"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto p-1 bg-surface border border-line">
          <button
            onClick={() => setStatusFilter('All')}
            className={`px-3 py-1.5 text-xs transition-colors cursor-pointer ${
              statusFilter === 'All' ? 'bg-[#9b783e] text-white font-semibold' : 'text-fg-3 hover:text-fg'
            }`}
          >
            All ({orders.length})
          </button>
          {ALL_STATUSES.map((st) => {
            const count = orders.filter((o) => o.orderStatus === st).length;
            if (count === 0 && st !== 'Pending' && st !== 'Delivered') return null;
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 text-xs transition-colors cursor-pointer whitespace-nowrap ${
                  statusFilter === st ? 'bg-[#9b783e] text-white font-semibold' : 'text-fg-3 hover:text-fg'
                }`}
              >
                {st} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-surface border border-line overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-2 border-b border-line text-fg-2 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">Order ID</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Delivery Area</th>
                <th className="py-3.5 px-4">Items</th>
                <th className="py-3.5 px-4">Total</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4">Order Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-fg-2">
              {filteredOrders.map((o) => (
                <tr key={o.id} className="hover:bg-surface-2 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-semibold text-gold-deep">{o.id}</td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-fg">{o.customerName}</div>
                    <div className="font-mono text-[11px] text-fg-3">{o.customerPhone}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="text-fg font-medium">{o.city}</div>
                    <div className="text-[11px] text-fg-3">{o.deliveryArea}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-fg">{o.items.reduce((s, i) => s + i.quantity, 0)} bottles</span>
                    <span className="text-[11px] text-fg-3 block">
                      {o.items[0]?.productName} {o.items.length > 1 && `+${o.items.length - 1} more`}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold tabular-nums text-gold-deep text-sm">
                    {formatMoney(o.grandTotal)}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="text-[11px] font-medium text-fg-2">{o.paymentMethod}</div>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 font-semibold ${
                        o.paymentStatus === 'Paid'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}
                    >
                      {o.paymentStatus}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-semibold ${
                        o.orderStatus === 'Delivered'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : o.orderStatus === 'Pending'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : o.orderStatus === 'Cancelled'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {o.orderStatus}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedOrder(o)}
                        className="px-2.5 py-1 bg-surface hover:bg-surface-3 border border-line-strong text-fg-2 text-[11px] font-medium cursor-pointer"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => setInvoiceOrder(o)}
                        className="p-1.5 text-fg-3 hover:text-gold hover:bg-surface-3 cursor-pointer"
                        title="Print invoice"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-surface border border-line rounded-2xl overflow-hidden shadow-2xl text-fg">
            <div className="p-6 border-b border-line flex items-center justify-between">
              <div>
                <span className="font-mono text-xs text-gold-deep uppercase font-semibold">
                  Order Management
                </span>
                <h2 className="font-serif text-2xl font-semibold text-fg">
                  {selectedOrder.id}
                </h2>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 text-fg-3 hover:text-fg rounded-full hover:bg-surface-3"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto text-xs">
              {/* Customer & Address Strip */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-surface-2 border border-line">
                <div>
                  <span className="text-fg-3 uppercase block mb-1 font-semibold text-[10px]">Customer Details</span>
                  <div className="font-semibold text-sm text-fg">{selectedOrder.customerName}</div>
                  <div className="font-mono text-gold-deep font-semibold">{selectedOrder.customerPhone}</div>
                  {selectedOrder.customerEmail && <div className="text-fg-3">{selectedOrder.customerEmail}</div>}
                </div>
                <div>
                  <span className="text-fg-3 uppercase block mb-1 font-semibold text-[10px]">Destination</span>
                  <div className="font-medium text-fg">
                    {selectedOrder.city}
                    {selectedOrder.country ? `, ${selectedOrder.country}` : ''} — {selectedOrder.deliveryArea}
                  </div>
                  <div className="text-fg-3">
                    {selectedOrder.deliveryAddress}
                    {selectedOrder.postalCode && <span className="font-mono"> · {selectedOrder.postalCode}</span>}
                  </div>
                  {selectedOrder.deliveryInstructions && (
                    <div className="text-gold-deep italic mt-1 font-medium">"{selectedOrder.deliveryInstructions}"</div>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div>
                <span className="text-xs uppercase tracking-wider text-gold-deep font-semibold block mb-2">
                  Order Items ({selectedOrder.items.length})
                </span>
                <div className="space-y-2">
                  {selectedOrder.items.map((it, idx) => (
                    <div key={idx} className="p-3 bg-surface-2 border border-line flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={it.image} alt={it.productName} className="w-10 h-10 object-cover bg-surface border border-line" />
                        <div>
                          <div className="font-semibold text-fg">{it.productName}</div>
                          <div className="text-[11px] text-fg-3">Size: {it.size} · Unit: {formatMoney(it.unitPrice)}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-fg">{formatMoney(it.subtotal)}</div>
                        <div className="text-[10px] text-fg-3">Qty: {it.quantity}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-line mt-3 space-y-1 text-right">
                  <div className="text-fg-3">Subtotal: <span className="font-mono text-fg">{formatMoney(selectedOrder.subtotal)}</span></div>
                  {selectedOrder.discountAmount > 0 && (
                    <div className="text-emerald-700">Discount: <span className="font-mono">-{formatMoney(selectedOrder.discountAmount)}</span></div>
                  )}
                  <div className="text-fg-3">Delivery Fee: <span className="font-mono text-fg">{formatMoney(selectedOrder.deliveryFee)}</span></div>
                  <div className="font-bold text-sm text-fg pt-1">
                    Grand Total: <span className="font-mono text-base text-gold-deep font-bold">{formatMoney(selectedOrder.grandTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Status Transition Controls */}
              <div className="p-4 bg-surface-2 border border-line space-y-3">
                <span className="text-xs uppercase tracking-wider text-gold-deep font-semibold block">
                  Workflow State Transitions
                </span>

                <div className="flex flex-wrap items-center gap-2">
                  {(isCourier ? (['Shipped', 'Delivered'] as OrderStatus[]) : ALL_STATUSES).map((st) => (
                    <button
                      key={st}
                      onClick={() => handleUpdateStatus(selectedOrder.id, st)}
                      disabled={selectedOrder.orderStatus === st}
                      className={`px-3 py-1.5 text-xs transition-colors cursor-pointer disabled:opacity-40 ${
                        selectedOrder.orderStatus === st
                          ? 'bg-[#9b783e] text-white font-semibold'
                          : 'bg-surface border border-line-strong text-fg-2 hover:bg-surface-3'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-[11px] text-fg-3 mb-1 font-medium">Optional note for status update:</label>
                  <input
                    type="text"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder="e.g. Courier dispatched with tracking receipt"
                    className="w-full bg-surface border border-line-strong p-2 text-xs text-fg outline-none"
                  />
                </div>
              </div>

              {/* Payment & Courier Assignment Actions */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 bg-surface-2 border border-line space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-fg-3 font-medium">Payment Status:</span>
                    <span className="font-semibold text-gold-deep">{selectedOrder.paymentStatus}</span>
                  </div>
                  <div className="text-fg-2">
                    {selectedOrder.paymentMethod}
                    {selectedOrder.paymentGatewayDetails?.cardBrand && (
                      <span className="font-mono">
                        {' '}· {selectedOrder.paymentGatewayDetails.cardBrand} •••• {selectedOrder.paymentGatewayDetails.cardLast4}
                      </span>
                    )}
                  </div>
                  {selectedOrder.paymentReference && (
                    <div className="text-[11px] text-fg-3 font-mono break-all">
                      Ref: {selectedOrder.paymentReference}
                      {selectedOrder.paymentGatewayDetails?.transactionId.startsWith('test_') && (
                        <span className="ml-1.5 px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 font-sans font-semibold">TEST</span>
                      )}
                    </div>
                  )}
                  {(!isCourier || selectedOrder.paymentMethod === 'Cash on Delivery') && (
                  <button
                    onClick={() => handleUpdatePayment(selectedOrder.id, selectedOrder.paymentStatus === 'Paid' ? 'Unpaid' : 'Paid')}
                    className="w-full py-2 bg-surface hover:bg-surface-3 text-fg-2 border border-line-strong text-xs font-medium cursor-pointer"
                  >
                    {isCourier ? (lang === 'so' ? 'Lacagta waan qaatay' : 'Cash collected') : 'Toggle Paid / Unpaid'}
                  </button>
                  )}
                </div>

                <div className="p-3.5 bg-surface-2 border border-line space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-fg-3 font-medium">Assigned Courier:</span>
                    <span className="font-semibold text-emerald-700 truncate max-w-[120px]">
                      {selectedOrder.assignedDeliveryPerson || 'None'}
                    </span>
                  </div>
                  {!isCourier && (
                    <select
                      value={selectedOrder.assignedStaffId ?? ''}
                      onChange={(e) => handleAssignCourier(selectedOrder.id, e.target.value)}
                      className="w-full py-2 px-2 bg-surface text-fg border border-line-strong text-xs cursor-pointer outline-none"
                      aria-label="Assign courier"
                    >
                      <option value="" disabled>
                        {lang === 'so' ? 'Dooro gaarsiiye…' : 'Choose courier…'}
                      </option>
                      {couriers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                      <option value="external">{lang === 'so' ? 'Shirkad kale…' : 'External courier…'}</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Invoice Printing Button */}
              <div className="flex justify-between pt-2">
                <button
                  onClick={() => setInvoiceOrder(selectedOrder)}
                  className="px-4 py-2 bg-surface hover:bg-surface-3 text-fg-2 border border-line-strong flex items-center gap-2 cursor-pointer text-xs font-medium"
                >
                  <Printer className="w-4 h-4 text-gold" />
                  <span>Print Boutique Invoice</span>
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-6 py-2 bg-inverse hover:bg-inverse-hover text-on-inverse font-semibold cursor-pointer text-xs shadow-md"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Invoice Modal Component */}
      {invoiceOrder && (
        <PrintableInvoice
          order={invoiceOrder}
          settings={settings}
          onClose={() => setInvoiceOrder(null)}
        />
      )}
    </div>
  );
};
