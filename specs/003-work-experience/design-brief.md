# Design Brief: 경력 관리 (003-work-experience)

**Created**: 2026-04-22  
**Scope**: 중규모 — 리스트 UX·인라인 확장·다중 상태. 001/002 design-brief를 전제로 하고 **고유 부분만** 상세 기술.

## 1. Feature Summary

사용자의 직무 경력을 `/profile` 페이지에 **리스트 섹션**으로 추가한다. 항목별로 인라인 확장 편집 · 역순 시간 정렬 · 최대 50건.

## 2. Primary User Action

**신규 경력을 "경력 추가"로 빠르게 등록하는 것.** 이력서 작성의 주된 손목 동작이 여기서 일어남. 2~3분 안에 회사 3~5개를 쭉 입력할 수 있어야 한다.

## 3. Design Direction

`.impeccable.md`의 **"Editorial-grade professional tool"** 방향 그대로 상속. 추가로 **"list-as-document" 감각** — LinkedIn보다는 Notion/Linear의 "페이지 안 블록" 느낌. 카드 간 구분선은 얇은 whisper border, 배경은 동일 `#ffffff`, 카드 안 padding은 16-24px.

## 4. Layout Strategy

### 전체 페이지 구조 (기존 /profile 확장)

```
┌─ ProfileHeader (wordmark · email · 로그아웃) ────────┐
│                                                     │
├─ 프로필 (기존 001+002 폼) ─────────────────────────┤
│   * 이름  / 이메일(ro) / 전화 / 한 줄 소개 / 자기소개 │
│   [저장]                                            │
│                                                     │
├─ 경력 ───────────────────────────────────────────┤ ← 신규 섹션
│   ┌─ Acme Corp · Senior Engineer ─────────── ✎ × ─┐│
│   │ 2023-01 — 현재                                 ││
│   │ Led backend migration to …                     ││
│   └────────────────────────────────────────────────┘│
│   ┌─ Beta Inc · Engineer ──────────────────── ✎ × ─┐│
│   │ 2020-03 — 2022-12                              ││
│   └────────────────────────────────────────────────┘│
│                                                     │
│   [+ 경력 추가]                                     │
└─────────────────────────────────────────────────────┘
```

- 프로필 폼과 경력 섹션 사이 **60px 간격** + 섹션 구분선 없음(타이포로 계층 표현).
- 각 경력 카드는 padding `p-4` (16px), radius `rounded-[8px]`, border `border-[color:var(--color-border-whisper)]`.
- 카드 간 간격 `gap-3` (12px).
- "경력 추가" 버튼은 리스트 최하단, `Button variant="secondary" size="sm"`, **50건 도달 시 `disabled`**.

### 편집 모드 전환 (인라인 확장)

뷰 모드 카드 높이: ~72px (회사·역할 1줄 + 기간 1줄 + 설명 1줄).  
편집 모드 전환 시 **같은 카드가 180~260px로 확장**, 내부에 폼 렌더링:

```
편집 모드 (확장):
┌─ [회사명 input                    ] [역할 input                 ] ×───┐
│ ┌ 시작월 ┐ ┌ 종료월 ┐  ☐ 현재 재직 중                                  │
│ │YYYY-MM│ │YYYY-MM│                                                  │
│ └───────┘ └───────┘                                                  │
│ ┌─ 설명 (선택, 500자) ─────────────────────────────┐      340/500     │
│ │                                                   │                  │
│ └───────────────────────────────────────────────────┘                  │
│                            [취소] [삭제] [저장]                        │
└──────────────────────────────────────────────────────────────────────┘
```

- 확장 시 `transition: height 200ms ease-out` (motion-safe).
- 종료월 input은 "현재 재직 중" 체크 시 `disabled` + 값 clear.
- 우상단 `×`는 편집 취소(변경 롤백 + 뷰 모드 복귀). 삭제는 내부 하단 버튼 + confirm.
- 저장/삭제 버튼은 카드 하단 flex 우측. 삭제는 `Button variant="ghost" size="sm"` + 빨강 hover로 위험 시그널.

### 빈 상태

