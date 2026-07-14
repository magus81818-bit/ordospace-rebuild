/* ============================================================
   [이 파일은] 작업자(worker) 화면을 담당하는 "무대 감독".
                개인 태스크 보드(Todo/Doing/Review/Done)와 ModuleCard 작업 화면을 그립니다.
                작업자는 여기서 QC 체크, 작업 기록 추가, 리뷰 요청을 합니다.
   [언제 실행] 라우터가 #worker-* 해시를 만나면 해당 render 함수를 호출.
   [주요 등장인물]
     - renderWkTaskList / selectWkTask  : 개인 태스크 목록 + 상세
     - renderWorkerCards / renderWorkerCardDetail : ModuleCard 목록 + 상세(QC/기록/리뷰)
   [연결] ← hash-router.js 의 renderModuleRouteScreens
          → lifecycle 서비스(updateQc, addWorkLog, addAttachment, submitWorkerReview)
          → ui/components(ModuleCardListItem, DetailHeader, QcList 등)
   [다음 읽을 파일] app/screens/client-workspace.screen.js
   [수정할 때 주의] worker 상세에서 QC 체크, 기록, 첨부, 리뷰 요청은 모두 lifecycle
                    서비스를 거칩니다. 직접 card.qcChecklist를 건드리면 저장이 안 됩니다.
   ============================================================ */

/* ── 【섹션 1】 개인 태스크 보드 — 역할 공통 Todo 관리 (시연용 로컬 데이터) ── */
function wkStatusBadge(s){
  const m = {
    Todo:{bg:'bg-bg-tertiary', bd:'border-bd-default', fg:'text-tx-secondary'},
    Doing:{bg:'bg-st-pendbg', bd:'border-st-pendbd', fg:'text-st-pendfg'},
    Review:{bg:'bg-st-warnbg', bd:'border-st-warnbd', fg:'text-st-warnfg'},
    Done:{bg:'bg-st-okbg', bd:'border-st-okbd', fg:'text-st-okfg'},
    Blocked:{bg:'bg-st-critbg', bd:'border-st-critbd', fg:'text-st-critfg'},
  }[s] || {bg:'bg-bg-tertiary', bd:'border-bd-default', fg:'text-tx-secondary'};
  return `<span class="inline-flex items-center gap-1 h-5 px-1.5 rounded ${m.bg} border ${m.bd} ${m.fg} text-[10px] font-semibold ordo-c-status-badge">${s}</span>`;
}
function wkPriorityBar(p){
  return {crit:'bg-st-critfg', warn:'bg-st-warnfg', normal:'bg-bd-emphasis'}[p] || 'bg-bd-emphasis';
}

let _wkTaskFilter = 'all';
function renderWkTaskList(filter){
  _wkTaskFilter = filter || _wkTaskFilter;
  const wrap = document.getElementById('wkTaskList');
  if (!wrap) return;
  const list = WK_TASK_DATA.filter(t => {
    if (_wkTaskFilter === 'all') return true;
    if (_wkTaskFilter === 'today') return t.dueTag === 'today';
    if (_wkTaskFilter === 'week') return t.dueTag === 'week' || t.dueTag === 'today';
    if (_wkTaskFilter === 'blocker') return t.status === 'Blocked';
    if (_wkTaskFilter === 'done') return t.status === 'Done';
    return true;
  });
  const cnt = document.getElementById('wkTaskCount'); if (cnt) cnt.textContent = list.length;
  wrap.innerHTML = list.map(t => `
    <button data-wk-task="${t.id}" class="wk-task-item w-full text-left relative bg-white border border-bd-default rounded-xl pl-5 pr-4 py-4 hover:border-bd-emphasis transition block">
      <span class="bar-l ${wkPriorityBar(t.priority)}"></span>
      <div class="flex items-center gap-2 mb-1.5 flex-wrap">
        ${wkStatusBadge(t.status)}
        <span class="text-[11px] text-tx-tertiary truncate">${t.project}</span>
      </div>
      <div class="text-[14px] font-semibold leading-snug">${t.title}</div>
      <div class="flex items-center justify-between mt-2">
        <span class="text-[11px] ${t.priority==='crit'?'text-st-critfg font-semibold':'text-tx-secondary'}">마감: ${t.due}</span>
        <span class="inline-flex items-center gap-1 text-[11px] text-tx-tertiary">
          ${t.attachments?`<i data-lucide="paperclip" class="w-3.5 h-3.5"></i>${t.attachments}`:''}
        </span>
      </div>
    </button>
  `).join('') || `<div class="py-8 text-center text-[12px] text-tx-tertiary">해당 조건의 Task가 없습니다</div>`;
  // 바인딩
  wrap.querySelectorAll('.wk-task-item').forEach(b => {
    b.addEventListener('click', () => selectWkTask(b.getAttribute('data-wk-task'), window.matchMedia('(min-width:1024px)').matches));
  });
  refreshIcons();
}

