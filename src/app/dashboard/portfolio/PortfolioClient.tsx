'use client';

import { useState } from 'react';
import { Material, HoldingWithValue, PortfolioSnapshot, PortfolioSummary } from '@/types';
import { HoldingsLimitResult } from '@/lib/holdings-limit';
import { ValueSummary } from '@/components/portfolio/ValueSummary';
import { PortfolioChart } from '@/components/portfolio/PortfolioChart';
import { HoldingCard } from '@/components/portfolio/HoldingCard';
import { AllocationPie } from '@/components/portfolio/AllocationPie';
import { HoldingForm, HoldingFormData } from '@/components/portfolio/HoldingForm';
import { UpgradePrompt } from '@/components/portfolio/UpgradePrompt';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface PortfolioClientProps {
  materials: Material[];
  holdings: HoldingWithValue[];
  snapshots: PortfolioSnapshot[];
  summary: PortfolioSummary;
  isPro: boolean;
  holdingsLimit: HoldingsLimitResult;
  isLoggedIn?: boolean;
  userEmail?: string;
  isDemo?: boolean;
}

export default function PortfolioClient({
  materials,
  holdings,
  snapshots,
  summary,
  isPro,
  holdingsLimit,
  isLoggedIn = false,
  userEmail: _userEmail,
  isDemo = false,
}: PortfolioClientProps) {
  // userEmail available for future use (e.g., account settings)
  void _userEmail;
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const handleAddHolding = async (data: HoldingFormData) => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        alert('Please sign in to add holdings');
        return;
      }

      const response = await fetch('/api/holdings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to save holding'}`);
        return;
      }

      setShowAddForm(false);
      // Refresh page to show new holding
      window.location.reload();
    } catch (error) {
      console.error('Error adding holding:', error);
      alert('Failed to save holding. Please try again.');
    }
  };

  if (!isLoggedIn && !isDemo) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 mx-auto mb-6 bg-[var(--card-bg)] border border-[var(--border)] rounded-full flex items-center justify-center">
          <svg
            className="w-10 h-10 text-[var(--text-secondary)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
          Track Your Holdings
        </h1>
        <p className="text-[var(--text-secondary)] max-w-md mx-auto mb-6">
          Log your physical holdings, upload photos, and track your portfolio value over time.
          Sign in to get started.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/login" className="btn-primary">
            Sign In
          </Link>
          <Link href="/" className="btn-secondary">
            Browse Materials
          </Link>
        </div>

        {/* Feature preview */}
        <div className="mt-16 grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-6 text-left">
            <div className="w-10 h-10 bg-[var(--accent)]/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">Photo Gallery</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Upload photos of your specimens and create a visual catalog of your collection.
            </p>
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-6 text-left">
            <div className="w-10 h-10 bg-[var(--positive)]/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-[var(--positive)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">Value Tracking</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              See your portfolio value change over time with automatic price updates.
            </p>
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-6 text-left">
            <div className="w-10 h-10 bg-[var(--warning)]/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-[var(--warning)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">Verification</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Track provenance and verification status for each item in your collection.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Demo mode banner */}
      {isDemo && (
        <div className="mb-6 bg-[var(--accent)]/10 border border-[var(--accent)]/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--accent)]/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-[var(--text-primary)]">Demo Mode</p>
                <p className="text-sm text-[var(--text-secondary)]">
                  This is sample data. Sign up to track your own holdings.
                </p>
              </div>
            </div>
            <Link href="/signup" className="btn-primary">
              Sign Up Free
            </Link>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">My Portfolio</h1>
        {isDemo ? (
          <Link href="/signup" className="btn-primary">
            Sign Up to Add Holdings
          </Link>
        ) : holdingsLimit.allowed ? (
          <button onClick={() => setShowAddForm(true)} className="btn-primary">
            + Add Holding
          </button>
        ) : (
          <Link href="/pricing" className="btn-primary">
            Upgrade to Add More
          </Link>
        )}
      </div>

      {/* Add holding modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Add New Holding</h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <HoldingForm
              materials={materials}
              isPro={isPro}
              onSubmit={handleAddHolding}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        </div>
      )}

      {/* Value summary */}
      <ValueSummary summary={summary} />

      {/* Chart */}
      <div className="mt-6">
        <PortfolioChart snapshots={snapshots} currentValue={summary.totalValue} />
      </div>

      {/* Holdings grid */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Holdings ({holdings.length})
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-[var(--border)]' : ''}`}
            >
              <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-[var(--border)]' : ''}`}
            >
              <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {holdings.length === 0 ? (
          <div className="text-center py-12 bg-[var(--card-bg)] border border-[var(--border)] rounded-lg">
            <p className="text-[var(--text-secondary)] mb-4">
              You haven&apos;t added any holdings yet.
            </p>
            <button onClick={() => setShowAddForm(true)} className="btn-primary">
              Add Your First Holding
            </button>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-3'}>
            {holdings.map((holding) => (
              <HoldingCard key={holding.id} holding={holding} />
            ))}
          </div>
        )}

        {/* Upgrade prompt at limit */}
        {!holdingsLimit.allowed && (
          <div className="mt-6">
            <UpgradePrompt
              currentCount={holdingsLimit.currentCount}
              limit={holdingsLimit.limit}
            />
          </div>
        )}
      </div>

      {/* Allocation breakdown */}
      {holdings.length > 0 && (
        <div className="mt-8">
          <AllocationPie holdings={holdings} />
        </div>
      )}
    </div>
  );
}
