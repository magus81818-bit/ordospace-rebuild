/* ============================================================
   [이 파일은] 앱의 "잔류 본진" — 리팩터 과정에서 분리되지 않고 남아있는 코드의 모음.
                Room 데이터 정규화, Lucide 아이콘 초기화 등 글로벌 초기화가 여기에 있음.
   [언제 실행] 페이지 로드 시 (index.html의 <script>에서 로드)
   [주요 등장인물] normalizeRound3RoomData (Room 데이터 보정)
   [연결]
     ← index.html 에서 로드
     → app/data/room.data.js (Room 데이터)
     → app/ui/workspace.ui.js (ModuleCard 렌더 헬퍼)
     → app/ui/room.ui.js (Room UI 헬퍼)
   [다음 읽을 파일] app/ui/workspace.ui.js
   [수정할 때 주의] 여러 곳에서 분리된 코드의 잔여물이므로, 함수를 옮길 때 호출부가
                    여전히 이 파일을 참조하는지 확인 필요.
   ============================================================ */
// Router config moved to app/router/hash-router.js.
// Role/session helpers moved to app/services/session.service.js.
// Room data moved to app/data/room.data.js.
// Room data query helpers moved to app/repos/room.repo.js.
// Auth view/form workflow moved to app/screens/auth.screen.js.
// Room repeated UI helpers moved to app/ui/room.ui.js.
/* ============== Lucide 초기화 ============== */
/* Auth screen state machine moved to app/screens/auth.screen.js */

/* ============== [v2.5.0] 대시보드 Work Card 렌더 ============== */

/* Room sample data moved to app/data/room.data.js */

/* Read-only room data query helpers moved to app/repos/room.repo.js */

function normalizeRound3RoomData(){
  const priorityFallback = ['P1','P1','P3','P2','P4'];
  (ORDO_ROOM_DATA.projects || []).forEach(function(p, index){
    const code = p.priorityCode || String(p.priority || '').match(/P[1-4]/)?.[0] || priorityFallback[index] || 'P4';
    const meta = ORDO_PRIORITY_META[code] || ORDO_PRIORITY_META.P4;
    p.projectId = p.projectId || p.id;
    p.title = p.title || p.name;
    p.name = p.title;
    p.priorityCode = code;
    p.priorityLabel = meta.label;
    p.priority = meta.label;
    p.priorityTone = meta.tone;
    p.importance = p.importance || meta.importance;
    p.urgency = p.urgency || meta.urgency;
    p.axis = meta.axis;
    p.pmId = p.pmId || ORDO_PM_ID_BY_NAME[p.pm] || null;
    p.nextMilestone = p.nextMilestone || p.milestone;
    p.milestone = p.nextMilestone;
    p.lastUpdatedAt = p.lastUpdatedAt || p.updated;
    p.updated = p.lastUpdatedAt;
    p.pendingActionsCount = Number(p.pendingActionsCount ?? p.pending ?? 0);
    p.pending = p.pendingActionsCount;
    p.openRisksCount = Number(p.openRisksCount ?? (code === 'P1' ? 1 : 0));
  });
  (ORDO_ROOM_DATA.actions || []).forEach(function(a, index){
    const statusLabel = a.statusLabel || a.status || '응답 필요';
    a.actionId = a.actionId || a.id;
    a.statusLabel = statusLabel;
    a.status = a.statusCode || ORDO_ACTION_STATUS_CODE[statusLabel] || 'client-response-required';
    a.projectId = a.projectId || null;
    a.pmId = a.pmId || ORDO_PM_ID_BY_NAME[a.pm] || null;
    a.requesterId = a.requesterId || a.pmId;
    a.requestedAt = a.requestedAt || a.requested;
    var requestedDate = parseDemoDate(a.requestedAt);
    a.requestedAtIso = a.requestedAtIso || (requestedDate ? requestedDate.toISOString() : null);
    a.requested = a.requestedAt;
    a.createdAt = a.createdAt || a.requestedAt;
    a.submittedAt = a.submittedAt || a.requestedAt;
    if (a.requestedAtIso) a.relative = formatRequestedLabel(a.requestedAtIso);
    a.slaDeadline = a.slaDeadline || (index < 2 ? '권장 응답 마감 확인 필요' : '프로젝트 상세에서 확인');
    a.reportId = a.reportId || (/리포트\s+(RP-\d+)/.exec(a.link || '')?.[1] || '').toLowerCase() || null;
    a.documentId = a.documentId || (/문서\s+(DOC-\d+)/.exec(a.link || '')?.[1] || '').toLowerCase() || null;
    a.eventId = a.eventId || 'ev-action-' + String(index + 1).padStart(2,'0');
  });
  (ORDO_ROOM_DATA.reports || []).forEach(function(r){
    r.reportId = r.reportId || r.id;
    r.pmId = r.pmId || ORDO_PM_ID_BY_NAME[r.pm] || null;
    r.requestedAt = r.requestedAt || r.requested;
    r.publishedAt = r.publishedAt || r.published;
    var publishedDate = parseDemoDate(r.publishedAt);
    r.publishedAtIso = r.publishedAtIso || (publishedDate ? publishedDate.toISOString() : null);
    r.statusLabel = r.statusLabel || r.status;
  });
  (ORDO_ROOM_DATA.projects || []).forEach(function(p){
    p.pendingActionsCount = getProjectPendingActionsCount(p, ORDO_ROOM_DATA.actions || []);
    p.pending = p.pendingActionsCount;
    p.openRisksCount = getProjectOpenRisksCount(p);
  });
}
normalizeRound3RoomData();


