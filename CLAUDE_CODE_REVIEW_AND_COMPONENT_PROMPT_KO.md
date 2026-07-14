# Claude Code 요청 프롬프트 - ORDOSPACE 코드 점검 및 컴포넌트 분리 설계

아래 내용을 Claude Code 또는 Fable 5에게 그대로 전달하세요.

---

## 요청 목적

ORDOSPACE Sprint 5 제출용 작업물은 현재 기능 구현이 완료된 상태로 보고 있습니다.  
이번 요청은 새 기능 구현이 아니라, 다음 두 가지를 위한 검토와 설계입니다.

1. 지금까지 완료된 작업물 전반의 코드 점검
   - 구조적으로 개선해야 할 부분
   - 코드가 미숙하거나 유지보수에 불리한 부분
   - 전반적으로 더 깔끔한 코드가 되기 위해 필요한 정리 항목

2. 컴포넌트 분리를 위한 설계
   - 기존 UI를 유지하면서 어떤 단위로 컴포넌트를 나눌지
   - 어떤 순서로 분리해야 안전한지
   - 어떤 파일을 먼저 만지고 어떤 파일은 나중에 만져야 하는지

중요: 지금 목적은 구현이 아니라 리뷰와 설계입니다.  
코드 수정, 커밋, 푸시, 배포는 사용자가 별도로 승인하기 전까지 하지 마세요.

---

## 현재 프로젝트 방향

ORDOSPACE의 최종 제출/배포 화면은 기존 완성형 ORDOSPACE 프로토타입 UI입니다.

별도의 React MVP 실험 화면을 메인 화면으로 올리는 것이 목적이 아닙니다.  
React MVP 또는 별도 실험 코드는 참고 자료로만 봐주세요.

현재 목표는 다음과 같습니다.

- 기존 ORDOSPACE 프로토타입 UI 안에서 MVP 기능이 작동하는지 검토
- 현재 코드가 과제 제출 기준에서 충분히 안정적인지 점검
- 이후 유지보수를 위해 컴포넌트 단위로 어떻게 나눌지 설계
- GitHub 커밋/푸시는 Codex가 별도 담당 예정

---

## 프로젝트 루트

```text
C:\Users\Admin\Desktop\K-디지털\수업자료\코덱스\ORDOSPACE_sprint5_landing_work
```

아래 모든 상대 경로는 위 프로젝트 루트 기준입니다.

---

## 먼저 읽어야 할 문서

다음 문서를 먼저 읽고 현재 작업 의도와 제출 기준을 파악해주세요.

```text
C:\Users\Admin\Desktop\K-디지털\수업자료\코덱스\ORDOSPACE_sprint5_landing_work\README.md
C:\Users\Admin\Desktop\K-디지털\수업자료\코덱스\ORDOSPACE_sprint5_landing_work\STRUCTURE.md
C:\Users\Admin\Desktop\K-디지털\수업자료\코덱스\ORDOSPACE_sprint5_landing_work\BUILD.md
C:\Users\Admin\Desktop\K-디지털\수업자료\코덱스\ORDOSPACE_sprint5_landing_work\ORDOSPACE_SUBMISSION_REPORT_KO.md
C:\Users\Admin\Desktop\K-디지털\수업자료\코덱스\ORDOSPACE_sprint5_landing_work\ORDOSPACE_MVP_SUBMISSION_REQUIREMENTS_REPORT.md
C:\Users\Admin\Desktop\K-디지털\수업자료\코덱스\ORDOSPACE_sprint5_landing_work\CLAUDE_COMPONENTIZATION_HANDOFF.md
C:\Users\Admin\Desktop\K-디지털\수업자료\코덱스\ORDOSPACE_sprint5_landing_work\COMPONENTIZATION_REFACTOR_PLAN.md
C:\Users\Admin\Desktop\K-디지털\수업자료\코덱스\ORDOSPACE_sprint5_landing_work\ORDOSPACE_GITHUB_COMMIT_SEQUENCE_KO.md
```

---

## 중점 점검 대상 파일

### 1. 앱 진입점과 라우팅

