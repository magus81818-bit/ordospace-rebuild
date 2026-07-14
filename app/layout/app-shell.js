/* ============================================================
   [이 파일은] 모든 화면이 공유하는 "액자" — 사이드바, 상단바, 알림판,
                모바일 하단 탭, 햄버거 드로어, 다크모드 토글을 담당합니다.
                액자 안의 그림(화면 내용)은 screens/ 폴더 담당.
   [언제 실행] 페이지 로드 시 준비되고, 역할이 바뀔 때마다 applyRoleUI 가
                액자 전체(메뉴/프로필/알림/탭)를 그 역할에 맞게 다시 그립니다.
   [주요 등장인물]
     - applyRoleUI   : 역할 전환의 총지휘자 (아래 6개 render 를 한꺼번에 호출)
     - setShell      : 로그인 전/후에 따라 사이드바를 숨기거나 보임
     - renderSideMenu / renderMobileTab : 역할별 메뉴 구성 (config 의 MENU 를 읽음)
     - renderNotifList + getNotificationTarget : 알림판 내용과 클릭 시 이동할 곳
   [연결] ← session(역할 변경 시)과 router(화면 전환 시)가 호출
          → config 의 MENU/ROLE_PROFILE/ROLE_CTA 를 읽음
   [다음 읽을 파일] app/data/workspace.data.js (화면에 담길 데이터의 창고 — 챕터 02)
   [수정할 때 주의] 메뉴 항목을 바꾸려면 이 파일이 아니라 config 의 MENU 를 고치세요.
                     이 파일은 "그리는 방법"만 알고 "무엇을 그릴지"는 config 소관입니다.
   ============================================================ */

/* APP SHELL CORE */
// Lucide 아이콘 다시 그리기. innerHTML 로 새 HTML 을 넣은 뒤에는 아이콘이
// 빈 <i> 태그 상태라, 이 함수를 불러야 실제 그림으로 바뀝니다.
function refreshIcons(){ if (window.lucide) lucide.createIcons(); }
refreshIcons();

/* Role, route, menu, and label config moved to app/config/app.config.js */

/* ============== 쉘 표시/숨김 제어 (role + authOff) ============== */
// body 태그에 클래스를 붙였다 뗐다 하면, CSS 가 그 클래스를 보고
// 사이드바를 숨기거나(auth-off) 역할별 색/표시를 바꿉니다.
function setShell(role, authOff) {
  document.body.classList.toggle('auth-off', authOff);
  document.body.classList.toggle('auth-on',  !authOff);
  // role-* 클래스: 항상 하나만
  ROLES.forEach(r => document.body.classList.toggle('role-' + r, r === role));
}

