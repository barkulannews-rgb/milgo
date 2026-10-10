import React, { useState } from 'react';
import { Plus, X, Pencil } from 'lucide-react';
import { DeliveryZone, Language, StoreSettings } from '../../types';
import { storeRepo } from '../../lib/storage';
import { getTranslation } from '../../lib/translations';
import { countryName, sortedCountries } from '../../lib/countries';
import { CountryPicker } from './CountryPicker';
import { formatMoney, CURRENCY_SYMBOL } from '../../lib/money';

interface AdminDeliveryProps {
  lang: Language;
  settings: StoreSettings;
}

// 'domestic' = a city area (the zone names the delivery city); 'international' = country-wide shipping
type ZoneKind = 'domestic' | 'international';

interface ZoneForm {
  id?: string;
  kind: ZoneKind;
  countries: string[];
  cityCountry: string;
  city: string;
  zoneName: string;
  deliveryFee: number;
  estimatedHours: string;
  freeEnabled: boolean;
  freeFrom: number;
  active: boolean;
}

const EMPTY_FORM: ZoneForm = {
  kind: 'international',
  countries: [],
  cityCountry: 'SO',
  city: '',
  zoneName: '',
  deliveryFee: 5,
  estimatedHours: '',
  freeEnabled: false,
  freeFrom: 60,
  active: true,
};

const inputClass = 'w-full bg-surface-2 border border-line-strong focus:border-fg p-2.5 text-fg outline-none';

