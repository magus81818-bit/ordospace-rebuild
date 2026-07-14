# ORDOSPACE Harness Engineering 적용 보고서

작성일: 2026-06-15 KST  
대상 프로젝트: ORDOSPACE Sprint 5 정적 프론트엔드  
현재 기준 커밋: `9a1810c Extract shell and workspace UI layers`

## 1. 결론

Harness Engineering은 ORDO에 바로 적용할 수 있다.

다만 핵심은 새 프레임워크를 붙이거나 에이전트 도구를 많이 설치하는 것이 아니다. 현재 ORDO에는 이미 Harness의 씨앗이 있다.

- `README.md`, `STRUCTURE.md`: 에이전트가 읽을 수 있는 구조 설명
- `app/qa/smoke-check.js`: 자동 smoke harness
- `app/qa/runtime-qa.js`: 브라우저 내부 QA helper
- `app/qa/smoke-checklist.md`: 수동/자동 검증 기준
- Obsidian 공유 메모리: 세션 간 상태 전달
- `data`, `repos`, `services`, `screens`, `ui`, `layout`: 책임 경계가 있는 코드 구조

따라서 다음 단계는 "더 많이 만들기"가 아니라 "현재 구조를 Harness로 명명하고, 규칙과 센서를 연결하는 것"이다.

가장 먼저 만들 산출물은 다음 네 가지다.

1. `HARNESS.md`
   - ORDO에서 에이전트가 어떻게 일해야 하는지 정의하는 상위 설계도.
   - 긴 설명서가 아니라, 작업 생명주기, 레이어 규칙, 검증 규칙, 금지 변경, 완료 기준을 적는다.

2. `AGENTS.md`
   - 에이전트가 매번 읽는 짧은 지도.
   - 60~100줄 정도로 유지하고, 깊은 설명은 `HARNESS.md`, `STRUCTURE.md`, `app/qa/`로 연결한다.

3. `app/qa/verification-matrix.md`
   - 변경 유형별로 어떤 검증을 반드시 해야 하는지 표로 만든다.
   - 예: `screens/` 변경 시 route smoke, `repos/` 변경 시 KPI/데이터 화면 확인, `layout/` 변경 시 모바일 드로어와 역할별 셸 확인.

4. `.agents/skills/ordo-sdd/SKILL.md`
   - Codex와 Claude Code가 공통으로 따를 ORDO 전용 작업 절차.
   - 설계, 구현, 검증, 기록, 메모리 업데이트까지 하나의 반복 루프로 만든다.

비유하면 현재 ORDO는 "창고를 부서별 선반으로 나눈 상태"다. Harness는 여기서 한 단계 더 나아가, 물건을 잘못된 선반에 넣으면 바로 알람이 울리고, 출고 전에는 자동 검수대가 통과 여부를 확인하는 물류 시스템이다.

## 2. 이번에 확인한 자료와 ORDO 적용 포인트

### 2.1 OpenAI - Harness Engineering

원문: https://openai.com/index/harness-engineering/

OpenAI 글에서 ORDO가 직접 가져올 부분은 네 가지다.

첫째, 사람의 역할은 코드 작성자가 아니라 환경 설계자와 판정자로 이동한다.

OpenAI 글은 Codex가 코드, 테스트, CI, 문서, 내부 도구, 평가 harness까지 작성하는 상황을 설명한다. 여기서 사람은 목표를 정하고, 작업을 작은 빌딩 블록으로 나누고, 결과를 검증하는 역할을 맡는다.

ORDO 적용:

- 사용자는 "이번에는 `screens/`만", "이번에는 `ui/`만"처럼 방향을 정한다.
- Codex는 파일 이동, 함수 분리, smoke check, 문서 갱신을 수행한다.
- 완료 판정은 "말로 됐다"가 아니라 검증 증거로 한다.

둘째, `AGENTS.md`는 백과사전이 아니라 지도여야 한다.

