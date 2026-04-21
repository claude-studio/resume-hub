# Phase 1 · Data Model: 로그인 및 기본 프로필 관리

## Entities

### `auth.users` (Supabase 관리, 참고)

Supabase Auth가 소유. 이번 스펙에서는 컬럼 추가·수정 없음. 참조만.

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | `uuid` (PK) | 사용자 식별자. `profiles.user_id` 외래 키 대상 |
| `email` | `text` | 구글 이메일. `profiles.email`로 복제됨 |
| `raw_user_meta_data` | `jsonb` | `name`, `avatar_url`, `full_name` 등 포함 |
| `created_at` | `timestamptz` | 가입 시각 |

### `public.profiles` (이번 스펙에서 신규)

한 사용자당 정확히 1행. 이번 스펙의 유일한 쓰기 대상 테이블.

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `user_id` | `uuid` | `PK`, `REFERENCES auth.users(id) ON DELETE CASCADE` | 소유자 |
| `full_name` | `text` | `NOT NULL`, `CHECK (char_length(trim(full_name)) > 0)` | 이름. 최초값은 `auth.users.raw_user_meta_data ->> 'full_name'` 또는 `name`. 사용자가 편집 가능. |
| `email` | `text` | `NOT NULL` | 구글 이메일 복제본. 사용자가 **편집 불가**(트리거로 변경 차단). |
| `phone` | `text` | `NULL 허용`, `CHECK (phone IS NULL OR char_length(phone) BETWEEN 1 AND 32)` | 전화번호. 형식 검증은 클라이언트 Zod가 담당. |
| `headline` | `text` | `NULL 허용`, `CHECK (headline IS NULL OR char_length(headline) <= 200)` | 한 줄 소개. |
| `updated_at` | `timestamptz` | `NOT NULL DEFAULT now()` | 마지막 수정 시각. `BEFORE UPDATE` 트리거로 `now()` 갱신. |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` | 레코드 생성 시각. |

**인덱스**: `user_id` 단일 컬럼 PK 외 추가 인덱스 없음(테이블 자체가 소유자별 1행이라 조회는 항상 PK 탐색).

## Relationships

```text
auth.users 1 ────1 public.profiles
            (trigger on insert)
```

- 1:1 관계. `profiles.user_id`가 PK이자 FK.
- `auth.users` 행이 삭제되면 `profiles`도 CASCADE.

## Lifecycle / State transitions

| 시점 | 이벤트 | 결과 |
|------|--------|------|
| T0 | 사용자가 Google 로그인 첫 성공 | `auth.users`에 행 삽입 |
| T0+ε | 트리거 `on_auth_user_created` 실행 | `profiles` 행 1개 자동 생성 (`full_name`·`email`은 메타에서 복제, `phone`·`headline`은 `NULL`) |
| T1 | 사용자 프로필 저장 | `UPDATE profiles` with 유효 payload; `updated_at` 자동 갱신 |
| T2 | 사용자 로그아웃 | 테이블 변화 없음. 세션 쿠키만 제거 |
| T∞ | (범위 밖) 회원 탈퇴 | `auth.users` 삭제 시 CASCADE로 `profiles`도 제거 |

## Validation Rules (요약)

| 필드 | 클라이언트 (Zod) | DB (CHECK) |
|------|------------------|------------|
| `full_name` | `string().min(1).max(80)` | `char_length(trim(full_name)) > 0` |
| `email` | 편집 입력 없음 (read-only) | 변경 시 트리거가 거부 |
| `phone` | `string().regex(/^[+\d\-\s()]*$/).max(32).optional()` | `NULL` 또는 길이 1–32 |
| `headline` | `string().max(200).optional()` | `NULL` 또는 `<= 200` |

## 공용 타입 정렬

`packages/shared/src/types/index.ts`의 기존 `Profile` 인터페이스와 본 테이블 스키마는 아래처럼 대응한다(필드 재확인 차원):

| shared `Profile` | `profiles` 컬럼 | 비고 |
|------------------|-----------------|------|
| `id` | `user_id` | 의미 동일 |
| `fullName` | `full_name` | camelCase ↔ snake_case 매핑 책임은 `useProfile` 훅 |
| `email` | `email` | read-only |
| `phone?` | `phone` | optional |
| `headline?` | `headline` | optional |
| `summary?` | — | 이번 스펙 범위 밖, 후속 |
| `location?` | — | 이번 스펙 범위 밖, 후속 |

→ 이번 구현에서는 Zod 스키마가 camelCase 타입을 기준으로 정의되고, supabase-js 호출 경계에서 snake_case 변환 헬퍼 하나만 공용 `shared`에 둔다.
