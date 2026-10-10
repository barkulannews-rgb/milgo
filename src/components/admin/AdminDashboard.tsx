import React, { useMemo, useState } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Language, Order, StoreSettings } from '../../types';
import { storeRepo } from '../../lib/storage';
import { formatMoney } from '../../lib/money';
import { AdminTab } from './AdminLayout';
import { RevenueChart, RevenuePoint } from './dashboard/RevenueChart';
import { BarList, BarRow } from './dashboard/BarList';

interface AdminDashboardProps {
  lang: Language;
  settings: StoreSettings;
  onNavigateTab: (tab: AdminTab) => void;
}

type Range = '7d' | '30d' | '90d' | 'all';
const RANGE_DAYS: Record<Exclude<Range, 'all'>, number> = { '7d': 7, '30d': 30, '90d': 90 };
const DAY = 86_400_000;

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const netOf = (o: Order) => o.subtotal - o.discountAmount;

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ lang, onNavigateTab }) => {
  const so = lang === 'so';
  const t = (en: string, som: string) => (so ? som : en);
  const locale = so ? 'so' : 'en-GB';
  const me = storeRepo.getCurrentStaff();
  const seeProfit = storeRepo.can('profit');
  const seeOrders = storeRepo.can('orders');
  const seeStock = storeRepo.can('inventory');
  const canAddProduct = storeRepo.can('products');

  // Open on the shortest range that actually has sales
  const [range, setRange] = useState<Range>(() => {
    const now = +startOfDay(new Date());
    const times = storeRepo.getOrders().filter((o) => o.orderStatus !== 'Cancelled').map((o) => +new Date(o.createdAt));
    return (['7d', '30d', '90d'] as const).find((r) => times.some((tm) => tm >= now - (RANGE_DAYS[r] - 1) * DAY)) ?? 'all';
  });
  const [showTable, setShowTable] = useState(false);

  const orders = useMemo(() => storeRepo.getOrders(), []);
  const products = useMemo(() => storeRepo.getProducts(), []);
  const today = startOfDay(new Date());
  const firstOrderDay = orders.length ? startOfDay(new Date(Math.min(...orders.map((o) => +new Date(o.createdAt))))) : today;

  const start = range === 'all' ? firstOrderDay : new Date(+today - (RANGE_DAYS[range] - 1) * DAY);
  const spanDays = Math.round((+today - +start) / DAY) + 1;
  const prevStart = new Date(+start - spanDays * DAY);

  const live = orders.filter((o) => o.orderStatus !== 'Cancelled');
  const inRange = (o: Order, from: Date, to: Date) => +new Date(o.createdAt) >= +from && +new Date(o.createdAt) < +to + DAY;
  const current = live.filter((o) => inRange(o, start, today));
  const previous = range === 'all' ? [] : live.filter((o) => inRange(o, prevStart, new Date(+start - DAY)));

  const sales = current.reduce((s, o) => s + netOf(o), 0);
  const prevSales = previous.reduce((s, o) => s + netOf(o), 0);
  const delta = range !== 'all' && prevSales > 0 ? ((sales - prevSales) / prevSales) * 100 : null;
  const avgOrder = current.length ? sales / current.length : 0;
  const cogs = current.reduce((s, o) => s + o.items.reduce((x, it) => x + (it.costPrice || 0) * it.quantity, 0), 0);
  const grossProfit = sales - cogs;
  const margin = sales > 0 ? (grossProfit / sales) * 100 : 0;
  const pending = orders.filter((o) => o.orderStatus === 'Pending').length;
  const fin = storeRepo.getFinancialSummary();

  // Daily buckets up to 90 days, weekly beyond, so the line keeps a readable density
  const series: RevenuePoint[] = useMemo(() => {
    const weekly = spanDays > 90;
    const size = weekly ? 7 : 1;
    const buckets = Math.ceil(spanDays / size);
    const fmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' });
    return Array.from({ length: buckets }, (_, i) => {
      const from = new Date(+start + i * size * DAY);
      const to = new Date(Math.min(+from + (size - 1) * DAY, +today));
      const value = current.filter((o) => inRange(o, from, to)).reduce((s, o) => s + netOf(o), 0);
      return {
        tick: fmt.format(from),
        label: weekly ? `${fmt.format(from)} – ${fmt.format(to)}` : fmt.format(from),
        value,
      };
    });
  }, [range, orders]);

  const topProducts: BarRow[] = Object.values(
    current
      .flatMap((o) => o.items)
      .reduce<Record<string, { name: string; value: number; units: number }>>((acc, it) => {
        const k = it.productName;
        acc[k] ??= { name: k, value: 0, units: 0 };
        acc[k].value += it.subtotal;
        acc[k].units += it.quantity;
        return acc;
      }, {})
  )
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
    .map((p) => ({ key: p.name, label: p.name, value: p.value, display: formatMoney(p.value), detail: `${p.units} ${t('units', 'xabbo')}` }));

  const byCountry: BarRow[] = Object.entries(
    current.reduce<Record<string, number>>((acc, o) => {
      const c = o.country || 'Somalia';
      acc[c] = (acc[c] ?? 0) + netOf(o);
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([c, v]) => ({ key: c, label: c, value: v, display: formatMoney(v) }));

  const byStatus: BarRow[] = Object.entries(
    orders
      .filter((o) => inRange(o, start, today))
      .reduce<Record<string, number>>((acc, o) => {
        acc[o.orderStatus] = (acc[o.orderStatus] ?? 0) + 1;
        return acc;
      }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .map(([s, n]) => ({ key: s, label: s, value: n, display: String(n) }));

  const lowStock = products
    .flatMap((p) => p.variants.map((v) => ({ p, v })))
    .filter(({ v }) => v.stockQuantity <= v.lowStockThreshold)
    .sort((a, b) => a.v.stockQuantity - b.v.stockQuantity)
    .slice(0, 5);

  const recent = orders.slice(0, 6);
  const hour = new Date().getHours();
  const greeting = so
    ? hour < 12 ? 'Subax wanaagsan' : hour < 18 ? 'Galab wanaagsan' : 'Habeen wanaagsan'
    : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = me.name.split(/[\s/]/)[0];
  const rangeLabel: Record<Range, string> = {
    '7d': t('7 days', '7 maalmood'),
    '30d': t('30 days', '30 maalmood'),
    '90d': t('90 days', '90 maalmood'),
    all: t('All time', 'Dhammaan'),
  };

  const statusTone = (s: string) =>
    s === 'Delivered' ? 'bg-emerald-600' : s === 'Cancelled' || s === 'Returned' ? 'bg-red-600' : s === 'Pending' ? 'bg-amber-600' : 'bg-blue-600';

  const tiles: { label: string; value: string; note?: string; show: boolean }[] = [
    { label: t('Orders', 'Dalabyada'), value: String(current.length), note: `${pending} ${t('pending', 'sugaya')}`, show: true },
    { label: t('Average order', 'Celceliska dalabka'), value: formatMoney(avgOrder), show: true },
    { label: t('Gross profit', 'Faa’iidada guud'), value: formatMoney(grossProfit), note: `${margin.toFixed(0)}% ${t('margin', 'faa’iido')}`, show: seeProfit },
    { label: t('Stock value', 'Qiimaha kaydka'), value: formatMoney(fin.inventoryCostValuation), note: `${fin.totalStockUnits} ${t('units', 'xabbo')}`, show: seeProfit },
  ];

  const card = 'bg-surface border border-line';
  const cardTitle = 'font-serif text-xl text-fg';

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Greeting + range */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-fg-3">
            {new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}
          </p>
          <h1 className="font-serif text-4xl text-fg mt-2">
            {greeting}, {firstName}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex border border-line-strong" role="group" aria-label={t('Date range', 'Muddada')}>
            {(Object.keys(rangeLabel) as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                aria-pressed={range === r}
                className={`px-3.5 py-2 text-xs transition-colors cursor-pointer ${
                  range === r ? 'bg-inverse text-on-inverse' : 'text-fg-3 hover:text-fg'
                }`}
              >
                {rangeLabel[r]}
              </button>
            ))}
          </div>
          {canAddProduct && (
            <button
              onClick={() => onNavigateTab('products')}
              className="px-4 py-2 bg-inverse hover:bg-inverse-hover text-on-inverse text-xs transition-colors cursor-pointer"
            >
              + {t('New product', 'Alaab cusub')}
            </button>
          )}
        </div>
      </div>

      {/* Hero: net sales + trend */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <section className={`${card} xl:col-span-2 p-6 sm:p-8`}>
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="font-sans text-[11px] uppercase tracking-[0.16em] text-fg-3">{t('Net sales', 'Iibka saafiga')}</h2>
              <div className="font-sans text-5xl sm:text-6xl font-light text-fg mt-3 tracking-tight">{formatMoney(sales)}</div>
              <div className="flex items-center gap-2 mt-3 text-sm">
                {delta !== null ? (
                  <>
                    <span className={`inline-flex items-center gap-0.5 ${delta >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                      {delta >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      {delta >= 0 ? '+' : ''}
                      {delta.toFixed(1)}%
                    </span>
                    <span className="text-fg-3">{t(`vs previous ${rangeLabel[range]}`, `marka loo eego ${rangeLabel[range]}-kii hore`)}</span>
                  </>
                ) : (
                  <span className="text-fg-3">{rangeLabel[range]}</span>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowTable((v) => !v)}
              className="text-xs text-fg-3 hover:text-fg underline underline-offset-4 cursor-pointer"
            >
              {showTable ? t('Chart', 'Shaxda') : t('Table', 'Jadwal')}
            </button>
          </div>

          {showTable ? (
            <div className="max-h-64 overflow-y-auto border-t border-line">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-line">
                  {series.map((p, i) => (
                    <tr key={i}>
                      <td className="py-2 text-fg-2">{p.label}</td>
                      <td className="py-2 text-right text-fg tabular-nums">{formatMoney(p.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <RevenueChart points={series} height={330} emptyText={t('No sales in this period yet.', 'Muddadan weli iib ma jiro.')} />
          )}
        </section>

        <div className="grid grid-cols-2 xl:grid-cols-1 gap-5">
          {tiles
            .filter((x) => x.show)
            .map((x) => (
              <div key={x.label} className={`${card} p-5 flex flex-col justify-between`}>
                <span className="text-[11px] uppercase tracking-[0.16em] text-fg-3">{x.label}</span>
                <div className="mt-3">
                  <div className="text-3xl font-light text-fg tracking-tight">{x.value}</div>
                  {x.note && <div className="text-xs text-fg-3 mt-1">{x.note}</div>}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <section className={`${card} p-6`}>
          <h3 className={`${cardTitle} mb-5`}>{t('Top products', 'Alaabta ugu iibka badan')}</h3>
          <BarList rows={topProducts} emptyText={t('No sales yet.', 'Iib ma jiro.')} />
        </section>
        <section className={`${card} p-6`}>
          <h3 className={`${cardTitle} mb-5`}>{t('Sales by country', 'Iibka dalalka')}</h3>
          <BarList rows={byCountry} emptyText={t('No sales yet.', 'Iib ma jiro.')} />
        </section>
        <section className={`${card} p-6`}>
          <h3 className={`${cardTitle} mb-5`}>{t('Orders by status', 'Xaaladda dalabyada')}</h3>
          <BarList rows={byStatus} emptyText={t('No orders yet.', 'Dalab ma jiro.')} />
        </section>
      </div>

      {/* Recent orders + low stock */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {seeOrders && (
          <section className={`${card} xl:col-span-2 p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={cardTitle}>{t('Recent orders', 'Dalabyadii u dambeeyay')}</h3>
              <button onClick={() => onNavigateTab('orders')} className="text-xs text-fg-3 hover:text-fg underline underline-offset-4 cursor-pointer">
                {t('View all', 'Dhammaan')}
              </button>
            </div>
            <div className="divide-y divide-line">
              {recent.map((o) => (
                <button
                  key={o.id}
                  onClick={() => onNavigateTab('orders')}
                  className="w-full py-3.5 grid grid-cols-[1fr_auto] sm:grid-cols-[1.4fr_1fr_auto_auto] items-center gap-4 text-left text-sm hover:bg-surface-2 -mx-3 px-3 transition-colors cursor-pointer"
                >
                  <span className="min-w-0">
                    <span className="block text-fg truncate">{o.customerName}</span>
                    <span className="block text-xs text-fg-3">{o.id}</span>
                  </span>
                  <span className="hidden sm:block text-xs text-fg-3 truncate">
                    {o.city}
                    {o.country ? `, ${o.country}` : ''}
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-fg-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${statusTone(o.orderStatus)}`} aria-hidden="true" />
                    {o.orderStatus}
                  </span>
                  <span className="text-fg tabular-nums text-right">{formatMoney(o.grandTotal)}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {seeStock && (
          <section className={`${card} p-6 ${seeOrders ? '' : 'xl:col-span-3'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={cardTitle}>{t('Low stock', 'Kayd yar')}</h3>
              <button onClick={() => onNavigateTab('inventory')} className="text-xs text-fg-3 hover:text-fg underline underline-offset-4 cursor-pointer">
                {t('Inventory', 'Kaydka')}
              </button>
            </div>
            {lowStock.length === 0 ? (
              <p className="text-sm text-fg-3 py-6">{t('All products are well stocked.', 'Dhammaan alaabtu way badan tahay.')}</p>
            ) : (
              <ul className="divide-y divide-line">
                {lowStock.map(({ p, v }) => (
                  <li key={v.id} className="py-3 flex items-center gap-3">
                    <img src={p.images[0]} alt="" className="w-10 h-12 object-cover bg-surface-3 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-fg truncate">{p.name}</div>
                      <div className="text-xs text-fg-3">{v.size}</div>
                    </div>
                    <span className={`text-sm tabular-nums ${v.stockQuantity === 0 ? 'text-red-600' : 'text-amber-700'}`}>
                      {v.stockQuantity === 0 ? t('Out', 'Dhammaaday') : `${v.stockQuantity} ${t('left', 'hadhay')}`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </div>
  );
};