OpenAI 글은 큰 `AGENTS.md`가 실패하는 이유를 설명한다. 너무 긴 지침 파일은 컨텍스트를 잡아먹고, 오래된 규칙의 무덤이 되고, 무엇이 중요한지 흐리게 만든다. 그래서 짧은 `AGENTS.md`는 목차 역할을 하고, 실제 지식은 구조화된 문서에 둔다.

ORDO 적용:

- `AGENTS.md`에는 다음만 넣는다.
  - 반드시 읽을 파일
  - 레이어별 책임
  - 금지 변경
  - 검증 명령
  - 세션 종료 기록 규칙
- 긴 설명은 `HARNESS.md`, `STRUCTURE.md`, `README.md`, `app/qa/`로 분리한다.

셋째, 에이전트가 읽을 수 없는 지식은 없는 지식이다.

OpenAI 글은 Google Docs, 채팅, 사람 머릿속에 있는 지식은 에이전트 입장에서는 접근 불가능하다고 본다. 에이전트가 추론하려면 repo 안의 Markdown, 코드, 스키마, 실행 계획으로 내려와야 한다.

ORDO 적용:

- "랜딩 문구/CTA/로그인 흐름은 바꾸지 않는다" 같은 규칙은 채팅에만 있으면 안 된다.
- 이 규칙은 `HARNESS.md`, `AGENTS.md`, `README.md`에 모두 짧게 들어가야 한다.
- 화면별 의도와 금지 변경은 `app/screens/README.md` 또는 `app/qa/verification-matrix.md`에 남긴다.

넷째, 아키텍처와 취향은 문서만으로 부족하고 기계적으로 검증해야 한다.

OpenAI 글은 엄격한 레이어, 허용된 의존 방향, 맞춤 lint, 구조 테스트, 품질 규칙을 강조한다. 에이전트는 엄격한 경계와 예측 가능한 구조에서 더 잘 작동한다.

ORDO 적용:

- 현재는 프레임워크가 없는 정적 HTML/JS라서 TypeScript lint 같은 강한 센서가 없다.
- 대신 ORDO용 가벼운 구조 센서를 만들 수 있다.
  - `index.html` script 순서 확인
  - `app/main.js`가 다시 비대해지는지 줄 수 확인
  - `screens/`가 data 배열을 직접 뒤지지 않는지 확인
  - `ui/`가 route/session 업무 로직을 갖지 않는지 확인
  - `repos/`가 DOM을 만지지 않는지 확인
- 이 센서는 나중에 `app/qa/architecture-check.js`로 만들면 된다.

다섯째, 엔트로피와 가비지 컬렉션을 정기 작업으로 봐야 한다.

OpenAI 글은 에이전트가 기존 패턴을 복제하다 보면 나쁜 패턴도 퍼질 수 있다고 본다. 그래서 정기적으로 드리프트를 찾고, 문서와 코드의 불일치를 고치고, 품질 등급을 갱신하는 과정을 둔다.

ORDO 적용:

- 구조 분리 후 끝이 아니다.
- 매 라운드 후 확인할 것:
  - `README.md`와 실제 구조가 맞는가
  - `STRUCTURE.md`와 실제 파일이 맞는가
  - `smoke-check.js`가 현재 핵심 라우트를 덮고 있는가
  - `main.js`가 다시 업무 로직을 빨아들이고 있지 않은가
  - `app/qa/runtime-qa.js`가 너무 오래된 화면 기준을 검사하지 않는가

### 2.2 Addy Osmani - Agent Harness Engineering

원문: https://addyosmani.com/blog/agent-harness-engineering/

Addy 글에서 가져올 핵심은 "Agent = Model + Harness" 관점이다.

여기서 Harness는 모델 주변 전체다.

- prompts
- tools
- context policies
- hooks
- sandboxes
- subagents
- feedback loops
- recovery paths
- memory
- MCP
- filesystem
- git

ORDO 적용:

현재 ORDO의 Harness 구성은 다음처럼 볼 수 있다.

