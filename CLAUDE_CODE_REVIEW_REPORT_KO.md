# ORDOSPACE Sprint 5 코드 리뷰 리포트 (Claude Code)

작성일: 2026-07-03
작성자: Claude Code (Fable 5)
검토 범위: 기존 ORDOSPACE 정적 프로토타입 UI + MVP 기능(서비스/API/DB/검증 스크립트/QA). React MVP(`react-mvp/`)는 참고 자료로만 확인.

---

## 1. 전체 평가 요약

**한 줄 평가: 과제 제출 기준으로는 충분히 안정적입니다. 기능 계층(서비스/API/저장/복구)은 잘 설계되어 있고, 남은 문제는 대부분 "화면 계층의 유지보수성"이며 이는 제출 후 컴포넌트 분리로 해결하면 됩니다.**

검증 실행 결과 (2026-07-03 로컬):

- `npm.cmd run check:js` → **통과** (문법 오류 없음)
- `npm.cmd run static:validate-lifecycle` → **통과** (worker QC gate → PM review → client queue → revision → approval → localStorage hydration 전 구간 OK)

계층별 평가:

| 계층 | 평가 | 근거 |
|---|---|---|
| `app/services/module-card-lifecycle.service.js` | **좋음** | 상태 전이 규칙, 로컬/원격 저장, 디바운스 저장, 정규화가 한 파일에 잘 응집. IIFE로 전역 오염 최소화 |
| `api/` + DB repository | **좋음** | 검증/정규화/트랜잭션/에러 코드 처리 깔끔. 단 인증 부재는 아래 P1 참고 |
| `app/router/`, `app/config/`, `app/layout/` | **양호** | 역할 가드, alias 정규화, 쉘 제어가 명확 |
| `app/qa/` + `tools/` | **좋음** | 실제 브라우저 스모크 + vm 기반 lifecycle 검증 + API 계약 검증까지 갖춤. 커버리지 갭만 있음 |
| `app/screens/` 3개 워크스페이스 | **미흡 (기능은 정상)** | 거대 한 줄 함수, 레거시 함수 재정의 패턴, 4벌 중복 렌더러, 공유 유틸 소유권 오류 |
| `index.html` | **미흡 (범위 외 인지됨)** | 237KB 모놀리스. README에 "HTML partial 추출은 현재 범위 아님"으로 이미 명시됨 |
| 문서 | **대체로 정직** | 과장 없음. 단 `STRUCTURE.md` 파일 트리가 실제와 어긋남 (P2-7) |

---

## 2. 우선순위별 발견 사항

### P0 — 제출 차단급 (코드 결함)

**없음.** 코드 자체에 제출을 차단할 실행 결함은 발견하지 못했습니다.

절차상 유일한 블로커는 이미 문서화된 대로 **GitHub `origin/main` 소스 정렬(커밋/푸시)**이며, 이는 Codex 담당으로 합의된 항목입니다.

### P1 — 제출 리포트에 한계를 명시해야 하는 항목 (제출 후 최우선 보완)

#### P1-1. 인증 없는 공개 PUT + 전체 교체(delete-all-then-insert) 시맨틱

- 파일: `api/module-cards.js:54-59`, `api/_lib/module-card-repository.cjs:89-115`
- 내용: `/api/module-cards`가 인증·권한 검사 없이 PUT을 받고, 저장 방식이 "테이블 전체 삭제 후 재삽입"입니다. URL을 아는 누구나 DB의 카드 전체를 비우거나 임의 데이터로 교체할 수 있습니다.
- 과제 제출 관점: **허용 가능한 범위입니다.** 데모용 공개 프로토타입 + 시드 스크립트(`tools/seed-module-cards-db.cjs`)로 복구 가능하기 때문입니다. 다만 제출 리포트/README에 "데모용으로 인증을 의도적으로 생략했다"는 한 줄을 명시하는 것을 권장합니다 (심사자가 보안 인식 여부를 볼 수 있음).
- 실서비스 확장 시 필요한 것 (우선순위 순):
  1. 요청 헤더 기반 공유 토큰(환경 변수) → 이후 세션/JWT 기반 사용자 인증
  2. 역할별 권한 검사 (client는 승인/코멘트만, worker는 자기 카드만 등) — 현재는 클라이언트 JS의 lifecycle 규칙이 유일한 가드라 API 직접 호출로 우회 가능
  3. 전체 교체 대신 카드 단위 upsert + 낙관적 잠금(updated_at 비교)
  4. 페이로드 크기 제한(현재 `readJsonBody`가 무제한 수신, `api/module-cards.js:24-32`) 및 rate limit

