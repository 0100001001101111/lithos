import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { scrapeSMMPrices, getSMMSnapshotPrices } from '@/lib/scrapers/smm-metals';
import { scrapeEbayPrices, getEbaySnapshotPrices } from '@/lib/scrapers/ebay-collectibles';

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Allow in development or if no secret is set
  if (!cronSecret || process.env.NODE_ENV === 'development') {
    return true;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  // Verify the request is authorized
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();
  const results = {
    success: [] as string[],
    failed: [] as string[],
    scraped: 0,
    snapshot: 0,
    timestamp: new Date().toISOString(),
  };

  try {
    // Try scraping real SMM prices first
    console.log('Attempting to scrape SMM prices...');
    let metalPrices = await scrapeSMMPrices();

    if (metalPrices.length === 0) {
      console.log('SMM scraping returned no results, using snapshot prices');
      metalPrices = getSMMSnapshotPrices();
      results.snapshot += metalPrices.length;
    } else {
      results.scraped += metalPrices.length;
    }

    // Try scraping real eBay prices
    console.log('Attempting to scrape eBay prices...');
    let collectiblePrices = await scrapeEbayPrices();

    if (collectiblePrices.length === 0) {
      console.log('eBay scraping returned no results, using snapshot prices');
      collectiblePrices = getEbaySnapshotPrices();
      results.snapshot += collectiblePrices.length;
    } else {
      results.scraped += collectiblePrices.length;
    }

    // Combine all prices
    const allPrices = [...metalPrices, ...collectiblePrices];

    // Insert prices into database
    for (const price of allPrices) {
      const { error } = await supabase.from('lithos_prices').insert({
        material_slug: price.material_slug,
        price_usd: price.price_usd,
        price_per: price.price_per,
        source: price.source,
        recorded_at: new Date().toISOString(),
      });

      if (error) {
        console.error(`Error inserting price for ${price.material_slug}:`, error);
        results.failed.push(price.material_slug);
      } else {
        results.success.push(price.material_slug);
      }
    }

    // Clean up old prices (keep last 365 days)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 365);

    const { error: cleanupError } = await supabase
      .from('lithos_prices')
      .delete()
      .lt('recorded_at', cutoffDate.toISOString());

    if (cleanupError) {
      console.error('Error cleaning up old prices:', cleanupError);
    }

    return NextResponse.json({
      message: 'Price update completed',
      results,
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

// Also support POST for Vercel cron
export async function POST(request: NextRequest) {
  return GET(request);
}
