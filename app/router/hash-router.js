/* ============================================================
   [이 파일은] "교통정리 경찰" — 주소창의 해시(#dashboard, #admin-cards 등)를
                읽고 어떤 화면을 보여줄지 결정하는 화면 전환의 유일한 입구.
   [언제 실행] 페이지 로드 시 준비되고, 이후 ① 주소가 바뀔 때(hashchange)
                ② 코드가 navigate('#화면')를 부를 때마다 동작합니다.
   [주요 등장인물]
     - navigate        : 핵심 함수. 화면 교체의 전 과정을 지휘 (아래 단계 주석 참고)
     - isRoleAllowed   : 이 역할이 이 화면에 들어가도 되는지 검사 (안 되면 403)
     - ROUTE_ALIASES   : 없어진 옛 주소를 현재 화면으로 넘겨주는 이사 안내판
     - scrollLandingSection : 랜딩 페이지 안에서의 섹션 스크롤 처리
   [연결] ← 모든 링크(href="#...")와 화면 코드가 사용
          → config 의 SCREENS/AUTH_OFF, 쉘의 setShell, 화면들의 render 함수 호출
   [다음 읽을 파일] app/layout/app-shell.js (라우터가 화면을 고르면 액자를 맞추는 곳)
   [수정할 때 주의] 새 화면을 추가하려면 ① config 의 SCREENS ② index.html 의
                     <section id="screen-이름"> ③ 필요 시 여기 진입 훅, 세 곳이 세트.
   ============================================================ */
/* ============== 해시 기반 라우팅 (가드 포함) ============== */
// 출입 검사: 화면 섹션의 data-allowed-roles 속성과 현재 역할을 대조합니다.
// 로그인 전 화면(AUTH_OFF)은 무사통과, 컴포넌트 갤러리는 dev_mode 켰을 때만.
function isRoleAllowed(id){
  if (AUTH_OFF.has(id)) return true;         // 인증 전은 무시
  if (id === 'forbidden-403') return true;
  if (id === 'components-gallery') {
    // [v2.5.0] DEV 모드 ON일 때만 접근 가능
    return localStorage.getItem('dev_mode') === 'on';
  }
  const el = document.getElementById('screen-' + id);
  if (!el) return false;
  const allowed = (el.getAttribute('data-allowed-roles') || '').trim();
  if (!allowed) return true; // 미지정 → 통과
  return allowed.split(/\s+/).includes(window.ORDO_ROLE);
}

// 랜딩 페이지 내부 섹션들 (#odds, #chain 등)은 별도 화면이 아니라 같은 화면 안의 스크롤 대상.
// 아래 두 상수가 "이 해시는 랜딩 내부 이동이다"라고 라우터에게 알려줍니다.
const LANDING_SECTION_HASHES = new Set(['odds','chain','gap','breaks','how','adoption','faq']);
const LANDING_NAV_GROUPS = {
  odds: ['odds', 'chain', 'gap'],
  breaks: ['breaks'],
  how: ['how', 'adoption'],
  faq: ['faq']
};

// 스크롤 시 헤더에 가려지지 않을 만큼의 여백(px)을 계산합니다.
function getLandingHeaderOffset(){
  const header = document.querySelector('#screen-landing [data-landing-header]');
  return (header?.offsetHeight || 64) + 20;
}

// 내비 강조가 전환되는 기준점: 헤더+여유 vs 화면 42% 중 큰 쪽.
// 42%는 "섹션 제목이 시야 중앙에 올 때 네비를 바꾼다"는 체감 기준입니다.
function getLandingNavActivationOffset(){
  return Math.max(getLandingHeaderOffset() + 120, window.innerHeight * 0.42);
}

// 섹션 id → 그 섹션이 속한 네비 그룹의 대표 id. (odds/chain/gap 세 개가 'odds' 그룹)
function getLandingNavRoot(sectionId){
  const id = String(sectionId || '').replace('#','').split('?')[0];
  return Object.keys(LANDING_NAV_GROUPS).find(key => LANDING_NAV_GROUPS[key].includes(id)) || id;
}

