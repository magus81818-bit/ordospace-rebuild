/* ============================================================
   [이 파일은] 부품 공장의 "공용 도구함" — 모든 팩토리가 공유하는 기초 유틸리티.
                글자 안전 처리(escape), 날짜 포맷, 퍼센트 계산 등 가장 기본적인 도구들.
   [언제 실행] 페이지 로드 시 components 폴더 파일 중 가장 먼저 (다른 팩토리가 이 도구를 씀).
   [주요 등장인물]
     - escapeHtml     : 입력값의 특수문자를 무해하게 변환 (XSS 방지)
     - cx             : CSS 클래스명을 조건부로 합치는 도우미
     - fallbackText   : 값이 비었으면 기본값('-')으로 대체
     - safePct        : 안전한 퍼센트 계산 (0으로 나누기 방지)
     - todayDateText / nowDisplayText : 오늘 날짜·현재 시각 문자열
     - dateRank       : 날짜를 숫자로 바꿔 정렬에 사용
     - routeParams    : 주소의 ?key=value 를 읽는 도우미
   [연결] ← 모든 components/*.ui.js 와 screens/*.screen.js 가 사용
          → 없음 (의존성 없는 순수 함수들)
   [다음 읽을 파일] app/ui/components/status.ui.js (색조와 배지를 만드는 팩토리)
   [수정할 때 주의] escapeHtml 을 바꾸면 XSS 방어가 무너질 수 있습니다.
                     validate-static-components 가 이 함수의 호출 여부를 검사합니다.
   ============================================================ */
(function(){
  // XSS 방지: 사용자 입력에 들어있을 수 있는 위험한 문자(&, <, >, ", ')를
  // HTML 엔티티로 바꿔서, 입력이 코드로 실행되는 사고를 막습니다.
  // 모든 팩토리의 사용자 데이터 출력에 반드시 이 함수를 거칩니다.
  function escapeHtml(v){
    return String(v == null ? '' : v).replace(/[&<>"']/g, function(ch){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch];
    });
  }

  // CSS 클래스 합치기: 조건이 false/null인 것은 빼고 나머지를 공백으로 연결.
  // 예: cx('base', isActive && 'active', null) → 'base active'
  function cx(){
    return Array.prototype.filter.call(arguments, Boolean).join(' ');
  }

  // 빈 값이면 기본 표시('-')로 대체. 화면에 undefined 가 찍히는 것을 방지.
  function fallbackText(v, fallback){
    const text = String(v == null ? '' : v).trim();
    return text || (fallback == null ? '-' : fallback);
  }

  // 안전한 퍼센트: total 이 0이면 0 반환 (0으로 나누기 = Infinity 방지).
  function safePct(part, total){
    return total ? Math.round((part / total) * 100) : 0;
  }

  /* ── 날짜/시각 유틸 ── */
  // 오늘 날짜를 '2026-07-06' 형식으로. lifecycle 의 today() 도 이 함수를 재사용.
  function todayDateText(){
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  // 현재 시각을 '2026-07-06 14:05' 형식으로. 코멘트 타임스탬프에 사용.
  function nowDisplayText(){
    const d = new Date();
    return todayDateText() + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  // 날짜 문자열을 숫자(밀리초)로 변환. 정렬할 때 사용 (큰 수 = 더 최근).
  function dateRank(v){
    const t = Date.parse(String(v || ''));
    return Number.isFinite(t) ? t : 0;
  }

  // ISO 날짜를 화면 표시용으로 잘라냄. '2026-06-04T12:30' → '2026-06-04 12:30'
  function displayDate(v){
    if (!v) return '-';
    return String(v).slice(0, 16).replace('T', ' ');
  }

  // 현재 주소의 쿼리 파라미터를 읽는 도우미.
  // 예: #admin-cards?cardId=mc-001 → routeParams().get('cardId') = 'mc-001'
  function routeParams(){
    return new URLSearchParams((location.hash || '').split('?').slice(1).join('?'));
  }

  window.ORDO_UI_COMPONENTS = Object.assign(window.ORDO_UI_COMPONENTS || {}, {
    escapeHtml,
    cx,
    fallbackText,
    safePct,
    todayDateText,
    nowDisplayText,
    dateRank,
    displayDate,
    routeParams
  });
})();
