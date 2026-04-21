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
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(Boolean(code && messages[code]));
  }, [code]);

  if (!code || !messages[code] || !visible) return null;

  return (
    <div
      role="status"
      className="flex items-start justify-between gap-3 rounded-[4px] bg-accent-soft px-3 py-2 text-sm text-accent-focus"
    >
      <span className="flex-1">{messages[code]}</span>
      <button
        type="button"
        onClick={() => setVisible(false)}
        aria-label="알림 닫기"
        className="-my-1 -mr-1 cursor-pointer rounded-[4px] px-2 py-1 text-[color:var(--color-accent-focus)] transition-colors hover:bg-black/5"
      >
        ×
      </button>
    </div>
  );
}
