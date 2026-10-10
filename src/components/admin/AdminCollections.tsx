import React, { useRef, useState } from 'react';
import { ImagePlus, Upload, ArrowUp, ArrowDown, Trash2, Plus, RotateCcw, Save } from 'lucide-react';
import { CollectionCard, CollectionsSection, FragranceFamily, Language, StoreSettings } from '../../types';
import { storeRepo, DEFAULT_COLLECTIONS } from '../../lib/storage';
import { compressImage } from '../../lib/images';

interface AdminCollectionsProps {
  lang: Language;
  onSettingsUpdated: (newSettings: StoreSettings) => void;
}

const FAMILIES: (FragranceFamily | 'All')[] = ['All', 'Oriental', 'Woody', 'Floral', 'Fresh', 'Citrus', 'Gourmand', 'Leather'];
const inputClass = 'w-full bg-surface-2 border border-line-strong focus:border-fg p-2.5 text-fg outline-none';
const label = 'block text-[11px] uppercase tracking-[0.14em] text-fg-3 mb-1';

const newCard = (): CollectionCard => ({
  id: `col-${Date.now()}`,
  titleEn: '',
  titleSo: '',
  descEn: '',
  descSo: '',
  image: '',
  family: 'All',
  active: true,
});

const Switch: React.FC<{ on: boolean; onChange: () => void; label: string }> = ({ on, onChange, label: aria }) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    aria-label={aria}
    onClick={(e) => {
      e.stopPropagation();
      onChange();
    }}
    className={`relative w-9 h-5 rounded-full transition-colors shrink-0 cursor-pointer ${on ? 'bg-[#9b783e]' : 'bg-line-strong'}`}
  >
    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-4' : ''}`} />
  </button>
);