/* ============== 대시보드 Action Card → 리포트 상세 ============== */
document.querySelectorAll('[data-goto-report]').forEach(a => {
  a.addEventListener('click', (e) => {
    e.preventDefault();
    window._pendingReportItem = a.getAttribute('data-goto-report');
    location.hash = 'approvals';
  });
});

/* ============== 더보기 탭 → 마이페이지 ============== */
document.querySelectorAll('[data-go-my]').forEach(a => {
  a.addEventListener('click', () => { window._goMy = true; });
});

/* Auth form workflow moved to app/screens/auth.screen.js */

/* [v2.1.0 — T8] 파트너 상세 시트 (읽기 전용) */
window.openPartnerDetailSheet = function(name){
  const sheet = document.getElementById('partnerDetailSheet');
  if (!sheet) { window.ordoToast?.('파트너 상세를 준비 중입니다','warn'); return; }
  const n = document.getElementById('pdName'); if (n) n.textContent = name || '파트너';
  sheet.classList.remove('hidden'); sheet.setAttribute('aria-hidden','false');
};
document.addEventListener('click', (e) => {
  if (e.target.closest('[data-close-pd]')) {
    const s = document.getElementById('partnerDetailSheet');
    s?.classList.add('hidden'); s?.setAttribute('aria-hidden','true');
  }
});

/* [v2.1.0 — T8] 파트너 대기 명단 등록 */


/* ============== 햄버거 드로어 ============== */
document.querySelectorAll('.prj-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    const id = btn.getAttribute('data-tab');
    document.querySelectorAll('.prj-tab').forEach(b => {
      b.classList.remove('border-brand-primary','text-tx-primary','active');
      b.classList.add('border-transparent','text-tx-tertiary');
    });
    btn.classList.add('border-brand-primary','text-tx-primary','active');
    btn.classList.remove('border-transparent','text-tx-tertiary');
    document.querySelectorAll('.prj-panel').forEach(p => p.classList.add('hidden'));
    document.getElementById('tab-' + id)?.classList.remove('hidden');
    refreshIcons();
  });
});

/* Legacy PM timeline/compose screen handlers were removed after the route reset. */

/* ============== 리포트 센터: 필터 탭 ============== */
document.querySelectorAll('.filter-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-tab').forEach(b => {
      b.classList.remove('bg-brand-primary','text-white','active');
      b.classList.add('bg-white','border','border-bd-default','text-tx-secondary');
    });
    btn.classList.add('bg-brand-primary','text-white','active');
    btn.classList.remove('bg-white','border','border-bd-default','text-tx-secondary');
  });
});

/* ============== 뷰포트 전환 감지 — 드로어/드롭다운 자동 정리 ============== */


/* ============== [v1.1.0] 초기 role UI 적용 + 라우팅 ============== */
applyRoleUI();
navigate(location.hash || '#landing');
refreshIcons();

/* ============================================================
   [v1.3.0 — T3] 관리자 의뢰 접수함 데이터 + 렌더
   ============================================================ */


if (/^#?admin-(intake-queue|approvals|projects|partners|assignments|audit)/.test(location.hash)) {
  window.navigate(location.hash);
}

/* ================================================================
   [v1.5.0 — T5] 작업자 데이터 + 렌더
   ================================================================ */


function renderModuleRouteScreens(id){if(!moduleCards().length)return;if(!id||id==='dashboard')renderDashboard();if(!id||id==='project')renderProject();if(!id||id==='approvals')renderApprovalsScreen();if(!id||id==='worker-home')renderWorkerHome();if(!id||id==='worker-cards')renderWorkerCardsScreen();if(!id||id==='admin-home')renderAdminHome();if(!id||id==='admin-projects')renderAdminProjects();if(!id||id==='admin-cards')renderAdminCardsScreen();if(!id||id==='admin-team')renderAdminTeam();if(!id||id==='admin-audit')renderAuditTimeline();if(window.refreshIcons)window.refreshIcons();else if(window.lucide)window.lucide.createIcons();}
renderModuleRouteScreens((location.hash||'').replace('#','').split('?')[0]);

window.formatSLA = formatSLA;

// 간단 토스트


const ORDO_OFFICIAL_CONTACT_URL = '';
let inquiryReturnHash = '#landing';
let inquiryLastTrigger = null;
let inquiryBodyOverflow = '';

