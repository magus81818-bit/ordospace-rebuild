# CODE GUIDE 04 — 카드의 일생: 생성에서 승인까지

> ModuleCard 한 장이 태어나서 최종 승인을 받기까지 어떤 단계를 거치는지,
> 그 규칙을 누가 어디서 관리하는지를 설명합니다.
> 이 챕터는 이 앱의 **핵심 비즈니스 로직**입니다.
> 등장 파일: `app/services/module-card-lifecycle.service.js`

---

## 1. 30초 요약 — 카드의 여정

```text
 [생성]  →  [배정]  →  [작업 시작]  →  [리뷰 요청]  →  [Client 전달]  →  [승인]
  admin      admin       worker         worker           admin           client
```

모든 카드는 이 **한 방향 레일** 위를 달립니다.
중간에 어디서든 "수정 요청"이 오면 옆길로 빠졌다가 다시 레일에 합류합니다.

---

## 2. 상태 전이도 — 완전한 그림

```text
                    ┌─────────────────────────────────────────────┐
                    │           (수정 요청 — 어느 단계에서든)        │
                    │              ↓                               │
 ┌────────┐    ┌──────────┐    ┌──────────┐    ┌────────────┐    ┌──────────┐
 │ pending │───→│in_progress│───→│  review  │───→│    done    │───→│ approved │
 │  대기   │    │  진행중   │    │  검토중  │    │ 승인대기   │    │ 승인완료 │
 └────────┘    └──────────┘    └──────────┘    └────────────┘    └──────────┘
                    ↑                                │
                    │         ┌──────────┐           │
                    └─────────│ revision │←──────────┘
                              │ 수정요청 │
                              └──────────┘
```

| 상태 코드 | 한국어 | 의미 | 누가 만드나 |
|---|---|---|---|
| `pending` | 대기 | 생성됐지만 아직 아무도 손 안 댐 | admin (생성 시) |
| `in_progress` | 진행중 | worker가 일을 시작함 | 자동 (QC 체크/기록 추가 시) |
| `review` | 검토중 | worker가 PM에게 리뷰 요청 | worker (리뷰 요청 버튼) |
| `done` | 승인대기 | PM이 클라이언트에게 넘김 | admin (Client 전달 버튼) |
| `approved` | 승인완료 | 클라이언트가 최종 승인 | client (승인 버튼) |
| `revision` | 수정요청 | 수정이 필요하다는 피드백 | admin 또는 client |

---

## 3. "심판" — lifecycle 서비스의 역할

카드 상태를 바꾸는 **유일하게 허용된 통로**가 이 파일입니다.

```text
 [화면 버튼 클릭]
       │
       ▼
 lifecycle 서비스 함수 호출
       │
       ├─ ① 자격 검사(가드): 조건 안 맞으면 → 에러 throw → 화면이 alert 표시
       │
       ├─ ② 상태 변경: card.status = 새 상태
       │
       ├─ ③ 부수효과: 코멘트 추가, 타임라인 기록, 감사 로그
       │
       └─ ④ 저장(persist): localStorage 즉시 + 서버 0.4초 뒤
```

**왜 화면이 카드를 직접 못 고치게 했나?**
→ 규칙이 한 곳에만 있으므로, 규칙 변경 시 이 파일만 고치면 됩니다.
→ "QC 안 끝났는데 리뷰 요청" 같은 위반이 구조적으로 불가능.

---

## 4. 함수 카탈로그 — 누가 언제 부르나

### 작업자(worker)의 버튼

| 함수 | 버튼 | 가드(자격 조건) | 하는 일 |
|---|---|---|---|
| `updateQc(card, index, passed)` | QC 체크박스 | 없음 | 체크 상태 변경 + 자동 시작 + 저장 |
| `addWorkLog(card, text, workerId)` | "기록 추가" | 없음 | 작업 로그 한 줄 + 자동 시작 + 저장 |
| `addAttachment(card, name)` | "파일 첨부" | 없음 | 산출물 기록 + 자동 시작 + 저장 |
| `submitWorkerReview(card, workerId, note)` | "리뷰 요청" | **내 카드 + QC 전부 체크** | review로 전환 + 코멘트 + 기록 + 저장 |

