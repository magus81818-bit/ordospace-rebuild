# CODE GUIDE 03 — 컴포넌트 사전: 부품 공장 카탈로그

> 화면에 보이는 배지, 숫자 카드, 진행률 바, 목록 카드… 이것들은 전부 "부품 공장"에서 찍어낸 것입니다.
> 이 챕터에서는 공장의 부품 35종을 카탈로그로 정리합니다.
> 등장 파일: `app/ui/components/base.ui.js`, `status.ui.js`, `metric.ui.js` (전반부)
> (후반부는 R5에서: `module-card.ui.js`, `detail.ui.js`, `form.ui.js`, `sheet.ui.js`)

---

## 1. 부품 공장이란?

```text
 [데이터] ──→ 팩토리 함수 ──→ [HTML 문자열]
   입력          가공            출력
```

**팩토리(factory)** = 재료(데이터)를 넣으면 완성품(HTML 문자열)을 돌려주는 함수.

예:
```js
StatusBadge('승인완료', 'ok')
// → '<span class="ordo-c-status-badge ... bg-st-okbg ...">●승인완료</span>'
```

특징:
- **순수 함수**: DOM을 직접 건드리지 않습니다. HTML 문자열만 만들어서 돌려줌.
- **escape 기본**: 사용자 데이터는 반드시 `escapeHtml`을 거쳐 출력 → XSS 방지.
- **전역 진열장**: 모든 팩토리는 `window.ORDO_UI_COMPONENTS`에 등록됨 (현재 35종).

---

## 2. 공용 도구함 — base.ui.js

모든 팩토리가 공유하는 기초 유틸리티입니다. 직접 화면을 그리지는 않지만, 다른 팩토리의 "재료 손질" 담당.

| 함수 | 하는 일 | 사용 예 |
|---|---|---|
| `escapeHtml(v)` | 위험 문자(`<`, `>` 등)를 무해하게 변환 | 모든 팩토리의 데이터 출력 |
| `cx(...)` | CSS 클래스를 조건부로 합침 | `cx('base', isActive && 'active')` → `'base active'` |
| `fallbackText(v, fallback)` | 빈 값이면 기본값(`'-'`)으로 대체 | 카드 제목이 없을 때 |
| `safePct(part, total)` | 안전한 퍼센트 (0÷0 = 0) | 진행률 계산 |
| `todayDateText()` | 오늘 날짜 `'2026-07-06'` | 카드 생성일 기본값 |
| `nowDisplayText()` | 현재 시각 `'2026-07-06 14:05'` | 코멘트 타임스탬프 |
| `dateRank(v)` | 날짜 → 숫자 (정렬용) | 코멘트 최신순 정렬 |
| `displayDate(v)` | ISO → 화면 표시형 | 첨부 파일 날짜 |
| `routeParams()` | URL 쿼리 파라미터 읽기 | `?cardId=mc-001` 파싱 |

---

## 3. 색조(tone) 시스템 — status.ui.js

이 앱에서 색깔은 "기분"을 표현합니다. 5가지 색조가 카드·배지·알림 등 모든 곳에서 일관되게 사용됩니다:

```text
 색조        의미            색상         언제 적용되나
 ─────────────────────────────────────────────────────
 crit       위험/긴급       빨강계열     마감 초과, 수정요청, 미배정
 warn       경고/주의       노랑계열     마감 2일 이내
 pend       진행/대기       파랑계열     작업중, 리뷰중
 ok         정상/완료       초록계열     승인완료, 정상
 rej        비활성          회색계열     배정은 됐지만 아직 시작 전
```

### 색조 판정 규칙 (moduleTone 함수)

카드를 보고 "어떤 색으로 보여줄지" 결정하는 우선순위:

1. 수정요청(revision) 이거나 마감 초과 → **crit** (빨강)
2. 마감 2일 이내 → **warn** (노랑)
3. 진행중/리뷰중 → **pend** (파랑)
4. 완료/승인 → **ok** (초록)
5. 나머지: 배정됨 → **rej** (회색), 미배정 → **crit** (빨강)

