import React, { useState } from 'react';
import { Star } from 'lucide-react';

// Read-only stars; partial values round to the nearest half visually by filling whole stars only
export const Stars: React.FC<{ value: number; size?: string }> = ({ value, size = 'w-3.5 h-3.5' }) => (
  <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Star key={n} className={`${size} ${n <= Math.round(value) ? 'fill-current text-gold' : 'text-line-strong'}`} strokeWidth={n <= Math.round(value) ? 0 : 1.5} />
    ))}
  </span>
);

// Clickable stars for giving a rating
export const StarInput: React.FC<{ value: number; onChange: (v: number) => void; label?: string }> = ({ value, onChange, label = 'Rating' }) => {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <span className="inline-flex items-center gap-1" role="radiogroup" aria-label={label} onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange(n)}
          className="p-0.5 cursor-pointer"
        >
          <Star className={`w-6 h-6 transition-colors ${n <= shown ? 'fill-current text-gold' : 'text-line-strong'}`} strokeWidth={n <= shown ? 0 : 1.5} />
        </button>
      ))}
    </span>
  );
};
