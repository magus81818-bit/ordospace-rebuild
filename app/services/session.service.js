/* ============================================================
   [이 파일은] "지금 누구로 로그인해 있는가"를 기억하는 신분증 발급소.
                현재 역할을 localStorage 에 보관하고, 로그인 후 어느 홈으로
                보낼지 결정합니다. (실서버 없이 도는 시연용 mock 로그인 포함)
   [언제 실행] 페이지 로드 시 저장된 역할을 복원하고, 이후 역할 전환/로그인
                버튼을 누를 때마다 호출됩니다.
   [주요 등장인물]
     - window.ORDO_ROLE     : 현재 역할이 담긴 "특별한 전역 변수" (아래 참고)
     - setActiveRoleAndGoHome : 역할을 바꾸고 그 역할의 홈으로 이동
     - completeMockLogin    : 로그인 폼 제출을 시연용으로 처리
   [연결] ← auth 화면·역할 전환 버튼이 호출 / → config 의 ROLES, ROLE_HOME 을 읽음
   [다음 읽을 파일] app/layout/app-shell.js (역할이 바뀌면 액자를 다시 그리는 곳)
   [수정할 때 주의] 실제 백엔드가 생기면 mock 세션 생성부가 API 응답 처리로 바뀝니다.
   ============================================================ */

const ORDO_SESSION_KEYS = {
  activeRole: 'ordo_active_role',
};

function isOrdoRole(role) {
  return ROLES.includes(role);
}

function getStoredOrdoRole() {
  const stored = localStorage.getItem(ORDO_SESSION_KEYS.activeRole);
  return isOrdoRole(stored) ? stored : 'client';
}

function persistOrdoRole(role) {
  if (!isOrdoRole(role)) return false;
  localStorage.setItem(ORDO_SESSION_KEYS.activeRole, role);
  return true;
}

// 【이 파일의 핵심 장치】 window.ORDO_ROLE 을 "지능형 변수"로 만듭니다.
// 겉보기엔 평범한 변수지만, 값을 대입하는 순간(ORDO_ROLE = 'admin')
// ① 유효한 역할인지 검사하고 ② localStorage 에 저장하고 ③ 화면 액자를 다시 그립니다.
// 그래서 코드 어디서든 역할만 바꾸면 나머지가 자동으로 따라옵니다.
(function initOrdoRoleState(){
  let activeRole = getStoredOrdoRole();
  Object.defineProperty(window, 'ORDO_ROLE', {
    get(){ return activeRole; },
    set(nextRole){
      if (!persistOrdoRole(nextRole)) return;
      activeRole = nextRole;
      if (typeof applyRoleUI === 'function') applyRoleUI();
    },
    configurable: false
  });
})();

function setActiveRole(role) {
  window.ORDO_ROLE = role;
  return window.ORDO_ROLE;
}

function getRoleHomeRoute(role = window.ORDO_ROLE) {
  return ROLE_HOME[role] || 'landing';
}

function moveToRoute(route) {
  const nextRoute = route || 'landing';
  const nextHash = '#' + nextRoute;
  if (location.hash === nextHash && typeof window.navigate === 'function') {
    window.navigate(nextHash);
  } else {
    location.hash = nextRoute;
  }
  return nextRoute;
}

function goRoleHome(role = window.ORDO_ROLE) {
  return moveToRoute(getRoleHomeRoute(role));
}

function setActiveRoleAndGoHome(role) {
  setActiveRole(role);
  return goRoleHome(role);
}

// 시연용 규칙: 이메일 주소만 보고 역할을 추측합니다.
// admin이 들어가면 관리자, worker/partner/engineer 가 들어가면 작업자, 나머지는 클라이언트.
function resolveRoleFromAccount(email) {
  const value = String(email || '').toLowerCase();
  const localPart = value.split('@')[0] || '';
  if (localPart.includes('admin') || value.endsWith('@ordo.systems')) return 'admin';
  if (localPart.includes('worker') || localPart.includes('partner') || localPart.includes('engineer')) return 'worker';
  return 'client';
}

function createMockSession(email, roles) {
  const validRoles = (roles || []).filter(isOrdoRole);
  const session = {
    email: email || 'demo@ordo.systems',
    roles: validRoles.length ? validRoles : ['client'],
  };
  window._ordoSession = session;
  return session;
}

// [버튼: 로그인 폼 제출] 시연용 로그인 마무리.
// multi(여러 역할 계정)면 역할 선택 화면으로, 아니면 곧장 그 역할의 홈으로 보냅니다.
function completeMockLogin(email, resolvedRole, multi) {
  const role = isOrdoRole(resolvedRole) ? resolvedRole : resolveRoleFromAccount(email);
  if (multi) {
    window._mockUserRoles = ['admin','client','worker'];
    createMockSession(email, window._mockUserRoles);
    setActiveRole(role);
    const hasWorkspaceScreen = !!document.getElementById('screen-select-workspace');
    return moveToRoute(hasWorkspaceScreen ? 'select-workspace' : getRoleHomeRoute(role));
  }
  createMockSession(email, [role]);
  setActiveRole(role);
  return goRoleHome(role);
}