### 배지 팩토리

| 팩토리 | 입력 | 출력 |
|---|---|---|
| `StatusBadge(label, tone)` | 텍스트 + 색조 | 색 점 + 라벨이 있는 둥근 배지 |
| `PriorityBar(tone)` | 색조 | 카드 왼쪽의 세로 색 막대 |
| `statusBadgeHtml(status, tone)` | 상태코드 + 색조 | StatusBadge의 호환 래퍼 (기존 코드용) |

---

## 4. 지표 팩토리 — metric.ui.js

화면 상단의 숫자 카드, 진행률 바, "비어있음" 안내를 만듭니다.

### MetricCard — KPI 숫자 카드

```text
 ┌─────────────────┐
 │ 총 카드          │  ← label
 │     12           │  ← value (큰 글씨)
 │ 전체 모듈 수     │  ← sub (작은 부제)
 └─────────────────┘
```

사용: `MetricCard('총 카드', '12', '전체 모듈 수')`

### ProgressTrack — 진행률 바

```text
 승인 진행률              4/12 · 33%
 ████████░░░░░░░░░░░░░░░
```

사용: `ProgressTrack('승인 진행률', 4, 12, '4건 승인 완료')`

### EmptyState — 빈 상태 안내

데이터가 없을 때 "텅 빈 화면" 대신 보여주는 안내 문구. 5가지 변형:

| variant | 용도 | 크기 |
|---|---|---|
| `panel` | 대시보드 섹션 | 작은 점선 박스 |
| `inline` | 목록 패널 | 가운데 정렬 텍스트 |
| `detail` | worker/client 상세 패널 | 420px 높이 |
| `detail-lg` | admin 카드 상세 패널 | 520px 높이 |
| `detail-emphasis` | client 승인함 "모두 처리됨" | 420px, 굵은 글씨 |

사용: `EmptyState('카드를 선택하세요', {variant:'detail'})`

### Notice — 알림 박스

색조 배경의 한 줄 안내. 예: PM 코멘트 강조 표시.

사용: `Notice('마감이 임박합니다', 'warn')` → 노란 배경 박스

---

## 5. Tailwind와 팩토리의 약속

Tailwind CSS는 빌드 시 **파일에서 문자열로 보이는 클래스만** 남깁니다. 그래서:

- ❌ `'bg-st-' + tone + 'bg'` — 이렇게 **조합하면** 빌드가 인식 못 해서 스타일 누락
- ✅ `'bg-st-critbg border-st-critbd text-st-critfg'` — **완전한 리터럴**이면 OK

이 때문에 `ORDO_EMPTY_STATE_VARIANTS`나 `moduleToneClass`는 모든 경우의 클래스를 "풀어 써" 놓았습니다. 코드가 길어 보이지만, Tailwind 빌드와의 약속을 지키기 위한 것입니다.

---

## 6. 자주 하는 질문

**Q. 팩토리가 DOM을 안 건드리면, 화면에는 어떻게 나타나나요?**
화면(screens)의 render 함수가 팩토리를 호출해 HTML 문자열을 받고, 그걸 `element.innerHTML = ...`로 DOM에 넣습니다. "만드는 사람"과 "붙이는 사람"이 분리된 구조.

**Q. escapeHtml을 안 거치면 어떻게 되나요?**
사용자가 카드 제목에 `<script>alert('해킹')</script>` 같은 걸 넣으면 그대로 실행될 수 있음 (XSS 공격). escapeHtml은 `<`를 `&lt;`로 바꿔서 이를 방지.

**Q. 35종은 어디서 확인하나요?**
F12 콘솔에서 `Object.keys(window.ORDO_UI_COMPONENTS).length` → 35. 전체 목록도 `Object.keys(window.ORDO_UI_COMPONENTS)` 로 볼 수 있습니다.

---

## 7. 5분 따라하기

