import React, { useRef, useState } from 'react';
import {
  ImagePlus,
  Upload,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Plus,
  Package,
} from 'lucide-react';
import { HeroSlide, Language, Product, StoreSettings } from '../../types';
import { storeRepo, DEFAULT_HERO_SLIDES } from '../../lib/storage';
import { getTranslation } from '../../lib/translations';
import { resolveHeroSlide } from '../../lib/heroSlides';

interface AdminHeroProps {
  lang: Language;
  onSettingsUpdated: (newSettings: StoreSettings) => void;
}

const newSlide = (): HeroSlide => ({
  id: `hero-${Date.now()}`,
  source: 'upload',
  image: '',
  headlineEn: '',
  headlineSo: '',
  subheadlineEn: '',
  subheadlineSo: '',
  tagLabel: 'Signature Collection',
  tagTitle: '',
  active: true,
});

export const AdminHero: React.FC<AdminHeroProps> = ({ lang, onSettingsUpdated }) => {
  const so = lang === 'so';
  const [slides, setSlides] = useState<HeroSlide[]>(() => storeRepo.getHeroSlides());
  const [selectedId, setSelectedId] = useState<string>(() => storeRepo.getHeroSlides()[0]?.id ?? '');
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [products] = useState<Product[]>(() => storeRepo.getProducts());
  const catalog = products.filter((p) => p.active && p.images[0]);

  const selected = slides.find((s) => s.id === selectedId) ?? slides[0];
  const selectedIndex = selected ? slides.indexOf(selected) : -1;
  const isProductSlide = selected?.source === 'product';
  const resolved = selected ? resolveHeroSlide(selected, products, lang) : null;
  const selectedProduct = isProductSlide ? products.find((p) => p.id === selected?.productId) : undefined;

  // A product slide whose product was deleted or deactivated is skipped on the storefront
  const isBroken = (slide: HeroSlide) =>
    slide.source === 'product' && !products.some((p) => p.id === slide.productId && p.active);

  const flash = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    if (type === 'success') setTimeout(() => setMessage(null), 2500);
  };

  const update = (next: HeroSlide[]) => {
    setSlides(next);
    setDirty(true);
  };

  const patchSelected = (patch: Partial<HeroSlide>) => {
    if (!selected) return;
    update(slides.map((s) => (s.id === selected.id ? { ...s, ...patch } : s)));
  };

  const handleAdd = () => {
    const slide = newSlide();
    update([...slides, slide]);
    setSelectedId(slide.id);
  };

  const handleDelete = (id: string) => {
    if (slides.length <= 1) {
      flash('error', so ? 'Ugu yaraan hal sawir waa inuu jiraa.' : 'At least one banner slide is required.');
      return;
    }
    const slide = slides.find((s) => s.id === id);
    const label = slide?.tagTitle || slide?.headlineEn || (so ? 'sawirkan' : 'this slide');
    if (!window.confirm(so ? `Ma tirtiraysaa "${label}"?` : `Delete "${label}"?`)) return;
    const next = slides.filter((s) => s.id !== id);
    update(next);
    if (selectedId === id) setSelectedId(next[0].id);
  };

  const handleMove = (id: string, delta: number) => {
    const i = slides.findIndex((s) => s.id === id);
    const j = i + delta;
    if (j < 0 || j >= slides.length) return;
    const next = [...slides];
    [next[i], next[j]] = [next[j], next[i]];
    update(next);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      flash('error', so ? 'Fadlan dooro fayl sawir ah (JPG, PNG, WEBP).' : 'Please choose an image file (JPG, PNG, WEBP).');
      return;
    }
    setUploading(true);
    try {
      patchSelected({ image: await storeRepo.uploadImage(file) });
      setMessage(null);
    } catch (err) {
      flash('error', (err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const toggleActive = (id: string) =>
    update(slides.map((s) => (s.id === id ? { ...s, active: !s.active } : s)));

  const handleSave = () => {
    const missingImage = slides.find((s) => s.source !== 'product' && !s.image.trim());
    if (missingImage) {
      setSelectedId(missingImage.id);
      flash('error', so ? 'Sawir kasta waa inuu leeyahay sawir (upload ama URL).' : 'Every uploaded slide needs an image (upload or URL).');
      return;
    }
    const missingProduct = slides.find((s) => s.source === 'product' && !s.productId);
    if (missingProduct) {
      setSelectedId(missingProduct.id);
      flash('error', so ? 'Fadlan dooro cadarka sawirkan lagu muujinayo.' : 'Please choose which product this slide features.');
      return;
    }
    if (!slides.some((s) => s.active)) {
      flash('error', so ? 'Ugu yaraan hal sawir waa inuu muuqdaa.' : 'At least one slide must be visible.');
      return;
    }
    const result = storeRepo.saveHeroSlides(slides);
    if (!result.success) {
      flash('error', result.error || 'Save failed.');
      return;
    }
    onSettingsUpdated(storeRepo.getSettings());
    setDirty(false);
    flash('success', so ? 'Waa la kaydiyay.' : 'Saved.');
  };

  const handleReset = () => {
    if (!window.confirm(so ? 'Ku celi sawirka asalka ah?' : 'Restore the original banner? Your slides will be replaced.')) return;
    update(DEFAULT_HERO_SLIDES.map((s) => ({ ...s })));
    setSelectedId(DEFAULT_HERO_SLIDES[0].id);
  };

  const inputClass =
    'w-full bg-surface-2 border border-line-strong focus:border-gold p-2.5 text-fg outline-none';

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-line">
        <div>
          <h1 className="font-serif text-3xl text-fg">
            {so ? 'Sawirka weyn' : 'Banner'}
          </h1>
          
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleReset}
            className="px-3.5 py-2 bg-surface hover:bg-surface-3 border border-line-strong text-xs font-medium text-fg-2 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {so ? 'Asalka' : 'Reset'}
          </button>
          <button
            onClick={handleAdd}
            className="px-3.5 py-2 bg-[#9b783e] hover:bg-[#85632e] text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            {so ? 'Ku dar Sawir' : 'Add Slide'}
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 text-xs flex items-center gap-2 border ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Slide list */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-fg-3 font-semibold px-1">
            <span>{so ? 'Sawirada' : 'Slides'} ({slides.length})</span>
            <span>{so ? 'Kala horreynta' : 'Order'}</span>
          </div>
          {slides.map((slide, i) => {
            const view = resolveHeroSlide(slide, products, lang);
            const broken = isBroken(slide);
            return (
            <div
              key={slide.id}
              onClick={() => setSelectedId(slide.id)}
              className={`group flex items-center gap-3 p-2.5 border cursor-pointer transition-all ${
                slide.id === selected?.id ? 'border-gold bg-surface shadow-sm' : 'border-line bg-surface hover:border-line-strong'
              }`}
            >
              <div className={`relative w-24 h-14 overflow-hidden bg-surface-3 shrink-0 ${slide.active ? '' : 'opacity-40 grayscale'}`}>
                {view?.image ? (
                  <img src={view.image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-fg-4">
                    <ImagePlus className="w-5 h-5" />
                  </div>
                )}
                <span className="absolute top-1 left-1 text-[10px] font-mono bg-black/60 text-white px-1.5">
                  {i + 1}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold truncate ${slide.active ? 'text-fg' : 'text-fg-3'}`}>
                  {view?.tagTitle || slide.headlineEn || (so ? 'Sawir cusub' : 'New slide')}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span
                    className={`text-[10px] px-1.5 py-0.5 font-semibold uppercase tracking-wider ${
                      slide.source === 'product' ? 'bg-blue-50 text-blue-700' : 'bg-surface-3 text-fg-3'
                    }`}
                  >
                    {slide.source === 'product' ? (so ? 'Cadar' : 'Product') : so ? 'Sawir' : 'Upload'}
                  </span>
                  {broken && (
                    <span className="text-[10px] text-red-600 flex items-center gap-0.5" title={so ? 'Cadarkan lama helo ama waa la joojiyay' : 'Product missing or inactive'}>
                      <AlertTriangle className="w-3 h-3" />
                      {so ? 'Lama helo' : 'Unavailable'}
                    </span>
                  )}
                </div>
              </div>
              {/* Quick on/off switch */}
              <button
                role="switch"
                aria-checked={slide.active}
                aria-label={slide.active ? 'Hide slide' : 'Show slide'}
                title={slide.active ? (so ? 'Jooji (qari)' : 'Stop showing') : so ? 'Muuji' : 'Show'}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleActive(slide.id);
                }}
                className={`relative w-9 h-5 rounded-full transition-colors shrink-0 cursor-pointer ${
                  slide.active ? 'bg-[#9b783e]' : 'bg-line-strong'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    slide.active ? 'translate-x-4' : ''
                  }`}
                />
              </button>
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMove(slide.id, -1);
                  }}
                  disabled={i === 0}
                  aria-label="Move up"
                  className="p-1 text-fg-3 hover:text-fg hover:bg-surface-3 disabled:opacity-30 cursor-pointer"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMove(slide.id, 1);
                  }}
                  disabled={i === slides.length - 1}
                  aria-label="Move down"
                  className="p-1 text-fg-3 hover:text-fg hover:bg-surface-3 disabled:opacity-30 cursor-pointer"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            );
          })}
          <button
            onClick={handleAdd}
            className="w-full p-4 border border-dashed border-line-strong hover:border-gold text-xs text-fg-3 hover:text-gold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <ImagePlus className="w-4 h-4" />
            {so ? 'Ku dar sawir cusub' : 'Add another slide'}
          </button>
        </div>

        {/* Editor */}
        {selected && (
          <div className="lg:col-span-8 p-6 bg-surface border border-line space-y-5 text-xs">
            {/* Live preview */}
            <div className="relative aspect-[21/9] overflow-hidden bg-canvas border border-line">
              {resolved?.image ? (
                <img
                  src={resolved.image}
                  alt=""
                  className="absolute inset-y-0 right-0 w-[78%] h-full object-cover [mask-image:linear-gradient(to_right,transparent,black_35%)]"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/50">
                  <ImagePlus className="w-8 h-8" />
                  <span>
                    {isProductSlide
                      ? so ? 'Cadar weli lama dooran' : 'No product selected yet'
                      : so ? 'Sawir weli lama dooran' : 'No image selected yet'}
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-canvas via-canvas/40 to-transparent" />
              <div className="absolute inset-0 p-5 sm:p-7 flex flex-col justify-center max-w-[55%]">
                <span className="font-serif text-fg text-lg sm:text-2xl leading-tight line-clamp-3">
                  {resolved?.headline || (so ? selected.headlineSo : selected.headlineEn) || getTranslation(lang, 'heroHeadline')}
                </span>
              </div>
              {resolved && (resolved.tagLabel || resolved.tagTitle) && (
                <div className="absolute bottom-3 right-4 text-right">
                  <span className="block text-[8px] uppercase tracking-[0.25em] text-gold font-bold">{resolved.tagLabel}</span>
                  <span className="font-serif text-sm text-fg">{resolved.tagTitle}</span>
                </div>
              )}
              <span className="absolute top-3 left-3 text-[10px] uppercase tracking-wider bg-black/50 text-white/80 px-2 py-1">
                {so ? 'Muuqaal hore' : 'Preview'} · {selectedIndex + 1}/{slides.length}
                {!selected.active && ` · ${so ? 'Waa la joojiyay' : 'Stopped'}`}
              </span>
            </div>

            {/* Source choice */}
            <div>
              <label className="block text-fg-2 mb-1.5 font-medium">{so ? 'Maxaa la muujinayaa?' : 'What should this slide show?'}</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-surface-2 border border-line">
                {(['product', 'upload'] as const).map((src) => {
                  const on = (selected.source ?? 'upload') === src;
                  const Icon = src === 'product' ? Package : Upload;
                  return (
                    <button
                      key={src}
                      type="button"
                      onClick={() => patchSelected({ source: src })}
                      className={`py-2.5 px-3 font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        on ? 'bg-surface text-fg shadow-sm border border-gold' : 'text-fg-3 hover:text-fg border border-transparent'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {src === 'product'
                        ? so ? 'Cadar dukaanka ku jira' : 'Product from catalog'
                        : so ? 'Sawir la soo geliyay' : 'Uploaded image'}
                    </button>
                  );
                })}
              </div>
            </div>

            {isProductSlide ? (
              /* Product picker */
              <div>
                <label className="block text-fg-2 mb-1.5 font-medium">
                  {so ? 'Dooro cadarka' : 'Choose a perfume'} *
                </label>
                {selected.productId && !catalog.some((p) => p.id === selected.productId) && (
                  <p className="mb-2 text-[11px] text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {so
                      ? 'Cadarkan lama heli karo. Dooro mid kale.'
                      : 'This product is unavailable. Pick another.'}
                  </p>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-72 overflow-y-auto pr-1">
                  {catalog.map((p) => {
                    const picked = p.id === selected.productId;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => patchSelected({ productId: p.id })}
                        className={`relative text-left overflow-hidden border-2 transition-all cursor-pointer ${
                          picked ? 'border-gold shadow-md' : 'border-line hover:border-line-strong'
                        }`}
                      >
                        <img src={p.images[0]} alt="" className="w-full aspect-[4/3] object-cover" referrerPolicy="no-referrer" />
                        <div className="p-2 bg-surface">
                          <p className="text-[11px] font-semibold text-fg truncate">{p.name}</p>
                          <p className="text-[10px] text-fg-3 truncate">{p.brand}</p>
                        </div>
                        {picked && (
                          <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#9b783e] text-white flex items-center justify-center">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-fg-3 mt-1.5">
                  {so ? 'Sawirka iyo qoraalka waxaa laga qaadanayaa cadarka.' : 'Uses the product’s image and text.'}
                </p>
              </div>
            ) : (
              /* Upload / URL */
              <div>
                <label className="block text-fg-2 mb-1.5 font-medium">{so ? 'Sawirka' : 'Image'} *</label>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="px-4 py-2.5 bg-inverse hover:bg-inverse-hover text-on-inverse font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 shrink-0"
                  >
                    <Upload className="w-4 h-4" />
                    {uploading ? (so ? 'Waa la diyaarinayaa…' : 'Processing…') : so ? 'Ka soo geli kombiyuutarka' : 'Upload from computer'}
                  </button>
                  <input
                    type="text"
                    placeholder={so ? 'ama ku dheji URL sawir (https://…)' : 'or paste an image URL (https://…)'}
                    value={selected.image.startsWith('data:') ? '' : selected.image}
                    onChange={(e) => patchSelected({ image: e.target.value.trim() })}
                    className={inputClass}
                  />
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
                <p className="text-[11px] text-fg-3 mt-1.5">
                  {so ? 'Ugu fiican: sawir ballaaran (16:9).' : 'Best: a wide 16:9 photo.'}
                </p>
              </div>
            )}

            {/* Texts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-fg-2 mb-1 font-medium">Headline (English)</label>
                <input
                  type="text"
                  value={selected.headlineEn}
                  placeholder={isProductSlide ? selectedProduct?.name ?? '' : getTranslation('en', 'heroHeadline')}
                  onChange={(e) => patchSelected({ headlineEn: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-fg-2 mb-1 font-medium">Cinwaanka (Soomaali)</label>
                <input
                  type="text"
                  value={selected.headlineSo}
                  placeholder={isProductSlide ? selectedProduct?.nameSo ?? '' : getTranslation('so', 'heroHeadline')}
                  onChange={(e) => patchSelected({ headlineSo: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-fg-2 mb-1 font-medium">Description (English)</label>
                <textarea
                  rows={3}
                  value={selected.subheadlineEn}
                  placeholder={isProductSlide ? selectedProduct?.description ?? '' : getTranslation('en', 'heroSubheadline')}
                  onChange={(e) => patchSelected({ subheadlineEn: e.target.value })}
                  className={`${inputClass} resize-none`}
                />
              </div>
              <div>
                <label className="block text-fg-2 mb-1 font-medium">Sharaxaad (Soomaali)</label>
                <textarea
                  rows={3}
                  value={selected.subheadlineSo}
                  placeholder={isProductSlide ? selectedProduct?.descriptionSo ?? '' : getTranslation('so', 'heroSubheadline')}
                  onChange={(e) => patchSelected({ subheadlineSo: e.target.value })}
                  className={`${inputClass} resize-none`}
                />
              </div>
              <div>
                <label className="block text-fg-2 mb-1 font-medium">{so ? 'Calaamad' : 'Caption'}</label>
                <input
                  type="text"
                  value={selected.tagLabel}
                  placeholder={isProductSlide ? selectedProduct?.brand ?? '' : ''}
                  onChange={(e) => patchSelected({ tagLabel: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-fg-2 mb-1 font-medium">{so ? 'Magaca cadarka' : 'Featured perfume name'}</label>
                <input
                  type="text"
                  value={selected.tagTitle}
                  placeholder={isProductSlide ? selectedProduct?.name ?? '' : ''}
                  onChange={(e) => patchSelected({ tagTitle: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
            <p className="text-[11px] text-fg-3 -mt-2">
              {so ? 'Qoraallada waa ikhtiyaari.' : 'Text fields are optional.'}
            </p>

            {/* Slide actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-line">
              <label className="flex items-center gap-2 text-fg-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.active}
                  onChange={(e) => patchSelected({ active: e.target.checked })}
                  className="accent-gold"
                />
                {selected.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>{so ? 'Ka muuji bogga hore' : 'Show on storefront'}</span>
              </label>
              <button
                onClick={() => handleDelete(selected.id)}
                className="px-3.5 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {so ? 'Tirtir sawirkan' : 'Delete slide'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Save bar */}
      <div className="flex items-center justify-end gap-4 pt-2">
        {dirty && (
          <span className="text-xs text-amber-700 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            {so ? 'Isbeddello aan la kaydin ayaa jira' : 'You have unsaved changes'}
          </span>
        )}
        <button
          onClick={handleSave}
          className="px-8 py-3.5 bg-inverse hover:bg-inverse-hover text-on-inverse font-semibold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all shadow-md shadow-black/10 text-xs"
        >
          <Save className="w-4 h-4 text-gold-inv" />
          <span>{so ? 'Kaydi Sawirada' : 'Save Banner'}</span>
        </button>
      </div>
    </div>
  );
};