export const AdminCollections: React.FC<AdminCollectionsProps> = ({ lang, onSettingsUpdated }) => {
  const so = lang === 'so';
  const t = (en: string, som: string) => (so ? som : en);
  const [section, setSection] = useState<CollectionsSection>(() => storeRepo.getCollections());
  const [selectedId, setSelectedId] = useState(section.cards[0]?.id ?? '');
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const productPhotos = Array.from(new Set(storeRepo.getProducts().flatMap((p) => p.images)));

  const selected = section.cards.find((c) => c.id === selectedId) ?? section.cards[0];

  const update = (next: CollectionsSection) => {
    setSection(next);
    setDirty(true);
    setMessage(null);
  };
  const setField = <K extends keyof CollectionsSection>(k: K, v: CollectionsSection[K]) => update({ ...section, [k]: v });
  const patchCard = (id: string, patch: Partial<CollectionCard>) =>
    update({ ...section, cards: section.cards.map((c) => (c.id === id ? { ...c, ...patch } : c)) });

  const addCard = () => {
    const c = newCard();
    update({ ...section, cards: [...section.cards, c] });
    setSelectedId(c.id);
  };
  const removeCard = (id: string) => {
    const c = section.cards.find((x) => x.id === id);
    if (!window.confirm(t(`Delete "${c?.titleEn || 'this card'}"?`, `Ma tirtiraysaa "${c?.titleSo || c?.titleEn || 'kaarkan'}"?`))) return;
    const cards = section.cards.filter((x) => x.id !== id);
    update({ ...section, cards });
    if (selectedId === id) setSelectedId(cards[0]?.id ?? '');
  };
  const move = (id: string, d: number) => {
    const i = section.cards.findIndex((c) => c.id === id);
    const j = i + d;
    if (j < 0 || j >= section.cards.length) return;
    const cards = [...section.cards];
    [cards[i], cards[j]] = [cards[j], cards[i]];
    update({ ...section, cards });
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !selected) return;
    if (!file.type.startsWith('image/')) return setMessage({ ok: false, text: t('Choose an image file.', 'Dooro fayl sawir ah.') });
    setUploading(true);
    try {
      // Cards are portrait and narrower than the banner, so a smaller image is plenty
      patchCard(selected.id, { image: await compressImage(file, 1200) });
    } catch (err) {
      setMessage({ ok: false, text: (err as Error).message });
    } finally {
      setUploading(false);
    }
  };

  const save = () => {
    const bad = section.cards.find((c) => !c.titleEn.trim() || !c.image);
    if (bad) {
      setSelectedId(bad.id);
      return setMessage({ ok: false, text: t('Every card needs a title and an image.', 'Kaar kasta wuxuu u baahan yahay magac iyo sawir.') });
    }
    const res = storeRepo.saveCollections(section);
    if (!res.success) return setMessage({ ok: false, text: res.error ?? 'Save failed.' });
    onSettingsUpdated(storeRepo.getSettings());
    setDirty(false);
    setMessage({ ok: true, text: t('Saved.', 'Waa la kaydiyay.') });
  };

  const reset = () => {
    if (!window.confirm(t('Restore the original collections?', 'Ku celi xulalkii asalka ahaa?'))) return;
    update(structuredClone(DEFAULT_COLLECTIONS));
    setSelectedId(DEFAULT_COLLECTIONS.cards[0].id);
  };

  const visible = section.cards.filter((c) => c.active).length;

  return (
    <div className="space-y-8 animate-fadeIn text-xs">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-line">
        <h1 className="font-serif text-3xl text-fg">{t('Collections', 'Xulalka')}</h1>
        <div className="flex items-center gap-2">
          <button onClick={reset} className="px-3.5 py-2 border border-line-strong text-fg-2 hover:text-fg flex items-center gap-1.5 cursor-pointer">
            <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.5} />
            {t('Reset', 'Asalka')}
          </button>
          <button onClick={addCard} className="px-3.5 py-2 bg-[#9b783e] hover:bg-[#85632e] text-white flex items-center gap-1.5 cursor-pointer">
            <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
            {t('Add card', 'Ku dar kaar')}
          </button>
        </div>
      </div>

      {message && <p className={`text-sm ${message.ok ? 'text-emerald-700' : 'text-red-600'}`}>{message.text}</p>}

      {/* Section heading */}
      <section className="p-6 bg-surface border border-line space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-serif text-xl text-fg">{t('Section', 'Qaybta')}</h2>
          <label className="flex items-center gap-2.5 text-fg-2 cursor-pointer">
            <Switch on={section.active} onChange={() => setField('active', !section.active)} label="Show section" />
            {section.active ? t('Shown on homepage', 'Bogga hore wuu ka muuqdaa') : t('Hidden', 'Waa qarsoon yahay')}
          </label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <span className={label}>Title (English)</span>
            <input value={section.titleEn} onChange={(e) => setField('titleEn', e.target.value)} className={inputClass} />
          </div>
          <div>
            <span className={label}>Cinwaanka (Soomaali)</span>
            <input value={section.titleSo} onChange={(e) => setField('titleSo', e.target.value)} className={inputClass} />
          </div>
          <div>
            <span className={label}>Subtitle (English)</span>
            <input value={section.subtitleEn} onChange={(e) => setField('subtitleEn', e.target.value)} className={inputClass} />
          </div>
          <div>
            <span className={label}>Qoraal hoose (Soomaali)</span>
            <input value={section.subtitleSo} onChange={(e) => setField('subtitleSo', e.target.value)} className={inputClass} />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Card list */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex justify-between text-[11px] uppercase tracking-[0.14em] text-fg-3 px-1">
            <span>
              {t('Cards', 'Kaararka')} ({section.cards.length})
            </span>
            <span>
              {visible} {t('visible', 'muuqda')}
            </span>
          </div>
          {section.cards.map((c, i) => (
            <div
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className={`flex items-center gap-3 p-2.5 border bg-surface cursor-pointer transition-colors ${
                c.id === selected?.id ? 'border-fg' : 'border-line hover:border-line-strong'
              }`}
            >
              <div className={`w-14 h-16 bg-surface-3 overflow-hidden shrink-0 ${c.active ? '' : 'opacity-40 grayscale'}`}>
                {c.image ? <img src={c.image} alt="" className="w-full h-full object-cover" /> : <ImagePlus className="w-5 h-5 m-auto mt-5 text-fg-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm truncate ${c.active ? 'text-fg' : 'text-fg-3'}`}>{c.titleEn || t('New card', 'Kaar cusub')}</div>
                <div className="text-fg-3">{c.family === 'All' ? t('All perfumes', 'Dhammaan') : c.family}</div>
              </div>
              <Switch on={c.active} onChange={() => patchCard(c.id, { active: !c.active })} label={c.active ? 'Hide card' : 'Show card'} />
              <div className="flex flex-col">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    move(c.id, -1);
                  }}
                  disabled={i === 0}
                  aria-label="Move up"
                  className="p-1 text-fg-3 hover:text-fg disabled:opacity-30 cursor-pointer"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    move(c.id, 1);
                  }}
                  disabled={i === section.cards.length - 1}
                  aria-label="Move down"
                  className="p-1 text-fg-3 hover:text-fg disabled:opacity-30 cursor-pointer"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={addCard}
            className="w-full p-4 border border-dashed border-line-strong hover:border-fg text-fg-3 hover:text-fg flex items-center justify-center gap-2 cursor-pointer"
          >
            <ImagePlus className="w-4 h-4" strokeWidth={1.5} />
            {t('Add another card', 'Ku dar kaar kale')}
          </button>
        </div>

        {/* Card editor */}
        {selected ? (
          <div className="lg:col-span-8 p-6 bg-surface border border-line grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
            {/* Live preview, same look as the storefront card */}
            <div className="relative aspect-[3/4] bg-surface-3 overflow-hidden flex flex-col justify-end">
              {selected.image ? (
                <img src={selected.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-fg-4">
                  <ImagePlus className="w-8 h-8" strokeWidth={1.5} />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <div className="relative p-4 text-white">
                <div className="font-serif text-lg leading-tight">{(so ? selected.titleSo : selected.titleEn) || selected.titleEn || t('Title', 'Magac')}</div>
                <div className="text-[11px] text-white/70 mt-0.5">{so ? selected.descSo : selected.descEn}</div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <span className={label}>{t('Image', 'Sawir')}</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="px-3.5 py-2 bg-inverse hover:bg-inverse-hover text-on-inverse flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    <Upload className="w-3.5 h-3.5" strokeWidth={1.5} />
                    {uploading ? t('Processing…', 'Waa la diyaarinayaa…') : t('Upload', 'Soo geli')}
                  </button>
                  <input
                    value={selected.image.startsWith('data:') ? '' : selected.image}
                    onChange={(e) => patchCard(selected.id, { image: e.target.value.trim() })}
                    placeholder={t('or paste an image URL', 'ama ku dheji URL')}
                    className={`${inputClass} flex-1 min-w-[180px]`}
                  />
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-fg-3 w-full">{t('Or pick a product photo:', 'Ama dooro sawir cadar:')}</span>
                  {productPhotos.map((src) => (
                    <button
                      key={src}
                      onClick={() => patchCard(selected.id, { image: src })}
                      className={`w-10 h-12 overflow-hidden cursor-pointer ${selected.image === src ? 'ring-2 ring-fg' : 'opacity-70 hover:opacity-100'}`}
                      aria-label="Use this photo"
                    >
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className={label}>Title (English) *</span>
                  <input value={selected.titleEn} onChange={(e) => patchCard(selected.id, { titleEn: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <span className={label}>Magaca (Soomaali)</span>
                  <input value={selected.titleSo} onChange={(e) => patchCard(selected.id, { titleSo: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <span className={label}>Description (English)</span>
                  <input value={selected.descEn} onChange={(e) => patchCard(selected.id, { descEn: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <span className={label}>Sharaxaad (Soomaali)</span>
                  <input value={selected.descSo} onChange={(e) => patchCard(selected.id, { descSo: e.target.value })} className={inputClass} />
                </div>
              </div>

              <div>
                <span className={label}>{t('Opens catalogue filtered to', 'Marka la riixo wuxuu muujinayaa')}</span>
                <select
                  value={selected.family}
                  onChange={(e) => patchCard(selected.id, { family: e.target.value as CollectionCard['family'] })}
                  className={inputClass}
                >
                  {FAMILIES.map((f) => (
                    <option key={f} value={f}>
                      {f === 'All' ? t('All perfumes', 'Dhammaan cadarrada') : f}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end pt-2">
                <button onClick={() => removeCard(selected.id)} className="text-red-600 hover:underline flex items-center gap-1.5 cursor-pointer">
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                  {t('Delete card', 'Tirtir kaarka')}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="lg:col-span-8 text-sm text-fg-3">{t('No cards yet. Add one to start.', 'Kaar weli ma jiro. Ku dar mid.')}</p>
        )}
      </div>

      <div className="flex items-center justify-end gap-4">
        {dirty && <span className="text-amber-700">{t('Unsaved changes', 'Isbeddello aan la kaydin')}</span>}
        <button
          onClick={save}
          className="px-8 py-3.5 bg-inverse hover:bg-inverse-hover text-on-inverse uppercase tracking-[0.14em] flex items-center gap-2 cursor-pointer"
        >
          <Save className="w-4 h-4" strokeWidth={1.5} />
          {t('Save collections', 'Kaydi xulalka')}
        </button>
      </div>
    </div>
  );
};
