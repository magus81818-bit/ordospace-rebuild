# ORDOSPACE 주석화 작업 — Opus 인수인계 문서

작성일: 2026-07-06
작성자: Claude Fable 5 → Opus 4.6/4.8에게 넘김
목적: R3~R10 주석화 라운드를 독립적으로 수행하기 위한 완전한 작업 지시서

---

## 0. 배경 한 문장

ORDOSPACE는 정적 HTML/JS 프로토타입(프레임워크 없음, 해시 라우팅)이며, 오너(비개발자)가 "이 코드가 뭐 하는 건지" 직접 읽고 관리할 수 있도록 **전 파일에 한국어 주석 + docs/ 가이드 챕터 시리즈**를 작성하는 작업의 R3~R10을 당신이 수행합니다.

---

## 1. 절대 규칙 (위반 시 작업 무효)

| # | 규칙 |
|---|---|
| A1 | **코드 실행에 영향을 주는 변경 절대 금지.** 주석(`//`, `/* */`)과 빈 줄만 추가/수정한다. 변수명·로직·HTML 한 글자도 건드리지 않는다. |
| A2 | 주석이 파일 줄 수의 **30% 를 초과하지 않는다** — 과밀 방지. |
| A3 | 자명한 코드에 주석 달지 않는다 (`count + 1 // 1을 더한다` 금지). |
| A4 | 커밋·푸시·배포 하지 않는다. 사용자가 별도 지시할 때까지 로컬 파일 수정만. |
| A5 | 비밀값(토큰, DB URL 등)을 문서에 절대 기록하지 않는다. |
| A6 | 기존 한국어 주석은 유지하고, 틀렸거나 낡은 것만 교정한다. |
| A7 | 용어가 **처음 등장하는 곳에서만** 풀어 쓴다 — 이후엔 "(용어집 참조)" |

---

## 2. 톤/깊이 스펙 (R1 캘리브레이션에서 사용자 승인됨)

- **대상 독자**: 코드를 처음 보는 비개발자 (프로젝트 오너)
- **언어**: 한국어 100%. 영어 용어는 최초 1회 괄호 병기 후 한국어로.
- **비유**: "과하지 않은 범위내에서" 허용. 파일당 비유 1~2개. 예: 심판, 우체국, 부품공장, 교통정리.
- **존댓말**: 가이드 챕터에서만. 코드 주석은 반말/서술형.
- **분위기**: 교과서가 아니라 "옆에서 설명해주는 선배" — 딱딱하지도 유치하지도 않게.

### 승인된 톤 예시 (lifecycle service에서 발췌)

```js
// 전체를 (function(){ ... })() 로 감싼 이유: 내부 변수들이 바깥 세상(전역)을
// 어지럽히지 않게 하는 "방음벽"입니다. 밖에서 쓸 것만 맨 아래에서 골라 내보냅니다.

// 깊은 복사: 원본과 완전히 분리된 사본을 만듭니다 (사본을 고쳐도 원본이 안 바뀜).
function clone(value){

// [버튼: worker "리뷰 요청"] 작업자가 리뷰를 요청합니다.
// 조건: QC 체크리스트를 전부 완료해야 함. 안 되면 에러.
// 부수효과: 상태를 review 로 바꾸고, 날짜를 기록하고, 저장(persist)까지.
function submitWorkerReview(cardId, qcChecklist){
```

---

## 3. 파일 헤더 템플릿 (모든 대상 파일 공통)

```js
/* ============================================================
   [이 파일은] {한 줄 요약 — 이 파일의 정체. 비유 1개 허용}
   [언제 실행] {페이지 로드 시 / 버튼 클릭 시 / 서버에서 등}
   [주요 등장인물]
     - {함수/객체명} : {무엇을 하는지 한 줄}
     - {함수/객체명} : {무엇을 하는지 한 줄}
   [연결] ← {이 파일을 호출하는 곳} / → {이 파일이 의존하는 곳}
   [다음 읽을 파일] {코드 투어의 다음 정거장 — 파일 경로와 한 줄 이유}
   [수정할 때 주의] {건드리기 전에 알아야 할 함정이나 세트 관계}
   ============================================================ */
```