### 관리자(admin)의 버튼

| 함수 | 버튼 | 가드 | 하는 일 |
|---|---|---|---|
| `createAdminCards(templates, opts)` | "일괄 생성" | 없음 | 새 카드 추가 + 저장 |
| `sendAdminToClient(card, note)` | "Client 전달" | **review 상태** | done으로 전환 + 알림 + 기록 + 저장 |
| `requestRevision(card, {role, note})` | "수정 요청" | **사유 필수** | revision + revisionCount↑ + 저장 |
| `reassign(card, workerId)` | "재할당" | 없음 | 담당자 변경 + 감사 로그 + 저장 |
| `setDueDate(card, date)` | "마감 변경" | YYYY-MM-DD 형식 | 마감일 수정 + 저장 |
| `markDone(card)` | "완료 처리" | **review 상태** | done으로 전환 + 기록 + 저장 |

### 클라이언트(client)의 버튼

| 함수 | 버튼 | 가드 | 하는 일 |
|---|---|---|---|
| `approveClient(card, note)` | "승인" | **done 상태** | approved로 전환 + 기록 + 저장 |
| `requestRevision(card, {role:'client', note})` | "수정 요청" | **done 상태 + 사유 필수** | revision + 저장 |

### 공용

| 함수 | 용도 |
|---|---|
| `addFreeComment(card, role, text)` | 상태 변경 없이 코멘트만 추가 |
| `persist()` | 수동 저장 (보통 자동으로 불림) |
| `hydrate()` / `hydrateRemote()` | 앱 시작 시 카드 되살리기 |

---

## 5. 가드(Guard) — "자격 검사"의 작동 방식

```js
// submitWorkerReview 의 가드 (간략화)
if (card.assignedTo !== workerId) throw new Error('...');  // 내 카드가 아님
if (!qcComplete(card))            throw new Error('...');  // QC 미완료
if (!['in_progress','revision','pending'].includes(card.status))
                                  throw new Error('...');  // 가능한 상태 아님
```

가드가 통과하지 못하면:
1. `throw new Error(메시지)` → 상태 변경은 일어나지 않음
2. 화면(screen)이 try/catch로 잡아서 `alert(메시지)` 표시
3. 사용자에게 "왜 안 되는지" 안내

**설계 의도**: 가드를 lifecycle에 집중시켜서, 화면 코드에서 조건문을 중복 작성하지 않아도 됨.

---

## 6. 자동 시작(ensureStarted) — 암묵적 상태 전이

worker가 QC를 체크하거나, 작업 기록을 추가하거나, 파일을 첨부하면 → 카드가 아직 `pending`이나 `revision`이면 **자동으로** `in_progress`로 바뀝니다.

```text
 pending → (QC 체크) → in_progress  ← 버튼을 따로 안 눌러도 전환됨
 revision → (기록 추가) → in_progress
```

"일을 시작했다"는 걸 별도 버튼 없이 행동으로 감지하는 UX 결정입니다.

---

## 7. 수정 요청(revision)의 특별한 규칙

- **누구든지** 수정을 요청할 수 있지만, client는 **자기 승인대기(done) 카드에만** 가능
- **사유(note)가 필수** — 빈 메시지로는 수정 요청 불가
- `revisionCount`가 1 올라감 — 몇 번째 수정인지 추적 가능
- 수정요청을 받으면 worker가 다시 작업 → `in_progress` → `review` → ... 레일에 재합류

---

## 8. 저장(persist)의 이중 안전망

```text
 persist() 호출
     │
     ├─ ① localStorage에 즉시 저장 (새로고침 대비, 0ms)
     │
     └─ ② scheduleRemoteSave → 0.4초 뒤 서버로 PUT
            (연타 시 마지막 한 번만 보냄 = 디바운스)
```

**왜 두 곳에?**
- localStorage만: 이 브라우저에서만 보임, 다른 기기에선 사라짐
- 서버만: 네트워크 끊기면 저장 실패
- 둘 다: 어느 쪽이 죽어도 나머지가 살아있음