function selectWkTask(id, autoOpenDetail){
  const t = WK_TASK_DATA.find(x => x.id === id); if (!t) return;
  document.querySelectorAll('.wk-task-item').forEach(b => {
    if (b.getAttribute('data-wk-task') === id) b.classList.add('border-brand-primary','bg-bg-secondary');
    else b.classList.remove('border-brand-primary','bg-bg-secondary');
  });
  const body = document.getElementById('wkTaskDetailBody'); if (!body) return;
  const mt = document.getElementById('wkTaskDetailMobileTitle'); if (mt) mt.textContent = t.title;
  body.innerHTML = `
    <header class="mb-5">
      <div class="flex flex-wrap items-center gap-2 mb-2">
        ${wkStatusBadge(t.status)}
        <span class="text-[12px] text-tx-secondary">${t.project}</span>
      </div>
      <h1 class="text-[22px] lg:text-[28px] font-semibold leading-tight">${t.title}</h1>
      <div class="text-[12px] text-tx-secondary mt-2">마감: <span class="${t.priority==='crit'?'text-st-critfg font-semibold':'text-tx-primary font-medium'}">${t.due}</span></div>
    </header>
    <section class="bg-white border border-bd-default rounded-xl p-5 shadow-subtle mb-4">
      <h3 class="text-[14px] font-semibold mb-2">요구사항</h3>
      <p class="text-[14px] text-tx-primary leading-relaxed">${t.requirement}</p>
    </section>
    <section class="bg-white border border-bd-default rounded-xl p-5 shadow-subtle mb-4">
      <h3 class="text-[14px] font-semibold mb-3">첨부 파일 (${t.files.length})</h3>
      ${t.files.length ? `<ul class="divide-y divide-bd-default -mx-1">
        ${t.files.map(f => `<li class="flex items-center gap-3 px-1 py-2.5">
          <span class="w-8 h-8 rounded-md ft-${f.ft} border flex items-center justify-center text-[10px] font-bold uppercase">${f.ft}</span>
          <span class="flex-1 text-[13px] truncate">${f.name}</span>
          <i data-lucide="download" class="w-4 h-4 text-tx-tertiary"></i>
        </li>`).join('')}
      </ul>` : `<div class="text-[12px] text-tx-tertiary">첨부 파일이 없습니다</div>`}
    </section>
    <section class="bg-white border border-bd-default rounded-xl p-5 shadow-subtle mb-4">
      <h3 class="text-[14px] font-semibold mb-3">토론 스레드</h3>
      ${t.discussion.length ? `<ul class="space-y-4">
        ${t.discussion.map(c => `<li class="flex gap-3">
          <div class="w-8 h-8 rounded-full bg-bg-tertiary border border-bd-default flex items-center justify-center text-[11px] font-semibold shrink-0">${c.who.charAt(0)}</div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 text-[11px] text-tx-tertiary">
              <span class="text-tx-primary font-semibold text-[12px]">${c.who}</span> · ${c.role} · ${c.when}
            </div>
            <div class="text-[13px] mt-0.5 leading-relaxed">${c.msg}</div>
          </div>
        </li>`).join('')}
      </ul>` : `<div class="text-[12px] text-tx-tertiary">아직 코멘트가 없습니다</div>`}
    </section>
  `;
  refreshIcons();
  const listPane = document.getElementById('wkTasksListPane');
  const detailPane = document.getElementById('wkTaskDetailPane');
  if (autoOpenDetail || !window.matchMedia('(min-width:1024px)').matches) {
    listPane?.classList.add('hidden');
    detailPane?.classList.remove('hidden');
  }
  detailPane?.scrollTo?.({top:0, behavior:'instant'});
}