/* ============== 사이드바 / 드로어 메뉴 동적 렌더 ============== */
function badgeClass(tone){
  return ({
    crit:'bg-st-critbg text-st-critfg border-st-critbd',
    warn:'bg-st-warnbg text-st-warnfg border-st-warnbd',
    pend:'bg-st-pendbg text-st-pendfg border-st-pendbd',
    ok:  'bg-st-okbg text-st-okfg border-st-okbd',
    rej: 'bg-st-rejbg text-st-rejfg border-st-rejbd',
  })[tone] || 'bg-bg-tertiary text-tx-secondary border-bd-default';
}
function renderSideMenu(role){
  const nav = document.getElementById('sideMenu');
  if (!nav) return;
  const items = MENU[role] || [];
  nav.innerHTML = items.map(it => {
    const badge = it.badge ? `<span class="ml-auto text-[11px] font-semibold border rounded px-1.5 py-0.5 ${badgeClass(it.badge.tone)}">${it.badge.text}</span>` : '';
    const profileTab = it.profileTab ? ` data-profile-tab="${it.profileTab}"` : '';
    return `<a href="#${it.to}"${profileTab} class="side-link flex items-center gap-3 px-3 py-2 rounded-lg text-tx-secondary hover:bg-bg-secondary" data-match="${it.to}">
      <i data-lucide="${it.icon}" class="w-4 h-4"></i><span>${it.label}</span>${badge}
    </a>`;
  }).join('');
}
function renderDrawerMenu(role){
  const nav = document.getElementById('drawerMenu');
  if (!nav) return;
  const items = MENU[role] || [];
  nav.innerHTML = items.map(it => {
    const badge = it.badge ? `<span class="ml-auto text-[11px] font-semibold border rounded px-1.5 py-0.5 ${badgeClass(it.badge.tone)}">${it.badge.text}</span>` : '';
    const profileTab = it.profileTab ? ` data-profile-tab="${it.profileTab}"` : '';
    return `<a href="#${it.to}"${profileTab} class="drawer-link flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-bg-secondary" data-match="${it.to}">
      <i data-lucide="${it.icon}" class="w-4 h-4"></i>${it.label}${badge}
    </a>`;
  }).join('');
}
// 프로필 블록: 사이드바·탑바·모바일헤더의 이름/이니셜을 현재 역할에 맞게 갱신.
// applyRoleUI 가 역할 전환 시 자동 호출합니다.
function renderProfileBlock(role){
  const p = ROLE_PROFILE[role] || ROLE_PROFILE.client;
  const el1 = document.getElementById('sideProfileInitial'); if (el1) el1.textContent = p.initial;
  const el2 = document.getElementById('sideProfileName');    if (el2) el2.textContent = p.name;
  const el3 = document.getElementById('sideProfileRole');    if (el3) el3.textContent = p.sub;
  // [v2.1.0 — T8] 탑바 / 모바일헤더 아바타 이니셜 동기화
  const tAv = document.getElementById('topbarAvatarInitial'); if (tAv) tAv.textContent = p.initial;
  const mAv = document.getElementById('mHeaderAvatarInitial'); if (mAv) mAv.textContent = p.initial;
  const ppInitial = document.getElementById('profilePanelInitial'); if (ppInitial) ppInitial.textContent = p.initial;
  const ppName = document.getElementById('profilePanelName'); if (ppName) ppName.textContent = p.name;
  const ppRole = document.getElementById('profilePanelRole'); if (ppRole) ppRole.textContent = p.sub;
}

/* [v2.1.0 — T8] 탑바 Primary CTA 렌더 */
// 상단바 오른쪽의 "큰 버튼 1개" — 역할마다 다름(admin:"Module 관리", client:"승인 검토"…).
// config 의 ROLE_CTA 를 읽어 링크 또는 액션 버튼을 찍어냅니다.
function renderTopbarCTA(role){
  const wrap = document.getElementById('topbarPrimaryCta');
  if (!wrap) return;
  const c = ROLE_CTA[role] || ROLE_CTA.client;
  const btnClass = 'h-9 px-3.5 text-[13px] font-semibold bg-brand-primary hover:bg-brand-hover text-white rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap shrink-0';
  if (c.href) {
    wrap.innerHTML = `<a href="${c.href}" class="${btnClass}" aria-label="${c.aria}"><i data-lucide="${c.icon}" class="w-4 h-4"></i><span>${c.label}</span></a>`;
  } else {
    wrap.innerHTML = `<button type="button" data-cta-action="${c.action}" class="${btnClass}" aria-label="${c.aria}"><i data-lucide="${c.icon}" class="w-4 h-4"></i><span>${c.label}</span></button>`;
  }
}

/* [v2.1.0 — T8] 알림 드롭다운 렌더 (#notifList) */
// 알림을 클릭하면 어디로 갈지 정하는 이정표. 알림의 category(승인 요청, 배정 등)를
// 역할별 목적지 화면에 연결합니다. 모르는 종류면 프로필로.
function getNotificationTarget(role, n){
  const category = n?.category || '';
  const maps = {
    admin: { intake:'#admin-cards', escalation:'#admin-cards', partner_onboarding:'#admin-team', contract_expiry:'#admin-projects', system:'#profile' },
    client: { approval_request:'#approvals', change_request:'#approvals', submission:'#approvals', system:'#profile' },
    worker: { assignment:'#worker-cards', submission_feedback:'#worker-cards', blocker_response:'#worker-cards', system:'#profile' }
  };
  return maps[role]?.[category] || '#profile';
}

