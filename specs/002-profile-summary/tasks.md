---

description: "Task list for 002-profile-summary implementation"
---

# Tasks: 프로필 자기소개 필드

**Input**: `/specs/002-profile-summary/` · spec.md · plan.md · data-model.md · contracts/ · quickstart.md · design-brief.md

## Phase 1: Setup & Foundational

- [ ] T001 Create `supabase/migrations/0002_summary.sql` from `contracts/0002_summary.sql`
- [ ] T002 Apply migration to Supabase (manual — `supabase db push`). Verify via `information_schema.columns` + `pg_constraint` per quickstart §1.

## Phase 2: User Story 1 — 자기소개 작성·저장 (P1) 🎯 MVP

- [ ] T003 [P] [US1] Update `packages/shared/src/schemas/profile.ts` — add `summary` to `profileEditSchema` with code-point-based `.refine((v) => Array.from(v).length <= 1000, …)` + `.optional().or(z.literal(''))`. Add `summary: string | null` to `ProfileRow`. Export `codePointCount` helper.
- [ ] T004 [P] [US1] Update `packages/shared/src/schemas/profile.test.ts` — add cases: valid 500-char, empty OK, 1000 code points OK, 1001 rejected, emoji counted at code-point level.
- [ ] T005 [US1] Update `apps/web-service/src/features/profile/useProfile.ts` — include `summary` in `rowToValues`, include in supabase `update` payload (`summary: values.summary?.trim() || null`).
- [ ] T006 [US1] Update `apps/web-service/src/features/profile/ProfileForm.tsx` — render new `FormField id="summary"` below headline. textarea `min-h-[7.5rem]`, `maxLength={1000}`, `autoComplete="off"`, placeholder from design-brief §7. Counter uses `codePointCount(watch('summary') ?? '')`, 800+ warn, 1000 danger (same style as headline counter).
- [ ] T007 [P] [US1] Update `apps/web-service/src/features/profile/ProfileForm.test.tsx` — render & prefill (with `summary: null` → shows empty), type 1500 chars truncated to 1000, emoji-only 3 chars counter shows `3 / 1000`, empty save succeeds.

## Phase 3: Polish & Verification

- [ ] T008 `pnpm typecheck · lint · test` all green
- [ ] T009 Run quickstart §3 manual smoke (10 scenarios)
- [ ] T010 Run `/critique` + `/audit` + `/polish` trio on updated ProfileForm

---

## Dependencies

- T001 → T002 (migration file must exist to push)
- T003 must land before T005, T006 (consume new schema)
- T004, T007 are test-only, parallelizable after their subjects exist
- Phase 3 depends on Phase 2 complete

## Strategy

Small additive feature — single PR, no staged rollout. Foundational + US1 can run in one session.