// 작업자 필터 바인딩
document.querySelectorAll('.wk-task-filter').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.wk-task-filter').forEach(b => {
      b.classList.remove('bg-brand-primary','text-white','active');
      b.classList.add('bg-white','border','border-bd-default','text-tx-secondary');
    });
    btn.classList.add('bg-brand-primary','text-white','active');
    btn.classList.remove('bg-white','border','border-bd-default','text-tx-secondary');
    renderWkTaskList(btn.getAttribute('data-wk-filter'));
  });
});
document.getElementById('wkTaskDetailBack')?.addEventListener('click', () => {
  document.getElementById('wkTasksListPane')?.classList.remove('hidden');
  document.getElementById('wkTaskDetailPane')?.classList.add('hidden');
});
// 작업자 ActionBar 바인딩
function openSheet(id){ const el = document.getElementById(id); if (!el) return; el.classList.remove('hidden'); setTimeout(()=>el.querySelector('.sheet')?.classList.add('open'),10); refreshIcons(); }
function closeSheet(id){ const el = document.getElementById(id); if (!el) return; el.querySelector('.sheet')?.classList.remove('open'); setTimeout(()=>el.classList.add('hidden'),200); }
document.getElementById('wkBtnSubmit')?.addEventListener('click', () => openSheet('wkSubmitSheet'));
document.getElementById('wkBtnAsk')?.addEventListener('click', () => openSheet('wkAskSheet'));
document.getElementById('wkBtnBlocker')?.addEventListener('click', () => openSheet('wkBlockerSheet'));
document.getElementById('wkSubmitSheet')?.addEventListener('click', (e)=>{ if (e.target.matches('[data-close-wk-submit]')) closeSheet('wkSubmitSheet'); });
document.getElementById('wkAskSheet')?.addEventListener('click', (e)=>{ if (e.target.matches('[data-close-wk-ask]')) closeSheet('wkAskSheet'); });
document.getElementById('wkBlockerSheet')?.addEventListener('click', (e)=>{ if (e.target.matches('[data-close-wk-blocker]')) closeSheet('wkBlockerSheet'); });
// 작업자 "오늘 마감" Hero Action → 필터 자동 활성
document.querySelectorAll('[data-wk-action="today"]').forEach(a => {
  a.addEventListener('click', () => { window._wkPendingFilter = 'today'; });
});
document.querySelectorAll('[data-wk-action="rejected"]').forEach(a => {
  a.addEventListener('click', () => { window._wkPendingSubFilter = 'rejected'; });
});

/* ============== 작업자 제출함 데이터 + 렌더 ============== */