| Harness 구성 요소 | 현재 ORDO의 대응물 | 부족한 점 |
|---|---|---|
| Instructions | README, STRUCTURE, Obsidian memory | `AGENTS.md`, `HARNESS.md`가 없음 |
| State | Obsidian `_CURRENT.md`, `_NEXT.md`, git log | repo 내부 진행 파일은 없음 |
| Verification | `node --check`, `smoke-check.js`, `runtime-qa.js` | 변경 유형별 matrix 없음 |
| Scope | 사용자의 "한 라운드에 한 레이어" 지시 | 기계가 읽는 feature/scope 파일 없음 |
| Lifecycle | AGENTS 시작/종료 프로토콜 | repo 내부 세션 lifecycle 문서 없음 |
| Sandbox | 로컬 브라우저/Chrome smoke | worktree별 앱 부팅은 아직 없음 |
| Observability | 콘솔, DOM, smoke 결과 | 로그/메트릭 스택은 없음 |
| Permissions | 현재 Codex 승인 정책, Git 주의 메모리 | repo 내 push/배포 정책 문서화 부족 |

Addy 글의 가장 중요한 습관은 "실수 하나를 규칙 하나로 승격"하는 것이다.

ORDO 적용 예시:

- 만약 에이전트가 landing CTA를 실수로 바꾸면:
  - `AGENTS.md`에 금지 변경으로 추가
  - smoke check에서 CTA 텍스트를 확인
  - `app/qa/verification-matrix.md`에 landing 변경 시 추가 확인 항목 작성

- 만약 에이전트가 `screens/`에서 데이터를 직접 계산하면:
  - `HARNESS.md`에 "screen은 repo helper를 호출한다" 추가
  - `architecture-check.js` 후보로 등록
  - `app/screens/README.md`에 예시 추가

- 만약 에이전트가 검증 없이 "완료"라고 하면:
  - 완료 기준에 "검증 명령과 결과를 보고해야 완료" 추가
  - 세션 종료 메모리에 검증 명령 필수화

비유하면 Addy의 글은 "실수 노트"를 "공장 규칙"으로 바꾸는 방식이다. 같은 사람이 계속 같은 실수를 하는 것을 야단치는 것이 아니라, 공정 자체를 바꿔서 그 실수가 다음부터 통과하지 못하게 만드는 것이다.

### 2.3 Martin Fowler - Harness Engineering

원문: https://martinfowler.com/articles/harness-engineering.html

Fowler 글은 ORDO에 가장 실용적인 검수 모델을 준다. 핵심은 feedforward guide와 feedback sensor다.

- Feedforward guide: 에이전트가 행동하기 전에 방향을 주는 것
- Feedback sensor: 에이전트가 행동한 뒤 결과를 감지하고 고치게 하는 것

ORDO에 대입하면 다음과 같다.

| 종류 | ORDO 예시 | 목적 |
|---|---|---|
| Feedforward guide | `AGENTS.md` | 시작 시 읽는 짧은 작업 지도 |
| Feedforward guide | `HARNESS.md` | 레이어, 검증, 완료 기준 |
| Feedforward guide | `STRUCTURE.md` | 코드 위치와 책임 경계 |
| Feedforward guide | `app/qa/smoke-checklist.md` | 사람/에이전트가 봐야 할 화면 |
| Feedback sensor | `node --check` | JS 문법 깨짐 감지 |
| Feedback sensor | `node app/qa/smoke-check.js` | 핵심 라우트 렌더 감지 |
| Feedback sensor | `node app/qa/smoke-check.js --url ...` | 배포 화면 회귀 감지 |
| Feedback sensor | `window.ORDO_QA.run()` | 브라우저 내부 QA 감지 |
| Feedback sensor | `git diff --check` | 공백/패치 품질 감지 |
| Human sensor | 사용자 리뷰 | 제품 방향, 문구, 업무 감각 판정 |

Fowler 글은 또 computational control과 inferential control을 나눈다.

- Computational: 빠르고 결정적인 검사
  - syntax check
  - smoke check
  - 구조 검사
  - link/script order 검사
