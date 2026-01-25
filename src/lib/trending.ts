import { Material, Price } from '@/types';
import { TrendingItem } from '@/components/TrendingBar';

interface MaterialWithPrices extends Material {
  prices: Price[];
}

export interface TrendingData {
  gainers: TrendingItem[];
  losers: TrendingItem[];
}

export function calculateTrending(materials: MaterialWithPrices[]): TrendingData {
  const withChanges = materials
    .map((m) => {
      const prices = m.prices || [];
      if (prices.length === 0) return null;

      // Get the most recent price
      const sortedPrices = [...prices].sort(
        (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
      );

      const current = sortedPrices[0]?.price_usd || 0;

      // Find price from ~24 hours ago
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const yesterdayPrice = sortedPrices.find(
        (p) => new Date(p.recorded_at).getTime() < oneDayAgo
      );
      const yesterday = yesterdayPrice?.price_usd || current;

      // Calculate percentage change
      const change_24h = yesterday > 0
        ? ((current - yesterday) / yesterday) * 100
        : 0;

      // Skip items with no change or extreme changes (data artifacts)
      if (change_24h === 0) return null;
      if (Math.abs(change_24h) > 200) return null;

      return {
        slug: m.slug,
        name: m.name,
        symbol: m.symbol || '',
        price: current,
        change_24h,
        unit: m.unit,
      } as TrendingItem;
    })
    .filter((item): item is TrendingItem => item !== null);

  // Sort by change percentage
  const sorted = [...withChanges].sort((a, b) => b.change_24h - a.change_24h);

  // Get top 3 gainers (positive change) and top 3 losers (negative change)
  const gainers = sorted.filter((item) => item.change_24h > 0).slice(0, 3);
  const losers = sorted.filter((item) => item.change_24h < 0).slice(-3).reverse();

  return { gainers, losers };
}

export function filterMovers(materials: MaterialWithPrices[], threshold: number = 5): MaterialWithPrices[] {
  return materials
    .map((m) => {
      const prices = m.prices || [];
      if (prices.length === 0) return { ...m, change_24h: 0 };

      const sortedPrices = [...prices].sort(
        (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
      );

      const current = sortedPrices[0]?.price_usd || 0;
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const yesterdayPrice = sortedPrices.find(
        (p) => new Date(p.recorded_at).getTime() < oneDayAgo
      );
      const yesterday = yesterdayPrice?.price_usd || current;

      const change_24h = yesterday > 0
        ? ((current - yesterday) / yesterday) * 100
        : 0;

      return { ...m, change_24h };
    })
    .filter((m) => Math.abs((m as MaterialWithPrices & { change_24h: number }).change_24h) > threshold)
    .sort((a, b) =>
      Math.abs((b as MaterialWithPrices & { change_24h: number }).change_24h) -
      Math.abs((a as MaterialWithPrices & { change_24h: number }).change_24h)
    );
}
