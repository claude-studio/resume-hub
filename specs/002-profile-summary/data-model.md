# Phase 1 · Data Model: 프로필 자기소개 필드

## `public.profiles` 변경분

기존 컬럼에 **1개 추가**.

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `summary` | `text` | `NULL` 허용, `CHECK (summary IS NULL OR char_length(summary) <= 1000)` | 자기소개. 한 줄 소개(headline)보다 긴 서술형 본문. code point 단위 1000자 제한. |

기타 기존 컬럼(`user_id`, `full_name`, `email`, `phone`, `headline`, `created_at`, `updated_at`)은 변동 없음.

## Relationships

변동 없음. `profiles` 1:1 `auth.users` 관계 유지.

## Lifecycle / State

기존 생명주기 그대로. `summary`는 최초 로그인 트리거 시 `NULL`로 초기화(명시적 default 없음 = 암묵적 NULL).

## Validation

| 필드 | 클라이언트 (Zod) | DB (CHECK) |
|------|------------------|------------|
| `summary` | `string().refine(v => Array.from(v).length <= 1000)` 또는 code-point 기반 `.max()` wrapper | `char_length(summary) <= 1000` |

**주의**: `z.string().max(1000)`는 기본적으로 UTF-16 code unit을 쓴다 — `string.length` 기반. 이 때문에 **custom refine** 또는 **pre-transform**으로 code point 카운트를 강제해야 한다. `contracts/profile.schema.ts` 참조.

## 공용 타입 정렬

`@resume-hub/shared`:

| 기존 `Profile` 필드 | 추가 | DB 컬럼 |
|---------------------|------|---------|
| `fullName` | | `full_name` |
| `email` | | `email` |
| `phone?` | | `phone` |
| `headline?` | | `headline` |
| **`summary?`** | **신규** | **`summary`** |

`ProfileRow`에는 `summary: string | null` 추가. `ProfileEdit`에는 `summary: string` (빈 문자열 허용) 추가.

## 마이그레이션 영향

- 기존 행에 대한 rewrite 없음 (nullable + default 없음).
- 기존 행의 `summary` 값은 `NULL` 상태.
- `updated_at` 트리거는 summary 변경을 감지해 자동 갱신 — 추가 작업 불요.
- RLS 정책 `profiles_select_own`·`_update_own`은 컬럼 단위 제한 없음 → summary 포함 자동 커버. 정책 수정 불요.
