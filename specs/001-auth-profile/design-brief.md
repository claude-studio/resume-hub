# Design Brief: 로그인 및 기본 프로필 관리 (001-auth-profile)

**Created**: 2026-04-22  
**Status**: Ready for implementation  
**Source context**: [spec.md](./spec.md) · [plan.md](./plan.md) · [../../.impeccable.md](../../.impeccable.md) · [../../DESIGN.md](../../DESIGN.md)

---

## 1. Feature Summary

`resume-hub`의 첫 피처. Google 계정으로 로그인한 이직 준비자가 기본 프로필(이름·이메일·전화·한 줄 소개)을 저장·수정할 수 있게 한다. 이번 피처의 출력물(프로필 데이터)은 후속 피처인 익스텐션 자동 완성의 입력으로 쓰인다.

## 2. Primary User Action

**프로필 페이지에서 필드를 채우고 "저장" 버튼을 눌러 "저장됨" 상태를 확인하는 것.** 로그인은 1-클릭으로 끝나지만 프로필 편집은 사용자의 시간과 집중이 실제로 머무는 구간이다. 이곳의 UX 품질이 "내 이력이 잘 정돈되고 있다"는 전문가적 자존심(.impeccable.md)으로 직결된다.

## 3. Design Direction

**Editorial-grade professional tool** — Notion warm minimalism(DESIGN.md) 위에 에디토리얼 타이포그래피의 엄격함을 얹는다. 잘 조판된 단행본이나 프리미엄 제품 매뉴얼에 가까운 감각.

핵심 태도:
- 장식이 아니라 **여백·타이포·리듬**으로 품질감을 전달한다.
- 이력서가 놓일 "책상"을 깨끗하게 치워주는 역할. 제품이 시선을 가져가서는 안 된다.
- 차가운 기업 톤도 금지, 과한 친근함도 금지. `.impeccable.md`의 anti-reference(구세대 취업 포털·AI 미래주의·관료적 테이블) 모두 해당.

## 4. Layout Strategy

### 랜딩 페이지 `/`
- **한 스크린 히어로만.** 스크롤 없음, 가치 제안 섹션 없음. 여백이 메시지다.
- 좌측 정렬 텍스트 (centering 지양, `.impeccable.md` 원칙 5 "에디토리얼 타이포" 실현).
- 콘텐츠 최대 폭 **640px**, 화면 세로 중앙보다 약 45% 지점(황금비 위쪽)에 타이틀.
- 구성 순서: 브랜드 워드마크(14px) → 54px 헤드라인 → 20px 서브카피 → CTA 쌍(primary + ghost) → 얇은 푸터.
- 배경: 순백(`#ffffff`). warm white 보조 섹션 없음.
- 장식 0개. 배경 그라디언트·일러스트·아이콘 없음.

### 프로필 페이지 `/profile`
- **단일 컬럼 문서 레이아웃.** 최대 폭 **680px**, 좌측 정렬.
- 상단: 브랜드 워드마크(좌) + 이메일·로그아웃 링크(우). 드롭다운 없이 두 링크 그대로 노출(이직 준비자의 과투자 회피).
- 본문 구조:
  - **H1 "프로필"** (40px, weight 700, tracking -0.012em)
  - 섹션 설명 (16px, warm-500): "플랫폼 이력서 폼이 자동으로 채울 기본 정보입니다."
  - **저장 상태 라인** (14px, warm-500): `저장됨 · 오늘 오후 2:32` 또는 `· 변경사항 있음` 또는 `저장 중…`
  - 필드 4개 세로 적층 (2열 그리드 금지 — 타이핑 리듬 우선):
    - 이름 / 이메일(readonly) / 전화번호 (선택) / 한 줄 소개 (선택, textarea)
  - 폼 하단: "저장" 버튼 우측 정렬(키보드 전주행 시 Tab의 자연스러운 종점).
- 섹션 간 수직 리듬: H1↔설명 12px, 설명↔상태 16px, 상태↔첫 필드 40px, 필드↔필드 24px, 마지막 필드↔저장 버튼 32px.
- whisper border(`rgba(0,0,0,0.1)`)는 input에만. 카드 컨테이너로 폼 감싸지 않음(문서감 우선).

## 5. Key States

### 랜딩
| 상태 | 표현 |
|------|------|
| Default | 히어로 그대로 |
| 로그인됨으로 진입 | 미들웨어가 즉시 `/profile`로 307 |
| OAuth callback 처리 중 | `/auth/callback`은 순간 화면, 필요 시 단일 줄 "로그인 완료 중…"만. 기본은 즉시 리다이렉트 |
| OAuth 취소/거부 | `/?error=cancelled` → 히어로 상단에 조용한 info 배지 "로그인이 취소되었습니다"가 3초 후 fade. 레이아웃 이동 없음 |