function renderNotifList(role){
  const ul = document.getElementById('notifList');
  if (!ul) return;
  const items = (window.ORDO_NOTIFICATIONS && window.ORDO_NOTIFICATIONS[role]) || [];
  const toneColor = { crit:'text-st-critfg', warn:'text-st-warnfg', pend:'text-st-pendfg', ok:'text-st-okfg' };
  ul.innerHTML = items.map(n => {
    const iconColor = toneColor[n.tone] || 'text-tx-secondary';
    const unreadBg = n.unread ? 'bg-st-pendbg/30' : '';
    const href = getNotificationTarget(role, n);
    const profileTab = href === '#profile' ? ' data-profile-tab="notif"' : '';
    return `<li class="${unreadBg}" data-notif-category="${n.category||''}">
      <a href="${href}"${profileTab} class="flex gap-2 p-3 hover:bg-bg-secondary">
        <i data-lucide="${n.icon}" class="w-4 h-4 ${iconColor} shrink-0 mt-0.5"></i>
        <div class="flex-1 min-w-0">
          <div class="truncate">${n.title}</div>
          <div class="text-[11px] text-tx-tertiary">${n.sub}</div>
        </div>
      </a>
    </li>`;
  }).join('');
}

/* [v2.1.0 — T8] 모바일 하단 탭바 렌더 (MTAB_MENU[role]) */
// 모바일 화면 맨 아래 고정 탭 바. 역할마다 표시할 탭이 다르므로 HTML 을 갈아끼움.
// config 의 MTAB_MENU[role] 을 읽어 아이콘+라벨+뱃지를 그립니다.
function renderMobileTab(role){
  const nav = document.getElementById('mtab');
  if (!nav) return;
  const items = MTAB_MENU[role] || [];
  const badgeTone = { crit:'bg-st-critfg', warn:'bg-st-warnfg', pend:'bg-st-pendfg', ok:'bg-st-okfg' };
  nav.innerHTML = items.map(it => {
    const badge = it.badge ? `<span class="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full ${badgeTone[it.badgeTone]||'bg-st-critfg'} text-white text-[10px] font-semibold inline-flex items-center justify-center">${it.badge}</span>` : '';
    const iconWrap = it.badge
      ? `<div class="relative"><i data-lucide="${it.icon}" class="w-5 h-5"></i>${badge}</div>`
      : `<i data-lucide="${it.icon}" class="w-5 h-5"></i>`;
    const goMy = it.goMy ? 'data-go-my="1"' : '';
    const profileTab = it.profileTab ? `data-profile-tab="${it.profileTab}"` : '';
    const match = it.matchExtra || it.to;
    return `<a href="#${it.to}" data-tab-bar="${match}" ${goMy} ${profileTab} class="mtab-link flex-1 min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-tx-tertiary relative">
      ${iconWrap}<span class="text-[10px] font-medium">${it.label}</span>
    </a>`;
  }).join('');
  // 재바인딩: '더보기' 탭 클릭 시 window._goMy 설정
  nav.querySelectorAll('[data-go-my]').forEach(a => {
    a.addEventListener('click', () => { window._goMy = true; });
  });
}

/* ============== 역할 적용 (UI 전체 갱신) ============== */
// 【이 파일의 총지휘자】 역할이 바뀌는 순간 액자의 모든 부품을 다시 그립니다.
// session.service 의 ORDO_ROLE 대입이 자동으로 이 함수를 부릅니다 (부수효과).
function applyRoleUI(){
  const role = window.ORDO_ROLE;
  // [v2.1.0 — T8] FOUC 방지: 렌더 전에 최소 쉘 상태 확정
  if (!document.body.classList.contains('auth-on') && !document.body.classList.contains('auth-off')) {
    setShell(role, true);
  }
  renderSideMenu(role);
  renderDrawerMenu(role);
  renderProfileBlock(role);
  renderTopbarCTA(role);
  renderNotifList(role);
  renderMobileTab(role);
  // DEV role pill 활성화 표시
  document.querySelectorAll('[data-role-switch]').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-role-switch') === role);
  });
  refreshIcons();
}

