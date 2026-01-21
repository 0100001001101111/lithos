'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Holding, Material, Price } from '@/types';
import PriceChart from '@/components/PriceChart';

interface HoldingDetailClientProps {
  holding: Holding & { material: Material };
  prices: Price[];
  currentPricePerGram: number;
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getVerificationBadge(status: string) {
  switch (status) {
    case 'certified':
      return (
        <span className="text-sm px-2 py-1 rounded bg-[var(--positive)]/20 text-[var(--positive)] border border-[var(--positive)]/30">
          ✓ Certified
        </span>
      );
    case 'self_verified':
      return (
        <span className="text-sm px-2 py-1 rounded bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/30">
          ✓ Self-verified
        </span>
      );
    default:
      return (
        <span className="text-sm px-2 py-1 rounded bg-[var(--border)] text-[var(--text-secondary)]">
          Unverified
        </span>
      );
  }
}

export default function HoldingDetailClient({
  holding,
  prices,
  currentPricePerGram,
}: HoldingDetailClientProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const currentValue = holding.quantity_grams * currentPricePerGram;
  const costBasis = holding.purchase_price_per_gram
    ? holding.quantity_grams * holding.purchase_price_per_gram
    : null;
  const profitLoss = costBasis !== null ? currentValue - costBasis : null;
  const profitLossPercent = costBasis && costBasis > 0 ? (profitLoss! / costBasis) * 100 : null;
  const isProfit = (profitLoss || 0) >= 0;

  const handleDelete = async () => {
    // In production, call API to delete
    console.log('Deleting holding:', holding.id);
    window.location.href = '/dashboard/portfolio';
  };

  return (
    <div>
      {/* Back link */}
      <Link
        href="/dashboard/portfolio"
        className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-6"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Portfolio
      </Link>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left column - Image and basic info */}
        <div className="md:col-span-1">
          {/* Image */}
          <div className="aspect-square bg-[var(--card-bg)] border border-[var(--border)] rounded-lg overflow-hidden mb-4">
            {holding.image_url ? (
              <img
                src={holding.image_url}
                alt={holding.name || holding.material.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl font-bold text-[var(--text-secondary)]">
                {holding.material.symbol || holding.material.name.slice(0, 2)}
              </div>
            )}
          </div>

          <button className="btn-secondary w-full mb-4">
            Upload New Photo
          </button>
        </div>

        {/* Right column - Details */}
        <div className="md:col-span-2">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">
                {holding.name || holding.material.name}
              </h1>
              <p className="text-[var(--text-secondary)]">
                {holding.material.name} {holding.material.symbol && `(${holding.material.symbol})`} · {holding.material.category.replace('_', ' ')}
              </p>
            </div>
            {holding.is_for_sale && (
              <span className="bg-[var(--warning)] text-black text-sm font-medium px-3 py-1 rounded">
                For Sale
              </span>
            )}
          </div>

          {/* Value card */}
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-6 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-[var(--text-secondary)] mb-1">Current Value</div>
                <div className="text-2xl font-bold text-[var(--text-primary)]">
                  {formatCurrency(currentValue)}
                </div>
              </div>
              <div>
                <div className="text-sm text-[var(--text-secondary)] mb-1">Quantity</div>
                <div className="text-xl font-bold text-[var(--text-primary)]">
                  {holding.quantity_grams}g
                </div>
              </div>
              <div>
                <div className="text-sm text-[var(--text-secondary)] mb-1">Price/Gram</div>
                <div className="text-xl font-bold text-[var(--text-primary)]">
                  {formatCurrency(currentPricePerGram)}
                </div>
              </div>
              {costBasis !== null && (
                <>
                  <div>
                    <div className="text-sm text-[var(--text-secondary)] mb-1">Cost Basis</div>
                    <div className="text-xl font-bold text-[var(--text-primary)]">
                      {formatCurrency(costBasis)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-[var(--text-secondary)] mb-1">P/L</div>
                    <div className={`text-xl font-bold ${isProfit ? 'price-up' : 'price-down'}`}>
                      {isProfit ? '+' : ''}{formatCurrency(profitLoss!)} ({isProfit ? '+' : ''}{profitLossPercent?.toFixed(1)}%)
                    </div>
                  </div>
                </>
              )}
              {holding.grade && (
                <div>
                  <div className="text-sm text-[var(--text-secondary)] mb-1">Grade</div>
                  <div className="text-xl font-bold text-[var(--text-primary)]">
                    {holding.grade}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Purchase details */}
          {(holding.purchase_date || holding.purchase_source) && (
            <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-[var(--text-primary)] mb-4">Purchase Details</h3>
              <dl className="space-y-2">
                {holding.purchase_date && (
                  <div className="flex justify-between">
                    <dt className="text-[var(--text-secondary)]">Purchased</dt>
                    <dd className="text-[var(--text-primary)]">
                      {new Date(holding.purchase_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </dd>
                  </div>
                )}
                {holding.purchase_source && (
                  <div className="flex justify-between">
                    <dt className="text-[var(--text-secondary)]">Source</dt>
                    <dd className="text-[var(--text-primary)]">{holding.purchase_source}</dd>
                  </div>
                )}
                {holding.purchase_price_per_gram && (
                  <div className="flex justify-between">
                    <dt className="text-[var(--text-secondary)]">Price Paid</dt>
                    <dd className="text-[var(--text-primary)]">
                      {formatCurrency(holding.quantity_grams * holding.purchase_price_per_gram)} ({formatCurrency(holding.purchase_price_per_gram)}/g)
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* Verification */}
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-[var(--text-primary)] mb-4">Verification</h3>
            <div className="mb-3">
              {getVerificationBadge(holding.verification_status)}
            </div>
            {holding.verification_notes && (
              <p className="text-[var(--text-secondary)] text-sm">
                {holding.verification_notes}
              </p>
            )}
            {holding.certificate_url && (
              <a
                href={holding.certificate_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[var(--accent)] text-sm mt-2 hover:underline"
              >
                View Certificate
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>

          {/* Notes */}
          {holding.notes && (
            <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-[var(--text-primary)] mb-4">Notes</h3>
              <p className="text-[var(--text-secondary)]">{holding.notes}</p>
            </div>
          )}

          {/* Value history chart */}
          <div className="mb-6">
            <h3 className="font-semibold text-[var(--text-primary)] mb-4">Price History</h3>
            <PriceChart prices={prices} unit="gram" />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Link href={`/dashboard/portfolio/${holding.id}/edit`} className="btn-secondary">
              Edit Holding
            </Link>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 text-[var(--negative)] border border-[var(--negative)]/30 rounded-lg hover:bg-[var(--negative)]/10"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3">
              Delete Holding?
            </h3>
            <p className="text-[var(--text-secondary)] mb-6">
              Are you sure you want to delete &quot;{holding.name || holding.material.name}&quot;? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-[var(--negative)] text-white rounded-lg hover:brightness-110"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
