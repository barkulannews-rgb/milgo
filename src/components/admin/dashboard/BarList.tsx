import React, { useState } from 'react';

export interface BarRow {
  key: string;
  label: string;
  value: number;
  display: string; // formatted value printed at the bar tip
  detail?: string; // extra line shown on hover
}

interface BarListProps {
  rows: BarRow[];
  emptyText: string;
}

// Ranked horizontal bars in one hue: the label names each bar, so color carries no identity.
export const BarList: React.FC<BarListProps> = ({ rows, emptyText }) => {
  const [hover, setHover] = useState<string | null>(null);
  const max = Math.max(...rows.map((r) => r.value), 0);

  if (!rows.length || max === 0) return <p className="text-sm text-fg-3 py-6">{emptyText}</p>;

  return (
    <ul className="space-y-4">
      {rows.map((r) => {
        const pct = (r.value / max) * 100;
        const active = hover === r.key;
        return (
          <li
            key={r.key}
            onPointerEnter={() => setHover(r.key)}
            onPointerLeave={() => setHover(null)}
            className="cursor-default"
          >
            <div className="flex items-baseline justify-between gap-3 text-sm mb-1.5">
              <span className={`truncate transition-colors ${active ? 'text-fg' : 'text-fg-2'}`}>{r.label}</span>
              <span className="text-fg tabular-nums shrink-0">{r.display}</span>
            </div>
            <div className="h-2 bg-surface-3 overflow-hidden">
              <div
                className={`h-full bg-chart rounded-r-[4px] transition-[width,opacity] duration-500 ${hover && !active ? 'opacity-40' : ''}`}
                style={{ width: `${Math.max(pct, 2)}%` }}
              />
            </div>
            {active && r.detail && <div className="text-[11px] text-fg-3 mt-1">{r.detail}</div>}
          </li>
        );
      })}
    </ul>
  );
};
