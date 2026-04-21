import { Button } from '@resume-hub/ui';
import { signOut } from '@/features/auth/actions';

interface Props {
  email: string;
}

export function ProfileHeader({ email }: Props) {
  const local = email.split('@')[0] ?? '';
  const masked = `${local}@…`;

  return (
    <header className="flex items-center justify-between pb-8">
      <span className="text-sm font-semibold tracking-[-0.004em] text-ink">resume-hub</span>
      <div className="flex min-w-0 items-center gap-3 text-[0.8125rem] text-warm-500">
        <span title={email} className="min-w-0 max-w-[16ch] truncate">
          <span className="sr-only">로그인된 이메일: {email} · </span>
          <span aria-hidden="true">{masked}</span>
        </span>
        <form action={signOut}>
          <Button type="submit" variant="ghost" size="xs">
            로그아웃
          </Button>
        </form>
      </div>
    </header>
  );
}
