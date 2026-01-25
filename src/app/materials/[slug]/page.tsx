import { supabase } from '@/lib/supabase';
import { Material, Price, News } from '@/types';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import PriceChart from '@/components/PriceChart';
import NewsFeed from '@/components/NewsFeed';

export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getMaterial(slug: string) {
  const { data: material, error } = await supabase
    .from('lithos_materials')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !material) return null;
  return material as Material;
}

async function getPrices(slug: string) {
  const { data: prices, error } = await supabase
    .from('lithos_prices')
    .select('*')
    .eq('material_slug', slug)
    .order('recorded_at', { ascending: false })
    .limit(365); // Up to a year of data for chart

  if (error) return [];
  return prices as Price[];
}

// Get ALL prices for ATH/ATL stats (no limit)
async function getAllPricesForStats(slug: string): Promise<number[]> {
  const { data: prices, error } = await supabase
    .from('lithos_prices')
    .select('price_usd')
    .eq('material_slug', slug);

  if (error || !prices) return [];
  return prices.map((p) => p.price_usd);
}

async function getRelatedNews(slug: string) {
  const { data: news, error } = await supabase
    .from('lithos_news')
    .select('*')
    .contains('material_tags', [slug])
    .order('published_at', { ascending: false })
    .limit(10);

  if (error) return [];
  return news as News[];
}

function getCategoryBadge(category: string) {
  const badges: Record<string, { class: string; label: string }> = {
    strategic_metal: { class: 'badge-strategic', label: 'Strategic Metal' },
    rare_earth: { class: 'badge-rare-earth', label: 'Rare Earth' },
    collectible: { class: 'badge-collectible', label: 'Collectible' },
  };
  const badge = badges[category] || { class: '', label: category };
  return <span className={`badge ${badge.class}`}>{badge.label}</span>;
}

