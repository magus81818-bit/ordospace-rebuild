# CODE GUIDE 07 — 총정리: 전체 파일 지도와 읽는 순서

> 이 챕터는 프로젝트의 모든 파일을 한눈에 보여주는 **최종 지도**입니다.
> 코드를 처음 보는 사람은 여기서 시작해서 관심 영역의 챕터로 건너뛰세요.

---

## 1. 전체 파일 목록 — 주석화 완료 현황

### 브라우저 앱 (app/)

| 파일 | 한 줄 역할 | 주석 | 가이드 챕터 |
|---|---|---|---|
| `index.html` | 뼈대 HTML + 스크립트 로드 순서표 | R2 ✅ | 01 |
| `app/config/app.config.js` | 역할·화면·메뉴 상수 설정표 | R2 ✅ | 01 |
| `app/services/session.service.js` | 역할 전환 + 세션 관리 | R2 ✅ | 01 |
| `app/layout/app-shell.js` | 사이드바·상단바·알림판 (액자) | R2 ✅ | 01 |
| `app/router/hash-router.js` | 해시 라우팅 (교통정리) | R2 ✅ | 01 |
| `app/main.js` | 잔류 본진 — Room 정규화 + 글로벌 초기화 | R10 ✅ | — |
| `app/data/workspace.data.js` | 시드 데이터 — 카드 12장 + 인물 | R3 ✅ | 02 |
| `app/data/room.data.js` | Room 시드 데이터 — PM·프로젝트·룸 | R3 ✅ | 02 |
| `app/repos/room.repo.js` | Room 읽기 전용 쿼리 헬퍼 | R3 ✅ | 02 |
| `app/ui/components/base.ui.js` | 공용 유틸 (escape, cx, 날짜 등) | R4 ✅ | 03 |
| `app/ui/components/status.ui.js` | 상태 배지 + tone 시스템 | R4 ✅ | 03 |
| `app/ui/components/metric.ui.js` | KPI 카드 + 진행바 + 빈 상태 | R4 ✅ | 03 |
| `app/ui/components/module-card.ui.js` | 모듈 카드 목록 아이템 팩토리 | R5 ✅ | 03 |
| `app/ui/components/detail.ui.js` | 상세 패널 9종 프리미티브 | R5 ✅ | 03 |
| `app/ui/components/form.ui.js` | 폼 필드 + 체크박스 + 옵션 목록 | R5 ✅ | 03 |
| `app/ui/components/sheet.ui.js` | 시트 오버레이 컨트롤러 | R5 ✅ | 03 |
| `app/ui/workspace.ui.js` | ModuleCard 렌더 헬퍼 (레거시 포함) | R10 ✅ | — |
| `app/ui/room.ui.js` | Room UI 부품 도우미 (배지·메트릭·탭) | R10 ✅ | — |
| `app/services/module-card-lifecycle.service.js` | 카드 상태 전이 + 가드 + 저장 | R2 ✅ | 04 |
| `app/screens/admin-workspace.screen.js` | admin 6개 화면 (접수·감독·파트너·배정·감사·일괄생성) | R7 ✅ | — |
| `app/screens/worker-workspace.screen.js` | worker 태스크 보드 + 카드 작업 | R7 ✅ | — |
| `app/screens/client-workspace.screen.js` | client 대시보드·프로젝트·승인 | R7 ✅ | — |
| `app/screens/auth.screen.js` | 로그인 화면 | R7 ✅ | — |
| `app/screens/report-center.screen.js` | 보고서 센터 | R7 ✅ | — |
| `app/screens/documents.screen.js` | 문서 관리 화면 | R7 ✅ | — |
| `app/qa/runtime-qa.js` | 브라우저 런타임 QA | R9 ✅ | 06 |
| `app/qa/smoke-check.js` | Chrome 헤드리스 스모크 테스트 | R9 ✅ | 06 |

### 서버 API (api/)

| 파일 | 한 줄 역할 | 주석 | 가이드 챕터 |
|---|---|---|---|
| `api/module-cards.js` | GET/PUT API 핸들러 (우체국 창구) | R8 ✅ | 05 |
| `api/_lib/module-card-repository.cjs` | DB 읽기/쓰기 + 검증 (금고지기) | R8 ✅ | 05 |

### 도구 스크립트 (tools/)

| 파일 | 한 줄 역할 | 주석 | 가이드 챕터 |
|---|---|---|---|
| `tools/validate-static-module-lifecycle.cjs` | VM 라이프사이클 규칙 검증 | R9 ✅ | 06 |
| `tools/validate-static-components.cjs` | VM 컴포넌트 팩토리 검증 | R9 ✅ | 06 |
| `tools/validate-module-card-api-contract.cjs` | API 계약 검증 (DB 없이) | R10 ✅ | — |
| `tools/validate-module-card-db-connection.cjs` | DB 연결 확인 | R10 ✅ | — |
| `tools/validate-module-card-api-db.cjs` | API+DB 통합 검증 | R10 ✅ | — |
| `tools/seed-module-cards-db.cjs` | 시드 데이터 DB 투입 | R10 ✅ | — |
| `tools/validate-admin-module-card-server-persistence.cjs` | admin 서버 퍼시스턴스 검증 | R10 ✅ | — |
| `tools/validate-worker-module-card-server-persistence.cjs` | worker 서버 퍼시스턴스 검증 | R10 ✅ | — |
| `tools/validate-client-module-card-server-persistence.cjs` | client 서버 퍼시스턴스 검증 | R10 ✅ | — |
| `tools/validate-cross-role-module-card-server-flow.cjs` | 역할 횡단 플로우 검증 | R10 ✅ | — |
| `tools/validate-module-card-refresh-recovery.cjs` | 새로고침 복구 검증 | R10 ✅ | — |
| `tools/copy-lucide.js` | Lucide 아이콘 vendor 복사 | R10 ✅ | — |