#### P1-2. Last-writer-wins 동시성 — 멀티탭/멀티사용자 시 변경 유실

- 파일: `app/services/module-card-lifecycle.service.js:144-207` (`scheduleRemoteSave`/`saveRemoteNow`)
- 내용: 저장이 항상 "전체 카드 스냅샷 PUT"이므로, 두 브라우저(또는 두 탭)가 동시에 조작하면 나중에 저장한 쪽이 상대의 변경을 통째로 덮어씁니다.
- 과제 제출 관점: 단일 시연자 데모에서는 문제가 없습니다. 단 **시연 중 같은 URL을 여러 탭/기기에서 동시에 조작하지 않도록 주의**하세요 (admin↔worker 역할 전환 시연은 같은 탭에서 역할 전환으로 진행하는 것이 안전).

#### P1-3. API 오류 메시지의 내부 정보 노출

- 파일: `api/module-cards.js:15-22` (`sendError`)
- 내용: postgres 드라이버가 던진 원본 오류 메시지가 그대로 응답 body에 실립니다. 연결 문자열 host명 등 내부 정보가 노출될 수 있습니다.
- 완화: 500 계열은 고정 메시지로 치환하고 원본은 서버 로그에만 남기기. (400/503의 의도된 메시지는 유지)

### P2 — 제출에는 지장 없지만 우선 정리해야 할 항목

#### P2-1. Admin 카드 상세 헤더의 깨진 문자 (눈에 보이는 유일한 UI 버그)

- 파일: `app/screens/admin-workspace.screen.js:670`
- 내용: `${moduleEsc(c.specCode || '-')} ? ${moduleEsc(c.gateRef || '-')}` — 다른 화면(worker/client 상세)은 `·`(가운뎃점)인데 admin만 물음표 `?`로 렌더링됩니다. 인코딩 변환 중 깨진 것으로 보입니다.
- 수정: `?` → `·` 한 글자 교체 (1분 작업, 시각적 위험 없음). 이번 리뷰에서는 수정 금지 지시에 따라 손대지 않았습니다.

#### P2-2. "레거시 함수 정의 후 재정의" 패턴 — 죽은 코드가 파일의 상당 부분

같은 파일 안에서 직접 변이(direct-mutation) 버전을 `function`으로 선언한 뒤, 아래에서 lifecycle 서비스 호출 버전으로 **재할당**하는 패턴이 반복됩니다. 구버전 본문은 실행되지 않는 죽은 코드입니다.

| 파일 | 구버전 (죽은 코드) | 신버전 (실제 동작) |
|---|---|---|
| `admin-workspace.screen.js` | `adminAfterCardMutation` :766 | :769 |
| `admin-workspace.screen.js` | `bindAdminCardActions` :767 | :783 |
| `admin-workspace.screen.js` | `submitAdminBulkCreate` :938 | :939 |
| `worker-workspace.screen.js` | `bindWorkerDetailActions` :272 | :285 |
| `client-workspace.screen.js` | `openCardDetail` :30 | :56 |
| `client-workspace.screen.js` | `renderApprovals` :43 | :108 |

위험: 읽는 사람이 구버전을 고치고 "왜 반영이 안 되지"에 빠지기 쉽습니다. 컴포넌트 분리 계획(라운드 8/10/12)에서 제거하기로 이미 예정된 항목이며, 그 계획이 옳습니다.

#### P2-3. `approvalDetailHtml` 문자열 치환 몽키패치

