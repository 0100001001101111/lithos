import Link from 'next/link';

export default async function HoldingDetailPage() {

  // Since we don't have auth set up, show a demo page
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
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
        Sign In Required
      </h1>
      <p className="text-[var(--text-secondary)] max-w-md mx-auto mb-6">
        You need to be signed in to view holding details.
      </p>
      <div className="flex justify-center gap-4">
        <Link href="/login" className="btn-primary">
          Sign In
        </Link>
        <Link href="/dashboard/portfolio" className="btn-secondary">
          Back to Portfolio
        </Link>
      </div>
    </div>
  );
}
