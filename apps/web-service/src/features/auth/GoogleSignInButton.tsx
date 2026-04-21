'use client';

import { Button } from '@resume-hub/ui';
import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function GoogleSignInButton() {
  const [isPending, setIsPending] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  async function handleClick() {
    setIsPending(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error('[google-signin] supabase error:', error);
        setIsPending(false);
        window.location.href = '/?error=oauth_failed';
        return;
      }

      // 성공 시 supabase-js가 window.location.assign(url)로 이미 리다이렉트했어야
      // 하지만, 일부 환경에서 자동 리다이렉트가 안 먹는 경우를 대비해 수동 폴백.
      if (data?.url && typeof window !== 'undefined' && window.location.pathname === '/') {
        window.location.href = data.url;
        return;
      }
    } catch (err) {
      console.error('[google-signin] unexpected error:', err);
      setIsPending(false);
      window.location.href = '/?error=oauth_failed';
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleClick}
      disabled={isPending}
      aria-label="Google 계정으로 로그인"
      className="gap-2"
    >
      <GoogleMark />
      <span>{isPending ? '로그인 중…' : 'Google로 시작하기'}</span>
    </Button>
  );
}

function GoogleMark() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
      className="-ml-1"
    >
      <path
        d="M17.64 9.2c0-.638-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961l3.007 2.332C4.672 5.166 6.656 3.58 9 3.58Z"
        fill="#EA4335"
      />
    </svg>
  );
}
