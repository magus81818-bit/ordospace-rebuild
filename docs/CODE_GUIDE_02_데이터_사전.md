# CODE GUIDE 02 — 데이터 사전: 화면에 보이는 모든 것의 원천

> 화면에 나타나는 카드·프로젝트·사람·알림은 전부 어딘가에 "원본"이 있습니다.
> 이 챕터에서는 그 원본의 모양새와 위치를 알아봅니다.
> 등장 파일: `app/data/workspace.data.js`, `app/data/room.data.js`, `app/repos/room.repo.js`

---

## 1. 큰 그림: 두 개의 창고

```text
 app/data/workspace.data.js ─── "큰 창고"
   │  · ORDO_MODULE_CARDS (카드 12장) ← 핵심!
   │  · REPORT_DATA, CHANGE_DATA, DOC_DATA (클라이언트 승인함·문서함)
   │  · INTAKE_DATA, PROJECT_DATA (admin 의뢰·프로젝트)
   │  · PARTNER_DATA, WORKERS, HEATMAP_DATA (admin 인력)
   │  · WK_TASK_DATA, WK_SUB_DATA (worker 작업·제출)
   │  · AUDIT_DATA (admin 감사 로그)
   │
 app/data/room.data.js ─── "작은 창고"
   │  · ORDO_ROOM_DATA (클라이언트 대시보드용 프로젝트·조치·리포트·PM·제안·이벤트)
   │  · ORDO_PRIORITY_META (P1~P4 표시 규칙)
   │
 app/repos/room.repo.js ─── "사서"
      · 작은 창고 데이터를 검색·집계·정렬하는 함수 모음
```

핵심 개념 하나: **이 앱에서 "데이터베이스"는 전역 변수입니다.** `window.ORDO_MODULE_CARDS`라는 배열 하나가 모든 카드의 단일 원천(single source of truth)이고, 화면 3개(admin/worker/client)가 전부 이 하나를 읽습니다.

---

## 2. ModuleCard 한 장의 생김새 — 이 앱의 핵심 데이터

`window.ORDO_MODULE_CARDS[0]`을 열면 아래 필드가 있습니다:

| 필드 | 뜻 | 예시값 | 누가 바꾸는가 |
|---|---|---|---|
| `id` | 카드 고유 번호 | `'mc-001'` | 시스템(생성 시 자동) |
| `projectId` | 소속 프로젝트 | `'proj-001'` | admin(생성 시 지정) |
| `spec` | 스펙 이름 (대분류) | `'Auth'` | admin |
| `specCode` | 스펙 코드 | `'dev.auth'` | admin |
| `dial` | 다이얼 (세부 구분) | `'인증 방식'` | admin |
| `module` | 모듈명 (카드 제목) | `'이메일+비밀번호'` | admin |
| `chain` | 체인 (dev/design/ops) | `'dev'` | admin |
| `step` | 단계 번호 | `3` | admin |
| `gateRef` | 검수 기준 이름 | `'Build Complete'` | admin |
| **`status`** | **현재 상태** | `'approved'` | **lifecycle 심판만** |
| `assignedTo` | 배정된 작업자 ID | `'worker-001'` | admin |
| `assignedBy` | 배정한 관리자 ID | `'admin-001'` | admin |
| `mhEstimate` | 예상 공수 (시간) | `'32~40'` | admin |
| `mhActual` | 실제 투입 공수 | `28` | worker(작업 기록) |
| `createdAt` | 생성일 | `'2026-06-01'` | 시스템 |
| `startedAt` | 작업 시작일 | `'2026-06-02'` | lifecycle |
| `dueDate` | 마감일 | `'2026-06-05'` | admin |
| `completedAt` | 완료일 | `'2026-06-04'` | lifecycle |
| `approvedAt` | 승인일 | `'2026-06-05'` | lifecycle |
| `attachments` | 첨부 파일 목록 | `[{name, url, size, date}]` | worker |
| `comments` | 코멘트 목록 | `[{role, author, text, date}]` | admin/worker |
| **`qcChecklist`** | **QC 체크리스트** | `[{label, passed}]` | worker(체크) / admin(확인) |

**가장 중요한 필드 2개:**
- `status` — 카드의 일생을 결정합니다. 값은 `pending` → `in_progress` → `review` → `done` → `approved` (또는 `revision`). **화면이 직접 바꾸면 안 되고, lifecycle 서비스만 바꿀 수 있습니다.**
- `qcChecklist` — worker가 전부 `passed: true`로 만들어야 리뷰 요청이 가능합니다.

---

## 3. 창고의 다른 주민들

### 클라이언트 화면용 데이터

| 변수 | 화면 | 한 줄 설명 |
|---|---|---|
| `REPORT_DATA` | 승인함 | 승인 요청·주간 리포트. `type`: approval / report / info |
| `CHANGE_DATA` | 승인함(이슈·변경) | 이슈(`kind:'issue'`) 또는 변경 요청(`kind:'change'`) |
| `DOC_DATA` | 문서함 | 파일 목록 + 버전 이력 |
| `ORDO_ROOM_DATA` | 대시보드/프로젝트 | 프로젝트 5건 + 대기 조치 + 리포트 + PM + 제안 + 이벤트 |

### Admin 화면용 데이터

| 변수 | 화면 | 한 줄 설명 |
|---|---|---|
| `INTAKE_DATA` | admin-home | 외부 의뢰 접수 큐 (6건) |
| `ADM_APPR_DATA` | admin-home | 관리자 승인/SLA 큐 |
| `PROJECT_DATA` | admin-projects | 전체 프로젝트 파이프라인 (20건, 5단계) |
| `PARTNER_DATA` | admin-team | 파트너 인력풀 (active/pending/leave/blacklist) |
| `HEATMAP_DATA` | admin-team | 주간 과배정 히트맵 [시간, 프로젝트] × 5일 |
| `AUDIT_DATA` | admin-audit | 감사 로그 타임라인 |

