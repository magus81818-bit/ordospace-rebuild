# ORDOSPACE 컴포넌트 분리 설계 (Claude Code)

작성일: 2026-07-03
작성자: Claude Code (Fable 5)
전제: `COMPONENTIZATION_REFACTOR_PLAN.md`(16라운드 계획)와 `CLAUDE_COMPONENTIZATION_HANDOFF.md`를 기반으로 하되, 이번 코드 리뷰(`CLAUDE_CODE_REVIEW_REPORT_KO.md`)에서 확인한 실제 중복 지도를 반영해 **12라운드**로 재구성한 실행 설계입니다.

---

## 1. 분리 목표

1. 기존 ORDOSPACE 정적 UI의 **시각적 결과와 라우트 동작을 그대로 유지**하면서, 반복 UI를 컴포넌트 팩토리로 모은다.
2. 화면 파일(screens)은 "데이터 선택 + 팩토리 호출 + 이벤트 바인딩"만 남긴다.
3. 비즈니스 변이는 `module-card-lifecycle.service.js` 단일 경로로 유지하고, 레거시 직접 변이 코드(정의 후 재정의 패턴)를 제거한다.
4. 화면 파일 간 숨은 로드 순서 결합(공유 유틸이 client 화면 파일에 있는 문제)을 해소한다.
5. React 전환이 아니다. 전역 스크립트 + HTML 문자열 팩토리 방식을 유지한다.

## 2. 현재 중복 지도 (분리 근거)

이번 리뷰에서 확인한 실제 중복입니다. 같은 마크업이 3~4벌씩 존재합니다.

| 패턴 | 중복 위치 (4벌까지) |
|---|---|
| ModuleCard 요약 카드 | `workspace.ui.js` `moduleCard` / `admin-workspace.screen.js:632` `adminCardListItemHtml` / `worker-workspace.screen.js:269` `workerCardSummaryHtml` / `client-workspace.screen.js:23` `projectModuleCard` |
| 상세 메타 타일 그리드 | `admin-workspace.screen.js:679-695` / `client-workspace.screen.js:29` `cardDetailBodyHtml` / `client-workspace.screen.js:42` `approvalDetailHtml` |
| QC 체크리스트 목록 | admin :638 / worker :271 / client :29, :42 |
| 작업 기록 목록 | admin :644 / worker :271 |
| 첨부(산출물) 목록 | admin :651 / worker :271 / client :29, :41-42 |
| 코멘트 목록 | admin :657 / worker :271 / client :29, :42 |
| 액션 버튼 툴바 | admin :733 / worker :271 / client :42(+:100 몽키패치) |
| 상태 배지 | `statusBadgeHtml`(client :18) / `wkStatusBadge`(worker :6) / `wkSubStateBadge`(worker :150) / `adminBadge`(admin :584) / intake·health·statusVisual 계열(admin :10-13, :182-188, :281-288) |
| KPI 메트릭 카드 | `moduleMetric`(workspace.ui.js) / `roomMetric`(room.ui.js) |
| 진행률 바 | `progressTrackHtml`(client :19) / admin 보드·테이블 인라인 progress-track 마크업 다수 |
| 빈 상태 패널 | admin :634, :872 / worker :271, :355 / client :42-43 등 대시보드별 dashed 패널 다수 |

공유 유틸 소유권 문제 (라운드 2~3의 핵심 근거):

- `client-workspace.screen.js`에 있는데 admin/worker가 쓰는 것: `statusBadgeHtml`, `progressTrackHtml`, `safePct`, `todayDateText`, `nowDisplayText`, `dateRank`, `displayDate`, `ORDO_CHAIN_LABELS`, `ORDO_STEP_LABELS`
- `worker-workspace.screen.js`에 있는데 admin이 쓰는 것: `routeParams`

## 3. 추천 컴포넌트 목록

핸드오프 문서의 `window.ORDO_UI_COMPONENTS` 네임스페이스를 그대로 채택합니다.

| 컴포넌트 | 대체 대상 | 비고 |
|---|---|---|
| `escapeHtml` | `moduleEsc`, `roomEsc` | 기존 이름은 위임 래퍼로 유지 |
| `StatusBadge(label, tone)` | statusBadgeHtml/wkStatusBadge/adminBadge 등 | tone 계산(`moduleTone`)은 호출부 책임 |
| `PriorityBar(tone)` | `bar-l` 좌측 바 span | 요청서의 "우선순위 배지" 대응 |
| `MetricCard(label, value, sub, cls)` | `moduleMetric`, `roomMetric` | |
| `ProgressTrack(label, approved, total, caption)` | `progressTrackHtml` + 인라인 progress 마크업 | |
| `EmptyState(message, opts)` | dashed 빈 패널 전부 | |
| `ModuleCardListItem(card, opts)` | 위 4벌 요약 카드 | `opts`: `{selected, dataAttr, tag:'button'|'article', metaLine}` variant로 4벌 흡수 |
| `DetailHeader(card, badgeHtml)` | admin/worker/client 상세 헤더 | P2-1 mojibake도 여기서 해소 |
| `MetaGrid(pairs)` | 메타 타일 그리드 3벌 | `[{label, value}]` 배열 입력 |
| `QcList(items, opts)` | QC 목록 4벌 | `opts.editable`이면 checkbox 렌더(worker용) |
| `WorkLogList(logs)` | 작업 기록 2벌 | |
| `AttachmentList(files, opts)` | 첨부 목록 4벌 | `opts.preview`면 이미지 미리보기(approvals용 `attachmentPreviewHtml` 흡수) |
| `CommentList(comments)` | 코멘트 목록 4벌 | 날짜 정렬 포함 |
| `ActionToolbar(buttons)` | 액션 버튼 3벌 + 몽키패치 | `[{action, label, icon, tone, primary}]` 입력 — 문자열 치환 몽키패치 제거의 핵심 |
| `FormField(spec)` | bulk create 폼/prompt 대체 준비 | 라운드 11 |
| `Sheet(id, title, bodyHtml)` | bulk create 시트 래퍼 | 라운드 11 |
| `Notice(message, tone)` | ordoToast는 유지, 인라인 안내 박스용 | 요청서의 "토스트/알림" 중 토스트는 기존 `ordoToast` 재사용 |