**[다음 읽을 파일] 체인 규칙**: 가이드 챕터의 읽기 순서와 일치해야 함. 챕터 내 파일 순서는 이 문서 §6의 라운드별 지시에 명시.

---

## 4. 주석 유형 4단계

| 단계 | 형식 | 달아야 하는 곳 |
|---|---|---|
| ① 파일 헤더 | 위 템플릿 | 모든 대상 파일 첫 줄 |
| ② 섹션 배너 | `/* ── 섹션 제목: 부연설명 ── */` | 파일 내 큰 덩어리 경계 (5개 이상 함수가 한 그룹일 때) |
| ③ 함수 주석 | `// 목적 / [버튼: ...] 트리거 / 부수효과` | export되거나 외부에서 호출되는 모든 함수 |
| ④ 줄 주석 | `// "왜"가 자명하지 않은 줄에만` | 매직넘버, 비직관적 조건, 우회 로직 |

**함수 주석 필수 포함 항목**:
- 목적 (한 줄)
- 트리거 (어떤 UI 동작이 이 함수를 부르는가) — `[버튼: ...]` 형식 권장
- 부수효과 (저장 되는가? 화면 다시 그려지는가? 알림 보내는가?)

---

## 5. 가이드 챕터 작성 규칙

### 구조 (모든 챕터 공통)

```markdown
# CODE GUIDE {번호} — {제목}: {부제}

> 한 줄 소개 (이 챕터에서 무엇을 알게 되는가)
> 등장 파일: ...

---

## 1. 큰 그림 (텍스트 다이어그램 또는 요약)
## 2~N. 파일/개념별 설명 (스토리 순서)
## N+1. 자주 하는 질문 (2~3개)
## N+2. 5분 따라하기 (실습 1~2개)
## N+3. 이 챕터를 읽고 답할 수 있어야 하는 질문 (3개 + 접기 답)

**다음 챕터** → `CODE_GUIDE_0X_제목.md` (예정): 한 줄 예고
```

### 핵심 원칙
- 파일 구조 순서가 아니라 **유저 플로우(스토리) 순서**로 쓴다.
- 코드 참조는 **함수명 + 파일명**으로 (라인 번호 금지 — 코드가 바뀌면 거짓말이 됨).
- 5분 따라하기: 반드시 **브라우저에서 직접 확인**하는 내용. F12 콘솔/Application 탭 활용.
- 질문 3개: `<details><summary>정답 확인</summary>` 접기로.

---

## 6. 라운드별 상세 작업 지시

---

### R3 — 데이터 사전

**산출물**: `docs/CODE_GUIDE_02_데이터_사전.md` + 코드 주석 + GLOSSARY 추가

**대상 파일** (주석 추가 순서):
1. `app/data/workspace.data.js` — **핵심 파일. 카드 필드 사전 수준으로 상세히.**
2. `app/data/room.data.js` — 개요 수준 (헤더 + 데이터 구조 설명)
3. `app/repos/room.repo.js` — 개요 수준 (헤더 + "무엇을 하는 파일인지")

**workspace.data.js 주석 포인트**:
- `ORDO_MODULE_CARDS` 배열의 카드 1장 구조를 필드별로 설명 (module, status, specCode, gateRef, assignee, qcChecklist, comments, workLogs, attachments 등)
- `PEOPLE`, `PROJECTS` 객체의 역할 설명
- `REPORT_DATA`, `CHANGE_DATA` — 승인함/이슈 화면의 데이터 구조 개요
- [다음 읽을 파일] → `app/ui/components/base.ui.js`