1. 브라우저에서 `index.html`을 열고 F12 → Console.
2. 배지 만들어보기:
   ```js
   ORDO_UI_COMPONENTS.StatusBadge('테스트', 'ok')
   ```
   → 초록 배지의 HTML 문자열이 출력됩니다. "함수가 HTML을 만든다"는 걸 눈으로 확인.

3. 다른 색조로:
   ```js
   ORDO_UI_COMPONENTS.StatusBadge('위험!', 'crit')
   ```
   → 빨간 배지 HTML.

4. KPI 카드:
   ```js
   ORDO_UI_COMPONENTS.MetricCard('총 카드', '12', '전체')
   ```
   → 카드 HTML 문자열. 이걸 화면에 넣으면 숫자 카드가 됩니다.

5. escape 확인:
   ```js
   ORDO_UI_COMPONENTS.escapeHtml('<script>위험</script>')
   ```
   → `'&lt;script&gt;위험&lt;/script&gt;'` — 위험 문자가 무해하게 바뀜.

---

## 8. 이 챕터를 읽고 답할 수 있어야 하는 질문

1. 팩토리 함수가 DOM을 직접 건드리지 않고 HTML 문자열만 돌려주는 이유는?
2. 카드의 색조(tone)가 'crit'(빨강)이 되는 조건 3가지는?
3. EmptyState 변형(variant)이 5가지인 이유는 무엇인가? (한 가지면 안 되나?)

<details><summary>정답 확인</summary>

1. "만드는 일"과 "화면에 붙이는 일"을 분리해서 재사용성을 높이기 위함. 같은 팩토리를 admin/worker/client 3개 화면에서 공유 가능.
2. ① 수정요청(revision/rejected) 상태일 때 ② 마감일이 지났을 때(dueDate 초과) ③ 작업자가 미배정일 때(assignedTo 없음)
3. 각 변형이 들어가는 맥락(대시보드/목록/상세 패널)의 크기와 강조도가 다르기 때문. Tailwind 빌드 안전을 위해 클래스를 완전한 리터럴로 미리 정의해야 하므로, 하나로 합치면 조건부 조합이 필요해져 빌드에서 누락됨.

</details>

---

# 후반부 — 카드·상세·폼·시트 팩토리

> 전반부에서 기초 부품(유틸·배지·지표)을 봤다면, 후반부는 **화면의 주인공**들입니다.
> 등장 파일: `module-card.ui.js`, `detail.ui.js`, `form.ui.js`, `sheet.ui.js`

---

## 9. 카드 목록 아이템 — module-card.ui.js

목록에 보이는 카드 한 장의 HTML을 만드는 팩토리입니다. 원래 admin/worker/client 화면에 4벌 복사되어 있던 코드를 **하나로 통합**한 것.

```text
 ┌────────────────────────────────────────────┐
 │ ●승인완료  디자인 · 피그마                   │ ← 배지 + 메타
 │ 메인 페이지 디자인                           │ ← 제목
 │ 김철수 · MH 40/35 · D-3    QC 3/5 · 📎2 · 💬4│ ← 하단 요약
 ├─                                            │ ← 색 막대(PriorityBar)
 └────────────────────────────────────────────┘
```

### 옵션으로 화면별 차이 흡수

| 옵션 | 설명 | admin | worker | client |
|---|---|---|---|---|
| `tag` | 감싸는 태그 | `'button'` | `'button'` | `'article'` |
| `dataAttr` | 카드 ID 속성명 | `'data-admin-card-id'` | `'data-worker-card-id'` | `'data-project-card-id'` |
| `selected` | 선택 상태 강조 | ✅ | ✅ | - |
| `interactive` | 클릭 가능 article | - | - | ✅ (타임라인) |
| `truncateFooterLeft` | 하단 말줄임 | ✅ | - | - |

하나의 팩토리 + 옵션 조합 = 3개 화면에서 동일한 카드 모양. 중복 코드 0줄.

---

## 10. 상세 패널 부품 세트 — detail.ui.js

