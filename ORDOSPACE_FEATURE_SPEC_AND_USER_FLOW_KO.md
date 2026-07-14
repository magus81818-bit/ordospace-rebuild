# ORDOSPACE 기능 명세서 및 유저플로우

작성일: 2026-07-06  
제출 대상: Mission 6 - 기능 명세서 및 유저플로우

## 1. 프로젝트 개요

ORDOSPACE는 클라이언트, 관리자, 작업자가 하나의 프로젝트 작업 단위인 `ModuleCard`를 기준으로 상태를 확인하고 전달하는 멀티 역할 워크스페이스 MVP입니다.

기존 Sprint 5 정적 UI를 유지하면서, 과제 요구사항에 맞춰 React/Vite 기반 MVP 구현 근거와 상태 관리, 라우팅, 저장, 검증 흐름을 GitHub 소스에 포함했습니다. 공개 배포 화면은 완성된 ORDOSPACE UI를 유지하고, React MVP 구현 증거는 저장소의 `react-mvp/` 디렉터리와 검증 스크립트로 확인할 수 있습니다.

## 2. 제출 링크

- GitHub 저장소: https://github.com/magus81818-bit/ordospace-sprint5
- Vercel 배포 URL: https://ordospace-sprint5.vercel.app/

## 3. MVP 핵심 기능 범위

이번 MVP는 전체 서비스를 모두 구현하는 대신, 하나의 `ModuleCard`가 역할 사이를 이동하는 흐름을 중심으로 구현했습니다.

### 기능 1. 로그인 및 역할별 진입

사용자는 로컬 세션을 통해 Admin, Worker, Client 역할로 진입합니다.

- Admin: 프로젝트와 ModuleCard 관리
- Worker: 배정된 작업 카드 진행 및 제출
- Client: 전달된 작업물 확인, 승인, 수정 요청

충족 요구사항:
- 간단한 로그인/로그아웃 흐름
- 역할별 화면 이동
- 세션 상태 유지

### 기능 2. ModuleCard 목록 및 상세 보기

역할별로 필요한 ModuleCard 목록을 확인하고, 상세 화면에서 상태, 담당자, 마감일, 코멘트, 작업 기록을 확인합니다.

충족 요구사항:
- 목록 조회
- 상세 보기
- 역할별 데이터 표시
- 재사용 가능한 카드/상태 UI 구조

### 기능 3. 역할별 상태 변경 플로우

ModuleCard는 아래 순서로 이동합니다.

1. Admin이 ModuleCard를 생성하고 Worker에게 배정
2. Worker가 진행률, QC, 작업 기록, 첨부 정보를 업데이트
3. Worker가 Admin 리뷰를 요청
4. Admin이 검토 후 Client에게 전달
5. Client가 승인하거나 수정 요청

충족 요구사항:
- 사용자 입력 처리
- 상태 변경
- 검증 메시지
- 역할별 주요 기능 흐름

### 기능 4. 저장 및 활동 이력

React MVP는 localStorage 기반으로 세션과 ModuleCard 상태를 저장합니다. 배포된 ORDOSPACE UI는 Vercel Functions와 Postgres API를 통해 ModuleCard 데이터를 저장합니다.

충족 요구사항:
- localStorage 또는 Mock Data 기반 저장
- 새로고침 후 데이터 유지
- 활동 이력 확인
- 백엔드 없이도 프론트엔드 MVP 흐름 검증 가능

## 4. 주요 유저플로우

### Flow A. Admin 생성 및 배정

1. Admin으로 로그인
2. ModuleCard 생성 폼 입력
3. 제목, 설명, 마감일, 담당 Worker 선택
4. 입력값 검증
5. 새 ModuleCard 생성
6. Worker 화면에서 배정 카드 확인 가능

결과:
- 새 작업 단위가 생성되고 담당자에게 연결됩니다.

### Flow B. Worker 작업 업데이트 및 리뷰 요청

1. Worker로 로그인
2. 배정된 ModuleCard 목록 확인
3. 상세 화면 진입
4. 진행률, QC 상태, 작업 기록 입력
5. QC 조건 충족 후 Admin 리뷰 요청
6. 카드 상태가 Admin 검토 단계로 이동

결과:
- 작업자는 실제 작업 진행 상태를 업데이트하고 다음 검토 단계로 넘길 수 있습니다.

### Flow C. Admin 검토 및 Client 전달

1. Admin으로 로그인
2. 리뷰 요청된 ModuleCard 확인
3. 작업 내용 검토
4. Client에게 전달
5. 필요 시 코멘트 추가

결과:
- 검토 완료된 작업물이 Client 승인 단계로 이동합니다.

### Flow D. Client 승인 또는 수정 요청

1. Client로 로그인
2. 승인 대기 ModuleCard 확인
3. 상세 내용 확인
4. 승인 또는 수정 요청 선택
5. 수정 요청 시 사유 입력 필수
6. 승인 시 완료 상태, 수정 요청 시 재작업 상태로 이동

결과:
- 클라이언트가 최종 의사결정을 내릴 수 있습니다.

## 5. 화면 및 라우팅 구조

React MVP는 React Router 기반으로 주요 화면 이동을 구현했습니다.

대표 라우트:
- `#/auth`: 로컬 로그인
- `#/workspace/admin`: Admin 워크스페이스
- `#/workspace/worker`: Worker 워크스페이스
- `#/workspace/client`: Client 워크스페이스
- `#/workspace/{role}/cards/{cardId}`: 역할별 카드 상세