function initInquiryForms(){
  const inquiryMessage = '도입 문의 접수 기능은 준비 중입니다. 임시 운영 단계에서는 공식 문의 채널 또는 확정된 고객지원 채널로 연결됩니다.';
  const officialContactMessage = '공식 채널 연결 URL이 준비 중입니다.';
  const notify = (message, tone = 'ok') => {
    if (window.ordoToast) window.ordoToast(message, tone);
    else alert(message);
  };

  const getReturnHash = () => {
    const current = location.hash || '';
    if (current && current !== '#inquiry') return current;
    const active = document.querySelector('.screen.active');
    const activeId = active?.id?.replace(/^screen-/, '');
    return activeId && activeId !== 'inquiry' ? `#${activeId}` : '#landing';
  };

  const modal = document.getElementById('inquiryModal');
  const isOpen = () => !!modal && !modal.classList.contains('hidden');

  window.isInquiryModalOpen = isOpen;
  window.openInquiryModal = (options = {}) => {
    if (!modal) return;
    inquiryLastTrigger = options.trigger || document.activeElement;
    inquiryReturnHash = options.returnHash || getReturnHash();
    if (options.syncHash !== false && location.hash !== '#inquiry') {
      history.pushState(null, '', '#inquiry');
    }
    if (!isOpen()) {
      inquiryBodyOverflow = document.body.style.overflow || '';
      document.body.style.overflow = 'hidden';
    }
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    modal.setAttribute('aria-hidden', 'false');
    if (typeof refreshIcons === 'function') refreshIcons();
    else if (window.lucide?.createIcons) window.lucide.createIcons();
    setTimeout(() => {
      modal.querySelector('input, select, textarea, button, a')?.focus();
    }, 0);
  };

  window.closeInquiryModal = (options = {}) => {
    if (!modal || !isOpen()) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = inquiryBodyOverflow;
    if (options.restoreHash !== false && location.hash === '#inquiry') {
      history.replaceState(null, '', inquiryReturnHash || '#landing');
    }
    if (options.restoreFocus !== false && inquiryLastTrigger?.focus) {
      inquiryLastTrigger.focus();
    }
  };

  document.querySelectorAll('[data-inquiry-modal]').forEach(link => {
    if (link.dataset.inquiryModalInit === '1') return;
    link.dataset.inquiryModalInit = '1';
    link.addEventListener('click', (e) => {
      e.preventDefault();
      window.openInquiryModal({ trigger: link, syncHash: true });
    });
  });

  modal?.querySelectorAll('[data-inquiry-close]').forEach(close => {
    if (close.dataset.inquiryCloseInit === '1') return;
    close.dataset.inquiryCloseInit = '1';
    close.addEventListener('click', () => window.closeInquiryModal());
  });

  if (!window._inquiryModalKeyInit) {
    window._inquiryModalKeyInit = true;
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && window.isInquiryModalOpen?.()) {
        window.closeInquiryModal();
      }
    });
  }

  document.querySelectorAll('[data-official-contact]').forEach(link => {
    if (link.dataset.officialContactInit === '1') return;
    link.dataset.officialContactInit = '1';
    link.addEventListener('click', (e) => {
      e.preventDefault();
      if (ORDO_OFFICIAL_CONTACT_URL.trim()) {
        window.open(ORDO_OFFICIAL_CONTACT_URL, '_blank', 'noopener,noreferrer');
        return;
      }
      notify(officialContactMessage, 'warn');
    });
  });

  document.querySelectorAll('form[data-inquiry-form]').forEach(form => {
    if (form.dataset.inquiryFormInit === '1') return;
    form.dataset.inquiryFormInit = '1';
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      notify(inquiryMessage, 'ok');
    });
  });

  if (location.hash === '#inquiry') {
    if (!document.querySelector('.screen.active')) navigate('#landing');
    window.openInquiryModal({ syncHash: false, returnHash: getReturnHash() });
  }
}
window.initInquiryForms = initInquiryForms;

function initSupportForms(){
  const message = '문의 접수 기능은 준비 중입니다. 고객지원 채널 확정 후 연결됩니다.';
  document.querySelectorAll('form[data-support-form]').forEach(form => {
    if (form.dataset.supportFormInit === '1') return;
    form.dataset.supportFormInit = '1';
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (window.ordoToast) window.ordoToast(message, 'ok');
      else alert(message);
    });
  });
}
window.initSupportForms = initSupportForms;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initSupportForms();
    initInquiryForms();
  });
} else {
  initSupportForms();
  initInquiryForms();
}
// (2) 관리자 "PM 지정" → ORDO_PROJECTS push + 클라이언트 홈 동기화
// pm-pick 클릭 핸들러 재정의
(function rewirePmPick(){
  document.querySelectorAll('.pm-pick').forEach(b => {
    const clone = b.cloneNode(true); b.parentNode.replaceChild(clone, b);
    clone.addEventListener('click', () => {
      const pm = clone.getAttribute('data-pm');
      document.getElementById('pmAssignModal')?.classList.add('hidden');
      // 현재 선택된 intake → project로 전환
      const curId = window._currentIntakeId;
      let cur = null;
      try { cur = (typeof INTAKE_DATA !== 'undefined') ? INTAKE_DATA.find(x => x.id === curId) : null; } catch(e){}
      if (cur) {
        const newPrj = {
          id: 'PJ-' + (9000 + window.ORDO_PROJECTS.length),
          name: cur.title, company: cur.company, pm: pm + ' PM',
          health:'ok', stage:'제안', progress: 5, contract: cur.budget,
          _createdAt: Date.now()
        };
        window.ORDO_PROJECTS.push(newPrj);
        // intake 상태 갱신
        cur.status = '계약대기'; cur.assignedPm = pm + ' PM';
      }
      ordoToast(`${pm} PM을 배정했습니다. 클라이언트 홈에 프로젝트 카드가 추가됩니다.`, 'ok');
    });
  });
})();

