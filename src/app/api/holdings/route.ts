import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { canAddHolding } from '@/lib/holdings-limit';

// GET - List user's holdings
export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient();

  // Get user from auth header or session
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  );

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: holdings, error } = await supabase
    .from('lithos_holdings')
    .select(`
      *,
      material:lithos_materials(*)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get current prices for value calculation
  const materialSlugs = Array.from(new Set(holdings?.map((h) => h.material_slug) || []));

  const { data: prices } = await supabase
    .from('lithos_prices')
    .select('material_slug, price_usd')
    .in('material_slug', materialSlugs)
    .order('recorded_at', { ascending: false });

  // Create price lookup (latest price per material)
  const priceMap = new Map<string, number>();
  prices?.forEach((p) => {
    if (!priceMap.has(p.material_slug)) {
      // Convert to per-gram price based on material unit
      const material = holdings?.find((h) => h.material_slug === p.material_slug)?.material;
      const pricePerGram = material?.unit === 'kg' ? p.price_usd / 1000 : p.price_usd;
      priceMap.set(p.material_slug, pricePerGram);
    }
  });

  // Calculate values for each holding
  const holdingsWithValues = holdings?.map((h) => {
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

  return NextResponse.json({ holdings: holdingsWithValues });
}

// POST - Create new holding
export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();

  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  );

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check holdings limit
  const limitResult = await canAddHolding(user.id, supabase);
  if (!limitResult.allowed) {
    return NextResponse.json({
      error: 'Holdings limit reached',
      currentCount: limitResult.currentCount,
      limit: limitResult.limit,
      isPro: limitResult.isPro,
    }, { status: 403 });
  }

  const body = await request.json();

  const { error } = await supabase.from('lithos_holdings').insert({
    user_id: user.id,
    material_slug: body.material_slug,
    name: body.name || null,
    quantity_grams: body.quantity_grams,
    grade: body.grade || null,
    purchase_price_per_gram: body.purchase_price_per_gram || null,
    purchase_date: body.purchase_date || null,
    purchase_source: body.purchase_source || null,
    verification_status: body.verification_status || 'unverified',
    verification_notes: body.verification_notes || null,
    certificate_url: body.certificate_url || null,
    notes: body.notes || null,
    image_url: body.image_url || null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// PATCH - Update holding
export async function PATCH(request: NextRequest) {
  const supabase = createServerSupabaseClient();

  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  );

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: 'Holding ID required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('lithos_holdings')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// DELETE - Remove holding
export async function DELETE(request: NextRequest) {
  const supabase = createServerSupabaseClient();

  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  );

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Holding ID required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('lithos_holdings')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
