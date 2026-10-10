import React, { useState } from 'react';
import {
  CreditCard,
  Wallet,
  Smartphone,
  Landmark,
  Banknote,
  Globe2,
  Coins,
  Save,
  CheckCircle2,
  AlertTriangle,
  FlaskConical,
  Plus,
  X,
  ShieldAlert,
} from 'lucide-react';
import { Language, MarketSettings, PaymentSettings, StoreSettings } from '../../types';
import { storeRepo } from '../../lib/storage';
import { CARD_BRANDS } from '../../lib/countries';
import { CountryPicker } from './CountryPicker';

interface AdminPaymentsProps {
  lang: Language;
  onSettingsUpdated: (newSettings: StoreSettings) => void;
}

const inputClass = 'w-full bg-surface-2 border border-line-strong focus:border-gold p-2.5 text-fg outline-none';

const Toggle: React.FC<{ on: boolean; onChange: (on: boolean) => void; label: string }> = ({ on, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    aria-label={label}
    onClick={() => onChange(!on)}
    className={`relative w-10 h-[22px] rounded-full transition-colors shrink-0 cursor-pointer ${on ? 'bg-[#9b783e]' : 'bg-line-strong'}`}
  >
    <span className={`absolute top-[3px] left-[3px] w-4 h-4 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-[18px]' : ''}`} />
  </button>
);

const Section: React.FC<{
  icon: React.FC<{ className?: string }>;
  title: string;
  subtitle: string;
  enabled?: boolean;
  onToggle?: (on: boolean) => void;
  children?: React.ReactNode;
}> = ({ icon: Icon, title, subtitle, enabled, onToggle, children }) => (
  <div className="p-6 bg-surface border border-line">
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <div>
          <h3 className="font-serif text-xl text-fg leading-tight">{title}</h3>
          <p className="text-[11px] text-fg-3 mt-0.5">{subtitle}</p>
        </div>
      </div>
      {onToggle && <Toggle on={!!enabled} onChange={onToggle} label={title} />}
    </div>
    {children && (enabled === undefined || enabled) && <div className="mt-5 pt-5 border-t border-line space-y-4">{children}</div>}
  </div>
);

export const AdminPayments: React.FC<AdminPaymentsProps> = ({ lang, onSettingsUpdated }) => {
  const so = lang === 'so';
  const [payments, setPayments] = useState<PaymentSettings>(() => structuredClone(storeRepo.getPaymentSettings()));
  const [markets, setMarkets] = useState<MarketSettings>(() => structuredClone(storeRepo.getMarketSettings()));
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const setP = <K extends keyof PaymentSettings>(key: K, value: PaymentSettings[K]) => {
    setPayments((p) => ({ ...p, [key]: value }));
    setDirty(true);
  };
  const setM = <K extends keyof MarketSettings>(key: K, value: MarketSettings[K]) => {
    setMarkets((m) => ({ ...m, [key]: value }));
    setDirty(true);
  };

  const anyMethod =
    payments.cards.enabled ||
    payments.paypal.enabled ||
    payments.applePay ||
    payments.googlePay ||
    (payments.mobileMoney.enabled && payments.mobileMoney.wallets.some((w) => w.enabled)) ||
    payments.bankTransfer.enabled ||
    payments.cashOnDelivery.enabled;

  const handleSave = () => {
    if (!anyMethod) {
      setMessage({ type: 'error', text: so ? 'Ugu yaraan hal hab lacag-bixin waa inuu shaqeeyaa.' : 'Turn on at least one payment method.' });
      return;
    }
    if (payments.cards.enabled && payments.cards.brands.length === 0) {
      setMessage({ type: 'error', text: so ? 'Dooro ugu yaraan hal nooc oo kaar ah.' : 'Choose at least one accepted card brand.' });
      return;
    }
    if (!markets.sellWorldwide && markets.allowedCountries.length === 0) {
      setMessage({ type: 'error', text: so ? 'Dooro dalalka aad u iibiso.' : 'Choose the countries you sell to.' });
      return;
    }
    if (payments.bankTransfer.enabled && (!payments.bankTransfer.bankName.trim() || !payments.bankTransfer.accountName.trim())) {
      setMessage({ type: 'error', text: so ? 'Geli magaca bangiga iyo akoonka.' : 'Enter the bank name and account name for bank transfers.' });
      return;
    }
    const rates = markets.currencyRates.filter((r) => /^[A-Z]{3}$/.test(r.code) && r.rate > 0);
    storeRepo.savePaymentsAndMarkets(payments, { ...markets, currencyRates: rates });
    setMarkets((m) => ({ ...m, currencyRates: rates }));
    onSettingsUpdated(storeRepo.getSettings());
    setDirty(false);
    setMessage({ type: 'success', text: so ? 'Habaynta lacag-bixinta waa la kaydiyay!' : 'Payment settings saved and live at checkout!' });
    setTimeout(() => setMessage(null), 2500);
  };

  const label = 'block text-fg-2 mb-1 font-medium';

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl text-xs">
      <div className="pb-6 border-b border-line">
        <h1 className="font-serif text-3xl text-fg">{so ? 'Lacag-bixinta' : 'Payments'}</h1>
        
      </div>

      {message && (
        <div
          className={`p-4 flex items-center gap-2 border ${
            message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Processing mode */}
      <div className="px-5 py-4 border border-amber-200 bg-amber-50 text-amber-800">
        <div className="space-y-1">
          <p className="font-semibold">{so ? 'Habka tijaabada' : 'Test mode'}</p>
          <p>
            {so
              ? 'Kaarka iyo PayPal lacag dhab ah ma qaadaan ilaa server lagu xiro.'
              : 'Cards and PayPal take no real money until a server is connected.'}
          </p>
        </div>
      </div>

      {/* Markets */}
      <Section
        icon={Globe2}
        title={so ? 'Dalalka aad u iibiso' : 'Selling Countries'}
        subtitle={
          markets.sellWorldwide
            ? so ? 'Dunida oo dhan' : 'Worldwide'
            : so ? `${markets.allowedCountries.length} dal` : `${markets.allowedCountries.length} countries`
        }
      >
        <label className="flex items-center gap-3 cursor-pointer">
          <Toggle on={markets.sellWorldwide} onChange={(v) => setM('sellWorldwide', v)} label="Sell worldwide" />
          <span className="text-fg font-medium">{so ? 'U iibi dunida oo dhan' : 'Sell worldwide'}</span>
        </label>
        {!markets.sellWorldwide && (
          <CountryPicker value={markets.allowedCountries} onChange={(v) => setM('allowedCountries', v)} lang={lang} />
        )}
        <p className="text-[11px] text-fg-3">{so ? 'Qiimaha dirista: Gaarsiinta.' : 'Shipping rates: Delivery page.'}</p>
      </Section>

      {/* Cards */}
      <Section
        icon={CreditCard}
        title={so ? 'Kaararka Bangiga' : 'Credit & Debit Cards'}
        subtitle="Visa, Mastercard, American Express, Discover, UnionPay, JCB, Diners"
        enabled={payments.cards.enabled}
        onToggle={(v) => setP('cards', { ...payments.cards, enabled: v })}
      >
        <div>
          <span className={label}>{so ? 'Kaararka la aqbalo' : 'Accepted card brands'}</span>
          <div className="flex flex-wrap gap-2">
            {CARD_BRANDS.map((b) => {
              const on = payments.cards.brands.includes(b.id);
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() =>
                    setP('cards', {
                      ...payments.cards,
                      brands: on ? payments.cards.brands.filter((x) => x !== b.id) : [...payments.cards.brands, b.id],
                    })
                  }
                  className={`px-3 py-1.5 border font-semibold transition-colors cursor-pointer ${
                    on ? 'border-gold bg-[#9b783e]/10 text-fg' : 'border-line text-fg-3 hover:border-line-strong'
                  }`}
                >
                  {on && <CheckCircle2 className="inline w-3 h-3 mr-1 -mt-0.5 text-gold" />}
                  {b.label}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <label className={label}>Stripe Publishable Key</label>
          <input
            type="text"
            value={payments.cards.stripePublishableKey}
            onChange={(e) => setP('cards', { ...payments.cards, stripePublishableKey: e.target.value.trim() })}
            placeholder="pk_live_…"
            className={`${inputClass} font-mono`}
          />
          <p className="text-[11px] text-fg-3 mt-1 flex items-start gap-1">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            {so ? 'Kaliya furaha pk_. Furaha sk_ halkan ha gelin.' : 'Publishable key (pk_) only. Never paste the secret key here.'}
          </p>
        </div>
      </Section>

      {/* PayPal */}
      <Section
        icon={Wallet}
        title="PayPal"
        subtitle={so ? 'Akoon ama kaar' : 'Account or card'}
        enabled={payments.paypal.enabled}
        onToggle={(v) => setP('paypal', { ...payments.paypal, enabled: v })}
      >
        <div>
          <label className={label}>PayPal Client ID</label>
          <input
            type="text"
            value={payments.paypal.clientId}
            onChange={(e) => setP('paypal', { ...payments.paypal, clientId: e.target.value.trim() })}
            placeholder="AY…"
            className={`${inputClass} font-mono`}
          />
        </div>
      </Section>

      {/* Digital wallets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Section icon={Smartphone} title="Apple Pay" subtitle="iPhone, iPad, Mac · Safari" enabled={payments.applePay} onToggle={(v) => setP('applePay', v)} />
        <Section icon={Smartphone} title="Google Pay" subtitle="Android · Chrome" enabled={payments.googlePay} onToggle={(v) => setP('googlePay', v)} />
      </div>

      {/* Mobile money */}
      <Section
        icon={Smartphone}
        title={so ? 'Mobile Money (Soomaaliya)' : 'Mobile Money'}
        subtitle="EVC Plus · Zaad · Sahal · eDahab"
        enabled={payments.mobileMoney.enabled}
        onToggle={(v) => setP('mobileMoney', { ...payments.mobileMoney, enabled: v })}
      >
        <div className="space-y-2.5">
          {payments.mobileMoney.wallets.map((w, i) => (
            <div key={w.name} className="flex items-center gap-3">
              <Toggle
                on={w.enabled}
                label={w.name}
                onChange={(v) =>
                  setP('mobileMoney', {
                    ...payments.mobileMoney,
                    wallets: payments.mobileMoney.wallets.map((x, j) => (j === i ? { ...x, enabled: v } : x)),
                  })
                }
              />
              <span className="w-20 font-semibold text-fg">{w.name}</span>
              <input
                type="text"
                value={w.merchantNumber}
                disabled={!w.enabled}
                onChange={(e) =>
                  setP('mobileMoney', {
                    ...payments.mobileMoney,
                    wallets: payments.mobileMoney.wallets.map((x, j) => (j === i ? { ...x, merchantNumber: e.target.value } : x)),
                  })
                }
                placeholder={so ? 'Lambarka ganacsiga' : 'Merchant number'}
                className={`${inputClass} font-mono disabled:opacity-50`}
              />
            </div>
          ))}
        </div>
        <div>
          <span className={label}>{so ? 'Dalalka laga isticmaali karo' : 'Offered in these countries'}</span>
          <CountryPicker value={payments.mobileMoney.countries} onChange={(v) => setP('mobileMoney', { ...payments.mobileMoney, countries: v })} lang={lang} />
        </div>
      </Section>

      {/* Bank transfer */}
      <Section
        icon={Landmark}
        title={so ? 'Xawilaad Bangi' : 'Bank Transfer'}
        subtitle="IBAN / SWIFT"
        enabled={payments.bankTransfer.enabled}
        onToggle={(v) => setP('bankTransfer', { ...payments.bankTransfer, enabled: v })}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(
            [
              ['bankName', so ? 'Magaca Bangiga' : 'Bank name', false],
              ['accountName', so ? 'Magaca Akoonka' : 'Account name', false],
              ['iban', 'IBAN / Account number', true],
              ['swift', 'SWIFT / BIC', true],
            ] as const
          ).map(([key, text, mono]) => (
            <div key={key}>
              <label className={label}>{text}</label>
              <input
                type="text"
                value={payments.bankTransfer[key]}
                onChange={(e) => setP('bankTransfer', { ...payments.bankTransfer, [key]: e.target.value })}
                className={`${inputClass} ${mono ? 'font-mono' : ''}`}
              />
            </div>
          ))}
          <div className="sm:col-span-2">
            <label className={label}>{so ? 'Tilmaamo' : 'Instructions'}</label>
            <textarea
              rows={2}
              value={payments.bankTransfer.instructions}
              onChange={(e) => setP('bankTransfer', { ...payments.bankTransfer, instructions: e.target.value })}
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>
      </Section>

      {/* Cash on delivery */}
      <Section
        icon={Banknote}
        title={so ? 'Lacag Caddaan ah (COD)' : 'Cash on Delivery'}
        subtitle={so ? 'Bixi marka la helo' : 'Pay on receipt'}
        enabled={payments.cashOnDelivery.enabled}
        onToggle={(v) => setP('cashOnDelivery', { ...payments.cashOnDelivery, enabled: v })}
      >
        <div>
          <span className={label}>{so ? 'Dalalka laga isticmaali karo' : 'Offered in these countries'}</span>
          <CountryPicker value={payments.cashOnDelivery.countries} onChange={(v) => setP('cashOnDelivery', { ...payments.cashOnDelivery, countries: v })} lang={lang} />
        </div>
      </Section>

      {/* Currencies */}
      <Section
        icon={Coins}
        title={so ? 'Sicirka Lacagaha' : 'Currency Rates'}
        subtitle={
          so ? 'Lagu jarayaa GBP; qiyaas ayaa la tusaa.' : 'Charged in GBP; shown as an estimate.'
        }
      >
        <div className="space-y-2">
          {markets.currencyRates.map((r, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <span className="text-fg-3 font-mono w-16">1 GBP =</span>
              <input
                type="number"
                min="0"
                step="any"
                value={r.rate}
                onChange={(e) =>
                  setM('currencyRates', markets.currencyRates.map((x, j) => (j === i ? { ...x, rate: parseFloat(e.target.value) || 0 } : x)))
                }
                className={`${inputClass} font-mono max-w-[160px]`}
              />
              <input
                type="text"
                value={r.code}
                maxLength={3}
                onChange={(e) =>
                  setM('currencyRates', markets.currencyRates.map((x, j) => (j === i ? { ...x, code: e.target.value.toUpperCase() } : x)))
                }
                placeholder="EUR"
                className={`${inputClass} font-mono max-w-[90px] uppercase`}
              />
              <button
                type="button"
                onClick={() => setM('currencyRates', markets.currencyRates.filter((_, j) => j !== i))}
                aria-label="Remove currency"
                className="p-2 text-fg-3 hover:text-red-600 hover:bg-red-50 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setM('currencyRates', [...markets.currencyRates, { code: '', rate: 1 }])}
            className="px-3 py-2 border border-dashed border-line-strong hover:border-gold text-fg-3 hover:text-gold flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            {so ? 'Ku dar lacag' : 'Add currency'}
          </button>
        </div>
      </Section>

      {/* Save bar */}
      <div className="flex items-center justify-end gap-4 pt-2">
        {dirty && (
          <span className="text-amber-700 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            {so ? 'Isbeddello aan la kaydin ayaa jira' : 'You have unsaved changes'}
          </span>
        )}
        <button
          type="button"
          onClick={handleSave}
          className="px-8 py-3.5 bg-inverse hover:bg-inverse-hover text-on-inverse font-semibold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all shadow-md shadow-black/10"
        >
          <Save className="w-4 h-4 text-gold-inv" />
          <span>{so ? 'Kaydi' : 'Save Payment Settings'}</span>
        </button>
      </div>
    </div>
  );
};
