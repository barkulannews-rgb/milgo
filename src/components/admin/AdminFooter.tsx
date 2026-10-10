import React, { useState } from 'react';
import { RotateCcw, Save } from 'lucide-react';
import { HelpPage, HelpPageKey, Language, StoreSettings } from '../../types';
import { storeRepo } from '../../lib/storage';
import { DEFAULT_HELP_PAGES, HELP_KEYS, helpPagesOf, whatsappDisplay } from '../../lib/helpPages';

interface AdminFooterProps {
  lang: Language;
  onSettingsUpdated: (newSettings: StoreSettings) => void;
}

const inputClass = 'w-full bg-surface-2 border border-line-strong focus:border-fg p-2.5 text-fg outline-none';
const label = 'block text-[11px] uppercase tracking-[0.14em] text-fg-3 mb-1';

// Points are edited as plain text, one point per line
const toLines = (text: string) => text.split('\n').map((l) => l.trim()).filter(Boolean);

// Everything in the storefront footer: head office contact details and the four help pages
export const AdminFooter: React.FC<AdminFooterProps> = ({ lang, onSettingsUpdated }) => {
  const so = lang === 'so';
  const t = (en: string, som: string) => (so ? som : en);
  const initial = storeRepo.getSettings();
  const [contact, setContact] = useState({ address: initial.address, whatsappNumber: whatsappDisplay(initial), email: initial.email });
  const [pages, setPages] = useState(() => {
    const p = helpPagesOf(initial);
    // Keep the textareas as raw text while typing; split into points on save
    return Object.fromEntries(HELP_KEYS.map((k) => [k, { ...p[k], enText: p[k].en.join('\n'), soText: p[k].so.join('\n') }])) as Record<
      HelpPageKey,
      HelpPage & { enText: string; soText: string }
    >;
  });
  const [active, setActive] = useState<HelpPageKey>('about');
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const touch = () => {
    setDirty(true);
    setMessage(null);
  };
  const setContactField = (k: keyof typeof contact, v: string) => {
    setContact({ ...contact, [k]: v });
    touch();
  };
  const patchPage = (patch: Partial<HelpPage & { enText: string; soText: string }>) => {
    setPages({ ...pages, [active]: { ...pages[active], ...patch } });
    touch();
  };
  const resetPage = () => {
    if (!window.confirm(t('Restore the original text of this page?', 'Ku celi qoraalkii asalka ahaa ee boggan?'))) return;
    const d = DEFAULT_HELP_PAGES[active];
    patchPage({ ...d, enText: d.en.join('\n'), soText: d.so.join('\n') });
  };

  const save = () => {
    const missing = HELP_KEYS.find((k) => !pages[k].titleEn.trim() || !toLines(pages[k].enText).length);
    if (missing) {
      setActive(missing);
      return setMessage({ ok: false, text: t('Every page needs an English title and text.', 'Bog kasta wuxuu u baahan yahay cinwaan iyo qoraal Ingiriisi ah.') });
    }
    if (!contact.whatsappNumber.replace(/[^0-9]/g, '')) return setMessage({ ok: false, text: t('Enter a WhatsApp number.', 'Geli lambarka WhatsApp.') });
    const helpPages = Object.fromEntries(
      HELP_KEYS.map((k) => {
        const p = pages[k];
        return [k, { titleEn: p.titleEn.trim(), titleSo: p.titleSo.trim(), en: toLines(p.enText), so: toLines(p.soText) }];
      })
    ) as Record<HelpPageKey, HelpPage>;
    const res = storeRepo.saveFooter({
      address: contact.address.trim(),
      email: contact.email.trim(),
      whatsappNumber: contact.whatsappNumber.trim(),
      helpPages,
    });
    if (!res.success) return setMessage({ ok: false, text: res.error ?? 'Save failed.' });
    onSettingsUpdated(storeRepo.getSettings());
    setDirty(false);
    setMessage({ ok: true, text: t('Saved. The footer is updated.', 'Waa la kaydiyay. Footer-ka waa la cusboonaysiiyay.') });
  };

  const page = pages[active];

  return (
    <div className="space-y-8 animate-fadeIn text-xs">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-line">
        <h1 className="font-serif text-3xl text-fg">Footer</h1>
        <button
          onClick={save}
          disabled={!dirty}
          className="px-5 py-2.5 bg-inverse hover:bg-inverse-hover text-on-inverse flex items-center gap-2 uppercase tracking-[0.14em] cursor-pointer disabled:opacity-40 disabled:cursor-default"
        >
          <Save className="w-3.5 h-3.5" strokeWidth={1.5} />
          {t('Save', 'Kaydi')}
        </button>
      </div>

      {message && <p className={`text-sm ${message.ok ? 'text-emerald-700' : 'text-red-600'}`}>{message.text}</p>}

      <section className="p-6 bg-surface border border-line space-y-4">
        <h2 className="font-serif text-xl text-fg">{t('Head Office', 'Xarunta')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={label}>{t('Address', 'Cinwaanka')}</label>
            <input className={inputClass} value={contact.address} onChange={(e) => setContactField('address', e.target.value)} placeholder="London, United Kingdom" />
          </div>
          <div>
            <label className={label}>WhatsApp</label>
            <input className={`${inputClass} font-mono`} value={contact.whatsappNumber} onChange={(e) => setContactField('whatsappNumber', e.target.value)} placeholder="+44 …" />
          </div>
          <div>
            <label className={label}>Email</label>
            <input type="email" className={inputClass} value={contact.email} onChange={(e) => setContactField('email', e.target.value)} placeholder="info@dkperfume.com" />
          </div>
        </div>
      </section>

      <section className="bg-surface border border-line">
        <div className="flex items-center justify-between gap-4 px-6 pt-5 border-b border-line">
          <div className="flex overflow-x-auto" role="tablist">
            {HELP_KEYS.map((k) => (
              <button
                key={k}
                role="tab"
                aria-selected={active === k}
                onClick={() => setActive(k)}
                className={`px-4 py-3 -mb-px border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                  active === k ? 'border-fg text-fg' : 'border-transparent text-fg-3 hover:text-fg'
                }`}
              >
                {(so && pages[k].titleSo) || pages[k].titleEn || k}
              </button>
            ))}
          </div>
          <button onClick={resetPage} className="mb-2 px-3 py-1.5 border border-line-strong text-fg-2 hover:text-fg flex items-center gap-1.5 shrink-0 cursor-pointer">
            <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.5} />
            {t('Original', 'Asalka')}
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {(['en', 'so'] as const).map((l) => (
            <div key={l} className="space-y-4">
              <div>
                <label className={label}>{l === 'en' ? 'Title (English)' : 'Cinwaanka (Soomaali)'}</label>
                <input
                  className={inputClass}
                  value={l === 'en' ? page.titleEn : page.titleSo}
                  onChange={(e) => patchPage(l === 'en' ? { titleEn: e.target.value } : { titleSo: e.target.value })}
                />
              </div>
              <div>
                <label className={label}>{l === 'en' ? 'Text (English)' : 'Qoraalka (Soomaali)'}</label>
                <textarea
                  rows={8}
                  className={`${inputClass} leading-relaxed resize-y`}
                  value={l === 'en' ? page.enText : page.soText}
                  onChange={(e) => patchPage(l === 'en' ? { enText: e.target.value } : { soText: e.target.value })}
                />
                <p className="text-fg-4 mt-1">{t('One point per line.', 'Qodob kasta sadar gooni ah.')}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="px-6 pb-5 text-fg-3">
          {t('Address on the site:', 'Linkiga bogga:')} <span className="font-mono text-fg-2">dkperfume.com/{active}</span>
        </p>
      </section>
    </div>
  );
};