// (3) 작업자 제출 → ORDO_SUBMISSIONS push + 리포트 센터 / 승인 감독 반영
document.getElementById('wkSubmitConfirm')?.addEventListener('click', () => {
  const t = WK_TASK_DATA.find(x => window._currentWkTaskId ? x.id === window._currentWkTaskId : true) || WK_TASK_DATA[0];
  const newSub = {
    id: 'WS-' + (600 + window.ORDO_SUBMISSIONS.length),
    status:'reviewing', title: t.title + ' (제출본)', version:'v1.0',
    submittedAt: '방금 전', remaining:'검토 기한 24h 남음',
    files:['제출본.pdf'], comment:'작업자 제출',
    feedback:null,
    history:[{v:'v1.0', date:'방금', who:'나', what:'제출 (검토중)', state:'current'}],
    project: t.project
  };
  window.ORDO_SUBMISSIONS.push(newSub);
  WK_SUB_DATA.unshift(newSub);
  closeSheet('wkSubmitSheet');
    ordoToast('제출되었습니다. 클라이언트·PM 양쪽에 동기화됩니다.', 'ok');
});

// 작업자 Task 선택 시 현재 ID 저장
(function _hookWkTaskId(){
  const _orig = selectWkTask;
  window.selectWkTask = function(id, auto){ window._currentWkTaskId = id; return _orig(id, auto); };
})();

/* ================================================================
   [v1.6.0 — T6] 알림 category 프리셋 (역할별 default 필터)
   ================================================================ */
window.ORDO_NOTIF_CATEGORIES = {
  admin:  ['intake','escalation','partner_onboarding','contract_expiry'],
  client: ['approval_request','change_request','submission'],
  worker: ['assignment','submission_feedback','blocker_response']
};


/* ================================================================
   [v2.1.0 — T8] screen-admin-project-detail 탭 전환
   ================================================================ */
document.querySelectorAll('#screen-admin-project-detail [data-apd-tab]').forEach(btn => {
  btn.addEventListener('click', () => {
    const id = btn.getAttribute('data-apd-tab');
    document.querySelectorAll('#screen-admin-project-detail .apd-tab').forEach(b => {
      b.classList.remove('active','text-tx-primary','border-brand-primary');
      b.classList.add('text-tx-tertiary','border-transparent','font-medium');
      b.classList.remove('font-semibold');
    });
    btn.classList.add('active','text-tx-primary','border-brand-primary','font-semibold');
    btn.classList.remove('text-tx-tertiary','border-transparent','font-medium');
    document.querySelectorAll('#screen-admin-project-detail .apd-panel').forEach(p => p.classList.add('hidden'));
    document.querySelector(`#screen-admin-project-detail [data-apd-panel="${id}"]`)?.classList.remove('hidden');
    refreshIcons();
  });
});
document.getElementById('apdSwapPm')?.addEventListener('click', () => window.ordoToast?.('PM 교체 제안을 접수했습니다','ok'));
document.getElementById('apdExtendContract')?.addEventListener('click', () => window.ordoToast?.('계약 연장 검토를 요청했습니다','ok'));
document.getElementById('apdEmergencyIntervene')?.addEventListener('click', () => window.ordoToast?.('긴급 개입이 발동되었습니다 — PM/클라이언트에 즉시 통보','crit'));

/* ================================================================
   [v2.1.0 — T8] screen-worker-task-detail 딥링크/액션
   - 작업자 Task 클릭 → window._currentTaskId 저장
   - #worker-cards 진입 시 상세 타이틀 갱신
   ================================================================ */
(function hookTaskDetailNav(){
  // wk-task-item 클릭 시 _currentTaskId 저장
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.wk-task-item');
    if (btn) {
      const id = btn.getAttribute('data-wk-task');
      window._currentTaskId = id;
    }
  });
  // 해시 변경 시 task-detail 진입 → 타이틀 갱신
  function updateTaskDetail(){
    const raw = (location.hash || '').replace('#','').split('?')[0];
    if (raw !== 'worker-task-detail') return;
    const id = window._currentTaskId;
    try {
      if (id && typeof WK_TASK_DATA !== 'undefined') {
        const t = WK_TASK_DATA.find(x => x.id === id);
        if (t) {
          const titleEl = document.getElementById('wkTaskDetailTitle'); if (titleEl) titleEl.textContent = t.title;
          const metaEl = document.getElementById('wkTaskDetailMeta'); if (metaEl) metaEl.textContent = `마감 ${t.deadline||'—'} · PM ${t.pm||'—'}`;
        }
      }
    } catch(e){}
  }
  window.addEventListener('hashchange', updateTaskDetail);
  updateTaskDetail();
})();
document.getElementById('wkTdSubmit')?.addEventListener('click', () => {
  const sheet = document.getElementById('wkSubmitSheet');
  if (sheet) sheet.classList.remove('hidden');
  else window.ordoToast?.('제출 시트를 준비 중입니다','warn');
});
document.getElementById('wkTdAsk')?.addEventListener('click', () => {
  const sheet = document.getElementById('wkAskSheet');
  if (sheet) sheet.classList.remove('hidden');
  else window.ordoToast?.('질문 시트를 준비 중입니다','warn');
});
document.getElementById('wkTdBlocker')?.addEventListener('click', () => {
  const sheet = document.getElementById('wkBlockerSheet');
  if (sheet) sheet.classList.remove('hidden');
  else window.ordoToast?.('블로커 시트를 준비 중입니다','warn');
});

/* ================================================================
  [Landing] Floating header scroll state
  ================================================================ */
