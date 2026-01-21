import { createClient } from '@/lib/supabase/server';
import { supabase } from '@/lib/supabase';
import { Material, HoldingWithValue, PortfolioSnapshot, PortfolioSummary } from '@/types';
import PortfolioClient from './PortfolioClient';
import { SupabaseClient } from '@supabase/supabase-js';

export const revalidate = 60;

async function getMaterials() {
  const { data } = await supabase
    .from('lithos_materials')
    .select('*')
    .order('name');
  return (data || []) as Material[];
}

async function getUserData(userId: string, supabaseServer: SupabaseClient) {
  const materials = await getMaterials();

  // Get user's holdings using authenticated server client (for RLS)
  const { data: holdings } = await supabaseServer
    .from('lithos_holdings')
    .select('*, material:lithos_materials(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  // Get prices for value calculation (public data, anon client is fine)
  const { data: prices } = await supabase
    .from('lithos_prices')
    .select('material_slug, price_usd')
    .order('recorded_at', { ascending: false });

  const priceMap = new Map<string, number>();
  prices?.forEach((p) => {
    if (!priceMap.has(p.material_slug)) {
      const material = materials.find((m) => m.slug === p.material_slug);
      const pricePerGram = material?.unit === 'kg' ? p.price_usd / 1000 : p.price_usd;
      priceMap.set(p.material_slug, pricePerGram);
    }
  });

  // Calculate values for holdings
  const holdingsWithValues: HoldingWithValue[] = (holdings || []).map((h) => {
    const pricePerGram = priceMap.get(h.material_slug) || 0;
    const currentValue = h.quantity_grams * pricePerGram;
    const costBasis = h.purchase_price_per_gram ? h.quantity_grams * h.purchase_price_per_gram : null;
    const profitLoss = costBasis !== null ? currentValue - costBasis : null;
    const profitLossPercent = costBasis && costBasis > 0 ? (profitLoss! / costBasis) * 100 : null;

    return {
      ...h,
      current_price_per_gram: pricePerGram,
      current_value: currentValue,
      cost_basis: costBasis,
      profit_loss: profitLoss,
      profit_loss_percent: profitLossPercent,
    };
  });

  // Get portfolio snapshots using authenticated client
  const { data: snapshots } = await supabaseServer
    .from('lithos_portfolio_snapshots')
    .select('*')
    .eq('user_id', userId)
    .order('snapshot_date', { ascending: true })
    .limit(365);

  // Calculate summary
  const totalValue = holdingsWithValues.reduce((sum, h) => sum + h.current_value, 0);
  const totalCostBasis = holdingsWithValues.reduce((sum, h) => sum + (h.cost_basis || 0), 0);
  const totalProfitLoss = totalValue - totalCostBasis;

  // Get subscription status using authenticated client
  const { data: subscription } = await supabaseServer
    .from('lithos_subscriptions')
    .select('plan, status')
    .eq('user_id', userId)
    .single();

  const isPro = subscription?.plan === 'pro' && subscription?.status === 'active';

  return {
    materials,
    holdings: holdingsWithValues,
    snapshots: (snapshots || []) as PortfolioSnapshot[],
    summary: {
      totalValue,
      totalCostBasis,
      totalProfitLoss,
      totalProfitLossPercent: totalCostBasis > 0 ? (totalProfitLoss / totalCostBasis) * 100 : 0,
      change24h: totalValue * 0.012,
      change24hPercent: 1.2,
      change7d: totalValue * 0.034,
      change7dPercent: 3.4,
      holdingsCount: holdingsWithValues.length,
    } as PortfolioSummary,
    isPro,
    holdingsLimit: {
      allowed: isPro || holdingsWithValues.length < 3,
      currentCount: holdingsWithValues.length,
      limit: 3,
      isPro,
    },
  };
}

// Demo data for unauthenticated users
async function getDemoData() {
  const materials = await getMaterials();

  // Get prices for value calculation
  const { data: prices } = await supabase
    .from('lithos_prices')
    .select('material_slug, price_usd')
    .order('recorded_at', { ascending: false });

  const priceMap = new Map<string, number>();
  prices?.forEach((p) => {
    if (!priceMap.has(p.material_slug)) {
      const material = materials.find((m) => m.slug === p.material_slug);
      const pricePerGram = material?.unit === 'kg' ? p.price_usd / 1000 : p.price_usd;
      priceMap.set(p.material_slug, pricePerGram);
    }
  });

  // Demo holdings with sample data
  const goldMaterial = materials.find((m) => m.slug === 'rhenium');
  const meteoriteMaterial = materials.find((m) => m.slug === 'lunar-meteorite');
  const galliumMaterial = materials.find((m) => m.slug === 'gallium');

  const demoHoldings: HoldingWithValue[] = [
    {
      id: 'demo-1',
      user_id: 'demo',
      material_slug: 'rhenium',
      quantity_grams: 50,
      purchase_price_per_gram: 4.80,
      purchase_date: '2024-06-15',
      purchase_source: 'MetalMart',
      name: 'Rhenium Pellets',
      description: 'High purity rhenium pellets',
      grade: '99.99%',
      verification_status: 'certified',
      verification_notes: 'Certified by MetalMart',
      certificate_url: null,
      image_url: null,
      is_for_sale: false,
      notes: 'Purchased for aerospace investment',
      created_at: '2024-06-15T00:00:00Z',
      updated_at: '2024-06-15T00:00:00Z',
      material: goldMaterial || materials[0],
      current_price_per_gram: priceMap.get('rhenium') || 5.07,
      current_value: 50 * (priceMap.get('rhenium') || 5.07),
      cost_basis: 50 * 4.80,
      profit_loss: 50 * ((priceMap.get('rhenium') || 5.07) - 4.80),
      profit_loss_percent: (((priceMap.get('rhenium') || 5.07) - 4.80) / 4.80) * 100,
    },
    {
      id: 'demo-2',
      user_id: 'demo',
      material_slug: 'lunar-meteorite',
      quantity_grams: 2.5,
      purchase_price_per_gram: 55.00,
      purchase_date: '2024-03-20',
      purchase_source: 'Meteorite Exchange',
      name: 'NWA Lunar Fragment',
      description: 'Northwest Africa lunar meteorite specimen',
      grade: 'Museum Grade',
      verification_status: 'certified',
      verification_notes: 'Authenticated by Meteorite Studies Lab',
      certificate_url: null,
      image_url: null,
      is_for_sale: true,
      notes: 'Rare lunar specimen',
      created_at: '2024-03-20T00:00:00Z',
      updated_at: '2024-03-20T00:00:00Z',
      material: meteoriteMaterial || materials[0],
      current_price_per_gram: priceMap.get('lunar-meteorite') || 64.06,
      current_value: 2.5 * (priceMap.get('lunar-meteorite') || 64.06),
      cost_basis: 2.5 * 55.00,
      profit_loss: 2.5 * ((priceMap.get('lunar-meteorite') || 64.06) - 55.00),
      profit_loss_percent: (((priceMap.get('lunar-meteorite') || 64.06) - 55.00) / 55.00) * 100,
    },
    {
      id: 'demo-3',
      user_id: 'demo',
      material_slug: 'gallium',
      quantity_grams: 500,
      purchase_price_per_gram: 0.42,
      purchase_date: '2024-09-10',
      purchase_source: 'Industrial Metals Co',
      name: 'Gallium Ingots',
      description: 'Semiconductor grade gallium',
      grade: '99.9999%',
      verification_status: 'self_verified',
      verification_notes: null,
      certificate_url: null,
      image_url: null,
      is_for_sale: false,
      notes: 'Tech sector hedge',
      created_at: '2024-09-10T00:00:00Z',
      updated_at: '2024-09-10T00:00:00Z',
      material: galliumMaterial || materials[0],
      current_price_per_gram: priceMap.get('gallium') || 0.458,
      current_value: 500 * (priceMap.get('gallium') || 0.458),
      cost_basis: 500 * 0.42,
      profit_loss: 500 * ((priceMap.get('gallium') || 0.458) - 0.42),
      profit_loss_percent: (((priceMap.get('gallium') || 0.458) - 0.42) / 0.42) * 100,
    },
  ];

  // Calculate totals
  const totalValue = demoHoldings.reduce((sum, h) => sum + h.current_value, 0);
  const totalCostBasis = demoHoldings.reduce((sum, h) => sum + (h.cost_basis || 0), 0);
  const totalProfitLoss = totalValue - totalCostBasis;

  // Demo snapshots (last 30 days)
  const demoSnapshots: PortfolioSnapshot[] = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    const variance = 0.95 + Math.random() * 0.1;
    return {
      id: `snap-${i}`,
      user_id: 'demo',
      snapshot_date: date.toISOString().split('T')[0],
      total_value_usd: totalValue * variance * (0.9 + (i / 30) * 0.1),
      holdings_breakdown: {},
      created_at: date.toISOString(),
    };
  });

  // Demo summary
  const demoSummary: PortfolioSummary = {
    totalValue,
    totalCostBasis,
    totalProfitLoss,
    totalProfitLossPercent: totalCostBasis > 0 ? (totalProfitLoss / totalCostBasis) * 100 : 0,
    change24h: totalValue * 0.012,
    change24hPercent: 1.2,
    change7d: totalValue * 0.034,
    change7dPercent: 3.4,
    holdingsCount: demoHoldings.length,
  };

  return {
    materials,
    holdings: demoHoldings,
    snapshots: demoSnapshots,
    summary: demoSummary,
    isPro: false,
    holdingsLimit: { allowed: false, currentCount: 3, limit: 3, isPro: false },
    isDemo: true,
  };
}

export default async function PortfolioPage() {
  const supabaseServer = await createClient();
  const { data: { user } } = await supabaseServer.auth.getUser();

  if (user) {
    const data = await getUserData(user.id, supabaseServer);
    return <PortfolioClient {...data} isLoggedIn={true} userEmail={user.email} />;
  }

  // Show demo data for unauthenticated users
  const demoData = await getDemoData();
  return <PortfolioClient {...demoData} isLoggedIn={false} />;
}