- 파일: `app/screens/client-workspace.screen.js:100-106`
- 내용: 원본 HTML 문자열에서 `'<button type="button" data-approval-approve='`를 찾아 그 앞에 수정요청 버튼을 끼워 넣습니다. 원본 마크업이 조금만 바뀌어도 **수정요청 버튼이 조용히 사라지고 아무 오류도 나지 않습니다.**
- 수정 방향: 컴포넌트 분리 시 `ActionToolbar` 팩토리에 버튼 목록을 인자로 넘기는 방식으로 대체 (분리 설계 문서 라운드 10).

#### P2-4. "오늘" 기준 3중 불일치

- `adminTodayText()` = `'2026-06-08'` 고정 (`admin-workspace.screen.js:579`)
- `todayDateText()` = 실제 오늘 날짜 (`client-workspace.screen.js:14`)
- `moduleDays()` 기준일 = `'2026-06-08'` 고정 (`app/ui/workspace.ui.js:31`)

결과: admin의 마감초과/D-day 계산은 시드 데이터에 맞게 고정돼 있지만, worker의 "오늘 마감" 필터(`worker-workspace.screen.js:268`)는 실제 날짜 기준이라 시연 날짜에 따라 항상 0건이 됩니다. 데모 일관성을 위해 "기준일" 함수를 하나로 통일하는 것을 권장합니다 (제출 후).

#### P2-5. 변이 후 전 화면 재렌더 팬아웃

- 파일: `admin-workspace.screen.js:769-781`, `worker-workspace.screen.js:274-283`, `client-workspace.screen.js:45-54`
- 내용: 카드 하나 수정할 때마다 admin/worker/client의 8~9개 renderer를 전부 호출합니다. 숨겨진 화면까지 매번 전체 innerHTML 재생성. 데모 규모(카드 12장)에서는 체감 없지만, 구조적으로는 "현재 활성 라우트만 재렌더"(`renderModuleRouteScreens(currentRouteId())` 재사용)로 바꾸는 것이 맞습니다.

#### P2-6. 이스케이프 정책 불일치 + inline onclick 문자열 조립

- ModuleCard 계열(신규 코드)은 `moduleEsc()`를 일관 적용 — 좋습니다.
- 레거시 renderer는 미이스케이프 삽입: `renderIntakeList`(:9-28), `selectIntake`(:44-111), `renderProjectBoard`, `renderPartnerTable`, `renderAuditTimeline` 등. 현재는 정적 시드 데이터만 들어와 실질 XSS 위험은 낮지만, 데이터 출처가 서버로 바뀌는 순간 위험해집니다.
- 특히 `renderPartnerTable`(:298-334)은 `onclick="alert('${p.name}...')"` 식으로 JS를 문자열 조립합니다. 이름에 따옴표가 들어가면 깨지는 구조 (한 곳만 `replace(/'/g,"\\'")` 처리). 컴포넌트 분리 시 data-속성 + addEventListener로 통일 권장.

#### P2-7. 문서-구현 불일치: `STRUCTURE.md` 파일 트리가 낡음

`STRUCTURE.md`의 트리에 다음이 빠져 있습니다 (모두 이번 제출의 핵심 파일):

- `app/services/module-card-lifecycle.service.js` (session.service.js만 있음)
- `api/` 폴더 전체 (module-cards.js, _lib/, _schema/)
- `tools/validate-*.cjs`, `seed-module-cards-db.cjs` (copy-lucide.js만 있음)
- `vercel.json`, `.vercelignore`, `react-mvp/`

그 외 문서는 실제 구현과 잘 맞고 과장된 표현도 없었습니다. 제출 리포트의 체크리스트 표기("GitHub 최신 코드 제출: 남은 작업")도 정직합니다.

#### P2-8. 공유 유틸의 소유권 오류 — 화면 파일 간 숨은 로드 순서 결합

admin/worker 화면이 사용하는 공통 헬퍼가 **client 화면 파일에 정의**돼 있습니다:

