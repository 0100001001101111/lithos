import { SupabaseClient } from '@supabase/supabase-js';

const FREE_HOLDINGS_LIMIT = 3;

export interface HoldingsLimitResult {
  allowed: boolean;
  currentCount: number;
  limit: number;
  isPro: boolean;
}

export async function canAddHolding(
  userId: string,
  supabase: SupabaseClient
): Promise<HoldingsLimitResult> {
  // Check subscription status
  const { data: subscription } = await supabase
    .from('lithos_subscriptions')
    .select('plan, status')
    .eq('user_id', userId)
    .single();

  const isPro = subscription?.plan === 'pro' && subscription?.status === 'active';

  // Pro users have no limit
  if (isPro) {
    return { allowed: true, currentCount: 0, limit: Infinity, isPro: true };
  }

  // Count existing holdings for free users
  const { count } = await supabase
    .from('lithos_holdings')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  const currentCount = count || 0;

  return {
    allowed: currentCount < FREE_HOLDINGS_LIMIT,
    currentCount,
    limit: FREE_HOLDINGS_LIMIT,
    isPro: false,
  };
}

export function getHoldingsLimit(): number {
  return FREE_HOLDINGS_LIMIT;
}
