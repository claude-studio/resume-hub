'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const messages: Record<string, string> = {
  cancelled: '로그인이 취소되었습니다.',
  oauth_failed: '로그인 중 오류가 발생했습니다. 다시 시도해주세요.',
};

export function LandingErrorNotice() {
  const searchParams = useSearchParams();
  const code = searchParams.get('error');
  const [visible, setVisible] = useState(Boolean(code && messages[code]));

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(timer);
  }, [visible]);

  if (!code || !messages[code] || !visible) return null;

  return (
    <div
      role="status"
      className="rounded-[4px] bg-accent-soft px-3 py-2 text-[14px] text-accent-focus motion-safe:transition-opacity motion-safe:duration-300"
    >
      {messages[code]}
    </div>
  );
}
