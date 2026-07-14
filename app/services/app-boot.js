/* ============================================================
   [이 파일은] 앱이 켜질 때 딱 두 가지를 챙기는 "시동 담당":
                ① 저장된 로그인(JWT)이 있으면 실인증 세션을 되살린다(새로고침 유지).
                ② 로그아웃 버튼([data-logout])을 눌렀을 때 토큰·세션·캐시를 정리한다.
   [언제 실행] 모든 앱 스크립트가 로드된 뒤 마지막에.
   [연결] ← index.html 이 마지막에 로드
          → session.service(rehydrateSession, completeRealSignout)
   [수정할 때 주의] 로그아웃 링크는 화면 어디에 있든 [data-logout] 만 붙으면 위임으로 잡힌다.
   ============================================================ */
(function(){
  var svc = window.ORDO_SESSION_SERVICE;
  if (!svc) return;

  // ① 새로고침 시 로그인 유지: 저장된 토큰으로 세션 복원 시도
  function boot(){
    if (svc.rehydrateSession) {
      svc.rehydrateSession().then(function(res){
        // 복원 성공 시 현재 화면을 새 데이터로 다시 그린다(라우터가 있으면).
        if (res && res.ok && typeof window.renderModuleRouteScreens === 'function') {
          var route = (location.hash || '#dashboard').replace('#','').split('?')[0] || 'dashboard';
          window.renderModuleRouteScreens(route);
        }
      });
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // ② 로그아웃 위임 핸들러: [data-logout] 클릭 시 정리 후 landing 으로
  document.addEventListener('click', function(e){
    var trigger = e.target && e.target.closest && e.target.closest('[data-logout]');
    if (!trigger) return;
    if (svc.completeRealSignout) svc.completeRealSignout();
    // 링크의 기본 이동(#landing)은 그대로 두되, 세션 정리를 먼저 끝낸다.
  });
})();
