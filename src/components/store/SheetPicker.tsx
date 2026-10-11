import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';

export interface PickerItem {
  id: string;
  label: string;
  sub?: string; // second line, e.g. delivery time
  right?: string; // e.g. price
  lead?: string; // e.g. flag
  search?: string; // extra words to match
}

interface SheetPickerProps {
  title: string;
  items: PickerItem[];
  value: string;
  onChange: (id: string) => void;
  popular?: string[]; // ids shown first under "Popular"
  searchPlaceholder?: string;
  popularLabel?: string;
  allLabel?: string;
  emptyLabel?: string;
  triggerClassName?: string;
}

// A select replacement: a field-like button that opens a bottom sheet on phones (centered panel on larger
// screens) with search, so long lists such as countries are easy to use with a thumb.
export const SheetPicker: React.FC<SheetPickerProps> = ({
  title,
  items,
  value,
  onChange,
  popular = [],
  searchPlaceholder = 'Search',
  popularLabel = 'Popular',
  allLabel = 'All',
  emptyLabel = 'No results',
  triggerClassName = '',
}) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const selected = items.find((i) => i.id === value);
  const searchable = items.length > 8;

  useEffect(() => {
    if (!open) return;
    setQ('');
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    // Focus search on larger screens only; on phones the keyboard would cover the list
    if (searchable && window.matchMedia('(min-width: 640px)').matches) setTimeout(() => searchRef.current?.focus(), 50);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, searchable]);

  const { top, rest } = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const match = (i: PickerItem) => !needle || `${i.label} ${i.search ?? ''} ${i.id}`.toLowerCase().includes(needle);
    const filtered = items.filter(match);
    if (needle || !popular.length) return { top: [] as PickerItem[], rest: filtered };
    const pop = popular.map((id) => filtered.find((i) => i.id === id)).filter(Boolean) as PickerItem[];
    return { top: pop, rest: filtered };
  }, [items, q, popular]);

  const choose = (id: string) => {
    onChange(id);
    setOpen(false);
  };

  const row = (i: PickerItem) => {
    const active = i.id === value;
    return (
      <li key={i.id}>
        <button
          type="button"
          onClick={() => choose(i.id)}
          className={`w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors cursor-pointer ${active ? 'bg-surface-3' : 'hover:bg-surface-2'}`}
        >
          {i.lead && <span className="text-xl leading-none w-7 shrink-0 text-center">{i.lead}</span>}
          <span className="flex-1 min-w-0">
            <span className="block text-sm text-fg truncate">{i.label}</span>
            {i.sub && <span className="block text-xs text-fg-3 mt-0.5">{i.sub}</span>}
          </span>
          {i.right && <span className="text-sm font-mono text-fg shrink-0">{i.right}</span>}
          <Check className={`w-4 h-4 shrink-0 ${active ? 'text-gold' : 'invisible'}`} />
        </button>
      </li>
    );
  };

  const heading = (text: string) => <li className="px-5 pt-4 pb-1.5 text-[10px] uppercase tracking-[0.16em] text-fg-4">{text}</li>;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className={`w-full flex items-center gap-3 text-left cursor-pointer ${triggerClassName}`}
      >
        {selected?.lead && <span className="text-lg leading-none">{selected.lead}</span>}
        <span className="flex-1 min-w-0">
          <span className="block truncate text-fg">{selected?.label ?? title}</span>
          {selected?.sub && <span className="block text-xs text-fg-3 truncate">{selected.sub}</span>}
        </span>
        {selected?.right && <span className="font-mono text-fg shrink-0">{selected.right}</span>}
        <ChevronDown className="w-4 h-4 text-fg-3 shrink-0" strokeWidth={1.5} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label={title}>
          <div className="absolute inset-0 bg-black/50 animate-fadeIn" onClick={() => setOpen(false)} />
          <div className="relative w-full sm:max-w-md max-h-[85vh] sm:max-h-[70vh] flex flex-col bg-surface text-fg rounded-t-2xl sm:rounded-none shadow-2xl animate-fadeIn">
            {/* Grab handle (phones) */}
            <div className="sm:hidden flex justify-center pt-2.5">
              <span className="w-10 h-1 rounded-full bg-line-strong" />
            </div>
            <div className="flex items-center justify-between px-5 pt-3 pb-3">
              <h3 className="font-serif text-xl">{title}</h3>
              <button type="button" onClick={() => setOpen(false)} className="p-2 -mr-2 text-fg-3 hover:text-fg cursor-pointer" aria-label="Close">
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>
            {searchable && (
              <div className="px-5 pb-3">
                <div className="flex items-center gap-2 border border-line-strong focus-within:border-fg px-3">
                  <Search className="w-4 h-4 text-fg-3 shrink-0" strokeWidth={1.5} />
                  <input
                    ref={searchRef}
                    type="search"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="w-full bg-transparent py-2.5 text-base sm:text-sm text-fg outline-none placeholder-fg-4"
                  />
                </div>
              </div>
            )}
            <ul className="flex-1 overflow-y-auto overscroll-contain border-t border-line pb-[env(safe-area-inset-bottom)]">
              {top.length > 0 && (
                <>
                  {heading(popularLabel)}
                  {top.map(row)}
                  {heading(allLabel)}
                </>
              )}
              {rest.map(row)}
              {rest.length === 0 && <li className="px-5 py-8 text-center text-sm text-fg-3">{emptyLabel}</li>}
            </ul>
          </div>
        </div>
      )}
    </>
  );
};

// 🇬🇧 from "GB"
export const flagEmoji = (code: string) =>
  /^[A-Z]{2}$/.test(code) ? String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)) : '';