### 프로필
| 상태 | 핵심 변화 |
|------|----------|
| **첫 진입 (트리거 기본값)** | 이름·이메일 prefill, 전화·소개 empty. 이미 편집 가능. 상태 라인 "새 프로필" |
| **Clean (저장됨, 변경 없음)** | 상태 라인 "저장됨 · {시각}" 상시 표시. 저장 버튼 disabled + 레이블 "저장됨" |
| **Dirty (변경 있음, 미저장)** | 상태 라인 "· 변경사항 있음" (warm-500 dot 접두). 저장 버튼 활성 |
| **Saving** | 버튼 disabled + 레이블 "저장 중…". 200ms 초과 시 spinner glyph(12px) 좌측 inline 렌더 |
| **Saved (방금)** | 버튼 레이블 "저장됨" (disabled). 상태 라인 업데이트된 시각. 별도 toast·배지 없음 |
| **Validation error** | 해당 필드 `aria-invalid="true"`, 바로 아래 14px 에러 메시지 (warm-톤 빨강 `oklch(55% 0.17 30)` 근방). 페이지는 움직이지 않음. 포커스는 첫 오류 필드로 |
| **Server error** | 폼 하단에 가로 꽉 찬 whisper-bordered 블록 + "다시 시도" 버튼 (ghost). 입력값 유지 |
| **Session expired during save** | refresh 성공 시 완전 투명, 저장 계속. refresh 실패 시 입력값 로컬 보존 후 `/?return=profile`로 이동 |

## 6. Interaction Model

### 진입 흐름
```
[비로그인 `/`]
    ↓ Google CTA 클릭
[Google 동의]
    ↓ 승인
[`/auth/callback?code=…` SSR 쿠키 교환]
    ↓
[`/profile` 서버 컴포넌트 초기 프로필 fetch → 클라이언트 컴포넌트 prop 주입]
```
- 로그인 세션 있는 방문자가 `/` 입장 → 미들웨어가 307 `/profile`.
- 모든 로딩은 서버 컴포넌트 스트리밍에 맡김. 클라이언트 사이드 skeleton 없음(FR-014).

### 폼 편집
- 페이지 진입 시 **이름 필드에 자동 포커스**. 첫 방문자의 "뭘 해야 하지?" 공백을 줄인다.
- 키 입력 감지 → "Dirty" 전환 → 저장 버튼 활성화.
- Tab 순서: `이름 → 전화 → 한 줄 소개 → 저장 버튼 → 로그아웃 링크`. 이메일(readonly)은 Tab에서 스킵.
- `Enter`를 텍스트 input에서 눌러도 form submit 아님(다음 필드 focus). textarea는 줄바꿈.
- `Ctrl/Cmd+S`: 저장 단축키. 이직 준비자가 반복 저장하는 시나리오를 가속.
- 한 줄 소개 옆에 **live counter** `N / 200`. 160자 이상부터 accent 색으로 경고.
- 이메일 필드 클릭 시 툴팁 "구글 계정 이메일이 사용됩니다 · 수정 불가". 텍스트 선택·복사는 허용.

### 저장
- 저장 클릭 → Zod 검증(`profile.schema.ts`) → 통과 시 supabase-js `UPDATE` → 응답 대기.
- 200ms 타이머가 완료 전 터지면 spinner 렌더. 완료 후 즉시 "Saved" 상태로.
- 실패 시 입력값은 폼에 그대로 유지. 오류 블록이 폼 하단에 나타남. 포커스는 "다시 시도" 버튼으로.

### 로그아웃
- 우측 상단 "로그아웃" 텍스트 링크 → 쿠키 제거 → `/`.
- 확인 다이얼로그 없음(프로필 데이터 수동 삭제가 아니므로 되돌릴 수 없는 파괴 아님).

## 7. Content Requirements

### 랜딩 카피 (한국어)

| 위치 | 안 1 (권장) | 안 2 |
|------|-----------|------|
| 헤드라인 | "이력은 한 번만 쓴다" | "이력 한 곳, 어디서든 자동 완성" |
| 서브카피 | "이력 데이터를 한 곳에 모으고, 플랫폼 이력서 폼은 브라우저 익스텐션이 자동으로 채웁니다." | 동일 |
| Primary CTA | "Google로 시작하기" (Google 로고 + 텍스트) | 동일 |
| Secondary CTA | "익스텐션 받기" (ghost) — 익스텐션 미공개 시 disabled 처리 + 툴팁 "곧 공개됩니다" | 동일 |
| 푸터 | `© 2026 resume-hub · privacy@resume-hub.example` | 동일 |

### 프로필 카피

