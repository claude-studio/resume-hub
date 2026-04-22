# Phase 0 · Research: 경력 관리

001·002 의사결정을 상속하고, 003 고유 선택만 기록.

## 1. 월 단위 날짜 입력 방식 (YYYY-MM)

**Decision**: 커스텀 `<input type="month">` 기반 컴포넌트 `MonthInput`을 `packages/ui`에 추가. 내부적으로는 `YYYY-MM` 문자열을 받고, DB에는 `YYYY-MM-01` 날짜로 저장.

**Rationale**:
- 브라우저 네이티브 `input[type=month]`는 Chrome·Edge·Safari 전부 지원. Firefox는 fallback 텍스트 입력(여전히 동작).
- 네이티브 위젯은 키보드·스크린리더 접근성이 기본 제공 — 커스텀 date picker 재구현 불필요.
- DB `date` 컬럼에 `-01` 접미사로 저장 → `SELECT DATE_TRUNC('month', start_date)` 같은 쿼리 없이 직접 정렬 가능.

**Alternatives considered**:
- `react-day-picker` 등 서드파티: 의존성 +40KB, 접근성·i18n 추가 설정 필요. 월 단위 입력엔 과투자.
- 년/월 select 두 개: 접근성은 좋지만 입력 속도 느림. 네이티브 `input[type=month]`이 키보드 타이핑으로 빠름.

## 2. 리스트 상태 관리 — RHF `useFieldArray` vs 독립 훅

**Decision**: 각 경력 항목을 **독립 React state + RHF form**으로 관리. 리스트 전체를 `useFieldArray`로 묶지 않음.

**Rationale**:
- 인라인 확장 UX에서 사용자는 한 번에 **한 개만 편집**함(현재 모드). 항목별로 독립 RHF 인스턴스를 만들면 dirty tracking·validation이 깔끔.
- 리스트 전체를 useFieldArray로 묶으면 항목 하나 편집 시 전체 re-render 유발 가능 + submit 시점이 불명확(항목별 submit).
- 새 항목 추가는 API로 즉시 insert → 낙관적 UI 업데이트. `useFieldArray`의 `append`로 로컬만 추가하면 페이지 이탈 시 소실 위험.

**Alternatives considered**:
- `useFieldArray` 단일 폼: 일괄 저장(draft → commit) 패턴에 적합하지만 우리는 **항목별 즉시 저장**이 UX 정합.
- Redux/Zustand: 로컬 상태만으로 충분. 글로벌 스토어 불요.

## 3. 삭제 확인 방식

**Decision**: 네이티브 `window.confirm()` 사용. 커스텀 모달 도입하지 않음.

**Rationale**:
- FR-005: 삭제 전 확인 필요. 일반적 확인 다이얼로그는 Notion·Linear 모두 네이티브 confirm 아닌 커스텀 모달을 쓰지만, MVP에선 과투자.
- 네이티브 confirm은 접근성 자동 보장(ESC 닫기·Enter 확인·포커스 트랩 OS 수준).
- 시각 불일치 리스크: 브라우저 기본 스타일이 앱 톤과 다름. 수용 가능한 수준.
- 2번째 확인 다이얼로그가 필요해지면 그때 커스텀 `Dialog` 프리미티브 추출(impeccable extract 패턴).

**Alternatives considered**:
- Radix `AlertDialog`: +10KB, a11y 안전. 스킬 테스트가 목적이라면 미도입.
- 인라인 확인(like Gmail "Undo after delete"): 경력은 실수 삭제가 적은 신중한 액션이라 undo 덜 중요.

## 4. 50건 상한 UI 처리

**Decision**: 경력 50건 도달 시 "경력 추가" 버튼을 `disabled` + title tooltip `"최대 50건까지 등록 가능합니다"`. 알림 메시지는 버튼 아래 `text-warm-500` 한 줄.

**Rationale**:
- 상한에 도달할 사용자는 극소수 예상 — 전용 오류 페이지·모달은 과투자.
- disabled button + tooltip은 WCAG 2.1 "설명 가능한 제약" 요건 충족.
- `aria-disabled="true"` 추가해 스크린리더도 사유 읽을 수 있도록.

**Alternatives considered**:
- 하드 상한 대신 warn만 표시(무제한 허용): DB 성능·UI 렌더 비용 예측 어려움. 50건 제한이 명확성 제공.

## 5. 정렬 우선순위 (FR-004)

**Decision**: SQL 정렬 — `end_date IS NULL DESC NULLS FIRST, start_date DESC`. 즉:
1. "현재 재직 중"(end_date NULL) 항목들이 최상단, 내부적으로 시작일 내림차순
2. 그 아래 종료된 경력 항목들, 시작일 내림차순

**Rationale**:
- 일반 이력서 관행(LinkedIn 포함)과 일치.
- 클라이언트 정렬보다 SQL 정렬이 결정적 — 클라이언트·서버 렌더 일치(hydration mismatch 방지).

**Alternatives considered**:
- 클라이언트 정렬: 빠르지만 SSR ↔ CSR 순서 차이 시 hydration 경고 가능.

## 6. `MonthInput` 승격 시점

**Decision**: 003에서 바로 `packages/ui/src/components/MonthInput.tsx`로 승격.

**Rationale**:
- 이미 004(학력)에서 동일한 UI가 필요할 것이 design-brief 수준에서 자명(졸업월·입학월). "두 번째 소비자가 명확히 예상됨" 조건을 충족.
- 003 로컬에 만들고 004에서 extract하면 불필요한 리팩터 커밋 발생.

## 7. 테스트 범위

- **Vitest 단위**: `work-experience.schema.ts` Zod refinement — 날짜 범위·code point 제약·필수 필드·50건 상한은 DB 책임이므로 스키마 테스트 대상 아님.
- **React Testing Library**: `WorkExperienceList` 빈 상태·추가·편집 토글·삭제 confirm·상한 도달 disabled 상태.
- **통합 E2E**: OAuth 플로우 의존이라 자동화 생략(001 quickstart 패턴 상속). 수동 스모크로 대체.

---

**Output status**: Phase 0 의사결정 기록 완료, `NEEDS CLARIFICATION` 없음. Phase 1 진입.