let _wkSubFilter = 'all';
function wkSubStateBadge(s){
  const map = {
    submitting: ['제출중','pend'], reviewing:['검토중','warn'], approved:['승인','ok'], rejected:['반려','crit']
  };
  const [label, tone] = map[s] || ['?','rej'];
  return `<span class="inline-flex items-center gap-1 h-5 px-1.5 rounded bg-st-${tone}bg border border-st-${tone}bd text-st-${tone}fg text-[10px] font-semibold ordo-c-status-badge">${label}</span>`;
}
function renderWkSubList(){
  const wrap = document.getElementById('wkSubList');
  if (!wrap) return;
  const list = WK_SUB_DATA.filter(x => _wkSubFilter === 'all' ? true : x.status === _wkSubFilter);
  wrap.innerHTML = list.map(s => `
    <button data-wk-sub="${s.id}" class="wk-sub-item w-full text-left relative bg-white border border-bd-default rounded-xl pl-5 pr-4 py-4 hover:border-bd-emphasis transition block">
      <span class="bar-l ${({submitting:'bg-st-pendfg', reviewing:'bg-st-warnfg', approved:'bg-st-okfg', rejected:'bg-st-critfg'})[s.status]}"></span>
      <div class="flex items-center gap-2 mb-1.5 flex-wrap">
        ${wkSubStateBadge(s.status)}
        <span class="text-[11px] text-tx-tertiary">${s.version}</span>
      </div>
      <div class="text-[14px] font-semibold leading-snug">${s.title}</div>
      <div class="text-[11px] text-tx-secondary mt-1.5">${s.submittedAt}</div>
      ${s.remaining ? `<div class="text-[11px] text-st-warnfg font-semibold mt-1">${s.remaining}</div>` : ''}
    </button>
  `).join('') || `<div class="py-8 text-center text-[12px] text-tx-tertiary">해당 조건의 제출이 없습니다</div>`;
  wrap.querySelectorAll('.wk-sub-item').forEach(b => {
    b.addEventListener('click', () => selectWkSub(b.getAttribute('data-wk-sub'), window.matchMedia('(min-width:1024px)').matches));
  });
  refreshIcons();
}
function selectWkSub(id, autoOpenDetail){
  const s = WK_SUB_DATA.find(x => x.id === id); if (!s) return;
  document.querySelectorAll('.wk-sub-item').forEach(b => {
    if (b.getAttribute('data-wk-sub') === id) b.classList.add('border-brand-primary','bg-bg-secondary');
    else b.classList.remove('border-brand-primary','bg-bg-secondary');
  });
  const body = document.getElementById('wkSubDetailBody'); if (!body) return;
  body.innerHTML = `
    <header class="mb-5">
      <div class="flex items-center gap-2 mb-2">${wkSubStateBadge(s.status)}<span class="text-[12px] text-tx-secondary">${s.version}</span></div>
      <h1 class="text-[22px] lg:text-[28px] font-semibold leading-tight">${s.title}</h1>
      <div class="text-[12px] text-tx-secondary mt-2">${s.submittedAt}${s.remaining?` · <span class="text-st-warnfg font-semibold">${s.remaining}</span>`:''}</div>
    </header>
    <section class="bg-white border border-bd-default rounded-xl p-5 shadow-subtle mb-4">
      <h3 class="text-[14px] font-semibold mb-3">제출 내역</h3>
      <ul class="divide-y divide-bd-default -mx-1 mb-3">
        ${s.files.map(f => `<li class="flex items-center gap-3 px-1 py-2.5 text-[13px]"><i data-lucide="file-text" class="w-4 h-4 text-tx-secondary"></i>${f}</li>`).join('')}
      </ul>
      ${s.comment ? `<div class="text-[12px] text-tx-secondary">제출 코멘트: "${s.comment}"</div>` : ''}
    </section>
    ${s.feedback ? `<section class="rounded-xl p-5 mb-4 ${s.status==='rejected'?'bg-st-critbg border border-st-critbd':'bg-st-okbg border border-st-okbd'}">
      <h3 class="text-[14px] font-semibold mb-2 ${s.status==='rejected'?'text-st-critfg':'text-st-okfg'}">${s.status==='rejected'?'반려 사유':'승인 코멘트'}</h3>
      <div class="text-[11px] text-tx-tertiary mb-1">${s.feedback.by} · ${s.feedback.when}</div>
      <div class="text-[14px] leading-relaxed">${s.feedback.msg}</div>
    </section>` : ''}
    <section class="bg-white border border-bd-default rounded-xl p-5 shadow-subtle mb-4">
      <h3 class="text-[14px] font-semibold mb-3">버전 히스토리</h3>
      <ol class="ordo-c-timeline space-y-3">
        ${s.history.map(h => `<li class="flex gap-3">
          <span class="mt-1 w-2.5 h-2.5 rounded-full ${h.state==='current'?'bg-brand-primary ring-4 ring-brand-primary/15':'bg-st-okfg'}"></span>
          <div>
            <div class="text-[13px] font-semibold">${h.v} — ${h.what}</div>
            <div class="text-[11px] text-tx-tertiary">${h.date} · ${h.who}</div>
          </div>
        </li>`).join('')}
      </ol>
    </section>
  `;
  // ActionBar 상태별 활성화
  const btnResub = document.getElementById('wkBtnResubmit');
  const btnCancel = document.getElementById('wkBtnCancelSub');
  if (btnResub) btnResub.disabled = (s.status !== 'rejected');
  if (btnCancel) btnCancel.disabled = (s.status !== 'submitting');
  refreshIcons();
  const listPane = document.getElementById('wkSubListPane');
  const detailPane = document.getElementById('wkSubDetailPane');
  if (autoOpenDetail || !window.matchMedia('(min-width:1024px)').matches) {
    listPane?.classList.add('hidden');
    detailPane?.classList.remove('hidden');
  }
  detailPane?.scrollTo?.({top:0, behavior:'instant'});
}
document.querySelectorAll('.wk-sub-filter').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.wk-sub-filter').forEach(b => {
      b.classList.remove('bg-brand-primary','text-white','active');
      b.classList.add('bg-white','border','border-bd-default','text-tx-secondary');
    });
    btn.classList.add('bg-brand-primary','text-white','active');
    btn.classList.remove('bg-white','border','border-bd-default','text-tx-secondary');
    _wkSubFilter = btn.getAttribute('data-wk-sub-filter');
    renderWkSubList();
  });
});
document.getElementById('wkSubDetailBack')?.addEventListener('click', () => {
  document.getElementById('wkSubListPane')?.classList.remove('hidden');
  document.getElementById('wkSubDetailPane')?.classList.add('hidden');
});