- `client-workspace.screen.js`에 정의: `statusBadgeHtml`, `progressTrackHtml`, `safePct`, `todayDateText`, `nowDisplayText`, `dateRank`, `displayDate`, `ORDO_CHAIN_LABELS`, `ORDO_STEP_LABELS`, `ORDO_CLIENT_PROJECT_META`
- `worker-workspace.screen.js`에 정의, admin이 사용: `routeParams` (admin-workspace.screen.js:837에서 호출)

현재는 `index.html:3339-3343`의 스크립트 순서(client → admin → worker) 덕분에 동작하지만, 파일 하나만 순서를 바꾸거나 client 화면을 지우면 admin/worker가 깨집니다. **컴포넌트 분리에서 가장 먼저 해결해야 할 구조 문제**이며, 분리 설계 문서의 라운드 2~3이 이것을 다룹니다.

### P3 — 제출 후 리팩터링으로 넘겨도 되는 항목

1. **한 줄 초장문 함수**: `renderAdminHome`(:598, 약 4,800자 1줄), `renderAdminProjects`(:600), `renderAdminTeamHeatmap`(:610), `renderAdminTeam`(:611), client 화면 22~43행 등. diff/리뷰가 사실상 불가능한 형태. 컴포넌트 분리 라운드에서 자연 해소.
2. **`check:js` 커버리지 갭**: `app/main.js`, `app/config/app.config.js`, `app/layout/app-shell.js`, `app/ui/*.js`, `app/data/*.js`, `app/services/session.service.js`, `app/screens/auth.screen.js`, `report-center.screen.js`, `documents.screen.js`가 문법 체크 목록에 없음.
3. **사이드바/탭바 배지 카운트 하드코딩**: `app.config.js` MENU/MTAB_MENU의 `'3'`, `'2'`, `'5'`가 실데이터와 무관한 고정값. `admin-home` KPI만 실데이터 연동(hash-router.js:237-245).
4. **동적 Tailwind 클래스 조립**: `wkSubStateBadge`의 `bg-st-${tone}bg`(worker-workspace.screen.js:155)는 Tailwind content 스캔에 안 걸립니다. 현재는 같은 클래스가 다른 곳에 정적으로 존재해 빌드에 포함되지만, 정리 과정에서 정적 사용처가 사라지면 스타일이 증발합니다.
5. **beforeunload 원격 저장 보장 없음**: `bindAutoPersist`(:288-300)의 persist → 400ms 디바운스 fetch는 탭 닫힘 시 완료 보장이 없습니다. `fetch(…, {keepalive:true})` 또는 `navigator.sendBeacon` 권장. (로컬 localStorage 저장은 동기라 안전 — 새로고침 데이터 유지 요구사항은 충족됨)
6. **ID 생성 로직 중복**: `adminNextModuleCardId`(admin screen :937)와 서비스의 `nextModuleCardId`(service :556) 동일 로직 2벌.
7. **상태 배지 톤 불일치**: `statusBadgeHtml(status)` 호출 시 tone 생략하면 `moduleTone({status})`로 재계산하는데, dueDate/assignedTo가 빠진 부분 객체라 목록(전체 카드 기준 tone)과 상세(부분 객체 기준 tone)의 배지 색이 다를 수 있음 — 예: pending 카드가 상세 헤더에서 crit 톤.
8. **`ensureSchema`가 매 요청 실행** (repository :80, :98): 데모 트래픽에서는 무해, 실서비스에서는 콜드스타트당 1회로 제한 권장.
9. **prompt()/alert() 기반 입력**: 코멘트/재배정/마감 변경이 브라우저 prompt. 과제 요건(입력/검증)은 충족하나 UX 완성도 낮음. 분리 설계 라운드 11(Form/Sheet)에서 대체.
10. **`vercel.json` `outputDirectory: "."`**: `.vercelignore`가 md/react-mvp 등을 제외하지만 `tools/`, `api/_schema/`, `app/qa/`, `package.json` 등이 정적 파일로 공개 배포됩니다. 비밀값은 없으므로(확인 완료) 위험은 낮으나, 배포 산출물 최소화 관점에서 정리 대상.
11. **`main.js`의 잔여 레거시 훅**: `rewirePmPick`, `wkSubmitConfirm`, `selectWkTask` 훅(:315-363)은 구 화면(intake/제출함) 의존 코드로, 해당 DOM이 없으면 no-op. 삭제 후보이나 스모크로 확인 후 제거.

