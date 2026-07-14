# ORDOSPACE 코워크 인수인계 문서

작성일: 2026-07-07
작성자: Claude Opus 4.6 → 코워크 세션에게 넘김
목적: R12(Interactive Quiz) 이후 작업을 이어받기 위한 완전한 맥락 전달

---

## 0. 프로젝트 한 줄 요약

ORDOSPACE는 **역할 3개(admin/worker/client)의 협업 워크스페이스** 정적 HTML/JS 프로토타입입니다.
프레임워크 없음, 번들러 없음, 해시 기반 라우팅(`#admin-cards` 등), IIFE 패턴으로 모듈 격리.

---

## 1. 핵심 경로

| 항목 | 경로 |
|---|---|
| **프로젝트 루트** | `C:\Users\Admin\Desktop\K-디지털\수업자료\코덱스\ORDOSPACE_sprint5_landing_work` |
| **앱 소스** | `프로젝트루트/app/` (config, data, domain, layout, repos, router, screens, services, ui, qa) |
| **API 서버** | `프로젝트루트/api/module-cards.js`, `api/_lib/module-card.repository.js` |
| **검증 스크립트** | `프로젝트루트/tools/validate-*.cjs`, `tools/seed-*.cjs`, `tools/copy-lucide.js` |
| **문서 (docs)** | `프로젝트루트/docs/` — CODE_GUIDE 시리즈, GLOSSARY, Geoffrey Litt 산출물 |
| **Geoffrey Litt 원본** | `C:\Users\Admin\Desktop\K-디지털\수업자료\코덱스\geoffrey_litt_x_thread_clean_extract_2026-07-07.html` |
| **기존 인수인계** | `프로젝트루트/CLAUDE_ANNOTATION_HANDOFF_FOR_OPUS.md` (R3~R10 주석화 지시서) |
| **코드 리뷰 리포트** | `프로젝트루트/CLAUDE_CODE_REVIEW_REPORT_KO.md` (Phase A 리팩토링 근거) |
| **컴포넌트 분리 설계서** | `프로젝트루트/CLAUDE_COMPONENT_SPLIT_DESIGN_KO.md` (12라운드 리팩토링 계획) |

---

## 2. 절대 규칙 (사용자 원문 그대로)

1. **"코드 수정, 커밋, 푸시, 배포는 사용자가 별도로 승인하기 전까지 하지 마세요"**
2. **"비밀값, 토큰, DB URL은 문서에 절대 기록하지 마세요"**
3. **"코드 실행에 영향을 주는 변경 절대 금지. 주석과 빈 줄만 추가/수정한다"**
4. **"커밋은 어차피 코덱스한테 시키면 돼... 너는 할 필요없어"**
5. `HARNESS_ENGINEERING_REPORT.md`는 커밋에서 반드시 제외
6. `.env*`, `.vercel/`, `node_modules/`는 커밋에서 제외
7. **PowerShell 사용 필수** — Bash는 한국어 경로(`K-디지털`)에서 인코딩 깨짐

---

## 3. 톤/깊이 스펙

- **대상 독자**: 코드를 처음 보는 비개발자 (프로젝트 오너)
- **언어**: 한국어 100%. 영어 용어는 최초 1회 괄호 병기 후 한국어로
- **비유**: 파일당 1~2개. 예: 심판, 우체국, 부품공장, 교통정리
- **존댓말**: 가이드 챕터에서만. 코드 주석은 반말/서술형
- **분위기**: "옆에서 설명해주는 선배" — 딱딱하지도 유치하지도 않게

---

## 4. 기술 아키텍처 요약

```
index.html (SPA 진입점, 모든 JS를 <script>로 순서대로 로드)
├─ app/config/        상수·역할·화면 목록
├─ app/data/          시연용 샘플 데이터 (카드 12장)
├─ app/services/      lifecycle 서비스 — 카드 상태 전이 규칙 + 저장
├─ app/ui/components/ IIFE 팩토리 35개 → window.ORDO_UI_COMPONENTS 네임스페이스
├─ app/router/        해시 라우터 (hashchange 이벤트)
├─ app/layout/        사이드바·상단바·알림판
├─ app/screens/       역할별 화면 6개
├─ app/qa/            런타임 QA + 스모크 테스트
├─ api/module-cards.js   Vercel serverless (GET/PUT)
└─ tools/validate-*.cjs  검증 스크립트들
```

**카드 상태 전이**: `pending → in_progress → review → done → approved` (+ revision 분기)
**저장**: localStorage(즉시) + Postgres(0.4초 디바운스)

---

## 5. 완료된 작업 전체 이력

### Phase A — 리팩토링 (12라운드)
코드 중복 4x 제거, 컴포넌트 분리, 레거시 정리. 상세: `CLAUDE_COMPONENT_SPLIT_DESIGN_KO.md`

### Phase C — 주석화 (R1~R10)
41개 JS 파일에 한국어 파일 헤더 + 함수 주석 추가, CODE_GUIDE 챕터 00~07 + GLOSSARY 작성.

