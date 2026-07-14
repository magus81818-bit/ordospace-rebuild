/* ============================================================
   [이 파일은] 실인증 로그인 후 "새 백엔드에서 카드를 받아 기존 UI에 채우는" 동기화기.
                기존 법률 파일(module-card-lifecycle.service.js)은 건드리지 않고,
                옛 serverless 원격은 플래그로 끈 뒤 이 파일이 카드의 원천이 됩니다.
   [언제 실행] session.service 의 completeRealLogin 성공 직후.
   [연결] ← session.service(completeRealLogin) 가 sync() 호출
          → api.service.listModuleCards(), module-card.adapter, window.ORDO_MODULE_CARDS/PEOPLE
   [수정할 때 주의] worker 세션은 백엔드가 이미 '내 카드'만 반환하므로, 화면의 고정 필터
                     (ORDO_CURRENT_WORKER='worker-001')에 맞춰 assignedTo 를 그 키로 정렬한다.
   ============================================================ */
window.ORDO_MODULE_CARD_BACKEND = (function(){

  function currentRouteId(){
    return (location.hash || '#dashboard').replace('#','').split('?')[0] || 'dashboard';
  }

  function rerender(){
    if (typeof window.renderModuleRouteScreens === 'function') {
      window.renderModuleRouteScreens(currentRouteId());
    }
  }

  // 서버 담당자 이름표를 기존 people 맵(const 객체)에 병합(재할당 아닌 mutate)
  function mergePeople(serverPeople){
    if (typeof ORDO_MODULE_PEOPLE !== 'undefined' && ORDO_MODULE_PEOPLE) {
      Object.assign(ORDO_MODULE_PEOPLE, serverPeople);
    }
    window.ORDO_MODULE_PEOPLE = Object.assign({}, window.ORDO_MODULE_PEOPLE || {}, serverPeople);
  }

  async function sync(){
    var api = window.ORDO_API;
    var adapter = window.ORDO_MODULE_CARD_ADAPTER;
    if (!api || !adapter) return { ok:false, reason:'not-loaded' };
    var session = window._ordoSession;
    if (!(session && session.authenticated)) return { ok:false, reason:'not-authenticated' };

    try {
      var data = await api.listModuleCards();
      var list = (data && data.cards) || [];

      mergePeople(adapter.peopleFrom(list));
      var cards = adapter.toFrontendCards(list);

      // worker 화면은 assignedTo==='worker-001' 로 고정 필터한다.
      // 백엔드가 이미 이 worker 의 카드만 돌려주므로 전부 그 키로 정렬해 화면에 노출.
      if (session.role === 'worker') {
        cards.forEach(function(c){ c.assignedTo = 'worker-001'; });
      }

      window.ORDO_MODULE_CARDS = cards;
      rerender();
      return { ok:true, count: cards.length };
    } catch (err) {
      // 실패해도 앱은 기존 mock 카드로 계속 동작(동작 보존)
      return { ok:false, error: (err && err.message) || String(err) };
    }
  }

  return { sync: sync };
})();