요청서의 후보 목록과의 대응: 상태 배지→StatusBadge, 우선순위 배지→PriorityBar, 메트릭 카드→MetricCard, 진행률 바→ProgressTrack, 리스트 아이템→ModuleCardListItem, 상세 패널→DetailHeader+MetaGrid+각 List+ActionToolbar 조합(단일 거대 컴포넌트로 만들지 않음), 메타 그리드→MetaGrid, 코멘트→CommentList, 첨부→AttachmentList, 액션 그룹→ActionToolbar, 폼 필드→FormField, 빈 상태→EmptyState, 로딩/오류→Notice, 토스트→기존 ordoToast 유지.

## 4. 추천 파일 구조

요청서 예시(badge.ui.js, button.ui.js…)보다 핸드오프 문서의 "패턴 묶음" 구조가 파일 수를 줄이고 로드 순서 관리가 쉬워 이를 채택하되, 공유 포맷 유틸용 `base.ui.js`를 강조합니다.

```text
app/
  ui/
    components/
      base.ui.js        # escapeHtml, cx(클래스 결합), fallbackText, 날짜/포맷 유틸(safePct, dateRank, displayDate, todayDateText, nowDisplayText, routeParams)
      status.ui.js      # StatusBadge, PriorityBar, tone 매핑 표(moduleToneClass/moduleDot 이관)
      metric.ui.js      # MetricCard, ProgressTrack, EmptyState, Notice
      module-card.ui.js # ModuleCardListItem
      detail.ui.js      # DetailHeader, MetaGrid, QcList, WorkLogList, AttachmentList, CommentList, ActionToolbar
      form.ui.js        # FormField (라운드 11)
      sheet.ui.js       # Sheet (라운드 11)
    workspace.ui.js     # 위임 래퍼만 남김 (moduleEsc→escapeHtml 등, 기존 전역 이름 보존)
    room.ui.js          # 유지 (room 계열은 이번 범위 밖)
  screens/
    admin-workspace.screen.js   # 흐름/필터 상태/이벤트 바인딩만
    worker-workspace.screen.js
    client-workspace.screen.js
```

`index.html` 스크립트 순서 (변경 최소화 — components를 `workspace.ui.js` 바로 앞에 삽입):

```html
<script src="./app/ui/room.ui.js"></script>
<script src="./app/ui/components/base.ui.js"></script>
<script src="./app/ui/components/status.ui.js"></script>
<script src="./app/ui/components/metric.ui.js"></script>
<script src="./app/ui/components/module-card.ui.js"></script>
<script src="./app/ui/components/detail.ui.js"></script>
<script src="./app/ui/workspace.ui.js"></script>
<!-- 이후 기존 순서 유지: hash-router → client → report-center → documents → admin → worker → main → runtime-qa -->
```

## 5. 컴포넌트 계약 (핸드오프 문서 계승)

- 명시적 입력만 받는다. `moduleCards()`/전역 데이터 직접 접근 금지 (호환 래퍼 제외).
- HTML 문자열을 반환한다. 동적 텍스트는 기본 이스케이프.
- `document.querySelector` 호출 금지. 이벤트 바인딩은 화면 파일(또는 별도 binder)에 남긴다.
- 비즈니스 변이 금지.
- **기존 클래스명과 data-속성을 그대로 보존한다** (시각 회귀 + QA 셀렉터 보호: `#adminCardDetail`, `data-admin-card-id`, `ordo-c-*` 클래스 등).
- Tailwind 클래스는 완성형 문자열로만 조합한다 (`bg-st-${tone}bg` 같은 동적 조립 금지 — purge 안전).

## 6. 12라운드 분리 순서

원칙: 한 라운드 = 한 절개. 매 라운드 종료 시 검증 통과 후 다음으로. 구코드는 신경로 검증 후에만 삭제.

### 라운드 1 — 베이스라인 고정 (코드 무변경)
- 브랜치/더티 파일 확인, 새 작업 브랜치 생성 (제출 커밋 이후 시점 권장 — `ORDOSPACE_GITHUB_COMMIT_SEQUENCE_KO.md`의 순서 유지).
- `npm.cmd run check:js`, `static:validate-lifecycle`, `smoke` 통과 기록을 남겨 회귀 판정 기준으로 삼는다.
- 검증: 위 3개 명령 + `git diff --check`.

### 라운드 2 — `base.ui.js` 신설 (추가만, 삭제 없음)
- `escapeHtml`, `cx`, `fallbackText` 신설. `safePct/dateRank/displayDate/todayDateText/nowDisplayText/routeParams`를 base로 **복사**하고, 기존 정의(client/worker 화면 파일)는 base 위임으로 교체.
- 이 라운드로 P2-8(로드 순서 결합)의 절반이 풀린다. lifecycle 서비스가 `window.todayDateText`를 참조하므로 전역 이름은 반드시 유지.
- 검증: check:js + static:validate-lifecycle + smoke. 화면 픽셀 변화 0이어야 함.

### 라운드 3 — `status.ui.js` + tone 체계 이관
- `moduleToneClass`, `moduleDot`, `moduleLabel`, `moduleTone`을 status.ui.js로 이동(workspace.ui.js는 위임). `StatusBadge`, `PriorityBar` 팩토리 신설.
- `statusBadgeHtml`(client 화면 정의)을 status.ui.js로 이동해 소유권 정리 — P2-8 완전 해소.
- 첫 호출부 교체는 저위험 지점 1곳만: `client-workspace.screen.js`의 approvals 목록 배지.
- 검증: 3종 + 브라우저에서 admin/worker/client 배지 색상 육안 비교.

