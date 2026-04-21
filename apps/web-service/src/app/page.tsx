import { nowISO } from '@resume-hub/shared';
import { Button, Text } from '@resume-hub/ui';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 px-6 py-16">
      <Text as="span" size="sm" tone="muted">
        resume-hub · {nowISO().slice(0, 10)}
      </Text>
      <h1 className="text-4xl font-semibold tracking-tight">통합 이력 관리 서비스</h1>
      <Text tone="muted">
        이력 데이터를 한 곳에서 관리하고, 익스텐션으로 플랫폼별 이력서 폼을 자동 완성합니다.
      </Text>
      <div className="flex gap-2">
        <Button>시작하기</Button>
        <Button variant="secondary">익스텐션 받기</Button>
      </div>
    </main>
  );
}