**CODE_GUIDE_02 핵심 내용**:
- ModuleCard 한 장의 "생김새" — 모든 필드를 표로 (필드명 | 뜻 | 예시값 | 누가 바꾸는가)
- "전역 변수"라는 개념: `window.ORDO_MODULE_CARDS`가 모든 화면의 데이터 원천
- 카드 12장의 시드 데이터 역할 설명
- 5분 따라하기: F12에서 `ORDO_MODULE_CARDS[0]` 열어보기, `.status` 바꿔보기(persist 안 됨을 확인)
- 질문 예시: "카드의 QC 체크리스트는 어떤 형태인가?", "PEOPLE 객체는 어디서 쓰이는가?"

**GLOSSARY 추가 예상 용어**: 전역 변수, 배열(Array), 객체(Object), 시드 데이터(이미 있으면 확인), 필드(field)

**[다음 읽을 파일] 체인**:
- workspace.data.js → `app/ui/components/base.ui.js`
- room.data.js → `app/repos/room.repo.js`
- room.repo.js → `app/screens/documents.screen.js` (또는 다음 챕터 첫 파일)

---

### R4 — 컴포넌트 기초

**산출물**: `docs/CODE_GUIDE_03_컴포넌트_사전.md` (전반부만 — 유틸/배지/지표) + 코드 주석 + GLOSSARY

**대상 파일**:
1. `app/ui/components/base.ui.js` — escape/format/date/route 유틸
2. `app/ui/components/status.ui.js` — tone 규칙과 배지 팩토리
3. `app/ui/components/metric.ui.js` — KPI/progress/empty state 팩토리

**주석 포인트 (base.ui.js)**:
- `window.ORDO_UI_COMPONENTS` 네임스페이스 설명 (부품 공장의 진열장)
- `escapeHtml` — XSS 방지 설명 (비개발자용: "사용자가 입력한 글자가 코드로 실행되는 사고를 막는 안전장치")
- `cx`, `fallbackText`, `safePct` 각각 한 줄
- `todayDateText`, `nowDisplayText`, `dateRank`, `displayDate` — 날짜 유틸 그룹 배너
- `routeParams` — URL 파라미터 읽기

**주석 포인트 (status.ui.js)**:
- tone 규칙 설명: 5가지 색조(crit/warn/pend/ok/rej)가 카드 상태에 따라 자동 결정
- `moduleTone(status)` — 상태 → 색조 변환 규칙
- `StatusBadge`, `PriorityBar` — 팩토리 패턴 설명

**주석 포인트 (metric.ui.js)**:
- `MetricCard` — KPI 숫자 표시
- `ProgressTrack` — 진행률 바
- `EmptyState` — 5가지 variant(panel/inline/detail/detail-lg/detail-emphasis) 설명
- Tailwind purge 안전: "클래스 목록이 완전한 리터럴인 이유" 한 줄

**CODE_GUIDE_03 전반부 구조**:
- "부품 공장이란?" — factory 패턴 3줄 설명 + 콘솔 실행 예시
- 유틸 카탈로그 (base.ui.js의 함수 목록표)
- 색조(tone) 시스템 설명 + 시각적 텍스트 다이어그램
- 지표 카탈로그 (MetricCard/ProgressTrack/EmptyState)
- 5분 따라하기: 콘솔에서 `ORDO_UI_COMPONENTS.StatusBadge('테스트', 'ok')` 실행해보기

**GLOSSARY 추가**: variant(변형), tone(톤/색상 등급), factory(팩토리 — 이미 있으면 확인), XSS

---

### R5 — 컴포넌트 심화

**산출물**: `docs/CODE_GUIDE_03_컴포넌트_사전.md` (완성) + 코드 주석 + GLOSSARY