(저장의 세부 사항은 다음 챕터 05에서 자세히)

---

## 9. 기록 남기기 — 타임라인과 감사 로그

상태가 바뀔 때마다 두 군데에 자동으로 사건이 기록됩니다:

| 기록 장소 | 누가 보나 | 용도 |
|---|---|---|
| `ORDO_TIMELINE_EVENTS` | 클라이언트 (프로젝트 진행 연대기) | "이 프로젝트에서 무슨 일이 있었나" |
| `AUDIT_DATA` | 관리자 (admin-audit 화면) | "누가 언제 무엇을 했나" (감사 추적) |

`visibility` 필드가 `'public'`이면 클라이언트도 보이고, `'internal'`이면 관리자만 봅니다.

---

## 10. 자주 하는 질문

**Q. 왜 화면에서 card.status = 'approved' 로 직접 바꾸면 안 되나요?**
코멘트 추가, 타임라인 기록, 감사 로그, 저장 — 이 부수효과들이 전부 빠짐. 나중에 "누가 승인했는지" 추적 불가. lifecycle을 거쳐야 모든 부수효과가 자동으로 따라옴.

**Q. QC를 전부 체크 안 하면 정말 리뷰 요청이 안 되나요?**
네. `canWorkerSubmit` 가드가 `qcComplete(card)`를 확인하고, false면 throw. 화면의 버튼도 이 함수로 disabled 상태를 결정합니다.

**Q. 수정 요청 후 다시 승인받으려면 처음부터 다시?**
네, `revision` → worker가 고침 → `in_progress` → `review` → admin이 전달 → `done` → client 승인. 전체 레일을 다시 타야 합니다.

---

## 11. 5분 따라하기

1. F12 콘솔에서 lifecycle 객체 확인:
   ```js
   Object.keys(window.ORDO_MODULE_CARD_LIFECYCLE)
   ```
   → 내보내진 함수 목록 (20개+).

2. 상태 목록 확인:
   ```js
   window.ORDO_MODULE_CARD_LIFECYCLE.STATUSES
   ```
   → `{PENDING:'pending', IN_PROGRESS:'in_progress', ...}`

3. 첫 번째 카드로 자격 검사 테스트:
   ```js
   const card = window.ORDO_MODULE_CARDS[0];
   window.ORDO_MODULE_CARD_LIFECYCLE.canWorkerSubmit(card, card.assignedTo)
   ```
   → true/false. QC가 다 체크된 카드라면 true.

4. 저장 상태 확인:
   ```js
   window.ORDO_MODULE_CARD_LIFECYCLE.storageInfo()
   ```
   → `{key:'ordospace.static...', persistedCards: 12, liveCards: 12, ...}`

5. 서버 통신 상태:
   ```js
   window.ORDO_MODULE_CARD_LIFECYCLE.backendInfo()
   ```
   → `{lastStatus:'synced'|'local-cache', ...}`

---

## 12. 이 챕터를 읽고 답할 수 있어야 하는 질문

1. worker가 "리뷰 요청" 버튼을 누르려면 충족해야 할 조건 2가지는?
2. 수정 요청(revision)에 사유(note)가 필수인 이유는?
3. persist() 함수가 localStorage와 서버 두 곳에 저장하는 이유는?

<details><summary>정답 확인</summary>

1. ① 카드가 내(worker)에게 배정된 것 ② QC 체크리스트가 전부 체크 완료
2. "왜 수정이 필요한지" 기록이 없으면, worker가 무엇을 고쳐야 할지 모르기 때문. 또한 감사 로그에 사유가 남아야 나중에 추적 가능.
3. localStorage는 네트워크 없이도 즉시 안전하고, 서버는 다른 기기에서도 데이터를 볼 수 있게 함. 한쪽이 죽어도 다른 쪽이 백업.

</details>

**다음 챕터** → `CODE_GUIDE_05_저장의_여정.md` (예정): localStorage + 서버 이중 저장의 세부 메커니즘.