### 라운드 4 — `metric.ui.js` (MetricCard/ProgressTrack/EmptyState/Notice)
- `moduleMetric`/`progressTrackHtml` 본체 이관, 기존 이름 위임 유지. `EmptyState` 신설 후 dashed 빈 패널 중 admin-cards 목록 empty(:872)와 detail empty(:634) 2곳만 먼저 교체.
- 검증: 3종 + admin-cards에서 필터로 0건 만들어 빈 상태 확인.

### 라운드 5 — `ModuleCardListItem` 통합 (이번 계획의 최대 절개)
- 4벌(moduleCard/adminCardListItemHtml/workerCardSummaryHtml/projectModuleCard)의 차이를 옵션으로 정리: 태그(button/article), data-속성 이름, 메타라인 구성, selected 클래스.
- **admin 카드 목록만 먼저 교체**(`renderAdminCardList`). 나머지 3벌은 다음 라운드들에서.
- 검증: 3종 + smoke의 admin cards 라우트 + 목록 클릭/선택 하이라이트 동작 확인.

### 라운드 6 — `detail.ui.js` 프리미티브 (admin 소비 기준)
- `DetailHeader/MetaGrid/QcList/WorkLogList/AttachmentList/CommentList/ActionToolbar` 신설. admin의 :638-761 헬퍼들을 팩토리 호출로 교체. 이벤트 바인딩(`bindAdminCardActions`)은 화면에 유지.
- 이때 `DetailHeader`에서 P2-1 mojibake(`?`→`·`)가 자연 수정됨 — 시각 diff에 이 한 글자만 나타나야 정상.
- 검증: 3종 + admin 상세에서 코멘트/재배정/마감/완료/수정요청/Client 전달 전 액션 수동 확인.

### 라운드 7 — Admin 레거시 제거
- 죽은 구버전 삭제: `adminAfterCardMutation`(:766), `bindAdminCardActions`(:767), `submitAdminBulkCreate`(:938), 사용처 없는 intake/PM 지정 alert 바인딩 중 DOM이 사라진 것들.
- `adminAfterCardMutation`을 "전 화면 팬아웃" 대신 `renderModuleRouteScreens(currentRouteId())` 호출로 단순화 (P2-5).
- 검증: 3종 + smoke:lifecycle. 액션 후 현재 화면 갱신과 다른 역할 화면 진입 시 최신 상태 반영 확인.

### 라운드 8 — Worker 마이그레이션 + 레거시 제거
- `workerCardSummaryHtml`→ModuleCardListItem, `workerDetailHtml`(:271)→detail 프리미티브(QcList editable 옵션), 구 `bindWorkerDetailActions`(:272) 삭제.
- 검증: 3종 + worker QC 체크→리뷰 요청 흐름(QC 미완료 시 차단 포함) 수동 확인.

### 라운드 9 — Client project/모달 마이그레이션
- `projectModuleCard`→ModuleCardListItem(article variant), `cardDetailBodyHtml`→MetaGrid+QcList+AttachmentList+CommentList, 구 `openCardDetail`(:30) 삭제.
- 검증: 3종 + 프로젝트 타임라인 카드 클릭→모달→코멘트/승인 확인.

### 라운드 10 — Client approvals 마이그레이션 + 몽키패치 제거
- `approvalDetailHtml`을 detail 프리미티브 조합으로 재작성하고 **문자열 치환 몽키패치(:100-106) 삭제** — 수정요청 버튼을 `ActionToolbar` 입력 배열에 정식 포함.
- 구 `renderApprovals`(:43) 삭제. `attachmentPreviewHtml`은 AttachmentList의 preview 옵션으로 흡수.
- 검증: 3종 + 승인/수정요청/코멘트 흐름 + revision 후 worker 화면 반영 확인.

### 라운드 11 — Form/Sheet 프리미티브
- `Sheet`, `FormField` 신설, admin bulk create 시트를 팩토리 기반으로 교체. UI 재설계 금지 — 마크업 동일 유지.
- (선택) prompt() 입력들을 FormField 시트로 바꾸는 것은 별도 승인 후. 이번 라운드에서는 하지 않는다.
- 검증: 3종 + bulk create로 카드 N건 생성→목록/서버 저장 확인.

