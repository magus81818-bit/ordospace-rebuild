# ORDOSPACE GitHub 커밋 진행 순서

작성일: 2026-07-03

## 현재 상태 정의

현재 제출 기준 버전은 하나입니다.

> 기존 ORDOSPACE 프로토타입 UI를 최종 화면으로 유지하고, 과제에서 요구한 MVP 기능이 작동하는 현재 완료본

컴포넌트 분리 작업은 별도 후속 작업입니다. 과제 제출용 GitHub 정리와 섞지 않습니다.

## 남은 작업

남은 작업은 두 갈래입니다.

1. GitHub 커밋/푸시
2. 컴포넌트 분리 리팩터링

이번 제출 전에는 1번이 우선입니다.

## 권장 진행 순서

### 1단계 - 제출 기준 상태 고정

목표:

- 지금 완료된 ORDOSPACE MVP 상태를 제출 기준으로 고정합니다.
- 새 UI를 만들거나 별도 React 화면을 메인으로 바꾸지 않습니다.

확인할 것:

- 기존 ORDOSPACE 화면이 정상 접속되는지 확인합니다.
- MVP 기능 검증 명령이 통과하는지 확인합니다.
- 제출과 무관한 파일을 커밋에서 제외합니다.

### 2단계 - 커밋에 포함할 파일 정리

포함할 파일:

- 기존 ORDOSPACE UI 변경 파일
- ModuleCard 기능/상태/저장 관련 파일
- API/DB 연동 파일
- 검증 스크립트
- 과제 제출용 보고서
- 인수인계/컴포넌트 분리 계획 문서

제외할 파일:

- `HARNESS_ENGINEERING_REPORT.md`
- 로컬 환경 파일
- Vercel 비밀값
- `node_modules/`
- `.vercel/`
- 임시 로그/스크린샷

### 3단계 - 최종 검증

커밋 전에 아래 검증을 실행합니다.

```powershell
npm.cmd run mvp:release-check
npm.cmd run check:js
npm.cmd run smoke -- --url https://ordospace-sprint5.vercel.app/
```

통과 기준:

- React/상태/라우팅/로컬 저장소 검증 통과
- 기존 ORDOSPACE production 화면 smoke 통과
- 주요 라우트와 런타임 QA 통과

### 4단계 - GitHub 커밋

커밋 메시지 예시:

```text
Finalize ORDOSPACE MVP submission source
```

이 커밋은 제출 기준 완료본을 GitHub에 올리기 위한 커밋입니다.

### 5단계 - GitHub 푸시

권장:

- 현재 완료본을 `origin/main`에 반영합니다.
- 이렇게 해야 GitHub 제출 링크가 최신 완료본을 가리킵니다.

주의:

- push 후 Vercel 자동 배포가 실행될 수 있습니다.
- 현재 `vercel.json`은 기존 ORDOSPACE UI를 배포하도록 설정되어 있으므로, 별도 React 화면이 메인으로 바뀌는 방향이 아닙니다.

### 6단계 - 푸시 후 확인

확인할 것:

- GitHub public repo에서 최신 커밋이 보이는지 확인합니다.
- Vercel URL이 정상 접속되는지 확인합니다.
- 기존 ORDOSPACE UI가 유지되는지 확인합니다.
- 필요하면 production smoke를 다시 실행합니다.

## 컴포넌트 분리 작업 순서

컴포넌트 분리는 GitHub 제출 기준 커밋 이후에 진행합니다.

권장 순서:

1. 제출 기준 커밋을 먼저 완료합니다.
2. 그 커밋을 기준점으로 새 브랜치를 만듭니다.
3. Fable/Claude에게 `CLAUDE_COMPONENTIZATION_HANDOFF.md`와 `COMPONENTIZATION_REFACTOR_PLAN.md`를 읽힙니다.
4. Fable/Claude는 기존 ORDOSPACE UI를 유지한 상태로 컴포넌트 분리만 진행합니다.
5. 컴포넌트 분리 결과는 별도 검수 후 main에 합칠지 결정합니다.

## 결론

지금 해야 할 일은 새 버전을 고르는 것이 아닙니다.

현재 완료된 ORDOSPACE MVP 상태를 GitHub 제출 소스로 올리는 것입니다.