/* ================================================================
   [v1.6.0 — T6] 크로스-롤 mock pub-sub
   ================================================================ */





// SLA 포맷 유틸 — "승인 기한 4/21 18:00 · 12h 32m 남음"

/* WORKER MODULECARD ROUTES */
const ORDO_CURRENT_WORKER = 'worker-001';

/* Client approval screen state moved to app/screens/client-workspace.screen.js */
let _workerCardFilter = 'all';
let _workerSelectedCardId = null;
let _workerRouteKey = '';
/* Client approvals renderer moved to app/screens/client-workspace.screen.js */
function currentWorkerCards(){return moduleCards().filter(c=>c.assignedTo===ORDO_CURRENT_WORKER);}
/* routeParams moved to app/ui/components/base.ui.js — global kept as delegate. */
function routeParams(){return window.ORDO_UI_COMPONENTS.routeParams();}
function sortByDueSoon(cards){return cards.slice().sort((a,b)=>(dateRank(a.dueDate||'2999-12-31')-dateRank(b.dueDate||'2999-12-31'))||(dateRank(b.createdAt)-dateRank(a.createdAt)));}
function workerFilterCards(cards,filter){if(filter==='revision')return cards.filter(c=>c.status==='revision');if(filter==='in_progress')return cards.filter(c=>c.status==='in_progress');if(filter==='review')return cards.filter(c=>c.status==='review');if(filter==='pending')return cards.filter(c=>c.status==='pending');if(filter==='done')return cards.filter(c=>['done','approved'].includes(c.status));if(filter==='today')return cards.filter(c=>c.dueDate===moduleTodayText()&&!['done','approved'].includes(c.status));return cards;}
function workerCardSummaryHtml(c,selected,attr){
  return window.ORDO_UI_COMPONENTS.ModuleCardListItem(c, {
    dataAttr: attr,
    selected: selected,
    metaParts: [ORDO_CHAIN_LABELS[c.chain] || c.chain, c.spec, c.gateRef]
  });
}
function renderWorkerHome(){const cards=currentWorkerCards();const weekly=ORDO_WORKER_WEEKLY_MH[ORDO_CURRENT_WORKER]||{logged:0,target:0};const inProgress=cards.filter(c=>c.status==='in_progress');const revisions=cards.filter(c=>c.status==='revision');const todayDue=cards.filter(c=>c.dueDate===moduleTodayText()&&!['done','approved'].includes(c.status));const pending=cards.filter(c=>c.status==='pending');setHtml('workerHomeKpis',moduleMetric('진행중',inProgress.length+'건','현재 작업 중')+moduleMetric('수정 필요',revisions.length+'건','PM 수정 요청',revisions.length?'text-st-critfg':'')+moduleMetric('오늘 마감',todayDue.length+'건','완료/승인 제외',todayDue.length?'text-st-warnfg':'')+moduleMetric('이번주 MH',weekly.logged+'/'+weekly.target,'workLogs 합산 샘플'));setHtml('workerHomeRevisions',revisions.map(c=>{const last=(c.comments||[]).slice().reverse().find(cm=>cm.role==='admin'||cm.author);return '<div>'+workerCardSummaryHtml(c,false,'data-worker-home-card')+'<div class="mt-2 rounded-lg border border-st-critbd bg-st-critbg px-3 py-2 text-[12px] text-st-critfg">PM 코멘트: '+moduleEsc(last?.text||'수정 요청 코멘트를 확인하세요.')+'</div></div>';}).join('')||'<div class="lg:col-span-2 rounded-xl border border-dashed border-bd-default bg-bg-secondary p-5 text-[13px] text-tx-secondary">수정 필요 Module이 없습니다.</div>');setHtml('workerHomeInProgress',inProgress.map(c=>workerCardSummaryHtml(c,false,'data-worker-home-card')).join('')||'<div class="lg:col-span-2 rounded-xl border border-dashed border-bd-default bg-bg-secondary p-5 text-[13px] text-tx-secondary">진행 중 Module이 없습니다.</div>');setHtml('workerHomePending',pending.map(c=>'<button type="button" data-worker-home-card="'+moduleEsc(c.id)+'" class="w-full flex items-center justify-between gap-3 px-4 lg:px-5 py-3 text-left hover:bg-bg-secondary"><span class="text-[13px] font-semibold text-tx-primary">'+moduleEsc(c.spec)+' — '+moduleEsc(c.module)+'</span><span class="text-[12px] text-tx-tertiary whitespace-nowrap">'+moduleEsc(c.dueDate||'-')+'</span></button>').join('')||'<div class="px-4 lg:px-5 py-5 text-[13px] text-tx-secondary">대기 중인 Module이 없습니다.</div>');document.querySelectorAll('[data-worker-home-card]').forEach(btn=>btn.addEventListener('click',()=>{const id=btn.getAttribute('data-worker-home-card');location.hash='#worker-cards?card='+encodeURIComponent(id);if(typeof navigate==='function')navigate(location.hash);}));if(window.refreshIcons)window.refreshIcons();else if(window.lucide)window.lucide.createIcons();}
function workerDetailHtml(c){
  const C = window.ORDO_UI_COMPONENTS;
  if (!c) return C.EmptyState('표시할 작업이 없습니다.', { variant: 'detail' });
  const qc = C.QcList(c.qcChecklist, { editable: true });
  const logs = C.WorkLogList(c.workLogs, { emptyText: '아직 작업 기록이 없습니다.' });
  const files = C.AttachmentList(c.attachments, { emptyText: '첨부 파일이 없습니다.' });
  const comments = C.CommentList(c.comments);
  const logAction = '<button type="button" data-worker-action="log" class="text-[12px] font-semibold text-tx-secondary hover:text-tx-primary">+ 기록 추가</button>';
  const attachAction = '<button type="button" data-worker-action="attach" class="text-[12px] font-semibold text-tx-secondary hover:text-tx-primary">+ 첨부</button>';
  return C.DetailHeader(c, {
      topText: (c.specCode || '') + ' · ' + (c.gateRef || ''),
      subText: (c.dial || '') + ' · 마감 ' + (c.dueDate || '-') + ' · MH ' + c.mhActual + '/' + c.mhEstimate
    })
    + '<details class="mt-5 rounded-xl border border-bd-default bg-bg-secondary p-4" open><summary class="cursor-pointer text-[13px] font-semibold">Recipe 참조</summary><p class="text-[13px] text-tx-secondary mt-3 leading-relaxed">도구: Claude Code → Cursor │ 공정: 스키마→API→UI→테스트 │ <a href="#" class="text-brand-primary font-semibold">전체 보기</a></p></details>'
    + '<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">'
    + C.DetailSection('QC 체크리스트', '<div class="divide-y divide-bd-default">' + qc + '</div>')
    + C.DetailSection('작업 기록', '<ul class="divide-y divide-bd-default">' + logs + '</ul>', { headerActionHtml: logAction, headerMargin: 'mb-2' })
    + C.DetailSection('산출물', '<div class="divide-y divide-bd-default">' + files + '</div>', { headerActionHtml: attachAction, headerMargin: 'mb-2' })
    + C.DetailSection('코멘트 스레드', '<div class="divide-y divide-bd-default">' + comments + '</div>', { titleMargin: 'mb-1' })
    + '</div>'
    + C.ActionToolbar([
        { attr: 'data-worker-action', value: 'log', icon: 'clock-plus', label: '작업 기록 추가' },
        { attr: 'data-worker-action', value: 'attach', icon: 'paperclip', label: '파일 첨부' },
        { attr: 'data-worker-action', value: 'review', icon: 'send', label: '리뷰 요청', variant: 'primary' }
      ], { layout: 'stack' });
}
/* Legacy direct-mutation bindWorkerDetailActions removed in round 8.
   The lifecycle-service version below is the only implementation. */

