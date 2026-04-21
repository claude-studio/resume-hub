# Design Brief: 프로필 자기소개 필드 (002-profile-summary)

**Created**: 2026-04-22  
**Status**: Ready for implementation  
**Scope**: 작은 피처 — 압축형 브리프. 대부분의 결정은 001의 design-brief를 상속.

## 1. Feature Summary

`/profile` 페이지에 자기소개(summary) textarea를 추가한다. 한 줄 소개(headline, 200자) 아래 위치하며, 1000자까지의 서술형 본문을 수용한다.

## 2. Primary User Action

**textarea에 자기소개 텍스트를 작성하고 "저장"을 누르는 것.** 헤드라인 다음에 바로 이어지는 태스크이므로 탭 이동 경로가 자연스러워야 한다.

## 3. Design Direction

`.impeccable.md`의 "Editorial-grade professional tool" 방향 그대로. 추가 장식 없음. 기존 FormField 프리미티브를 재사용해 시각 일관성 100%.

## 4. Layout Strategy

```
이름 *
[input 44px]

이메일 (disabled)
[input 44px]

전화번호
[input 44px]

한 줄 소개                              123 / 200
[textarea 88px]

자기소개                                456 / 1000   ← 신규
[textarea ~120px / 5 lines]

[저장]
```

- **위치**: 한 줄 소개 바로 아래. 연락처(이름·이메일·전화) → 서술(헤드라인·자기소개) 그룹화.
- **높이**: 최소 120px (`min-h-[7.5rem]`) — 기본 5줄 공간. 입력에 따라 세로 확장 허용(resize는 여전히 `resize-none` 유지해 레이아웃 흔들림 방지).
- **카운터**: 동일 `<output>` 패턴, 800자부터 warn(`accent-focus`), 1000자에서 danger(`--color-danger`).

## 5. Key States

| 상태 | 표현 |
|------|------|
| Empty | placeholder 노출, 카운터 `0 / 1000` warm-500 |
| Typing (≤ 799) | 값 렌더, 카운터 warm-500 |
| Typing (800–999) | 카운터 색상 `accent-focus`로 전환 |
| Typing (1000) | 카운터 `danger` 색 + font-medium. 브라우저 maxLength로 추가 입력 차단. |
| Validation error (서버 위반) | FormField 하단에 빨간 에러 메시지 (existing 패턴) |

## 6. Interaction Model

- **Tab 진입**: 한 줄 소개 다음에 바로 자기소개. 기존 Tab 순서 이름→전화→한 줄 소개→자기소개→저장→로그아웃.
- **Enter**: textarea는 줄바꿈 허용.
- **IME (한글)**: composition 상태의 문자는 브라우저가 `maxLength` 적용 시점이 브라우저마다 다름 — Zod refine가 최종 안전망.
- **Save 단축키(Cmd/Ctrl+S)**: 기존 useProfile 훅의 hotkey 그대로 작동.

## 7. Content Requirements

| 요소 | 텍스트 |
|------|--------|
| 라벨 | `자기소개` (asterisk 없음 — 선택 입력) |
| Placeholder | `예: 5년차 프로덕트 매니저로서 B2B SaaS에서 도메인 전문성을 쌓아왔습니다. 이해관계자 정렬과 데이터 기반 의사결정을 강점으로 꼽습니다.` |
| 카운터 | `{현재} / 1000` (code-point 기준) |
| 검증 오류 | `자기소개는 1000자 이하여야 합니다` |

## 8. Recommended References

- `.impeccable.md` — 원칙 3 "스트레스 받는 사용자 거스르지 않음" — 긴 텍스트 입력 중 방해 최소화 원칙 유지.
- `specs/001-auth-profile/design-brief.md` §5 (8 states) — 카운터·저장·에러 패턴 재사용.
- `packages/ui/src/components/FormField.tsx` — 라벨+카운터+에러 프리미티브 그대로.

## 9. Open Questions

1. 자기소개가 길 때(800자+) 첫 `/profile` 진입 시 폼이 한 화면 밖으로 내려가면 저장 버튼이 보이지 않을 수 있음 — **MVP에선 자연 스크롤로 충분**. 300자 이상 사용자가 많아지면 sticky save 고려.
2. `CharCounter`를 packages/ui로 승격 시점: 헤드라인·자기소개 두 곳이 거의 동일 로직이지만 **세 번째 서술 필드(경력 description 등) 도입 시** 함께 추출. 현 피처에서는 인라인 유지.
