import React from 'react';
import {
  BarChart3,
  DollarSign,
  TrendingUp,
  Receipt,
  CreditCard,
  Building,
  ArrowDownRight,
  ArrowUpRight,
  PieChart,
} from 'lucide-react';
import { Language, StoreSettings } from '../../types';
import { storeRepo } from '../../lib/storage';
import { getTranslation } from '../../lib/translations';

import { formatMoney } from '../../lib/money';
interface AdminFinancesProps {
  lang: Language;
  settings: StoreSettings;
}

export const AdminFinances: React.FC<AdminFinancesProps> = ({ lang, settings }) => {
  const fin = storeRepo.getFinancialSummary();
  const orders = storeRepo.getOrders();
  const expenses = storeRepo.getExpenses();

  const grossMarginPct = fin.netSales > 0 ? ((fin.grossProfit / fin.netSales) * 100).toFixed(1) : '0';
  const netMarginPct = fin.netSales > 0 ? ((fin.netOperatingProfit / fin.netSales) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="pb-6 border-b border-line">
        <h1 className="font-serif text-3xl text-fg">
          {getTranslation(lang, 'adminFinances')}
        </h1>
        
      </div>

      {/* Structured Profit & Loss Statement (P&L) */}
      <div className="bg-surface border border-line p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-line">
          <div>
            <h2 className="font-serif text-2xl text-fg font-medium">
              {lang === 'so' ? 'Faa’iido & Khasaare' : 'Profit & Loss'}
            </h2>
            
          </div>
          <span className="font-mono text-xs text-gold bg-surface-2 border border-line-strong px-3 py-1 font-semibold">
            All Time
          </span>
        </div>

        <div className="space-y-4 text-xs">
          {/* Revenue Section */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm font-semibold text-fg">
              <span>1. Gross Sales Revenue</span>
              <span className="font-mono tabular-nums">
                {formatMoney((fin.netSales + (orders.reduce((s, o) => s + (o.orderStatus !== 'Cancelled' ? o.discountAmount : 0), 0))))}
              </span>
            </div>
            <div className="flex justify-between items-center text-fg-3 pl-4">
              <span>Less: Customer Promotional Discounts</span>
              <span className="font-mono tabular-nums text-rose-600">
                -{formatMoney(orders.reduce((s, o) => s + (o.orderStatus !== 'Cancelled' ? o.discountAmount : 0), 0))}
              </span>
            </div>
            <div className="flex justify-between items-center font-bold text-sm text-gold pt-1 border-t border-line">
              <span>= Net Sales Revenue</span>
              <span className="font-mono tabular-nums">{formatMoney(fin.netSales)}</span>
            </div>
          </div>

          {/* Cost of Goods Sold */}
          <div className="space-y-2 pt-4 border-t border-line">
            <div className="flex justify-between items-center text-sm font-semibold text-fg">
              <span>2. Cost of Goods Sold (COGS)</span>
              <span className="font-mono tabular-nums text-rose-600">
                -{formatMoney(fin.cogs)}
              </span>
            </div>
            <p className="text-[11px] text-fg-3 pl-4 leading-relaxed">
              Historical purchase costs of all bottles sold in confirmed/delivered customer orders.
            </p>
          </div>

          {/* Gross Profit */}
          <div className="p-4 bg-green-50 border border-green-200 flex items-center justify-between text-base font-semibold">
            <div>
              <span className="text-emerald-800">= Estimated Gross Profit</span>
              <span className="block text-xs text-emerald-600 font-normal">
                Gross Margin: {grossMarginPct}% of Net Sales
              </span>
            </div>
            <span className="font-mono text-xl text-emerald-800 tabular-nums font-bold">
              {formatMoney(fin.grossProfit)}
            </span>
          </div>

          {/* Operating Expenses */}
          <div className="space-y-2 pt-4 border-t border-line">
            <div className="flex justify-between items-center text-sm font-semibold text-fg">
              <span>3. Operating Expenses</span>
              <span className="font-mono tabular-nums text-rose-600">
                -{formatMoney(fin.totalOperatingExpenses)}
              </span>
            </div>
            <div className="pl-4 space-y-1 text-fg-3">
              {expenses.map((e) => (
                <div key={e.id} className="flex justify-between">
                  <span>{e.category} ({e.description})</span>
                  <span className="font-mono tabular-nums">{formatMoney(e.amount)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Net Operating Profit */}
          <div className="p-5 bg-surface-2 border border-gold/60 flex items-center justify-between text-lg font-bold">
            <div>
              <span className={fin.netOperatingProfit >= 0 ? 'text-emerald-800' : 'text-rose-700'}>
                = Estimated Net Operating Profit
              </span>
              <span className="block text-xs text-fg-3 font-normal">
                Net Margin: {netMarginPct}% after operating overhead
              </span>
            </div>
            <span
              className={`font-mono text-2xl tabular-nums ${
                fin.netOperatingProfit >= 0 ? 'text-emerald-800' : 'text-rose-700'
              }`}
            >
              {formatMoney(fin.netOperatingProfit)}
            </span>
          </div>
        </div>
      </div>

      {/* Balance Positions: Receivables & Payables */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="p-6 bg-surface border border-line space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-fg-3 font-semibold">
              Accounts Receivable (Customer Due)
            </span>
            <CreditCard className="w-4 h-4 text-blue-500" />
          </div>
          <div className="font-mono text-2xl font-bold text-fg tabular-nums">
            {formatMoney(fin.customerReceivables)}
          </div>
          <p className="text-xs text-fg-3">
            Uncollected payments for dispatched orders or Cash on Delivery (COD) awaiting driver remittance.
          </p>
        </div>

        <div className="p-6 bg-surface border border-line space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-fg-3 font-semibold">
              Accounts Payable (Supplier Due)
            </span>
            <Building className="w-4 h-4 text-rose-500" />
          </div>
          <div className="font-mono text-2xl font-bold text-rose-600 tabular-nums">
            {formatMoney(fin.supplierPayables)}
          </div>
          <p className="text-xs text-fg-3">
            Total credit balance due to perfume suppliers and freight forwarders across all purchase shipments.
          </p>
        </div>
      </div>
    </div>
  );
};
