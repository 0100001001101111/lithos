'use client';

import Link from 'next/link';

interface UpgradePromptProps {
  currentCount?: number;
  limit: number;
}

export function UpgradePrompt({ limit }: UpgradePromptProps) {
  return (
    <div className="bg-gradient-to-r from-[var(--accent)]/10 to-purple-600/10 border border-[var(--accent)]/30 rounded-lg p-6 text-center">
      <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
        You&apos;ve used all {limit} free holdings
      </h3>
      <p className="text-[var(--text-secondary)] mb-4">
        Upgrade to Pro for unlimited holdings, image uploads, and price alerts.
      </p>
      <Link
        href="/pricing"
        className="inline-block btn-primary px-6 py-3"
      >
        Upgrade to Pro — $12/month
      </Link>
      <p className="text-sm text-[var(--text-secondary)] mt-3">
        or $99/year (save 31%)
      </p>
    </div>
  );
}
