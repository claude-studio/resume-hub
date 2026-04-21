# Phase 0 · Research: 로그인 및 기본 프로필 관리

CLAUDE.md의 아키텍처 결정(Supabase + Google OAuth + Direct Supabase + Vitest)을 전제로 하고, 이번 스펙에서 실제 구현 시 갈라지는 지점들에 대해서만 선택·근거를 기록한다.

## 1. Google OAuth 플로우 형태

**Decision**: Supabase Auth의 **Authorization Code + PKCE** 플로우(서버 사이드 교환)를 사용한다. 브라우저에서 `signInWithOAuth({ provider: 'google' })` 호출 → Supabase → Google 동의 → `redirect_to`로 지정한 `/auth/callback?code=...` → Route Handler가 `exchangeCodeForSession(code)`로 쿠키 세션 수립.

**Rationale**:
- Next.js App Router의 서버 쿠키 기반 세션 방식에 맞는 표준 패턴(`@supabase/ssr` 공식 가이드).
- Implicit flow 대비 토큰이 URL에 노출되지 않고 쿠키 전용으로 머문다 → XSS 표면 축소.
- Service role 키 없이 anon 키만으로 동작 → 클라이언트 번들에 비밀 없음.

**Alternatives considered**:
- `signInWithOAuth` + Implicit flow: URL fragment에 access_token 노출, SSR에서 세션 재구성 번거로움.
- `@auth/core`(NextAuth) + Supabase adapter: 어댑터 층이 하나 더 늘어나고 RLS 연동 시 JWT 클레임 수동 매핑 필요.

## 2. Next.js 내 Supabase 클라이언트 분리

**Decision**: `@supabase/ssr`의 `createBrowserClient` / `createServerClient`를 각각 분리해서 사용.
- 브라우저용: 클라이언트 컴포넌트·훅(`useProfile`)에서만 import.
- 서버용: Route Handler(`/auth/callback`), 서버 컴포넌트(`/profile/page.tsx`의 초기 데이터 로드), `middleware.ts`(세션 갱신)에서 사용.

**Rationale**: App Router는 동일 코드가 서버/클라이언트 양쪽에서 실행되지 않도록 "use client" 경계를 명확히 해야 한다. 단일 클라이언트 팩토리를 쓰면 Node/Edge 런타임에서 쿠키 API 호환성 이슈가 자주 발생.

**Alternatives considered**:
- 단일 universal 클라이언트: 쿠키 어댑터 주입 분기 코드가 `lib/supabase`에 집중되어 복잡.
- 서비스 레이어(`repository`)로 감싸 클라이언트를 감추기: 현 MVP 규모에선 과투자.

## 3. 보호 경로 처리

**Decision**: Next.js `middleware.ts`에서 `updateSession(request)` 호출로 토큰 만료 시 재발급하고, `/profile/*` 경로에 세션이 없으면 `/`(랜딩)으로 307 리다이렉트.

**Rationale**: 서버 컴포넌트에서 최초 렌더 직전에 세션 상태가 보장되어, 클라이언트 사이드 깜빡임(auth flicker) 없음.

**Alternatives considered**:
- 클라이언트 훅으로만 처리: 초기 렌더가 "로그인 필요" → "콘텐츠" 플리커링.
- 서버 컴포넌트에서 매번 `redirect()`: 미들웨어 없이 처리 가능하나 쿠키 갱신 로직을 각 페이지가 중복 수행.

## 4. `profiles` 테이블 격리 방식

**Decision**: RLS 정책 세트:
- SELECT: `auth.uid() = user_id`
- INSERT: `auth.uid() = user_id` (클라이언트 직접 insert는 사용 안 하지만 심층 방어)
- UPDATE: `auth.uid() = user_id`
- DELETE: 비활성(탈퇴는 이번 스펙 범위 밖)

최초 프로필 생성은 **DB 트리거** `on_auth_user_created`가 `auth.users` insert를 감지해 `public.profiles`에 1행 생성. 이메일·이름은 `raw_user_meta_data` / `email`에서 복제.

**Rationale**: 클라이언트에 "없으면 만들기" 로직을 두면 동시 로그인 시 중복 row 경합. 트리거로 서버 사이드에서 원자적 처리.

**Alternatives considered**:
- Upsert in client on first mount: 경쟁 상태 + RLS 정책을 INSERT에도 허용해야 함 → 공격 표면 확대.
- Service role로 서버에서 create: 이번 MVP에선 service role 도입 회피 결정.

## 5. 이메일 읽기 전용 표현

**Decision**: `profiles.email`에 구글 이메일 복제 저장. UI에서는 `disabled` input + 설명 문구. 서버 관점에서도 UPDATE 정책이 `email` 컬럼을 변경 불가 컬럼으로 다루도록 트리거 또는 정책 체크 추가.

**Rationale**: 익스텐션 자동완성 시 `profiles`만 조회하면 되게 하려면 email을 테이블에 둬야 편함. 단, user-editable 아님을 RLS+트리거로 강제.

**Alternatives considered**:
- `profiles`에 email 두지 않고 `auth.users`에서 조인: RLS·PostgREST 규약 상 `auth` 스키마 직접 조회 불가 → 함수 노출 필요로 복잡.

## 6. 저장 검증 레이어

**Decision**: 2-레이어 검증.
- 클라이언트: Zod 스키마(`packages/shared/src/schemas/profile.ts`)로 이름 필수(≥1자)·전화는 선택(정규식 완화, 국제 포맷 허용)·소개는 선택(≤200자).
- DB: `profiles` 테이블에 `CHECK (char_length(trim(full_name)) > 0)`과 `CHECK (char_length(headline) <= 200)` 제약.

