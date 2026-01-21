'use client';

import { PortfolioSummary } from '@/types';

interface ValueSummaryProps {
  summary: PortfolioSummary;
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatChange(value: number, percent: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${formatCurrency(value)} (${sign}${percent.toFixed(1)}%)`;
}

export function ValueSummary({ summary }: ValueSummaryProps) {
  const isProfit = summary.totalProfitLoss >= 0;
  const is24hPositive = summary.change24h >= 0;
  const is7dPositive = summary.change7d >= 0;

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {/* Total Value */}
        <div>
          <div className="text-sm text-[var(--text-secondary)] mb-1">Total Value</div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">
            {formatCurrency(summary.totalValue)}
          </div>
        </div>

        {/* 24h Change */}
        <div>
          <div className="text-sm text-[var(--text-secondary)] mb-1">24h Change</div>
          <div className={`text-lg font-bold ${is24hPositive ? 'price-up' : 'price-down'}`}>
            {formatChange(summary.change24h, summary.change24hPercent)}
          </div>
        </div>

        {/* 7d Change */}
        <div>
          <div className="text-sm text-[var(--text-secondary)] mb-1">7d Change</div>
          <div className={`text-lg font-bold ${is7dPositive ? 'price-up' : 'price-down'}`}>
            {formatChange(summary.change7d, summary.change7dPercent)}
          </div>
        </div>

        {/* Total P/L */}
        <div>
          <div className="text-sm text-[var(--text-secondary)] mb-1">Total P/L</div>
          <div className={`text-lg font-bold ${isProfit ? 'price-up' : 'price-down'}`}>
            {formatChange(summary.totalProfitLoss, summary.totalProfitLossPercent)}
          </div>
        </div>
      </div>
    </div>
  );
}
