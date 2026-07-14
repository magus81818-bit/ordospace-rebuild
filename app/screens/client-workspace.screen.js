/* ============================================================
   [이 파일은] 클라이언트(client) 화면을 담당하는 "무대 감독".
                대시보드(KPI), 프로젝트 타임라인, 카드 상세 모달, 승인/수정요청 화면을 그립니다.
                클라이언트는 여기서 산출물 확인, 승인, 수정 요청을 합니다.
   [언제 실행] 라우터가 #client-* 해시를 만나면 해당 render 함수를 호출.
   [주요 등장인물]
     - renderDashboard         : KPI 숫자 카드 + 승인률 + 대기 카드 미리보기
     - renderProject / renderProjectTimeline : 프로젝트 진행 타임라인 + 필터
     - openCardDetail / closeCardDetail : 카드 상세 모달 열기/닫기
     - renderApprovals / approvalDetailHtml : 승인 대기 목록 + 상세(산출물 미리보기)
   [연결] ← hash-router.js 의 renderModuleRouteScreens
          → lifecycle 서비스(approveClient, requestRevision, addFreeComment)
          → ui/components(ModuleCardListItem, DetailHeader, MetaGrid, QcList, ActionToolbar 등)
   [다음 읽을 파일] app/services/module-card-lifecycle.service.js (심판)
   [수정할 때 주의] 승인/수정요청은 lifecycle 서비스의 approveClient / requestRevision을
                    거칩니다. 카드 상태 직접 변경 절대 금지.
   ============================================================ */

