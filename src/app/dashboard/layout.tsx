import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Dashboard navigation */}
      <div className="flex gap-6 mb-8 border-b border-[var(--border)] pb-4">
        <Link
          href="/dashboard/portfolio"
          className="text-[var(--text-primary)] font-medium hover:text-[var(--accent)]"
        >
          Portfolio
        </Link>
        <Link
          href="/dashboard/alerts"
          className="text-[var(--text-secondary)] font-medium hover:text-[var(--text-primary)]"
        >
          Alerts
        </Link>
        <Link
          href="/dashboard/settings"
          className="text-[var(--text-secondary)] font-medium hover:text-[var(--text-primary)]"
        >
          Settings
        </Link>
      </div>

      {children}
    </div>
  );
}
