import React, { useState } from 'react';
import {
  Boxes,
  AlertTriangle,
  RotateCcw,
  SlidersHorizontal,
  History,
  TrendingDown,
  TrendingUp,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { Language, Product, ProductVariant } from '../../types';
import { storeRepo } from '../../lib/storage';
import { getTranslation } from '../../lib/translations';

import { formatMoney } from '../../lib/money';
interface AdminInventoryProps {
  lang: Language;
}

// Cost figures are only shown to roles with the "profit" permission
export const AdminInventory: React.FC<AdminInventoryProps> = ({ lang }) => {
  const seeProfit = storeRepo.can('profit');
  const [products, setProducts] = useState<Product[]>(storeRepo.getProducts());
  const [movements, setMovements] = useState(storeRepo.getStockMovements());
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [newStockQty, setNewStockQty] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [adjustError, setAdjustError] = useState<string>('');
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);

  const refreshData = () => {
    setProducts(storeRepo.getProducts());
    setMovements(storeRepo.getStockMovements());
  };

  const fin = storeRepo.getFinancialSummary();

  const handleOpenAdjust = (prod: Product, variant: ProductVariant) => {
    setSelectedProduct(prod);
    setSelectedVariant(variant);
    setNewStockQty(variant.stockQuantity);
    setAdjustReason('');
    setAdjustError('');
    setIsAdjustModalOpen(true);
  };

  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !selectedVariant) return;

    const result = storeRepo.manualStockAdjustment(
      selectedProduct.id,
      selectedVariant.id,
      newStockQty,
      adjustReason.trim()
    );

    if (!result.success) {
      setAdjustError(result.error || 'Failed to adjust stock.');
      return;
    }

    setIsAdjustModalOpen(false);
    refreshData();
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line">
        <div>
          <h1 className="font-serif text-3xl text-fg">
            {getTranslation(lang, 'adminInventory')}
          </h1>
          
        </div>
      </div>

      {/* Valuation & Alert KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 bg-surface border border-line">
          <span className="text-xs uppercase tracking-wider text-fg-3 font-semibold block mb-1">
            Total Stock On Hand
          </span>
          <div className="font-mono text-2xl font-bold text-fg tabular-nums">
            {fin.totalStockUnits} units
          </div>
        </div>

        {seeProfit && (
        <div className="p-5 bg-surface border border-line">
          <span className="text-xs uppercase tracking-wider text-fg-3 font-semibold block mb-1">
            Inventory Value (Cost)
          </span>
          <div className="font-mono text-2xl font-bold text-blue-600 tabular-nums">
            {formatMoney(fin.inventoryCostValuation)}
          </div>
        </div>
        )}

        <div className="p-5 bg-surface border border-line">
          <span className="text-xs uppercase tracking-wider text-fg-3 font-semibold block mb-1">
            Inventory Value (Retail)
          </span>
          <div className="font-mono text-2xl font-bold text-gold-deep tabular-nums">
            {formatMoney(fin.inventoryRetailValuation)}
          </div>
        </div>

        <div className="p-5 bg-surface border border-line">
          <span className="text-xs uppercase tracking-wider text-fg-3 font-semibold block mb-1">
            Stock Alerts
          </span>
          <div className="font-mono text-2xl font-bold text-amber-600 tabular-nums">
            {fin.lowStockCount} Low / {fin.outOfStockCount} Out
          </div>
        </div>
      </div>

      {/* Real-time Balances Table */}
      <div className="bg-surface border border-line overflow-hidden">
        <div className="p-4 bg-surface border-b border-line flex items-center justify-between gap-4">
          <h3 className="font-serif text-xl text-fg">
            Current Stock Balances by Size Variant
          </h3>
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-fg-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter perfumes..."
              className="w-full bg-surface border border-line-strong pl-9 pr-3 py-1.5 text-xs text-fg outline-none focus:border-gold"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-2 border-b border-line text-fg-2 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">Fragrance</th>
                <th className="py-3.5 px-4">Variant Size</th>
                <th className="py-3.5 px-4">SKU</th>
                {seeProfit && <th className="py-3.5 px-4">Cost Basis</th>}
                <th className="py-3.5 px-4">Retail Price</th>
                <th className="py-3.5 px-4">Current Stock</th>
                {seeProfit && <th className="py-3.5 px-4">Valuation (Cost)</th>}
                <th className="py-3.5 px-4">Alert Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-fg-2">
              {products
                .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase()))
                .flatMap((prod) =>
                  prod.variants.map((v) => {
                    const isOut = v.stockQuantity === 0;
                    const isLow = !isOut && v.stockQuantity <= v.lowStockThreshold;

                    return (
                      <tr key={v.id} className="hover:bg-surface-2 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-fg">
                          {prod.name}
                          <span className="block text-[10px] text-fg-3">{prod.brand}</span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-gold-deep">{v.size}</td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-fg-3">{v.sku}</td>
                        {seeProfit && <td className="py-3.5 px-4 font-mono text-fg-2">{formatMoney(v.costPrice)}</td>}
                        <td className="py-3.5 px-4 font-mono text-fg font-semibold">
                          {formatMoney((v.discountPrice || v.sellingPrice))}
                        </td>
                        <td className="py-3.5 px-4 font-mono tabular-nums font-bold text-sm text-fg">
                          {v.stockQuantity}
                        </td>
                        {seeProfit && (
                          <td className="py-3.5 px-4 font-mono text-blue-600 font-medium">
                            {formatMoney((v.costPrice * v.stockQuantity))}
                          </td>
                        )}
                        <td className="py-3.5 px-4">
                          {isOut ? (
                            <span className="px-2 py-0.5 text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
                              Out of Stock
                            </span>
                          ) : isLow ? (
                            <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              Low (≤ {v.lowStockThreshold})
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Optimal
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleOpenAdjust(prod, v)}
                            className="px-2.5 py-1 bg-surface hover:bg-surface-3 border border-line-strong text-[11px] font-medium text-fg-2 transition-colors cursor-pointer"
                          >
                            Adjust Stock
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Traceable Stock Movements Ledger */}
      <div className="bg-surface border border-line overflow-hidden">
        <div className="p-4 bg-surface border-b border-line">
          <h3 className="font-serif text-xl text-fg">
            {lang === 'so' ? 'Taariikhda Kaydka' : 'Stock History'}
          </h3>
          
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-2 border-b border-line text-fg-2 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Fragrance & Size</th>
                <th className="py-3.5 px-4">Movement Type</th>
                <th className="py-3.5 px-4">Quantity Change</th>
                <th className="py-3.5 px-4">New Balance</th>
                <th className="py-3.5 px-4">Reason / Reference</th>
                <th className="py-3.5 px-4">Performed By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-fg-2">
              {movements.map((m) => (
                <tr key={m.id} className="hover:bg-surface-2 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-[11px] text-fg-3">
                    {new Date(m.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-fg">
                    {m.productName} ({m.size})
                  </td>
                  <td className="py-3.5 px-4 capitalize font-mono text-[11px] text-gold-deep font-medium">
                    {m.type.replace('_', ' ')}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold tabular-nums">
                    <span className={m.quantityChange > 0 ? 'text-emerald-700' : 'text-red-600'}>
                      {m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-fg font-semibold">
                    {m.newBalance}
                  </td>
                  <td className="py-3.5 px-4 text-fg-2 max-w-xs truncate">
                    {m.reason} ({m.referenceId})
                  </td>
                  <td className="py-3.5 px-4 text-fg-3">
                    {m.performedBy}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Stock Adjustment Modal */}
      {isAdjustModalOpen && selectedProduct && selectedVariant && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="relative w-full max-w-md bg-surface border border-line rounded-2xl p-6 shadow-2xl text-fg">
            <h3 className="font-serif text-xl font-semibold mb-1 text-fg">
              Manual Stock Adjustment
            </h3>
            

            {adjustError && (
              <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 mb-4">
                {adjustError}
              </div>
            )}

            <form onSubmit={handleSaveAdjustment} className="space-y-4 text-xs">
              <div>
                <label className="block text-fg-2 mb-1 font-medium">Current Stock Balance</label>
                <input
                  type="text"
                  disabled
                  value={`${selectedVariant.stockQuantity} units`}
                  className="w-full bg-surface-2 border border-line p-2 text-fg-3 font-mono"
                />
              </div>

              <div>
                <label className="block text-fg-2 mb-1 font-medium">New Physical Count *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={newStockQty}
                  onChange={(e) => setNewStockQty(parseInt(e.target.value) || 0)}
                  className="w-full bg-surface border border-line-strong focus:border-gold p-2 text-fg font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-fg-2 mb-1 font-medium">
                  Mandatory Audit Reason (Min 5 characters) *
                </label>
                <textarea
                  required
                  rows={3}
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Physical inventory count reconciliation; or damaged atomizer during transit inspection."
                  className="w-full bg-surface border border-line-strong focus:border-gold p-2 text-fg outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 bg-surface hover:bg-surface-3 text-fg-2 border border-line-strong cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-inverse hover:bg-inverse-hover text-on-inverse font-semibold cursor-pointer shadow-md"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
