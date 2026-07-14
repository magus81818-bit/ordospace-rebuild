# CODE GUIDE 01 — 앱이 켜질 때: 부팅 스토리

> 브라우저에 `index.html`을 여는 순간부터 첫 화면이 보이기까지, 무슨 일이 어떤 순서로 일어나는지 따라갑니다.
> 등장 파일: `index.html` → `app.config.js` → `session.service.js` → `app-shell.js` → `hash-router.js` → (`main.js`)

---

## 1. 큰 그림: 건물에 불이 들어오는 순서

```text
 ① index.html 로드      : 건물(모든 화면의 HTML)이 통째로 도착. 단, 전부 hidden(숨김) 상태
 ② <script> 순서대로 실행 :
     config   → 설정표 준비 (화면 목록, 메뉴 구성...)
     session  → "지난번에 누구로 로그인했더라?" localStorage 에서 역할 복원
     shell    → 액자(사이드바/상단바) 준비
     data     → 창고에 샘플 데이터 적재
     lifecycle→ 심판 출근 + 저장된 카드 복원(hydrate) + 서버에 "저장본 있어요?" 문의
     components → 부품 공장 가동
     router   → 교통정리 준비
     screens  → 각 화면의 그리기 함수들 준비
 ③ main.js 의 한 줄      : navigate(location.hash || '#landing')
     → 교통정리가 첫 화면을 골라 불을 켬. 이 순간 사용자 눈에 화면이 보임
```

핵심 개념 하나: **이 앱은 페이지 이동이 없습니다.** 화면 19개가 전부 한 HTML 안에 숨어 있고, 라우터가 "지금 보여줄 하나"에만 불을 켭니다(active 클래스). 그래서 화면 전환이 즉각적입니다.

## 2. 파일별 역할 (읽기 순서대로)

### ② -1. `app/config/app.config.js` — 설정표

로직이 없고 **상수(목록)만** 있습니다. "화면이 몇 개고, 각 역할의 홈은 어디고, 사이드바엔 뭐가 들어가는가"의 정답지. 다른 모든 파일이 이 값을 읽기 때문에 **가장 먼저 로드**됩니다.

- 새 화면을 추가하려면? → `SCREENS` 배열 + index.html 의 `<section id="screen-이름">` 이 세트입니다.
- 사이드바 배지 숫자('3', '2', '5')는 하드코딩된 샘플이라 실제 카드 수와 무관합니다 (파일 주석에도 표시).

### ② -2. `app/services/session.service.js` — 신분증 발급소

이 파일의 백미는 `window.ORDO_ROLE` 이라는 **지능형 변수**입니다.

```js
window.ORDO_ROLE = 'admin';   // 이 한 줄이 실행되면...
// ① 'admin'이 유효한 역할인지 검사
// ② localStorage 에 저장 (새로고침해도 기억)
// ③ applyRoleUI() 호출 → 사이드바/메뉴/알림이 관리자용으로 싹 바뀜
```

겉보기엔 변수 대입이지만 3가지 일이 자동으로 따라옵니다 (`Object.defineProperty` 라는 장치 — 파일 주석의 "지능형 변수" 부분). 역할 전환 버튼(`data-role-switch`)이 결국 이 변수에 값을 넣는 것뿐입니다.

### ② -3. `app/layout/app-shell.js` — 액자

사이드바·상단바·알림판·모바일 탭 등 **모든 화면이 공유하는 틀**. 총지휘자는 `applyRoleUI()` — 역할이 바뀌면 액자의 6개 부품을 한꺼번에 다시 그립니다. "무엇을 그릴지"(메뉴 내용)는 config 소관, 이 파일은 "그리는 방법"만 압니다.

### ② -4. `app/router/hash-router.js` — 교통정리

핵심 함수 `navigate()` 는 6단계로 일합니다 (코드에 ①~⑥ 번호 주석이 달려 있습니다):

