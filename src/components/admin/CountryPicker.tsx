import React from 'react';
import { X } from 'lucide-react';
import { Language } from '../../types';
import { countryName, sortedCountries } from '../../lib/countries';

// Chip list of countries with a dropdown to add more
export const CountryPicker: React.FC<{ value: string[]; onChange: (v: string[]) => void; lang: Language; allowAll?: boolean }> = ({
  value,
  onChange,
  lang,
  allowAll,
}) => {
  const options = sortedCountries(lang).filter((c) => !value.includes(c.code));
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {value.length === 0 && <span className="text-[11px] text-fg-4 italic">{lang === 'so' ? 'Dal lama dooran' : 'No countries selected'}</span>}
        {value.map((code) => (
          <span key={code} className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full bg-surface-3 border border-line text-[11px] text-fg">
            {countryName(code, lang)}
            <button
              type="button"
              onClick={() => onChange(value.filter((c) => c !== code))}
              aria-label={`Remove ${code}`}
              className="p-0.5 rounded-full hover:bg-line text-fg-3 hover:text-fg cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <select
        value=""
        onChange={(e) => e.target.value && onChange([...value, e.target.value])}
        className="w-full max-w-xs bg-surface-2 border border-line-strong focus:border-gold p-2.5 text-fg text-xs outline-none"
      >
        <option value="">{lang === 'so' ? '+ Ku dar dal…' : '+ Add a country…'}</option>
        {allowAll && !value.includes('*') && <option value="*">{countryName('*', lang)}</option>}
        {options.map((c) => (
          <option key={c.code} value={c.code}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
};

