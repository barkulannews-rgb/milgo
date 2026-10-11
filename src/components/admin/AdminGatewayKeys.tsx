import React, { useEffect, useState } from 'react';
import { Copy, Check, Lock } from 'lucide-react';
import { Language } from '../../types';
import { api, GatewayKeyField, GatewayKeys } from '../../lib/api';
import { storeRepo } from '../../lib/storage';

interface AdminGatewayKeysProps {
  lang: Language;
  isOwner: boolean;
}

type Provider = 'stripe' | 'paypal';

const inputClass = 'w-full bg-surface-2 border border-line-strong focus:border-gold p-2.5 text-fg font-mono outline-none';

// Owner-only: connect Stripe and PayPal by pasting their keys. Saved keys are never shown again, only a masked hint.
export const AdminGatewayKeys: React.FC<AdminGatewayKeysProps> = ({ lang, isOwner }) => {
  const so = lang === 'so';
  const t = (en: string, som: string) => (so ? som : en);
  const [status, setStatus] = useState<GatewayKeys | null>(null);
  const [form, setForm] = useState<Partial<Record<GatewayKeyField, string>>>({});
  const [busy, setBusy] = useState<Provider | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string; for: Provider } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOwner) api.gatewayKeys().then(setStatus).catch(() => setStatus(null));
  }, [isOwner]);

  if (!isOwner) {
    return (
      <p className="px-5 py-4 border border-line bg-surface text-fg-3 flex items-center gap-2">
        <Lock className="w-4 h-4" strokeWidth={1.5} />
        {t('Only the owner can connect Stripe and PayPal.', 'Owner-ka oo kaliya ayaa xiri kara Stripe iyo PayPal.')}
      </p>
    );
  }
  if (!status) return null;

  const save = async (which: Provider, fields: GatewayKeyField[], clear?: GatewayKeyField[]) => {
    const change: Partial<Record<GatewayKeyField, string>> & { clear?: GatewayKeyField[] } = {};
    for (const f of fields) if (form[f]?.trim()) change[f] = form[f]!.trim();
    if (clear) change.clear = clear;
    if (!clear && !Object.keys(change).length) return setMessage({ ok: false, text: t('Paste a key first.', 'Marka hore geli furaha.'), for: which });
    setBusy(which);
    try {
      setStatus(await api.gatewayKeysSave(change));
      setForm((f) => Object.fromEntries(Object.entries(f).filter(([k]) => !fields.includes(k as GatewayKeyField))));
      await storeRepo.syncFromServer(); // checkout picks up the new gateways
      setMessage({ ok: true, text: clear ? t('Removed.', 'Waa la saaray.') : t('Checked with the provider and saved.', 'Waa la hubiyay oo waa la kaydiyay.'), for: which });
    } catch (err) {
      setMessage({ ok: false, text: (err as Error).message, for: which });
    } finally {
      setBusy(null);
    }
  };

  // Plain render function (not a component) so typing never remounts the input
  const field = (f: GatewayKeyField, label: string, placeholder: string) => {
    const k = status.keys[f];
    return (
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-fg-2 font-medium">{label}</label>
          {k.set && (
            <span className="text-[11px] text-fg-3 font-mono">
              {k.hint}
              {k.source === 'config' && <span className="font-sans"> · {t('from config file', 'faylka config-ga')}</span>}
            </span>
          )}
        </div>
        <input
          type="password"
          autoComplete="off"
          spellCheck={false}
          value={form[f] ?? ''}
          onChange={(e) => setForm({ ...form, [f]: e.target.value })}
          placeholder={k.set ? t('Saved. Paste a new one to replace it', 'Waa kaydsan yahay. Geli mid cusub si aad u beddesho') : placeholder}
          className={inputClass}
        />
      </div>
    );
  };

  const badge = (ok: boolean, partial = false) => (
    <span
      className={`text-[11px] px-2 py-0.5 border shrink-0 ${
        ok && !partial ? 'border-emerald-300 text-emerald-700' : ok ? 'border-amber-300 text-amber-700' : 'border-line-strong text-fg-3'
      }`}
    >
      {ok && !partial ? t('Connected', 'Waa xiran yahay') : ok ? t('Webhook missing', 'Webhook-ka ayaa maqan') : t('Not connected', 'Lama xirin')}
    </span>
  );

  const msg = (which: Provider) =>
    message?.for === which ? <p className={`text-sm ${message.ok ? 'text-emerald-700' : 'text-red-600'}`}>{message.text}</p> : null;

  const actions = (which: Provider, fields: GatewayKeyField[]) => {
    const fromAdmin = fields.filter((f) => status.keys[f].source === 'admin');
    return (
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => save(which, fields)}
          disabled={busy !== null}
          className="px-5 py-2.5 bg-inverse hover:bg-inverse-hover text-on-inverse uppercase tracking-[0.14em] cursor-pointer disabled:opacity-50"
        >
          {busy === which ? t('Checking…', 'Waa la hubinayaa…') : t('Save', 'Kaydi')}
        </button>
        {fromAdmin.length > 0 && (
          <button
            type="button"
            onClick={() =>
              window.confirm(t('Remove these keys? Payments through this provider stop.', 'Ma saaraysaa furayaashan? Lacag-bixinta adeeggan way istaagaysaa.')) &&
              save(which, [], fromAdmin)
            }
            disabled={busy !== null}
            className="text-red-600 hover:underline cursor-pointer"
          >
            {t('Remove', 'Saar')}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Stripe */}
      <div className="p-6 bg-surface border border-line space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-serif text-xl text-fg">Stripe</h3>
            <p className="text-[11px] text-fg-3 mt-0.5">{t('Cards, Apple Pay, Google Pay → your bank', 'Kaar, Apple Pay, Google Pay → bangigaaga')}</p>
          </div>
          {badge(status.ready.stripe, status.ready.stripe && !status.ready.stripeWebhook)}
        </div>
        {field('stripe_secret_key', 'Secret key', 'sk_live_...')}
        <div>
          <label className="block text-fg-2 font-medium mb-1">{t('Webhook URL (paste into Stripe)', 'Webhook URL (ku dheji Stripe)')}</label>
          <div className="flex">
            <input readOnly value={status.webhookUrl} className={`${inputClass} text-fg-2`} onFocus={(e) => e.target.select()} />
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(status.webhookUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="px-3 border border-l-0 border-line-strong text-fg-2 hover:text-fg cursor-pointer"
              aria-label="Copy"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" strokeWidth={1.5} />}
            </button>
          </div>
          <p className="text-[11px] text-fg-3 mt-1">Event: checkout.session.completed</p>
        </div>
        {field('stripe_webhook_secret', 'Webhook signing secret', 'whsec_...')}
        {msg('stripe')}
        {actions('stripe', ['stripe_secret_key', 'stripe_webhook_secret'])}
      </div>

      {/* PayPal */}
      <div className="p-6 bg-surface border border-line space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-serif text-xl text-fg">PayPal</h3>
            <p className="text-[11px] text-fg-3 mt-0.5">{t('PayPal checkout → your PayPal balance', 'PayPal → akoonkaaga PayPal')}</p>
          </div>
          {badge(status.ready.paypal)}
        </div>
        {field('paypal_client_id', 'Client ID', 'A...')}
        {field('paypal_secret', 'Secret', 'E...')}
        <div>
          <label className="block text-fg-2 font-medium mb-1">{t('Mode', 'Nooca')}</label>
          <select
            value={form.paypal_mode ?? status.keys.paypal_mode.hint ?? 'live'}
            onChange={(e) => setForm({ ...form, paypal_mode: e.target.value })}
            className={inputClass}
          >
            <option value="live">{t('Live (real money)', 'Live (lacag dhab ah)')}</option>
            <option value="sandbox">{t('Sandbox (testing)', 'Sandbox (tijaabo)')}</option>
          </select>
        </div>
        {msg('paypal')}
        {actions('paypal', ['paypal_client_id', 'paypal_secret', 'paypal_mode'])}
      </div>

      <p className="lg:col-span-2 text-[11px] text-fg-3 flex items-center gap-1.5">
        <Lock className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
        {t(
          'Keys are checked with Stripe/PayPal, stored on the server only and never shown again. Every change is recorded in the activity log.',
          'Furayaasha waa la hubiyaa, server-ka oo kaliya ayay ku kaydsan yihiin, mar dambena lama muujiyo. Isbeddel kasta waa la diiwaangeliyaa.'
        )}
      </p>
    </div>
  );
};