카드를 클릭하면 오른쪽에 펼쳐지는 "상세 패널"의 부품 9종이 이 파일에 있습니다.

```text
 ┌─ 상세 패널 ────────────────────────────┐
 │ [DetailHeader]   제목 + 배지             │
 │ [MetaGrid]       담당자·MH·마감 격자     │
 │ [DetailSection + QcList]    QC 체크리스트 │
 │ [DetailSection + WorkLogList] 작업 로그   │
 │ [DetailSection + AttachmentList] 첨부파일 │
 │ [DetailSection + CommentList]   코멘트    │
 │ [ActionToolbar]  하단 버튼줄             │
 └──────────────────────────────────────────┘
```

### 부품 카탈로그

| 팩토리 | 입력 | 출력 |
|---|---|---|
| `DetailHeader` | 카드 + opts | 제목·배지·부제 헤더 |
| `MetaGrid` | [라벨,값] 쌍 배열 | 2~3열 정보 타일 격자 |
| `QcList` | 체크리스트 배열 | 체크/미체크 목록 (편집모드 가능) |
| `WorkLogList` | 로그 배열 | 날짜+내용 시간순 목록 |
| `AttachmentList` | 파일 배열 | 링크 목록 (이미지 미리보기 모드 가능) |
| `AttachmentPreviewItem` | 파일 1개 | 이미지 또는 다운로드 링크 |
| `CommentList` | 코멘트 배열 | 시간순 대화 스레드 |
| `DetailSection` | 제목 + 본문 HTML | 테두리가 있는 섹션 박스 |
| `ActionToolbar` | 버튼 정의 배열 | 하단 액션 버튼줄 |

### QcList의 두 가지 모드

- **읽기 모드** (admin/client): 체크/미체크 텍스트만 표시
- **편집 모드** (worker): `opts.editable = true` → 실제 체크박스가 나타남. worker가 직접 QC 항목을 체크할 수 있음

### ActionToolbar의 두 가지 레이아웃

| 레이아웃 | 화면 | 버튼 배치 |
|---|---|---|
| `wrap` | admin 상세 | 한 줄에 우측 정렬, 넘치면 줄 바꿈 |
| `stack` | worker/client | 모바일: 세로 쌓기 → 데스크톱: 가로 |

버튼의 `variant`는 3종: `default`(기본 테두리), `warn`(노란 경고), `primary`(브랜드 색 채움).

---

## 11. 폼 부품 — form.ui.js

admin이 카드를 일괄 생성할 때 쓰는 입력 양식 부품 3종.

| 팩토리 | 하는 일 | 예 |
|---|---|---|
| `FormField(label, controlHtml)` | 라벨 + 입력칸을 하나로 감쌈 | 라벨 "담당자" + select 드롭다운 |
| `CheckboxRow(opts)` | 체크박스 + 제목 + 부제 한 행 | 모듈 선택 목록의 각 행 |
| `OptionList(items, opts)` | `<option>` 태그들 생성 | 담당자 드롭다운의 선택지 |

`ORDO_FORM_CONTROL_CLASSES` = input/select 공용 스타일 상수. 모든 입력칸이 같은 높이·테두리·글씨 크기를 갖도록.

---

## 12. 시트 컨트롤러 — sheet.ui.js

"시트"는 화면 위에 덮이는 반투명 오버레이 패널입니다. `index.html`에 껍데기가 숨겨져 있고, SheetController가 열고 닫는 역할만 합니다.

```text
 SheetController('adminBulkCreateSheet')
   ├── .open()      → 시트 표시 (hidden 제거 + aria-hidden="false")
   ├── .close()     → 시트 숨김 (hidden 추가 + aria-hidden="true")
   └── .bindClose(selector, handler) → 닫기 버튼에 클릭 연결
```

다른 팩토리들이 "HTML 문자열을 돌려주는 순수 함수"인 반면, SheetController만은 **DOM을 직접 조작**합니다 (hidden 클래스 토글). 이건 "시트를 여닫는 것"이 데이터가 아니라 화면 상태이기 때문.