- Inferential: 의미 판단이 필요한 검사
  - "이 화면이 ORDO 업무 흐름에 맞는가"
  - "UI가 너무 마케팅 페이지처럼 보이지 않는가"
  - "클라이언트/관리자/작업자 역할 경계가 자연스러운가"

ORDO는 지금 computational sensor를 먼저 강화해야 한다. 의미 판단은 사용자가 해야 할 부분이 아직 많다.

Fowler 글의 세 가지 harness 분류도 ORDO에 그대로 쓸 수 있다.

1. Maintainability Harness
   - 코드가 관리 가능한가
   - ORDO 적용: 파일 크기, 레이어 경계, 중복 UI helper, `main.js` 재비대화 감시

2. Architecture Fitness Harness
   - 구조가 의도한 방향으로 유지되는가
   - ORDO 적용: `data -> repos -> services -> screens/ui/layout` 책임 분리 유지

3. Behaviour Harness
   - 실제 사용자가 보는 동작이 맞는가
   - ORDO 적용: `/`, `#auth`, `#dashboard`, `#project`, `#approvals`, `#admin-home`, `#worker-home` smoke

비유하면 Fowler식 Harness는 건물의 설계도와 감지기다. 설계도만 있으면 시공자가 틀려도 늦게 발견하고, 감지기만 있으면 매번 경보 후 수습만 한다. 둘이 같이 있어야 한다.

### 2.4 ai-boost/awesome-harness-engineering

원문: https://github.com/ai-boost/awesome-harness-engineering

이 repo는 실행할 도구라기보다 전체 지도다. ORDO는 여기서 카테고리 체계를 가져오면 된다.

참고할 카테고리:

- Planning and Task Decomposition
- Context Delivery and Compaction
- Tool Design
- Skills and MCP
- Permissions and Authorization
- Memory and State
- Task Runners and Orchestration
- Verification and CI Integration
- Observability and Tracing
- Human-in-the-Loop
- Security, Sandbox and Permissions
- Evals and Verification
- Templates

ORDO 적용 방식:

| awesome 카테고리 | ORDO에서 지금 할 일 | 나중에 할 일 |
|---|---|---|
| Planning | `HARNESS.md`에 작업 단위 규칙 작성 | feature list/plan 파일 도입 |
| Context | `AGENTS.md`를 짧은 지도화 | docs index 자동 검사 |
| Tool Design | 기존 smoke script 문서화 | architecture-check script |
| Skills/MCP | ORDO skill 초안 | Obsidian/브라우저/MCP 확장 |
| Permissions | push/배포/큰 변경 규칙 명시 | pre-push hook 또는 CI |
| Memory | Obsidian 프로토콜 유지 | repo 내부 handoff 파일 검토 |
| Verification | `verification-matrix.md` | CI 연결 |
| Observability | smoke output, screenshots | 로그/성능 측정 |
| Human-in-loop | 사용자 판정 지점 명시 | PR review checklist |

중요한 점:

이 목록을 보고 모든 도구를 설치하면 안 된다. 지금 ORDO는 정적 프론트엔드다. 너무 많은 agent framework나 runtime을 붙이면 Harness가 아니라 또 다른 복잡도가 된다.

현재는 taxonomy만 가져오고, 실제 도구 도입은 실패 패턴이 확인된 뒤에 한다.

### 2.5 Picrew/awesome-agent-harness

원문: https://github.com/Picrew/awesome-agent-harness

이 repo는 구현체 중심 목록이다. 2026-06-15 기준 README에 많은 agent harness 구현체와 카테고리가 정리되어 있다. 여기서 ORDO가 얻을 것은 "실제로 어떤 방향의 구현체들이 있는가"다.

참고할 구현체 유형:

- Workflow/skill stack
- Cross-agent skill systems
- Worktree orchestration
- Long-running agent runtime
- MCP-centered frameworks
- Evaluation harnesses
- Observability and reliability operations
- Guardrails/security/governance

ORDO 적용:

현재 ORDO에는 구현체 도입보다 "작은 자체 Harness"가 맞다.

지금 바로 도입하지 말아야 할 것:

