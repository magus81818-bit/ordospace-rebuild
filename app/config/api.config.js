/* ============================================================
   [이 파일은] 새 백엔드(Render/로컬 Express) API의 "주소 한 곳" — 오리진 단일 정의.
   [언제 실행] 페이지 로드 시 app.config.js 바로 다음(다른 API 호출보다 먼저).
   [주요 등장인물]
     - window.ORDO_API_BASE : 모든 API 호출이 앞에 붙이는 백엔드 오리진
   [연결] ← app/services/api.service.js 가 이 값을 읽어 fetch 주소를 만듦
   [수정할 때 주의] 배포(R4) 시 프론트(Vercel)와 백엔드(Render)는 오리진이 다르므로,
     index.html 에 <meta name="ordo-api-base" content="https://<서비스>.onrender.com">
     를 넣거나 window.ORDO_API_BASE 를 먼저 지정하면 그 값이 우선한다.
   ============================================================ */
window.ORDO_API_BASE = window.ORDO_API_BASE || (function resolveApiBase(){
  // 1) 명시적 <meta> 주입이 있으면 최우선 (배포용)
  var meta = document.querySelector('meta[name="ordo-api-base"]');
  if (meta && meta.content && meta.content.trim()) {
    return meta.content.trim().replace(/\/+$/, '');
  }
  // 2) 로컬 개발: localhost 프론트 → 로컬 백엔드(3000)
  var host = location.hostname;
  if (host === 'localhost' || host === '127.0.0.1' || host === '') {
    return 'http://localhost:3000';
  }
  // 3) 그 외(배포인데 meta 미주입): 빈 값 → api.service 가 실백엔드 비활성으로 간주(mock 폴백)
  return '';
})();