const ORDO_CLIENT_PROJECT_META = {id:'proj-001',name:'○○커머스 리빌드',pm:'이매니저',contractMh:480,nextGate:'Design Lock'};
const ORDO_CHAIN_LABELS = {design:'Design',dev:'Dev',ops:'Ops'};
const ORDO_STEP_LABELS = {1:'스코핑',2:'계약',3:'제작',4:'납품'};
let _clientProjectChainFilter = 'all';
let _clientProjectStatusFilter = 'all';
let _clientProjectTab = 'timeline';
let _clientProjectModalBound = false;
function clientProjectCards(){return moduleCards().filter(c=>c.projectId===ORDO_CLIENT_PROJECT_META.id);}
/* Shared format/date helpers moved to app/ui/components/base.ui.js — globals kept as delegates. */
function safePct(part,total){return window.ORDO_UI_COMPONENTS.safePct(part,total);}
function todayDateText(){return window.ORDO_UI_COMPONENTS.todayDateText();}
function nowDisplayText(){return window.ORDO_UI_COMPONENTS.nowDisplayText();}
function dateRank(v){return window.ORDO_UI_COMPONENTS.dateRank(v);}
function displayDate(v){return window.ORDO_UI_COMPONENTS.displayDate(v);}
/* statusBadgeHtml moved to app/ui/components/status.ui.js (loaded earlier). */
/* progressTrackHtml moved to app/ui/components/metric.ui.js (loaded earlier). */
function clientProjectProgress(){const cards=clientProjectCards();const approved=cards.filter(c=>c.status==='approved').length;return {total:cards.length,approved:approved,pct:safePct(approved,cards.length)};}
function clientStepProgressHtml(){const p=clientProjectProgress();const steps=[['스코핑','✓','완료',100],['계약','✓','완료',100],['제작','◉',p.pct+'%',p.pct],['납품','○','대기',0]];return '<div class="grid grid-cols-4 gap-2">'+steps.map((s,i)=>'<div class="rounded-xl border '+(i<2?'border-st-okbd bg-st-okbg':(i===2?'border-st-pendbd bg-st-pendbg':'border-bd-default bg-bg-secondary'))+' p-3"><div class="flex items-center justify-between gap-2 text-[12px] font-semibold"><span>'+moduleEsc(s[0])+'</span><span>'+moduleEsc(s[1])+'</span></div><div class="mt-2 text-[18px] font-semibold tabular '+(i<2?'text-st-okfg':(i===2?'text-st-pendfg':'text-tx-tertiary'))+'">'+moduleEsc(s[2])+'</div><div class="mt-2 progress-track"><div class="progress-fill" style="width:'+s[3]+'%"></div></div></div>').join('')+'</div>';}
function renderDashboard(){const cards=clientProjectCards();const total=cards.length;const inProgress=cards.filter(c=>['in_progress','review','revision'].includes(c.status)).length;const pending=cards.filter(c=>c.status==='done');const approved=cards.filter(c=>c.status==='approved').length;setHtml('clientDashboardKpis',moduleMetric('전체 카드',total+'건','proj-001 Module 전체')+moduleMetric('진행중',inProgress+'건','진행/검토/수정요청','text-st-pendfg')+moduleMetric('승인 대기',pending.length+'건','완료 후 승인 필요',pending.length?'text-st-warnfg':'text-st-okfg')+moduleMetric('완료',approved+'건','클라이언트 승인 완료','text-st-okfg'));const prog=clientProjectProgress();setHtml('clientDashboardStepProgress',clientStepProgressHtml());setHtml('clientDashboardChainProgress',['design','dev','ops'].map(chain=>{const list=cards.filter(c=>c.chain===chain);return progressTrackHtml(ORDO_CHAIN_LABELS[chain],list.filter(c=>c.status==='approved').length,list.length,ORDO_CHAIN_LABELS[chain]+' Chain 승인 완료 기준');}).join(''));setHtml('clientDashboardApprovalCards',pending.slice(0,3).map(moduleCard).join('')||'<div class="rounded-xl border border-dashed border-bd-default bg-bg-secondary p-5 text-[13px] text-tx-secondary">현재 승인 대기 Module이 없습니다.</div>');const rate=document.getElementById('clientDashboardProgressRate');if(rate)rate.textContent=prog.pct+'%';const pm=document.getElementById('clientDashboardPmMeta');if(pm)pm.textContent='오늘 리뷰 처리: '+cards.filter(c=>['done','review'].includes(c.status)).length+'건 │ 다음 Gate: '+ORDO_CLIENT_PROJECT_META.nextGate;if(window.refreshIcons)window.refreshIcons();else if(window.lucide)window.lucide.createIcons();}
function projectModuleCard(c){
  return window.ORDO_UI_COMPONENTS.ModuleCardListItem(c, {
    tag: 'article',
    interactive: true,
    dataAttr: 'data-project-card-id',
    metaParts: [ORDO_CHAIN_LABELS[c.chain] || c.chain, c.spec, c.gateRef]
  });
}
function renderProjectTimeline(){const status=document.getElementById('clientProjectStatusFilter');if(status&&status.value!==_clientProjectStatusFilter)status.value=_clientProjectStatusFilter;document.querySelectorAll('[data-project-chain-filter]').forEach(btn=>{const active=btn.getAttribute('data-project-chain-filter')===_clientProjectChainFilter;btn.classList.toggle('bg-brand-primary',active);btn.classList.toggle('text-white',active);btn.classList.toggle('border',!active);btn.classList.toggle('border-bd-default',!active);btn.classList.toggle('bg-white',!active);btn.classList.toggle('text-tx-secondary',!active);});let cards=clientProjectCards().slice().sort((a,b)=>(Number(a.step||0)-Number(b.step||0))||(dateRank(a.createdAt)-dateRank(b.createdAt)));if(_clientProjectChainFilter!=='all')cards=cards.filter(c=>c.chain===_clientProjectChainFilter);if(_clientProjectStatusFilter!=='all')cards=cards.filter(c=>c.status===_clientProjectStatusFilter);const steps=[...new Set(cards.map(c=>c.step||3))];const designCards=clientProjectCards().filter(c=>c.chain==='design');const gatePassed=designCards.length>0&&designCards.every(c=>c.status==='approved');const timelineHtml=steps.map(step=>{const group=cards.filter(c=>(c.step||3)===step);return '<section><div class="flex items-center gap-3 mb-3"><span class="text-[13px] font-semibold text-tx-primary whitespace-nowrap">Step '+moduleEsc(step)+': '+moduleEsc(ORDO_STEP_LABELS[step]||'진행')+'</span><span class="h-px bg-bd-default flex-1"></span></div><div class="grid grid-cols-1 lg:grid-cols-2 gap-3">'+group.map(projectModuleCard).join('')+'</div><div class="flex items-center gap-3 mt-5"><span class="h-px bg-bd-default flex-1"></span><span class="text-[12px] font-semibold text-tx-secondary whitespace-nowrap">Gate 2: Design Lock</span><span class="text-[12px] font-semibold '+(gatePassed?'text-st-okfg':'text-st-warnfg')+'">'+(gatePassed?'통과':'미통과')+'</span><span class="h-px bg-bd-default flex-1"></span></div></section>';}).join('');setHtml('clientProjectTimeline',timelineHtml||'<div class="rounded-xl border border-dashed border-bd-default bg-bg-secondary p-6 text-[13px] text-tx-secondary">조건에 맞는 Module이 없습니다.</div>');document.querySelectorAll('[data-project-card-id]').forEach(card=>{card.onclick=()=>openCardDetail(card.getAttribute('data-project-card-id'));card.onkeydown=(event)=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openCardDetail(card.getAttribute('data-project-card-id'));}};});if(window.refreshIcons)window.refreshIcons();else if(window.lucide)window.lucide.createIcons();}
function renderProjectArtifacts(){const rows=clientProjectCards().filter(c=>c.status==='approved').flatMap(c=>(c.attachments||[]).map(a=>({card:c,asset:a}))).sort((a,b)=>dateRank(b.asset.date)-dateRank(a.asset.date));setHtml('clientProjectArtifacts',rows.map(row=>'<a href="'+moduleEsc(row.asset.url||'#')+'" class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-3 p-4 bg-white hover:bg-bg-secondary text-[13px]"><span class="font-semibold text-tx-primary">📎 '+moduleEsc(row.asset.name)+' — '+moduleEsc(row.card.spec)+' '+moduleEsc(row.card.module)+'</span><span class="text-tx-tertiary">'+moduleEsc(row.asset.date||row.card.approvedAt||'-')+'</span></a>').join('')||'<div class="p-6 bg-bg-secondary text-[13px] text-tx-secondary">승인 완료 산출물이 없습니다.</div>');}
function updateProjectTabView(){const timeline=document.getElementById('clientProjectTimelinePanel'),assets=document.getElementById('clientProjectAssetsPanel');if(timeline)timeline.classList.toggle('hidden',_clientProjectTab!=='timeline');if(assets)assets.classList.toggle('hidden',_clientProjectTab!=='assets');document.querySelectorAll('[data-project-tab]').forEach(btn=>{const active=btn.getAttribute('data-project-tab')===_clientProjectTab;btn.classList.toggle('border-brand-primary',active);btn.classList.toggle('border-transparent',!active);btn.classList.toggle('text-tx-primary',active);btn.classList.toggle('text-tx-tertiary',!active);btn.classList.toggle('font-semibold',active);btn.classList.toggle('font-medium',!active);});if(_clientProjectTab==='assets')renderProjectArtifacts();else renderProjectTimeline();}
function bindProjectControls(){document.querySelectorAll('[data-project-tab]').forEach(btn=>{btn.onclick=()=>{_clientProjectTab=btn.getAttribute('data-project-tab')||'timeline';updateProjectTabView();};});document.querySelectorAll('[data-project-chain-filter]').forEach(btn=>{btn.onclick=()=>{_clientProjectChainFilter=btn.getAttribute('data-project-chain-filter')||'all';renderProjectTimeline();};});const status=document.getElementById('clientProjectStatusFilter');if(status)status.onchange=()=>{_clientProjectStatusFilter=status.value||'all';renderProjectTimeline();};bindCardDetailModal();}
function renderProject(){const prog=clientProjectProgress();setHtml('clientProjectStepProgress',clientStepProgressHtml());const rate=document.getElementById('clientProjectProgressRate');if(rate)rate.textContent=prog.pct+'%';bindProjectControls();updateProjectTabView();if(window.refreshIcons)window.refreshIcons();else if(window.lucide)window.lucide.createIcons();}
function cardDetailBodyHtml(c){
  const C = window.ORDO_UI_COMPONENTS;
  const p = ORDO_MODULE_PEOPLE[c.assignedTo || 'unassigned'] || ORDO_MODULE_PEOPLE.unassigned;
  const qc = C.QcList(c.qcChecklist, { checkedLabel: '✓ 체크' });
  const files = C.AttachmentList(c.attachments);
  const comments = C.CommentList(c.comments, { emptyText: '아직 코멘트가 없습니다.' });
  // Modal-specific header (h3/text-[20px]/mb-5) stays inline; the rest comes from primitives.
  return '<div class="flex items-start justify-between gap-3 mb-5"><div><p class="text-[12px] text-tx-tertiary">'+moduleEsc(c.spec)+' · '+moduleEsc(c.dial)+'</p><h3 class="text-[20px] font-semibold mt-1">'+moduleEsc(c.module)+'</h3></div>'+statusBadgeHtml(c.status)+'</div>'
    + C.MetaGrid([
        ['담당', p.name],
        ['PM', ORDO_CLIENT_PROJECT_META.pm],
        ['MH', c.mhActual + ' / ' + c.mhEstimate],
        ['마감', c.dueDate || '-'],
        ['Gate', c.gateRef || '-'],
        ['Chain', ORDO_CHAIN_LABELS[c.chain] || c.chain || '-']
      ], { margin: 'bottom' })
    + '<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">'
    + C.DetailSection('QC 체크리스트', '<ul class="divide-y divide-bd-default">' + qc + '</ul>', { titleTag: 'h4' })
    + C.DetailSection('산출물', '<div class="divide-y divide-bd-default">' + files + '</div>', { titleTag: 'h4' })
    + '</div>'
    + C.DetailSection('코멘트 스레드', '<div class="divide-y divide-bd-default">' + comments + '</div>', { titleTag: 'h4', titleMargin: 'mb-1', className: 'mt-4' });
}
/* Legacy direct-mutation openCardDetail removed in round 9.
   The lifecycle-service version below is the only implementation. */
