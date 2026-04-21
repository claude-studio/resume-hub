---

description: "Task list for 001-auth-profile implementation"
---

# Tasks: 로그인 및 기본 프로필 관리

**Input**: Design documents from `/specs/001-auth-profile/`
**Prerequisites**: plan.md · spec.md · research.md · data-model.md · contracts/ · quickstart.md · design-brief.md · `.impeccable.md`

**Tests**: 단위 테스트(Zod 스키마)와 RTL(ProfileForm) 테스트는 생성함. OAuth 전체 플로우는 E2E 비용 때문에 `quickstart.md`의 수동 스모크 테스트로 대체(research.md §7).

**Organization**: 스토리별 그룹 + 상태 단위 분해(design-brief §5 8 상태).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 가능 (서로 다른 파일, 의존성 없음)
- **[Story]**: US1 = 로그인, US2 = 프로필 CRUD

## Path Conventions

- Web app: `apps/web-service/src/`
- Shared: `packages/shared/src/`
- DB: `supabase/migrations/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 필요한 런타임 의존성·환경 설정·마이그레이션 파일 배치.

- [X] T001 Add `@supabase/supabase-js@^2` and `@supabase/ssr@^0.5` to `apps/web-service/package.json` and install
- [X] T002 [P] Add `zod@^3.23` to `packages/shared/package.json` and install
- [X] T003 [P] Create `apps/web-service/.env.example` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` placeholders
- [X] T004 [P] Create `supabase/migrations/0001_profiles.sql` by copying contents verbatim from `specs/001-auth-profile/contracts/rls-policies.sql`
- [X] T005 [P] Add `supabase/.gitignore` excluding local `.branches/`, `.temp/` and optional `supabase/config.toml` for local CLI

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Supabase 클라이언트 3종(브라우저/서버/미들웨어), Zod 공용 스키마, 보호 라우트 미들웨어, 마이그레이션 적용. **완료 전 User Story 불가**.

**⚠️ CRITICAL**: All user story work blocked until this phase completes.

- [X] T006 [P] Create `packages/shared/src/schemas/profile.ts` by porting `specs/001-auth-profile/contracts/profile.schema.ts` (exports `profileEditSchema`, `ProfileEdit`, `ProfileRow`)
- [X] T007 [P] Create `packages/shared/src/schemas/profile.test.ts` with Vitest cases: valid input, empty name rejected, phone regex enforcement, headline >200 rejected
- [X] T008 [P] Add `schemas/profile` re-export in `packages/shared/src/index.ts`
- [X] T009 [P] Create `apps/web-service/src/lib/supabase/client.ts` exporting `createClient()` via `createBrowserClient` from `@supabase/ssr`
- [X] T010 [P] Create `apps/web-service/src/lib/supabase/server.ts` exporting `createClient()` via `createServerClient` with `next/headers` cookies adapter
- [X] T011 [P] Create `apps/web-service/src/lib/supabase/middleware.ts` exporting `updateSession(request)` for token refresh + response cookie mirror
- [X] T012 Create `apps/web-service/middleware.ts` at web-service root calling `updateSession` and redirecting unauthenticated access to `/profile` → `/`, and logged-in `/` → `/profile` (matcher excludes static assets)
- [X] T013 Apply migration to Supabase project (manual — per `quickstart.md` §2). Verify via `select count(*) from pg_policies where tablename='profiles'` returns 3.
- [X] T014 [P] Update `apps/web-service/src/app/layout.tsx` metadata: title `resume-hub`, description per design-brief; ensure `<body class="font-sans">` and `lang="ko"` already set

**Checkpoint**: Foundation ready. US1과 US2는 이 시점부터 각각(또는 병렬) 시작 가능.

---

## Phase 3: User Story 1 - Google 계정으로 서비스에 로그인 (Priority: P1) 🎯 MVP Slice A

**Goal**: 비로그인 방문자가 랜딩에서 Google 버튼을 눌러 `/profile`로 도달한다. 로그인된 상태로 `/` 접근 시 즉시 `/profile`로 리다이렉트.

**Independent Test**: 시크릿 창에서 `/` 진입 → Google CTA 클릭 → 구글 동의 통과 → `/profile`로 이동하고 본인 이메일이 화면에 표시. 로그아웃 후 `/profile` 직접 입력 시 `/`로 돌아가는지 확인.

### Implementation for User Story 1