```text
C:\Users\Admin\Desktop\K-디지털\수업자료\코덱스\ORDOSPACE_sprint5_landing_work\index.html
C:\Users\Admin\Desktop\K-디지털\수업자료\코덱스\ORDOSPACE_sprint5_landing_work\app\main.js
C:\Users\Admin\Desktop\K-디지털\수업자료\코덱스\ORDOSPACE_sprint5_landing_work\app\config\app.config.js
C:\Users\Admin\Desktop\K-디지털\수업자료\코덱스\ORDOSPACE_sprint5_landing_work\app\router\hash-router.js
C:\Users\Admin\Desktop\K-디지털\수업자료\코덱스\ORDOSPACE_sprint5_landing_work\app\layout\app-shell.js
```

### 2. 워크스페이스 화면

```text
C:\Users\Admin\Desktop\K-디지털\수업자료\코덱스\ORDOSPACE_sprint5_landing_work\app\screens\admin-workspace.screen.js
C:\Users\Admin\Desktop\K-디지털\수업자료\코덱스\ORDOSPACE_sprint5_landing_work\app\screens\worker-workspace.screen.js
C:\Users\Admin\Desktop\K-디지털\수업자료\코덱스\ORDOSPACE_sprint5_landing_work\app\screens\client-workspace.screen.js
```

### 3. UI 유틸과 공통 렌더링

```text
C:\Users\Admin\Desktop\K-디지털\수업자료\코덱스\ORDOSPACE_sprint5_landing_work\app\ui\workspace.ui.js
C:\Users\Admin\Desktop\K-디지털\수업자료\코덱스\ORDOSPACE_sprint5_landing_work\app\ui\room.ui.js
```

### 4. MVP 기능 서비스와 서버 API

```text
C:\Users\Admin\Desktop\K-디지털\수업자료\코덱스\ORDOSPACE_sprint5_landing_work\app\services\module-card-lifecycle.service.js
C:\Users\Admin\Desktop\K-디지털\수업자료\코덱스\ORDOSPACE_sprint5_landing_work\api\module-cards.js
C:\Users\Admin\Desktop\K-디지털\수업자료\코덱스\ORDOSPACE_sprint5_landing_work\api\_lib\module-card-repository.cjs
C:\Users\Admin\Desktop\K-디지털\수업자료\코덱스\ORDOSPACE_sprint5_landing_work\api\_schema\module-cards.sql
```

### 5. 검증 스크립트

```text
C:\Users\Admin\Desktop\K-디지털\수업자료\코덱스\ORDOSPACE_sprint5_landing_work\tools\validate-static-module-lifecycle.cjs
C:\Users\Admin\Desktop\K-디지털\수업자료\코덱스\ORDOSPACE_sprint5_landing_work\tools\validate-module-card-api-contract.cjs
C:\Users\Admin\Desktop\K-디지털\수업자료\코덱스\ORDOSPACE_sprint5_landing_work\tools\validate-module-card-api-db.cjs
C:\Users\Admin\Desktop\K-디지털\수업자료\코덱스\ORDOSPACE_sprint5_landing_work\tools\validate-module-card-refresh-recovery.cjs
C:\Users\Admin\Desktop\K-디지털\수업자료\코덱스\ORDOSPACE_sprint5_landing_work\tools\validate-admin-module-card-server-persistence.cjs
C:\Users\Admin\Desktop\K-디지털\수업자료\코덱스\ORDOSPACE_sprint5_landing_work\tools\validate-worker-module-card-server-persistence.cjs
C:\Users\Admin\Desktop\K-디지털\수업자료\코덱스\ORDOSPACE_sprint5_landing_work\tools\validate-client-module-card-server-persistence.cjs
C:\Users\Admin\Desktop\K-디지털\수업자료\코덱스\ORDOSPACE_sprint5_landing_work\tools\validate-cross-role-module-card-server-flow.cjs
C:\Users\Admin\Desktop\K-디지털\수업자료\코덱스\ORDOSPACE_sprint5_landing_work\tools\validate-module-card-db-connection.cjs
C:\Users\Admin\Desktop\K-디지털\수업자료\코덱스\ORDOSPACE_sprint5_landing_work\tools\seed-module-cards-db.cjs
```

### 6. QA 파일