function workerAfterCardMutation(message,tone){
  window.ORDO_MODULE_CARD_LIFECYCLE?.persist();
  // Re-render only the active route; other module screens re-render on router entry.
  const route = (location.hash || '').replace('#','').split('?')[0] || 'worker-cards';
  if (typeof renderModuleRouteScreens === 'function') renderModuleRouteScreens(route);
  if (message) window.ordoToast?.(message, tone || 'ok');
}

function bindWorkerDetailActions(card){
  const lifecycle = window.ORDO_MODULE_CARD_LIFECYCLE;
  document.querySelectorAll('[data-worker-qc-index]').forEach(input=>input.addEventListener('change',()=>{
    const i=Number(input.getAttribute('data-worker-qc-index'));
    lifecycle?.updateQc(card,i,input.checked);
    workerAfterCardMutation('QC 체크리스트가 저장되었습니다','ok');
  }));
  document.querySelectorAll('[data-worker-action="log"]').forEach(btn=>btn.addEventListener('click',()=>{
    const text=prompt('작업 기록을 입력하세요.');
    if(!text||!text.trim())return;
    lifecycle?.addWorkLog(card,text.trim(),ORDO_CURRENT_WORKER);
    workerAfterCardMutation('작업 기록이 추가되었습니다','ok');
  }));
  document.querySelectorAll('[data-worker-action="attach"]').forEach(btn=>btn.addEventListener('click',()=>{
    const name=prompt('첨부할 파일명을 입력하세요.');
    if(!name||!name.trim())return;
    lifecycle?.addAttachment(card,name.trim());
    workerAfterCardMutation('파일 첨부가 추가되었습니다','ok');
  }));
  document.querySelectorAll('[data-worker-action="review"]').forEach(btn=>btn.addEventListener('click',()=>{
    try {
      const note=prompt('PM에게 보낼 리뷰 요청 메모를 입력하세요.','리뷰 요청: QC 완료 및 산출물 확인 부탁드립니다.');
      if(note===null)return;
      lifecycle?.submitWorkerReview(card,ORDO_CURRENT_WORKER,note);
      workerAfterCardMutation('PM에게 리뷰 요청 알림을 보냈습니다','ok');
    } catch(error) {
      alert(error.message || 'QC 완료 후 리뷰 요청할 수 있습니다.');
    }
  }));
};