(function initLandingFloatingHeader(){
  if (window.__ordoLandingFloatingHeaderInit) return;
  window.__ordoLandingFloatingHeaderInit = true;

  const landing = document.querySelector('#screen-landing.landing-dark');
  const header = landing?.querySelector('[data-landing-header]');
  const inner = header?.querySelector('.landing-floating-header-inner');
  const navLinks = Array.from(landing?.querySelectorAll('.landing-nav-link[href^="#"]') || []);
  if (!landing || !header || !inner) return;

  const navGroups = LANDING_NAV_GROUPS;
  const sections = [...new Set(Object.values(navGroups).flat())]
    .map(id => document.getElementById(id))
    .filter(Boolean);
  let ticking = false;

  function updateActiveNav() {
    if (!sections.length) return;
    const forcedId = window.__ordoLandingScrollTarget;
    if (forcedId && LANDING_SECTION_HASHES.has(forcedId)) {
      syncLandingNavActive(forcedId);
      return;
    }
    const headerOffset = getLandingNavActivationOffset();
    let currentId = sections[0].id;
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= headerOffset) currentId = section.id;
    }
    syncLandingNavActive(currentId);
  }

  function updateHeaderState() {
    const visible = landing.getClientRects().length > 0 && getComputedStyle(landing).display !== 'none';
    if (visible && window.scrollY > 24) document.body.classList.add('landing-header-scrolled');
    else if (!visible || window.scrollY <= 12) document.body.classList.remove('landing-header-scrolled');
    if (visible) updateActiveNav();
    ticking = false;
  }

  function requestHeaderStateUpdate() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateHeaderState);
  }

  window.addEventListener('scroll', requestHeaderStateUpdate, { passive: true });
  window.addEventListener('resize', updateHeaderState, { passive: true });
  window.addEventListener('hashchange', updateHeaderState);
  window.addEventListener('ordo:landing-nav-sync', updateHeaderState);
  updateHeaderState();

  inner.addEventListener('pointermove', (event) => {
    const rect = inner.getBoundingClientRect();
    inner.style.setProperty('--header-mx', `${event.clientX - rect.left}px`);
    inner.style.setProperty('--header-my', `${event.clientY - rect.top}px`);
  });
  inner.addEventListener('pointerleave', () => {
    inner.style.setProperty('--header-mx', '50%');
    inner.style.setProperty('--header-my', '50%');
  });
})();

/* ================================================================
  [Landing] Liquid-glass pointer reactive layer (scoped to landing)
  ================================================================ */
