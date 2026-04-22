# Quickstart: 경력 관리 적용

## 1. 마이그레이션 적용

```bash
cd /Users/samuel/Developments/resume-hub
supabase db push
```

또는 대시보드 SQL Editor에서 `supabase/migrations/0003_work_experiences.sql` 붙여넣기 → Run.

### 검증 쿼리

```sql
-- 테이블·인덱스·정책 존재 확인
select count(*) from public.work_experiences;  -- 0 (신규)
select indexname from pg_indexes where tablename = 'work_experiences';
-- 결과: work_experiences_pkey, work_experiences_user_sort_idx
select policyname from pg_policies where tablename = 'work_experiences';
-- 결과: *_select_own, *_insert_own, *_update_own, *_delete_own (4개)

-- CHECK 제약 검증
insert into public.work_experiences(user_id, company, role, start_date, end_date)
  values (auth.uid(), 'Test', 'Role', '2024-01-01', '2023-12-01');
-- 결과: ERROR — CHECK 제약 위반 (end < start)
```

## 2. 개발 서버

`.env.local`은 001에서 설정됨. 별도 환경변수 변경 없음.

```bash
pnpm dev:service
```

`/profile` 접속 → 기존 프로필 섹션 아래 "경력" 섹션 등장.

## 3. 수동 스모크 테스트

| # | 시나리오 | 기대 결과 | 매핑 |
|---|---------|---------|------|
| 1 | /profile 최초 진입 (경력 0건) | "아직 경력이 없습니다. 첫 경력을 추가해보세요." 빈 상태 + "경력 추가" 버튼 | FR-007 |
| 2 | "경력 추가" 클릭 | 새 빈 카드가 편집 모드로 등장, 회사 필드 auto-focus | FR-002, FR-013 |
| 3 | 회사·역할·시작일만 입력 → 저장 | 리스트에 새 항목 표시, "2024-01 – 현재" 형태 | FR-001, FR-002, SC-001 |
| 4 | "현재 재직 중" 토글 켠 상태에서 종료일 필드 | 종료일 입력란이 disabled | FR-002 |
| 5 | 시작 2024-06, 종료 2023-12 입력 → 저장 | 종료 필드에 "종료일은 시작일 이후여야 합니다" 표시, 저장 차단 | FR-008, SC-004 |
| 6 | 회사명 빈 상태로 저장 | 회사 필드에 "회사명을 입력해주세요" | FR-002 |
| 7 | 기존 항목 클릭 → 역할 변경 → 저장 | 해당 카드만 업데이트, 다른 카드 그대로 | FR-003, SC-001 |
| 8 | 편집 중 Cmd+R (새로고침) 시도 | beforeunload 경고 | FR-009, SC-005 |
| 9 | 항목 삭제 아이콘 → "삭제" 확인 | 리스트에서 해당 항목 사라짐, 재로드 후 유지 | FR-005 |
| 10 | 삭제 다이얼로그에서 "취소" | 항목 유지 | FR-005 |
| 11 | 경력 3건 추가 (시작일 2020·2022·2024) | 리스트 순서가 2024 → 2022 → 2020 | FR-004, US4 |
| 12 | "현재 재직 중"(2024) + 종료된(2023-2024) 각 1건 | "현재 재직 중"이 최상단 | FR-004 |
| 13 | Tab만으로 새 경력 추가 → 저장까지 완주 | 모든 필드·버튼 키보드 도달 가능 | FR-010, SC-006 |
| 14 | 설명에 이모지 `🙂`·줄바꿈 포함 500자 | 카운터 `500/500` danger 톤, 저장 성공 후 포맷 유지 | description 카운터 |
| 15 | 50건 도달 후 "경력 추가" 버튼 | `disabled`, tooltip "최대 50건까지 등록 가능합니다" | FR-012 |
| 16 | 시크릿 창에서 다른 계정 로그인 | 사용자 A의 경력 0건 노출 | FR-006, SC-003 |

## 4. 자동 테스트

```bash
pnpm --filter @resume-hub/shared test       # Zod cross-field refine (end >= start)
pnpm --filter @resume-hub/web-service test  # List·Item·Form 렌더링·상한 처리
```

## 5. 성능 스팟 체크 (선택)

50건 더미 데이터 삽입 후 DevTools Lighthouse Desktop:
```sql
-- 테스트용 더미 50건 삽입 (실데이터와 섞이지 않게 별도 계정 권장)
do $$
declare i int;
begin
  for i in 1..50 loop
    insert into public.work_experiences(user_id, company, role, start_date, end_date)
    values (auth.uid(), 'Company ' || i, 'Role', make_date(2020 - (i/12), (i%12)+1, 1),
            case when i = 1 then null else make_date(2020 - (i/12) + 1, (i%12)+1, 1) end);
  end loop;
end$$;
```

기대: LCP ≤ 2.5s(SC-002). 넘으면 가상화(virtual scroll) 고려.