function syncWorkerRouteState(){
  const params = routeParams();
  if (_workerRouteKey !== location.hash) {
    const f = params.get('filter');
    _workerCardFilter = f || 'all';
    _workerSelectedCardId = params.get('card') || _workerSelectedCardId;
    _workerRouteKey = location.hash;
  }
}

function resolveWorkerActiveCard(all, list){
  if (!_workerSelectedCardId || !all.some(function(c){ return c.id === _workerSelectedCardId; })) {
    _workerSelectedCardId = list[0]?.id || all[0]?.id || null;
  }
  const active = list.find(function(c){ return c.id === _workerSelectedCardId; })
    || all.find(function(c){ return c.id === _workerSelectedCardId; })
    || list[0]
    || all[0];
  if (active) _workerSelectedCardId = active.id;
  return active;
}

function renderWorkerFilterButtons(){
  document.querySelectorAll('[data-worker-filter]').forEach(function(btn){
    const activeFilter = btn.getAttribute('data-worker-filter') === _workerCardFilter;
    btn.classList.toggle('bg-brand-primary', activeFilter);
    btn.classList.toggle('text-white', activeFilter);
    if (btn.getAttribute('data-worker-filter') !== 'revision') {
      btn.classList.toggle('border', !activeFilter);
      btn.classList.toggle('border-bd-default', !activeFilter);
      btn.classList.toggle('bg-white', !activeFilter);
      btn.classList.toggle('text-tx-secondary', !activeFilter);
    }
  });
}

