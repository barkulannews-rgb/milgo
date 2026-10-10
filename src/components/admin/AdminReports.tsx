import React, { useState } from 'react';
import { BarChart3, Download, Calendar, TrendingUp, Boxes, DollarSign, Package } from 'lucide-react';
import { Language } from '../../types';
import { storeRepo } from '../../lib/storage';
import { getTranslation } from '../../lib/translations';

import { formatMoney } from '../../lib/money';
interface AdminReportsProps {
  lang: Language;
}

export const AdminReports: React.FC<AdminReportsProps> = ({ lang }) => {
  const seeProfit = storeRepo.can('profit');
  const [reportType, setReportType] = useState<'sales' | 'inventory' | 'profit' | 'brands'>('sales');

  const orders = storeRepo.getOrders();
  const products = storeRepo.getProducts();
  const fin = storeRepo.getFinancialSummary();

  const handleExportCsv = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let filename = `dkperfume_report_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`;

    if (reportType === 'sales') {
      headers = ['Order ID', 'Date', 'Customer', 'Phone', 'City', 'Payment Method', 'Payment Status', 'Order Status', 'Items Count', 'Grand Total (£)'];
      rows = orders.map((o) => [
        o.id,
        o.createdAt.slice(0, 10),
        `"${o.customerName}"`,
        `"${o.customerPhone}"`,
        o.city,
        o.paymentMethod,
        o.paymentStatus,
        o.orderStatus,
        o.items.reduce((s, i) => s + i.quantity, 0),
        o.grandTotal.toFixed(2),
      ]);
    } else if (reportType === 'inventory') {
      headers = ['Product Name', 'Brand', 'Variant Size', 'SKU', 'Stock Qty', 'Cost Basis (£)', 'Selling Price (£)', 'Valuation at Cost (£)', 'Valuation at Retail (£)'];
      rows = products.flatMap((p) =>
        p.variants.map((v) => [
          `"${p.name}"`,
          `"${p.brand}"`,
          v.size,
          v.sku,
          v.stockQuantity,
          v.costPrice.toFixed(2),
          v.sellingPrice.toFixed(2),
          (v.costPrice * v.stockQuantity).toFixed(2),
          (v.sellingPrice * v.stockQuantity).toFixed(2),
        ])
      );
    } else if (reportType === 'profit') {
      headers = ['Metric', 'Amount (£)', 'Percentage of Net Sales'];
      const grossMargin = fin.netSales > 0 ? ((fin.grossProfit / fin.netSales) * 100).toFixed(1) : 0;
      const netMargin = fin.netSales > 0 ? ((fin.netOperatingProfit / fin.netSales) * 100).toFixed(1) : 0;
      rows = [
        ['Net Sales Revenue', fin.netSales.toFixed(2), '100%'],
        ['Cost of Goods Sold (COGS)', fin.cogs.toFixed(2), `${fin.netSales > 0 ? ((fin.cogs / fin.netSales) * 100).toFixed(1) : 0}%`],
        ['Estimated Gross Profit', fin.grossProfit.toFixed(2), `${grossMargin}%`],
        ['Operating Expenses', fin.totalOperatingExpenses.toFixed(2), `${fin.netSales > 0 ? ((fin.totalOperatingExpenses / fin.netSales) * 100).toFixed(1) : 0}%`],
        ['Estimated Net Operating Profit', fin.netOperatingProfit.toFixed(2), `${netMargin}%`],
      ];
    } else if (reportType === 'brands') {
      const brandMap: Record<string, { unitsSold: number; revenue: number }> = {};
      orders.forEach((o) => {
        if (o.orderStatus !== 'Cancelled') {
          o.items.forEach((it) => {
            if (!brandMap[it.brand]) brandMap[it.brand] = { unitsSold: 0, revenue: 0 };
            brandMap[it.brand].unitsSold += it.quantity;
            brandMap[it.brand].revenue += it.subtotal;
          });
        }
      });

      headers = ['Brand Name', 'Units Sold', 'Total Revenue (£)'];
      rows = Object.entries(brandMap).map(([brand, data]) => [
        `"${brand}"`,
        data.unitsSold,
        data.revenue.toFixed(2),
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line">
        <div>
          <h1 className="font-serif text-3xl text-fg">
            {getTranslation(lang, 'adminReports')}
          </h1>
          
        </div>

        <button
          onClick={handleExportCsv}
          className="px-4 py-2 bg-inverse hover:bg-inverse-hover text-on-inverse text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-gold" />
          <span>Download Selected Report (CSV)</span>
        </button>
      </div>

      {/* Report Selector Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-surface border border-line overflow-x-auto">
        <button
          onClick={() => setReportType('sales')}
          className={`px-4 py-2 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
            reportType === 'sales' ? 'bg-[#9b783e] text-white font-semibold' : 'text-fg-3 hover:text-fg'
          }`}
        >
          Sales Ledger & Orders
        </button>
        <button
          onClick={() => setReportType('inventory')}
          className={`px-4 py-2 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
            reportType === 'inventory' ? 'bg-[#9b783e] text-white font-semibold' : 'text-fg-3 hover:text-fg'
          }`}
        >
          Inventory Valuation & Stock
        </button>
        {seeProfit && (
        <button
          onClick={() => setReportType('profit')}
          className={`px-4 py-2 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
            reportType === 'profit' ? 'bg-[#9b783e] text-white font-semibold' : 'text-fg-3 hover:text-fg'
          }`}
        >
          Profitability & Margin Audit
        </button>
        )}
        <button
          onClick={() => setReportType('brands')}
          className={`px-4 py-2 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
            reportType === 'brands' ? 'bg-[#9b783e] text-white font-semibold' : 'text-fg-3 hover:text-fg'
          }`}
        >
          Brand Revenue Share
        </button>
      </div>

      {/* Report Content Preview */}
      <div className="bg-surface border border-line p-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-line">
          <h3 className="font-serif text-lg text-fg font-medium capitalize">
            {reportType} Report Preview
          </h3>
          <span className="text-xs font-mono text-gold font-semibold">
            Reconciles directly with verified records
          </span>
        </div>

        {reportType === 'sales' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-2 text-fg-2 font-semibold border-b border-line">
                <tr>
                  <th className="py-2.5 px-3">Order ID</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">City</th>
                  <th className="py-2.5 px-3">Payment</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Grand Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-fg-2">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-surface-2 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-medium text-gold">{o.id}</td>
                    <td className="py-2.5 px-3">{o.customerName}</td>
                    <td className="py-2.5 px-3">{o.city}</td>
                    <td className="py-2.5 px-3">{o.paymentMethod} ({o.paymentStatus})</td>
                    <td className="py-2.5 px-3">{o.orderStatus}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-fg">{formatMoney(o.grandTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'inventory' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-2 text-fg-2 font-semibold border-b border-line">
                <tr>
                  <th className="py-2.5 px-3">Fragrance</th>
                  <th className="py-2.5 px-3">Size / SKU</th>
                  <th className="py-2.5 px-3">Stock Units</th>
                  {seeProfit && <th className="py-2.5 px-3">Cost Basis</th>}
                  <th className="py-2.5 px-3">Selling Price</th>
                  {seeProfit && <th className="py-2.5 px-3 text-right">Cost Valuation</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-fg-2">
                {products.flatMap((p) =>
                  p.variants.map((v) => (
                    <tr key={v.id} className="hover:bg-surface-2 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-fg">{p.name} ({p.brand})</td>
                      <td className="py-2.5 px-3 font-mono text-gold">{v.size} · {v.sku}</td>
                      <td className="py-2.5 px-3 font-mono font-semibold">{v.stockQuantity}</td>
                      {seeProfit && <td className="py-2.5 px-3 font-mono">{formatMoney(v.costPrice)}</td>}
                      <td className="py-2.5 px-3 font-mono">{formatMoney(v.sellingPrice)}</td>
                      {seeProfit && (
                        <td className="py-2.5 px-3 text-right font-mono text-blue-600 font-semibold">
                          {formatMoney((v.costPrice * v.stockQuantity))}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {seeProfit && reportType === 'profit' && (
          <div className="space-y-3 text-xs max-w-xl">
            <div className="flex justify-between py-2 border-b border-line">
              <span className="text-fg-3">Net Sales Revenue</span>
              <span className="font-mono font-semibold text-fg">{formatMoney(fin.netSales)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-line">
              <span className="text-fg-3">Cost of Goods Sold (COGS)</span>
              <span className="font-mono font-semibold text-rose-600">-{formatMoney(fin.cogs)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-line">
              <span className="text-emerald-700 font-semibold">Gross Profit</span>
              <span className="font-mono font-bold text-emerald-700">{formatMoney(fin.grossProfit)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-line">
              <span className="text-fg-3">Operating Expenses</span>
              <span className="font-mono font-semibold text-rose-600">-{formatMoney(fin.totalOperatingExpenses)}</span>
            </div>
            <div className="flex justify-between py-3 border-t-2 border-line text-sm">
              <span className="text-fg font-bold">Estimated Net Operating Profit</span>
              <span className="font-mono font-bold text-emerald-700">{formatMoney(fin.netOperatingProfit)}</span>
            </div>
          </div>
        )}

        {reportType === 'brands' && (
          <div className="text-xs text-fg-3">
            CSV export summarizes total unit sales and gross revenues generated by each master fragrance brand.
          </div>
        )}
      </div>
    </div>
  );
};