### 문서 (docs/)

| 파일 | 한 줄 역할 |
|---|---|
| `docs/CODE_GUIDE_00_시작하기.md` | 전체 지도 + 읽는 법 |
| `docs/CODE_GUIDE_01_앱이_켜질_때.md` | 부팅 스토리 |
| `docs/CODE_GUIDE_02_데이터_사전.md` | ModuleCard 구조 해설 |
| `docs/CODE_GUIDE_03_컴포넌트_사전.md` | 부품 공장 35종 카탈로그 |
| `docs/CODE_GUIDE_04_카드의_일생.md` | 상태 전이 전 과정 |
| `docs/CODE_GUIDE_05_저장의_여정.md` | 이중 저장 아키텍처 |
| `docs/CODE_GUIDE_06_품질을_지키는_법.md` | 검증 스크립트 해설 |
| `docs/CODE_GUIDE_07_총정리.md` | 이 문서 |
| `docs/GLOSSARY.md` | 용어집 |

---

## 2. 추천 읽기 코스 (목적별)

### A. "이 앱이 뭔지 빠르게 파악하고 싶다" (30분)

```
CODE_GUIDE_00 → 01 → 07(이 문서의 §1 표) → 끝
```

### B. "카드 상태가 어떻게 바뀌는지 알고 싶다" (1시간)

```
CODE_GUIDE_00 → 02(데이터 사전) → 04(카드의 일생) → 05(저장의 여정)
```

### C. "화면 UI를 수정해야 한다" (1시간)

```
CODE_GUIDE_03(컴포넌트 사전) → 해당 screen 파일 헤더 읽기
→ components/ 에서 관련 팩토리 찾기
```

### D. "코드를 고치고 테스트하는 법을 알고 싶다" (20분)

```
CODE_GUIDE_06(품질을 지키는 법) → npm run 명령어 실행
```

### E. "전체를 처음부터 끝까지" (3시간)

```
CODE_GUIDE_00 → 01 → 02 → 03 → 04 → 05 → 06 → 07 → GLOSSARY
```

---

## 3. 파일 간 연결 지도 (데이터 흐름)

```text
                    ┌──────────────┐
                    │  index.html  │ ← 모든 것의 시작
                    └──────┬───────┘
                           │ 로드
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
    ┌──────────┐    ┌──────────┐    ┌──────────────┐
    │ config   │    │ data     │    │ services     │
    │ (설정표) │    │ (창고)   │    │ (심판)       │
    └──────────┘    └─────┬────┘    └──────┬───────┘
                          │                │
                          ▼                ▼
                    ┌──────────────────────────┐
                    │  ui/components (부품 공장) │
                    └────────────┬─────────────┘
                                 │ HTML 생성
                                 ▼
                    ┌──────────────────────────┐
                    │  screens (무대)           │
                    │  ┌─admin ┌─worker ┌─client│
                    └──┴───────┴────────┴──────┘
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
              ┌──────────┐ ┌──────────┐ ┌──────────┐
              │localStorage│ │ API 핸들러│ │ 화면 출력 │
              │ (즉시)    │ │ (0.4초)  │ │ (DOM)    │
              └──────────┘ └─────┬────┘ └──────────┘
                                 │
                                 ▼
                          ┌──────────┐
                          │ Postgres │
                          │ DB (금고) │
                          └──────────┘
```

---

## 4. 주석화 라운드 이력

| 라운드 | 주제 | 파일 수 | 가이드 챕터 |
|---|---|---|---|
| R1 | docs 뼈대 + 전체 지도 + 샘플 주석 | — | 00 |
| R2 | 부팅 스토리 (index/config/session/shell/router) | 6 | 01 |
| R3 | 데이터 사전 (workspace/room data + repo) | 3 | 02 |
| R4 | 컴포넌트 기초 (base/status/metric) | 3 | 03 전반 |
| R5 | 컴포넌트 후반 (card/detail/form/sheet) | 4 | 03 후반 |
| R6 | 카드의 일생 (lifecycle 확인) | — | 04 |
| R7 | 화면 파일 헤더 + 섹션 배너 | 6 | — |
| R8 | 저장의 여정 (API + repository) | 2 | 05 |
| R9 | 품질을 지키는 법 (검증/QA 4개) | 4 | 06 |
| R10 | 최종 정리 (나머지 12개 + 총정리) | 12 | 07 |
| **합계** | | **40개 파일 주석화** | **8개 가이드 챕터** |

---

## 5. 용어를 모르겠을 때

→ [GLOSSARY.md](./GLOSSARY.md)를 열어보세요. 챕터별로 정리되어 있습니다.

---

## 6. 이 시리즈를 읽고 답할 수 있어야 하는 최종 질문

1. 카드 상태가 바뀌는 전체 경로를 말할 수 있는가? (5단계 + 옆길 1개)
2. 데이터가 저장되는 두 곳과 각각의 역할은?
3. 새 팩토리를 추가했을 때 해야 할 일 3가지는?
4. 코드를 고친 뒤 돌려야 할 검증 명령 3개는?

<details><summary>정답 확인</summary>

1. `pending → in_progress → review → done → approved` + 옆길 `revision` (수정 요청)
2. localStorage(브라우저 내 즉시 저장, 새로고침 대비) + Postgres DB(서버, 0.4초 디바운스 전송, 영구 보관)
3. ① ORDO_UI_COMPONENTS 네임스페이스에 등록 ② validate-static-components.cjs의 expected 배열에 추가 ③ XSS 테스트 케이스 추가
4. `npm run check:js` (문법) + `npm run static:validate-lifecycle` (규칙) + `npm run static:validate-components` (팩토리)

</details>