### 라운드 12 — QA·문서 정렬 + 최종 검증
- `tools/validate-static-components.cjs` 신설(vm 기반): 각 팩토리의 이스케이프 동작과 필수 클래스명 존재 검증.
- `check:js` 목록에 components/*.ui.js와 누락된 app/*.js 추가.
- `STRUCTURE.md`/`README.md`를 최종 구조로 갱신 (리뷰 P2-7 해소). index.html 컴포넌트 갤러리 예시를 실제 팩토리 출력과 일치시킴.
- 최종: `npm.cmd run build` + check:js + static:validate-lifecycle + api:validate + smoke:lifecycle + `npm.cmd audit --omit=dev`.
- 배포/GitHub 반영 여부는 사용자와 별도 결정.

## 7. 파일 순서 요약

**처음 만지는 파일**: `app/ui/components/base.ui.js`(신설) → `app/ui/workspace.ui.js`(위임 전환) → `app/ui/components/status.ui.js`.

**마지막에 만지는 파일**: `app/screens/client-workspace.screen.js`의 approvals 블록(몽키패치 제거는 프리미티브가 모두 검증된 뒤), `app/qa/*`, `STRUCTURE.md`/`README.md`.

**건드리지 말아야 할 파일**:
- `api/**` 전체, `app/services/module-card-lifecycle.service.js` (컴포넌트 분리와 무관 — 리뷰 P1 항목은 별도 작업으로)
- `tools/validate-*.cjs`, `seed-module-cards-db.cjs` (라운드 12의 목록 추가 제외)
- `app/data/**`, `app/config/app.config.js`, `app/router/hash-router.js`, `app/layout/app-shell.js`
- `index.html`의 마크업 본문 (script 태그 추가 제외), `app/styles/**` (생성물 포함)
- `react-mvp/**`, `vercel.json`, `.vercelignore`
- `report-center.screen.js`, `documents.screen.js`, `room.ui.js`, `room.repo.js`, `room.data.js` (room 계열은 범위 밖)

## 8. 완료 기준

1. ModuleCard 요약 카드/상세 프리미티브가 각각 단일 팩토리에서만 생성된다 (grep으로 `ordo-c-module-card` 마크업 생성 지점이 module-card.ui.js 1곳).
2. `screens/*.js`에 HTML 템플릿이 사실상 남지 않고(레이아웃 래퍼 수준 제외), "정의 후 재정의" 레거시 패턴이 0건이다.
3. 상태 변이는 전부 `ORDO_MODULE_CARD_LIFECYCLE` 경유다 (`card.status =` 직접 대입이 screens에서 0건).
4. 기존 클래스명/데이터 속성/라우트/카피가 유지되어 smoke 12라우트 + Runtime QA 20/20이 계속 통과한다.
5. 서버 저장/새로고침 복구가 그대로 동작한다 (static:validate-lifecycle + smoke:lifecycle 통과).
6. `STRUCTURE.md`가 실제 트리와 일치한다.

## 9. 대시보드 유기성·유저 플로우 사전 평가 (작업 시작 전 판단)

컴포넌트 분리 착수 전에 "화면 구성이 유저 플로우와 맞는가"를 별도로 평가한 결과입니다.

### 결론

**골격은 적절합니다.** 역할별 홈(요약/KPI) → 작업 화면(목록+상세 2패널) 2단 구조가 세 역할 모두 일관되고, 핵심 루프(admin 생성·배정 → worker QC·리뷰요청 → admin 검토·Client 전달 → client 승인/수정요청 → worker 재작업)가 화면 구성과 lifecycle 상태 전이에 정확히 대응합니다. 알림도 카테고리별 딥링크(`getNotificationTarget`, app-shell.js:79)로 목적 화면에 연결됩니다. 정보 구조를 바꿀 필요는 없고, 아래 **연결 끊김 8건**만 보완하면 됩니다.

### 발견된 연결 끊김 (유기성 갭)

| # | 갭 | 위치 | 심각도 |
|---|---|---|---|
| F1 | **admin 홈 액션 카드가 필터를 안 물고 감**: "마감 초과 N건" 클릭 → `#admin-cards` 무필터 목록. worker는 `?filter=` 딥링크를 지원하는데 admin은 렌더러가 `?filter=`를 읽지 않음 | `admin-workspace.screen.js:597-598`(href), `:836-850`(card 파라미터만 읽음) | 중 |
| F2 | **admin 프로젝트 타임라인 카드가 클릭 불가(막다른 길)**: `moduleCard()`는 핸들러 없는 article. client 타임라인은 클릭→모달인데 admin은 같은 모양의 카드가 반응 없음 — 일관성 깨짐 | `admin-workspace.screen.js:601` (`group.map(moduleCard)`) | 중 |
| F3 | **client 대시보드 승인 대기 카드 클릭 불가**: 같은 `moduleCard()` 사용. 바로 위 "전체 보기 →"(#approvals) 링크가 있어 완화되지만, 카드 자체가 `#approvals?card=id`로 가는 게 자연스러움 | `client-workspace.screen.js:22`, index.html:2314-2316 | 하 |
| F4 | **'완료 처리'와 'Client 전달' 가드 불일치**: `sendAdminToClient`는 review 상태만 허용(가드 있음)인데 `markDone`은 상태 가드가 없어 pending 카드도 바로 승인 대기로 점프 가능. 두 버튼 모두 결과가 status=done이라 역할도 중복 | `module-card-lifecycle.service.js:623-640` vs `:448-453`, 버튼: `admin-workspace.screen.js:733-743` | **상** (플로우 우회 구멍) |
| F5 | **알림 비대칭**: 동적 알림은 client(승인 요청)만 생성됨. worker 리뷰요청→admin 알림 없음, admin/client 수정요청→worker 알림 없음. admin/worker는 KPI·필터로만 발견 | `lifecycle.service.js:459-468`(client만 push) | 중 |
| F6 | **사이드바/탭바 배지가 거짓말함**: 승인함 '3', 내 작업 '2', Module 관리 '5'가 하드코딩 — 실제 카드 수와 무관. 승인함이 비어도 '3' 표시 | `app.config.js:46-95` | 중 |
| F7 | **worker '오늘 마감' KPI·필터가 사실상 죽어 있음**: KPI는 실제 오늘 날짜 기준인데 시드 마감일은 2026-06-08 부근이라 항상 0건. `today` 필터 로직은 있지만 UI 버튼이 없어 도달 불가 | `worker-workspace.screen.js:268,270`, index.html:2458-2465(버튼 6개, today 없음) | 중 |
| F8 | **status 'done'의 라벨 혼란**: 내부적으로 done = "클라이언트 승인 대기"인데 라벨은 '완료'. 승인함 목록에서 "완료" 배지 카드에 승인 버튼이 붙어 클라이언트 관점에서 모순 (`admin-team?worker=` 파라미터 무시도 동류의 소소한 갭) | `workspace.ui.js:33` moduleLabel, `renderAdminTeam` | 하 |

### 라운드 계획 반영

구성 재설계는 불필요하므로 라운드 수는 12로 유지하되, 위 갭을 해당 라운드에 흡수합니다:

- **F4 (가드 구멍)** → ✅ **처리 완료 (2026-07-03, 사용자 예외 승인)**: `markDone`이 `canAdminSendToClient` 판정을 재사용해 review 상태에서만 동작하도록 수정. 컴포넌트 분리와 분리된 단독 커밋 `65cc739`. UI 변화 없음 — review가 아닌 카드에서 '완료 처리' 클릭 시 기존 try/catch 경로로 alert 표시.
- **F1** → 라운드 7: `resolveAdminActiveCard`에서 `params.get('filter')` 읽기 + 홈 액션 카드 href에 `?filter=overdue|review` 부여 (worker와 동일 패턴).
- **F2, F3** → 라운드 5~6: `ModuleCardListItem`에 `dataAttr` 옵션이 생기므로 admin 타임라인/클라이언트 대시보드 카드에 클릭 속성을 붙이는 것이 공짜에 가까움.
- **F7** → 라운드 8(worker 마이그레이션): today 필터 버튼 추가 여부 + 기준일 통일(리뷰 P2-4)을 함께 결정.
- **F8** → 라운드 10: `moduleLabel`의 done 라벨을 '승인 대기'로 바꿀지 결정 (카피 변경이므로 사용자 승인 필요 — "카피 유지" 원칙과 충돌).
- **F5, F6** → 컴포넌트 분리 범위 밖(알림 데이터 흐름 + config). 별도 소작업으로 분리 권장: `MENU` 배지를 `moduleCards()` 파생 카운트로 교체 + lifecycle 이벤트에 admin/worker 알림 push 2줄씩 추가.

## 10. 라운드 진행 로그

### 라운드 1 — 베이스라인 고정 (2026-07-03 완료)

- 브랜치: `react-mvp-modulecard-lifecycle` (HEAD `704a9c7` → F4 커밋 후 `65cc739`)
- 더티 상태: 수정 10개 파일(index.html, 3개 screen, package.json 등) + untracked 다수(api/, tools/validate-*, 보고서 문서들, `HARNESS_ENGINEERING_REPORT.md` — 커밋 금지 대상 유지)
- 특이사항: `module-card-lifecycle.service.js`가 untracked 상태였음 → F4 수정과 함께 첫 커밋으로 추가됨
- 베이스라인 검증 결과 (수정 전):
  - `check:js` 통과
  - `static:validate-lifecycle` 통과 (6개 흐름)
  - `smoke` 통과 — 12 라우트, Runtime QA 20/20, 런타임 예외 0, 로그 오류 0
  - smoke 출력에서 P2-1 mojibake(`design.ux ? Design Lock`) 재확인됨
- F4 수정 후 재검증: 문법 OK + `static:validate-lifecycle` 통과 + `smoke:lifecycle` 통과 (lifecycle persistence QA 포함)
- 컴포넌트 분리용 새 브랜치는 **아직 만들지 않음** — 제출 기준 커밋(Codex 담당)이 완료된 뒤 그 시점에서 분기하는 것이 계획(라운드 1 원칙)과 일치. 다음 라운드(라운드 2, base.ui.js) 착수 전에 분기 시점을 사용자와 확정할 것.

### 라운드 2 — base.ui.js 신설 + 공유 유틸 위임 전환 (2026-07-03 완료)

- 신설: `app/ui/components/base.ui.js` — `window.ORDO_UI_COMPONENTS` 네임스페이스에 `escapeHtml`, `cx`, `fallbackText`, `safePct`, `todayDateText`, `nowDisplayText`, `dateRank`, `displayDate`, `routeParams` 정본 구현 등록.
- 위임 전환 (기존 전역 이름 보존, 동작 동일):
  - `client-workspace.screen.js` — `safePct`/`todayDateText`/`nowDisplayText`/`dateRank`/`displayDate` 5개를 base 위임으로 교체 (lifecycle 서비스가 참조하는 `window.todayDateText` 등 전역 이름 유지 확인)
  - `worker-workspace.screen.js` — `routeParams` 위임 전환 (admin 화면과의 로드 순서 결합 해소)
  - `app/ui/workspace.ui.js` — `moduleEsc`가 roomEsc 조건 분기 대신 `escapeHtml` 위임 (escape 맵 동일)
- `index.html` — `room.ui.js` 다음, `workspace.ui.js` 앞에 base.ui.js 스크립트 태그 추가.
- 검증: 신규/수정 파일 `node --check` OK, `check:js` 통과, `static:validate-lifecycle` 통과, `smoke` 통과 (12 라우트, Runtime QA 20/20).
- **커밋 보류**: client/worker 화면과 index.html에 제출용 미커밋 변경이 이미 섞여 있어, 지금 커밋하면 제출 변경과 라운드 변경이 혼합됨. 제출 기준 커밋(Codex) 완료 후 라운드 단위 커밋으로 분리 예정. `base.ui.js`(untracked 신규 파일)는 단독 커밋 가능 상태.
- 남은 것: `statusBadgeHtml`/`progressTrackHtml`/tone 체계 이동은 계획대로 라운드 3에서. `check:js` 목록에 base.ui.js 추가는 라운드 12(package.json이 이미 더티라 최소 변경 원칙).

### 라운드 3 — status.ui.js 신설 + tone/배지 소유권 이동 (2026-07-03 완료)

- 신설: `app/ui/components/status.ui.js`
  - `moduleTone`/`moduleLabel`/`moduleToneClass`/`moduleDot` 정본을 workspace.ui.js에서 **이동** (원위치는 이동 주석만 남김)
  - `statusBadgeHtml`을 client-workspace.screen.js에서 **이동** — admin/worker가 client 화면 파일에 의존하던 소유권 오류(P2-8) 해소 완료
  - 신규 팩토리: `StatusBadge(label, tone)`, `PriorityBar(tone)` — 기존 배지 마크업과 클래스 완전 동일
  - `statusBadgeHtml(status, tone)`은 StatusBadge를 감싸는 호환 래퍼로 유지 (모든 기존 호출부가 자동으로 팩토리 경유)
  - `moduleDays`는 workspace.ui.js에 잔류 (기준일 로직은 P2-4 결정과 함께 라운드 8에서)
- 첫 호출부 교체 (계획된 저위험 1곳): 승인함 목록 배지 — 활성 `renderApprovals` 오버라이드에서 `statusBadgeHtml(c.status,'warn')` → `ORDO_UI_COMPONENTS.StatusBadge(moduleLabel(c.status),'warn')`. 출력 HTML 동일. (:43의 레거시 renderApprovals는 죽은 코드라 손대지 않음 — 라운드 10에서 삭제)
- `index.html` — base.ui.js 다음에 status.ui.js 스크립트 태그 추가.
- 검증: 수정 3파일 + 신규 파일 `node --check` OK, `check:js` 통과, `static:validate-lifecycle` 통과, `smoke` 통과 (12 라우트, Runtime QA 20/20).
- 커밋 보류 상태는 라운드 2와 동일 (제출 커밋 후 라운드 단위 분리).

### 라운드 4 — metric.ui.js 신설 + 빈 상태 2곳 교체 (2026-07-03 완료)

- 신설: `app/ui/components/metric.ui.js`
  - `MetricCard` — workspace.ui.js `moduleMetric` 본체 이관 (moduleMetric은 위임 래퍼로 유지)
  - `ProgressTrack` — client-workspace.screen.js `progressTrackHtml` 본체 이관 (전역 이름은 metric.ui.js에서 호환 래퍼로 유지 — 공유 유틸 소유권 정리 완료)
  - `EmptyState(message, {variant})` — 화면에서 실제 쓰이는 5개 변형(panel/inline/detail/detail-lg/detail-emphasis)을 **완성형 클래스 리터럴**로 보유 (tailwind.config.cjs content가 `app/**/*.js`를 스캔하므로 purge 안전 확인함)
  - `Notice(message, tone)` — 인라인 톤 안내 박스 (호출부 교체는 라운드 8+)
- 호출부 교체 (계획된 저위험 2곳, admin-cards): 상세 빈 상태(`adminCardEmptyDetailHtml`) → `EmptyState(…, {variant:'detail-lg'})`, 목록 빈 상태(`renderAdminCardList`) → `EmptyState(…, {variant:'inline'})`. 출력 HTML 동일.
- `index.html` — status.ui.js 다음에 metric.ui.js 스크립트 태그 추가.
- 검증: 수정/신규 파일 `node --check` OK, `check:js` 통과, `static:validate-lifecycle` 통과, `smoke` 통과 (12 라우트, Runtime QA 20/20).
- KPI/진행률 호출부는 이미 래퍼 경유로 전부 팩토리를 타므로 별도 교체 불필요 — 명시적 교체는 화면 마이그레이션 라운드(7~10)에서.

### 라운드 5 — ModuleCardListItem 팩토리 + admin 목록 교체 (2026-07-03 완료)

- 신설: `app/ui/components/module-card.ui.js` — `ModuleCardListItem(card, opts)` 단일 팩토리. 4벌 중복의 차이를 옵션으로 흡수:
  - `tone`(admin의 overdue 판정 주입), `tag`(button/article), `interactive`(client 타임라인의 role/tabindex/focus), `dataAttr`, `selected`, `metaParts`, `truncateFooterLeft`
  - 클래스 목록은 조합별 완성형 리터럴 (purge 안전)
- 교체: `adminCardListItemHtml`을 팩토리 어댑터로 재작성 — overdue tone 판정(화면 로직)은 화면에 남기고 마크업 생성만 팩토리로 이동. admin 목록만 교체 (worker/client/moduleCard 3벌은 라운드 8~9에서).
- `index.html` — metric.ui.js 다음에 module-card.ui.js 태그 추가.
- 검증:
  - **바이트 동일성 검증 (신규)**: vm 기반 비교 스크립트로 시드 카드 12장 × 선택/비선택 = 24개 렌더에서 레거시 렌더러와 팩토리 출력이 완전 일치함을 확인
  - `node --check` OK, `check:js` 통과, `static:validate-lifecycle` 통과, `smoke` 통과 (12 라우트, Runtime QA 20/20)

### 라운드 6 — detail.ui.js 프리미티브 + admin 상세 교체 (2026-07-03 완료)

- 신설: `app/ui/components/detail.ui.js` — 상세 패널 프리미티브 8종:
  - `DetailHeader`, `MetaGrid`(mt-5/mb-5 변형), `QcList`(읽기전용/editable + checkedLabel 옵션), `WorkLogList`, `AttachmentList`, `CommentList`(dateRank 정렬 포함), `DetailSection`(헤더 액션 옵션), `ActionToolbar`(wrap/stack 레이아웃 × default/warn/primary 변형 — worker/client용 stack 클래스도 완성형 리터럴로 선(先)정의)
- 교체: admin 상세 헬퍼 9개 중 8개를 어댑터로 전환 (`adminCardRecipeHtml`은 admin 전용이라 화면에 유지, `adminCardMetaTileHtml`은 MetaGrid로 흡수). 이벤트 바인딩(`bindAdminCardActions`)은 계획대로 화면에 잔류.
- **P2-1 mojibake 수정 완료**: admin 상세 헤더의 깨진 구분자 `?`가 DetailHeader 경유로 `·`가 됨 — 이번 라운드의 유일한 의도적 시각 변경.
- `index.html` — module-card.ui.js 다음에 detail.ui.js 태그 추가.
- 검증:
  - **정규화 동등성 검증 (신규)**: vm 비교 스크립트로 시드 카드 12장의 레거시 상세 HTML(템플릿 리터럴)과 신규 출력이 공백 정규화 후 완전 일치함을 확인 (유일한 차이 = 의도된 `?`→`·`)
  - `node --check` OK, `check:js` 통과, `static:validate-lifecycle` 통과, `smoke` 통과 (12 라우트, Runtime QA 20/20)

### 라운드 7 — admin 레거시 제거 + 팬아웃 단순화 + F1 딥링크 (2026-07-03 완료)

- **레거시 제거**: "정의 후 재정의" 패턴의 죽은 구버전 3개 삭제 — `adminAfterCardMutation`, `bindAdminCardActions`, `submitAdminBulkCreate`(+ 전용 헬퍼 `adminNextModuleCardId`, 서비스와 중복이던 P3-6 해소). 재정의부는 정식 함수 선언으로 승격. `submitAdminBulkCreate`의 비-lifecycle fallback 분기도 제거 — 이제 카드 생성/변이는 lifecycle 서비스 단일 경로.
- **P2-5 팬아웃 단순화**: `adminAfterCardMutation`이 9개 renderer 전체 호출 대신 현재 라우트만 재렌더 (`renderModuleRouteScreens(현재 라우트)`). 다른 화면은 라우터가 진입 시마다 재렌더하므로 동작 동일.
- **F1 필터 딥링크**: `#admin-cards?filter=overdue|review|…` 지원 — worker와 동일한 routeKey 패턴(`syncAdminCardRouteState`). admin 홈 액션 카드("마감 초과"→`?filter=overdue`, "리뷰 3일+ 적체"→`?filter=review`)가 필터를 물고 이동.
- 검증: `node --check` OK, `check:js` 통과, `static:validate-lifecycle` 통과, `smoke:lifecycle` 통과 (12 라우트, Runtime QA 20/20, lifecycle persistence QA 포함). 재정의 패턴 잔존 0건 grep 확인.

