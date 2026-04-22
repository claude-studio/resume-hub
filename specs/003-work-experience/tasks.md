---

description: "Task list for 003-work-experience implementation"
---

# Tasks: 경력 관리 (Work Experience CRUD)

**Input**: `/specs/003-work-experience/` · spec.md · plan.md · research.md · data-model.md · contracts/ · design-brief.md · quickstart.md
**Prerequisites**: 001-auth-profile · 002-profile-summary (두 피처 main에 머지됨)

## Phase 1: Setup & Foundational (Shared Infrastructure)

- [ ] T001 Port `contracts/0003_work_experiences.sql` → `supabase/migrations/0003_work_experiences.sql`
- [ ] T002 Apply migration to Supabase (`supabase db push`). Verify per `quickstart.md §1` (테이블·인덱스·정책·CHECK).
- [ ] T003 [P] Port `contracts/work-experience.schema.ts` → `packages/shared/src/schemas/work-experience.ts` (Zod + 타입 + `WORK_EXPERIENCE_MAX_COUNT` + 변환 유틸)
- [ ] T004 [P] Add `packages/shared/src/schemas/work-experience.test.ts` (Zod: cross-field `end >= start`, 500자 경계, YYYY-MM 형식 검증, 이모지 code-point)
- [ ] T005 [P] Re-export work-experience from `packages/shared/src/index.ts`
- [ ] T006 [P] Add `MonthInput` primitive to `packages/ui/src/components/MonthInput.tsx`. `<input type="month">` wrapper + label/error/ARIA via FormField integration. Export from `packages/ui/src/index.ts`.

## Phase 2: User Story 1 — 경력 추가 (P1) 🎯 MVP slice A

**Goal**: 0건 → 1건. 빈 상태 + 추가 플로우.

**Independent Test**: 경력 0건 상태에서 "경력 추가" → 회사·역할·시작일 입력 → 저장 → 리스트에 1건 표시.

- [ ] T007 [P] [US1] Create `apps/web-service/src/features/work-experience/useWorkExperiences.ts` — React hook with `list()`, `create()`, `update()`, `delete()`. supabase client memoized. Status states: `idle | saving | saved | error`.
- [ ] T008 [P] [US1] Create `apps/web-service/src/features/work-experience/WorkExperienceForm.tsx` — inline edit form (RHF + zodResolver). Fields: company, role, startMonth (MonthInput), endMonth (MonthInput + "현재 재직 중" checkbox), description (textarea with 500-char counter). Cancel/Save buttons.
- [ ] T009 [US1] Create `apps/web-service/src/features/work-experience/WorkExperienceList.tsx` — empty state (FR-007 카피), "경력 추가" button (disabled when ≥50 per T016), renders items.
- [ ] T010 [US1] Update `apps/web-service/src/app/profile/page.tsx` — server component pre-fetches `work_experiences` sorted per FR-004, passes to `<WorkExperienceList initial={rows}>`.
- [ ] T011 [US1] Wire "경력 추가" flow: click → insert a draft item at top of list in "adding" state (uncommitted) → user fills form → save → optimistic insert (then reconcile with DB response).

## Phase 3: User Story 2 — 경력 편집 (P1) 🎯 MVP slice B

**Goal**: 기존 항목 → 편집 → 저장.

**Independent Test**: 경력 1건 존재 → 편집 → 역할만 변경 → 저장 → 다른 필드 그대로 유지.

- [ ] T012 [US2] Create `apps/web-service/src/features/work-experience/WorkExperienceItem.tsx` — view-mode card (company · role · 기간 · description). Toggle to edit mode via click or edit icon.
- [ ] T013 [US2] Implement inline expansion transition (`transition: height 200ms ease-out`, motion-safe). Only one item in edit mode at a time — edit icons on other cards disabled.
- [ ] T014 [US2] Hook up `beforeunload` warning when any card is in dirty edit state (reuse 001 pattern via form `isDirty`).

