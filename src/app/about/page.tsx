import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export const metadata = {
  title: 'About - Lithos',
  description: 'Learn about Lithos, the strategic materials price tracker for rare earths, strategic metals, and scientific collectibles.',
};

async function getStats() {
  const { data: materials } = await supabase
    .from('lithos_materials')
    .select('category');

  return {
    total: materials?.length || 0,
    strategic: materials?.filter(m => m.category === 'strategic_metal').length || 0,
    rareEarth: materials?.filter(m => m.category === 'rare_earth').length || 0,
    collectibles: materials?.filter(m => m.category === 'collectible').length || 0,
  };
}

export default async function AboutPage() {
  const stats = await getStats();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero */}
      <div className="text-center mb-16">
        <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-[var(--accent)] to-purple-500 rounded-2xl flex items-center justify-center">
          <span className="text-white font-bold text-2xl">Li</span>
        </div>
        <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-4">
          About Lithos
        </h1>
        <p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto">
          The intelligence platform for strategic materials—tracking prices, supply chains,
          and market movements for the elements that power modern technology.
        </p>
      </div>

      {/* What We Track */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">
          What We Track
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-6">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              Strategic Metals
            </h3>
            <p className="text-[var(--text-secondary)] text-sm mb-3">
              {stats.strategic} materials including lithium, cobalt, tungsten, tantalum, and other
              critical metals essential for batteries, semiconductors, and defense applications.
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Used in: EVs, smartphones, aerospace, medical devices
            </p>
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-6">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              Rare Earth Elements
            </h3>
            <p className="text-[var(--text-secondary)] text-sm mb-3">
              {stats.rareEarth} elements including neodymium, dysprosium, terbium, and other
              lanthanides critical for magnets, lasers, and clean energy technology.
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Used in: Wind turbines, EVs, MRI machines, fiber optics
            </p>
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-6">
            <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              Scientific Collectibles
            </h3>
            <p className="text-[var(--text-secondary)] text-sm mb-3">
              {stats.collectibles} unique materials including meteorites, impact glasses,
              and other specimens of scientific and collector interest.
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Including: Lunar/Martian meteorites, moldavite, trinitite, tektites
            </p>
          </div>
        </div>
      </section>

      {/* Why Strategic Materials Matter */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">
          Why Strategic Materials Matter
        </h2>
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-6 space-y-4">
          <p className="text-[var(--text-secondary)]">
            The global economy runs on a handful of critical materials that most people never think about.
            A single smartphone contains over 30 different elements. An electric vehicle battery requires
            lithium, cobalt, nickel, and manganese. Wind turbines need rare earth magnets.
            Semiconductors depend on gallium, germanium, and indium.
          </p>
          <p className="text-[var(--text-secondary)]">
            Supply chains for these materials are concentrated in a few countries, making prices
            volatile and supply unpredictable. China controls 60% of rare earth mining and 90% of
            processing. The DRC produces 70% of the world&apos;s cobalt. A single company in Brazil
            supplies 90% of global niobium.
          </p>
          <p className="text-[var(--text-secondary)]">
            Lithos tracks these materials so investors, researchers, and industry professionals
            can make informed decisions in a market where information is often fragmented or
            hidden behind expensive industry reports.
          </p>
        </div>
      </section>

      {/* Material Categories Deep Dive */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">
          Material Categories
        </h2>

        <div className="space-y-6">
          {/* Strategic Metals */}
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
              <span className="w-3 h-3 bg-blue-400 rounded-full"></span>
              Strategic Metals
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-[var(--text-secondary)]">
              <div>
                <p className="font-medium text-[var(--text-primary)] mb-1">Battery Metals</p>
                <p>Lithium, Cobalt, Vanadium — powering the EV revolution and grid storage</p>
              </div>
              <div>
                <p className="font-medium text-[var(--text-primary)] mb-1">Semiconductor Metals</p>
                <p>Gallium, Germanium, Indium — essential for chips and solar cells</p>
              </div>
              <div>
                <p className="font-medium text-[var(--text-primary)] mb-1">Superalloy Metals</p>
                <p>Rhenium, Hafnium, Tungsten — jet engines and high-temp applications</p>
              </div>
              <div>
                <p className="font-medium text-[var(--text-primary)] mb-1">Conflict Minerals</p>
                <p>Tantalum, Niobium — capacitors and steel, with complex supply chains</p>
              </div>
            </div>
          </div>

          {/* Rare Earths */}
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
              <span className="w-3 h-3 bg-purple-400 rounded-full"></span>
              Rare Earth Elements
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-[var(--text-secondary)]">
              <div>
                <p className="font-medium text-[var(--text-primary)] mb-1">Magnet REEs</p>
                <p>Neodymium, Praseodymium, Dysprosium, Terbium — permanent magnets for motors</p>
              </div>
              <div>
                <p className="font-medium text-[var(--text-primary)] mb-1">Phosphor REEs</p>
                <p>Europium, Yttrium, Cerium — displays, LEDs, and lighting</p>
              </div>
              <div>
                <p className="font-medium text-[var(--text-primary)] mb-1">Catalyst REEs</p>
                <p>Lanthanum, Cerium — oil refining and automotive catalysts</p>
              </div>
              <div>
                <p className="font-medium text-[var(--text-primary)] mb-1">Specialty REEs</p>
                <p>Scandium, Lutetium, Gadolinium — aerospace alloys and medical imaging</p>
              </div>
            </div>
          </div>

          {/* Collectibles */}
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
              <span className="w-3 h-3 bg-orange-400 rounded-full"></span>
              Scientific Collectibles
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-[var(--text-secondary)]">
              <div>
                <p className="font-medium text-[var(--text-primary)] mb-1">Meteorites</p>
                <p>Iron, Pallasite, Lunar, Martian — extraterrestrial materials with verified provenance</p>
              </div>
              <div>
                <p className="font-medium text-[var(--text-primary)] mb-1">Impact Glasses</p>
                <p>Moldavite, Libyan Desert Glass, Darwin Glass — formed by asteroid impacts</p>
              </div>
              <div>
                <p className="font-medium text-[var(--text-primary)] mb-1">Nuclear Glass</p>
                <p>Trinitite, Red Trinitite — historical artifacts from the atomic age</p>
              </div>
              <div>
                <p className="font-medium text-[var(--text-primary)] mb-1">Geological Specimens</p>
                <p>K-Pg Boundary Material, Tektites, Fulgurites — scientifically significant samples</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Data Sources */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">
          Our Data
        </h2>
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <p className="text-3xl font-bold text-[var(--accent)]">{stats.total}</p>
              <p className="text-sm text-[var(--text-secondary)]">Materials tracked</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-[var(--accent)]">6hr</p>
              <p className="text-sm text-[var(--text-secondary)]">Price update frequency</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-[var(--accent)]">30d</p>
              <p className="text-sm text-[var(--text-secondary)]">Historical data</p>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-[var(--border)]">
            <p className="text-sm text-[var(--text-secondary)]">
              Price data is aggregated from commodity exchanges, dealer markets, and industry sources.
              Collector material prices reflect retail market conditions. All prices are indicative
              and may not reflect actual transaction prices for large volumes or specific grades.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center">
        <div className="bg-gradient-to-r from-[var(--accent)]/20 to-purple-500/20 border border-[var(--accent)]/30 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
            Start Tracking Your Portfolio
          </h2>
          <p className="text-[var(--text-secondary)] mb-6 max-w-lg mx-auto">
            Create an account to track your physical holdings, set price alerts,
            and monitor your portfolio value over time.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/signup" className="btn-primary">
              Get Started Free
            </Link>
            <Link href="/" className="btn-secondary">
              Browse Materials
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
