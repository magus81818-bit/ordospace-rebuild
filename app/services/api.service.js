/* ============================================================
   [이 파일은] 새 백엔드 API로 나가는 "유일한 창구"(outbound). fetch 를 감싸고
                JWT 토큰을 보관/첨부하며, 백엔드 계약(응답 형태) 그대로 돌려줍니다.
   [언제 실행] 로그인 등 실제 API가 필요할 때 화면/세션이 호출.
   [주요 등장인물]
     - signin(email,password) → 토큰 저장 후 token 반환 (POST /api/auth/signin → {token})
     - me()                   → 내 정보 (GET /api/users/me → {me})
     - authHeader()           → 저장된 JWT 를 Authorization 헤더로
   [연결] ← session.service.js(completeRealLogin) 가 호출 / → window.ORDO_API_BASE 를 읽음
   [수정할 때 주의] 에러는 {status, payload, message} 를 담아 throw 한다.
     status===401 은 인증/권한 실패, 그 외/네트워크 예외는 서버 도달 실패로 구분한다.
   ============================================================ */
window.ORDO_API = (function(){
  var TOKEN_KEY = 'ordo_jwt';

  function base(){ return window.ORDO_API_BASE || ''; }

  function getToken(){
    try { return (window.localStorage && localStorage.getItem(TOKEN_KEY)) || ''; }
    catch (e) { return ''; }
  }
  function setToken(token){
    try {
      if (!window.localStorage) return;
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch (e) { /* 저장 불가 환경이면 조용히 무시 */ }
  }
  function authHeader(){
    var t = getToken();
    return t ? { Authorization: 'Bearer ' + t } : {};
  }

  // 공통 요청기: JSON 요청/응답, 실패는 {status,message,payload} 로 throw
  async function request(method, path, body, useAuth){
    var res = await fetch(base() + path, {
      method: method,
      headers: Object.assign(
        { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        useAuth ? authHeader() : {}
      ),
      body: body ? JSON.stringify(body) : undefined
    });
    var data = await res.json().catch(function(){ return {}; });
    if (!res.ok) {
      var err = new Error(data && data.message ? data.message : ('요청 실패 (' + res.status + ')'));
      err.status = res.status;
      err.payload = data;
      throw err;
    }
    return data;
  }

  async function signin(email, password){
    var data = await request('POST', '/api/auth/signin', { email: email, password: password }, false);
    if (!data.token) { var e = new Error('토큰이 반환되지 않았습니다.'); e.status = 500; throw e; }
    setToken(data.token);
    return data.token;
  }

  async function me(){
    var data = await request('GET', '/api/users/me', null, true);
    return data.me;
  }

  // 역할별 카드 목록 (백엔드가 서버 측에서 역할 필터) → {cards:[...]}
  async function listModuleCards(){
    var data = await request('GET', '/api/module-cards', null, true);
    return data;
  }

  // 카드 상태전이 (Slice 3) — 모두 Bearer 필요, {card} 반환
  function createCard(payload){ return request('POST', '/api/module-cards', payload, true); }
  function updateCard(id, payload){ return request('PATCH', '/api/module-cards/' + id, payload, true); }
  function submitCard(id){ return request('POST', '/api/module-cards/' + id + '/submit', {}, true); }
  function sendToClient(id, payload){ return request('POST', '/api/module-cards/' + id + '/send-to-client', payload || {}, true); }
  function approveCard(id){ return request('POST', '/api/module-cards/' + id + '/approve', {}, true); }
  function requestRevisionCard(id, payload){ return request('POST', '/api/module-cards/' + id + '/request-revision', payload, true); }

  function signout(){ setToken(''); }

  return {
    TOKEN_KEY: TOKEN_KEY,
    base: base,
    getToken: getToken,
    setToken: setToken,
    authHeader: authHeader,
    request: request,
    signin: signin,
    me: me,
    listModuleCards: listModuleCards,
    createCard: createCard,
    updateCard: updateCard,
    submitCard: submitCard,
    sendToClient: sendToClient,
    approveCard: approveCard,
    requestRevisionCard: requestRevisionCard,
    signout: signout
  };
})();
