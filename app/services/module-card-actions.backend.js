/* ============================================================
   [이 파일은] 실인증 세션일 때, 기존 lifecycle 서비스의 "상태전이" 메서드를
                백엔드 API 호출판으로 바꿔치기(override)하는 어댑터.
                화면 3개와 법률 파일(lifecycle.service)은 건드리지 않는다 —
                화면은 여전히 lifecycle.submitWorkerReview(...) 를 부르지만,
                인증 상태면 이 파일이 심어둔 백엔드판이 실행된다.
   [언제 실행] 로드 시 1회 메서드 교체(원본은 보관). 인증 여부는 호출 시점에 판단.
   [연결] ← 화면 버튼들이 lifecycle.<action> 호출
          → api.service(전이 엔드포인트), module-card-backend.sync(재조회)
   [수정할 때 주의] 비인증(데모)이거나 서버카드가 아니면(_serverId 없음) 원본 로컬 동작으로 폴백.
                     생성(createAdminCards)/reassign/setDueDate/QC토글 등은 백엔드 엔드포인트가
                     없어 여기서 다루지 않는다(로컬 데모 유지).
   ============================================================ */
(function(){
  var L = window.ORDO_MODULE_CARD_LIFECYCLE;
  var api = window.ORDO_API;
  if (!L || !api) return;

  function authed(){ return !!(window._ordoSession && window._ordoSession.authenticated); }
  function sid(card){ return card && card._serverId; }
  async function resync(){
    if (window.ORDO_MODULE_CARD_BACKEND) {
      try { await window.ORDO_MODULE_CARD_BACKEND.sync(); } catch (e) { /* 무해 */ }
    }
  }
  function fail(err){
    if (typeof alert === 'function') alert((err && err.message) || '처리할 수 없습니다.');
  }
  // 백엔드 전이 실행 후 재조회. 실패해도 alert 후 재조회로 실제 상태 반영.
  function run(taskFn){
    (async () => {
      try { await taskFn(); await resync(); }
      catch (e) { fail(e); await resync(); }
    })();
  }

  // 원본(로컬) 메서드 보관 — 비인증/데모 폴백용
  var orig = {
    submitWorkerReview: L.submitWorkerReview,
    sendAdminToClient: L.sendAdminToClient,
    markDone: L.markDone,
    approveClient: L.approveClient,
    requestRevision: L.requestRevision
  };

  // worker "리뷰 요청": 백엔드는 QC_READY(진행100+PASSED)에서만 submit 가능 → PATCH 후 submit
  L.submitWorkerReview = function(card, workerId, note){
    if (!authed() || !sid(card)) return orig.submitWorkerReview.call(L, card, workerId, note);
    run(async () => {
      await api.updateCard(sid(card), { progress: 100, qcStatus: 'PASSED', note: note || undefined });
      await api.submitCard(sid(card));
    });
    return card;
  };

  // admin "Client 전달" / "완료 처리" → send-to-client
  L.sendAdminToClient = function(card, note){
    if (!authed() || !sid(card)) return orig.sendAdminToClient.call(L, card, note);
    run(async () => { await api.sendToClient(sid(card), note ? { note: note } : {}); });
    return card;
  };
  L.markDone = function(card){
    if (!authed() || !sid(card)) return orig.markDone.call(L, card);
    run(async () => { await api.sendToClient(sid(card), {}); });
    return card;
  };

  // client "승인" → approve
  L.approveClient = function(card, note){
    if (!authed() || !sid(card)) return orig.approveClient.call(L, card, note);
    run(async () => { await api.approveCard(sid(card)); });
    return card;
  };

  // "수정 요청" → 백엔드는 CLIENT 만 가능. client 요청만 백엔드로, admin 요청은 로컬 유지.
  L.requestRevision = function(card, options){
    options = options || {};
    if (!authed() || !sid(card) || options.role !== 'client') {
      return orig.requestRevision.call(L, card, options);
    }
    run(async () => { await api.requestRevisionCard(sid(card), { note: options.note }); });
    return card;
  };
})();