/* [v2.1.0 — T8] 탑바 CTA 클릭 핸들러 (이벤트 위임) */
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-cta-action]');
  if (!btn) return;
  const act = btn.getAttribute('data-cta-action');
  if (act === 'openInvitePartner') {
    const sheet = document.getElementById('invitePartnerSheet');
    if (sheet) { sheet.classList.remove('hidden'); sheet.setAttribute('aria-hidden','false'); }
    else { location.hash = 'admin-team'; }
  } else if (act === 'openWorkerAsk') {
    const sheet = document.getElementById('wkAskSheet');
    if (sheet) { sheet.classList.remove('hidden'); sheet.setAttribute('aria-hidden','false'); }
    else { window.ordoToast?.('질문 등록 시트를 준비 중입니다','warn'); }
  }
});
// 동적 렌더되는 #drawerMenu 내부 링크도 드로어 닫기 — 이벤트 위임 사용 (중복 바인딩 방지)
document.getElementById('drawerMenu')?.addEventListener('click', (e) => {
  if (e.target.closest('.drawer-link')) closeDrawerSafe();
});
function closeDrawerSafe(immediate){
  const d = document.getElementById('drawerOverlay');
  const p = d?.querySelector('.drawer');
  p?.classList.remove('open');
  if (immediate) {
    d?.classList.add('hidden');
    if (d) d.style.display = 'none';
    return;
  }
  setTimeout(() => {
    d?.classList.add('hidden');
    if (d) d.style.display = 'none';
  }, 200);
}

/* ============== 해시 기반 라우팅 ==============
   Router layer moved to app/router/hash-router.js.
   main.js는 이제 역할 적용, 화면 렌더링, UI 이벤트 중심으로 남겨둔다.
*/
/* ============== DEV 네비 (localStorage 토글) ============== */
document.querySelectorAll('.dev-btn').forEach(b =>
  b.addEventListener('click', () => { location.hash = b.getAttribute('data-goto'); })
);

/* Role switch and workspace role selection moved to app/services/session.service.js */

/* ============== [v1.1.0] 403 화면 "내 홈" ============== */
document.getElementById('forbiddenGoHome')?.addEventListener('click', () => {
  location.hash = ROLE_HOME[window.ORDO_ROLE] || 'landing';
});
(function initDevNav(){
  /* [v2.1.0 — T8] dev_mode 토글 정책
     기본값: 'off'. localStorage 'dev_mode' 기준.
     - body.dev-mode-on 클래스를 통해 CSS가 devNav/devNavReopen/캡션 전체를 on/off.
     - body.auth-off 에서는 CSS가 강제로 숨김(프로덕션 보호).
   */
  const DEV_KEY = 'dev_mode';
  if (localStorage.getItem(DEV_KEY) === null) localStorage.setItem(DEV_KEY, 'off');
  // [v2.5.0] 시연 시 빠른 토글: URL에 ?dev=1 이 있으면 dev_mode를 'on'으로 강제
  if (new URLSearchParams(location.search).get('dev') === '1') localStorage.setItem(DEV_KEY, 'on');
  const applyDevMode = () => {
    const on = localStorage.getItem(DEV_KEY) === 'on';
    document.body.classList.toggle('dev-mode-on', on);
  };
  applyDevMode();
  window.toggleDevMode = function(){
    const next = localStorage.getItem(DEV_KEY) === 'on' ? 'off' : 'on';
    localStorage.setItem(DEV_KEY, next);
    applyDevMode();
    return next;
  };

  const nav = document.getElementById('devNav');
  const toggle = document.getElementById('devNavToggle');
  const closeBtn = document.getElementById('devNavClose');
  if (!nav) return;
  const KEY = 'dev_nav_hidden';
  const hidden = localStorage.getItem(KEY) === '1';
  if (hidden) nav.style.display = 'none';
  // Floating reopener pill (id=devNavReopen 로 지정 → CSS가 격리 관리)
  const reopen = document.createElement('button');
  reopen.id = 'devNavReopen';
  reopen.textContent = 'DEV';
  reopen.className = 'no-print fixed top-2 left-2 z-[60] bg-white border border-bd-emphasis rounded-md shadow-subtle px-2 py-0.5 text-[10px] font-semibold text-tx-tertiary hover:text-tx-primary';
  reopen.style.display = hidden ? 'block' : 'none';
  document.body.appendChild(reopen);
  const hide = () => { nav.style.display = 'none'; reopen.style.display = 'block'; localStorage.setItem(KEY,'1'); };
  const show = () => { nav.style.display = 'flex';  reopen.style.display = 'none';  localStorage.setItem(KEY,'0'); };
  toggle?.addEventListener('click', hide);
  closeBtn?.addEventListener('click', hide);
  reopen.addEventListener('click', show);
})();

