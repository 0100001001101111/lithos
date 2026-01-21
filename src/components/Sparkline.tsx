'use client';

import { Price } from '@/types';

interface SparklineProps {
  data: Price[];
  width?: number;
  height?: number;
}

export default function Sparkline({ data, width = 100, height = 32 }: SparklineProps) {
  if (data.length < 2) {
    return (
      <div
        className="bg-[var(--card-bg)] rounded"
        style={{ width, height }}
      />
    );
  }

  const prices = data.map(d => d.price_usd);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  const points = prices.map((price, i) => {
    const x = (i / (prices.length - 1)) * width;
    const y = height - ((price - min) / range) * height * 0.8 - height * 0.1;
    return `${x},${y}`;
  }).join(' ');

  const isPositive = prices[prices.length - 1] >= prices[0];
  const strokeColor = isPositive ? 'var(--positive)' : 'var(--negative)';

  return (
    <svg width={width} height={height} className="sparkline">
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        points={points}
      />
    </svg>
  );
}