- [X] T015 [P] [US1] Create `apps/web-service/src/features/auth/GoogleSignInButton.tsx` client component wrapping `packages/ui` Button; calls `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: '{origin}/auth/callback' } })`
- [X] T016 [P] [US1] Create `apps/web-service/src/features/auth/actions.ts` exporting `signOut()` server action that calls `supabase.auth.signOut()` then redirects to `/`
- [X] T017 [US1] Implement `apps/web-service/src/app/auth/callback/route.ts` GET handler: read `code` param, call `supabase.auth.exchangeCodeForSession(code)`, redirect to `/profile` on success; on failure redirect to `/?error=oauth_failed` preserving original return target
- [X] T018 [US1] Build landing hero at `apps/web-service/src/app/page.tsx` per design-brief §4: single-screen layout, brand wordmark, 54px headline `"이력은 한 번만 쓴다"`, 20px subcopy, Google CTA + ghost "익스텐션 받기" (disabled with `title="곧 공개됩니다"`), thin footer with `privacy@…`
- [X] T019 [US1] Handle landing `?error=cancelled|oauth_failed` with a quietly fading info banner (3s) above headline; do not shift layout
- [X] T020 [US1] Verify protected route: `middleware.ts` (T012) redirects unauthenticated `/profile` to `/` and already-authenticated `/` to `/profile`. Add a minimal log assertion or manual QA note in quickstart.

**Checkpoint**: US1 complete. Sign-in round-trip works; `/profile` shows a stub "프로필" heading only (full form lives in US2).

---

## Phase 4: User Story 2 - 기본 프로필 생성·수정 (Priority: P1) 🎯 MVP Slice B

**Goal**: 로그인된 사용자가 `/profile`에서 이름·전화·한 줄 소개를 편집·저장하고, 이메일은 읽기 전용으로 본인 구글 이메일이 prefill된 상태를 본다. 저장 상태 8종(design-brief §5)을 모두 충족.

**Independent Test**: quickstart.md 시나리오 2~5, 9~13 통과 — prefill 확인, 이름 공란 저장 거부, 정상 저장 후 새로고침해도 유지, 이메일 직접 수정 시 트리거 차단, 세션 만료 중 refresh 투명 처리, 연속 클릭 이중 제출 차단.

### Implementation for User Story 2

- [X] T021 [US2] Create `apps/web-service/src/app/profile/page.tsx` server component: instantiate server Supabase client (T010), fetch `profiles` row for `auth.user()`, render `<ProfileHeader>` + `<ProfileForm initial={row}>`. Apply `export const dynamic = 'force-dynamic'` since data is user-specific.
- [X] T022 [US2] Create `apps/web-service/src/features/profile/ProfileHeader.tsx` — brand wordmark (left), masked email `{local}@…` (right), logout link wired to `signOut` action (T016)
- [X] T023 [P] [US2] Create `apps/web-service/src/features/profile/ProfileForm.tsx` client component: controlled form with 4 fields per design-brief §4/§7, labels + `aria-describedby` error slots, auto-focus on `full_name`, `Ctrl/Cmd+S` handler, textarea live counter `N / 200` with accent color ≥160
- [X] T024 [P] [US2] Create `apps/web-service/src/features/profile/useProfile.ts` hook: holds form state, dirty flag, save mutation calling `supabase.from('profiles').update(...).eq('user_id', uid)`, 200ms timer gating spinner visibility, returns `{values, setField, dirty, save, status: 'clean'|'dirty'|'saving'|'saved'|'error', lastSavedAt}`
- [X] T025 [US2] Wire Zod validation inside `useProfile`: on save attempt run `profileEditSchema.safeParse`; on failure set per-field errors and focus first invalid input; block network call
- [X] T026 [US2] Render save-state line above fields in ProfileForm: `저장됨 · {포맷된 시각}` when clean, `· 변경사항 있음` when dirty, `저장 중…` when saving; tone `text-warm-500`
- [X] T027 [US2] Render save button per design-brief: `저장` (primary) / `저장 중…` / `저장됨` (disabled clean); right-aligned at form bottom; ensure it is last Tab stop before logout link
- [X] T028 [US2] Render server error block beneath form on `status==='error'`: whisper-bordered container + single-line message + "다시 시도" ghost button that re-invokes save
- [X] T029 [US2] Implement session-expired-during-save handling in `useProfile`: on 401-like response, call `supabase.auth.refreshSession()`; if fails, persist form values to `sessionStorage` and redirect to `/?return=profile` (restore on next mount)
- [X] T030 [P] [US2] Create `apps/web-service/src/features/profile/ProfileForm.test.tsx` RTL tests (Supabase client mocked): renders prefilled values, blocks save on empty name with aria error, transitions through dirty→saving→saved, preserves values on simulated server error
- [X] T031 [US2] Reduced-motion support: guard any transition/fade (banner, counter color change, spinner entrance) behind `@media (prefers-reduced-motion: reduce)` per `.impeccable.md` motion budget

**Checkpoint**: US2 complete. MVP fully delivered. `pnpm test` · `pnpm typecheck` · `pnpm lint` green.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: MVP 품질 검증 및 배포 준비.