function closeCardDetail(){const modal=document.getElementById('cardDetailModal');if(modal){modal.classList.add('hidden');modal.setAttribute('aria-hidden','true');}document.body.classList.remove('overflow-hidden');window._clientActiveCardId=null;}
function bindCardDetailModal(){if(_clientProjectModalBound)return;_clientProjectModalBound=true;document.getElementById('cardDetailClose')?.addEventListener('click',closeCardDetail);const modal=document.getElementById('cardDetailModal');modal?.addEventListener('click',event=>{if(event.target===modal)closeCardDetail();});document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!document.getElementById('cardDetailModal')?.classList.contains('hidden'))closeCardDetail();});}
window.openCardDetail=openCardDetail;
window.closeCardDetail=closeCardDetail;

function renderProjectScreen(){renderProject();}

let _approvalSelectedCardId = null;
function renderApprovalsScreen(){renderApprovals();}
function approvalCards(){return clientProjectCards().filter(c=>c.status==='done').sort((a,b)=>dateRank(b.completedAt||b.createdAt)-dateRank(a.completedAt||a.createdAt));}
/* attachmentPreviewHtml moved to app/ui/components/detail.ui.js (AttachmentPreviewItem / AttachmentList preview option). */
function approvalDetailHtml(c){
  const C = window.ORDO_UI_COMPONENTS;
  if (!c) return C.EmptyState('모든 항목을 확인했습니다 ✓', { variant: 'detail-emphasis' });
  const p = ORDO_MODULE_PEOPLE[c.assignedTo || 'unassigned'] || ORDO_MODULE_PEOPLE.unassigned;
  const qc = C.QcList(c.qcChecklist, { checkedLabel: '✓ 체크' });
  const files = C.AttachmentList(c.attachments, { preview: true });
  const comments = C.CommentList(c.comments, { emptyText: '아직 코멘트가 없습니다.' });
  return C.DetailHeader(c, {
      topText: (c.specCode || '') + ' · ' + (c.gateRef || ''),
      subText: (c.dial || '') + ' 완료본의 QC와 산출물을 확인합니다.'
    })
    + C.MetaGrid([
        ['담당', p.name],
        ['PM', ORDO_CLIENT_PROJECT_META.pm],
        ['MH', c.mhActual + ' / ' + c.mhEstimate],
        ['마감', c.dueDate || '-'],
        ['Gate', c.gateRef || '-'],
        ['완료일', c.completedAt || '-']
      ])
    + C.DetailSection('산출물 미리보기', '<div class="space-y-2">' + files + '</div>', { titleMargin: 'mb-3', className: 'mt-5' })
    + '<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">'
    + C.DetailSection('QC 체크리스트', '<ul class="divide-y divide-bd-default">' + qc + '</ul>')
    + C.DetailSection('코멘트 스레드', '<div class="divide-y divide-bd-default">' + comments + '</div>', { titleMargin: 'mb-1' })
    + '</div>'
    + C.ActionToolbar([
        { attr: 'data-approval-comment', value: c.id, icon: 'message-square-plus', label: '코멘트' },
        { attr: 'data-approval-revision', value: c.id, icon: 'rotate-ccw', label: '수정 요청', variant: 'warn' },
        { attr: 'data-approval-approve', value: c.id, icon: 'check', label: '승인', variant: 'primary' }
      ], { layout: 'stack' });
}
/* Legacy direct-mutation renderApprovals removed in round 10.
   The lifecycle-service version below is the only implementation. */

