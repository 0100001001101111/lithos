'use client';

import { useState, useMemo } from 'react';
import { Material, Price, News } from '@/types';
import PriceTable from '@/components/PriceTable';
import NewsFeed from '@/components/NewsFeed';
import CategoryTabs from '@/components/CategoryTabs';
import TrendingBar from '@/components/TrendingBar';
import { calculateTrending, filterMovers } from '@/lib/trending';

interface MaterialWithPrices extends Material {
  prices: Price[];
}

interface HomeClientProps {
  materials: MaterialWithPrices[];
  news: News[];
}

export default function HomeClient({ materials, news }: HomeClientProps) {
  const [activeCategory, setActiveCategory] = useState('all');

  // Calculate trending data
  const trending = useMemo(() => calculateTrending(materials), [materials]);

  // Filter materials based on active category
  const filteredMaterials = useMemo(() => {
    if (activeCategory === 'all') return materials;
    if (activeCategory === 'movers') return filterMovers(materials, 5);
    return materials.filter((m) => m.category === activeCategory);
  }, [materials, activeCategory]);

  // Calculate some stats for the header
  const totalMaterials = materials.length;
  const materialsWithPrices = materials.filter((m) => m.prices.length > 0).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
          Strategic Materials Dashboard
        </h1>
        <p className="text-[var(--text-secondary)]">
          Real-time prices for strategic metals, rare earths, and scientific collectibles
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-4">
          <div className="text-2xl font-bold text-[var(--text-primary)]">{totalMaterials}</div>
          <div className="text-sm text-[var(--text-secondary)]">Materials Tracked</div>
        </div>
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-4">
          <div className="text-2xl font-bold text-[var(--text-primary)]">
            {materials.filter((m) => m.category === 'strategic_metal').length}
          </div>
          <div className="text-sm text-[var(--text-secondary)]">Strategic Metals</div>
        </div>
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-4">
          <div className="text-2xl font-bold text-[var(--text-primary)]">
            {materials.filter((m) => m.category === 'rare_earth').length}
          </div>
          <div className="text-sm text-[var(--text-secondary)]">Rare Earths</div>
        </div>
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-4">
          <div className="text-2xl font-bold text-[var(--text-primary)]">
            {materials.filter((m) => m.category === 'collectible').length}
          </div>
          <div className="text-sm text-[var(--text-secondary)]">Collectibles</div>
        </div>
      </div>

      {/* Trending section */}
      <TrendingBar gainers={trending.gainers} losers={trending.losers} />

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Price table - 2/3 width on large screens */}
        <div className="lg:col-span-2">
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg overflow-hidden">
            <CategoryTabs
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />
            <div className="p-4">
              <PriceTable materials={filteredMaterials} />
            </div>
          </div>
        </div>

        {/* News sidebar - 1/3 width on large screens */}
        <div className="lg:col-span-1">
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg">
            <div className="px-4 py-3 border-b border-[var(--border)]">
              <h2 className="font-semibold text-[var(--text-primary)]">Latest News</h2>
            </div>
            <div className="p-2">
              <NewsFeed news={news} limit={15} />
              {news.length === 0 && (
                <div className="text-center py-8 text-[var(--text-secondary)] text-sm">
                  News will appear here once scrapers are active
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info banner */}
      {materialsWithPrices === 0 && (
        <div className="mt-8 bg-[var(--accent)]/10 border border-[var(--accent)]/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-[var(--accent)] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-medium text-[var(--text-primary)]">Price data coming soon</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Scrapers are being configured to pull live price data. Materials are seeded and ready.
                Run the price update cron job or add sample data to see prices populate.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