// 랜딩 상단 네비의 "현재 보고 있는 섹션" 강조(is-active)를 갱신합니다.
function syncLandingNavActive(sectionId){
  const root = getLandingNavRoot(sectionId);
  document.querySelectorAll('#screen-landing .landing-nav-link[href^="#"]').forEach(link => {
    const key = (link.getAttribute('href') || '').replace('#','').split('?')[0];
    link.classList.toggle('is-active', key === root);
    if (key === root) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  });
}

function scrollLandingSection(hash, options = {}) {
  const raw = (hash || '').replace('#','').split('?')[0];
  if (!LANDING_SECTION_HASHES.has(raw)) return false;
  const landing = document.getElementById('screen-landing');
  const target = document.getElementById(raw);
  if (!landing || !target) return false;

  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  landing.classList.add('active');
  setShell(window.ORDO_ROLE, AUTH_OFF.has('landing'));
  document.getElementById('notifPanel')?.classList.add('hidden');

  requestAnimationFrame(() => {
    const top = Math.max(0, window.pageYOffset + target.getBoundingClientRect().top - getLandingHeaderOffset());
    window.__ordoLandingScrollTarget = raw;
    syncLandingNavActive(raw);
    window.scrollTo({ top, behavior: options.instant ? 'auto' : 'smooth' });
    clearTimeout(window.__ordoLandingScrollTargetTimer);
    window.__ordoLandingScrollTargetTimer = setTimeout(() => {
      if (window.__ordoLandingScrollTarget === raw) window.__ordoLandingScrollTarget = '';
      window.dispatchEvent(new Event('ordo:landing-nav-sync'));
    }, options.instant ? 120 : 1100);
  });
  return true;
}