(function initLandingLiquidReactive(){
  const landing = document.querySelector('#screen-landing.landing-dark');
  if (!landing) return;

  const interactiveSelector = [
    '.landing-cta',
    '.landing-demo-shell',
    '.landing-demo-browserbar',
    '[data-liquid-card]',
    '.landing-pain-card',
    '.landing-odds-card',
    '.landing-chain-card',
    '.landing-gap-card',
    '.landing-stage-card',
    '.landing-rail-item',
    '.landing-principle-compact',
    '.landing-adoption-panel',
    '.landing-faq-item'
  ].join(', ');
  const interactiveNodes = Array.from(landing.querySelectorAll(interactiveSelector))
    .filter((node) => !node.closest('#odds'));
  if (!interactiveNodes.length) return;
  interactiveNodes.forEach((node) => node.classList.add('landing-liquid-interactive'));

  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const coarsePointerQuery = window.matchMedia('(hover: none), (pointer: coarse)');
  const hasPointerSupport = 'PointerEvent' in window;

  let reactiveEnabled = false;
  let landingRaf = 0;
  let landingPointerX = window.innerWidth * 0.62;
  let landingPointerY = window.innerHeight * 0.24;

  const cardStates = new WeakMap();
  interactiveNodes.forEach((node) => {
    cardStates.set(node, { raf: 0, x: 0, y: 0 });
  });

  const setLandingVars = (mx, my, rx, ry) => {
    landing.style.setProperty('--landing-mx', `${mx.toFixed(2)}%`);
    landing.style.setProperty('--landing-my', `${my.toFixed(2)}%`);
    landing.style.setProperty('--landing-rx', rx.toFixed(4));
    landing.style.setProperty('--landing-ry', ry.toFixed(4));
  };

  const resetLandingVars = () => {
    setLandingVars(62, 24, 0, 0);
  };

  const queueLandingUpdate = () => {
    if (landingRaf) return;
    landingRaf = requestAnimationFrame(() => {
      landingRaf = 0;
      if (!reactiveEnabled) return;
      const rect = landing.getBoundingClientRect();
      const width = Math.max(rect.width, 1);
      const height = Math.max(rect.height, 1);
      const px = ((landingPointerX - rect.left) / width) * 100;
      const py = ((landingPointerY - rect.top) / height) * 100;
      const mx = Math.max(0, Math.min(100, px));
      const my = Math.max(0, Math.min(100, py));
      const rx = (mx - 50) / 50;
      const ry = (my - 50) / 50;
      setLandingVars(mx, my, rx, ry);
    });
  };

  const resetCardVars = (node) => {
    node.style.setProperty('--card-mx', '50%');
    node.style.setProperty('--card-my', '50%');
    node.style.setProperty('--card-rx', '0');
    node.style.setProperty('--card-ry', '0');
    if (node.classList.contains('landing-cta')) {
      node.style.removeProperty('--cta-lx');
      node.style.removeProperty('--cta-ly');
    }
  };

  const applyCardVars = (node, state) => {
    state.raf = 0;
    if (!reactiveEnabled) return;
    const rect = node.getBoundingClientRect();
    const width = Math.max(rect.width, 1);
    const height = Math.max(rect.height, 1);
    const px = ((state.x - rect.left) / width) * 100;
    const py = ((state.y - rect.top) / height) * 100;
    const mx = Math.max(0, Math.min(100, px));
    const my = Math.max(0, Math.min(100, py));
    const rx = (mx - 50) / 50;
    const ry = (my - 50) / 50;

    node.style.setProperty('--card-mx', `${mx.toFixed(2)}%`);
    node.style.setProperty('--card-my', `${my.toFixed(2)}%`);
    node.style.setProperty('--card-rx', rx.toFixed(4));
    node.style.setProperty('--card-ry', ry.toFixed(4));

    if (node.classList.contains('landing-cta')) {
      const lx = Math.max(0, Math.min(rect.width, state.x - rect.left));
      const ly = Math.max(0, Math.min(rect.height, state.y - rect.top));
      node.style.setProperty('--cta-lx', `${lx.toFixed(1)}px`);
      node.style.setProperty('--cta-ly', `${ly.toFixed(1)}px`);
    }
  };

  const queueCardUpdate = (node, state) => {
    if (state.raf) return;
    state.raf = requestAnimationFrame(() => applyCardVars(node, state));
  };

  const onLandingPointerMove = (event) => {
    if (!reactiveEnabled) return;
    landingPointerX = event.clientX;
    landingPointerY = event.clientY;
    queueLandingUpdate();
  };

  const onLandingPointerLeave = () => {
    if (!reactiveEnabled) return;
    const rect = landing.getBoundingClientRect();
    landingPointerX = rect.left + rect.width * 0.62;
    landingPointerY = rect.top + rect.height * 0.24;
    queueLandingUpdate();
  };

  const onCardPointerMove = (event) => {
    if (!reactiveEnabled) return;
    const node = event.currentTarget;
    const state = cardStates.get(node);
    if (!state) return;
    state.x = event.clientX;
    state.y = event.clientY;
    node.classList.add('is-liquid-active');
    queueCardUpdate(node, state);
  };

  const onCardPointerLeave = (event) => {
    const node = event.currentTarget;
    node.classList.remove('is-liquid-active');
    resetCardVars(node);
  };

  const setReactiveState = (enabled) => {
    reactiveEnabled = enabled;
    landing.classList.toggle('landing-reactive-disabled', !enabled);
    if (!enabled) {
      resetLandingVars();
      interactiveNodes.forEach((node) => {
        node.classList.remove('is-liquid-active');
        resetCardVars(node);
      });
      return;
    }
    queueLandingUpdate();
  };

  const evaluateMotionPolicy = () => {
    const shouldDisable = !hasPointerSupport || reduceMotionQuery.matches || coarsePointerQuery.matches;
    setReactiveState(!shouldDisable);
  };

  const bindMediaChange = (mql, handler) => {
    if (typeof mql.addEventListener === 'function') mql.addEventListener('change', handler);
    else if (typeof mql.addListener === 'function') mql.addListener(handler);
  };

  landing.addEventListener('pointermove', onLandingPointerMove, { passive: true });
  landing.addEventListener('pointerenter', onLandingPointerMove, { passive: true });
  landing.addEventListener('pointerleave', onLandingPointerLeave, { passive: true });
  window.addEventListener('resize', queueLandingUpdate, { passive: true });
  interactiveNodes.forEach((node) => {
    node.addEventListener('pointermove', onCardPointerMove, { passive: true });
    node.addEventListener('pointerenter', onCardPointerMove, { passive: true });
    node.addEventListener('pointerleave', onCardPointerLeave, { passive: true });
  });
  bindMediaChange(reduceMotionQuery, evaluateMotionPolicy);
  bindMediaChange(coarsePointerQuery, evaluateMotionPolicy);

  evaluateMotionPolicy();
})();

/* ================================================================
  [Landing] Hero cinematic demo autoplay sequence
  ================================================================ */
