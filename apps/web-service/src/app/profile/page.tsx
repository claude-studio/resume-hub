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

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[680px] flex-col px-6 py-10 sm:px-8">
      <ProfileHeader email={row.email} />
      <div className="flex-1">
        <ProfileForm initial={row} />
      </div>
    </main>
  );
}