- 대형 multi-agent framework
- 별도 runtime server
- 복잡한 worktree orchestrator
- 외부 agent dashboard

지금 참고만 할 것:

- skills를 어떻게 폴더로 나누는지
- quality gate를 어떻게 표현하는지
- worktree/parallel agent를 언제 도입하는지
- 평가와 관측을 어떤 카테고리로 분리하는지

ORDO가 나중에 팀/멀티에이전트 작업으로 커지면 다음 후보를 비교할 수 있다.

- worktree 기반 병렬 작업 도구
- agent skill pack
- MCP registry
- evaluation runner
- trace/observability dashboard

하지만 지금은 `HARNESS.md + AGENTS.md + app/qa`만으로도 충분한 레버리지가 나온다.

### 2.6 walkinglabs/learn-harness-engineering

원문: https://github.com/walkinglabs/learn-harness-engineering

이 자료는 ORDO에 가장 직접적으로 템플릿화할 수 있다. README는 Harness의 다섯 하위 시스템을 설명한다.

- Instructions
- State
- Verification
- Scope
- Session Lifecycle

ORDO 적용:

| 하위 시스템 | ORDO 산출물 |
|---|---|
| Instructions | `AGENTS.md`, `HARNESS.md`, `STRUCTURE.md` |
| State | Obsidian `_CURRENT.md`, `_NEXT.md`, git log |
| Verification | `app/qa/smoke-check.js`, `runtime-qa.js`, `verification-matrix.md` |
| Scope | "한 번에 한 레이어" 규칙, 변경 유형별 완료 기준 |
| Session Lifecycle | 시작 문서 읽기, 작업, 검증, 메모리 업데이트, 세션 노트 |

walkinglabs의 session lifecycle은 ORDO에 거의 그대로 들어맞는다.

ORDO용 세션 생명주기:

1. 시작
   - Obsidian `START_HERE`, `_CURRENT`, `_NEXT` 읽기
   - repo `README`, `STRUCTURE`, `HARNESS`, `AGENTS` 읽기
   - `git status` 확인

2. 범위 선택
   - 이번 작업이 어느 레이어인지 결정
   - 예: `screens`, `ui`, `layout`, `qa`, `docs`
   - 한 번에 두 개 이상 건드리면 사유를 기록

3. 실행
   - 기존 패턴을 읽고 작은 변경
   - 화면/데이터/서비스/레이어 책임을 넘지 않기

4. 검증
   - JS syntax check
   - local smoke
   - deploy smoke가 필요한 경우 Vercel URL smoke
   - 변경 유형별 추가 체크

5. 종료
   - 결과 요약
   - 검증 결과 기록
   - `_CURRENT`, `_NEXT`, session note 업데이트
   - 남은 위험은 `_RISKS`에 기록

비유하면 walkinglabs는 "작업 시작부터 퇴근 인수인계까지의 표준작업절차서"다. ORDO는 이미 Obsidian 메모리와 smoke script가 있으므로 이 절차를 붙이기 좋다.

## 3. 현재 ORDO Harness 성숙도 평가

### 3.1 이미 잘 된 부분

ORDO는 이미 프롬프트만으로 움직이는 프로젝트가 아니다.

잘 된 점:

- 정적 앱 구조가 `app/` 아래로 분리됨
- `main.js`가 4,477줄 수준에서 약 1,540줄로 축소됨
- 주요 화면이 `screens/`로 이동
- 반복 UI가 `ui/`로 이동
- shell 동작이 `layout/`으로 이동
- 데이터가 `data/`, 조회/계산이 `repos/`로 이동
- session/role 동작이 `services/`로 이동
- 자동 smoke check가 있음
- 배포 URL까지 smoke check 가능
- 공유 메모리로 세션 continuity가 유지됨

이것은 이미 "agent-readable workspace" 방향이다.

### 3.2 아직 부족한 부분

부족한 점은 다음이다.

1. Harness의 최상위 문서가 없다.
   - `README`와 `STRUCTURE`는 구조 설명이다.
   - 하지만 "에이전트가 어떤 루프로 일해야 하는가"는 별도 문서가 필요하다.

