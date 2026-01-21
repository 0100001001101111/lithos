interface ScrapedPrice {
  material_slug: string;
  price_usd: number;
  price_per: string;
  source: string;
}

// Collectible categories with search terms and expected price ranges
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const COLLECTIBLE_SEARCHES: Record<string, { search: string; minPrice: number; maxPrice: number }> = {
  'pallasite-meteorite': { search: 'pallasite meteorite', minPrice: 2, maxPrice: 20 },
  'iron-meteorite': { search: 'iron meteorite', minPrice: 0.3, maxPrice: 3 },
  'lunar-meteorite': { search: 'lunar meteorite', minPrice: 20, maxPrice: 100 },
  'martian-meteorite': { search: 'martian meteorite shergottite', minPrice: 500, maxPrice: 2000 },
  'trinitite': { search: 'trinitite', minPrice: 3, maxPrice: 20 },
  'libyan-desert-glass': { search: 'libyan desert glass', minPrice: 1, maxPrice: 10 },
  'moldavite': { search: 'moldavite genuine', minPrice: 10, maxPrice: 50 },
  'kpg-boundary': { search: 'KT boundary cretaceous', minPrice: 5, maxPrice: 30 },
};

// Note: eBay API requires registration and has rate limits
// This is a simplified version - production would use eBay Browse API
export async function scrapeEbaySoldListings(): Promise<ScrapedPrice[]> {
  const prices: ScrapedPrice[] = [];

  // In production, this would:
  // 1. Use eBay Browse API (findCompletedItems)
  // 2. Filter for sold items only
  // 3. Calculate median price per gram
  // 4. Store results with timestamps

  console.log('eBay scraping would require API integration');
  console.log('Using fallback collectible prices instead');

  return prices;
}

// Fallback prices based on typical market values
export function getCollectibleFallbackPrices(): ScrapedPrice[] {
  return [
    { material_slug: 'pallasite-meteorite', price_usd: 5.50, price_per: 'gram', source: 'Market Data' },
    { material_slug: 'iron-meteorite', price_usd: 0.95, price_per: 'gram', source: 'Market Data' },
    { material_slug: 'lunar-meteorite', price_usd: 55, price_per: 'gram', source: 'Market Data' },
    { material_slug: 'martian-meteorite', price_usd: 950, price_per: 'gram', source: 'Market Data' },
    { material_slug: 'trinitite', price_usd: 10, price_per: 'gram', source: 'Market Data' },
    { material_slug: 'libyan-desert-glass', price_usd: 4.50, price_per: 'gram', source: 'Market Data' },
    { material_slug: 'moldavite', price_usd: 22, price_per: 'gram', source: 'Market Data' },
    { material_slug: 'kpg-boundary', price_usd: 18, price_per: 'gram', source: 'Market Data' },
  ];
}

// Add small random variation to simulate market movement
export function addPriceVariation(price: number, maxPercent: number = 3): number {
  const variation = (Math.random() - 0.5) * 2 * (maxPercent / 100);
  return Number((price * (1 + variation)).toFixed(2));
}
