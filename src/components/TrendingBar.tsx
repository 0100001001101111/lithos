'use client';

import Link from 'next/link';

export interface TrendingItem {
  slug: string;
  name: string;
  symbol: string;
  price: number;
  change_24h: number;
  unit: string;
}

interface TrendingBarProps {
  gainers: TrendingItem[];
  losers: TrendingItem[];
}

export default function TrendingBar({ gainers, losers }: TrendingBarProps) {
  if (gainers.length === 0 && losers.length === 0) {
    return null;
  }

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[var(--accent)]">🔥</span>
        <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
          Trending Now
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gainers */}
        <div>
          <h3 className="text-xs text-[var(--text-muted)] mb-2 uppercase tracking-wide">
            Top Gainers (24H)
          </h3>
          <div className="space-y-1">
            {gainers.length > 0 ? (
              gainers.map((item, i) => (
                <Link
                  key={item.slug}
                  href={`/materials/${item.slug}`}
                  className="flex items-center justify-between hover:bg-[var(--border)]/50 rounded px-2 py-1.5 -mx-2 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--text-muted)] text-sm w-4">{i + 1}</span>
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {item.name}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">{item.symbol}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--positive)] text-sm font-medium">
                      ↑ +{item.change_24h.toFixed(1)}%
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-[var(--text-muted)] py-2">No gainers today</p>
            )}
          </div>
        </div>

        {/* Losers */}
        <div>
          <h3 className="text-xs text-[var(--text-muted)] mb-2 uppercase tracking-wide">
            Top Losers (24H)
          </h3>
          <div className="space-y-1">
            {losers.length > 0 ? (
              losers.map((item, i) => (
                <Link
                  key={item.slug}
                  href={`/materials/${item.slug}`}
                  className="flex items-center justify-between hover:bg-[var(--border)]/50 rounded px-2 py-1.5 -mx-2 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--text-muted)] text-sm w-4">{i + 1}</span>
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {item.name}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">{item.symbol}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--negative)] text-sm font-medium">
                      ↓ {item.change_24h.toFixed(1)}%
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-[var(--text-muted)] py-2">No losers today</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