**대상 파일**:
1. `app/ui/components/module-card.ui.js` — ModuleCardListItem 단일 팩토리
2. `app/ui/components/detail.ui.js` — 8개 상세 프리미티브
3. `app/ui/components/form.ui.js` — FormField, CheckboxRow, OptionList
4. `app/ui/components/sheet.ui.js` — SheetController
5. `app/ui/workspace.ui.js` — 화면 공유 유틸 (moduleTodayText 등)
6. `app/ui/room.ui.js` — 레거시 room 렌더러 (개요 수준)

**주석 포인트 (module-card.ui.js)**:
- "4곳에 흩어져 있던 카드 HTML을 하나로 통합한 팩토리" — 탄생 배경 한 줄
- `ModuleCardListItem(card, opts)` — opts 각 옵션(tone, tag, interactive, dataAttr, selected, metaParts, truncateFooterLeft) 설명
- 옵션 표가 핵심: 주석 안에 옵션 테이블 (라인이 길어지면 섹션 주석으로)

**주석 포인트 (detail.ui.js)**:
- 8개 프리미티브 각각: `DetailHeader`, `MetaGrid`, `QcList`, `WorkLogList`, `AttachmentList`, `CommentList`, `DetailSection`, `ActionToolbar`
- `QcList`의 editable 옵션 (체크박스 활성화)
- `ActionToolbar`의 layout(wrap/stack) × variant(default/warn/primary)

**주석 포인트 (form.ui.js / sheet.ui.js)**:
- 간단한 파일이므로 헤더 + 함수 1줄씩이면 충분

**CODE_GUIDE_03 완성 시 추가할 내용**:
- ModuleCardListItem 옵션 표 (가장 중요한 부품)
- 상세 프리미티브 8종 카탈로그
- 조합 예시: "admin 상세 화면 = DetailHeader + MetaGrid + QcList + ActionToolbar"
- 5분 따라하기: 콘솔에서 `ORDO_UI_COMPONENTS.ModuleCardListItem(ORDO_MODULE_CARDS[0], {tone:'ok'})` 실행

**GLOSSARY 추가**: 프리미티브(primitive), 옵션(option/opts), editable

---

### R6 — 카드의 일생 ① 규칙

**산출물**: `docs/CODE_GUIDE_04_카드의_일생.md` (전반부: 상태 전이 + 저장 훅) + 코드 주석 보강 + GLOSSARY

**대상 파일**:
1. `app/services/module-card-lifecycle.service.js` — R1에서 이미 주석 있음. **추가 보강만.**

**R1 주석 위에 추가할 것**:
- 상태 전이 다이어그램 (텍스트 아트)을 파일 상단 주석 블록에 추가:

```
/*
  상태 전이 지도:
  pending ──[assignWorker]──→ in_progress
  in_progress ──[submitWorkerReview]──→ review
  review ──[sendAdminToClient]──→ done(=클라이언트 승인 대기)
  done ──[approveClient]──→ approved ✓
  done ──[requestRevision(client)]──→ revision
  review ──[requestRevision(admin)]──→ revision
  revision ──[submitWorkerReview]──→ review (다시 리뷰로)
*/
```

- persist/hydrate 함수의 "언제 불리는가" 보강
- `remoteSave` — debounce 400ms 설명 줄 주석
- `hydrateRemote` — 서버 우선/로컬 폴백 로직 설명

**CODE_GUIDE_04 전반부 핵심**:
- 상태 전이 다이어그램 (텍스트)
- 각 전이의 "누가 / 어떤 버튼 / 어떤 조건" 표
- persist 훅: "상태를 바꾸면 자동으로 저장까지 되는 이유"
- 가드(guard) 개념: "이 조건이 안 맞으면 거절당한다" 예시
- 질문: "pending 카드를 곧바로 done으로 보낼 수 있는가? 왜?"

**GLOSSARY 추가**: 상태 전이, 가드(guard — 이미 있으면 확인), persist, debounce(이미 있으면 확인)

---

### R7 — 카드의 일생 ② 화면

**산출물**: `docs/CODE_GUIDE_04_카드의_일생.md` (완성: 역할별 여정) + 코드 주석 + GLOSSARY