---

## 13. 전체 부품 지도 — 한눈에 보기

```text
 app/ui/components/
 ├── base.ui.js         공용 도구함 (escapeHtml, cx, 날짜 등)
 │     ↓ 모든 팩토리가 사용
 ├── status.ui.js       색조 시스템 + 배지 (moduleTone, StatusBadge)
 ├── metric.ui.js       KPI 카드 + 진행률 바 + 빈 상태
 ├── module-card.ui.js  카드 목록 아이템 (3개 화면 공유)
 ├── detail.ui.js       상세 패널 부품 9종
 ├── form.ui.js         폼 입력 부품 3종
 └── sheet.ui.js        시트 열기/닫기 컨트롤러
                        ─────────────────────
                        합계: 35종 (ORDO_UI_COMPONENTS)
```

---

## 14. 후반부 자주 하는 질문

**Q. ModuleCardListItem이 하나인데, admin과 client에서 카드 모양이 다르지 않나요?**
핵심 구조(배지·제목·하단 요약)는 같고, 감싸는 태그(`button` vs `article`), ID 속성명, 선택 강조 등 **옵션만 다릅니다**. 한 팩토리가 옵션으로 차이를 흡수.

**Q. DetailSection은 왜 bodyHtml을 직접 받나요?**
안에 들어갈 내용이 QcList일 수도, AttachmentList일 수도, 자유 HTML일 수도 있기 때문. "테두리 틀"만 제공하고 내용물은 호출자가 결정.

**Q. SheetController만 DOM을 건드리는 이유는?**
다른 팩토리는 "데이터 → HTML 문자열" 변환이지만, 시트 열기/닫기는 "이미 존재하는 DOM의 상태 전환"이라서 문자열로는 불가. 유일한 예외.

---

## 15. 후반부 5분 따라하기

1. F12 콘솔에서 카드 목록 아이템 만들기:
   ```js
   ORDO_UI_COMPONENTS.ModuleCardListItem(window.ORDO_MODULE_CARDS[0])
   ```
   → 첫 번째 카드의 HTML 문자열. 배지·제목·하단 요약이 전부 들어 있음.

2. 상세 헤더 만들기:
   ```js
   ORDO_UI_COMPONENTS.DetailHeader(window.ORDO_MODULE_CARDS[0], {topText: '카드 상세'})
   ```
   → 제목 + 배지가 포함된 헤더 HTML.

3. 코멘트 목록:
   ```js
   ORDO_UI_COMPONENTS.CommentList(window.ORDO_MODULE_CARDS[0].comments)
   ```
   → 시간순 코멘트 대화 HTML.

4. 시트 열기 (실제 화면 변화!):
   ```js
   ORDO_UI_COMPONENTS.SheetController('adminBulkCreateSheet').open()
   ```
   → 일괄 생성 시트가 화면에 나타남. `.close()`로 닫기.

---

## 16. 후반부 확인 질문

1. ModuleCardListItem이 admin/worker/client 3개 화면에서 공유 가능한 비결은?
2. QcList가 두 가지 모드를 가진 이유는?
3. SheetController가 다른 팩토리와 근본적으로 다른 점은?

<details><summary>정답 확인</summary>

1. `opts` 객체로 화면별 차이(tag/dataAttr/selected 등)를 흡수. 핵심 구조는 동일하되 옵션 조합만 다름.
2. admin/client는 "읽기만" 하지만 worker는 QC를 직접 체크해야 하므로, editable 모드가 별도로 필요.
3. 다른 팩토리는 HTML 문자열만 돌려주는 순수 함수지만, SheetController는 DOM을 직접 조작(hidden 토글). "시트 열기/닫기"는 데이터 변환이 아니라 화면 상태 전환이기 때문.

</details>

**다음 챕터** → `CODE_GUIDE_04_카드의_일생.md`: 카드가 태어나서 승인될 때까지의 전 과정 (lifecycle).
