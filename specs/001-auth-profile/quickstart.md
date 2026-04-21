# Quickstart: 로그인 및 기본 프로필 관리

구현 후 로컬에서 검증하기 위한 셋업·수동 스모크 테스트 체크리스트.

## 1. Supabase 프로젝트 프로비저닝

1. [supabase.com](https://supabase.com) 대시보드에서 새 프로젝트 생성.
2. **Authentication → Providers → Google** 활성화.
   - Google Cloud Console에서 OAuth 2.0 Client ID(Type: Web)를 만들고 Redirect URIs에 `https://<project-ref>.supabase.co/auth/v1/callback` 추가.
   - Client ID / Secret를 Supabase Google provider 설정에 입력.
3. **Authentication → URL Configuration**에서 Site URL을 로컬 개발용 `http://localhost:3000`으로 설정. Redirect URLs에 `http://localhost:3000/auth/callback` 추가.
4. 프로젝트 설정에서 다음 값 확보:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 2. 마이그레이션 적용

`contracts/rls-policies.sql` 내용을 `supabase/migrations/0001_profiles.sql`로 복사·커밋한 뒤 적용:

**옵션 A — Supabase 대시보드 SQL Editor**: 파일 내용을 붙여넣고 실행.

**옵션 B — Supabase CLI (권장)**:
```bash
supabase login
supabase link --project-ref <project-ref>
supabase db push
```

적용 후 SQL Editor에서 다음을 확인한다:
```sql
select count(*) from public.profiles;         -- 0
select * from pg_policies where tablename = 'profiles';  -- 3 rows
```

## 3. 환경 변수

`apps/web-service/.env.local` 생성(`.env.example`을 복제):
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## 4. 개발 서버 실행

```bash
pnpm install
pnpm dev:service
```

`http://localhost:3000` 접속.

## 5. 수동 스모크 테스트 (SC 검증)

| # | 단계 | 기대 결과 | 매핑되는 SC/FR |
|---|------|-----------|----------------|
| 1 | 랜딩에서 "Google로 시작하기" 클릭 | 구글 동의 화면 → 동의 → `/profile`로 이동. 30초 이내 완료 | SC-001, FR-001~003 |
| 2 | 프로필 화면 최초 진입 | 이메일이 본인 구글 이메일로 미리 채워져 있고 disabled, 이름도 기본값 존재 | FR-003, FR-005 |
| 3 | 이름을 공란으로 저장 시도 | 클라이언트 검증 오류 표시, 네트워크 요청 발생 안 함 | FR-009 |
| 4 | 이름·전화·한 줄 소개 입력 후 저장 | "저장됨" 배지 표시, 2초 이내 완료 | FR-010, SC-002, SC-005 |
| 5 | 새로고침 | 저장값 그대로 표시 | SC-003 |
| 6 | 로그아웃 → `/profile` 직접 URL 입력 | `/`로 리다이렉트 | FR-006, FR-008 |
| 7 | 시크릿 창에서 다른 구글 계정 로그인 | 본인의 빈 프로필만 보이고 사용자 1의 값이 전혀 노출되지 않음 | FR-007, SC-004 |
| 8 | 개발자 도구 → Network에서 `profiles` PATCH를 가로채 다른 user_id로 조작 재전송 | 403/RLS 거부, DB 값 변화 없음 | FR-007, SC-004 |
| 9 | SQL에서 `update public.profiles set email = 'x' where ...` 직접 시도 | 트리거가 "profiles.email is read-only" 에러로 차단 | FR-005 |
| 10 | 로그인된 상태로 **1시간+ 유휴 후** 저장 시도 | access token이 refresh로 조용히 갱신되어 저장 성공(사용자 체감 중단 없음) | FR-011 |
| 11 | "저장" 버튼을 연속으로 3번 빠르게 클릭 | 첫 클릭 이후 버튼이 비활성화, 요청은 1건만 발생 | FR-014 |
| 12 | **키보드만으로 전주행**: Tab·Enter만 사용해 랜딩 → 로그인 → 프로필 편집 → 저장 → 로그아웃 완주 | 모든 단계 가능, 포커스 고리가 보이며 순서가 자연스럽다 | FR-012, SC-006 |
| 13 | 저장 중 일부러 `throttling = offline`으로 네트워크 차단 | 버튼 레이블이 "저장 중…"인 동안 2초 초과 시 스피너가 조건부 표시되고, 네트워크 복구 후 재시도 버튼 동작 | FR-010, FR-014 |
| 14 | Lighthouse Desktop 성능 측정 | LCP < 2.5s, TTFB < 500ms | SC-007 |

## 6. 자동 테스트

```bash
pnpm test
```

- `packages/shared/src/schemas/profile.test.ts`: Zod 스키마 통과/실패 케이스
- `apps/web-service/src/features/profile/ProfileForm.test.tsx`: 렌더·검증 메시지·저장 성공 표시(Supabase 모킹)

## 7. 체크리스트 클로징

- [ ] 수동 스모크 9개 시나리오 모두 통과
- [ ] `pnpm typecheck` · `pnpm lint` · `pnpm test` 초록
- [ ] 빌드(`pnpm --filter @resume-hub/web-service build`) 성공
- [ ] Supabase 대시보드에서 `auth.users` 1행·`profiles` 1행 대응 관계 확인