(function initLandingDemoAutoplay(){
  const landing = document.querySelector('#screen-landing.landing-dark');
  if (!landing) return;
  const demos = Array.from(landing.querySelectorAll('.landing-demo-shell[data-demo-autoplay]'));
  if (!demos.length) return;

  const stageCount = 5;
  const cycleMs = 2600;
  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const coarsePointerQuery = window.matchMedia('(hover: none), (pointer: coarse)');
  const timers = new Map();
  let autoplayEnabled = true;

  const applyStage = (demo, stage) => {
    const normalized = ((stage % stageCount) + stageCount) % stageCount;
    demo.dataset.demoStage = String(normalized);
    demo.dataset.demoIndex = String(normalized);
    demo.querySelectorAll('.landing-demo-step').forEach((pill, index) => {
      pill.classList.toggle('is-active', index === normalized);
    });
  };

  const tick = (demo) => {
    const current = Number(demo.dataset.demoIndex || '0');
    applyStage(demo, current + 1);
  };

  const stop = (demo) => {
    const timerId = timers.get(demo);
    if (timerId) {
      clearInterval(timerId);
      timers.delete(demo);
    }
  };

  const start = (demo) => {
    stop(demo);
    if (!autoplayEnabled) return;
    const timerId = setInterval(() => tick(demo), cycleMs);
    timers.set(demo, timerId);
  };

  const bindMediaChange = (mql, handler) => {
    if (typeof mql.addEventListener === 'function') mql.addEventListener('change', handler);
    else if (typeof mql.addListener === 'function') mql.addListener(handler);
  };

  const updatePolicy = () => {
    autoplayEnabled = !(reduceMotionQuery.matches || coarsePointerQuery.matches);
    demos.forEach((demo) => {
      if (!autoplayEnabled) {
        stop(demo);
        applyStage(demo, 4);
      } else {
        if (!timers.has(demo)) start(demo);
      }
    });
  };

  demos.forEach((demo) => {
    applyStage(demo, 0);
    demo.addEventListener('pointerenter', () => stop(demo), { passive: true });
    demo.addEventListener('pointerleave', () => start(demo), { passive: true });
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) demos.forEach(stop);
    else updatePolicy();
  });

  bindMediaChange(reduceMotionQuery, updatePolicy);
  bindMediaChange(coarsePointerQuery, updatePolicy);
  updatePolicy();
})();

/* ================================================================
  [Landing] Fat-tail dice interaction
  ================================================================ */
(function initOddsDice(){
  const section = document.getElementById('odds');
  if (!section) return;

  const diceEl = section.querySelector('.odds-dice');
  const resultEl = section.querySelector('.odds-result');
  const counterEl = section.querySelector('.odds-counter');
  const rerollBtn = section.querySelector('.odds-reroll');
  if (!diceEl || !resultEl || !counterEl || !rerollBtn) return;

  const OUTCOMES = [
  { face: 1, probability: 0.205, label: '비용 약 347% 이상 초과', multiplier: 'x4.47+', color: '#EF4444', severity: 'critical', copy: '폭주 확률은 6분의 1보다 크며, 이 때의 손실 크기가 4·5·6이 나왔을 때의 절감분을 합친 것보다 훨씬 큽니다.' },
    { face: 2, probability: 0.175, label: '비용 50~200% 초과', multiplier: 'x1.5~3.0', color: '#F97316', severity: 'high', copy: '인접 파급이 시작되는 구간입니다. 작은 지연이 여러 모듈의 재작업으로 번집니다.' },
    { face: 3, probability: 0.195, label: '비용 20~50% 초과', multiplier: 'x1.2~1.5', color: '#EAB308', severity: 'medium', copy: '통제 가능한 초과처럼 보이지만, 명세와 검수 기준이 없으면 쉽게 확장됩니다.' },
    { face: 4, probability: 0.195, label: '비용 10~20% 초과', multiplier: 'x1.1~1.2', color: '#FACC15', severity: 'low', copy: '조기 감지와 승인 기준이 있다면 여기서 멈출 수 있는 구간입니다.' },
    { face: 5, probability: 0.225, label: '예산 내 완료', multiplier: 'x1.0', color: '#22C55E', severity: 'ok', copy: '구조화된 범위와 중간 검수가 작동할 때 가능한 결과입니다.' },
    { face: 6, probability: 0.005, label: '예산+일정 모두 충족', multiplier: '✦ PERFECT', color: '#FFD700', severity: 'perfect', copy: '0.5%의 완전 성공 구간입니다. 운이 아니라 운영 구조가 받쳐줘야 반복됩니다.' }
  ];

  const FACE_TRANSFORMS = {
    1: 'rotateX(-18deg) rotateY(24deg)',
    2: 'rotateX(-18deg) rotateY(204deg)',
    3: 'rotateX(-18deg) rotateY(114deg)',
    4: 'rotateX(-18deg) rotateY(-66deg)',
    5: 'rotateX(-108deg) rotateY(24deg)',
    6: 'rotateX(72deg) rotateY(24deg)'
  };

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let totalRolls = 0;
  let budgetOk = 0;
  let perfectOk = 0;
  let rolling = false;

  function weightedRandom(){
    const r = Math.random();
    let cumulative = 0;
    for (const outcome of OUTCOMES) {
      cumulative += outcome.probability;
      if (r <= cumulative) return outcome;
    }
    return OUTCOMES[OUTCOMES.length - 1];
  }

  function updateCounter(){
    counterEl.textContent = `${totalRolls}회 중, 예산 내 완료: ${budgetOk}회 · 예산+일정 동시 달성: ${perfectOk}회`;
  }

  function showResult(outcome){
    resultEl.hidden = false;
    resultEl.style.setProperty('--odds-result-color', outcome.color);
    resultEl.querySelector('.odds-face').textContent = outcome.face;
    resultEl.querySelector('.odds-label').textContent = outcome.label;
    resultEl.querySelector('.odds-multiplier').textContent = outcome.multiplier;
    resultEl.querySelector('.odds-copy').textContent = outcome.copy;
    diceEl.dataset.face = String(outcome.face);
    diceEl.style.transform = FACE_TRANSFORMS[outcome.face] || FACE_TRANSFORMS[5];
  }

  function finishRoll(outcome){
    diceEl.classList.remove('is-rolling');
    totalRolls += 1;
    if (outcome.face >= 5) budgetOk += 1;
    if (outcome.face === 6) perfectOk += 1;
    showResult(outcome);
    updateCounter();
    rolling = false;
  }

  function roll(){
    if (rolling) return;
    rolling = true;
    const outcome = weightedRandom();
    resultEl.hidden = true;
    if (reduceMotion.matches) {
      finishRoll(outcome);
      return;
    }
    diceEl.classList.add('is-rolling');
    window.setTimeout(() => finishRoll(outcome), 800);
  }

  showResult(OUTCOMES[2]);

  rerollBtn.addEventListener('click', roll);
  updateCounter();
})();

