import type { Metadata } from 'next';
import type { ReactNode } from 'react';
// Pretendard Variable (dynamic subset) — unicode-range로 필요한 글리프만 로드.
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'resume-hub',
  description: '통합 이력 관리 서비스',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
