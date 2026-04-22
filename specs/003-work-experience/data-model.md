# Phase 1 · Data Model: 경력 관리

## `public.work_experiences` (신규)

사용자 1명당 0..50건. `auth.users` FK로 소유권 연결.

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | `uuid` | PK, `default gen_random_uuid()` | 항목 식별자 |
| `user_id` | `uuid` | `NOT NULL`, `REFERENCES auth.users(id) ON DELETE CASCADE` | 소유자 |
| `company` | `text` | `NOT NULL`, `CHECK (char_length(trim(company)) BETWEEN 1 AND 100)` | 회사명 |
| `role` | `text` | `NOT NULL`, `CHECK (char_length(trim(role)) BETWEEN 1 AND 100)` | 역할/직책 |
| `start_date` | `date` | `NOT NULL` | 시작일 (월 단위 — 일자는 항상 01) |
| `end_date` | `date` | `NULL 허용`, `CHECK (end_date IS NULL OR end_date >= start_date)` | 종료일. NULL = 현재 재직 중 |
| `description` | `text` | `NULL 허용`, `CHECK (description IS NULL OR char_length(description) <= 500)` | 간단 설명 |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` | 생성 시각 |
| `updated_at` | `timestamptz` | `NOT NULL DEFAULT now()` | 마지막 수정 시각 (트리거로 갱신) |

**인덱스**:
- `work_experiences_user_id_idx` on `(user_id, start_date DESC)` — FR-004 정렬 쿼리 가속

**상한 제약 (50건)**:
- DB 수준 CHECK constraint로 강제하지 않고 **애플리케이션 레이어**에서 검증. 이유:
  - Postgres에서 row count CHECK는 트리거 기반 구현이 필요(성능 비용).
  - 50건은 soft 한계 — 운영 중 바뀔 수 있고 feature flag로 덮기 쉬워야 함.
  - 클라이언트 Zod + 서버 routehandler에서 pre-insert count 확인으로 충분.

## Relationships

```text
auth.users ─1───N─ work_experiences
                  (ON DELETE CASCADE)
```

- `profiles`과는 직접 FK 아님 — 둘 다 `auth.users(id)`를 독립 참조. 사용자 계정 삭제 시 둘 다 CASCADE.

## Lifecycle / State

| 시점 | 이벤트 | 결과 |
|------|--------|------|
| T0 | 사용자 "경력 추가" 저장 | `work_experiences` row 1건 INSERT |
| T1 | 사용자 인라인 편집 → 저장 | `UPDATE` 해당 row, `updated_at` 트리거로 자동 갱신 |
| T2 | 사용자 삭제 확인 | `DELETE` 해당 row |
| T∞ | 계정 탈퇴 | `auth.users` 삭제 → CASCADE |

## Validation Rules

| 필드 | 클라이언트 (Zod) | DB (CHECK) |
|------|------------------|------------|
| `company` | `string().trim().min(1).max(100)` | `char_length(trim(company)) BETWEEN 1 AND 100` |
| `role` | `string().trim().min(1).max(100)` | `char_length(trim(role)) BETWEEN 1 AND 100` |
| `start_date` | `string().regex(/^\d{4}-\d{2}$/)` 로 `YYYY-MM` 검증 → DB 저장 시 `-01` 접미 | `date` 타입 자체 |
| `end_date` | `string().regex(/^\d{4}-\d{2}$/).optional()` + cross-field refine(`end >= start`) | `CHECK (end_date IS NULL OR end_date >= start_date)` |
| `description` | `Array.from(v).length <= 500` (002 패턴) | `char_length(description) <= 500` |
| 리스트 상한 | 추가 요청 전 `count(*)` ≤ 49 확인 | 없음 (앱 레이어 강제) |

## RLS 정책

`work_experiences`에 profiles와 동일 패턴의 4개 정책:

- `SELECT`: `auth.uid() = user_id`
- `INSERT`: `auth.uid() = user_id` (with check)
- `UPDATE`: `auth.uid() = user_id` (using + with check)
- `DELETE`: `auth.uid() = user_id`

**차이점**: profiles는 DELETE 정책 없음(cascade만). 경력은 사용자가 개별 삭제할 수 있어야 하므로 DELETE 정책 추가.

## 공용 타입 정렬

`@resume-hub/shared`에 추가:

```ts
export interface WorkExperienceRow {
  id: string;
  user_id: string;
  company: string;
  role: string;
  start_date: string;   // ISO date "YYYY-MM-DD"
  end_date: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

// DB snake_case ↔ form camelCase
export interface WorkExperienceEdit {
  company: string;
  role: string;
  startMonth: string;   // "YYYY-MM"
  endMonth?: string;    // "YYYY-MM" | ""
  description?: string;
}
```

변환 유틸 `rowToFormValues`·`formValuesToDbPayload` 를 훅 경계에서만 사용.