/* ================================================================
  [Landing] Chain reaction scroll interaction
  ================================================================ */
(function initChainReaction(){
  const section = document.getElementById('chain');
  if (!section) return;
  const diagram = section.querySelector('.chain-diagram');
  const caption = section.querySelector('.chain-caption');
  const costText = section.querySelector('.chain-cost-text');
  if (!diagram || !caption) return;

  const stages = [
    { threshold: 0, className: 'chain-stage-1', cost: 'x1.0', caption: '단일 장애 — 인증 모듈에서 버그가 발생합니다. 아직은 국소적 문제입니다.' },
    { threshold: 0.42, className: 'chain-stage-2', cost: 'x1.5~2.0', caption: '인접 파급 — API 서버와 DB 스키마로 영향이 번집니다. 비용이 1.5~2배로 뛰기 시작합니다.' },
    { threshold: 0.68, className: 'chain-stage-3', cost: 'x4.47+', caption: '전면 확산 — 프론트엔드, 결제 시스템, 배치 처리까지 전부 건드려야 합니다. 비용은 4배 이상, 최악의 경우 20배.' }
  ];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let ticking = false;

  function getProgress(){
    const rect = section.getBoundingClientRect();
    const viewH = window.innerHeight || document.documentElement.clientHeight;
    const total = rect.height + viewH;
    const scrolled = viewH - rect.top;
    return Math.max(0, Math.min(1, scrolled / total));
  }

  function applyStage(stage){
    diagram.classList.remove('chain-stage-0', 'chain-stage-1', 'chain-stage-2', 'chain-stage-3');
    diagram.classList.add(stage.className);
    if (costText) costText.textContent = stage.cost;
    caption.textContent = stage.caption;
  }

  function update(){
    if (reduceMotion.matches) {
      applyStage(stages[2]);
      return;
    }
    const progress = getProgress();
    let active = stages[0];
    stages.forEach((stage) => {
      if (progress >= stage.threshold) active = stage;
    });
    applyStage(active);
  }

  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      update();
      ticking = false;
    });
  }, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  update();
})();

/* ================================================================
  [Landing] FAQ accordion
  ================================================================ */
(function initFaqAccordion(){
  const faqItems = Array.from(document.querySelectorAll('#faq details.landing-faq-item'));
  if (!faqItems.length) return;

  faqItems.forEach((item, index) => {
    if (index === 0) item.open = true;
    item.addEventListener('toggle', () => {
      if (!item.open) return;
      faqItems.forEach((other) => {
        if (other !== item) other.open = false;
      });
    });
  });
})();

/* ================================================================
  [Landing] Gap dual-chain entry animation
  ================================================================ */
(function initGapAnimation(){
  const section = document.getElementById('gap');
  if (!section) return;
  const svg = section.querySelector('.landing-gap-flow');
  const conclusion = section.querySelector('.gap-conclusion');
  if (!svg) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (reduceMotion.matches) {
    svg.classList.remove('gap-anim-idle');
    svg.classList.add('gap-anim-active');
    if (conclusion) conclusion.classList.add('gap-conclusion-visible');
    return;
  }

  let hasPlayed = false;

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !hasPlayed) {
          hasPlayed = true;
          svg.classList.remove('gap-anim-idle');
          svg.classList.add('gap-anim-active');
          if (conclusion) {
            window.setTimeout(() => {
              conclusion.classList.add('gap-conclusion-visible');
            }, 2000);
          }
          observer.disconnect();
        }
      });
    }, { threshold: 0.4 });
    observer.observe(section);
  } else {
    svg.classList.remove('gap-anim-idle');
    svg.classList.add('gap-anim-active');
    if (conclusion) conclusion.classList.add('gap-conclusion-visible');
  }
})();

/* ================================================================
   [v2.0.0 — T7] 테스트 시나리오 힌트 (주석)
   ================================================================
  [시나리오 1] 외부 채널 의뢰 구조화 등록 → 접수함 반영
    1. DEV 바 role=admin → #admin-cards 진입
    2. 좌측 리스트 신규 건 선택 후 상세 확인
    3. 상단 "신규 카드 작성" 클릭 시 #admin-cards 진입 확인
    4. 취소/돌아가기 시 관리자 타임라인으로 복귀 확인
   [시나리오 2] PM 지정 → 클라이언트 홈 프로젝트 카드 추가
     1. role=admin → 접수함 → 아이템 선택 → [PM 지정] → PM 선택
     2. 토스트 확인
     3. role=client → 홈 → 진행 프로젝트 리스트 확인
   [시나리오 3] 작업자 Task 제출 → 양쪽 반영
     1. role=worker → 내 작업 → Task 선택 → [제출하기] → 제출
     2. 토스트 확인
     3. role=worker → 제출함 → 리스트 최상단 확인 (reviewing)
   ================================================================ */