### 라운드 8 — worker 마이그레이션 + 레거시 제거 (2026-07-03 완료)

- `workerCardSummaryHtml` → `ModuleCardListItem` 어댑터 (동적 dataAttr, chain·spec·gateRef 메타라인).
- `workerDetailHtml` → detail 프리미티브 조합: `EmptyState('detail')`, `QcList({editable:true})`(체크박스 + data-worker-qc-index 유지), `WorkLogList`, `AttachmentList`, `CommentList`, `DetailSection`, `ActionToolbar({layout:'stack'})`. Recipe 박스는 worker 전용이라 화면에 잔류.
- `DetailSection`에 마진 변형 옵션 추가 (`headerMargin:'mb-2'`, `titleMargin:'mb-1'` — worker 실제 마크업 대응, 완성형 리터럴).
- 레거시 제거: 구 `bindWorkerDetailActions`(직접 변이) 삭제, 재정의부를 정식 선언으로 승격.
- `workerAfterCardMutation` 팬아웃 단순화 (admin 라운드 7과 동일 패턴 — 현재 라우트만 재렌더).
- 검증: **바이트 동일성 61개 렌더 통과** (12카드 × summary 4조합 + detail 12 + empty 1), `check:js`/`static:validate-lifecycle`/`smoke:lifecycle` 전부 통과 (12 라우트, Runtime QA 20/20, lifecycle persistence QA).
- F7(오늘 마감 죽은 필터/기준일 통일)은 **사용자 결정 대기**: (a) 기준일을 하나로 통일할지(고정 2026-06-08 vs 실제 오늘), (b) worker-cards에 '오늘 마감' 필터 버튼을 추가할지(가시 UI 추가라 카피/UI 유지 원칙 예외 필요).