공개 배포 UI는 기존 ORDOSPACE 화면 구조를 유지합니다.

대표 화면:
- Landing
- Auth
- Client Dashboard
- Client Project
- Client Approvals
- Admin Home
- Admin Cards
- Admin Projects
- Admin Team
- Admin Audit
- Worker Home
- Worker Cards

## 6. 데이터 구조

핵심 데이터 단위는 `ModuleCard`입니다.

주요 필드:
- `id`: 카드 ID
- `projectId`: 프로젝트 ID
- `module`: 작업 모듈명
- `title`: 작업 제목
- `status`: 작업 상태
- `assignedTo`: 담당 Worker
- `dueDate`: 마감일
- `progress`: 진행률
- `qcChecklist`: QC 체크리스트
- `comments`: 코멘트
- `attachments`: 산출물/첨부 정보
- `revisionCount`: 수정 요청 횟수

상태 흐름:

```text
pending
-> in_progress
-> review / admin_review
-> client_review
-> approved

수정 요청 시:
client_review -> revision_requested / revision
```

## 7. 요구사항 충족 여부 전수조사

| 과제 요구사항 | 충족 여부 | 구현 근거 |
|---|---:|---|
| MVP 핵심 기능 2~4개 선정 | 충족 | 로그인/역할 진입, 카드 목록/상세, 역할별 상태 변경, 저장/활동 이력 |
| 프론트엔드만으로 동작 가능한 기능 | 충족 | React MVP는 seed data/localStorage 기반으로 검증 가능 |
| React 컴포넌트 구조 | 충족 | `react-mvp/src/`, `react-mvp/src/ui/`, `react-mvp/src/cards/` |
| React Router 사용 | 충족 | `react-mvp/src/router.jsx` |
| React 상태 관리 사용 | 충족 | `useState`, Context 기반 세션/카드 상태 관리 |
| 입력 처리 | 충족 | Admin 생성, Worker 업데이트, Client 수정 요청 입력 |
| 입력 검증 및 오류 메시지 | 충족 | 빈 값, 짧은 제목, 과거 마감일, 수정 사유 누락 검증 |
| 목록/상세 화면 | 충족 | 역할별 ModuleCard 목록 및 상세 라우트 |
| localStorage 또는 Mock Data | 충족 | React MVP 세션/카드 저장소 localStorage 사용 |
| 새로고침 후 데이터 유지 | 충족 | `mvp:validate-persistence`, browser smoke post-refresh 통과 |
| 로그인/로그아웃 | 충족 | seed account 기반 local session |
| 빈 상태/오류/검증 UX | 충족 | Empty state, validation feedback, no-change guard |
| 디자인 일관성 | 충족 | 기존 ORDOSPACE UI 유지, React MVP는 공통 UI primitive 사용 |
| GitHub 최신 소스 제출 | 충족 | `origin/main` 최신 커밋 `b1ee5f9` |
| 배포 URL 정상 접속 | 충족 | `https://ordospace-sprint5.vercel.app/` HTTP 200 |
| 브라우저 테스트 | 충족 | production smoke 12 routes, Runtime QA 20/20 |

## 8. 검증 결과

최종 확인 명령:

```powershell
npm.cmd run mvp:release-check
npm.cmd run smoke -- --url https://ordospace-sprint5.vercel.app/
npm.cmd run check:js
```

검증 결과:
- React MVP release check 통과
- React MVP browser smoke 15 steps 통과
- React MVP 새로고침 후 localStorage 유지 통과
- Production smoke 12 routes 통과
- Runtime QA 20/20 통과
- JavaScript syntax check 통과
- Production `/api/module-cards` 정상 응답

Production API 확인:

```text
GET https://ordospace-sprint5.vercel.app/api/module-cards
```

결과:
- HTTP 200
- `ok:true`
- `source:postgres`
- 카드 수: 12

## 9. 제출 화면에 넣을 내용

### 1번 항목: 기능 명세서 및 유저플로우

이 문서 `ORDOSPACE_FEATURE_SPEC_AND_USER_FLOW_KO.md` 파일을 업로드합니다.

### 2번 항목: GitHub 링크

아래 링크를 입력합니다.

```text
https://github.com/magus81818-bit/ordospace-sprint5
```

## 10. 제출 시 보충 설명

제출 화면에 설명란이 있으면 아래 문구를 함께 입력합니다.

```text
ORDOSPACE는 기존 완성 UI를 유지한 상태로 배포되어 있으며, ModuleCard 흐름은 Vercel Functions + Postgres API로 저장됩니다. React/Vite MVP 구현 근거는 GitHub 저장소의 react-mvp/에 포함되어 있고 npm run mvp:release-check 및 production smoke QA를 통과했습니다.
```

## 11. 주의사항

현재 로컬 작업 폴더에는 제출 완료 이후 생긴 설명 주석/문서 작업이 일부 미커밋 상태로 남아 있습니다. 이 변경은 검증된 GitHub/Vercel 제출본에 포함되지 않았으므로, 지금 제출 전에 추가 커밋하지 않는 것이 안전합니다.

제출 기준은 다음 두 가지입니다.

- 기능 명세서 및 유저플로우: 이 문서 업로드
- GitHub 링크: `https://github.com/magus81818-bit/ordospace-sprint5`
