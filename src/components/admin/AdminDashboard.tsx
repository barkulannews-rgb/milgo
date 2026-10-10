import React from 'react';
import {
  DollarSign,
  TrendingUp,
  Package,
  ShoppingCart,
  Boxes,
  AlertTriangle,
  Receipt,
  CreditCard,
  ArrowUpRight,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { Language, StoreSettings } from '../../types';
import { storeRepo } from '../../lib/storage';
import { getTranslation } from '../../lib/translations';

import { formatMoney } from '../../lib/money';
interface AdminDashboardProps {
  lang: Language;
  settings: StoreSettings;
  onNavigateTab: (tab: any) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  lang,
  settings,
  onNavigateTab,
}) => {
  const fin = storeRepo.getFinancialSummary();
  const seeProfit = storeRepo.can('profit');
  const seeOrders = storeRepo.can('orders');
  const seeStock = storeRepo.can('inventory');
  const canAddProduct = storeRepo.can('products');
  const recentOrders = storeRepo.getOrders().slice(0, 5);
  const recentMovements = storeRepo.getStockMovements().slice(0, 5);

  const allKpis = [
    {
      label: getTranslation(lang, 'totalRevenue'),
      value: `${formatMoney(fin.netSales)}`,
      sub: lang === 'so' ? 'Dhimista kadib' : 'After discounts',
      icon: DollarSign,
      color: 'text-gold',
    },
    {
      label: getTranslation(lang, 'grossProfit'),
      value: `${formatMoney(fin.grossProfit)}`,
      sub: `${fin.netSales > 0 ? ((fin.grossProfit / fin.netSales) * 100).toFixed(1) : 0}% margin`,
      icon: TrendingUp,
      color: 'text-emerald-600',
    },
    {
      label: getTranslation(lang, 'operatingExpenses'),
      value: `${formatMoney(fin.totalOperatingExpenses)}`,
      sub: fin.totalUnpaidExpenses > 0 ? `${formatMoney(fin.totalUnpaidExpenses)} unpaid` : lang === 'so' ? 'Dhammaan waa la bixiyay' : 'All paid',
      icon: Receipt,
      color: 'text-red-600',
    },
    {
      label: getTranslation(lang, 'netProfit'),
      value: `${formatMoney(fin.netOperatingProfit)}`,
      sub: lang === 'so' ? 'Kharashka kadib' : 'After expenses',
      icon: TrendingUp,
      color: fin.netOperatingProfit >= 0 ? 'text-emerald-600' : 'text-red-600',
    },
    {
      label: getTranslation(lang, 'inventoryCostValuation'),
      value: `${formatMoney(fin.inventoryCostValuation)}`,
      sub: `${fin.totalStockUnits} units`,
      icon: Boxes,
      color: 'text-blue-600',
    },
    {
      label: getTranslation(lang, 'totalOrders'),
      value: `${fin.totalOrdersCount}`,
      sub: `${fin.pendingOrdersCount} ${lang === 'so' ? 'sugaya' : 'pending'}`,
      icon: ShoppingCart,
      color: 'text-amber-600',
    },
    {
      label: getTranslation(lang, 'receivables'),
      value: `${formatMoney(fin.customerReceivables)}`,
      sub: lang === 'so' ? 'Dalabyo aan la bixin' : 'Unpaid orders',
      icon: CreditCard,
      color: 'text-fg-2',
    },
    {
      label: getTranslation(lang, 'payables'),
      value: `${formatMoney(fin.supplierPayables)}`,
      sub: lang === 'so' ? 'Alaab-qeybiyeyaasha' : 'Owed to suppliers',
      icon: AlertTriangle,
      color: 'text-red-600',
    },
  ];

  const PROFIT_KPIS = [
    getTranslation(lang, 'grossProfit'),
    getTranslation(lang, 'operatingExpenses'),
    getTranslation(lang, 'netProfit'),
    getTranslation(lang, 'inventoryCostValuation'),
    getTranslation(lang, 'payables'),
  ];
  const kpis = seeProfit ? allKpis : allKpis.filter((k) => !PROFIT_KPIS.includes(k.label));

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line">
        <div>
          <h1 className="font-serif text-3xl text-fg">
            {getTranslation(lang, 'adminDashboard')}
          </h1>
          
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {seeOrders && (
          <button
            onClick={() => onNavigateTab('orders')}
            className="px-4 py-2 border border-line-strong hover:border-fg text-xs text-fg transition-colors cursor-pointer"
          >
            {getTranslation(lang, 'adminOrders')} ({fin.pendingOrdersCount})
          </button>
          )}
          {canAddProduct && (
          <button
            onClick={() => onNavigateTab('products')}
            className="px-4 py-2 bg-inverse hover:bg-inverse-hover text-on-inverse text-xs transition-colors cursor-pointer"
          >
            + {getTranslation(lang, 'addNewProduct')}
          </button>
          )}
        </div>
      </div>

      {/* Low stock notice banner if needed */}
      {seeStock && (fin.lowStockCount > 0 || fin.outOfStockCount > 0) && (
        <div className="px-4 py-3 bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-800">
          <span>
            {lang === 'so'
              ? `${fin.lowStockCount} kayd yar · ${fin.outOfStockCount} dhammaaday`
              : `${fin.lowStockCount} low stock · ${fin.outOfStockCount} out of stock`}
          </span>
          <button
            onClick={() => onNavigateTab('inventory')}
            className="underline font-semibold hover:text-amber-950 cursor-pointer"
          >
            {lang === 'so' ? 'Eeg' : 'Review'}
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {kpis.map((kpi, idx) => {
          return (
            <div key={idx} className="p-5 bg-surface border border-line flex flex-col gap-2">
              <span className="text-[11px] uppercase tracking-[0.14em] text-fg-3">{kpi.label}</span>
              <div>
                <div className={`font-mono text-2xl ${kpi.color === 'text-red-600' && kpi.value.includes('-') ? 'text-red-600' : 'text-fg'}`}>
                  {kpi.value}
                </div>
                <div className="text-[11px] text-fg-3 mt-1 font-sans">
                  {kpi.sub}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2-Column Tables: Recent Orders & Stock Movements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        {seeOrders && (
        <div className="p-6 bg-surface border border-line">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-line">
            <h3 className="font-serif text-xl text-fg">{lang === 'so' ? 'Dalabyadii u dambeeyay' : 'Recent Orders'}</h3>
            <button
              onClick={() => onNavigateTab('orders')}
              className="text-xs text-fg-3 hover:text-fg underline underline-offset-4 cursor-pointer"
            >
              {lang === 'so' ? 'Dhammaan' : 'View all'}
            </button>
          </div>

          <div className="divide-y divide-line">
            {recentOrders.map((o) => (
              <div
                key={o.id}
                onClick={() => onNavigateTab('orders')}
                className="py-3 flex items-center justify-between text-xs hover:bg-surface-2 -mx-2 px-2 transition-colors cursor-pointer"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-fg">{o.id}</span>
                    <span className="text-fg-4">·</span>
                    <span className="text-fg-2 font-medium">{o.customerName}</span>
                  </div>
                  <div className="text-[11px] text-fg-3 mt-0.5">
                    {o.city} · {o.paymentMethod}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono text-fg">
                    {formatMoney(o.grandTotal)}
                  </div>
                  <span
                    className={`inline-block text-[10px] px-2 py-0.5 mt-0.5 font-medium ${
                      o.orderStatus === 'Delivered'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : o.orderStatus === 'Pending'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {o.orderStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        )}

        {/* Recent Stock Movements */}
        {seeStock && (
        <div className="p-6 bg-surface border border-line">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-line">
            <h3 className="font-serif text-xl text-fg">{lang === 'so' ? 'Dhaqdhaqaaqa Kaydka' : 'Stock Activity'}</h3>
            <button
              onClick={() => onNavigateTab('inventory')}
              className="text-xs text-fg-3 hover:text-fg underline underline-offset-4 cursor-pointer"
            >
              {lang === 'so' ? 'Dhammaan' : 'View all'}
            </button>
          </div>

          <div className="divide-y divide-line">
            {recentMovements.map((m) => (
              <div
                key={m.id}
                className="py-3 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-medium text-fg">
                    {m.productName} ({m.size})
                  </div>
                  <div className="text-[11px] text-fg-3 mt-0.5">
                    {m.performedBy}
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`font-mono font-bold tabular-nums ${
                      m.quantityChange > 0 ? 'text-emerald-700' : 'text-red-600'
                    }`}
                  >
                    {m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange}
                  </div>
                  <div className="text-[10px] text-fg-3 font-mono">
                    {lang === 'so' ? 'Hadhay' : 'Left'} {m.newBalance}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        )}
      </div>
    </div>
  );
};
