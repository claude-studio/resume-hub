# Implementation Plan: 로그인 및 기본 프로필 관리

**Branch**: `001-auth-profile` | **Date**: 2026-04-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-auth-profile/spec.md`

## Summary

구글 OAuth로 로그인한 사용자가 본인 전용 프로필(이름·이메일·전화·한 줄 소개)을 생성·수정할 수 있게 한다. 기술적으로는 Supabase Auth(Google provider)로 세션을 수립하고, `profiles` 테이블을 Row Level Security 정책으로 사용자 단위 격리한 뒤, 웹(Next.js App Router)과 익스텐션(WXT) 양쪽이 `@supabase/supabase-js`로 직접 CRUD한다. 이번 스펙 범위는 웹만. 익스텐션은 저장된 데이터가 나중에 그대로 읽히도록 스키마·정책만 호환 보장.

## Technical Context

**Language/Version**: TypeScript 5.9, Node.js ≥20.18  
**Primary Dependencies**: Next.js 15 (App Router) · React 19 · Tailwind CSS v4 · `@supabase/supabase-js` v2 · `@supabase/ssr` · Supabase Auth (Google provider)  
**Storage**: Supabase Postgres (managed), `profiles` 테이블 + RLS 정책  
**Testing**: Vitest (unit, 공용 유틸/스키마) + @testing-library/react (UI 렌더링). 인증 흐름은 수동 E2E로 검증(quickstart 참조)  
**Target Platform**: 데스크톱·모바일 모던 브라우저(Chrome, Safari, Edge, Firefox latest)  
**Project Type**: 모노레포 웹 애플리케이션 (`apps/web-service` + 공용 `packages/shared`, `packages/ui`)  
**Performance Goals**: 프로필 저장 요청 P95 < 2초(SC-005); 랜딩 → 로그인 완료 < 30초(SC-001); **LCP < 2.5s · TTFB < 500ms (둘 다 p75, SC-007)**  
**Constraints**: 모든 DB 접근은 Supabase anon 키 + 사용자 JWT로만. Service role 키는 서버 사이드에서도 이번 스펙에선 사용하지 않음. RLS 미통과 쿼리는 에러여야 함(심층 방어). **WCAG 2.1 AA 실질 준수(FR-012)**. **비동기 액션은 진행 중 트리거 비활성화 + 200ms 이하 요청은 스피너 생략(FR-014)**.  
**Scale/Scope**: MVP 단일 리전, 초기 <10k users. 화면 수 2개(랜딩, 프로필). 프로필 컬럼 4개.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

프로젝트 `memory/constitution.md`는 아직 placeholder 상태(정식 원칙 미확정). 그래서 전통적 게이트 대신 이번 스펙에서 우리가 지키기로 한 프로젝트 기본 규칙을 게이트로 사용한다:

| Gate | Status | Note |
|------|--------|------|
| TypeScript strict 컴파일 통과 | PASS | 기존 `tsconfig.base.json` 상속 |
| Biome 린트 0 위반 | PASS | CI 수준 가드로 설정됨 |
| Vitest 단위 테스트 그린 | PASS | 공용 유틸·스키마는 테스트 필수, UI는 선택적 |
| RLS로 사용자 데이터 격리 보장 | **GATE** | 스키마·정책 추가 시 필수. 실패 시 구현 중단 |
| 서비스/익스텐션 공용 타입은 `@resume-hub/shared`에서만 | PASS | Profile 타입은 이미 `shared/types`에 존재. 본 스펙에서 필드 정합성 확장 |
| MVP 스코프 경계 준수 | PASS | Assumptions에 명시한 범위 밖 작업 금지 |
| **접근성 AA 실질 준수(FR-012)** | **GATE** | 키보드 전주행(SC-006) 수동 검증 필수. 실패 시 머지 차단 |
| **CWV Good(SC-007)** | PASS→검증 | 배포 후 Lighthouse/Field data로 측정. 랜딩 SSG + 프로필 서버 컴포넌트 스트리밍 전제 |

**Post-Phase 1 re-check**: 아래 Phase 1 산출물(`data-model.md`, `contracts/rls-policies.sql`)이 RLS 게이트를 명시적으로 만족함을 재확인함.

## Project Structure

### Documentation (this feature)

```text
specs/001-auth-profile/
├── plan.md                      # 본 파일
├── research.md                  # Phase 0 — 기술 선택 근거
├── data-model.md                # Phase 1 — profiles 스키마
├── quickstart.md                # Phase 1 — 로컬·Supabase 셋업 절차
├── contracts/
│   ├── rls-policies.sql         # Phase 1 — RLS + 트리거 SQL 계약
│   └── profile.schema.ts        # Phase 1 — Zod 검증 스키마
└── checklists/
    └── requirements.md          # /speckit-specify 산출