## Phase 4: User Story 3 — 경력 삭제 (P1) 🎯 MVP slice C

**Goal**: 항목 제거.

**Independent Test**: 2건 → 1건 삭제 → 리스트 1건만 → 재로드 후 동일.

- [ ] T015 [US3] Add delete button in edit-mode card footer. On click → `window.confirm("'{회사} · {역할}' 경력을 삭제하시겠습니까?")` → supabase DELETE → optimistic removal from list.

## Phase 5: User Story 4 — 정렬·상한 (P2)

**Goal**: 리스트가 항상 최신 순, 50건 도달 시 추가 차단.

**Independent Test**: 경력 3건(2020·2022·2024)이 `2024 → 2022 → 2020` 순서. 50건 도달 시 "경력 추가" disabled.

- [ ] T016 [US4] Implement 50-count limit UI: count derived from list length, button `disabled` + `aria-disabled` + `title` + warm-500 caption below button when reached.
- [ ] T017 [US4] Verify sort order matches FR-004 (`end_date IS NULL DESC NULLS FIRST, start_date DESC`). Already in SQL query (T010) — add a test that creates 3 items and checks order.

## Phase 6: Tests

- [ ] T018 [P] Create `apps/web-service/src/features/work-experience/WorkExperienceList.test.tsx` — empty state, renders N items, add flow, limit reached state (mock 50 items)
- [ ] T019 [P] Create `apps/web-service/src/features/work-experience/WorkExperienceItem.test.tsx` — view ↔ edit toggle, cancel reverts, delete confirmation, inline expansion height change
- [ ] T020 [P] Create `apps/web-service/src/features/work-experience/WorkExperienceForm.test.tsx` — required validation, end ≥ start refine, 500-char counter state, "현재 재직 중" toggle disables endMonth

## Phase 7: Polish & Verification

- [ ] T021 `pnpm typecheck · lint · test` all green
- [ ] T022 Run quickstart.md §3 수동 스모크 16 시나리오
- [ ] T023 Run `/critique` on new sections (/profile with work-experience cards)
- [ ] T024 Run `/audit` — WCAG AA (44px touch, focus ring), CWV (50건 시뮬 LCP)
- [ ] T025 Run `/polish` — transition timing, hover state, spacing rhythm with profile section above

---

## Dependencies

- T001 → T002 (migration file must exist to push)
- T003 → T004 · T005 (schema must exist for tests/exports)
- T006 → T008 (MonthInput used inside Form)
- T003, T006 → T007 (hook uses schema + types)
- T007, T008 → T009 (List uses hook + Form)
- T009 → T010 (page uses List)
- T012 → T013 → T014 (Item → expansion → beforeunload)
- T012 → T015 (delete lives in Item)
- T009 → T016 (limit logic in List)
- Phase 7 after Phase 2-6 complete

## Parallelism

- T003 · T006 (schema · MonthInput) fully parallel in Phase 1
- T018 · T019 · T020 fully parallel in Phase 6
- T023 · T024 can run after T021 (different reports, no code conflict)

## Implementation Strategy

**MVP order**: Phase 1 → Phase 2 (US1 add) → Phase 3 (US2 edit) → Phase 4 (US3 delete) → Phase 5 (US4 sort/limit). 모든 US가 P1/P2이므로 순서대로 완료 후 Polish.

**Incremental deploy**: Phase 2 완료 시점에도 "경력 추가"만 동작하는 부분 배포 가능 (편집·삭제 없이). 다만 편집 없으면 사용성 낮아 2+3+4 묶어서 내는 편이 정석.

## Notes

- 001·002 패턴을 최대한 상속 — Button·FormField·Forest Green·Pretendard 그대로.
- 새 프리미티브는 `MonthInput` 하나만 `packages/ui`로 승격.
- WorkExperienceList/Item/Form은 feature 로컬 유지 (003 전용). 004 학력에서 유사 패턴 등장 시 그때 extract.
- 모든 체크포인트에서 typecheck·lint·test 녹색 유지.
