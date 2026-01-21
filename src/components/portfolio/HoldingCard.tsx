'use client';

import Link from 'next/link';
import { HoldingWithValue } from '@/types';

interface HoldingCardProps {
  holding: HoldingWithValue;
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getVerificationBadge(status: string) {
  switch (status) {
    case 'certified':
      return (
        <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--positive)]/20 text-[var(--positive)]">
          Certified
        </span>
      );
    case 'self_verified':
      return (
        <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--accent)]/20 text-[var(--accent)]">
          Verified
        </span>
      );
    default:
      return null;
  }
}

export function HoldingCard({ holding }: HoldingCardProps) {
  const isPositive = (holding.profit_loss_percent || 0) >= 0;

  return (
    <Link
      href={`/dashboard/portfolio/${holding.id}`}
      className="block bg-[var(--card-bg)] border border-[var(--border)] rounded-lg overflow-hidden hover:border-[var(--text-secondary)] transition-colors"
    >
      {/* Image */}
      <div className="aspect-square bg-[var(--border)] relative">
        {holding.image_url ? (
          <img
            src={holding.image_url}
            alt={holding.name || holding.material.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-[var(--text-secondary)]">
            {holding.material.symbol || holding.material.name.slice(0, 2)}
          </div>
        )}
        {holding.is_for_sale && (
          <div className="absolute top-2 right-2 bg-[var(--warning)] text-black text-xs font-medium px-2 py-0.5 rounded">
            For Sale
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-medium text-[var(--text-primary)] line-clamp-1">
            {holding.name || holding.material.name}
          </h3>
          {getVerificationBadge(holding.verification_status)}
        </div>

        <p className="text-sm text-[var(--text-secondary)] mb-3">
          {holding.quantity_grams}g {holding.grade && `· ${holding.grade}`}
        </p>

        <div className="flex items-end justify-between">
          <div>
            <div className="text-lg font-bold text-[var(--text-primary)]">
              {formatCurrency(holding.current_value)}
            </div>
            {holding.profit_loss_percent !== null && (
              <div className={`text-sm font-medium ${isPositive ? 'price-up' : 'price-down'}`}>
                {isPositive ? '+' : ''}{holding.profit_loss_percent.toFixed(1)}%
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
