# Feature Specification: 프로필 자기소개 필드

**Feature Branch**: `002-profile-summary`  
**Created**: 2026-04-22  
**Status**: Draft  
**Input**: User description: "프로필에 자기소개(summary) 필드 추가 — 최대 1000자, 선택 입력, 경력 나열이나 자기 브랜딩 문장용"

## Clarifications

### Session 2026-04-22

- Q: 카운터 warn 전환 임계치 → A: **800자부터 warn** (최대치의 80%). 한 줄 소개(headline)의 `160/200` 비율 규칙과 일관. 이후 공용 `CharCounter` 프리미티브로 추출 시 동일 80% 룰 적용.
- Q: 글자 수 계산 방식 → A: **`Array.from(str).length`** (code point 단위). PostgreSQL `char_length()`와 동등해 클라이언트·DB의 "1000자" 인식이 일치함. `string.length`(UTF-16)는 이모지에서 DB와 다른 숫자가 나와 금지.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 자기소개 작성·저장 (Priority: P1)

로그인한 사용자가 프로필 화면에서 "자기소개" 필드에 자유 형식 텍스트를 입력해 저장한다. 한 줄 소개(headline)보다 길고, 경력 요약이나 자기 브랜딩 문장을 담는 용도다.

**Why this priority**: 이력의 "내가 어떤 사람인가" 축을 완성하는 핵심 조각. 한 줄 소개는 타이틀, 자기소개는 그 아래 서술형 본문이다. 익스텐션 자동완성 시 플랫폼의 "자기소개" 필드에 직접 매핑되는 1차 입력.

**Independent Test**: 로그인한 사용자가 자기소개에 500자 텍스트를 입력·저장하고, 페이지를 새로고침해도 동일 값이 유지되는지 확인한다. 1001자 입력은 거부되어야 한다.

**Acceptance Scenarios**:

1. **Given** 로그인한 사용자가 프로필 화면에 있을 때, **When** 자기소개 필드에 500자 텍스트를 입력하고 "저장"을 누르면, **Then** "저장됨" 상태가 표시되고 새로고침 후에도 값이 유지된다.
2. **Given** 자기소개 입력란에 1000자가 입력된 상태에서, **When** 추가로 문자를 입력하려 하면, **Then** 입력이 차단되거나 1000자에서 잘린다. 카운터는 `1000 / 1000`을 표시한다.
3. **Given** 자기소개가 비어 있는 상태에서, **When** "저장"을 누르면, **Then** 저장이 성공한다 (선택 입력이므로 공란 허용).
4. **Given** 자기소개에 줄바꿈과 이모지가 포함된 텍스트를 저장한 뒤, **When** 페이지를 다시 로드하면, **Then** 줄바꿈·이모지가 모두 보존된 채 표시된다.

---

### Edge Cases

- **줄바꿈 허용**: 멀티라인 입력 허용. `textarea`로 렌더링하고 저장 시 개행 보존.
- **이모지/유니코드**: 허용. 문자 수 계산은 `Array.from(str).length` 기반(서로게이트 페어·합자 고려)이 이상적이나 `string.length`도 허용 가능(DB check 기준 일치).
- **기존 프로필 데이터**: `summary` 컬럼 추가 시 기존 행들은 `NULL`로 초기화됨 — 이미 저장된 데이터에 영향 없음.
- **저장 중 네트워크 장애**: 기존 프로필 폼과 동일하게 inline 에러 블록 + "다시 시도" 버튼 (FR-010, spec 001 재사용).
- **800자 이상 입력 시**: 카운터 색상이 warn 색(accent-focus)으로 전환(headline의 160/200 비율 규칙과 일관). 1000자 도달 시 danger 색으로 전환해 최대치 임박을 시각 피드백.
- **글자 수 계산**: `Array.from(str).length` 사용 — code point 단위로 DB `char_length()`와 동일. `string.length`(UTF-16 code units)는 이모지에서 DB와 어긋날 수 있으므로 금지.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `profiles` 테이블에 `summary` 컬럼을 추가한다. 타입: `text`, `NULL` 허용, `CHECK (summary IS NULL OR char_length(summary) <= 1000)`.
- **FR-002**: 프로필 편집 화면에서 자기소개 입력란을 노출한다. 위치: "한 줄 소개" 필드 아래. `textarea` 사용, 최소 높이는 본문 약 5줄(~7.5rem).
- **FR-003**: 사용자는 자기소개를 편집·저장·삭제(빈 문자열 저장)할 수 있어야 한다.
- **FR-004**: 카운터(`현재 / 1000`)를 필드 우상단에 노출한다. **800자** 이상부터 warn 톤(accent-focus), 1000자에서 danger 톤으로 전환. 글자 수 계산은 `Array.from(str).length`(code point 기준) — DB `char_length()`와 일치.
- **FR-005**: 클라이언트 검증으로 1001자 이상 입력을 차단한다(Zod `max(1000)`). `maxLength` 속성으로 IME 입력도 보호.
- **FR-006**: 서버(DB) 검증으로도 1001자 이상을 거부한다(FR-001의 CHECK).
- **FR-007**: 자기소개는 편집 후 "변경사항 있음" 상태를 트리거하고, 저장 완료 후 "저장됨 · {시각}"으로 복귀한다(기존 저장 플로우와 동일).
- **FR-008**: 자기소개 필드는 `autoComplete="off"` (브라우저 추천 무의미).

### Key Entities

- **Profile** (`public.profiles`): 기존 엔티티에 `summary: text | null` 컬럼 1개 추가. 그 외 필드·정책 변경 없음. RLS 정책(select/insert/update own)은 기존 그대로 적용되어 자동으로 summary도 보호됨.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 자기소개 500자 저장 후 새로고침·재로그인해도 100% 동일 값이 표시된다.
- **SC-002**: 클라이언트·DB 레이어 모두 1001자 이상 저장을 거부한다(0건 누출).
- **SC-003**: 자기소개 필드 편집·저장이 기존 프로필 저장과 동일한 ≤ 2초 체감 속도(p95)를 유지한다(SC-005 of 001 재사용).
- **SC-004**: 줄바꿈·이모지를 포함한 텍스트가 100% 라운드트립 보존된다.
- **SC-005**: 기존 프로필 데이터에 대해 마이그레이션 적용 후 `select * from profiles`가 기존 행 수·값을 그대로 반환하고, 각 행의 `summary`는 `NULL`이다.

## Assumptions

- 사용자는 이미 `/profile` 화면에 접근 가능한 인증 상태다(001-auth-profile 완료 전제).
- 1000자 상한은 확정값이다(외부 요구 변경 시 스펙 재작성).
- 자기소개는 단일 텍스트 필드 — 마크다운·서식은 v1 범위 밖이다.
- 자기소개의 익스텐션 자동완성 매핑은 본 스펙 범위 밖이다(익스텐션 스펙에서 처리).
- 검색·정렬 대상이 아니다 — 인덱스 불요.
