# resume-hub — Agent Notes

통합 이력 관리 서비스 모노레포. 아래 규칙을 따르세요.

## 디자인 시스템

- **참고 문서 2단 구조**:
  - `DESIGN.md` — Notion 시스템 원천 (warm neutrals · 타이포그래피 · 여백 규칙). 구조·리듬·anti-pattern 참고용.
  - `.impeccable.md` — 프로젝트 override를 담은 디자인 컨텍스트 (브랜드 컬러·페르소나·톤). UI 작성 전 먼저 읽기.
- **토큰 레이어**: `packages/ui/src/styles.css`의 `@theme` 블록이 Tailwind v4 토큰으로 노출합니다. **파일이 자기 자신 `@source` 선언을 가지므로** 소비 앱의 CSS에서는 `@import "@resume-hub/ui/styles.css"` 한 줄만 있으면 됩니다 (깊은 상대경로 사용 금지).
  - 색 → `bg-accent`(Forest Green), `text-ink`, `text-warm-500`, `text-[color:var(--color-danger)]`, `border-[color:var(--color-border-whisper)]` 등
  - 라운드 → `rounded-[4px]`(버튼·인풋), `rounded-[12px]`(카드), `rounded-full`(pill)
  - 섀도우 → `shadow-[var(--shadow-card)]`
  - 폰트 → `font-sans` (Pretendard Variable → Pretendard → NotionInter → Inter → system)
- **브랜드 컬러 히스토리**: Notion Blue → 다홍 → Soft Coral → **Forest Green** (`oklch(45% 0.10 150)`). 붉은 계열이 danger와 시각 혼동을 일으켜 green으로 정착. 원칙: hue 거리 100° 이상을 accent/danger 사이에 유지.
- **컴포넌트 프리미티브**: `Button` (primary·secondary·ghost·outline + xs·sm·md), `FormField` (label + 필수 asterisk + error/hint + 자동 ARIA), `Text`.
- **원칙**: 근본 상수(hex, rem)를 컴포넌트에 직접 박지 말고 토큰/유틸로 표현합니다. `.impeccable.md`에 없는 새 브랜드 결정은 먼저 문서에 추가한 뒤 토큰화합니다.

## impeccable 스킬

- `/impeccable craft` — 새 UI를 설계→구현 플로우로 생성.
- `/impeccable teach` — 프로젝트에 디자인 컨텍스트(토큰·패턴)를 학습시킬 때.
- `/impeccable extract` — 반복 등장한 컴포넌트를 `packages/ui`로 승격.
- 보조 스킬: `critique`, `audit`, `polish`, `typeset`, `colorize`, `layout`, `distill`, `delight`, `animate`, `adapt`.

UI 품질 이슈(대비, 계층, 간격 등)가 보이면 임의로 고치지 말고 맞는 스킬을 호출합니다.

## 아키텍처 결정

- **데이터 저장소**: Supabase (Postgres + Auth + Storage).
- **인증**: Google OAuth via Supabase Auth.
- **확장 ↔ 서비스 통신**: Direct Supabase. 웹과 익스텐션 모두 `@supabase/supabase-js`로 Supabase에 직접 붙고, 권한은 **RLS 정책**으로 제어합니다. 별도 API 레이어(tRPC 등)는 두지 않습니다.
  - 익스텐션은 웹에서 로그인한 세션을 `chrome.storage`로 공유해 사용.
  - 서버 사이드 로직이 필요해지면 그때 `web-service`에 route handler나 tRPC 레이어를 도입.
- **테스트 러너**: Vitest. 워크스페이스별 `vitest.config.ts`가 루트 `vitest.config.ts`의 `test.projects`로 묶임. `pnpm test` / `pnpm test:watch`.
- 스캐폴딩(supabase-js 설치, client factory, `.env.example`, OAuth callback)은 첫 `/speckit-specify`에서 필요에 맞춰 배치.

## spec-kit 워크플로우

새 기능은 다음 순서:
1. `/speckit-specify` — 기능 사양 작성
2. `/speckit-plan` — 구현 계획
3. `/speckit-tasks` — 실행 가능한 태스크
4. `/speckit-implement` — 구현

## 레이아웃·네이밍

- 공통 코드는 `packages/shared`(타입·유틸), `packages/ui`(React 컴포넌트).
- 앱 전용 코드는 각 `apps/*` 내부에 둡니다.
- 워크스페이스 import는 항상 `@resume-hub/shared`, `@resume-hub/ui`.
- Biome(`pnpm lint`)와 typecheck(`pnpm typecheck`)는 커밋 전 통과.

## Active Technologies
- TypeScript 5.9, Node.js ≥20.18 + Next.js 15 (App Router) · React 19 · Tailwind CSS v4 · `@supabase/supabase-js` v2 · `@supabase/ssr` · Supabase Auth (Google provider) (001-auth-profile)
- Supabase Postgres (managed), `profiles` 테이블 + RLS 정책 (001-auth-profile)

## Recent Changes
- 001-auth-profile: Added TypeScript 5.9, Node.js ≥20.18 + Next.js 15 (App Router) · React 19 · Tailwind CSS v4 · `@supabase/supabase-js` v2 · `@supabase/ssr` · Supabase Auth (Google provider)