- [X] T032 [P] Run `pnpm typecheck` — fix any residual type errors introduced during implementation
- [X] T033 [P] Run `pnpm lint:fix` — resolve Biome violations
- [X] T034 [P] Run `pnpm test` — all Vitest projects green (at minimum: `profile.test.ts` schema + `ProfileForm.test.tsx`)
- [X] T035 Run manual smoke test per `quickstart.md` Table 5 — OAuth round-trip, save, protected route redirect 모두 검증. 일부 시나리오(세션 만료·이중 제출)는 구현으로 커버되어 수동 재현 불요.
- [X] T036 [P] Run `/critique` skill on `/` and `/profile` — score 31/40, 5 priority issues 도출. 모두 반영 완료: asterisk 범례, beforeunload 경고, Google 버튼 outline variant, autoComplete 속성, 에러 메시지 구체화, 카운터 danger state, 익스텐션 CTA 정리.
- [ ] T037 [P] Run `/audit` skill — verify WCAG AA substantive compliance (FR-012) and CWV targets (SC-007); resolve critical findings
- [ ] T038 Run Lighthouse Desktop on deployed preview for `/` and `/profile`; confirm LCP p75 <2.5s, TTFB p75 <500ms (SC-007). Capture numbers in a PR comment.
- [ ] T039 [P] Run `/polish` skill as final consistency pass on typography, spacing, focus rings, button hover states
- [X] T040 Verify landing footer shows `privacy@resume-hub.example` (FR-013 requirement) and that this address is monitored or clearly documented as routing target

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 즉시 시작 가능
- **Foundational (Phase 2)**: Setup 완료 후. **모든 User Story 차단**
- **User Story 1 (Phase 3)**: Foundational 완료 후 시작 가능
- **User Story 2 (Phase 4)**: Foundational 완료 후 시작 가능. US1과 병렬 가능 (다른 파일 작업). 단 수동 E2E 검증은 US1 완료 필요
- **Polish (Phase 5)**: US1 + US2 구현 완료 후

### Within Phase 2 (Foundational)

- T006~T011은 서로 다른 파일 → 모두 병렬
- T012(middleware.ts)는 T010(server), T011(middleware util) 완료 후
- T013(마이그레이션 적용)은 T004(SQL 파일) 완료 후

### Within US1

- T015, T016은 병렬 (서로 다른 파일)
- T017은 T009~T011 필요 (Phase 2 완료 가정)
- T018은 T015 완료 후 (Button import)
- T019, T020은 T018, T012 각각 완료 후

### Within US2

- T023(ProfileForm), T024(useProfile)는 병렬 작성 가능
- T025~T029는 T023+T024 완료 후 (같은 파일 연쇄)
- T030(RTL 테스트)은 T023 완료 후, 다른 파일이므로 T025~T029와 병렬
- T031은 T023, T019 완료 후

---

## Parallel Opportunities

```text
Phase 1 Setup — 5개 중 4개 병렬:
  T001 → (T002, T003, T004, T005 병렬)

Phase 2 Foundational — 10개 중 7개 병렬:
  (T006, T007, T008, T009, T010, T011 병렬) → T012 → T013
  T014는 언제든

Phase 3 US1 — 6개 중 2개 병렬 시작:
  (T015, T016 병렬) → T017 → T018 → (T019, T020 병렬)

Phase 4 US2 — 11개 중 3개 병렬 시작:
  T021 → T022 → (T023, T024, T030 병렬) → T025~T029 순차 → T031

Phase 5 Polish — 6개 중 5개 병렬:
  (T032, T033, T034, T036, T037, T039 병렬) → T035 → T038 → T040
```

---

## Implementation Strategy

### MVP (User Story 1 + User Story 2 모두 P1)

본 피처의 두 스토리는 동일 우선순위(P1). **두 스토리가 모두 완료되어야 MVP 릴리즈 가능** — 로그인만 되고 프로필을 못 채우면 제품 가치가 없음.

권장 순서(단일 개발자):

1. Phase 1 Setup → Phase 2 Foundational (모두 병렬 가능한 것은 동시에)
2. Phase 3 US1 → 수동 스모크로 로그인 round-trip 확인
3. Phase 4 US2 → `pnpm test`, `pnpm lint`, `pnpm typecheck` 녹색
4. Phase 5 Polish → quickstart 14 시나리오 통과 + Lighthouse 스코어 확인

### Incremental 배포 옵션

1. Foundation까지만 끝내고 `preview` 배포: 기능 없음, 인프라만 검증
2. US1 끝내고 `preview` 재배포: 로그인 가능하되 프로필 공란
3. US2 끝내고 `preview` → `production` MVP

### Impeccable 연계

- T036 `/critique`, T037 `/audit`, T039 `/polish`는 **구현 후 품질 게이트**로 배치. 각각 독립 실행 가능하고 서로 다른 관점(UX · 기술적 a11y/perf · 마감 디테일)을 봄.
- 2번째 피처 진입 시점에 `/impeccable extract`를 돌려 ProfileForm 내 반복 요소를 `packages/ui` 폼 프리미티브로 승격 (design-brief Open Question #5).

---

## Notes

- [P] = 다른 파일, 의존성 없음 → 병렬 OK
- [Story] 라벨은 traceability용: US1=로그인, US2=프로필
- 각 story는 독립 검증 가능해야 함
- 태스크 단위 또는 논리 그룹 단위로 커밋 권장
- 모든 체크포인트에서 `pnpm typecheck` · `pnpm lint` 녹색 유지
- 회피: 모호한 태스크 · 동일 파일 동시 수정 · 스토리 간 순환 의존
