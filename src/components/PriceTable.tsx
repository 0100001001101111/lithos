'use client';

import Link from 'next/link';
import { Material, Price } from '@/types';
import Sparkline from './Sparkline';

interface MaterialWithPriceData extends Material {
  prices: Price[];
}

interface PriceTableProps {
  materials: MaterialWithPriceData[];
}

function formatPrice(price: number | null): string {
  if (price === null) return '—';
  if (price >= 1000) {
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
  return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function calculateChange(prices: Price[], days: number): number | null {
  if (prices.length < 2) return null;

  const now = new Date();
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const currentPrice = prices[0]?.price_usd;
  const oldPrice = prices.find(p => new Date(p.recorded_at) <= cutoff)?.price_usd || prices[prices.length - 1]?.price_usd;

  if (!currentPrice || !oldPrice) return null;
  return ((currentPrice - oldPrice) / oldPrice) * 100;
}

function PriceChange({ value }: { value: number | null }) {
  if (value === null) return <span className="text-[var(--text-secondary)]">—</span>;

  const isPositive = value > 0;
  const isNeutral = Math.abs(value) < 0.01;

  return (
    <span className={isNeutral ? 'price-neutral' : isPositive ? 'price-up' : 'price-down'}>
      {isPositive ? '+' : ''}{value.toFixed(1)}%
    </span>
  );
}

function getCategoryBadge(category: string) {
  const badges: Record<string, { class: string; label: string }> = {
    strategic_metal: { class: 'badge-strategic', label: 'Strategic' },
    rare_earth: { class: 'badge-rare-earth', label: 'Rare Earth' },
    collectible: { class: 'badge-collectible', label: 'Collectible' },
  };

  const badge = badges[category] || { class: '', label: category };
  return <span className={`badge ${badge.class}`}>{badge.label}</span>;
}

export default function PriceTable({ materials }: PriceTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left text-[var(--text-secondary)] text-sm border-b border-[var(--border)]">
            <th className="pb-3 font-medium">#</th>
            <th className="pb-3 font-medium">Material</th>
            <th className="pb-3 font-medium text-right">Price</th>
            <th className="pb-3 font-medium text-right">24h</th>
            <th className="pb-3 font-medium text-right">7d</th>
            <th className="pb-3 font-medium text-right">30d</th>
            <th className="pb-3 font-medium">Last 30 Days</th>
          </tr>
        </thead>
        <tbody>
          {materials.map((material, index) => {
            const currentPrice = material.prices[0]?.price_usd || null;
            const change24h = calculateChange(material.prices, 1);
            const change7d = calculateChange(material.prices, 7);
            const change30d = calculateChange(material.prices, 30);

            return (
              <tr
                key={material.slug}
                className="border-b border-[var(--border)] hover:bg-[var(--card-bg)] transition-colors"
              >
                <td className="py-4 text-[var(--text-secondary)]">{index + 1}</td>
                <td className="py-4">
                  <Link href={`/materials/${material.slug}`} className="flex items-center gap-3 group">
                    <div className="w-8 h-8 rounded-full bg-[var(--card-bg)] border border-[var(--border)] flex items-center justify-center text-xs font-bold text-[var(--text-primary)]">
                      {material.symbol || material.name.slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-medium text-[var(--text-primary)] group-hover:text-[var(--accent)]">
                        {material.name}
                      </div>
                      <div className="text-xs text-[var(--text-secondary)]">
                        {getCategoryBadge(material.category)}
                      </div>
                    </div>
                  </Link>
                </td>
                <td className="py-4 text-right">
                  <div className="font-medium text-[var(--text-primary)]">
                    {formatPrice(currentPrice)}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)]">
                    per {material.unit}
                  </div>
                </td>
                <td className="py-4 text-right font-medium">
                  <PriceChange value={change24h} />
                </td>
                <td className="py-4 text-right font-medium">
                  <PriceChange value={change7d} />
                </td>
                <td className="py-4 text-right font-medium">
                  <PriceChange value={change30d} />
                </td>
                <td className="py-4">
                  <Sparkline data={material.prices.slice(0, 30).reverse()} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
