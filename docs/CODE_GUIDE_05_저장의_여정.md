# CODE GUIDE 05 — 저장의 여정: 왜 새로고침해도 안 사라지는가

> 버튼 하나를 누르면 데이터는 어디로 가는가?
> 브라우저를 닫았다 열어도, 다른 기기에서 열어도 데이터가 남아있는 비결을 설명합니다.
> 등장 파일: `app/services/module-card-lifecycle.service.js` (persist 부분),
> `api/module-cards.js`, `api/_lib/module-card-repository.cjs`

---

## 1. 30초 요약 — 이중 저장

```text
 [버튼 클릭] → lifecycle.persist()
     │
     ├─ ① localStorage (즉시) ← 새로고침 대비
     │
     └─ ② 서버 PUT (0.4초 뒤) ← 다른 기기 대비
            │
            └─→ Postgres DB (영구 저장)
```

**localStorage** = 브라우저 안의 작은 서랍. 빠르지만 이 브라우저에서만 보임.
**Postgres DB** = 서버의 금고. 느리지만 어디서든 꺼내볼 수 있음.

---

## 2. 저장 경로 상세도

```text
 ┌─────────────────────── 브라우저 ───────────────────────┐
 │                                                         │
 │  lifecycle.persist()                                    │
 │     │                                                   │
 │     ├─ persistLocal(cards)                              │
 │     │    └─ localStorage.setItem(key, JSON.stringify)   │
 │     │       key: 'ordospace.static.moduleCards.v1'      │
 │     │                                                   │
 │     └─ scheduleRemoteSave(cards)                        │
 │          └─ setTimeout(0.4초) → saveRemoteNow(cards)   │
 │                │                                        │
 └────────────────┼────────────────────────────────────────┘
                  │  PUT /api/module-cards
                  │  body: { cards: [...12장...] }
                  ▼
 ┌─────────────────────── 서버 ────────────────────────────┐
 │                                                         │
 │  api/module-cards.js (handler)                          │
 │     └─ replaceModuleCards(sql, cards)                   │
 │          └─ 트랜잭션: DELETE ALL → INSERT 12건          │
 │                                                         │
 │  api/_lib/module-card-repository.cjs                    │
 │     └─ Postgres: ordo_module_cards 테이블               │
 │                                                         │
 └─────────────────────────────────────────────────────────┘
```

---

## 3. localStorage — 1차 저장소

### 저장 형식

```json
{
  "version": 1,
  "savedAt": "2026-07-06T05:30:00.000Z",
  "cards": [ { "id": "mc-001", "status": "approved", ... }, ... ]
}
```

### 특징

| 장점 | 단점 |
|---|---|
| 즉시 저장 (0ms) | 이 브라우저에서만 보임 |
| 네트워크 불필요 | 브라우저 데이터 삭제 시 사라짐 |
| 새로고침에 안전 | 다른 기기/브라우저에서 접근 불가 |

### 확인 방법
F12 → Application 탭 → Local Storage → 현재 도메인 → `ordospace.static.moduleCards.v1`

---

## 4. 서버 API — 2차 저장소

### 엔드포인트

| 메서드 | 경로 | 하는 일 |
|---|---|---|
| `GET` | `/api/module-cards` | DB에서 카드 전체 조회 |
| `PUT` | `/api/module-cards` | DB에 카드 전체 교체(저장) |

### PUT 요청 구조

```json
// 요청 (브라우저 → 서버)
{ "cards": [ {카드1}, {카드2}, ... ] }

// 응답 (서버 → 브라우저)
{ "ok": true, "source": "postgres", "saved": 12, "cards": [...] }
```

### "전체 교체" 전략

서버는 카드를 **부분 수정하지 않고**, 매번 **전체를 교체**합니다:
1. 트랜잭션 시작
2. 기존 카드 전부 삭제 (DELETE)
3. 새 카드 전부 삽입 (INSERT)
4. 트랜잭션 커밋

**왜 이렇게?** 카드 간 관계(순서, 의존성)가 있어서 부분 수정 시 정합성이 깨질 수 있음. 12장 정도면 전체 교체가 더 안전하고 단순.

---

## 5. 디바운스 — 왜 0.4초 기다리나

```text
 체크박스 클릭 ─── persist() ─── scheduleRemoteSave()
 0.1초 뒤 또 클릭 ── persist() ── 이전 타이머 취소 → 새 타이머
 0.2초 뒤 또 클릭 ── persist() ── 이전 타이머 취소 → 새 타이머
 ...
 마지막 클릭 + 0.4초 → saveRemoteNow() → PUT 1회만 실행!
```

QC 체크박스를 5개 연달아 누르면, 서버에는 **마지막 1회만** 전송됩니다.
localStorage에는 매번 즉시 저장되므로 중간에 새로고침해도 안전합니다.

---

## 6. 앱 시작 시 — 데이터 되살리기(hydrate)

```text
 앱 시작
   │
   ├─ ① hydrate() — localStorage에서 읽기
   │    있으면: 그걸로 시작
   │    없으면: 시드(샘플) 데이터로 시작
   │
   └─ ② hydrateRemote() — 서버에 물어보기 (비동기)
        서버에 카드 있으면: 서버 것으로 덮어쓰기 (서버가 정본)
        서버에 카드 없으면: 내 카드를 서버에 올림 (seeding)
        서버 죽어있으면: 로컬만으로 계속 (오프라인 모드)
```

