import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || process.env.NODE_ENV === 'development') {
    return true;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();
  const results = {
    usersProcessed: 0,
    errors: [] as string[],
    timestamp: new Date().toISOString(),
  };

  try {
    // Get all users with holdings
    const { data: userHoldings } = await supabase
      .from('lithos_holdings')
      .select('user_id')
      .neq('user_id', null);

    const uniqueUsers = Array.from(new Set(userHoldings?.map((u) => u.user_id)));

    // Get current prices for all materials
    const { data: allPrices } = await supabase
      .from('lithos_prices')
      .select('material_slug, price_usd')
      .order('recorded_at', { ascending: false });

    // Get material units for price conversion
    const { data: materials } = await supabase
      .from('lithos_materials')
      .select('slug, unit');

    const materialUnits = new Map<string, string>();
    materials?.forEach((m) => materialUnits.set(m.slug, m.unit));

    // Create price lookup (latest price per material, converted to per-gram)
    const priceMap = new Map<string, number>();
    allPrices?.forEach((p) => {
      if (!priceMap.has(p.material_slug)) {
        const unit = materialUnits.get(p.material_slug) || 'gram';
        const pricePerGram = unit === 'kg' ? p.price_usd / 1000 : p.price_usd;
        priceMap.set(p.material_slug, pricePerGram);
      }
    });

    // Calculate and store snapshot for each user
    for (const userId of uniqueUsers) {
      try {
        const { data: holdings } = await supabase
          .from('lithos_holdings')
          .select('material_slug, quantity_grams')
          .eq('user_id', userId);

        let totalValue = 0;
        const breakdown: Record<string, number> = {};

        holdings?.forEach((h) => {
          const pricePerGram = priceMap.get(h.material_slug) || 0;
          const value = h.quantity_grams * pricePerGram;
          totalValue += value;
          breakdown[h.material_slug] = (breakdown[h.material_slug] || 0) + value;
        });

        // Only create snapshot if user has holdings with value
        if (totalValue > 0) {
          await supabase.from('lithos_portfolio_snapshots').insert({
            user_id: userId,
            total_value_usd: totalValue,
            snapshot_date: new Date().toISOString().split('T')[0],
            holdings_breakdown: breakdown,
          });
        }

        results.usersProcessed++;
      } catch (err) {
        results.errors.push(`User ${userId}: ${String(err)}`);
      }
    }

    // Clean up old snapshots (keep last 2 years)
    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - 2);

    await supabase
      .from('lithos_portfolio_snapshots')
      .delete()
      .lt('snapshot_date', cutoffDate.toISOString().split('T')[0]);

    return NextResponse.json({
      message: 'Portfolio snapshots completed',
      results,
    });
  } catch (error) {
    console.error('Snapshot cron error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
