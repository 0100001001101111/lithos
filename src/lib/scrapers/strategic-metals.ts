interface ScrapedPrice {
  material_slug: string;
  price_usd: number;
  price_per: string;
  source: string;
}

// Map of material slugs to their SMI page identifiers (for future scraping implementation)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const MATERIAL_PAGES: Record<string, string> = {
  rhenium: 'rhenium',
  gallium: 'gallium',
  germanium: 'germanium',
  indium: 'indium',
  hafnium: 'hafnium',
  tellurium: 'tellurium',
};

// Scraping function - currently returns empty array, would need cheerio for actual implementation
// Cheerio has compatibility issues with Next.js server components, so using fallback for now
export async function scrapeStrategicMetalsInvest(): Promise<ScrapedPrice[]> {
  // In production, this would use cheerio to scrape actual prices
  // For now, returning empty to trigger fallback prices
  console.log('Scraping disabled - using fallback prices');
  return [];
}

// Fallback to static/API prices
export function getFallbackPrices(): ScrapedPrice[] {
  // These are approximate market prices - would be replaced with real API data
  return [
    { material_slug: 'rhenium', price_usd: 5056, price_per: 'kg', source: 'Market Data' },
    { material_slug: 'gallium', price_usd: 412, price_per: 'kg', source: 'Market Data' },
    { material_slug: 'germanium', price_usd: 1890, price_per: 'kg', source: 'Market Data' },
    { material_slug: 'indium', price_usd: 305, price_per: 'kg', source: 'Market Data' },
    { material_slug: 'cobalt', price_usd: 33.50, price_per: 'kg', source: 'Market Data' },
    { material_slug: 'lithium', price_usd: 14.20, price_per: 'kg', source: 'Market Data' },
    { material_slug: 'hafnium', price_usd: 1200, price_per: 'kg', source: 'Market Data' },
    { material_slug: 'tellurium', price_usd: 85, price_per: 'kg', source: 'Market Data' },
    { material_slug: 'neodymium', price_usd: 135, price_per: 'kg', source: 'Market Data' },
    { material_slug: 'dysprosium', price_usd: 365, price_per: 'kg', source: 'Market Data' },
    { material_slug: 'terbium', price_usd: 1300, price_per: 'kg', source: 'Market Data' },
    { material_slug: 'europium', price_usd: 40, price_per: 'kg', source: 'Market Data' },
  ];
}