```

### Source Code (repository root)

```text
apps/web-service/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── callback/route.ts          # OAuth code → session 교환
│   │   ├── (marketing)/
│   │   │   └── page.tsx                   # 랜딩 + "Google로 시작하기"
│   │   ├── profile/
│   │   │   └── page.tsx                   # 프로필 화면 (보호됨)
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── features/
│   │   └── profile/
│   │       ├── ProfileForm.tsx            # 클라이언트 폼
│   │       ├── useProfile.ts              # supabase-js 호출 훅
│   │       └── profile-actions.ts         # 저장/로그아웃 액션
│   └── lib/
│       └── supabase/
│           ├── client.ts                  # 브라우저용 createBrowserClient
│           ├── server.ts                  # 서버 컴포넌트/Route Handler용 createServerClient
│           └── middleware.ts              # 세션 갱신·보호 라우트 가드
├── middleware.ts                          # 보호 경로(/profile) 리다이렉트
└── .env.example                           # 공개 키 플레이스홀더

packages/shared/
└── src/
    ├── types/index.ts                     # Profile 타입 (기존, 필드 정합성 확인)
    ├── schemas/
    │   └── profile.ts                     # Zod 검증 스키마 (신규)
    └── supabase/
        └── database.types.ts              # Supabase CLI가 생성한 테이블 타입(신규, 선택)

supabase/
├── migrations/
│   └── 0001_profiles.sql                  # profiles 테이블 + RLS + 트리거
└── config.toml                            # 선택: 로컬 supabase CLI 환경
```

**Structure Decision**: 기존 모노레포 구조(apps/\*, packages/\*) 그대로 사용. 본 스펙에서 새로 추가되는 영역은 (1) `apps/web-service/src/lib/supabase/` Supabase 어댑터, (2) `apps/web-service/src/features/profile/` 기능 전용 컴포넌트/훅, (3) `packages/shared/src/schemas/` Zod 계약, (4) `supabase/migrations/` SQL 계약. 익스텐션 쪽은 이번 스펙에선 건드리지 않음.

## Complexity Tracking

위반 사항 없음 — 게이트 모두 통과, 추가 복잡도 정당화 불필요.

## Post-Design Re-check

Phase 1 산출물 작성 완료 후 재평가:

- **RLS 게이트**: `contracts/rls-policies.sql`의 SELECT/UPDATE 정책이 `auth.uid() = user_id`로 강제. 최초 로그인 트리거가 `auth.users` → `public.profiles`로 프로필 1개 자동 생성. 통과.
- **공용 타입 게이트**: `packages/shared/src/types/index.ts`의 `Profile` 필드(이름/이메일/전화/한 줄 소개)가 `profiles` 테이블·Zod 스키마와 1:1 정렬. 통과.
- **MVP 스코프 게이트**: 이메일은 `auth.users.email`에서 복제만 하고 `profiles`에는 수정 가능 컬럼으로 두지 않음(읽기 전용). 경력·학력·스킬 테이블은 이번 마이그레이션에서 제외. 통과.
- **Clarify 결과 반영 (2026-04-22)**: FR-011(세션 정책)·FR-012(A11y AA)·FR-013(삭제 요청 30일)·FR-014(로딩 상태)·SC-006(키보드 전주행)·SC-007(CWV)이 본 설계에 추가 반영됨.
  - 랜딩 페이지는 `export const dynamic = 'force-static'`으로 SSG.
  - 프로필 페이지는 서버 컴포넌트에서 초기 프로필 로드 → 자식 클라이언트 컴포넌트에 prop으로 주입(클라이언트 사이드 로딩 표시 회피).
  - `@supabase/ssr` middleware의 `updateSession()`이 access token refresh를 투명하게 처리.
  - `ProfileForm`은 `<form>` 의미론 + 모든 `<input>`에 `<label htmlFor>` + 오류는 `<p id>` + 입력의 `aria-describedby`로 연결.
  - 모든 submit 버튼은 `disabled={isPending}` + 레이블 진행형 교체. 200ms 타이머로 스피너 조건부 표시.

## Artifacts

- [research.md](./research.md) — Supabase Auth 플로우·RLS·Next.js 연동 의사결정
- [data-model.md](./data-model.md) — `profiles` 엔티티·관계·상태 전이
- [contracts/rls-policies.sql](./contracts/rls-policies.sql) — 마이그레이션 계약 SQL
- [contracts/profile.schema.ts](./contracts/profile.schema.ts) — Zod 검증 계약
- [quickstart.md](./quickstart.md) — Supabase 프로젝트 프로비저닝·로컬 실행 절차