**우선순위**: 서버 > localStorage > 시드 데이터.
서버 응답이 늦어도 앱은 localStorage로 먼저 화면을 그리고, 서버 응답이 오면 갱신.

---

## 7. DB 테이블 구조

```sql
ordo_module_cards
├── id          text (PK)      예: 'mc-001'
├── project_id  text           예: 'proj-001'
├── status      text           예: 'approved'
├── card        jsonb          카드 전체를 JSON으로 통째 저장
└── updated_at  timestamptz    마지막 수정 시각
```

카드의 모든 정보(QC, 코멘트, 첨부파일 등)는 `card` 컬럼 안에 JSON으로 들어갑니다.
`id`와 `status`만 별도 컬럼으로 빼서 인덱싱에 사용.

---

## 8. 에러 상황과 안전장치

| 상황 | 결과 | 사용자 영향 |
|---|---|---|
| 서버 죽음 | localStorage에만 저장됨 | 이 브라우저에서는 정상 동작 |
| 네트워크 끊김 | saveRemoteNow 실패 → lastStatus: 'save-failed' | 상태 표시기에 경고, 재연결 시 자동 재시도 |
| JSON 파싱 실패 | 서버 400 에러 | 로컬 저장은 이미 됨, 다음 저장에서 성공 가능 |
| DB 미설정 (503) | hydrateRemote 실패 | 로컬 전용 모드로 계속 동작 |
| localStorage 가득 참 | persistLocal false 반환 | 드문 경우, 서버 저장으로 보상 |

**핵심 원칙**: 어떤 실패든 앱이 멈추지 않음. 한쪽이 실패하면 다른 쪽이 보상.

---

## 9. 자동 저장 — 탭 닫힘 대비

```js
window.addEventListener('pagehide', persist);
window.addEventListener('beforeunload', persist);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') persist();
});
```

탭을 닫거나, 다른 창으로 전환하거나, 브라우저를 끄면 → 자동으로 한 번 더 저장.
"저장 버튼을 안 눌러도" 데이터가 안전하게 보존되는 비결.

---

## 10. 데이터 검증 — 서버의 문지기

서버는 카드를 받으면 무조건 검증합니다:

1. **배열인가?** → 아니면 400 에러
2. **각 항목이 객체인가?** → 아니면 400
3. **id, projectId, module이 있는가?** → 하나라도 빠지면 400
4. **id가 중복되지 않는가?** → 중복이면 400
5. **status가 유효한 6가지 중 하나인가?** → 아니면 'pending'으로 교정

통과하면 저장, 실패하면 에러 메시지와 함께 거부.

---

## 11. 자주 하는 질문

**Q. 왜 카드 한 장만 수정해도 12장 전체를 보내나요?**
단순성과 정합성. 12장 정도는 데이터량이 미미하고, 부분 수정 API는 동시 편집 충돌 처리가 복잡해짐. 전체 교체가 이 규모에서는 최선.

**Q. 서버가 없으면(로컬에서 file:// 로 열면) 어떻게 되나요?**
`canUseRemote()`가 false를 반환하고, localStorage만으로 동작합니다. 서버 관련 코드는 전부 건너뜀.

**Q. 다른 사람이 동시에 수정하면 어떻게 되나요?**
이 프로토타입에서는 마지막에 저장한 사람의 데이터가 이깁니다 (last-write-wins). 실제 프로덕션이면 버전 번호 비교나 충돌 감지가 필요.

---

## 12. 5분 따라하기

1. F12 → Application → Local Storage에서 `ordospace.static.moduleCards.v1` 확인.
   → 카드 12장이 JSON으로 저장되어 있음.

2. 콘솔에서 저장 상태 확인:
   ```js
   window.ORDO_MODULE_CARD_LIFECYCLE.storageInfo()
   ```
   → `{persistedCards: 12, liveCards: 12, ...}`

3. 서버 연결 상태:
   ```js
   window.ORDO_MODULE_CARD_LIFECYCLE.backendInfo()
   ```
   → `lastStatus: 'synced'` (서버 연결됨) 또는 `'local-cache'` (로컬만)

4. 수동으로 저장해보기:
   ```js
   window.ORDO_MODULE_CARD_LIFECYCLE.persist()
   ```
   → localStorage가 갱신되고, 0.4초 뒤 서버로 PUT 시도.

5. Network 탭에서 확인:
   F12 → Network → Filter "module-cards" → 0.4초 뒤 PUT 요청이 나타남.

---

## 13. 이 챕터를 읽고 답할 수 있어야 하는 질문

1. localStorage와 서버 DB 두 곳에 저장하는 이유는?
2. 체크박스를 5번 연타하면 서버에 몇 번 요청이 가는가? 그 이유는?
3. 앱 시작 시 서버의 카드와 로컬의 카드가 다르면 어느 쪽이 이기는가?

<details><summary>정답 확인</summary>

1. localStorage는 빠르고 네트워크 불필요(새로고침 대비), 서버는 영구적이고 다른 기기에서 접근 가능. 한쪽이 실패해도 다른 쪽이 보상.
2. 1번만. 0.4초 디바운스가 중간 클릭을 뭉쳐서 마지막 1회만 전송.
3. 서버가 이김. hydrateRemote()가 서버 데이터를 정본으로 삼아 덮어씀 (서버 > localStorage > 시드).

</details>

**다음 챕터** → `CODE_GUIDE_06_품질을_지키는_법.md` (예정): 검증 스크립트가 무엇을 지키는가.