// 백엔드 role(ADMIN/WORKER/CLIENT) → 프론트 role(admin/worker/client) 매핑.
function mapBackendRole(role) {
  const lowered = String(role || '').toLowerCase();
  return isOrdoRole(lowered) ? lowered : 'client';
}

// [실인증] 로그인 폼 제출을 진짜 백엔드로 처리합니다 (JWT + 실제 사용자/역할).
// 성공: 토큰 저장(api.service) + 실제 신분을 _ordoSession 에 담고 그 역할 홈으로 이동.
// 실패는 그대로 throw — 화면 쪽이 401(자격 실패)과 그 외(서버 도달 실패)를 구분해 처리.
async function completeRealLogin(email, password) {
  const api = window.ORDO_API;
  if (!api) throw new Error('API 서비스가 로드되지 않았습니다.');
  await api.signin(email, password);        // 토큰 발급·저장
  const me = await api.me();                 // 실제 내 정보
  const role = mapBackendRole(me && me.role);
  const session = {
    email: (me && me.email) || email,
    roles: [role],
    userId: me && me.id,
    username: me && me.username,
    role,
    authenticated: true,
  };
  window._ordoSession = session;
  // 옛 serverless 원격(/api/module-cards 전체교체)이 새 백엔드 sync와 충돌하지 않게 끈다.
  window.ORDO_DISABLE_MODULE_CARD_REMOTE = true;
  setActiveRole(role);
  // 새 백엔드에서 카드를 받아 기존 UI에 채운다(실패해도 mock 카드로 계속).
  if (window.ORDO_MODULE_CARD_BACKEND) {
    try { await window.ORDO_MODULE_CARD_BACKEND.sync(); } catch (e) { /* 무해: mock 유지 */ }
  }
  goRoleHome(role);
  return session;
}

// [새로고침 유지] 로드 시 저장된 JWT 로 실인증 세션을 되살린다.
// 성공: 실제 신분 복원 + 역할 UI + 카드 sync (현재 화면은 유지, 강제 이동 안 함).
// 실패(토큰 만료/무효): 토큰 폐기하고 데모 모드로.
async function rehydrateSession() {
  const api = window.ORDO_API;
  if (!api || !api.getToken()) return { ok: false, reason: 'no-token' };
  try {
    const me = await api.me();
    if (!me) throw new Error('내 정보를 확인할 수 없습니다.');
    const role = mapBackendRole(me.role);
    window._ordoSession = {
      email: me.email,
      roles: [role],
      userId: me.id,
      username: me.username,
      role,
      authenticated: true,
    };
    window.ORDO_DISABLE_MODULE_CARD_REMOTE = true;
    setActiveRole(role);
    if (window.ORDO_MODULE_CARD_BACKEND) {
      try { await window.ORDO_MODULE_CARD_BACKEND.sync(); } catch (e) { /* 무해 */ }
    }
    return { ok: true, role };
  } catch (e) {
    api.signout();
    window._ordoSession = null;
    return { ok: false, reason: 'invalid-token' };
  }
}

// 실인증 로그아웃: 토큰 폐기 + 세션 정리 + 옛 카드 캐시 제거.
function completeRealSignout() {
  if (window.ORDO_API) window.ORDO_API.signout();
  window._ordoSession = null;
  window.ORDO_DISABLE_MODULE_CARD_REMOTE = false;
  // 로그아웃 후 데모 방문에 서버 카드 잔재가 남지 않게 mock 카드 캐시를 지운다.
  try {
    const key = (window.ORDO_MODULE_CARD_LIFECYCLE && window.ORDO_MODULE_CARD_LIFECYCLE.STORAGE_KEY)
      || 'ordospace.static.moduleCards.v1';
    if (window.localStorage) localStorage.removeItem(key);
  } catch (e) { /* 무해 */ }
}

window.ORDO_SESSION_SERVICE = {
  keys: ORDO_SESSION_KEYS,
  isRole: isOrdoRole,
  getActiveRole: () => window.ORDO_ROLE,
  setActiveRole,
  getRoleHomeRoute,
  moveToRoute,
  goRoleHome,
  setActiveRoleAndGoHome,
  resolveRoleFromAccount,
  createMockSession,
  completeMockLogin,
  mapBackendRole,
  completeRealLogin,
  completeRealSignout,
  rehydrateSession,
};

document.querySelectorAll('[data-role-switch]').forEach(button => {
  button.addEventListener('click', () => {
    window.ORDO_SESSION_SERVICE.setActiveRoleAndGoHome(button.getAttribute('data-role-switch'));
  });
});

document.querySelectorAll('[data-ws-role]').forEach(button => {
  button.addEventListener('click', () => {
    window.ORDO_SESSION_SERVICE.setActiveRoleAndGoHome(button.getAttribute('data-ws-role'));
  });
});