1. **특수 주소 처리** — `#inquiry`(문의 모달), 랜딩 섹션 스크롤, 옛 주소(alias) 리다이렉트
2. **출입 검사** — 화면의 `data-allowed-roles` 와 현재 역할 대조. 불합격이면 403 화면
3. **화면 교체** — 전부 끄고 목적지 하나만 켜기
4. **액자 맞추기** — 사이드바 표시 여부, 제목, 메뉴 강조
5. **진입 훅** — 그 화면의 render 함수 호출. **이 덕분에 다른 역할에서 카드를 바꿔도, 화면에 들어올 때마다 최신 상태가 보입니다**
6. **맨 위로 스크롤**

라우터의 "귀"는 `hashchange` 이벤트 — 주소창 해시가 바뀌면(뒤로가기 포함) 자동으로 navigate 가 실행됩니다. 그래서 `<a href="#approvals">` 같은 평범한 링크만으로 화면 전환이 됩니다.

### ③. `app/main.js` — 마지막 접착제

부팅의 마침표: `applyRoleUI(); navigate(location.hash || '#landing');` — 액자를 현재 역할로 맞추고 첫 화면에 불을 켭니다. (이 파일의 나머지는 랜딩 페이지 연출 등 — 챕터 09에서)

## 3. 자주 하는 질문

**Q. 왜 스크립트 순서가 중요한가요?**
뒤 파일이 앞 파일의 상수/함수를 쓰기 때문입니다. 예: session 이 config 의 `ROLES` 를 읽으므로 config 가 먼저여야 합니다. 순서표는 index.html 맨 아래 주석에 있습니다.

**Q. 새로고침하면 왜 로그인(역할)이 유지되나요?**
session 이 역할을 localStorage 에 저장해 두고, 부팅 때 복원하기 때문입니다. 카드 데이터가 유지되는 것도 같은 원리(챕터 05).

**Q. 주소를 직접 쳐서 남의 화면(#admin-cards)에 들어가면요?**
navigate 의 ② 출입 검사가 막고 403 화면을 보여줍니다. 단, 이것은 화면 차원의 잠금일 뿐이라 실서비스에서는 서버 쪽 검사도 필요합니다 (알려진 한계).

## 4. 5분 따라하기

1. `index.html?dev=1` 로 열기 (주소 뒤에 `?dev=1` — DEV 모드 강제 켜기).
2. 상단 DEV 바에서 역할을 `client` 로 → 주소창을 직접 `#admin-cards` 로 바꿔보기 → **403 화면**이 뜨는지 확인 (출입 검사 작동!).
3. DEV 바에서 `admin` 클릭 → 사이드바 메뉴가 5개(관리자용)로 바뀌는 것 확인 → 이게 `ORDO_ROLE` 대입 → `applyRoleUI()` 의 결과입니다.
4. F12 콘솔에서:
   ```js
   window.ORDO_ROLE            // 현재 역할 확인
   localStorage.getItem('ordo_active_role')  // 저장된 역할 — 새로고침해도 기억되는 이유
   ```

## 5. 이 챕터를 읽고 답할 수 있어야 하는 질문

1. 이 앱은 화면이 19개인데 HTML 파일은 왜 1개뿐인가?
2. `window.ORDO_ROLE = 'worker'` 한 줄을 실행하면 자동으로 일어나는 일 3가지는?
3. 권한 없는 화면 주소로 들어가면 어느 함수의 몇 번째 단계가 막아주는가?

<details><summary>정답 확인</summary>

1. 모든 화면이 한 건물(index.html) 안에 숨어 있고, 라우터가 하나에만 불을 켜는 방식이라서.
2. ① 유효성 검사 ② localStorage 저장 ③ applyRoleUI()로 액자 전체 갱신.
3. `navigate()` 의 ② 출입 검사(isRoleAllowed) — 불합격 시 403 화면으로 교체.

</details>

**다음 챕터** → `CODE_GUIDE_02_데이터_사전.md` (예정): 카드 한 장은 어떻게 생겼고, 창고(app/data)에는 무엇이 들어 있나.