2. `AGENTS.md`가 없다.
   - 현재 사용자 메시지와 Obsidian 프로토콜이 agent rule 역할을 한다.
   - repo 자체에는 agent entrypoint가 없다.

3. 검증이 변경 유형별로 분기되지 않는다.
   - 지금 smoke check는 훌륭하지만, "어떤 변경이면 어떤 검증"이 표로 고정되어 있지 않다.

4. 구조 drift를 잡는 센서가 없다.
   - 예: `repos/`가 DOM을 만지는지, `screens/`가 직접 데이터 계산을 하는지, `main.js`가 다시 커지는지.

5. "실수 -> 규칙 승격" 프로세스가 없다.
   - 실수를 메모리에 기록하는 것은 하고 있지만, repo 안에서 규칙으로 승격하는 절차가 없다.

## 4. ORDO에 만들 Harness 산출물

### 4.1 `HARNESS.md`

목적:

- ORDO 작업 환경의 헌법.
- 에이전트가 어떤 기준으로 작업하고, 어떤 검증을 통과해야 하며, 어떤 일을 하면 안 되는지 정의한다.

추천 목차:

```md
# ORDOSPACE Harness

## Purpose
- This repo is a static HTML/CSS/JS frontend.
- Preserve current landing copy, CTA, login flow, and deployment behavior.

## Agent Role
- Setup engineer
- Reviewer
- Memory protocol maintainer
- Narrow implementer only when explicitly asked

## Source Of Truth
- README.md
- STRUCTURE.md
- app/qa/smoke-checklist.md
- Obsidian shared memory

## Layer Ownership
- config
- data
- repos
- services
- router
- layout
- screens
- ui
- qa

## Change Rules
- One layer at a time unless justified.
- Do not rewrite the app or migrate framework.
- Do not change landing message, CTA, login flow unless explicitly requested.

## Verification
- node --check for all changed JS
- node app/qa/smoke-check.js
- deployed smoke when release/deploy behavior matters
- git diff --check

## Completion Definition
- Requested work done
- Verification attempted
- Evidence reported
- Shared memory updated
- Remaining risks recorded

## Mistake To Rule
- Every repeated failure becomes a new rule, test, checklist item, or QA sensor.
```

### 4.2 `AGENTS.md`

목적:

- 매 세션 시작 시 에이전트가 읽는 짧은 지도.
- OpenAI 글의 원칙대로 백과사전이 아니라 목차여야 한다.

추천 형태:

```md
# Agent Instructions

Before work:
1. Read HARNESS.md.
2. Read README.md and STRUCTURE.md.
3. Read app/qa/smoke-checklist.md.
4. Check git status.

Project rule:
- Static HTML/CSS/JS only.
- No framework migration unless explicitly requested.
- Preserve landing copy, CTA, login flow, and deployed behavior.

Layer rule:
- data: sample data
- repos: lookup and metrics
- services: session/business helpers
- screens: page rendering
- ui: reusable UI fragments
- layout: shell/sidebar/drawer/topbar
- qa: verification helpers

Verification:
- Run syntax checks for changed JS.
- Run local smoke.
- Run Vercel smoke when deployment matters.
- Report what passed and what was not run.

Shutdown:
- Update Obsidian memory.
- Record remaining blockers.
```

### 4.3 `app/qa/verification-matrix.md`

목적:

- 변경 유형별 검증을 표로 고정한다.
- 에이전트가 임의로 "이 정도면 됨"이라고 판단하지 않게 한다.

추천 내용:

