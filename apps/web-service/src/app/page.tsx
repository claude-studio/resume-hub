import { Suspense } from 'react';
import { GoogleSignInButton } from '@/features/auth/GoogleSignInButton';
import { LandingErrorNotice } from '@/features/auth/LandingErrorNotice';

export const dynamic = 'force-static';

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[640px] flex-col px-6 py-10 sm:px-8">
      <header className="flex items-center justify-between">
        <span className="text-sm font-semibold tracking-[-0.004em] text-ink">resume-hub</span>
      </header>

      <section className="flex flex-1 flex-col justify-center gap-6 pb-24">
        <Suspense fallback={null}>
          <LandingErrorNotice />
        </Suspense>

        <h1 className="text-[clamp(2.5rem,7vw,3.375rem)] font-bold leading-[1.04] tracking-[-0.023em] text-ink">
          이력은 한 번만 쓴다
        </h1>
        <p className="max-w-[36ch] text-xl font-medium leading-[1.4] tracking-[-0.008em] text-warm-500">
          이력 데이터를 한 곳에 모으고, 플랫폼 이력서 폼은 브라우저 익스텐션이 자동으로 채웁니다.
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <GoogleSignInButton />
        </div>
        <p className="text-[0.8125rem] text-warm-500">
          브라우저 익스텐션은 곧 공개됩니다 · 이력은 웹에서 먼저 입력해두세요.
        </p>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[color:var(--color-border-whisper)] pt-4 text-[0.8125rem] text-warm-500">
        <span>© 2026 resume-hub</span>
        <a href="mailto:privacy@resume-hub.example" className="hover:text-ink hover:underline">
          privacy@resume-hub.example
        </a>
      </footer>
    </main>
  );
}