```text
C:\Users\Admin\Desktop\K-디지털\수업자료\코덱스\ORDOSPACE_sprint5_landing_work\app\qa\smoke-check.js
C:\Users\Admin\Desktop\K-디지털\수업자료\코덱스\ORDOSPACE_sprint5_landing_work\app\qa\runtime-qa.js
C:\Users\Admin\Desktop\K-디지털\수업자료\코덱스\ORDOSPACE_sprint5_landing_work\app\qa\smoke-checklist.md
```

### 7. 설정 파일

```text
C:\Users\Admin\Desktop\K-디지털\수업자료\코덱스\ORDOSPACE_sprint5_landing_work\package.json
C:\Users\Admin\Desktop\K-디지털\수업자료\코덱스\ORDOSPACE_sprint5_landing_work\package-lock.json
C:\Users\Admin\Desktop\K-디지털\수업자료\코덱스\ORDOSPACE_sprint5_landing_work\vercel.json
C:\Users\Admin\Desktop\K-디지털\수업자료\코덱스\ORDOSPACE_sprint5_landing_work\.gitignore
C:\Users\Admin\Desktop\K-디지털\수업자료\코덱스\ORDOSPACE_sprint5_landing_work\.vercelignore
```

### 8. 참고만 할 파일

아래는 메인 제출 UI가 아니라 실험/참고 성격의 React MVP 코드입니다.  
필요하면 패턴 참고용으로만 봐주세요. 이 화면을 메인으로 전환하는 제안은 하지 말아주세요.

```text
C:\Users\Admin\Desktop\K-디지털\수업자료\코덱스\ORDOSPACE_sprint5_landing_work\react-mvp\src\ui
C:\Users\Admin\Desktop\K-디지털\수업자료\코덱스\ORDOSPACE_sprint5_landing_work\react-mvp\src\cards
C:\Users\Admin\Desktop\K-디지털\수업자료\코덱스\ORDOSPACE_sprint5_landing_work\react-mvp\src\domain\module-card.model.mjs
C:\Users\Admin\Desktop\K-디지털\수업자료\코덱스\ORDOSPACE_sprint5_landing_work\react-mvp\src\session
```

---

## 리뷰 요청 1 - 전반적인 코드 점검

아래 관점으로 코드 리뷰를 진행해주세요.

### 구조와 책임 분리

- `config / router / services / api / screens / ui / qa` 역할이 실제로 잘 분리되어 있는지
- 화면 파일이 데이터 가공, 서버 통신, DOM 조작을 너무 많이 떠안고 있지는 않은지
- `app/main.js`가 아직도 너무 많은 책임을 갖고 있지는 않은지
- 서버 API와 클라이언트 서비스의 경계가 이해하기 쉬운지

### 유지보수성

- 거대한 템플릿 문자열이 읽기 어렵게 남아 있는 부분
- Tailwind 클래스가 한 줄에 너무 길게 붙어 있는 부분
- 같은 UI 패턴이 여러 화면에 반복되는 부분
- 추후 수정 시 한 곳만 고치면 되는 구조인지, 여러 곳을 동시에 고쳐야 하는 구조인지

### 품질과 안정성

- 새로고침 후 데이터 유지 흐름이 명확한지
- 서버 API 실패 시 fallback 동작이 과제 제출 관점에서 적절한지
- 클라이언트, 워커, 어드민 권한별 상태 변경 흐름이 일관적인지
- QA가 실제 DOM과 실제 사용자 흐름을 제대로 검증하는지

### 보안과 제출 리스크

- 현재 API가 공개 PUT 요청을 받는 구조라면, 과제 제출용 MVP로 허용 가능한 범위인지
- 실제 서비스로 확장하려면 어떤 인증/권한 검사가 추가되어야 하는지
- 환경 변수, DB 연결, Vercel 설정에서 민감 정보 노출 위험이 없는지

### 문서와 구현 일치

- README, 제출 리포트, 구조 문서가 실제 구현과 맞는지
- 문서에서 과장되거나 현재 코드와 어긋나는 표현이 있는지
- 제출 전에 삭제하거나 제외해야 할 문서/실험 코드가 있는지

---

## 리뷰 요청 2 - 컴포넌트 분리 설계

기존 UI를 유지하면서, 다음 단위로 분리하는 설계를 제안해주세요.

