import React, { useState } from 'react';
import { Settings, Save, CheckCircle2, RotateCcw } from 'lucide-react';
import { StoreSettings, Language } from '../../types';
import { storeRepo } from '../../lib/storage';
import { getTranslation } from '../../lib/translations';

interface AdminSettingsProps {
  lang: Language;
  settings: StoreSettings;
  onSettingsUpdated: (newSettings: StoreSettings) => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({
  lang,
  settings,
  onSettingsUpdated,
}) => {
  const [formSettings, setFormSettings] = useState<StoreSettings>({ ...settings });
  const [successMessage, setSuccessMessage] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    storeRepo.saveSettings(formSettings);
    onSettingsUpdated(formSettings);
    setSuccessMessage(true);
    setTimeout(() => setSuccessMessage(false), 2500);
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl">
      {/* Header */}
      <div className="pb-6 border-b border-line">
        <h1 className="font-serif text-3xl text-fg">
          {getTranslation(lang, 'adminSettings')}
        </h1>
        
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{lang === 'so' ? 'Waa la kaydiyay.' : 'Saved.'}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* Brand & Boutique Details */}
        <div className="p-6 bg-surface border border-line space-y-4">
          <h3 className="font-serif text-lg text-fg font-medium border-b border-line pb-3">
            Store
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-fg-2 mb-1 font-medium">Store Name *</label>
              <input
                type="text"
                required
                value={formSettings.storeName}
                onChange={(e) => setFormSettings({ ...formSettings, storeName: e.target.value })}
                className="w-full bg-surface-2 border border-line-strong focus:border-gold p-2.5 text-fg outline-none"
              />
            </div>

            <div>
              <label className="block text-fg-2 mb-1 font-medium">WhatsApp *</label>
              <input
                type="text"
                required
                value={formSettings.whatsappNumber}
                onChange={(e) => setFormSettings({ ...formSettings, whatsappNumber: e.target.value })}
                className="w-full bg-surface-2 border border-line-strong focus:border-gold p-2.5 text-fg font-mono outline-none"
              />
            </div>

            <div>
              <label className="block text-fg-2 mb-1 font-medium">Tagline (English)</label>
              <input
                type="text"
                value={formSettings.taglineEn}
                onChange={(e) => setFormSettings({ ...formSettings, taglineEn: e.target.value })}
                className="w-full bg-surface-2 border border-line-strong focus:border-gold p-2.5 text-fg outline-none"
              />
            </div>

            <div>
              <label className="block text-fg-2 mb-1 font-medium">Tagline (Soomaali)</label>
              <input
                type="text"
                value={formSettings.taglineSo}
                onChange={(e) => setFormSettings({ ...formSettings, taglineSo: e.target.value })}
                className="w-full bg-surface-2 border border-line-strong focus:border-gold p-2.5 text-fg outline-none"
              />
            </div>

            <div>
              <label className="block text-fg-2 mb-1 font-medium">Support Email</label>
              <input
                type="email"
                value={formSettings.email}
                onChange={(e) => setFormSettings({ ...formSettings, email: e.target.value })}
                className="w-full bg-surface-2 border border-line-strong focus:border-gold p-2.5 text-fg outline-none"
              />
            </div>

            <div>
              <label className="block text-fg-2 mb-1 font-medium">{lang === 'so' ? 'Cinwaanka xarunta' : 'Head office address'}</label>
              <input
                type="text"
                value={formSettings.address}
                onChange={(e) => setFormSettings({ ...formSettings, address: e.target.value })}
                className="w-full bg-surface-2 border border-line-strong focus:border-gold p-2.5 text-fg outline-none"
              />
            </div>
          </div>
        </div>

        <div className="p-6 bg-surface border border-line flex items-center justify-between gap-4">
          <div>
            <h3 className="font-serif text-xl text-fg">{lang === 'so' ? 'Lacagta' : 'Currency'}</h3>
            <p className="text-fg-3 mt-1">
              {lang === 'so'
                ? 'Qiimaha gaarsiinta: Gaarsiinta. Sicirka lacagaha: Lacag-bixinta.'
                : 'Shipping rates: Delivery. Exchange rates: Payments.'}
            </p>
          </div>
          <span className="font-mono text-lg text-fg">{formSettings.currency} £</span>
        </div>

        {/* Announcement Bar */}
        <div className="p-6 bg-surface border border-line space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h3 className="font-serif text-xl text-fg">
              Announcement Bar
            </h3>
            <label className="flex items-center gap-2 text-xs text-fg-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formSettings.announcementBarActive}
                onChange={(e) => setFormSettings({ ...formSettings, announcementBarActive: e.target.checked })}
                className="accent-gold"
              />
              <span>{lang === 'so' ? 'Muuji' : 'Show'}</span>
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-fg-2 mb-1 font-medium">Text (English)</label>
              <input
                type="text"
                value={formSettings.announcementBarTextEn}
                onChange={(e) => setFormSettings({ ...formSettings, announcementBarTextEn: e.target.value })}
                className="w-full bg-surface-2 border border-line-strong focus:border-gold p-2.5 text-fg outline-none"
              />
            </div>

            <div>
              <label className="block text-fg-2 mb-1 font-medium">Qoraalka (Soomaali)</label>
              <input
                type="text"
                value={formSettings.announcementBarTextSo}
                onChange={(e) => setFormSettings({ ...formSettings, announcementBarTextSo: e.target.value })}
                className="w-full bg-surface-2 border border-line-strong focus:border-gold p-2.5 text-fg outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            className="px-8 py-3.5 bg-inverse hover:bg-inverse-hover text-on-inverse font-semibold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all shadow-md shadow-black/10"
          >
            <Save className="w-4 h-4 text-gold" />
            <span>{getTranslation(lang, 'saveChanges')}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
