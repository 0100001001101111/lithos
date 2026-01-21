'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <nav className="border-b border-[var(--border)] bg-[var(--card-bg)] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[var(--accent)] to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">Li</span>
            </div>
            <span className="text-xl font-bold text-[var(--text-primary)]">LITHOS</span>
          </Link>

          {/* Search */}
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Search materials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <Link
              href="/pricing"
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm font-medium"
            >
              Pricing
            </Link>
            {loading ? (
              <div className="w-20 h-8 bg-[var(--border)] rounded animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard/portfolio"
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm font-medium"
                >
                  Portfolio
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm font-medium"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link href="/login" className="btn-primary text-sm">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
