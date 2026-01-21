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

async function getPrices() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: prices, error } = await supabase
    .from('lithos_prices')
    .select('*')
    .gte('recorded_at', thirtyDaysAgo.toISOString())
    .order('recorded_at', { ascending: false });

  if (error) {
    console.error('Error fetching prices:', error);
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
  const [materials, prices, news] = await Promise.all([
    getMaterials(),
    getPrices(),
    getNews(),
  ]);

  // Combine materials with their prices
  const materialsWithPrices = materials.map((material) => ({
    ...material,
    prices: prices.filter((p) => p.material_slug === material.slug),
  }));

  return <HomeClient materials={materialsWithPrices} news={news} />;
}