### 라운드 9 — client project 마이그레이션 + F7 기준일 통일 (2026-07-03 완료)

- **F7 옵션 2 반영 (사용자 승인)**: `moduleTodayText()`(시드 기준일 2026-06-08) 헬퍼를 workspace.ui.js에 신설하고 `moduleDays`도 이 헬퍼를 쓰도록 통일. worker의 "오늘 마감" KPI와 today 필터 비교 2곳을 `todayDateText()`(실제 오늘) → `moduleTodayText()`로 교체 — admin overdue 판정과 기준일이 일치하게 됨. 실제 타임스탬프(코멘트/작업기록)는 계속 실제 시각 사용.
- `projectModuleCard` → `ModuleCardListItem` 어댑터 (article + interactive 변형 — role/tabindex/focus링 유지).
- `cardDetailBodyHtml`(카드 상세 모달) → 프리미티브 조합: `MetaGrid({margin:'bottom'})`, `QcList({checkedLabel:'✓ 체크'})`, `AttachmentList`, `CommentList`. 모달 전용 헤더(h3/text-[20px]/mb-5)는 화면에 잔류.
- `DetailSection`에 `titleTag:'h4'`, `className` 옵션 추가 (client 모달 섹션 대응).
- 레거시 제거: 구 `openCardDetail`(직접 변이 승인 경로) 삭제, lifecycle 버전을 정식 선언으로 승격.
- 검증: **바이트 동일성 24개 렌더 통과** (12카드 × 카드/모달), `check:js`/`static:validate-lifecycle`/`smoke:lifecycle` 통과 (12 라우트, Runtime QA 20/20, lifecycle persistence QA). ※ smoke 1회 일시 실패(Chrome 기동) 후 재실행 정상 — 코드 요인 아님.