**대상 파일** (분량 최대 — 필요 시 R7a/R7b 분할 가능):
1. `app/screens/admin-workspace.screen.js`
2. `app/screens/worker-workspace.screen.js`
3. `app/screens/client-workspace.screen.js`

**공통 주석 패턴 (3개 파일 모두)**:
- 파일 헤더: [이 파일은] "XX 역할의 워크스페이스 화면 — 카드 목록과 상세 보기"
- render 함수: "이 화면에 진입할 때 라우터가 부르는 함수" + 부수효과
- afterCardMutation: "카드 상태가 바뀐 직후 화면을 다시 그리는 함수" + "왜 현재 라우트만 갱신하는가"
- detail 함수: "카드를 클릭하면 모달에 표시할 상세 HTML을 만드는 함수"
- 이벤트 바인딩부: `[버튼: ...]` 태그로 각 버튼 → lifecycle 함수 연결 명시

**admin-workspace 고유 포인트**:
- `syncAdminCardRouteState` — F1 딥링크 기능 설명
- `submitAdminBulkCreate` — 일괄 생성 워크플로
- 필터/정렬 UI 바인딩부

**worker-workspace 고유 포인트**:
- QC 체크리스트 인터랙션 → submitWorkerReview 조건
- "내 카드만 보인다" 필터링 로직

**client-workspace 고유 포인트**:
- project 탭 vs approvals 탭 분리
- 승인/수정요청 버튼 → approveClient/requestRevision 연결
- "revision 버튼이 ActionToolbar의 일급 항목이 된 이유" (몽키패치 제거 경위)

**CODE_GUIDE_04 완성 시 추가할 내용**:
- 역할별 여정 서술 (admin의 하루 / worker의 하루 / client의 하루)
- "이 버튼 → 이 함수 → 이 상태 변경" 매핑 표 (역할별)
- 5분 따라하기: worker로 리뷰 요청 → admin으로 전환해 확인 → client로 승인
- 질문: "worker가 리뷰 요청을 누를 수 없는 경우는?", "승인 후 카드는 어디서 확인?"

**GLOSSARY 추가**: mutation(변경), 딥링크, 필터

---

### R8 — 저장의 여정

**산출물**: `docs/CODE_GUIDE_05_저장의_여정.md` + 코드 주석 + GLOSSARY

**대상 파일**:
1. `api/module-cards.js` — Vercel serverless 함수 (GET/PUT)
2. `api/_lib/module-card-repository.cjs` — Postgres CRUD
3. `api/_schema/module-cards.sql` — DB 스키마

**주석 포인트 (api/module-cards.js)**:
- 헤더: "카드 우체국 — 브라우저가 보낸 카드를 DB에 넣거나, DB에서 꺼내 보내주는 창구"
- GET: 전체 카드 목록 반환
- PUT: 전체 카드 목록 덮어쓰기 (last-writer-wins 한계 명시)
- CORS, 에러 응답 패턴

**주석 포인트 (repository)**:
- 헤더: "금고지기 — 실제 DB 읽기/쓰기 + JSON 유효성 검증"
- `upsertCards` — 전체 교체 방식 설명
- JSON schema 검증 로직

**주석 포인트 (SQL)**:
- 테이블 구조 설명 (jsonb 컬럼의 의미)

**CODE_GUIDE_05 핵심**:
- 전체 저장 파이프라인 다이어그램:
  ```
  [버튼 클릭] → lifecycle.persist()
    → ① localStorage 즉시 저장
    → ② 400ms 뒤 서버 PUT 전송
    → ③ api/module-cards.js 가 받아서
    → ④ repository 가 Postgres 에 저장
  ```
- 새로고침 복구 순서: hydrate(localStorage) → hydrateRemote(서버 GET) → 더 최신 것 채택
- "왜 즉시 서버에 안 보내고 400ms를 기다리는가?" (debounce)
- 5분 따라하기: Application 탭에서 localStorage 키 확인 → 승인 → 값 변경 확인
- 질문: "인터넷이 끊기면 데이터가 사라지는가?"

