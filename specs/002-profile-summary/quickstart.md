# Quickstart: 자기소개 필드 적용

## 1. 마이그레이션 적용

로컬에서 Supabase CLI로:

```bash
cd /Users/samuel/Developments/resume-hub
supabase db push
```

또는 대시보드 SQL Editor에서 `supabase/migrations/0002_summary.sql` 내용 붙여넣고 Run.

### 검증

```sql
-- 컬럼 존재
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'profiles' and column_name = 'summary';
-- 결과: summary | text | YES

-- CHECK 제약
select conname, pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.profiles'::regclass and conname like '%summary%';
-- 결과: summary check (summary is null or char_length(summary) <= 1000)

-- 기존 행 영향 없음
select count(*), count(summary) from public.profiles;
-- 결과: <total> | 0
```

## 2. 개발 서버

`pnpm dev:service` 후 `/profile` 접속. `.env.local`이 이미 설정돼 있어야 함(001 완료 기준).

## 3. 수동 스모크

| # | 액션 | 기대 | 매핑 FR/SC |
|---|------|------|-----------|
| 1 | /profile 진입 | 자기소개 필드가 "한 줄 소개" 아래 표시. placeholder 노출. 카운터 `0 / 1000` (warm-500 톤) | FR-002 · FR-004 |
| 2 | 자기소개에 500자 입력 후 저장 | "저장됨 · 시각" 표시, 새로고침 후 유지 | FR-003 · SC-001 |
| 3 | 자기소개를 비우고 저장 | 공란 저장 성공, 에러 없음 | Edge case · SC-003 |
| 4 | 800자 입력 | 카운터 색상이 `accent-focus`로 전환 | FR-004 |
| 5 | 1000자 도달 | 카운터 `1000 / 1000` `danger` 색, 추가 입력 차단(브라우저 maxLength) | FR-004 · FR-005 |
| 6 | DevTools에서 textarea maxLength 제거 후 1001자 저장 시도 | 클라이언트 Zod가 거부("자기소개는 1000자 이하…") | FR-005 |
| 7 | 위와 같이 DevTools로 제거 + 네트워크에 1001자 payload 재전송 | DB CHECK 가 거부 (서버 에러 → inline 에러 블록) | FR-006 · SC-002 |
| 8 | 이모지 `"🙂🙂🙂"` 3개 입력 | 카운터 `3 / 1000` (code point 기준 일치). 저장 후 복원 값도 동일 | Edge case · SC-004 |
| 9 | 줄바꿈 `"A\n\nB"` 입력 | 저장 후 새로고침 시 줄바꿈 유지 | Edge case · SC-004 |
| 10 | 다른 사용자로 로그인 → 자기소개 비어있음 | 사용자 A의 summary가 전혀 노출되지 않음 | RLS |

## 4. 자동 테스트

```bash
pnpm --filter @resume-hub/shared test       # Zod summary max/refine
pnpm --filter @resume-hub/web-service test  # ProfileForm summary 렌더·검증
```