| 변경 위치 | 필수 검증 | 추가 검증 |
|---|---|---|
| `data/` | local smoke | 관련 KPI/화면 텍스트 확인 |
| `repos/` | local smoke, route check | dashboard/project/approvals 데이터 정합성 |
| `services/` | auth/role smoke | client/admin/worker role switch |
| `router/` | all route smoke | guard/alias/fallback 확인 |
| `screens/` | 해당 route smoke | 콘솔 오류, 핵심 selector |
| `ui/` | 사용하는 모든 화면 smoke | 모바일/desktop 화면 확인 |
| `layout/` | role shell smoke | sidebar/drawer/topbar/theme |
| `styles/` | screenshot/manual visual | mobile/desktop layout |
| `index.html` | full local smoke | script order, CDN, deploy smoke |
| `qa/` | smoke self-test | 실패 메시지 품질 확인 |

### 4.4 `.agents/skills/ordo-sdd/SKILL.md`

목적:

- Codex와 Claude Code가 같은 ORDO 작업 절차를 공유한다.
- 사용자가 "ORDO 방식으로 해"라고 하면 이 skill을 읽고 실행한다.

추천 절차:

```md
# ORDO SDD Skill

Use when:
- The user asks for ORDOSPACE work.
- The task changes app structure, QA, docs, or workflow.

Procedure:
1. Read project harness files.
2. Identify the layer affected.
3. Make the smallest useful change.
4. Run the verification matrix for that layer.
5. Report evidence.
6. Update shared memory.

Do not:
- Migrate framework.
- Rewrite unrelated UI.
- Change landing/CTA/login flow without explicit request.
- Mark complete without verification evidence.
```

## 5. ORDO Harness 실행 로드맵

### Phase 1: 문서형 Harness 고정

목표:

- 에이전트가 매번 같은 작업 규칙을 읽게 만든다.

작업:

1. `HARNESS.md` 추가
2. `AGENTS.md` 추가
3. `app/qa/verification-matrix.md` 추가
4. `README.md`에서 세 문서 링크
5. Obsidian `_NEXT.md`에 "Harness 문서 적용 완료" 기록

검증:

- 문서 링크 확인
- git diff 확인
- 코드 변경 없음이므로 smoke는 선택이지만, repo 상태 기준으로 한 번 실행 권장

### Phase 2: 가벼운 구조 센서 추가

목표:

- Fowler식 computational sensor를 늘린다.

후보:

1. `app/qa/architecture-check.js`
   - script 로딩 순서 확인
   - `main.js` 줄 수 임계치 확인
   - `repos/`에서 `document.querySelector` 사용 금지
   - `data/`에서 DOM 접근 금지
   - `ui/`에서 `localStorage` 직접 접근 금지

2. `app/qa/docs-check.js`
   - `STRUCTURE.md`에 적힌 파일이 실제 존재하는지 확인
   - `README.md` 검증 명령이 실제 파일과 맞는지 확인

검증:

```powershell
node app/qa/architecture-check.js
node app/qa/docs-check.js
node app/qa/smoke-check.js
```

### Phase 3: Behaviour Harness 확장

목표:

- smoke check가 단순 렌더 확인에서 주요 업무 흐름 확인으로 확장된다.

후보:

- 로그인 mock 후 role home 이동 확인
- client dashboard KPI selector 확인
- project route에서 step progress 확인
- approvals detail 확인
- admin home KPI 확인
- worker home KPI 확인
- inquiry modal open/close 확인
- mobile drawer open/close 확인

현재 `smoke-check.js`는 이미 주요 라우트 렌더를 확인한다. 다음 확장은 사용자 여정 단위가 좋다.

### Phase 4: 정기 가비지 컬렉션

목표:

- OpenAI 글의 entropy/gc 패턴을 ORDO에 맞게 축소 적용한다.

월 1회 또는 큰 구조 변경 뒤:

- `main.js`가 다시 커졌는지 확인
- README/STRUCTURE와 실제 파일 구조 비교
- smoke coverage가 현재 핵심 화면을 덮는지 확인
- 죽은 route alias와 legacy label 탐지
- runtime QA 항목 중 오래된 항목 정리

## 6. "무엇을 참고해서 진행할지" 자료별 사용법