**GLOSSARY 추가**: API, PUT/GET, JSON, Postgres, serverless, upsert

---

### R9 — 보조 화면 + 품질

**산출물**: `docs/CODE_GUIDE_06_품질을_지키는_법.md` + 코드 주석 + GLOSSARY

**대상 파일**:
1. `app/screens/auth.screen.js` — 로그인 화면
2. `app/screens/documents.screen.js` — 문서함 화면
3. `app/screens/report-center.screen.js` — 리포트/승인 상세
4. `app/main.js` — 부팅 마침표 + 랜딩 연출
5. `tools/validate-static-module-lifecycle.cjs` — **헤더 수준만**
6. `tools/validate-static-components.cjs` — **헤더 수준만**

**보조 화면 주석**: 헤더 + 주요 render 함수 1~2줄이면 충분 (깊이 낮음 OK).

**tools/ 주석**: 파일 헤더만. "이 스크립트는 무엇을 검사하고, 실패하면 무엇이 깨진 것인지"

**CODE_GUIDE_06 핵심**:
- 검증 명령 카탈로그 표:
  | 명령 | 무엇을 지키는가 | 결과 읽는 법 |
- "코드를 고친 뒤 무엇을 돌려야 하는가" 체크리스트
- `npm run check:js` — 문법 오류 잡기
- `npm run static:validate-lifecycle` — 상태 전이 규칙 위반 잡기
- `npm run static:validate-components` — 컴포넌트 계약 위반 잡기
- `npm run smoke` — 12 라우트 실제 브라우저 테스트
- 5분 따라하기: 터미널에서 `npm run static:validate-components` 직접 실행

**GLOSSARY 추가**: CI, assertion, 스크립트

---

### R10 — 마무리 + 통독 검사

**산출물**: GLOSSARY 완성 + 잔여 교정 + 이정표 정합성 전수 검사

**작업 내용**:

1. **GLOSSARY 완성**: 모든 챕터를 통독하며 설명 없이 등장하는 용어를 추가. 최종 정렬 (가나다 → ABC).

2. **[다음 읽을 파일] 이정표 전수 검사**:
   - 모든 JS 파일의 [다음 읽을 파일]을 추출
   - 실제 해당 파일이 존재하는지 확인
   - 체인이 끊기는 곳이 없는지 확인 (A→B→C→...→마지막)
   - 가이드 챕터의 등장 파일 순서와 일치하는지

3. **챕터 간 링크 검사**:
   - 각 챕터 끝의 "다음 챕터" 링크가 실제 파일명과 일치
   - CODE_GUIDE_00의 챕터 목록 표에서 "예정" → 상태 갱신

4. **"질문 3개" 전 챕터 점검**: 모든 챕터의 질문이 해당 챕터 본문만으로 답할 수 있는지 확인.

5. **통독 시뮬레이션**: CODE_GUIDE_00부터 06까지 이정표만 따라가며 읽었을 때 끊기거나 이해 안 되는 곳 수리.

---

## 7. 매 라운드 검증 절차 (반드시 수행)

라운드를 마칠 때마다 아래를 수행하고 결과를 보고:

```bash
# 1. 문법 검사 (주석 추가로 인한 문법 오류 없음 확인)
npm run check:js

# 2. 동작 불변 검증 (주석만 추가했으므로 반드시 통과해야 함)
npm run static:validate-lifecycle
npm run static:validate-components

# 3. 스모크 테스트 (12 라우트 + Runtime QA 20/20)
npm run smoke

# 4. 변경 확인 (코드 줄 변경 0 확인 — 주석/공백만 변경됐는지)
git diff --stat
# 또는 수동 확인: 변경된 줄이 전부 // 또는 /* */ 인지 육안 체크
```

