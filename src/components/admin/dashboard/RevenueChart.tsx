import React, { useEffect, useMemo, useRef, useState } from 'react';
import { formatMoney, CURRENCY_SYMBOL } from '../../../lib/money';

export interface RevenuePoint {
  label: string; // tooltip / table label, e.g. "12 Mar" or "Week of 3 Mar"
  tick: string; // short x-axis label
  value: number;
}

interface RevenueChartProps {
  points: RevenuePoint[];
  height?: number;
  emptyText: string;
}

const PAD = { top: 16, right: 56, bottom: 28, left: 52 };

// Compact axis money: £0, £80, £1.2K
function compactMoney(n: number): string {
  if (n >= 1000) return `${CURRENCY_SYMBOL}${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '')}K`;
  return `${CURRENCY_SYMBOL}${Math.round(n)}`;
}

// Round the axis max up to a clean step so ticks land on readable values
function niceMax(max: number): { top: number; step: number } {
  if (max <= 0) return { top: 100, step: 25 };
  const rough = max / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= rough) ?? 10 * mag;
  return { top: Math.ceil(max / step) * step, step };
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ points, height = 240, emptyText }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(280, entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const total = points.reduce((s, p) => s + p.value, 0);
  const { top, step } = useMemo(() => niceMax(Math.max(...points.map((p) => p.value), 0)), [points]);

  const innerW = width - PAD.left - PAD.right;
  const innerH = height - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (points.length <= 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - (v / top) * innerH;

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  const area = points.length
    ? `${line} L${x(points.length - 1).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z`
    : '';
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
  // Thin out x labels so they never collide (~1 label per 70px)
  const every = Math.max(1, Math.ceil(points.length / Math.max(2, Math.floor(innerW / 70))));
  const last = points.length - 1;

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const box = (e.currentTarget as SVGRectElement).getBoundingClientRect();
    const rel = (e.clientX - box.left) / box.width;
    setHover(Math.max(0, Math.min(last, Math.round(rel * last))));
  };

  if (total === 0) {
    return (
      <div ref={wrapRef} className="flex items-center justify-center text-sm text-fg-3" style={{ height }}>
        {emptyText}
      </div>
    );
  }

  const h = hover !== null ? points[hover] : null;
  const tipLeft = hover !== null ? Math.min(Math.max(x(hover), 70), width - 70) : 0;

  return (
    <div ref={wrapRef} className="relative select-none">
      <svg width={width} height={height} role="img" aria-label={`Net sales over time, total ${formatMoney(total)}`}>
        {/* Recessive grid + y ticks */}
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} className="stroke-line" strokeWidth={1} />
            <text x={PAD.left - 10} y={y(t)} dy="0.32em" textAnchor="end" className="fill-fg-3 text-[11px] tabular-nums">
              {compactMoney(t)}
            </text>
          </g>
        ))}
        {/* X ticks */}
        {points.map((p, i) =>
          i % every === 0 || i === last ? (
            <text key={i} x={x(i)} y={height - 8} textAnchor="middle" className="fill-fg-3 text-[11px]">
              {p.tick}
            </text>
          ) : null
        )}

        {/* Area wash + 2px line */}
        <path d={area} className="fill-chart" fillOpacity={0.1} />
        <path d={line} fill="none" className="stroke-chart" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {/* End marker with surface ring + direct label (the one value we print) */}
        <circle cx={x(last)} cy={y(points[last].value)} r={4} className="fill-chart stroke-surface" strokeWidth={2} />
        <text x={x(last) + 10} y={y(points[last].value)} dy="0.32em" className="fill-fg text-[12px] tabular-nums">
          {compactMoney(points[last].value)}
        </text>

        {/* Crosshair */}
        {h && hover !== null && (
          <g pointerEvents="none">
            <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + innerH} className="stroke-fg-4" strokeWidth={1} />
            <circle cx={x(hover)} cy={y(h.value)} r={5} className="fill-chart stroke-surface" strokeWidth={2} />
          </g>
        )}

        {/* Hit area larger than the marks */}
        <rect
          x={PAD.left}
          y={PAD.top}
          width={innerW}
          height={innerH}
          fill="transparent"
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
        />
      </svg>

      {h && (
        <div
          className="absolute top-0 -translate-x-1/2 pointer-events-none bg-inverse text-on-inverse px-3 py-2 text-xs shadow-lg whitespace-nowrap"
          style={{ left: tipLeft }}
        >
          <div className="opacity-70">{h.label}</div>
          <div className="text-sm">{formatMoney(h.value)}</div>
        </div>
      )}
    </div>
  );
};
