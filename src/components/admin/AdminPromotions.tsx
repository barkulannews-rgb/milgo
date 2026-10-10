import React, { useState } from 'react';
import { Tag, Plus, Trash2, Calendar, Check, X } from 'lucide-react';
import { Coupon, Language } from '../../types';
import { storeRepo } from '../../lib/storage';
import { getTranslation } from '../../lib/translations';

import { formatMoney } from '../../lib/money';
interface AdminPromotionsProps {
  lang: Language;
}

export const AdminPromotions: React.FC<AdminPromotionsProps> = ({ lang }) => {
  const [coupons, setCoupons] = useState<Coupon[]>(storeRepo.getCoupons());
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Coupon form
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState(10);
  const [minOrderAmount, setMinOrderAmount] = useState(50);
  const [expiryDate, setExpiryDate] = useState('2026-12-31');

  const refreshCoupons = () => {
    setCoupons(storeRepo.getCoupons());
  };

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    const newCoupon: Coupon = {
      code: code.trim().toUpperCase(),
      discountType,
      discountValue,
      minOrderAmount,
      timesUsed: 0,
      expiryDate,
      active: true,
    };

    storeRepo.saveCoupon(newCoupon);
    setIsModalOpen(false);
    setCode('');
    refreshCoupons();
  };

  const handleDelete = (codeToDelete: string) => {
    if (window.confirm(`Delete coupon code ${codeToDelete}?`)) {
      storeRepo.deleteCoupon(codeToDelete);
      refreshCoupons();
    }
  };

  const handleToggle = (coupon: Coupon) => {
    storeRepo.saveCoupon({ ...coupon, active: !coupon.active });
    refreshCoupons();
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line">
        <div>
          <h1 className="font-serif text-3xl text-fg">
            {getTranslation(lang, 'adminPromotions')}
          </h1>
          
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-[#c8a97e] hover:bg-[#d8b98e] text-[#0c0d0f] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-gold" />
          <span>+ Create Coupon Code</span>
        </button>
      </div>

      {/* Coupons Table */}
      <div className="bg-surface border border-line overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-2 border-b border-line text-fg-2 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Coupon Code</th>
                <th className="py-3 px-4">Discount</th>
                <th className="py-3 px-4">Min. Spend</th>
                <th className="py-3 px-4">Times Redeemed</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4">Active</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-fg-2">
              {coupons.map((c) => (
                <tr key={c.code} className="hover:bg-surface-2 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-sm text-gold">{c.code}</td>
                  <td className="py-3.5 px-4 font-semibold text-fg">
                    {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `${formatMoney(c.discountValue)} FLAT OFF`}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-fg-3">{formatMoney(c.minOrderAmount)}</td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-fg">{c.timesUsed} times</td>
                  <td className="py-3.5 px-4 font-mono text-fg-3">{c.expiryDate}</td>
                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => handleToggle(c)}
                      className={`px-2 py-0.5 text-[10px] font-semibold cursor-pointer ${
                        c.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                      }`}
                    >
                      {c.active ? 'Enabled' : 'Disabled'}
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleDelete(c.code)}
                      className="p-1.5 text-fg-4 hover:text-rose-600 hover:bg-surface-3 cursor-pointer transition-colors"
                      title="Delete coupon"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="relative w-full max-w-md bg-surface border border-line rounded-2xl p-6 shadow-2xl text-fg">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-line">
              <h3 className="font-serif text-xl font-medium">Create Promotional Coupon</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-fg-3 hover:text-fg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs">
              <div>
                <label className="block text-fg-2 mb-1 font-medium">Coupon Code *</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SOMALIAVIP"
                  className="w-full bg-surface-2 border border-line-strong focus:border-gold p-2.5 text-fg font-mono uppercase outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-fg-2 mb-1 font-medium">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full bg-surface-2 border border-line-strong focus:border-gold p-2.5 text-fg outline-none"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed amount (£)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-fg-2 mb-1 font-medium">Discount Value</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                    className="w-full bg-surface-2 border border-line-strong focus:border-gold p-2.5 text-fg font-mono outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-fg-2 mb-1 font-medium">Minimum Order (£)</label>
                  <input
                    type="number"
                    min="0"
                    value={minOrderAmount}
                    onChange={(e) => setMinOrderAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-surface-2 border border-line-strong focus:border-gold p-2.5 text-fg font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-fg-2 mb-1 font-medium">Expiry Date</label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full bg-surface-2 border border-line-strong focus:border-gold p-2.5 text-fg font-mono outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-surface-3 hover:bg-line text-fg-2 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-inverse hover:bg-inverse-hover text-on-inverse font-semibold cursor-pointer transition-colors"
                >
                  Save Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
