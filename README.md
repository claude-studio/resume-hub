# resume-hub

통합 이력 관리 서비스. 한 곳에서 이력 데이터를 관리하고, 다양한 플랫폼의 이력서 입력 폼을 브라우저 확장으로 자동 완성합니다.

## 구성

| 워크스페이스 | 설명 |
|---|---|
| `apps/web-service` | 이력 데이터 중앙 관리 웹 앱 (Next.js App Router) |
| `apps/web-extension` | 플랫폼 이력서 폼 자동 완성 익스텐션 (WXT) |
| `packages/shared` | 공용 타입·도메인 모델·유틸 |
| `packages/ui` | 공용 React + Tailwind v4 컴포넌트 |

## 요구 사항

- Node.js `>= 20.18`
- pnpm `>= 10`

## 자주 쓰는 명령

```bash
pnpm install             # 의존성 설치
pnpm dev:service         # 웹 서비스 개발 서버
pnpm dev:extension       # 익스텐션 개발 모드
pnpm build               # 전체 워크스페이스 빌드
pnpm typecheck           # 전체 타입 체크
pnpm lint                # Biome 검사
pnpm lint:fix            # Biome 자동 수정
```

## 개발 흐름

- **spec-kit** 기반 SDD: `/speckit-specify` → `/speckit-plan` → `/speckit-tasks` → `/speckit-implement`
- **impeccable** 스킬로 UI 디자인 품질 유지
- 디자인 참고: [awesome-design-md](https://github.com/VoltAgent/awesome-design-md)
