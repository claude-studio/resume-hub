import type { ProfileRow, WorkExperienceRow } from '@resume-hub/shared';
import { redirect } from 'next/navigation';
import { ProfileForm } from '@/features/profile/ProfileForm';
import { ProfileHeader } from '@/features/profile/ProfileHeader';
import { WorkExperienceList } from '@/features/work-experience/WorkExperienceList';
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

  const [{ data: profile, error: profileError }, { data: experiences, error: experiencesError }] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', user.id).single(),
      supabase
        .from('work_experiences')
        .select('*')
        .eq('user_id', user.id)
        .order('end_date', { ascending: false, nullsFirst: true })
        .order('start_date', { ascending: false }),
    ]);

  if (profileError || !profile) {
    throw new Error('프로필을 불러오지 못했습니다.');
  }
  if (experiencesError) {
    throw new Error('경력을 불러오지 못했습니다.');
  }

  const profileRow = profile as ProfileRow;
  const experienceRows = (experiences ?? []) as WorkExperienceRow[];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[680px] flex-col px-6 py-10 sm:px-8">
      <div className="order-2 flex flex-1 flex-col gap-[3.75rem]">
        <ProfileForm initial={profileRow} />
        <WorkExperienceList initial={experienceRows} userId={user.id} />
      </div>
      <div className="order-1">
        <ProfileHeader email={profileRow.email} />
      </div>
    </main>
  );
}