function renderWorkerCardList(list){
  const count = document.getElementById('workerCardCount');
  if (count) count.textContent = list.length + '\uAC74';
  const empty = '<div class="p-6 text-center text-[13px] text-tx-secondary">\uC870\uAC74\uC5D0 \uB9DE\uB294 \uC791\uC5C5\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.</div>';
  setHtml('workerCardList', list.map(function(c){
    return '<div class="p-3">' + workerCardSummaryHtml(c, c.id === _workerSelectedCardId, 'data-worker-card') + '</div>';
  }).join('') || empty);
}

function bindWorkerCardControls(){
  document.querySelectorAll('[data-worker-filter]').forEach(function(btn){
    btn.onclick = function(){
      _workerCardFilter = btn.getAttribute('data-worker-filter') || 'all';
      _workerRouteKey = location.hash;
      renderWorkerCards();
    };
  });
  document.querySelectorAll('[data-worker-card]').forEach(function(btn){
    btn.addEventListener('click', function(){
      _workerSelectedCardId = btn.getAttribute('data-worker-card');
      renderWorkerCards();
    });
  });
}

function renderWorkerCards(){
  syncWorkerRouteState();
  const all = sortByDueSoon(currentWorkerCards());
  const revisions = all.filter(function(c){ return c.status === 'revision'; });
  const list = workerFilterCards(all, _workerCardFilter);
  const active = resolveWorkerActiveCard(all, list);
  const badge = document.getElementById('workerRevisionBadge');
  if (badge) badge.textContent = String(revisions.length);

  renderWorkerFilterButtons();
  renderWorkerCardList(list);
  setHtml('workerCardDetail', workerDetailHtml(active));
  bindWorkerCardControls();
  if (active) bindWorkerDetailActions(active);
  if (window.refreshIcons) window.refreshIcons();
  else if (window.lucide) window.lucide.createIcons();
}
function renderWorkerCardsScreen(){renderWorkerCards();}
