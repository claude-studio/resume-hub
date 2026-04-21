import { Button, Text } from '@resume-hub/ui';

export function App() {
  return (
    <div className="flex w-80 flex-col gap-3 p-4">
      <Text size="sm" tone="muted">
        resume-hub
      </Text>
      <h1 className="text-lg font-semibold">이력 자동 완성</h1>
      <Text size="sm" tone="muted">
        현재 페이지의 이력서 폼을 감지하면 저장된 데이터를 한 번에 채워 넣습니다.
      </Text>
      <Button size="sm">연결된 프로필 확인</Button>
    </div>
  );
}
