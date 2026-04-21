import type { ProfileRow } from '@resume-hub/shared';
import { redirect } from 'next/navigation';
import { ProfileForm } from '@/features/profile/ProfileForm';
import { ProfileHeader } from '@/features/profile/ProfileHeader';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error || !data) {
    throw new Error('프로필을 불러오지 못했습니다.');
  }

  const row = data as ProfileRow;

  /*
   * DOM 순서: ProfileForm → ProfileHeader.
   * 시각 순서: ProfileHeader (order-1) 위 / ProfileForm (order-2) 아래 (CSS flex order).
   *
   * 이유: 로그아웃 버튼이 헤더 안에 있어서 DOM이 Header 먼저면 Tab 시작점이
   *  '로그아웃'이 되어 파괴적 액션이 첫 Tab stop이 되는 문제가 있음.
   *  DOM을 Form 먼저 두면 Tab 순서가 이름 → 전화 → 소개 → 저장 → 로그아웃으로
   *  자연스럽게 흐르고, 실수 로그아웃 위험이 줄어든다.
   *  (auto-focus는 여전히 이름 필드로 시작되므로 첫 인상 UX는 동일.)
   */
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[680px] flex-col px-6 py-10 sm:px-8">
      <div className="order-2 flex-1">
        <ProfileForm initial={row} />
      </div>
      <div className="order-1">
        <ProfileHeader email={row.email} />
      </div>
    </main>
  );
}