**위 4개 중 하나라도 실패하면**: 주석을 잘못 달아 코드를 건드린 것. 즉시 되돌리고 원인 파악.

---

## 8. GLOSSARY 관리 규칙

- 위치: `docs/GLOSSARY.md`
- 새 용어 추가 시: 해당 챕터 섹션 헤더(`## 챕터 0X에서 추가된 용어`)를 만들거나 기존 섹션에 추가
- 형식: `| **용어** | 뜻 (한국어, 비개발자 기준) |`
- 이미 있는 용어는 중복 추가하지 않음 — 기존 설명이 부족하면 보강만
- 마지막 섹션 "추가 예정"의 항목은 해당 라운드에서 채우고 지움

---

## 9. 작업 시작 시 사용자에게 보고할 내용

각 라운드 시작 시:
```
R{N} 시작합니다.
- 대상: {파일 목록}
- 산출물: {가이드 문서명}
- 예상 주석 추가량: ~{N}줄 ({파일당 대략 추정})
```

각 라운드 완료 시:
```
R{N} 완료.
- 주석 추가: {파일별 줄 수}
- 가이드: {문서명} 작성/갱신
- GLOSSARY: +{N}개 용어
- 검증: check:js ✓ / validate-lifecycle ✓ / validate-components ✓ / smoke ✓
- 다음: R{N+1} ({한 줄 예고})
```

---

## 10. 참조 파일 위치

| 파일 | 용도 |
|---|---|
| `CLAUDE_CODE_ANNOTATION_PLAN_KO.md` | 원본 10라운드 설계 (이 문서의 근거) |
| `CLAUDE_CODE_REVIEW_REPORT_KO.md` | P1~P3 이슈 목록 (주석에서 "알려진 한계"로 참조 가능) |
| `CLAUDE_COMPONENT_SPLIT_DESIGN_KO.md` | 컴포넌트 분리 설계 + 12라운드 로그 |
| `docs/CODE_GUIDE_00_시작하기.md` | 전체 지도 (챕터 목록 표 갱신 필요) |
| `docs/CODE_GUIDE_01_앱이_켜질_때.md` | R2 산출물 — 톤/구조 참조용 |
| `docs/GLOSSARY.md` | 현재까지 누적된 용어 (~23개 + 챕터01 추가분) |

---

## 11. 모델 선택 가이드 (사용자 참고)

- **Opus 4.6**: 한국어 글쓰기·기획 특화. 가이드 챕터 작성, 비유·스토리텔링, 톤 일관성에 강점. **R3~R5, R6(전반), R8~R10 추천.**
- **Opus 4.8**: 코딩 특화. 대형 코드 파일 정밀 분석에 강점. **R7(3개 대형 screen 파일) 추천.**
- 혼용 가능: 한 라운드 안에서도 "코드 주석은 4.8, 가이드 문서는 4.6"으로 나눌 수 있음.

---

## 12. 주의사항 / FAQ

**Q. R1~R2에서 이미 주석이 달린 파일을 다시 만지나요?**
R6에서 lifecycle service를 보강하고, R10에서 전수 검사 시 필요하면 수정합니다. 그 외에는 건드리지 않습니다.

**Q. 라운드 순서를 바꿔도 되나요?**
사용자가 "이 파일 먼저"라고 하면 따릅니다. 단, [다음 읽을 파일] 체인과 챕터 순서 정합성은 마지막(R10)에서 맞춥니다.

**Q. 주석 추가 중 버그를 발견하면?**
코드를 고치지 않습니다. `docs/FINDINGS_DURING_ANNOTATION.md`(없으면 생성)에 기록만 합니다.

**Q. 가이드 문서가 너무 길어지면?**
한 챕터가 A4 5페이지(~2500단어)를 넘으면 분할을 고려합니다. 단, 사용자 확인 후.

---

*이 문서 자체는 커밋 대상이 아닙니다. 작업 안내 전용.*
