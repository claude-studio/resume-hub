import { signOut } from '@/features/auth/actions';

interface Props {
  email: string;
}

export function ProfileHeader({ email }: Props) {
  const local = email.split('@')[0] ?? '';
  const masked = `${local}@…`;

  return (
    <header className="flex items-center justify-between pb-8">
      <span className="text-[14px] font-semibold tracking-[-0.004em] text-ink">resume-hub</span>
      <div className="flex items-center gap-4 text-[13px] text-warm-500">
        <span title={email}>
          <span className="sr-only">로그인된 이메일: {email} · </span>
          <span aria-hidden="true">{masked}</span>
        </span>
        <form action={signOut}>
          <button type="submit" className="hover:text-ink hover:underline">
            로그아웃
          </button>
        </form>
      </div>
    </header>
  );
}