function clientAfterCardMutation(message,tone){
  window.ORDO_MODULE_CARD_LIFECYCLE?.persist();
  // Re-render only the active route; other module screens re-render on router entry.
  const route = (location.hash || '').replace('#','').split('?')[0] || 'approvals';
  if (typeof renderModuleRouteScreens === 'function') renderModuleRouteScreens(route);
  if (message) window.ordoToast?.(message, tone || 'ok');
}

function openCardDetail(cardId){
  const card=clientProjectCards().find(c=>c.id===cardId);
  if(!card)return;
  const lifecycle=window.ORDO_MODULE_CARD_LIFECYCLE;
  window._clientActiveCardId=cardId;
  const modal=document.getElementById('cardDetailModal'),title=document.getElementById('cardDetailTitle'),body=document.getElementById('cardDetailBody'),approve=document.getElementById('cardDetailApprove'),comment=document.getElementById('cardDetailComment');
  if(title)title.textContent=card.module;
  if(body)body.innerHTML=cardDetailBodyHtml(card);
  if(approve){
    const canApprove=card.status==='done';
    approve.disabled=!canApprove;
    approve.classList.toggle('opacity-50',!canApprove);
    approve.classList.toggle('cursor-not-allowed',!canApprove);
    approve.innerHTML=card.status==='approved'?'<i data-lucide="check-circle" class="w-4 h-4"></i>승인됨':(canApprove?'<i data-lucide="check" class="w-4 h-4"></i>승인':'<i data-lucide="lock" class="w-4 h-4"></i>승인 대기 아님');
    approve.onclick=()=>{
      if(!canApprove)return;
      try {
        lifecycle?.approveClient(card);
        closeCardDetail();
        clientAfterCardMutation('승인 처리되었습니다','ok');
      } catch(error) {
        alert(error.message || '승인할 수 없는 상태입니다.');
      }
    };
  }
  if(comment){
    comment.onclick=()=>{
      const text=prompt('추가할 코멘트를 입력하세요.');
      if(!text||!text.trim())return;
      lifecycle?.addFreeComment(card,'client',text.trim(),'클라이언트');
      openCardDetail(card.id);
      renderDashboard();
      renderProjectArtifacts();
      window.ordoToast?.('코멘트가 추가되었습니다','ok');
    };
  }
  if(modal){
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden','false');
    document.body.classList.add('overflow-hidden');
  }
  if(window.refreshIcons)window.refreshIcons();else if(window.lucide)window.lucide.createIcons();
};

