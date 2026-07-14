/* ============================================================
   [이 파일은] 브라우저에서 실행되는 "현장 검사원" — 개발자 도구에서 런타임 QA를 실행하면
                현재 화면의 DOM 상태, 역할별 화면 접근 권한, 렌더 결과를 자동 점검합니다.
   [언제 실행] 브라우저 콘솔에서 수동으로, 또는 개발 중 자동 실행.
   [검증 항목]
     - 각 라우트의 화면(screen) DOM 요소가 존재하는가
     - 역할(admin/worker/client)에 따라 접근 가능한 화면이 맞는가
     - 렌더 타겟(KPI, 목록 등)에 내용이 채워졌는가
   [수정할 때 주의] 라우트나 화면 ID가 바뀌면 ROUTE_CASES 배열 갱신 필요.
   ============================================================ */

(function initRuntimeQa(){
  const ROUTE_CASES = [
    {
      name: 'landing',
      role: 'client',
      hash: 'landing',
      screenId: 'screen-landing',
      renderTarget: '#screen-landing [data-landing-header]',
    },
    {
      name: 'auth',
      role: 'client',
      hash: 'auth',
      screenId: 'screen-auth',
      renderTarget: '#authLoginForm',
    },
    {
      name: 'client dashboard',
      role: 'client',
      hash: 'dashboard',
      screenId: 'screen-dashboard',
      renderTarget: '#clientDashboardKpis',
    },
    {
      name: 'client project',
      role: 'client',
      hash: 'project',
      screenId: 'screen-project',
      renderTarget: '#clientProjectStepProgress',
    },
    {
      name: 'client approvals',
      role: 'client',
      hash: 'approvals',
      screenId: 'screen-approvals',
      renderTarget: '#clientApprovalDetail',
    },
    {
      name: 'admin home',
      role: 'admin',
      hash: 'admin-home',
      screenId: 'screen-admin-home',
      renderTarget: '#adminHomeKpis',
    },
    {
      name: 'worker home',
      role: 'worker',
      hash: 'worker-home',
      screenId: 'screen-worker-home',
      renderTarget: '#workerHomeKpis',
    },
  ];

  const ROLE_EXPECTATIONS = [
    { id: 'dashboard', roles: ['client'] },
    { id: 'project', roles: ['client'] },
    { id: 'approvals', roles: ['client'] },
    { id: 'profile', roles: ['admin', 'client', 'worker'], allowSharedFallback: true },
    { id: 'worker-home', roles: ['worker'] },
    { id: 'worker-cards', roles: ['worker'] },
    { id: 'admin-home', roles: ['admin'] },
    { id: 'admin-projects', roles: ['admin'] },
    { id: 'admin-cards', roles: ['admin'] },
    { id: 'admin-team', roles: ['admin'] },
    { id: 'admin-audit', roles: ['admin'] },
  ];

  const REMOVED_SCREEN_IDS = [
    'screen-project-room',
    'screen-action-room',
    'screen-report-room',
    'screen-activity-room',
    'screen-pm-room',
    'screen-work-suggestion-room',
    'screen-admin-approvals',
    'screen-worker-tasks',
    'screen-reports',
    'screen-project-timeline-feed',
    'dashboardUrgentCards',
    'clientTimelineMount',
  ];

  const REMOVED_GLOBALS = [
    'renderProjectRoom',
    'renderActionRoom',
    'renderReportRoom',
    'renderActivityRoom',
    'renderRound2Rooms',
  ];

  const ALIAS_CASES = [
    { route: 'project-room', query: '', expected: '#project' },
    { route: 'project-detail', query: 'projectId=prj-ercerp', expected: '#project?projectId=prj-ercerp' },
    { route: 'pm-room', query: 'selectedProject=prj-ercerp', expected: '#project?selectedProject=prj-ercerp' },
    { route: 'work-suggestion-room', query: '', expected: '#project' },
    { route: 'documents', query: 'tab=assets', expected: '#project?tab=assets' },
    { route: 'action-room', query: 'item=act-001', expected: '#approvals?item=act-001' },
    { route: 'report-room', query: 'selectedProject=prj-ercerp', expected: '#approvals?selectedProject=prj-ercerp' },
    { route: 'reports', query: 'selectedProject=prj-portal', expected: '#approvals?selectedProject=prj-portal' },
    { route: 'changes', query: 'projectId=prj-finops', expected: '#approvals?projectId=prj-finops' },
    { route: 'activity-room', query: 'eventId=ev-001', expected: '#approvals?eventId=ev-001' },
    { route: 'project-timeline-feed', query: 'selectedProject=prj-logistics', expected: '#approvals?projectId=prj-logistics' },
    { route: '#project-timeline-feed?projectId=prj-logistics', query: '', expected: '#approvals?projectId=prj-logistics' },
  ];

  function push(results, pass, label, detail = ''){
    results.push({ pass: !!pass, label, detail: detail || (pass ? 'OK' : '') });
  }

  function textOf(el){
    return (el?.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function hasRenderedContent(el){
    if (!el) return false;
    return textOf(el).length > 0 || el.children.length > 0;
  }

  function htmlEscape(value){
    return String(value || '').replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[char]));
  }

  function getConfiguredScreens(){
    if (Array.isArray(window.SCREENS)) return window.SCREENS;
    if (typeof SCREENS !== 'undefined' && Array.isArray(SCREENS)) return SCREENS;
    return [
      'landing',
      'auth',
      'terms',
      'privacy',
      'support',
      'select-workspace',
      'forbidden-403',
      'components-gallery',
      'dashboard',
      'project',
      'approvals',
      'profile',
      'worker-home',
      'worker-cards',
      'admin-home',
      'admin-projects',
      'admin-cards',
      'admin-team',
      'admin-audit',
    ];
  }

  function getLandingSectionHashes(){
    if (typeof LANDING_SECTION_HASHES !== 'undefined') {
      return Array.from(LANDING_SECTION_HASHES);
    }
    return ['odds', 'chain', 'gap', 'breaks', 'how', 'adoption', 'faq'];
  }

  function getRouteAliases(){
    const routerAliases = window.ORDO_ROUTER?.routeAliases;
    if (routerAliases) return routerAliases;
    if (typeof ROUTE_ALIASES !== 'undefined') return ROUTE_ALIASES;
    return {};
  }

  function routeRoot(value){
    return String(value || '').replace(/^#/, '').split('?')[0];
  }

  function getResolver(){
    return window.ORDO_ROUTER?.resolveRouteAlias ||
      (typeof resolveRouteAlias === 'function' ? resolveRouteAlias : null);
  }

  function getFallbackResolver(){
    return window.ORDO_ROUTER?.getReportsChangesFallbackHash ||
      (typeof getReportsChangesFallbackHash === 'function' ? getReportsChangesFallbackHash : null);
  }

  function runRouteCase(routeCase){
    if (typeof window.navigate !== 'function') {
      return { pass: false, detail: 'navigate 없음' };
    }
    try {
      window.ORDO_ROLE = routeCase.role;
      window.navigate('#' + routeCase.hash);
      const screen = document.getElementById(routeCase.screenId);
      const target = document.querySelector(routeCase.renderTarget);
      const active = !!screen && screen.classList.contains('active') && !screen.classList.contains('hidden');
      const rendered = hasRenderedContent(target);
      return {
        pass: active && rendered,
        detail: `active:${active} rendered:${rendered}`,
      };
    } catch (error) {
      return { pass: false, detail: error?.message || String(error) };
    }
  }

  function restoreRouteState(snapshot){
    try {
      if (snapshot.role) window.ORDO_ROLE = snapshot.role;
      if (typeof window.navigate === 'function') {
        window.navigate(snapshot.hash || '#landing');
      }
    } catch (error) {
      console.warn('[ORDO_QA] restore failed', error);
    }
  }

  function checkCurrentScreens(results){
    const configured = getConfiguredScreens();
    const missing = configured
      .map(id => `screen-${id}`)
      .filter(screenId => !document.getElementById(screenId));
    push(
      results,
      missing.length === 0,
      '현재 SCREENS 목록과 DOM ID 일치',
      missing.length ? missing.join(', ') : `${configured.length}개 화면 확인`
    );

    const staleRoutesInConfig = Object.keys(getRouteAliases()).filter(id => configured.includes(id));
    push(
      results,
      staleRoutesInConfig.length === 0,
      'legacy alias가 SCREENS에 직접 등록되지 않음',
      staleRoutesInConfig.length ? staleRoutesInConfig.join(', ') : 'alias는 redirect 표에만 존재'
    );
  }

  function checkLocalDependencyAssets(results){
    const tailwindLink = document.querySelector('link[href="./app/styles/tailwind.build.css"], link[href$="/app/styles/tailwind.build.css"]');
    const lucideScript = document.querySelector('script[src="./app/vendor/lucide/lucide.min.js"], script[src$="/app/vendor/lucide/lucide.min.js"]');
    const oldRuntimeHits = Array.from(document.querySelectorAll('script[src], link[href]'))
      .map(el => el.getAttribute('src') || el.getAttribute('href') || '')
      .filter(url => /cdn\.tailwindcss\.com|unpkg\.com\/lucide|@latest/.test(url));

    const probe = document.createElement('div');
    probe.className = 'w-[18px] h-[18px] bg-[#03C75A]';
    probe.style.position = 'absolute';
    probe.style.left = '-9999px';
    document.body.appendChild(probe);
    const probeStyle = window.getComputedStyle(probe);
    const backgroundColor = probeStyle.backgroundColor;
    const width = probeStyle.width;
    const height = probeStyle.height;
    const tailwindTokenOk = /rgb\(3,\s*199,\s*90\)/.test(backgroundColor) &&
      width === '18px' &&
      height === '18px';
    probe.remove();

    push(
      results,
      !!tailwindLink && !!lucideScript && oldRuntimeHits.length === 0,
      'Tailwind/Lucide가 로컬 고정 자산으로 로드됨',
      oldRuntimeHits.length ? oldRuntimeHits.join(', ') : `tailwind:${!!tailwindLink} lucide:${!!lucideScript}`
    );
    push(
      results,
      tailwindTokenOk && typeof window.lucide?.createIcons === 'function',
      '로컬 Tailwind 토큰과 Lucide 런타임 동작 가능',
      `tailwindToken:${tailwindTokenOk} bg:${backgroundColor} size:${width}x${height} lucide:${typeof window.lucide?.createIcons}`
    );
  }

  function checkRoleMetadata(results){
    const mismatches = [];
    ROLE_EXPECTATIONS.forEach(expectation => {
      const el = document.getElementById('screen-' + expectation.id);
      if (!el) {
        mismatches.push(`${expectation.id}:screen 없음`);
        return;
      }
      const actual = (el.getAttribute('data-allowed-roles') || '').trim();
      if (!actual && expectation.allowSharedFallback) return;
      const actualRoles = actual.split(/\s+/).filter(Boolean);
      const ok = expectation.roles.every(role => actualRoles.includes(role));
      if (!ok) mismatches.push(`${expectation.id}:${actual || 'empty'}`);
    });
    push(
      results,
      mismatches.length === 0,
      '현재 역할 가드 메타가 실제 화면 기준과 일치',
      mismatches.length ? mismatches.join(', ') : 'client/worker/admin 화면 권한 확인'
    );
  }

  function checkAliases(results){
    const resolve = getResolver();
    push(results, typeof resolve === 'function', 'router alias resolver 노출', typeof resolve === 'function' ? 'resolveRouteAlias 사용 가능' : 'missing');
    if (typeof resolve !== 'function') return;

    const failures = ALIAS_CASES.map(test => {
      const actual = resolve(test.route, test.query);
      return actual === test.expected ? null : `${test.route}${test.query ? '?' + test.query : ''} -> ${actual}`;
    }).filter(Boolean);
    push(
      results,
      failures.length === 0,
      'legacy route alias가 현재 화면으로 정규화됨',
      failures.length ? failures.join(' | ') : `${ALIAS_CASES.length}개 alias 확인`
    );

    const fallback = getFallbackResolver();
    const reportsFallback = fallback?.('reports', 'selectedProject=prj-portal');
    const changesFallback = fallback?.('changes', 'projectId=prj-finops');
    const unknownFallback = fallback?.('unknown-route', '');
    const fallbackOk = reportsFallback === '#approvals?selectedProject=prj-portal' &&
      changesFallback === '#approvals?projectId=prj-finops' &&
      unknownFallback === '';
    push(
      results,
      fallbackOk,
      'reports/changes fallback이 alias resolver와 같은 규칙 사용',
      `reports:${reportsFallback || '-'} changes:${changesFallback || '-'} unknown:${unknownFallback || '-'}`
    );
  }

  function checkRemovedRoomSurface(results){
    const staleDom = REMOVED_SCREEN_IDS.filter(id => document.getElementById(id));
    push(
      results,
      staleDom.length === 0,
      '삭제된 room/legacy 화면 DOM을 QA가 요구하지 않음',
      staleDom.length ? staleDom.join(', ') : 'legacy DOM 없음'
    );

    const staleGlobals = REMOVED_GLOBALS.filter(name => typeof window[name] === 'function');
    push(
      results,
      staleGlobals.length === 0,
      '삭제된 room renderer 전역 함수 없음',
      staleGlobals.length ? staleGlobals.join(', ') : 'legacy renderer 없음'
    );
  }

  function checkRouteRendering(results){
    const snapshot = {
      role: window.ORDO_ROLE,
      hash: location.hash || '#landing',
    };
    try {
      ROUTE_CASES.forEach(routeCase => {
        const result = runRouteCase(routeCase);
        push(results, result.pass, `route render: ${routeCase.name}`, result.detail);
      });
    } finally {
      restoreRouteState(snapshot);
    }
  }

  function checkLinkTargets(results){
    const configured = new Set(getConfiguredScreens());
    const aliases = new Set(Object.keys(getRouteAliases()));
    const landingSections = new Set(getLandingSectionHashes());
    const allowed = new Set([...configured, ...aliases, ...landingSections, 'inquiry']);
    const invalid = [];

    document.querySelectorAll('a[href^="#"], button[data-goto]').forEach(el => {
      const raw = el.getAttribute('href') || el.getAttribute('data-goto') || '';
      const root = routeRoot(raw);
      if (!root) return;
      if (!allowed.has(root)) {
        const label = textOf(el) || el.getAttribute('aria-label') || el.tagName.toLowerCase();
        invalid.push(`${label} -> #${root}`);
      }
    });

    push(
      results,
      invalid.length === 0,
      '앱 내부 링크가 현재 route 또는 legacy alias 안에 있음',
      invalid.length ? invalid.slice(0, 8).join(' | ') : '링크 대상 확인'
    );

    const legacyPublicLinks = Array.from(document.querySelectorAll(
      'a[href^="#reports"], a[href^="#changes"], a[href^="#project-timeline-feed"], ' +
      'button[data-goto="reports"], button[data-goto="changes"], button[data-goto="project-timeline-feed"]'
    )).filter(el => !el.closest('#devNav'));
    push(
      results,
      legacyPublicLinks.length === 0,
      'legacy alias가 사용자용 공식 메뉴/CTA로 노출되지 않음',
      legacyPublicLinks.length ? `${legacyPublicLinks.length}개 노출` : '공식 링크는 현재 route 사용'
    );
  }

  function checkClientIaGuardrail(results){
    const dashboardText = textOf(document.getElementById('screen-dashboard'));
    const projectText = textOf(document.getElementById('screen-project'));
    const forbiddenTokens = ['route:', 'screen id:', 'project-room', 'action-room', 'report-room'];
    const hits = forbiddenTokens.filter(token => dashboardText.includes(token) || projectText.includes(token));
    push(
      results,
      hits.length === 0,
      '클라이언트 주요 화면에 내부 route/debug 문구 없음',
      hits.length ? hits.join(', ') : 'client-facing copy 확인'
    );
  }

  window.ORDO_QA = {
    run(){
      const results = [];
      checkCurrentScreens(results);
      checkLocalDependencyAssets(results);
      checkRoleMetadata(results);
      checkAliases(results);
      checkRemovedRoomSurface(results);
      checkRouteRendering(results);
      checkLinkTargets(results);
      checkClientIaGuardrail(results);

      try {
        console.table(results.map(result => ({
          pass: result.pass ? 'PASS' : 'FAIL',
          check: result.label,
          detail: result.detail,
        })));
      } catch (error) {
        console.log(results);
      }
      return results;
    },
    showToast(results){
      const pass = results.every(result => result.pass);
      const old = document.getElementById('ordoQaToast');
      old?.remove();

      const el = document.createElement('div');
      el.id = 'ordoQaToast';
      el.className = pass ? 'pass' : 'fail';
      el.innerHTML = `
        <div class="qa-head">
          <span>${pass ? 'QA 전체 PASS' : 'QA FAIL 있음'} (${results.filter(result => result.pass).length}/${results.length})</span>
          <button class="qa-close" aria-label="닫기">x</button>
        </div>
        <div class="qa-body">
          ${results.map(result => `
            <div class="qa-row">
              <span class="${result.pass ? 'qa-ok' : 'qa-ng'}">${result.pass ? 'PASS' : 'FAIL'}</span>
              <span class="qa-msg"><b>${htmlEscape(result.label)}</b><br>${htmlEscape(result.detail || '')}</span>
            </div>
          `).join('')}
        </div>`;
      document.body.appendChild(el);
      el.querySelector('.qa-close')?.addEventListener('click', () => el.remove());
    },
  };

  document.getElementById('devQaBtn')?.addEventListener('click', () => {
    const results = window.ORDO_QA.run();
    window.ORDO_QA.showToast(results);
  });
})();