### 라운드 10 — approvals 마이그레이션 + 몽키패치 제거 (2026-07-03 완료)

- `AttachmentList`에 `preview` 옵션 추가 — client `attachmentPreviewHtml`(이미지 인라인/다운로드 행)을 `AttachmentPreviewItem`으로 흡수. `DetailSection`에 `titleMargin:'mb-3'` 변형 추가.
- `approvalDetailHtml`을 프리미티브 조합으로 재작성: `EmptyState('detail-emphasis')`, `DetailHeader`, `MetaGrid`(완료일 타일 포함), preview `AttachmentList`, `QcList('✓ 체크')`, `CommentList`, `ActionToolbar(stack)`.
- **P2-3 몽키패치 제거 완료**: 문자열 치환으로 수정요청 버튼을 끼워 넣던 `ORDO_STATIC_ORIGINAL_APPROVAL_DETAIL_HTML` 블록 삭제 — 수정요청 버튼이 ActionToolbar의 정식 항목이 됨 (마크업 변경 시 조용히 사라지는 실패 모드 소멸).
- 레거시 제거: 구 `renderApprovals`(직접 변이 승인/코멘트) 삭제, lifecycle 버전을 정식 선언으로 승격. `clientAfterCardMutation` 팬아웃 단순화 (admin/worker와 동일 패턴).
- 검증: **바이트 동일성 13개 렌더 통과** (12카드 + 빈 상태, 몽키패치 적용 결과와 비교), `check:js`/`static:validate-lifecycle`/`smoke:lifecycle` 통과 (12 라우트, Runtime QA 20/20, lifecycle persistence QA).
- 이 시점에서 **P2-2(정의 후 재정의 레거시)와 P2-3(몽키패치)이 세 화면 모두에서 소멸**, 변이 경로는 lifecycle 서비스로 단일화, 팬아웃(P2-5)도 세 화면 모두 해소.