export const AdminDelivery: React.FC<AdminDeliveryProps> = ({ lang }) => {
  const so = lang === 'so';
  const [zones, setZones] = useState<DeliveryZone[]>(storeRepo.getDeliveryZones());
  const [form, setForm] = useState<ZoneForm | null>(null);
  const [error, setError] = useState('');

  const refreshZones = () => setZones(storeRepo.getDeliveryZones());
  const set = <K extends keyof ZoneForm>(key: K, value: ZoneForm[K]) => setForm((f) => (f ? { ...f, [key]: value } : f));

  const openNew = () => {
    setError('');
    setForm({ ...EMPTY_FORM });
  };

  const openEdit = (z: DeliveryZone) => {
    setError('');
    const kind: ZoneKind = z.regionType === 'international' ? 'international' : 'domestic';
    setForm({
      id: z.id,
      kind,
      countries: kind === 'international' ? z.countries ?? [] : [],
      cityCountry: kind === 'domestic' ? z.countries?.[0] ?? 'SO' : 'SO',
      city: kind === 'domestic' ? z.city : '',
      zoneName: z.zoneName,
      deliveryFee: z.deliveryFee,
      estimatedHours: z.estimatedHours,
      freeEnabled: z.freeShippingFrom != null,
      freeFrom: z.freeShippingFrom ?? 60,
      active: z.active,
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    if (!form.zoneName.trim()) return setError(so ? 'Geli magaca aagga.' : 'Enter a zone name.');
    if (form.kind === 'international' && form.countries.length === 0)
      return setError(so ? 'Dooro ugu yaraan hal dal.' : 'Choose at least one country.');
    if (form.kind === 'domestic' && !form.city.trim()) return setError(so ? 'Geli magaalada.' : 'Enter the city.');

    const intl = form.kind === 'international';
    const zone: DeliveryZone = {
      id: form.id ?? `zone-${Date.now()}`,
      city: intl ? (form.countries.length === 1 ? countryName(form.countries[0]) : form.zoneName.trim()) : form.city.trim(),
      zoneName: form.zoneName.trim(),
      regionType: form.kind,
      country: intl ? undefined : countryName(form.cityCountry),
      countries: intl ? form.countries : [form.cityCountry],
      deliveryFee: Math.max(0, form.deliveryFee),
      estimatedHours: form.estimatedHours.trim(),
      freeShippingFrom: form.freeEnabled ? Math.max(0, form.freeFrom) : null,
      active: form.active,
    };
    storeRepo.saveDeliveryZone(zone);
    setForm(null);
    refreshZones();
  };

  const handleToggleZone = (zone: DeliveryZone) => {
    storeRepo.saveDeliveryZone({ ...zone, active: !zone.active });
    refreshZones();
  };

  const orders = storeRepo.getOrders();
  const codOrders = orders.filter((o) => o.paymentMethod === 'Cash on Delivery');
  const codPendingTotal = codOrders.filter((o) => o.paymentStatus === 'Unpaid').reduce((s, o) => s + o.grandTotal, 0);
  const codCollectedTotal = codOrders.filter((o) => o.paymentStatus === 'Paid').reduce((s, o) => s + o.grandTotal, 0);

  const destination = (z: DeliveryZone) =>
    z.regionType === 'international'
      ? (z.countries ?? []).map((c) => countryName(c, lang)).join(', ') || '—'
      : `${z.city}, ${countryName(z.countries?.[0] ?? 'SO', lang)}`;

  const label = 'block text-[11px] uppercase tracking-[0.14em] text-fg-3 mb-1';

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line">
        <h1 className="font-serif text-3xl text-fg">{getTranslation(lang, 'adminDelivery')}</h1>
        <button
          onClick={openNew}
          className="px-4 py-2 bg-inverse hover:bg-inverse-hover text-on-inverse text-xs flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" strokeWidth={1.5} />
          <span>{so ? 'Aag cusub' : 'Add Zone'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 bg-surface border border-line">
          <span className="text-[11px] uppercase tracking-[0.14em] text-fg-3 block mb-1">{so ? 'COD la sugayo' : 'COD to collect'}</span>
          <div className="font-mono text-2xl text-amber-600">{formatMoney(codPendingTotal)}</div>
        </div>
        <div className="p-5 bg-surface border border-line">
          <span className="text-[11px] uppercase tracking-[0.14em] text-fg-3 block mb-1">{so ? 'COD la helay' : 'COD collected'}</span>
          <div className="font-mono text-2xl text-fg">{formatMoney(codCollectedTotal)}</div>
        </div>
      </div>

      <div className="bg-surface border border-line overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-2 border-b border-line text-fg-3 uppercase tracking-[0.12em]">
              <tr>
                <th className="py-3 px-4 font-normal">{so ? 'Meesha' : 'Destination'}</th>
                <th className="py-3 px-4 font-normal">{so ? 'Aagga' : 'Zone'}</th>
                <th className="py-3 px-4 font-normal">{so ? 'Qiimaha' : 'Fee'}</th>
                <th className="py-3 px-4 font-normal">{so ? 'Bilaash laga bilaabo' : 'Free from'}</th>
                <th className="py-3 px-4 font-normal">{so ? 'Muddada' : 'Transit'}</th>
                <th className="py-3 px-4 font-normal">{so ? 'Xaalad' : 'Status'}</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-fg-2">
              {zones.map((z) => (
                <tr key={z.id} className={`transition-colors hover:bg-surface-2 ${z.active ? '' : 'opacity-50'}`}>
                  <td className="py-3 px-4 text-fg max-w-[280px]">
                    <span className="line-clamp-2">{destination(z)}</span>
                  </td>
                  <td className="py-3 px-4">{z.zoneName}</td>
                  <td className="py-3 px-4 font-mono text-fg">{formatMoney(z.deliveryFee)}</td>
                  <td className="py-3 px-4 font-mono">{z.freeShippingFrom != null ? formatMoney(z.freeShippingFrom) : '—'}</td>
                  <td className="py-3 px-4 text-fg-3">{z.estimatedHours}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleToggleZone(z)}
                      className={`text-[11px] underline underline-offset-4 cursor-pointer ${z.active ? 'text-emerald-700' : 'text-fg-3'}`}
                    >
                      {z.active ? (so ? 'Shaqaynaya' : 'Active') : so ? 'Joogsaday' : 'Off'}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => openEdit(z)} className="p-1.5 text-fg-3 hover:text-fg cursor-pointer" aria-label="Edit zone">
                      <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {form && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="relative w-full max-w-md bg-surface p-7 shadow-2xl text-fg">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-serif text-2xl">{form.id ? (so ? 'Wax ka beddel aagga' : 'Edit Zone') : so ? 'Aag cusub' : 'New Zone'}</h3>
              <button onClick={() => setForm(null)} className="text-fg-3 hover:text-fg cursor-pointer" aria-label="Close">
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {error && <p className="text-red-600">{error}</p>}

              <div className="grid grid-cols-2 border border-line">
                {(['international', 'domestic'] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => set('kind', k)}
                    className={`py-2.5 cursor-pointer transition-colors ${form.kind === k ? 'bg-inverse text-on-inverse' : 'text-fg-3 hover:text-fg'}`}
                  >
                    {k === 'international' ? (so ? 'Dal dhan' : 'Whole country') : so ? 'Magaalo / xaafad' : 'City area'}
                  </button>
                ))}
              </div>

              {form.kind === 'international' ? (
                <div>
                  <span className={label}>{so ? 'Dalalka' : 'Countries'}</span>
                  <CountryPicker value={form.countries} onChange={(v) => set('countries', v)} lang={lang} allowAll />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className={label}>{so ? 'Dalka' : 'Country'}</span>
                    <select value={form.cityCountry} onChange={(e) => set('cityCountry', e.target.value)} className={inputClass}>
                      {sortedCountries(lang).map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span className={label}>{so ? 'Magaalada' : 'City'}</span>
                    <input value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Mogadishu" className={inputClass} />
                  </div>
                </div>
              )}

              <div>
                <span className={label}>{so ? 'Magaca aagga' : 'Zone name'}</span>
                <input
                  value={form.zoneName}
                  onChange={(e) => set('zoneName', e.target.value)}
                  placeholder={form.kind === 'international' ? 'DHL Express Europe' : 'Hodan & Taleex'}
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className={label}>
                    {so ? 'Qiimaha' : 'Fee'} ({CURRENCY_SYMBOL})
                  </span>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    value={form.deliveryFee}
                    onChange={(e) => set('deliveryFee', parseFloat(e.target.value) || 0)}
                    className={`${inputClass} font-mono`}
                  />
                </div>
                <div>
                  <span className={label}>{so ? 'Muddada' : 'Transit'}</span>
                  <input
                    value={form.estimatedHours}
                    onChange={(e) => set('estimatedHours', e.target.value)}
                    placeholder={so ? '2–3 maalmood' : '2–3 working days'}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-fg-2 whitespace-nowrap">
                  <input type="checkbox" checked={form.freeEnabled} onChange={(e) => set('freeEnabled', e.target.checked)} className="accent-gold" />
                  <span>{so ? 'Bilaash marka dalabku ka badan yahay' : 'Free shipping over'}</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  disabled={!form.freeEnabled}
                  value={form.freeFrom}
                  onChange={(e) => set('freeFrom', parseFloat(e.target.value) || 0)}
                  className="w-28 bg-surface-2 border border-line-strong focus:border-fg p-2.5 text-fg font-mono outline-none disabled:opacity-40"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setForm(null)} className="px-4 py-2 text-fg-3 hover:text-fg cursor-pointer">
                  {getTranslation(lang, 'cancel')}
                </button>
                <button type="submit" className="px-5 py-2 bg-inverse hover:bg-inverse-hover text-on-inverse cursor-pointer transition-colors">
                  {getTranslation(lang, 'saveChanges')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