### Geoffrey Litt 확장 (R11~R13)

| 라운드 | 기법 | 산출물 | 상태 |
|---|---|---|---|
| **R11** | Code Explainer (Literate Diff) | `docs/LITERATE_DIFF_변경_해설서.md` | ✅ 완료 |
| **R12** | Speed Regulator (Interactive Quiz) | `docs/INTERACTIVE_QUIZ.html` | ✅ 완료 — 프리뷰 검증 완료 |
| **R13** | Micro-world (Interactive Sim) | `docs/MICRO_WORLD_카드_시뮬레이터.html` | ✅ 완료 — 프리뷰 검증 완료 |

---

## 6. docs/ 폴더 전체 파일 목록

```
docs/
├── CODE_GUIDE_00_시작하기.md           ← 전체 목차 + 읽기 안내
├── CODE_GUIDE_01_앱이_켜질_때.md       ← 부팅 스토리
├── CODE_GUIDE_02_데이터_사전.md        ← ModuleCard 구조
├── CODE_GUIDE_03_컴포넌트_사전.md      ← UI 부품 35종 카탈로그
├── CODE_GUIDE_04_카드의_일생.md        ← lifecycle 핵심 비즈니스 로직
├── CODE_GUIDE_05_저장의_여정.md        ← 이중 저장 메커니즘
├── CODE_GUIDE_06_품질을_지키는_법.md   ← 검증 스크립트 해설
├── CODE_GUIDE_07_총정리.md             ← 전체 파일 지도 + 읽기 코스
├── GLOSSARY.md                         ← 용어집
├── LITERATE_DIFF_변경_해설서.md        ← R11: 변경 서사 (Phase A/C 역사)
├── INTERACTIVE_QUIZ.html               ← R12: 14문제 퀴즈 (챕터별 2문제)
└── MICRO_WORLD_카드_시뮬레이터.html    ← R13: 카드 lifecycle 인터랙티브 시뮬레이터
```

---

## 7. R12 (Interactive Quiz) 상세

- **파일**: `docs/INTERACTIVE_QUIZ.html` (단일 HTML, 외부 의존성 없음)
- **구조**: 14문제 × 4지선다, 챕터 00~06 각 2문제씩
- **동작**: 클릭 시 즉시 채점 (정답 초록, 오답 빨강 + 정답 표시), 해설 표시, 스티키 점수바, 최종 결과 박스
- **검증 완료**: 정답 클릭 → 점수 증가 + `selected-correct` 클래스, 오답 클릭 → `selected-wrong` + `reveal-correct`
- **스타일링**: CSS 변수 시스템 (`--bg`, `--paper`, `--ink`, `--ok`, `--err` 등), 700px max-width, 프로젝트 톤 일관

### 퀴즈 데이터 구조 (JS 배열)
```js
{ch:"00 시작하기", q:"질문...", opts:["선택1","선택2","선택3","선택4"], ans:1, explain:"해설..."}
```

### 알려진 주의사항
- HTML 내 `<script>` 태그 안에서 `</script>` 문자열을 직접 사용하면 파서가 스크립트를 끊음 → `\x3cscript\x3e` 이스케이프 필요 (이미 적용됨)

---

## 8. R13 (Micro-world 시뮬레이터) 상세

- **파일**: `docs/MICRO_WORLD_카드_시뮬레이터.html` (단일 HTML, 외부 의존성 없음)
- **구조**:
  - 상단: 상태 전이 레일 (pending → in_progress → review → done → approved) 시각 표시
  - 좌: 카드 비주얼 (모듈명, 담당자, 마감일, QC 3항목 체크박스, 첨부 산출물 수, 수정 횟수)
  - 우: 조작 패널 (역할 탭 전환 → 역할별 액션 버튼)
  - 하단: 이벤트 타임라인 (역할별 색상 태그 + 이벤트 설명)
- **구현된 lifecycle 규칙**:
  - QC 체크/작업기록/첨부 → `ensureStarted()` 자동 시작
  - 리뷰 요청: QC 3/3 가드
  - Client 전달: review 상태 가드
  - 승인: done 상태 가드
  - 수정 요청: 사유(note) 필수 가드 + QC 초기화 + revisionCount 증가
- **검증 완료**: 정상 경로(pending→approved), 수정 요청 분기, 가드 차단 메시지 모두 동작 확인
- **스타일링**: R12와 동일한 CSS 변수 시스템, 820px max-width

### 코드 매핑 (실제 코드 함수 → 시뮬레이터 액션)
```
updateQc()            → QC 체크박스 클릭
submitWorkerReview()  → "리뷰 요청" 버튼
sendAdminToClient()   → "Client 전달" 버튼
approveClient()       → "승인" 버튼
requestRevision()     → "수정 요청" 버튼 (사유 입력 필수)
```

---

## 9. Geoffrey Litt 원문 요약 (3가지 기법)