### 라운드 11 — Form/Sheet 프리미티브 + bulk create 교체 (2026-07-03 완료)

- 신설: `app/ui/components/form.ui.js` — `FormField`(시트 필드 라벨 패턴), `CheckboxRow`(bulk 모듈 선택 행), `OptionList`(select 옵션 빌더), `ORDO_FORM_CONTROL_CLASSES` 상수.
- 신설: `app/ui/components/sheet.ui.js` — `SheetController(id)` (hidden/aria-hidden 오버레이의 open/close/bindClose 동작 헬퍼). **시트 마크업 셸은 index.html에 정적으로 유지** — "index.html 마크업 본문 불가침" 원칙에 따라 이번 라운드는 JS 생성 부분(모듈 행/옵션)과 동작 제어만 팩토리화.
- 교체: `renderAdminBulkCreate` 한 줄 함수를 CheckboxRow/OptionList 기반의 가독 형태로 재작성, `openAdminBulkCreate`/`closeAdminBulkCreate`가 SheetController 위임.
- `index.html` — form.ui.js, sheet.ui.js 스크립트 태그 추가.
- 검증: **바이트 동일성 통과** (SAMPLE_MODULES 10행 + Worker 옵션), `check:js`/`static:validate-lifecycle`/`smoke:lifecycle` 통과 (12 라우트, Runtime QA 20/20, lifecycle persistence QA).
- prompt() 입력들을 FormField 시트로 바꾸는 작업은 계획대로 이번 라운드에서 하지 않음 (가시 UX 변경 — 별도 승인 필요).

### 라운드 12 — QA 상설화 + 문서 정렬 + 최종 검증 (2026-07-03 완료, 전 라운드 종료)

- 신설: `tools/validate-static-components.cjs` (+ `npm run static:validate-components`) — 라운드별 1회성 diff 테스트를 상설 검증으로 승격:
  1. 네임스페이스 35개 엔트리 존재, 2. 팩토리 19종 출력의 XSS 페이로드 이스케이프, 3. 마커 클래스 보존(badge/metric/progress/card/empty/toolbar), 4. 세 워크스페이스 화면에 인라인 ModuleCard 마크업 0건 + `card.status` 직접 대입 0건 (완료 기준 1·3의 자동 검증).
- `check:js` 확장: 컴포넌트 7파일 + 기존 누락분(main.js, config, layout, session.service, ui, data, repos, auth/report-center/documents 화면, 정적 검증 도구 2종) 전부 포함 — 리뷰 P3-2 해소.
- 문서 정렬 (리뷰 P2-7 해소): `STRUCTURE.md` 파일 트리에 api/·tools/·lifecycle 서비스·components/ 반영 + 소유권 규칙 추가, `README.md`에 컴포넌트 계층·검증 명령 반영.
- 최종 검증 결과:
  - `npm run build` — **재빌드 후 이동 클래스 전부 CSS에 존재 확인** (`min-h-[520px]`, `min-h-[420px]`, `max-h-[240px]` 등, diff는 클래스 2종 추가뿐 제거 0) → purge 안전성 실빌드로 확정
  - `check:js`(확장판) 통과, `static:validate-lifecycle` 통과, `static:validate-components` 통과, `api:validate`(무DB 계약) 통과
  - `smoke:lifecycle` 통과 — 12 라우트, Runtime QA 20/20, lifecycle persistence QA
  - `git diff --check` 통과

## 완료 기준 달성 현황

| 기준 | 상태 |
|---|---|
| 1. 요약 카드/상세 프리미티브 단일 팩토리 생성 | **달성** (예외: `workspace.ui.js` `moduleCard` 1벌 — F2/F3 클릭 기능 결정 대기, 화면 인라인 생성은 0건을 검증기로 강제) |
| 2. 화면 파일에 템플릿 잔존 최소화 + 재정의 레거시 0건 | **달성** (카드 계열 기준. admin home/projects/team의 비-카드 한줄 renderer는 후속) |
| 3. 상태 변이 lifecycle 단일 경로 | **달성** (검증기로 자동 강제) |
| 4. 기존 UI/라우트/QA 유지 | **달성** (smoke 12 라우트 + Runtime QA 20/20 전 라운드 유지, 의도적 변경은 P2-1 `?`→`·` 1글자뿐) |
| 5. 서버 저장/새로고침 복구 유지 | **달성** (lifecycle persistence QA 통과) |
| 6. 문서-구조 일치 | **달성** (STRUCTURE.md/README 갱신) |

## 남은 후속 항목 (라운드 범위 밖)

- **커밋 분리**: 전 라운드 변경이 워크트리에만 있음 — 제출 기준 커밋(Codex) 후 라운드 단위 커밋 필요 (라운드 2 로그 참조)
- F2/F3: dashboard/admin 타임라인 카드 클릭 기능 + `moduleCard` 최종 통합 (사용자 결정)
- F5/F6: 알림 비대칭·하드코딩 배지 (별도 소작업)
- F8: 'done' 라벨('완료'→'승인 대기') 카피 결정
- prompt() 입력의 FormField 시트 전환 (UX 변경 승인 필요)
- 리뷰 P1 계열(API 인증/동시성/오류 노출)은 제출 후 별도 작업

## 11. 리스크와 안전장치

- **가장 큰 리스크는 라운드 5(4벌 통합)**: 4벌의 미세한 차이(태그, data-속성, 메타라인)를 옵션으로 흡수하다 한 화면의 클릭 바인딩이 깨질 수 있음 → 라운드 5에서는 admin만 교체하고 라운드 8~9에서 화면별로 순차 교체하는 이유.
- 몽키패치 제거(라운드 10)를 프리미티브 검증 후로 미룬 이유: 지금 순서를 앞당기면 수정요청 버튼 누락을 눈치채기 어렵다 (조용히 사라지는 실패 모드).
- 구코드 삭제는 항상 "신경로 검증 통과 라운드의 다음 라운드"에서 수행.
- 각 라운드는 독립 커밋으로 남겨 문제 시 라운드 단위 revert.