### Worker 화면용 데이터

| 변수 | 화면 | 한 줄 설명 |
|---|---|---|
| `WK_TASK_DATA` | worker-cards | "내 작업" 목록 (Todo/Doing/Review/Blocked/Done) |
| `WK_SUB_DATA` | worker-cards | "제출함" 목록 (submitting/reviewing/approved/rejected) |

---

## 4. room.repo.js — 데이터를 물어보는 방법

화면이 데이터를 직접 `for`문으로 뒤지지 않고, `room.repo.js`의 함수를 통해 물어봅니다:

```text
화면: "대기 조치 중 긴급한 거 3개만 줘"
  → getDashboardPendingActionCards(3)
  → 내부에서: 필터(미완료+미정보) → 정렬(P1>P2>P3>P4, 긴급>경고>대기) → 상위 3건
```

주요 함수:
- `getProjectRoomMetrics()` — 총 프로젝트 수, 활성 수, P1 수 등 요약 숫자
- `getActionRoomMetrics()` — 대기 조치 수, 승인 대기 수, 오래된 건 수
- `formatRelativeKo(date)` — `'4월 18일'` → `'9일 전 요청'` 변환
- `ORDO_DEMO_NOW` — 시연 기준 시각 (2026-04-28 12:00). 이 시각 기준으로 "몇 시간 전"을 계산.

---

## 5. "전역 변수가 데이터베이스" — 왜 이렇게 되어 있나?

이 앱은 **서버 없이도 동작하는 프로토타입**이기 때문입니다:
1. 데이터를 전역 변수(`window.ORDO_MODULE_CARDS`)에 넣고
2. lifecycle 서비스가 변경할 때마다 localStorage에 즉시 저장
3. 서버가 있으면 추가로 0.4초 뒤 서버에 전송

새로고침하면? → lifecycle의 `hydrate`가 localStorage에서 복원합니다.
서버가 있으면? → `hydrateRemote`가 서버 데이터와 비교해서 더 최신 것을 채택합니다.

---

## 6. 자주 하는 질문

**Q. 시드 데이터 12장 말고 진짜 데이터는 어디에?**
localStorage와 서버 DB에 있습니다. 이 파일의 12장은 "처음 열었을 때 빈 화면이 안 보이게" 하는 샘플입니다. lifecycle이 hydrate할 때 localStorage 버전으로 덮어씁니다.

**Q. 카드를 추가하면 이 파일이 바뀌나요?**
아닙니다. 새 카드는 lifecycle 서비스가 배열에 push하고 localStorage+서버에 저장합니다. 이 파일은 "초기값"일 뿐입니다.

**Q. ORDO_ROOM_DATA와 ORDO_MODULE_CARDS는 무슨 관계?**
별개입니다. MODULE_CARDS는 작업 카드(3역할 공유), ROOM_DATA는 클라이언트 대시보드용 프로젝트·조치 데이터입니다. 이름이 비슷하지만 용도가 다릅니다.

---

## 7. 5분 따라하기

1. 브라우저에서 `index.html`을 열고 F12 → Console 탭.
2. 카드 한 장 열어보기:
   ```js
   window.ORDO_MODULE_CARDS[0]
   ```
   → 필드 목록이 위 표와 일치하는지 확인.

3. QC 체크리스트 확인:
   ```js
   window.ORDO_MODULE_CARDS[0].qcChecklist
   ```
   → `[{label:'회원가입 유효성', passed:true}, ...]` — 전부 true면 리뷰 가능.

4. 직접 status를 바꿔보기 (이렇게 하면 **안 되는** 예시):
   ```js
   window.ORDO_MODULE_CARDS[0].status = 'pending'
   // 화면이 바뀌지 않고, localStorage에도 안 저장됨!
   // → lifecycle 서비스를 거쳐야만 제대로 작동합니다 (챕터 04에서)
   ```

5. room.repo 함수 사용:
   ```js
   window.ORDO_ROOM_REPO.getProjectRoomMetrics()
   ```
   → `{totalProjects: 5, activeProjects: 4, ...}` — 대시보드 숫자의 원천.

---

## 8. 이 챕터를 읽고 답할 수 있어야 하는 질문

1. 카드의 status를 화면에서 직접 바꾸면 안 되는 이유는? 그러면 어떻게 바꿔야 하나?
2. worker가 리뷰 요청을 하려면 카드의 어떤 필드가 어떤 상태여야 하는가?
3. `ORDO_MODULE_CARDS` 배열과 `ORDO_ROOM_DATA.projects` 배열은 같은 데이터인가, 다른 데이터인가?

<details><summary>정답 확인</summary>

1. 직접 바꾸면 localStorage 저장도 안 되고, 화면 갱신도 안 되고, 규칙 검사도 건너뛰게 됨. 반드시 `module-card-lifecycle.service.js`의 함수(submitWorkerReview, sendAdminToClient 등)를 통해 바꿔야 함.
2. `qcChecklist`의 모든 항목이 `passed: true`여야 함. 하나라도 false면 lifecycle이 거부.
3. 다른 데이터. MODULE_CARDS는 3역할이 공유하는 작업 카드, ROOM_DATA.projects는 클라이언트 대시보드에만 쓰이는 프로젝트 요약 정보.

</details>

**다음 챕터** → `CODE_GUIDE_03_컴포넌트_사전.md` (예정): 이 데이터를 화면에 그리는 부품 공장 35종 카탈로그.