function formatPrice(price: number | null, unit: string): string {
  if (price === null) return 'No data';
  return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / ${unit}`;
}

// Get ATH/ATL with outlier filtering
// - ATL: Use 5th percentile to filter out bad low data (like $0.07 misclassified auctions)
// - ATH: Use actual maximum (historical peaks like $30+ from 2006 are genuine, not outliers)
function getFilteredStats(arr: number[]): { high: number | null; low: number | null; avg: number | null } {
  if (arr.length === 0) return { high: null, low: null, avg: null };

  const sorted = [...arr].sort((a, b) => a - b);

  // For ATL: use 5th percentile to filter out extremely low outliers (bad data)
  const lowIndex = Math.max(0, Math.floor(sorted.length * 0.05));
  const allTimeLow = sorted[lowIndex];

  // For ATH: use actual maximum (historical peaks are genuine data, not outliers)
  const allTimeHigh = sorted[sorted.length - 1];

  // Average uses all data
  const avg = arr.reduce((a, b) => a + b, 0) / arr.length;

  return { high: allTimeHigh, low: allTimeLow, avg };
}

export default async function MaterialPage({ params }: PageProps) {
  const { slug } = await params;
  const [material, prices, news, allPrices] = await Promise.all([
    getMaterial(slug),
    getPrices(slug),
    getRelatedNews(slug),
    getAllPricesForStats(slug), // Fetch ALL prices for ATH/ATL stats
  ]);

  if (!material) {
    notFound();
  }

  const currentPrice = prices[0]?.price_usd || null;

  // Use ALL historical prices for ATH/ATL stats with IQR outlier filtering
  // This preserves genuine historical peaks while removing bad data
  const stats = getFilteredStats(allPrices);
  const allTimeHigh = stats.high;
  const allTimeLow = stats.low;
  const avgPrice = stats.avg;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-6"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[var(--card-bg)] border border-[var(--border)] flex items-center justify-center text-2xl font-bold text-[var(--text-primary)]">
            {material.symbol || material.name.slice(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-[var(--text-primary)]">{material.name}</h1>
              {material.symbol && (
                <span className="text-lg text-[var(--text-secondary)]">({material.symbol})</span>
              )}
            </div>
            {getCategoryBadge(material.category)}
          </div>
        </div>

        <div className="text-right">
          <div className="text-3xl font-bold text-[var(--text-primary)]">
            {formatPrice(currentPrice, material.unit)}
          </div>
          {prices.length > 1 && (
            <div className="text-sm text-[var(--text-secondary)] mt-1">
              Last updated: {new Date(prices[0].recorded_at).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart and stats - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Price chart */}
          <PriceChart prices={prices} unit={material.unit} />

          {/* Key stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-4">
              <div className="text-sm text-[var(--text-secondary)] mb-1">Current Price</div>
              <div className="text-lg font-bold text-[var(--text-primary)]">
                {currentPrice ? `$${currentPrice.toLocaleString()}` : '—'}
              </div>
            </div>
            <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-4">
              <div className="text-sm text-[var(--text-secondary)] mb-1">All-Time High</div>
              <div className="text-lg font-bold text-[var(--positive)]">
                {allTimeHigh ? `$${allTimeHigh.toLocaleString()}` : '—'}
              </div>
            </div>
            <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-4">
              <div className="text-sm text-[var(--text-secondary)] mb-1">All-Time Low</div>
              <div className="text-lg font-bold text-[var(--negative)]">
                {allTimeLow ? `$${allTimeLow.toLocaleString()}` : '—'}
              </div>
            </div>
            <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-4">
              <div className="text-sm text-[var(--text-secondary)] mb-1">Average Price</div>
              <div className="text-lg font-bold text-[var(--text-primary)]">
                {avgPrice ? `$${avgPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—'}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-6">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">About {material.name}</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">{material.description}</p>
          </div>

          {/* Supply and demand info */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Supply */}
            <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Supply Information</h3>
              {material.supply_info && (
                <dl className="space-y-3">
                  {material.supply_info.annual_production_tonnes && (
                    <div>
                      <dt className="text-sm text-[var(--text-secondary)]">Annual Production</dt>
                      <dd className="text-[var(--text-primary)] font-medium">
                        {material.supply_info.annual_production_tonnes.toLocaleString()} tonnes
                      </dd>
                    </div>
                  )}
                  {material.supply_info.annual_finds && (
                    <div>
                      <dt className="text-sm text-[var(--text-secondary)]">Availability</dt>
                      <dd className="text-[var(--text-primary)] font-medium">
                        {material.supply_info.annual_finds}
                      </dd>
                    </div>
                  )}
                  {material.supply_info.main_producers && (
                    <div>
                      <dt className="text-sm text-[var(--text-secondary)]">Main Producers</dt>
                      <dd className="text-[var(--text-primary)] font-medium">
                        {material.supply_info.main_producers.join(', ')}
                      </dd>
                    </div>
                  )}
                  {material.supply_info.main_sources && (
                    <div>
                      <dt className="text-sm text-[var(--text-secondary)]">Main Sources</dt>
                      <dd className="text-[var(--text-primary)] font-medium">
                        {material.supply_info.main_sources.join(', ')}
                      </dd>
                    </div>
                  )}
                </dl>
              )}
            </div>

            {/* Demand */}
            <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Demand Drivers</h3>
              {material.demand_info && (
                <dl className="space-y-3">
                  {material.demand_info.industries && (
                    <div>
                      <dt className="text-sm text-[var(--text-secondary)]">Key Industries</dt>
                      <dd className="flex flex-wrap gap-2 mt-1">
                        {material.demand_info.industries.map((industry) => (
                          <span
                            key={industry}
                            className="px-2 py-1 bg-[var(--border)] rounded text-sm text-[var(--text-primary)]"
                          >
                            {industry}
                          </span>
                        ))}
                      </dd>
                    </div>
                  )}
                  {material.demand_info.key_applications && (
                    <div>
                      <dt className="text-sm text-[var(--text-secondary)]">Applications</dt>
                      <dd className="text-[var(--text-primary)] font-medium">
                        {material.demand_info.key_applications.join(', ')}
                      </dd>
                    </div>
                  )}
                  {material.demand_info.key_features && (
                    <div>
                      <dt className="text-sm text-[var(--text-secondary)]">Key Features</dt>
                      <dd className="text-[var(--text-primary)] font-medium">
                        {material.demand_info.key_features.join(', ')}
                      </dd>
                    </div>
                  )}
                </dl>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - 1/3 width */}
        <div className="space-y-6">
          {/* Price alert CTA */}
          <div className="bg-gradient-to-br from-[var(--accent)]/10 to-purple-500/10 border border-[var(--accent)]/30 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              Set Price Alert
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Get notified when {material.name} reaches your target price
            </p>
            <Link href="/pricing" className="btn-primary block text-center">
              Upgrade to Pro
            </Link>
          </div>

          {/* Related news */}
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg">
            <div className="px-4 py-3 border-b border-[var(--border)]">
              <h3 className="font-semibold text-[var(--text-primary)]">Related News</h3>
            </div>
            <div className="p-2">
              {news.length > 0 ? (
                <NewsFeed news={news} limit={5} />
              ) : (
                <p className="text-sm text-[var(--text-secondary)] text-center py-4">
                  No recent news for {material.name}
                </p>
              )}
            </div>
          </div>

          {/* Where to buy */}
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Where to Buy</h3>
            <div className="space-y-3">
              {material.category === 'collectible' ? (
                <>
                  <a
                    href="https://www.ebay.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-[var(--border)]/50 rounded-lg hover:bg-[var(--border)] transition-colors"
                  >
                    <span className="text-[var(--text-primary)]">eBay</span>
                    <svg className="w-4 h-4 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                  <a
                    href="https://www.meteorites-for-sale.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-[var(--border)]/50 rounded-lg hover:bg-[var(--border)] transition-colors"
                  >
                    <span className="text-[var(--text-primary)]">Meteorites for Sale</span>
                    <svg className="w-4 h-4 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </>
              ) : (
                <>
                  <a
                    href="https://www.strategicmetalsinvest.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-[var(--border)]/50 rounded-lg hover:bg-[var(--border)] transition-colors"
                  >
                    <span className="text-[var(--text-primary)]">Strategic Metals Invest</span>
                    <svg className="w-4 h-4 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                  <a
                    href="https://www.amazon.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-[var(--border)]/50 rounded-lg hover:bg-[var(--border)] transition-colors"
                  >
                    <span className="text-[var(--text-primary)]">Amazon (Element Samples)</span>
                    <svg className="w-4 h-4 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Generate static paths for all materials
export async function generateStaticParams() {
  const { data: materials } = await supabase
    .from('lithos_materials')
    .select('slug');

  return (materials || []).map((material) => ({
    slug: material.slug,
  }));
}