/* String-splice monkeypatch removed in round 10 — the revision button is now a
   first-class ActionToolbar entry inside approvalDetailHtml. */

function renderApprovals(){
  const lifecycle=window.ORDO_MODULE_CARD_LIFECYCLE;
  const cards=approvalCards();
  const count=document.getElementById('clientApprovalCount');
  if(count)count.textContent=cards.length+'건';
  if(!_approvalSelectedCardId||!cards.some(c=>c.id===_approvalSelectedCardId))_approvalSelectedCardId=cards[0]?.id||null;
  const left=document.getElementById('clientApprovalList');
  if(left)left.innerHTML=cards.map(c=>'<button type="button" data-approval-card="'+moduleEsc(c.id)+'" class="w-full text-left p-4 hover:bg-bg-secondary '+(c.id===_approvalSelectedCardId?'bg-bg-secondary':'')+'"><div class="flex items-start justify-between gap-3"><div class="min-w-0"><div class="text-[13px] font-semibold text-tx-primary truncate">'+moduleEsc(c.module)+'</div><div class="text-[11px] text-tx-tertiary mt-1 truncate">'+moduleEsc(c.spec)+' · '+moduleEsc(c.gateRef)+' · '+moduleEsc(c.completedAt||c.createdAt||'-')+'</div></div>'+window.ORDO_UI_COMPONENTS.StatusBadge(moduleLabel(c.status),'warn')+'</div></button>').join('')||'<div class="p-6 text-center text-[13px] font-semibold text-st-okfg">모든 항목을 확인했습니다 ✓</div>';
  const current=cards.find(c=>c.id===_approvalSelectedCardId);
  setHtml('clientApprovalDetail',approvalDetailHtml(current));
  left?.querySelectorAll('[data-approval-card]').forEach(btn=>btn.addEventListener('click',()=>{_approvalSelectedCardId=btn.getAttribute('data-approval-card');renderApprovals();}));
  document.querySelectorAll('[data-approval-approve]').forEach(btn=>btn.addEventListener('click',()=>{
    const card=moduleCards().find(c=>c.id===btn.getAttribute('data-approval-approve'));
    if(!card)return;
    try {
      lifecycle?.approveClient(card);
      _approvalSelectedCardId=null;
      clientAfterCardMutation('승인 처리되었습니다','ok');
    } catch(error) {
      alert(error.message || '승인할 수 없는 상태입니다.');
    }
  }));
  document.querySelectorAll('[data-approval-revision]').forEach(btn=>btn.addEventListener('click',()=>{
    const card=moduleCards().find(c=>c.id===btn.getAttribute('data-approval-revision'));
    if(!card)return;
    const text=prompt('수정 요청 내용을 입력하세요.');
    if(!text||!text.trim())return;
    try {
      lifecycle?.requestRevision(card,{role:'client',note:text.trim()});
      _approvalSelectedCardId=null;
      clientAfterCardMutation('수정 요청으로 전달되었습니다','warn');
    } catch(error) {
      alert(error.message || '수정 요청할 수 없는 상태입니다.');
    }
  }));
  document.querySelectorAll('[data-approval-comment]').forEach(btn=>btn.addEventListener('click',()=>{
    const card=moduleCards().find(c=>c.id===btn.getAttribute('data-approval-comment'));
    if(!card)return;
    const text=prompt('코멘트를 입력하세요.');
    if(!text||!text.trim())return;
    lifecycle?.addFreeComment(card,'client',text.trim(),'클라이언트');
    renderApprovals();
    window.ordoToast?.('코멘트가 추가되었습니다','ok');
  }));
  if(window.refreshIcons)window.refreshIcons();else if(window.lucide)window.lucide.createIcons();
};

window.ORDO_CLIENT_PROJECT_META = ORDO_CLIENT_PROJECT_META;
window.ORDO_CHAIN_LABELS = ORDO_CHAIN_LABELS;
window.ORDO_CLIENT_WORKSPACE_SCREEN = {
  clientProjectCards,
  clientProjectProgress,
  renderDashboard,
  renderProject,
  renderProjectScreen,
  renderApprovals,
  renderApprovalsScreen,
  openCardDetail,
  closeCardDetail
};
window.ORDO_CLIENT_RENDER_READY = true;