// 이사 안내판: 과거에 존재했던 화면 주소(#project-room 등)로 들어오면
// 현재 화면으로 자동으로 넘겨줍니다. 옛 링크가 어딘가 남아 있어도 깨지지 않게.
const ROUTE_ALIASES = Object.freeze({
  'project-room': 'project',
  'project-detail': 'project',
  'pm-room': 'project',
  'work-suggestion-room': 'project',
  documents: 'project',
  'action-room': 'approvals',
  'report-room': 'approvals',
  reports: 'approvals',
  changes: 'approvals',
  'activity-room': 'approvals',
  'project-timeline-feed': 'approvals'
});
const SIDE_MATCH_PARENT = Object.freeze({
  'project-room': 'project',
  'project-detail': 'project',
  'pm-room': 'project',
  'work-suggestion-room': 'project',
  documents: 'project',
  'action-room': 'approvals',
  'report-room': 'approvals',
  reports: 'approvals',
  changes: 'approvals',
  'activity-room': 'approvals',
  'project-timeline-feed': 'approvals'
});
function isShellNavMatch(id, match){
  if (!match) return false;
  const parentMatch = SIDE_MATCH_PARENT[id];
  return (match === id) || (parentMatch === match);
}
function getRouteRootFromHref(href){
  return String(href || '').replace(/^#/, '').split('?')[0];
}
function resolveRouteAlias(raw, query){
  const hashText = String(raw || '').replace(/^#/, '');
  const id = hashText.split('?')[0];
  const embeddedQuery = hashText.split('?').slice(1).join('?');
  const target = ROUTE_ALIASES[id];
  if (!target) return null;
  const params = new URLSearchParams(query || embeddedQuery || '');
  if (id === 'project-timeline-feed') {
    const selectedProject = params.get('selectedProject');
    if (!params.has('projectId') && selectedProject) params.set('projectId', selectedProject);
    params.delete('selectedProject');
  }
  const qs = params.toString();
  return '#' + target + (qs ? '?' + qs : '');
}
function normalizeRouteHash(raw, query){
  const next = resolveRouteAlias(raw, query);
  if (!next) return false;
  location.replace(next);
  return true;
}
function getReportsChangesFallbackHash(id, query){
  return resolveRouteAlias(id, query) || '';
}

// 【핵심 함수】 화면 교체의 전 과정. 단계 번호는 아래 본문의 주석과 대응합니다.
//  ① 특수 주소 처리(문의 모달/랜딩 섹션/옛 주소) ② 출입 검사(403)
//  ③ 화면 교체(active 클래스 이동) ④ 액자 맞추기(쉘/제목/메뉴 강조)
//  ⑤ 진입 훅(화면별 render 함수 호출) ⑥ 맨 위로 스크롤
function navigate(hash){
  const hashText = (hash || '').replace('#','');
  const raw = hashText.split('?')[0];
  // ① 특수 주소: #inquiry 는 화면이 아니라 "문의 모달 열기" 명령
  if (raw === 'inquiry') {
    if (document.querySelector('.screen.active') && typeof window.openInquiryModal === 'function') {
      window.openInquiryModal({ syncHash: false });
      return;
    }
  }
  if (scrollLandingSection(raw, { instant: true })) return;
  const query = hashText.split('?').slice(1).join('?');
  if (normalizeRouteHash(raw, query)) return;
  let id = SCREENS.includes(raw) ? raw : 'landing';

  // ② 출입 검사: 권한 없으면 403 안내 화면으로 바꿔치기
  if (!isRoleAllowed(id)) {
    const fb = document.getElementById('forbiddenRole');
    const roleLabel = ROLE_PROFILE[window.ORDO_ROLE]?.roleLabel || window.ORDO_ROLE || '-';
    if (fb) fb.textContent = roleLabel;
    const fu = document.getElementById('forbiddenUrl');
    if (fu) fu.textContent = '#' + id;
    // [v2.5.0] 멀티롤 계정만 전환 힌트 노출
    const hint = document.getElementById('forbiddenMultiRoleHint');
    const rolesCount = (window._ordoSession?.roles || []).length || 1;
    if (hint) hint.classList.toggle('hidden', rolesCount < 2);
    id = 'forbidden-403';
  }

  // ③ 화면 교체: 모든 화면을 숨기고 목적지 하나만 켭니다 (한 건물 안에서 방만 바꾸는 방식)
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
    s.classList.add('hidden');
  });
  const target = document.getElementById('screen-' + id);
  if (target) {
    target.classList.add('active');
    target.classList.remove('hidden');
  }

  // [v2.1.0 — T8] placeholder 화면은 원칙적으로 존재하지 않음.
  // 혹시라도 .placeholder-screen 이 남아있다면 안내 박스를 렌더(다음 턴 문구 없이).
  if (target?.classList.contains('placeholder-screen') && !target.dataset.rendered) {
    target.innerHTML = `
      <div class="max-w-[680px] mx-auto px-4 py-16 text-center">
        <div class="w-16 h-16 mx-auto rounded-full bg-bg-tertiary border border-bd-default flex items-center justify-center mb-5">
          <i data-lucide="layout-dashboard" class="w-8 h-8 text-tx-tertiary"></i>
        </div>
        <h1 class="text-[22px] lg:text-[26px] font-semibold mt-1">${TITLES[id] || id}</h1>
        <p class="text-[12px] text-tx-tertiary mt-1">screen id: <code class="font-mono">${id}</code></p>
      </div>
    `;
    target.dataset.rendered = '1';
  }

  // ④ 액자 맞추기: 사이드바 표시 여부(로그인 전 화면이면 숨김)와 역할 클래스 적용
  setShell(window.ORDO_ROLE, AUTH_OFF.has(id));

  // 타이틀/브레드크럼 갱신
  const crumbTrail = ROUTE_BREADCRUMBS[id] || String(CRUMBS[id] || TITLES[id] || '').split(/\s*›\s*/).filter(Boolean);
  const routeTitle = crumbTrail[crumbTrail.length - 1] || TITLES[id] || '';
  const mt = document.getElementById('mTitle'); if (mt) mt.textContent = routeTitle;
  const bc = document.getElementById('breadcrumbTail'); if (bc) bc.textContent = crumbTrail.join(' › ');

  // 사이드바 active
  document.querySelectorAll('.side-link').forEach(a => {
    const m = a.getAttribute('data-match');
    const isMatch = isShellNavMatch(id, m);
    if (isMatch) { a.classList.add('active','bg-bg-tertiary','text-tx-primary','font-semibold'); a.classList.remove('text-tx-secondary'); }
    else { a.classList.remove('active','bg-bg-tertiary','text-tx-primary','font-semibold'); a.classList.add('text-tx-secondary'); }
  });
  // 드로어 active
  document.querySelectorAll('#drawerMenu .drawer-link').forEach(a => {
    const m = a.getAttribute('data-match');
    const isMatch = isShellNavMatch(id, m);
    a.classList.toggle('active', isMatch);
    a.classList.toggle('bg-bg-tertiary', isMatch);
    a.classList.toggle('text-tx-primary', isMatch);
    a.classList.toggle('font-semibold', isMatch);
    a.classList.toggle('text-tx-secondary', !isMatch);
  });
  // 하단 탭바 active (클라이언트 전용 하드코딩)
  document.querySelectorAll('.mtab-link').forEach(a => {
    const m = a.getAttribute('data-tab-bar');
    const match = isShellNavMatch(id, m) || (id === 'profile' && (m === 'profile-notif' || m === 'profile-my'));
    if (match) { a.classList.remove('text-tx-tertiary'); a.classList.add('active','text-brand-primary','font-semibold'); }
    else { a.classList.add('text-tx-tertiary'); a.classList.remove('active','text-brand-primary','font-semibold'); }
  });

  // 문서 진입 시 기본 상세
  if (id === 'documents') {
    const initial = window._pendingDocItem || '1';
    window._pendingDocItem = null;
    selectDoc(initial, window.matchMedia('(min-width:1024px)').matches);
  }
  // ⑤ 진입 훅: 화면에 들어설 때 그 화면의 render 함수를 불러 최신 데이터로 다시 그림
  //    (카드가 다른 역할에서 바뀌었어도, 이 훅 덕분에 들어올 때마다 최신 상태가 보입니다)
  if (id === 'dashboard' && window.ORDO_CLIENT_RENDER_READY && typeof renderDashboard === 'function') {
    renderDashboard();
  }
  if (window.ORDO_CLIENT_RENDER_READY && ['project','approvals','worker-home','worker-cards','admin-home','admin-projects','admin-cards','admin-team','admin-audit'].includes(id) && typeof renderModuleRouteScreens === 'function') {
    renderModuleRouteScreens(id);
  }
  if (id === 'admin-home') {
    const el = document.getElementById('adminKpiWorkCards');
    if (el) {
      const n = (window.ORDO_WORK_CARDS || []).filter(c =>
        ['client-confirm-pending','client-approval','pm-review'].includes(c.state)
      ).length;
      el.textContent = String(n);
    }
  }
  // 프로필 진입 시 출처별 기본 탭 지정
  if (id === 'profile') {
    applyProfileEntryTab();
  }

  // 드롭다운 닫기
  document.getElementById('notifPanel')?.classList.add('hidden');

  // ⑥ 새 화면은 항상 맨 위부터
  window.scrollTo({ top: 0, behavior: 'instant' });
}
window.navigate = navigate;
// 주소창의 해시가 바뀔 때마다(뒤로가기 포함) navigate 를 자동 실행 — 라우터의 귀.
window.addEventListener('hashchange', () => {
  const raw = (location.hash || '').replace('#','').split('?')[0];
  if (raw === 'inquiry') {
    if (typeof window.openInquiryModal === 'function') window.openInquiryModal({ syncHash: false });
    return;
  }
  if (typeof window.closeInquiryModal === 'function' && window.isInquiryModalOpen?.()) {
    window.closeInquiryModal({ restoreHash: false, restoreFocus: false });
  }
  if (scrollLandingSection(location.hash)) return;
  navigate(location.hash);
});

document.querySelectorAll('#screen-landing a[href^="#"]').forEach(link => {
  link.addEventListener('click', event => {
    const href = link.getAttribute('href') || '';
    const raw = href.replace('#','').split('?')[0];
    if (!LANDING_SECTION_HASHES.has(raw)) return;
    event.preventDefault();
    if (location.hash !== '#' + raw) {
      history.pushState(null, '', '#' + raw);
    }
    scrollLandingSection(raw);
  });
});

// 다른 파일이 라우터의 공개 기능을 찾을 때 쓰는 명시적 출입구다.
// 기존 코드 호환을 위해 window.navigate도 그대로 유지한다.
window.ORDO_ROUTER = {
  navigate,
  scrollLandingSection,
  resolveRouteAlias,
  getReportsChangesFallbackHash,
  getRouteRootFromHref,
  routeAliases: ROUTE_ALIASES,
  sideMatchParent: SIDE_MATCH_PARENT,
};