### 보안·민감정보 점검 결과

- **비밀값 하드코딩 없음**: `tools/`, `api/` 전체에서 DB URL/토큰/비밀번호 하드코딩 검색 → 0건. 모두 `process.env`(POSTGRES_URL 등) 참조.
- `.gitignore`가 `.env*`, `.vercel`을 제외 — 적절.
- `.vercelignore`가 `*.md`, `react-mvp`, `dist-react` 제외 — 적절.
- 남은 보안 이슈는 P1-1(인증 없는 PUT)과 P1-3(오류 메시지)뿐입니다.

---

## 3. 제출 전 반드시 확인할 것 (코드 수정 아님)

1. **GitHub 정렬**: 현재 완료본 커밋/푸시 (Codex 담당, `ORDOSPACE_GITHUB_COMMIT_SEQUENCE_KO.md` 순서대로).
2. **커밋 제외 확인**: `HARNESS_ENGINEERING_REPORT.md`, `.env*`, `.vercel/`, `node_modules/`, 임시 로그.
3. **시연 시 멀티탭 동시 조작 금지** (P1-2).
4. **제출 노트에 한 줄 추가 권장**: "API 인증은 데모 범위로 의도적으로 생략했으며 실서비스 전환 시 토큰/세션 인증과 카드 단위 upsert가 필요함" (P1-1을 인지하고 있음을 보여주는 문장).
5. (선택) P2-1 mojibake 한 글자는 위험이 0에 가까우므로 커밋 전에 고쳐도 무방 — 사용자 승인 시에만.

## 4. 제출 후 리팩터링으로 넘길 것

- P2-2~P2-8 전부, P3 전부.
- 순서는 `CLAUDE_COMPONENT_SPLIT_DESIGN_KO.md`의 라운드 계획을 따르면 P2-2, P2-3, P2-5, P2-6, P2-8, P3-1, P3-6, P3-9가 라운드 진행 중 자연 해소됩니다.

## 5. 테스트/QA 보강 제안

1. **check:js 확장**: 나머지 `app/**/*.js` 전부를 `node --check` 목록에 추가 (혹은 `node --check` 루프 스크립트로 대체).
2. **runtime-qa ROUTE_CASES 확장**: 현재 7개 → `admin-cards`, `admin-projects`, `worker-cards`, `admin-audit` 추가 (smoke-check.js는 이미 12개 라우트를 커버하므로 브라우저 없는 환경용 보강).
3. **컴포넌트 팩토리 정적 검증 추가**: 컴포넌트 분리 시작 시 `tools/validate-static-components.cjs`(vm 기반, validate-static-module-lifecycle.cjs와 같은 방식)를 만들어 각 팩토리가 (a) 이스케이프를 수행하는지 (b) 필수 클래스명을 유지하는지 검증 → 라운드마다 시각 회귀의 1차 방어선.
4. **API 계약 검증에 부정 케이스 추가**: 잘못된 JSON, 중복 id, 필수 필드 누락 페이로드가 400으로 거절되는지 (`tools/validate-module-card-api-contract.cjs` 확장).
5. **멀티탭 시나리오 문서화**: P1-2 특성상 자동화보다 `smoke-checklist.md`에 "동시 편집 시 마지막 저장 우선" 알려진 제약으로 명시.

---

## 6. 결론

- 기능·저장·복구·검증 체계는 과제 제출 기준을 넘는 수준으로 갖춰져 있습니다.
- 코드 품질 문제는 화면 계층에 집중되어 있고, 전부 "동작은 하지만 고치기 어려운" 종류이므로 제출을 미룰 이유가 없습니다.
- 제출 후에는 `CLAUDE_COMPONENT_SPLIT_DESIGN_KO.md`의 라운드 1(베이스라인)부터 진행하세요.
