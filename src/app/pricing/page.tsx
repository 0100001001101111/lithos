import Link from 'next/link';

export const metadata = {
  title: 'Pricing - Lithos',
  description: 'Upgrade to Lithos Pro for unlimited price alerts, data exports, and more.',
};

const features = {
  free: [
    'View all material prices',
    'Full price history charts',
    'News aggregation',
    'Material information',
    'Basic search',
  ],
  pro: [
    'Everything in Free',
    'Unlimited price alerts',
    'Email notifications',
    'Export historical data (CSV)',
    'Weekly market digest',
    'Priority support',
    'Early access to new features',
  ],
};

export default function PricingPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-4">
          Simple, Transparent Pricing
        </h1>
        <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
          Track strategic materials for free, or upgrade to Pro for advanced features like price alerts and data exports.
        </p>
      </div>

      {/* Pricing cards */}
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Free tier */}
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Free</h2>
            <p className="text-[var(--text-secondary)]">
              Everything you need to track material prices
            </p>
          </div>

          <div className="mb-6">
            <div className="text-4xl font-bold text-[var(--text-primary)]">
              $0
              <span className="text-lg font-normal text-[var(--text-secondary)]">/month</span>
            </div>
          </div>

          <Link
            href="/"
            className="btn-secondary w-full text-center block mb-8"
          >
            Get Started
          </Link>

          <ul className="space-y-3">
            {features.free.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-[var(--positive)] flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-[var(--text-primary)]">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pro tier */}
        <div className="bg-gradient-to-br from-[var(--accent)]/10 to-purple-500/10 border-2 border-[var(--accent)] rounded-xl p-8 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="bg-[var(--accent)] text-[var(--background)] px-3 py-1 rounded-full text-sm font-medium">
              Most Popular
            </span>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Pro</h2>
            <p className="text-[var(--text-secondary)]">
              For serious collectors and investors
            </p>
          </div>

          <div className="mb-6">
            <div className="text-4xl font-bold text-[var(--text-primary)]">
              $12
              <span className="text-lg font-normal text-[var(--text-secondary)]">/month</span>
            </div>
            <div className="text-sm text-[var(--text-secondary)] mt-1">
              or $99/year (save 31%)
            </div>
          </div>

          <button
            className="btn-primary w-full text-center block mb-8"
          >
            Upgrade to Pro
          </button>

          <ul className="space-y-3">
            {features.pro.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-[var(--accent)] flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-[var(--text-primary)]">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-16 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] text-center mb-8">
          Frequently Asked Questions
        </h2>

        <div className="space-y-6">
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-6">
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">
              How do price alerts work?
            </h3>
            <p className="text-[var(--text-secondary)]">
              Set target prices for any material. When the price crosses your threshold, we&apos;ll send you an email notification immediately.
            </p>
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-6">
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">
              How often is price data updated?
            </h3>
            <p className="text-[var(--text-secondary)]">
              We update strategic metal prices daily from multiple sources. Collectible prices are updated based on recent eBay sold listings.
            </p>
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-6">
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">
              Can I cancel my subscription anytime?
            </h3>
            <p className="text-[var(--text-secondary)]">
              Yes, you can cancel anytime. Your Pro features will remain active until the end of your billing period.
            </p>
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-6">
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">
              What payment methods do you accept?
            </h3>
            <p className="text-[var(--text-secondary)]">
              We accept all major credit cards through Stripe. Your payment information is securely processed and never stored on our servers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
