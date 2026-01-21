export interface Material {
  slug: string;
  name: string;
  symbol: string | null;
  category: 'strategic_metal' | 'rare_earth' | 'collectible';
  description: string;
  supply_info: {
    annual_production_tonnes?: number;
    main_producers?: string[];
    annual_finds?: string;
    main_sources?: string[];
    availability?: string;
  };
  demand_info: {
    industries?: string[];
    key_applications?: string[];
    collectors?: string[];
    key_features?: string[];
  };
  image_url: string | null;
  unit: 'gram' | 'kg';
  created_at: string;
}

export interface Price {
  id: string;
  material_slug: string;
  price_usd: number;
  price_per: string;
  source: string;
  recorded_at: string;
}

export interface MaterialWithPrice extends Material {
  current_price: number | null;
  price_change_24h: number | null;
  price_change_7d: number | null;
  price_change_30d: number | null;
  price_history: Price[];
}

export interface Alert {
  id: string;
  user_id: string;
  material_slug: string;
  condition: 'above' | 'below' | 'percent_change';
  threshold: number;
  is_active: boolean;
  last_triggered_at: string | null;
  created_at: string;
}

export interface News {
  id: string;
  title: string;
  url: string;
  source: string;
  summary: string | null;
  material_tags: string[];
  published_at: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: 'free' | 'pro';
  status: 'active' | 'canceled' | 'past_due';
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export type TimeRange = '1D' | '1W' | '1M' | '6M' | '1Y' | 'ALL';

export interface User {
  id: string;
  email: string;
  subscription?: Subscription;
}

export interface Holding {
  id: string;
  user_id: string;
  material_slug: string;
  quantity_grams: number;
  purchase_price_per_gram: number | null;
  purchase_date: string | null;
  purchase_source: string | null;
  name: string | null;
  description: string | null;
  grade: string | null;
  verification_status: 'unverified' | 'self_verified' | 'certified';
  verification_notes: string | null;
  certificate_url: string | null;
  image_url: string | null;
  is_for_sale: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface HoldingWithValue extends Holding {
  material: Material;
  current_price_per_gram: number;
  current_value: number;
  cost_basis: number | null;
  profit_loss: number | null;
  profit_loss_percent: number | null;
}

export interface PortfolioSnapshot {
  id: string;
  user_id: string;
  total_value_usd: number;
  snapshot_date: string;
  holdings_breakdown: Record<string, number>;
  created_at: string;
}

export interface PortfolioSummary {
  totalValue: number;
  totalCostBasis: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
  change24h: number;
  change24hPercent: number;
  change7d: number;
  change7dPercent: number;
  holdingsCount: number;
}