### 우선 후보 컴포넌트

- 상태 배지
- 우선순위 배지
- 메트릭 카드
- 진행률 바
- 모듈 카드 리스트 아이템
- 모듈 카드 상세 패널
- 메타 정보 그리드
- 코멘트 리스트
- 첨부 파일 리스트
- 액션 버튼 그룹
- 폼 필드
- 빈 상태 화면
- 로딩/오류 상태
- 토스트 또는 알림 메시지

### 제안할 파일 구조 예시

아래 구조가 적절한지 검토하고, 더 나은 구조가 있다면 제안해주세요.

```text
app/
  ui/
    components/
      badge.ui.js
      button.ui.js
      metric-card.ui.js
      progress.ui.js
      empty-state.ui.js
      module-card.ui.js
      module-card-detail.ui.js
      form-field.ui.js
      notice.ui.js
    workspace.ui.js
    room.ui.js
  screens/
    admin-workspace.screen.js
    worker-workspace.screen.js
    client-workspace.screen.js
```

### 설계 시 지켜야 할 원칙

- 기존 화면의 시각적 결과를 유지
- 한 번에 큰 파일을 갈아엎지 말고 작은 절개 방식으로 진행
- 각 라운드마다 검증 가능한 단위로 나누기
- 먼저 반복이 많은 작은 UI부터 분리
- 화면별 비즈니스 흐름은 나중에 분리
- 서버 API나 DB 구조는 컴포넌트 분리와 직접 관련이 없으면 건드리지 않기

---

## 원하는 결과물

가능하면 다음 두 문서로 결과를 작성해주세요.

```text
C:\Users\Admin\Desktop\K-디지털\수업자료\코덱스\ORDOSPACE_sprint5_landing_work\CLAUDE_CODE_REVIEW_REPORT_KO.md
C:\Users\Admin\Desktop\K-디지털\수업자료\코덱스\ORDOSPACE_sprint5_landing_work\CLAUDE_COMPONENT_SPLIT_DESIGN_KO.md
```

### `CLAUDE_CODE_REVIEW_REPORT_KO.md`에 포함할 내용

- 전체 평가 요약
- P0/P1/P2/P3 우선순위별 발견 사항
- 각 발견 사항의 파일 경로와 가능하면 라인 번호
- 제출 전 반드시 고쳐야 할 항목
- 제출 후 리팩터링으로 넘겨도 되는 항목
- 테스트/QA 보강 제안

### `CLAUDE_COMPONENT_SPLIT_DESIGN_KO.md`에 포함할 내용

- 컴포넌트 분리 목표
- 추천 컴포넌트 목록
- 추천 파일 구조
- 10~16라운드 정도의 안전한 분리 순서
- 각 라운드별 작업 범위와 검증 방법
- 처음 만져야 할 파일과 마지막에 만져야 할 파일
- 건드리지 말아야 할 파일
- 완료 기준

---

## 검증 명령 후보

검토 후 필요하면 아래 명령으로 현재 상태를 확인해주세요.

```powershell
npm.cmd run check:js
npm.cmd run static:validate-lifecycle
npm.cmd run mvp:release-check
npm.cmd run smoke -- --url https://ordospace-sprint5.vercel.app/
```

주의: Vercel/DB 관련 검증은 환경 변수와 권한이 필요할 수 있습니다.  
비밀값, 토큰, DB URL은 문서에 절대 기록하지 마세요.

---

## 작업 제한

이번 요청에서는 아래 작업을 하지 마세요.

- 코드 수정
- 파일 삭제
- 대규모 리팩터링
- `git add`, `git commit`, `git push`
- Vercel 배포
- 별도 React MVP 화면을 메인 UI로 제안
- 비밀값 확인 또는 출력

이번 요청의 핵심은 "현재 완성된 ORDOSPACE 코드의 품질 점검"과 "컴포넌트 분리 설계"입니다.

---

## 최종 답변 형식

작업 후에는 다음 순서로 보고해주세요.

1. 현재 코드 상태에 대한 한줄 평가
2. 제출 전 꼭 확인해야 할 위험 요소
3. 컴포넌트 분리의 추천 시작점
4. 몇 라운드로 나누는 것이 적절한지
5. 생성한 문서 경로

