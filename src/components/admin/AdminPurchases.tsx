import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  Truck,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
  Building2,
  X,
} from 'lucide-react';
import { Language, Supplier, PurchaseOrder, Product } from '../../types';
import { storeRepo } from '../../lib/storage';
import { getTranslation } from '../../lib/translations';

import { formatMoney } from '../../lib/money';
interface AdminPurchasesProps {
  lang: Language;
}

export const AdminPurchases: React.FC<AdminPurchasesProps> = ({ lang }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>(storeRepo.getSuppliers());
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(storeRepo.getPurchaseOrders());
  const [products] = useState<Product[]>(storeRepo.getProducts());
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);

  // New PO form state
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [selectedVariantId, setSelectedVariantId] = useState(products[0]?.variants[0]?.id || '');
  const [poQty, setPoQty] = useState(10);
  const [poUnitCost, setPoUnitCost] = useState(products[0]?.variants[0]?.costPrice || 40);
  const [poFreight, setPoFreight] = useState(50);
  const [poAmountPaid, setPoAmountPaid] = useState(0);

  // New Supplier form state
  const [supName, setSupName] = useState('');
  const [supContact, setSupContact] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supAddress, setSupAddress] = useState('');

  const refreshData = () => {
    setSuppliers(storeRepo.getSuppliers());
    setPurchaseOrders(storeRepo.getPurchaseOrders());
  };

  const handleReceiveGoods = (poId: string) => {
    if (window.confirm('Receive goods and update inventory balances?')) {
      const result = storeRepo.receivePurchaseOrder(poId);
      if (!result.success) {
        alert(result.error);
        return;
      }
      refreshData();
    }
  };

  const handleCreatePo = (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find((s) => s.id === selectedSupplierId);
    const prod = products.find((p) => p.id === selectedProductId);
    const variant = prod?.variants.find((v) => v.id === selectedVariantId);

    if (!sup || !prod || !variant) return;

    const subtotal = poQty * poUnitCost;
    const totalCost = subtotal + poFreight;
    const balance = Math.max(0, totalCost - poAmountPaid);

    const newPo: PurchaseOrder = {
      id: `PO-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`,
      supplierId: sup.id,
      supplierName: sup.name,
      items: [
        {
          productId: prod.id,
          variantId: variant.id,
          productName: prod.name,
          size: variant.size,
          quantityOrdered: poQty,
          quantityReceived: 0,
          unitCost: poUnitCost,
          subtotal,
        },
      ],
      freightCost: poFreight,
      discount: 0,
      totalCost,
      amountPaid: poAmountPaid,
      outstandingBalance: balance,
      status: 'Ordered',
      paymentMethod: 'Bank Transfer',
      orderDate: new Date().toISOString().slice(0, 10),
    };

    storeRepo.savePurchaseOrder(newPo);
    if (balance > 0) {
      sup.outstandingBalance += balance;
      storeRepo.saveSupplier(sup);
    }

    setIsPoModalOpen(false);
    refreshData();
  };

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim()) return;

    const newSup: Supplier = {
      id: `sup-${Date.now()}`,
      name: supName.trim(),
      contactPerson: supContact.trim(),
      phone: supPhone.trim(),
      email: supEmail.trim(),
      address: supAddress.trim(),
      outstandingBalance: 0,
    };

    storeRepo.saveSupplier(newSup);
    setIsSupplierModalOpen(false);
    setSupName('');
    refreshData();
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line">
        <div>
          <h1 className="font-serif text-3xl text-fg">
            {getTranslation(lang, 'adminPurchases')}
          </h1>
          
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSupplierModalOpen(true)}
            className="px-3.5 py-2 bg-surface hover:bg-surface-3 border border-line-strong text-xs font-medium text-fg-2 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Building2 className="w-3.5 h-3.5 text-gold" />
            <span>+ Add Supplier</span>
          </button>

          <button
            onClick={() => setIsPoModalOpen(true)}
            className="px-4 py-2 bg-inverse hover:bg-inverse-hover text-on-inverse text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-gold" />
            <span>+ New Purchase Order</span>
          </button>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-surface border border-line overflow-hidden">
        <div className="p-4 bg-surface-2 border-b border-line">
          <h3 className="font-serif text-xl text-fg">
            {lang === 'so' ? 'Alaab-qeybiyeyaasha' : 'Suppliers'}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-2 border-b border-line text-fg-2 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Supplier Name</th>
                <th className="py-3 px-4">Contact Person</th>
                <th className="py-3 px-4">Phone / WhatsApp</th>
                <th className="py-3 px-4">Location / Address</th>
                <th className="py-3 px-4">Payable Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-fg-2">
              {suppliers.map((s) => (
                <tr key={s.id} className="hover:bg-surface-2 transition-colors">
                  <td className="py-3 px-4 font-semibold text-fg">{s.name}</td>
                  <td className="py-3 px-4 text-fg-2">{s.contactPerson}</td>
                  <td className="py-3 px-4 font-mono text-fg-3">{s.phone}</td>
                  <td className="py-3 px-4 text-fg-3">{s.address}</td>
                  <td className="py-3 px-4 font-mono font-semibold tabular-nums">
                    <span className={s.outstandingBalance > 0 ? 'text-rose-600' : 'text-emerald-700'}>
                      {formatMoney(s.outstandingBalance)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Purchase Orders Table */}
      <div className="bg-surface border border-line overflow-hidden">
        <div className="p-4 bg-surface-2 border-b border-line">
          <h3 className="font-serif text-xl text-fg">
            Purchase Orders (POs) & Inbound Cargo
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-2 border-b border-line text-fg-2 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">PO Reference</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Order Date</th>
                <th className="py-3 px-4">Items / Qty</th>
                <th className="py-3 px-4">Total Cost</th>
                <th className="py-3 px-4">Paid / Balance</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-fg-2">
              {purchaseOrders.map((po) => (
                <tr key={po.id} className="hover:bg-surface-2 transition-colors">
                  <td className="py-3 px-4 font-mono font-semibold text-gold">{po.id}</td>
                  <td className="py-3 px-4 text-fg font-medium">{po.supplierName}</td>
                  <td className="py-3 px-4 font-mono text-fg-3">{po.orderDate}</td>
                  <td className="py-3 px-4">
                    {po.items.map((it, i) => (
                      <div key={i} className="text-fg-2">
                        {it.quantityOrdered}x {it.productName} ({it.size})
                      </div>
                    ))}
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold tabular-nums text-fg">
                    {formatMoney(po.totalCost)}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] tabular-nums">
                    <div>Paid: {formatMoney(po.amountPaid)}</div>
                    <div className="text-rose-600">Due: {formatMoney(po.outstandingBalance)}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-semibold ${
                        po.status === 'Received'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {po.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {po.status !== 'Received' ? (
                      <button
                        onClick={() => handleReceiveGoods(po.id)}
                        className="px-3 py-1.5 bg-[#9b783e] hover:bg-[#85632e] text-white text-[11px] font-semibold cursor-pointer"
                      >
                        Receive Goods
                      </button>
                    ) : (
                      <span className="text-[11px] text-emerald-700 font-medium flex items-center justify-end gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>In Stock</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Purchase Order Modal */}
      {isPoModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="relative w-full max-w-lg bg-surface border border-line rounded-2xl p-6 shadow-2xl text-fg">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-line">
              <h3 className="font-serif text-xl font-medium">Create Purchase Order (PO)</h3>
              <button onClick={() => setIsPoModalOpen(false)} className="text-fg-3 hover:text-fg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePo} className="space-y-4 text-xs">
              <div>
                <label className="block text-fg-2 mb-1 font-medium">Select Supplier *</label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full bg-surface-2 border border-line-strong focus:border-gold p-2.5 text-fg outline-none"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.address})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-fg-2 mb-1 font-medium">Select Fragrance *</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => {
                    setSelectedProductId(e.target.value);
                    const p = products.find((x) => x.id === e.target.value);
                    if (p && p.variants[0]) {
                      setSelectedVariantId(p.variants[0].id);
                      setPoUnitCost(p.variants[0].costPrice);
                    }
                  }}
                  className="w-full bg-surface-2 border border-line-strong focus:border-gold p-2.5 text-fg outline-none"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.brand})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-fg-2 mb-1 font-medium">Variant Size</label>
                  <select
                    value={selectedVariantId}
                    onChange={(e) => {
                      setSelectedVariantId(e.target.value);
                      const prod = products.find((p) => p.id === selectedProductId);
                      const v = prod?.variants.find((x) => x.id === e.target.value);
                      if (v) setPoUnitCost(v.costPrice);
                    }}
                    className="w-full bg-surface-2 border border-line-strong focus:border-gold p-2.5 text-fg outline-none"
                  >
                    {products.find((p) => p.id === selectedProductId)?.variants.map((v) => (
                      <option key={v.id} value={v.id}>{v.size} (Current: {v.stockQuantity})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-fg-2 mb-1 font-medium">Quantity Ordered</label>
                  <input
                    type="number"
                    min="1"
                    value={poQty}
                    onChange={(e) => setPoQty(parseInt(e.target.value) || 1)}
                    className="w-full bg-surface-2 border border-line-strong focus:border-gold p-2.5 text-fg font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-fg-2 mb-1 font-medium">Unit Purchase Cost (£)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={poUnitCost}
                    onChange={(e) => setPoUnitCost(parseFloat(e.target.value) || 0)}
                    className="w-full bg-surface-2 border border-line-strong focus:border-gold p-2.5 text-fg font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-fg-2 mb-1 font-medium">Freight / Customs (£)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={poFreight}
                    onChange={(e) => setPoFreight(parseFloat(e.target.value) || 0)}
                    className="w-full bg-surface-2 border border-line-strong focus:border-gold p-2.5 text-fg font-mono outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-fg-2 mb-1 font-medium">Amount Paid Immediately (£)</label>
                <input
                  type="number"
                  step="0.1"
                  value={poAmountPaid}
                  onChange={(e) => setPoAmountPaid(parseFloat(e.target.value) || 0)}
                  className="w-full bg-surface-2 border border-line-strong focus:border-gold p-2.5 text-fg font-mono outline-none"
                />
              </div>

              <div className="p-3 bg-surface-2 border border-line text-xs space-y-1">
                <div className="flex justify-between text-fg-3">
                  <span>Total Purchase Cost:</span>
                  <span className="font-mono text-fg font-semibold">{formatMoney((poQty * poUnitCost + poFreight))}</span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>Outstanding Due Balance:</span>
                  <span className="font-mono font-semibold">{formatMoney(Math.max(0, poQty * poUnitCost + poFreight - poAmountPaid))}</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsPoModalOpen(false)}
                  className="px-4 py-2 bg-surface-3 hover:bg-line text-fg-2 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-inverse hover:bg-inverse-hover text-on-inverse font-semibold cursor-pointer transition-colors"
                >
                  Create PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Supplier Modal */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="relative w-full max-w-md bg-surface border border-line rounded-2xl p-6 shadow-2xl text-fg">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-line">
              <h3 className="font-serif text-xl font-medium">Register New Supplier</h3>
              <button onClick={() => setIsSupplierModalOpen(false)} className="text-fg-3 hover:text-fg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="space-y-4 text-xs">
              <div>
                <label className="block text-fg-2 mb-1 font-medium">Company / Supplier Name *</label>
                <input
                  type="text"
                  required
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  placeholder="e.g. Arabian Oud Wholesale Ltd"
                  className="w-full bg-surface-2 border border-line-strong focus:border-gold p-2.5 text-fg outline-none"
                />
              </div>

              <div>
                <label className="block text-fg-2 mb-1 font-medium">Contact Person</label>
                <input
                  type="text"
                  value={supContact}
                  onChange={(e) => setSupContact(e.target.value)}
                  placeholder="e.g. Tariq Mansoor"
                  className="w-full bg-surface-2 border border-line-strong focus:border-gold p-2.5 text-fg outline-none"
                />
              </div>

              <div>
                <label className="block text-fg-2 mb-1 font-medium">Phone Number / WhatsApp</label>
                <input
                  type="text"
                  value={supPhone}
                  onChange={(e) => setSupPhone(e.target.value)}
                  placeholder="+971 50 123 4567"
                  className="w-full bg-surface-2 border border-line-strong focus:border-gold p-2.5 text-fg outline-none"
                />
              </div>

              <div>
                <label className="block text-fg-2 mb-1 font-medium">Address / Port City</label>
                <input
                  type="text"
                  value={supAddress}
                  onChange={(e) => setSupAddress(e.target.value)}
                  placeholder="e.g. Deira Perfume Souq, Dubai"
                  className="w-full bg-surface-2 border border-line-strong focus:border-gold p-2.5 text-fg outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="px-4 py-2 bg-surface-3 hover:bg-line text-fg-2 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-inverse hover:bg-inverse-hover text-on-inverse font-semibold cursor-pointer transition-colors"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