**Rationale**: 클라이언트 검증은 UX·피드백, DB 제약은 최종 진실의 원천(malformed/bypass 차단).

**Alternatives considered**:
- 클라이언트만: RLS 우회 직접 curl로 잘못된 payload 주입 가능.
- DB만: UX 비효율, 매 저장 시 왕복 발생.

## 7. 테스트 범위

**Decision**:
- **Vitest 단위 테스트**: Zod 스키마(`profile.schema.ts`)의 통과/실패 케이스. 변환 유틸(구글 표시 이름 → profiles.full_name 기본값) 있으면 같이.
- **React Testing Library**: `ProfileForm` 렌더 + 검증 메시지 + "저장됨" 상태 표시 (Supabase 클라이언트는 모킹).
- **수동 E2E**: OAuth 라운드트립과 RLS는 실제 Supabase 인스턴스 없이 자동화 비용 과다 → `quickstart.md`에 체크리스트화된 수동 스모크 테스트로 대체. Playwright E2E는 후속 스펙에서 도입.

**Rationale**: MVP 규모에서 E2E 오케스트레이션 세팅(로컬 Supabase + Chromium + 실제 Google 또는 모킹) 비용 >> 얻는 신뢰. 수동 스모크 + DB 제약 검증이 현실적.

**Alternatives considered**:
- Playwright + Supabase local CLI: 초기 셋업 비용·러닝 시간. 후속 기능이 쌓인 뒤 일괄 도입이 효율적.

## 8. 접근성(A11y) 구현 전략 — Clarify Q2 후속

**Decision**: WCAG 2.1 AA 실질 준수(FR-012)를 `ProfileForm`에서 다음으로 만족:
- `<form>` 의미론 + 모든 `<input>`에 `<label htmlFor>`.
- 오류 메시지는 `<p id="field-error">`에 담고 입력에 `aria-describedby="field-error"` + `aria-invalid="true"` 연결.
- 필드 fieldset 없이 flat 구조(필드가 4개라 섹션 분할 불필요).
- 포커스 순서는 DOM 순서에 일치. "저장" 버튼은 마지막 필드 다음.
- Tailwind 토큰(`text-ink` / `text-warm-500` on `bg-surface`)의 대비 확인 → 토큰 자체가 4.5:1 이상 만족(DESIGN.md 팔레트 기반).

**Rationale**: 별도 UI 라이브러리(Radix, Reach) 도입 없이 표준 HTML + 토큰만으로 AA 실질 준수 달성 가능. 복잡한 드롭다운·콤보박스가 아니라 text input뿐이므로 네이티브 접근성 기본이 충분.

**Alternatives considered**: Radix UI primitives 도입 → 프로필 폼 규모에 과투자.

## 9. 성능 목표 — Clarify Q5 후속

**Decision**: CWV Good 기준(SC-007) 충족을 위해:
- 랜딩: App Router의 SSG(`export const dynamic = 'force-static'`). 서드파티 스크립트 0개.
- 프로필: 서버 컴포넌트에서 Supabase 서버 클라이언트로 초기 프로필 1회 fetch → 직렬화해 클라이언트 컴포넌트에 prop 전달. 클라이언트 재fetch 없음.
- 폰트: 시스템 폰트 스택(`NotionInter` fallback이 `Inter` → system fonts). 커스텀 웹폰트 v1 미사용으로 CLS 제거.

**Rationale**: LCP/TTFB 둘 다 서버 사이드 렌더링 품질로 결정됨. DB 호출 1회 + 가벼운 마크업만 있으면 Vercel/유사 플랫폼에서 기본 목표 달성.

**Alternatives considered**: 프로필도 정적 생성(ISR) → 사용자별 데이터라 무의미.

## 10. 로딩 UX 표준 — Clarify Q4 후속

**Decision**: 모든 비동기 트리거 버튼은 `disabled={isPending}` + 레이블을 진행형("저장 중…", "로그인 중…")으로 교체. 별도 스피너는 **200ms 초과 시**에만 조건부 렌더.

**Rationale**: 버튼 자체의 상태 변화가 가장 즉각적·접근 가능한 피드백. 짧은 요청에 스피너 플래시는 오히려 불안감.

**Alternatives considered**: 항상 스피너 표시 → 빠른 요청에서 시각적 노이즈.

## 11. 세션 처리 — Clarify Q1 후속

**Decision**: `@supabase/ssr`의 `updateSession()`을 Next.js `middleware.ts`에서 호출. access token 만료 시 내부적으로 refresh token 사용해 쿠키 갱신 → 원 요청은 갱신된 세션으로 자연 성공. refresh까지 실패하면 미들웨어가 `/`로 리다이렉트.

**Rationale**: Supabase 기본 동작에 정렬(Q1 A). 추가 코드 최소.

## 12. 계정 삭제 요청 처리 — Clarify Q3 후속

**Decision**: MVP에서는 자동 UI 없음. 랜딩 푸터에 `privacy@…` 메일 링크 제공. 운영자가 Supabase 대시보드 → Authentication → Users에서 해당 사용자 삭제하면 FK CASCADE로 `profiles` 제거.

**Rationale**: 30일 이내 대응이 PIPA·GDPR 최소선 충족. 자동 탈퇴 UI는 사용자 수가 늘어난 뒤 구현해도 늦지 않음.

---

**Output status**: 모든 Phase 0 의사결정 기록 완료. Clarify 결과 5건 반영. `NEEDS CLARIFICATION` 없음. Phase 1 진입 가능.