| 요소 | 텍스트 |
|------|--------|
| 페이지 제목 | "프로필" |
| 섹션 설명 | "플랫폼 이력서 폼이 자동으로 채울 기본 정보입니다." |
| 이름 레이블 | "이름" |
| 이메일 레이블 | "이메일" (보조: "구글 계정 이메일이 사용됩니다 · 수정 불가") |
| 전화 레이블 | "전화번호 (선택)" |
| 소개 레이블 | "한 줄 소개 (선택)" |
| 소개 placeholder | "예: 5년차 프론트엔드 개발자, 제품 중심 팀 선호" |
| 저장 상태 (clean) | "저장됨 · {시간}" |
| 저장 상태 (dirty) | "· 변경사항 있음" |
| 저장 버튼 (기본) | "저장" |
| 저장 버튼 (saving) | "저장 중…" |
| 저장 버튼 (clean) | "저장됨" (disabled) |
| 이름 검증 오류 | "이름을 입력해주세요" |
| 전화 검증 오류 | "전화번호 형식이 올바르지 않습니다" |
| 소개 검증 오류 | "한 줄 소개는 200자 이하여야 합니다" |
| 서버 오류 블록 | "저장에 실패했습니다. 네트워크를 확인하고 다시 시도하세요." + [다시 시도] |
| 세션 만료 info (rare) | "세션이 만료되어 다시 로그인해주세요. 입력한 값은 유지됩니다." |

### Dynamic Content Ranges
- 이름: 1–80자 (80자 초과는 극단). 한국 이름 기준 3–4자가 전형.
- 이메일: 일반 이메일 길이.
- 전화: 0 또는 7–13자, 국제 표기 허용.
- 한 줄 소개: 0–200자. 전형은 30–60자. 160자 이상부터 counter 경고.

## 8. Recommended References

구현 단계에서 참고할 impeccable reference files와 프로젝트 내 문서:

| 출처 | 이유 |
|------|------|
| `.impeccable.md` | 디자인 원칙 5가지 · 톤 · anti-reference. **구현자가 가장 먼저 읽을 문서**. |
| `DESIGN.md` §1–4 (팔레트·타이포·컴포넌트) | 토큰 진실의 원천 |
| `impeccable reference/typography.md` | 에디토리얼 타이포그래피 포스처 (letter-spacing, hierarchy) |
| `impeccable reference/spatial-design.md` | 단일 컬럼 문서 리듬, gap-only 간격 |
| `impeccable reference/interaction-design.md` | 폼 포커스·오류·disabled 패턴 |
| `impeccable reference/motion-design.md` | 200ms 조건부 spinner, reduced-motion |
| `specs/001-auth-profile/spec.md` FR-010~014, SC-006~007 | 접근성·로딩 UX·성능 계약 |
| `packages/ui/src/components/Button.tsx` | 기존 Button 재사용, variant 추가 고려 |

추가로 impeccable의 `/polish` 또는 `/critique`를 최초 구현 후 1회 돌려 finesse 확인 권장.

## 9. Open Questions

구현 과정에서 풀어야 할 미확정 항목:

1. **헤드라인 최종 카피** — "이력은 한 번만 쓴다" vs "이력 한 곳, 어디서든 자동 완성". 첫 안을 추천하되 라이브 빌드에서 육안 확인 후 결정.
2. **"익스텐션 받기" 보조 CTA** — 익스텐션이 Chrome Web Store에 등록되기 전까지 disabled + 툴팁 "곧 공개됩니다"로 처리. 등록 후 스토어 링크 연결.
3. **우측 상단 유저 메뉴의 이메일 노출 여부** — 공용 기기 프라이버시를 고려해 이메일의 로컬 파트만 표시(예: `samuel@…`). 확정 필요.
4. **폼 필드 label 위치** — 상단(stacked) 권장. DESIGN.md 기본 패턴. 좌측 정렬 inline은 반응형에서 깨지기 쉬움.
5. **ProfileForm을 `Button`만이 아닌 `Input`/`Textarea` 공용 컴포넌트로 승격할지** — 본 피처에서는 로컬 구현, 2번째 피처에서 중복 발생 시 `packages/ui`로 승격.
6. **Sonner / Radix Toast 같은 toast 라이브러리 도입 여부** — 본 피처는 toast 사용 안 함(모든 피드백은 상태로 표현). 미도입이 기본.
7. **favicon·OG 이미지** — 본 피처 범위에서 최소 플레이스홀더 제공. 브랜드 마크 확정은 후속 스펙.

---

## Handoff

이 design brief는 다음 순서로 구현 단계에 투입한다:

1. `/speckit-tasks`가 이 문서를 참조해 UI 태스크를 **화면 단위**가 아닌 **상태 단위**로 쪼개도록 유도 (Clean / Dirty / Saving / Error 각각 구현·테스트 가능).
2. `/speckit-implement` 또는 직접 구현. 필요한 경우 `/impeccable craft [화면 이름]`으로 특정 화면 마감.
3. 최초 가시 상태 달성 후 `/critique`로 1라운드 피드백, `/polish`로 세부 마감.
