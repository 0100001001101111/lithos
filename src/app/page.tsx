import { supabase } from '@/lib/supabase';
import { Material, Price, News } from '@/types';
import HomeClient from './HomeClient';

export const revalidate = 60; // Revalidate every 60 seconds

async function getMaterials() {
  const { data: materials, error } = await supabase
    .from('lithos_materials')
    .select('*')
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching materials:', error);
    return [];
  }

  return materials as Material[];
}

// Fetch recent prices for % change calculations
// Gets enough historical data to calculate 24h, 7d, and 30d changes
async function getPricesForCalculations() {
  // Fetch all prices, ordered by date (most recent first)
  // We'll limit to top 20 per material in JavaScript
  const { data: prices, error } = await supabase
    .from('lithos_prices')
    .select('*')
    .order('recorded_at', { ascending: false })
    .limit(3000); // Get plenty of data for all materials

  if (error) {
    console.error('Error fetching prices for calculations:', error);
    return [];
  }

  return prices as Price[];
}

// Fetch 30-day prices for chart visualization
async function getChartPrices() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: prices, error } = await supabase
    .from('lithos_prices')
    .select('*')
    .gte('recorded_at', thirtyDaysAgo.toISOString())
    .order('recorded_at', { ascending: false });

  if (error) {
    console.error('Error fetching chart prices:', error);
    return [];
  }

  return prices as Price[];
}

async function getNews() {
  const { data: news, error } = await supabase
    .from('lithos_news')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching news:', error);
    return [];
  }

  return news as News[];
}

export default async function Home() {
  const [materials, calcPrices, chartPrices, news] = await Promise.all([
    getMaterials(),
    getPricesForCalculations(),
    getChartPrices(),
    getNews(),
  ]);

  // Combine materials with their prices
  // Use calculation prices (top 20 most recent per material) for % change calculations
  // Chart prices are used for sparkline visualization
  const materialsWithPrices = materials.map((material) => {
    const materialCalcPrices = calcPrices
      .filter((p) => p.material_slug === material.slug)
      .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())
      .slice(0, 20); // Limit to 20 most recent prices per material

    const materialChartPrices = chartPrices
      .filter((p) => p.material_slug === material.slug)
      .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());

    return {
      ...material,
      prices: materialCalcPrices, // For % change calculations (historical data)
      chartPrices: materialChartPrices, // For sparkline (30-day data)
    };
  });

  return <HomeClient materials={materialsWithPrices} news={news} />;
}
