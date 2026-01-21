'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Processing authentication...');

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createClient();

      // Check if we already have a session (from URL hash handling by Supabase)
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        setStatus('Session found! Redirecting...');
        router.push('/dashboard/portfolio');
        return;
      }

      // If no session, check for code in URL (PKCE flow)
      const code = searchParams.get('code');
      if (code) {
        setStatus('Exchanging code for session...');
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          console.error('Auth error:', error);
          setStatus(`Authentication failed: ${error.message}`);
          setTimeout(() => router.push('/login?error=auth_failed'), 2000);
          return;
        }

        setStatus('Success! Redirecting...');
        router.push('/dashboard/portfolio');
        return;
      }

      // Check for error in URL
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');
      if (error) {
        setStatus(`Error: ${errorDescription || error}`);
        setTimeout(() => router.push('/login?error=auth_failed'), 2000);
        return;
      }

      // No code, no session, no error - redirect to login
      setStatus('No authentication data found. Redirecting to login...');
      setTimeout(() => router.push('/login'), 2000);
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[var(--text-primary)]">{status}</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[var(--text-primary)]">Loading...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