원본: `C:\Users\Admin\Desktop\K-디지털\수업자료\코덱스\geoffrey_litt_x_thread_clean_extract_2026-07-07.html`

1. **Code Explainer Docs (Literate Diff)**: 코드 변경의 "왜"를 서사적으로 설명하는 문서 → R11에서 구현
2. **Interactive Quiz (Speed Regulator)**: 독자가 이해 속도를 스스로 조절하는 퀴즈 → R12에서 구현
3. **Micro-worlds (Interactive Simulation)**: 축소된 시스템을 직접 조작하며 학습 → R13에서 구현

---

## 10. 검증 명령어

```bash
npm run check:js                          # JS 문법 에러 검사
npm run static:validate-lifecycle         # 카드 상태 전이 규칙 검증
npm run static:validate-components        # 컴포넌트 등록·수출 검증
```

프리뷰 서버 (docs/ 정적 서빙):
```bash
npx serve docs -l 3847 --no-clipboard
```

---

## 11. 프로젝트 루트 주요 파일 (node_modules 제외)

```
프로젝트루트/
├── index.html                                  ← SPA 진입점
├── package.json                                ← npm 스크립트 정의
├── vercel.json                                 ← Vercel 배포 설정
├── tailwind.config.cjs                         ← Tailwind 설정
├── vite.config.js                              ← Vite 설정 (react-mvp용)
├── .gitignore / .vercelignore
│
├── CLAUDE_CODE_REVIEW_REPORT_KO.md             ← Phase A 코드 리뷰 리포트
├── CLAUDE_COMPONENT_SPLIT_DESIGN_KO.md         ← Phase A 컴포넌트 분리 설계서
├── CLAUDE_ANNOTATION_HANDOFF_FOR_OPUS.md       ← Phase C R3~R10 인수인계 (이전 세션)
├── CLAUDE_CODE_ANNOTATION_PLAN_KO.md           ← Phase C 전체 계획
├── COWORK_HANDOFF_R12_ONWARDS.md               ← 이 문서 (코워크용 인수인계)
├── HARNESS_ENGINEERING_REPORT.md               ← 엔지니어링 리포트 (커밋 제외!)
│
├── app/                                        ← 앱 소스 전체
├── api/                                        ← Vercel serverless API
├── tools/                                      ← 검증/시드 스크립트
├── docs/                                       ← 가이드 문서 + Geoffrey Litt 산출물
├── dist-react/ / react-mvp/                    ← React MVP (별도, 현재 작업 범위 아님)
└── .vercel/                                    ← Vercel 로컬 설정 (커밋 제외)
```

---

## 12. 코워크에서 이어갈 수 있는 작업 방향

R11~R13까지 Geoffrey Litt의 3가지 기법이 모두 구현 완료되었습니다.
코워크에서 이어갈 수 있는 방향:

### 12-1. R12/R13 품질 개선
- **퀴즈 문제 추가/수정**: 현재 14문제 → 더 난이도 높은 응용 문제 추가 가능
- **시뮬레이터 시나리오 확장**: 일괄 생성, 재할당, 마감일 설정 등 추가 액션
- **반응형/접근성 강화**: 모바일 최적화, 키보드 네비게이션, ARIA 레이블

### 12-2. 새로운 문서 작업
- **아키텍처 다이어그램**: 시각적 SVG 기반 앱 구조도
- **온보딩 체크리스트**: 신규 팀원을 위한 단계별 학습 경로
- **FAQ 확장**: CODE_GUIDE 각 챕터 말미의 FAQ를 독립 문서로

### 12-3. 운영 관련
- **커밋 정리**: 사용자 승인 후 Phase C + Geoffrey Litt 작업물 커밋
- **프리뷰 배포**: docs/ 폴더를 GitHub Pages 등으로 공개

---

## 13. 주석화 규칙 요약 (코드 수정 시 참고)

### 파일 헤더 템플릿
```js
/* ============================================================
   [이 파일은]      한 줄 요약
   [언제 실행]      페이지 로드 시 / 버튼 클릭 시 등
   [주요 등장인물]  핵심 함수·객체 목록
   [연결]          ← 사용처 / → 의존처
   [다음 읽을 파일] 코드 투어의 다음 정거장
   [수정할 때 주의] 건드리기 전에 알아야 할 함정
   ============================================================ */
```

### 밀도 규칙
- 주석이 파일 줄 수의 30%를 초과하지 않는다
- 자명한 코드에 주석 달지 않는다

### GLOSSARY 추가 규칙
- 용어 처음 등장하는 곳에서만 풀어 쓰고, 이후엔 "(용어집 참조)"
- GLOSSARY.md는 챕터별 섹션으로 구분

---

*이 문서를 읽고 나면, docs/ 폴더의 CODE_GUIDE_00~07 + GLOSSARY를 읽어보면 전체 맥락이 완성됩니다.*
*Geoffrey Litt 원본 스레드가 필요하면 위 경로의 HTML 파일을 참조하세요.*
