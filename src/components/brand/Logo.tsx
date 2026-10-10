import React from 'react';

interface LogoProps {
  name: string; // store name from settings, e.g. "DK Perfume"
  size?: 'sm' | 'md' | 'lg';
  tagline?: string; // small line under the descriptor, e.g. "London"
  className?: string;
}

const SIZES = {
  sm: { mark: 'text-[26px]', rule: 'h-6', word: 'text-[9px] tracking-[0.38em]', tag: 'text-[7px] tracking-[0.46em] mt-1' },
  md: { mark: 'text-[34px]', rule: 'h-8', word: 'text-[11px] tracking-[0.42em]', tag: 'text-[8px] tracking-[0.5em] mt-1.5' },
  lg: { mark: 'text-[52px]', rule: 'h-12', word: 'text-[14px] tracking-[0.45em]', tag: 'text-[10px] tracking-[0.55em] mt-2' },
};

// Wordmark: the first word set large in Bodoni as a monogram ("DK"), a hairline gold rule,
// then the rest of the name and the city in spaced capitals ("PERFUME / LONDON").
export const Logo: React.FC<LogoProps> = ({ name, size = 'md', tagline = 'London', className = '' }) => {
  const [mark, ...rest] = name.trim().split(/\s+/);
  const word = rest.join(' ');
  const s = SIZES[size];

  if (!word) {
    return <span className={`font-serif ${s.mark} leading-none text-fg ${className}`}>{mark}</span>;
  }

  return (
    <span className={`inline-flex items-center gap-3 text-fg ${className}`} aria-label={name}>
      <span className={`font-serif ${s.mark} leading-none tracking-tight`} aria-hidden="true">
        {mark}
      </span>
      <span className={`w-px ${s.rule} bg-gold`} aria-hidden="true" />
      <span className="flex flex-col items-start leading-none font-sans uppercase" aria-hidden="true">
        <span className={s.word}>{word}</span>
        {tagline && <span className={`${s.tag} text-fg-3`}>{tagline}</span>}
      </span>
    </span>
  );
};