| 자료 | ORDO에서 참고할 부분 | 바로 적용할 산출물 |
|---|---|---|
| OpenAI | 짧은 `AGENTS.md`, repo knowledge system, agent-readable app, architecture constraints, GC | `AGENTS.md`, `HARNESS.md`, docs index, QA sensor |
| Addy Osmani | Agent = Model + Harness, mistake-to-rule, behavior -> harness mapping | 실패 기록, 규칙 승격 절차, Harness inventory |
| Martin Fowler | feedforward/feedback, computational/inferential, maintainability/architecture/behaviour harness | `verification-matrix.md`, `architecture-check.js`, human review split |
| ai-boost awesome | planning, memory, MCP, permissions, verification, observability taxonomy | ORDO Harness 카테고리 설계 |
| Picrew awesome | 실제 구현체와 도구 지형 | 장기 도구 후보 비교, 지금은 참고만 |
| walkinglabs | instructions/state/verification/scope/lifecycle, session flow | ORDO SDD skill, 세션 생명주기, feature scope 규칙 |

## 7. ORDO에서 피해야 할 과잉 적용

Harness Engineering을 적용한다고 해서 다음을 바로 하면 안 된다.

- React/Vite로 재작성
- 대형 agent framework 도입
- multi-agent orchestration 도입
- 외부 SaaS eval 플랫폼 도입
- 복잡한 CI 구성부터 만들기
- smoke check보다 먼저 추상적인 평가 체계 만들기

현재 ORDO는 정적 프론트엔드이고, 이미 구조 분리가 많이 진행됐다. 따라서 가장 큰 이득은 복잡한 도구가 아니라 "작업 규칙, 검증표, 구조 센서"에서 나온다.

## 8. ORDO용 완료 기준

앞으로 ORDO 작업은 다음 기준을 만족해야 완료로 본다.

1. 요청한 변경이 끝났다.
2. 변경 레이어가 명확하다.
3. 관련 파일 책임을 침범하지 않았다.
4. 검증 명령을 실행했거나, 못 했다면 이유를 기록했다.
5. 화면 동작이 바뀌면 smoke 또는 브라우저 확인을 했다.
6. 문서/메모리와 실제 코드 상태가 맞는다.
7. 남은 위험을 `_RISKS.md` 또는 보고서에 남겼다.

## 9. 바로 다음 실행 제안

우선순위는 다음 순서가 맞다.

1. `HARNESS.md` 작성
2. `AGENTS.md` 작성
3. `app/qa/verification-matrix.md` 작성
4. `README.md`에 Harness 문서 링크 추가
5. `node app/qa/smoke-check.js` 실행
6. 배포 영향이 있으면 `node app/qa/smoke-check.js --url https://ordospace-sprint5.vercel.app/` 실행
7. 공유 메모리 업데이트

이 순서는 코드 동작을 건드리지 않으면서 ORDO의 작업 품질을 바로 올린다.

비유하면 지금 ORDO는 이미 방을 나누고 선반을 만든 상태다. 다음 할 일은 새 물건을 더 들여오는 것이 아니라, 각 선반에 라벨을 붙이고, 잘못 놓인 물건을 자동으로 잡아내는 검수대를 설치하는 것이다.

## 10. 최종 판단

Harness Engineering은 ORDO의 다음 단계에 매우 적합하다.

이유:

- ORDO는 이미 agent-readable 구조로 바뀌고 있다.
- 자동 smoke harness가 이미 있다.
- 공유 메모리 프로토콜이 이미 있다.
- 사용자도 "한 번에 크게 갈아엎지 말고 하나씩"이라는 Harness적 작업 방식을 요구하고 있다.
- 정적 앱이라 강한 타입 시스템은 없지만, 가벼운 구조 센서와 smoke sensor로 충분히 시작할 수 있다.

따라서 ORDO의 Harness 적용은 도구 도입 프로젝트가 아니라 운영 체계 정리 프로젝트로 봐야 한다.

한 줄로 정리하면:

ORDO의 Harness는 "Codex가 더 똑똑해지기를 기다리는 장치"가 아니라, 현재 Codex가 같은 실수를 반복하지 않고 작은 단위로 검증하며 전진하게 만드는 작업 레일이다.