```
┌─ 경력 ─────────────────────────────────────────────┐
│                                                     │
│   아직 경력이 없습니다.                              │
│   첫 경력을 추가해보세요.                            │
│                                                     │
│   [+ 경력 추가]                                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

warm-500 톤 2줄 안내 + 중앙 정렬 버튼. 카드 컨테이너 없이 단일 영역(120px 높이).

## 5. Key States

| 상태 | 표현 |
|------|------|
| **Empty** | 안내 + "경력 추가" 버튼만 |
| **Viewing (list)** | 카드 N장, 뷰 모드. 각 카드에 hover 시 편집 아이콘 fade-in |
| **Editing (inline)** | 해당 카드만 확장. 다른 카드는 그대로 (동시 편집 불가 — 다른 카드의 편집 아이콘은 disabled) |
| **Adding (new)** | "경력 추가" 클릭 시 리스트 상단에 **빈 편집 카드** 등장, 회사 필드 auto-focus |
| **Saving** | 저장 버튼 `disabled` + "저장 중…" (200ms spinner gate, 001 패턴) |
| **Saved** | 카드가 뷰 모드로 전환, 짧은 warm-500 "저장됨" 캡션 (2초 후 페이드) |
| **Validation error** | 해당 필드에 빨간 메시지(danger token), aria-describedby 연결 |
| **Server error** | 카드 하단 inline 에러 블록 + "다시 시도"(001 패턴) |
| **Limit reached (50)** | "경력 추가" 버튼 `disabled` + aria-label "최대 50건까지 등록 가능합니다" + 버튼 아래 warm-500 한 줄 안내 |
| **Delete confirming** | 네이티브 `window.confirm("'{회사} · {역할}' 경력을 삭제하시겠습니까?")` |

## 6. Interaction Model

- **Tab 순서**: 프로필 저장 버튼 → (경력 섹션 들어오면) 각 카드 편집 아이콘 → "경력 추가" 버튼 → 로그아웃. 편집 모드 진입 시 Tab 순서가 **해당 카드 내부 필드**로 한정 (포커스 트랩 없이도 자연스럽게).
- **편집 진입**: 카드 본문 어디든 클릭 또는 `Enter` (편집 아이콘 포커스 상태). 모바일은 탭.
- **편집 취소**: 우상단 `×` 또는 Escape 키. 변경 값은 Reset.
- **Enter in text fields**: 다음 필드로 이동 (form submit 방지, 001 패턴).
- **Cmd/Ctrl+S**: 편집 중인 카드 저장 (001 hotkey 재사용 — 단 카드 컨텍스트 한정).
- **"현재 재직 중" 토글**: 체크 시 종료월 `disabled` + value clear. 해제 시 종료월 `enabled`, 기본값 오늘 기준 현재 월.

## 7. Content Requirements

| 요소 | 텍스트 |
|------|--------|
| 섹션 제목 | "경력" |
| 섹션 설명 | 없음 (불필요 — 카드 자체가 의미 전달) |
| 빈 상태 line 1 | "아직 경력이 없습니다." |
| 빈 상태 line 2 | "첫 경력을 추가해보세요." |
| 추가 버튼 | "+ 경력 추가" |
| 상한 안내 | "최대 50건까지 등록 가능합니다" |
| 회사 레이블 | "회사" (asterisk prefix — 필수) |
| 역할 레이블 | "역할" (asterisk prefix — 필수) |
| 시작월 레이블 | "시작" (asterisk prefix — 필수) |
| 종료월 레이블 | "종료" |
| 현재 재직 중 토글 | "☐ 현재 재직 중" |
| 설명 레이블 | "설명" |
| 설명 placeholder | "예: 주요 책임·성과·스택. bullet 형식으로 작성해도 좋습니다." |
| 카드 기간 표기 (뷰 모드) | `YYYY.MM — YYYY.MM` 또는 `YYYY.MM — 현재` |
| 저장 버튼 | "저장" / "저장 중…" / "저장됨" |
| 삭제 버튼 | "삭제" |
| 삭제 확인 | "'{회사} · {역할}' 경력을 삭제하시겠습니까?" |
| 검증 오류 (회사) | "회사명을 입력해주세요" |
| 검증 오류 (역할) | "역할을 입력해주세요" |
| 검증 오류 (기간) | "종료일은 시작일 이후여야 합니다" |
| 검증 오류 (설명) | "설명은 500자 이하여야 합니다" |

## 8. Recommended References

- `.impeccable.md` (warm minimalism · asterisk 필수 표시 · Forest Green accent)
- 001 design-brief §5 (8 상태 모델 — 그대로 상속)
- 002 design-brief §6 (code-point 카운터 — 동일 패턴 재사용)
- `packages/ui/src/components/FormField.tsx` (label + error + ARIA 자동)
- `packages/ui/src/components/Button.tsx` (variants: primary / secondary / ghost / outline, sizes: xs / sm / md)

구현 시점에 `/polish` 권장 — 인라인 확장 transition 타이밍·카드 hover 전환 등 미세 조정.

## 9. Open Questions

구현 중 해결 가능한 범위:

1. **카드 hover에서 편집/삭제 아이콘 표시 여부** — 권장: hover 시 `opacity: 1` 페이드인, 평시 `opacity: 0.6`. 완전 숨김은 발견성 저하.
2. **설명 필드의 기본 높이** — 권장: 3줄(`rows={3}`), 500자 도달해도 auto-grow 없이 scroll.
3. **"현재 재직 중" 기본값** — 신규 추가 시 off(명시적 종료월 입력 유도). UX 테스트 결과 따라 on이 자연스러우면 뒤집기.
4. **저장 성공 후 자동 뷰 모드 복귀 vs 편집 유지** — 권장: 자동 복귀. 연속 편집 원하면 다시 열면 됨.
5. **여러 항목 한꺼번에 편집** — 현재 "한 번에 하나만" 제약. 고급 사용자의 bulk edit 니즈는 v2 이후.