/* ============== [v2.6.0] Theme Toggle (다크/라이트/시스템) ============== */
(function initThemeToggle(){
  const THEME_KEY = 'ordo_theme';
  const systemDarkQuery = window.matchMedia('(prefers-color-scheme: dark)');

  function resolveTheme(pref) {
    if (pref === 'dark') return 'dark';
    if (pref === 'light') return 'light';
    return systemDarkQuery.matches ? 'dark' : 'light';
  }

  function applyTheme(pref) {
    const resolved = resolveTheme(pref);
    document.documentElement.setAttribute('data-theme', resolved);
    // 토글 버튼 active 상태 업데이트
    document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
      btn.classList.toggle('is-active', btn.getAttribute('data-theme-val') === pref);
    });
  }

  // 초기화: 저장된 값이 없으면 'dark' 기본값 (랜딩과 연속성)
  const saved = localStorage.getItem(THEME_KEY) || 'dark';
  localStorage.setItem(THEME_KEY, saved);
  applyTheme(saved);

  // 토글 클릭
  document.getElementById('themeToggleWrap')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.theme-toggle-btn');
    if (!btn) return;
    const val = btn.getAttribute('data-theme-val');
    localStorage.setItem(THEME_KEY, val);
    applyTheme(val);
  });

  // system 모드일 때 OS 설정 변경 감지
  const onSystemChange = () => {
    if (localStorage.getItem(THEME_KEY) === 'system') applyTheme('system');
  };
  if (typeof systemDarkQuery.addEventListener === 'function') {
    systemDarkQuery.addEventListener('change', onSystemChange);
  } else if (typeof systemDarkQuery.addListener === 'function') {
    systemDarkQuery.addListener(onSystemChange);
  }

  window._ordoSetTheme = (v) => { localStorage.setItem(THEME_KEY, v); applyTheme(v); };
})();

/* APP SHELL DRAWER AND NOTIFICATIONS */
const drawerOverlay = document.getElementById('drawerOverlay');
const drawerPanel = drawerOverlay?.querySelector('.drawer');
document.getElementById('openDrawer')?.addEventListener('click', () => {
  if (!drawerOverlay || !drawerPanel) return;
  drawerOverlay.style.display = 'block';
  drawerOverlay.classList.remove('hidden');
  requestAnimationFrame(() => drawerPanel.classList.add('open'));
});
drawerOverlay?.addEventListener('click', (e) => {
  if (e.target.matches('[data-close-drawer]')) {
    closeDrawerSafe();
  }
});
document.querySelectorAll('.drawer-link').forEach(a => a.addEventListener('click', () => {
  closeDrawerSafe();
}));

/* ============== 알림 드롭다운 ============== */
const notifTrig = document.getElementById('notifTrigger');
const notifPanel = document.getElementById('notifPanel');
notifTrig?.addEventListener('click', (e) => {
  e.stopPropagation();
  const open = !notifPanel.classList.contains('hidden');
  notifPanel.classList.toggle('hidden');
  notifTrig.setAttribute('aria-expanded', String(!open));
});
document.addEventListener('click', (e) => {
  if (!notifPanel?.contains(e.target) && !notifTrig?.contains(e.target)) {
    notifPanel?.classList.add('hidden');
    notifTrig?.setAttribute('aria-expanded','false');
  }
});
/* ============== 프로젝트룸 탭 ============== */

/* APP SHELL VIEWPORT CLEANUP */
(function(){
  const mq = window.matchMedia('(min-width: 1024px)');
  const onChange = () => {
    // 데스크톱 진입 시 모바일 드로어 자동 닫기 (768↔1024 전환 버그 방지)
    if (mq.matches && drawerOverlay && !drawerOverlay.classList.contains('hidden')) {
      drawerPanel?.classList.remove('open');
      drawerOverlay.classList.add('hidden');
      drawerOverlay.style.display = 'none';
    }
    // 뷰포트 변경 시 알림 드롭다운 닫기 (탑바 숨김/표시 경계)
    notifPanel?.classList.add('hidden');
    notifTrig?.setAttribute('aria-expanded','false');
  };
  if (mq.addEventListener) mq.addEventListener('change', onChange);
  else if (mq.addListener) mq.addListener(onChange);
})();
