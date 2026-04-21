# Phase 0 · Research: 프로필 자기소개 필드

대부분 001-auth-profile의 의사결정을 그대로 상속한다. 본 스펙 고유의 소수 결정만 기록한다.

## 1. Counter warn 임계치 = 80%

**Decision**: 800자부터 `accent-focus` 색상으로 전환.

**Rationale**: 한 줄 소개(headline, 200자 max)는 160자(80%)부터 warn이었다. 동일 80% 규칙을 적용해 **카운터 프리미티브를 "percent threshold로 추상화"할 수 있는 길**을 열어둔다. 구현은 ProfileForm 안에서 인라인으로 시작하되, 세 번째 텍스트 필드가 생기는 시점(예: 경력 description)에 `CharCounter` 공용 컴포넌트로 추출 예정.

**Alternatives considered**:
- 절대값 900 (10% 남음): 경고 시점이 너무 늦다 — 사용자가 이미 "충분히 썼다"고 느낀 뒤.
- warn 생략 (1000자 danger만): 입력 중 여유를 모르고 빠르게 실수 도달.

## 2. 글자 수 계산 = `Array.from(str).length`

**Decision**: 클라이언트는 `Array.from(value).length`로 문자 수를 센다. Zod 검증도 이 카운트로 수행.

**Rationale**:
- PostgreSQL `char_length(summary)`와 **동일한 code point 카운트**. 클라이언트 1000자 = DB 1000자.
- `string.length`(UTF-16 code units)는 이모지에서 DB와 불일치 → 서버 거부 시 사용자 혼란.
- `Intl.Segmenter`(grapheme)는 사용자 직관에 가장 가까우나 DB CHECK와 어긋나 서버 에러 유발.

**Alternatives considered**:
- `Intl.Segmenter`: 직관 최고, 구현 비용 적음. 단 DB CHECK도 grapheme 기준 함수로 맞추려면 custom SQL 함수 필요 → MVP 과투자.
- `string.length`: 가장 간단. DB와 미세하게 안 맞아 이모지 입력자에게 경계 케이스 리스크.

## 3. 마이그레이션 안전성

**Decision**: `ALTER TABLE public.profiles ADD COLUMN summary text`는 NULL 허용 기본값이라 즉시 적용 가능 · 기존 행 영향 없음 · RLS 정책도 자동 커버.

**Rationale**:
- Postgres는 nullable column 추가 시 rewrite 없음 (Postgres 11+).
- 기존 `profiles_select_own`·`_update_own` 정책은 `auth.uid() = user_id` 검사로 컬럼 단위 제한이 없음 — 자동 포함.
- CHECK 제약은 신규 컬럼에만 걸림 — 기존 NULL 행은 조건 자동 통과.

**Alternatives considered**: Soft rollout (컬럼 추가 → 앱 코드 배포 → 검증) 은 단일 배포로 충분 — 롤백 시 컬럼 drop이면 됨.

## 4. UI 배치

**Decision**: `한 줄 소개` 필드 바로 아래에 `자기소개` 추가. textarea height ~7.5rem (5줄 기본).

**Rationale**: 한 줄 소개가 headline(짧은 타이틀)이고 자기소개가 본문 — 정보 계층 위→아래로 자연스럽게 흐른다. 이름·이메일·전화(연락처) 그룹과 헤드라인·자기소개(내용) 그룹이 시각적으로 구분된다.

**Alternatives considered**:
- 섹션 분리 (연락처/소개 두 개 h2): 200자 짜리 한 줄 소개와 1000자 자기소개를 같은 섹션에 두기 어색 — 하지만 MVP에서 섹션 헤더까지 도입하는 건 과투자. 3번째 서술 필드가 생길 때 섹션화.

---

**Output status**: Phase 0 결정 완료, `NEEDS CLARIFICATION` 없음. Phase 1 진입.
