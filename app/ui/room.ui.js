/* ============================================================
   [이 파일은] Room 계열 화면의 "UI 부품 도우미" — 배지·메트릭·탭 필터 등
                Room 화면에서 반복되는 HTML 조각을 조립하는 함수 모음.
   [언제 실행] 페이지 로드 시 (index.html에서 로드)
   [주요 등장인물]
     - roomBadge: 상태 배지 HTML 생성 (tone 색상 적용)
     - roomMetric: KPI 카드 HTML 생성
     - getRoomTabFilterValue: 한글 탭 라벨 → 필터 코드 변환 (예: "승인 대기" → "approval")
     - roomEsc: XSS 방어용 이스케이프 (base.ui.js의 escapeHtml과 동일 역할)
   [연결]
     ← app/screens/ 에서 Room 관련 렌더 시 호출
     → app/data/room.data.js (ORDO_ROOM_DATA 참조)
   [다음 읽을 파일] app/screens/admin-workspace.screen.js
   [수정할 때 주의] 함수 이름이 전역(window)에 노출 — 이름 변경 시 호출부 전수 검색 필요.
                    roomEsc는 base.ui.js의 escapeHtml과 중복이지만, 로드 순서 의존성 때문에 유지.
   ============================================================ */
function roomEsc(v){ return String(v == null ? '' : v).replace(/[&<>"']/g, function(ch){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch]; }); }
document.addEventListener('click', function(e){
  const btn = e.target.closest?.('[data-pm-connect]');
  if (!btn) return;
  e.preventDefault();
  e.stopPropagation();
  const pmId = btn.getAttribute('data-pm-id') || '';
  const pm = (ORDO_ROOM_DATA.pms || []).find(function(p){ return p.id === pmId; });
  // Phase 2 can replace this toast with:
  // location.hash = '#project?pmId=' + encodeURIComponent(pmId)
  if (pm) window.ordoToast?.(pm.name + ' 연결 페이지가 준비 중입니다.', 'warn');
  else window.ordoToast?.('PM 연결 페이지가 준비 중입니다.', 'warn');
});
function roomTone(tone){ return ({ crit:'bg-st-critbg border-st-critbd text-st-critfg', warn:'bg-st-warnbg border-st-warnbd text-st-warnfg', pend:'bg-st-pendbg border-st-pendbd text-st-pendfg', rej:'bg-st-rejbg border-st-rejbd text-st-rejfg', ok:'bg-st-okbg border-st-okbd text-st-okfg' })[tone] || 'bg-bg-tertiary border-bd-default text-tx-secondary'; }
function roomDot(tone){ return ({ crit:'bg-st-critfg', warn:'bg-st-warnfg', pend:'bg-st-pendfg', rej:'bg-st-rejfg', ok:'bg-st-okfg' })[tone] || 'bg-tx-tertiary'; }
function roomLabel(label){ return ({ 'client-approval':'승인 대기', 'client-confirm-pending':'컨펌 대기', 'client-change-request':'변경 요청', 'client-deliverable-review':'산출물 확인', 'client-response-required':'응답 필요' })[label] || label; }
function roomBadge(label, tone){ return '<span class="inline-flex items-center gap-1.5 h-6 px-2 rounded-md border text-[11px] font-semibold whitespace-nowrap '+roomTone(tone)+'"><span class="dot '+roomDot(tone)+'"></span>'+roomEsc(roomLabel(label))+'</span>'; }
function roomMetric(label, value, sub, tone){ return '<article class="bg-white border border-bd-default rounded-xl p-4 shadow-subtle"><div class="text-[11px] text-tx-tertiary font-medium">'+roomEsc(label)+'</div><div class="text-[24px] lg:text-[28px] font-semibold tabular mt-1 '+(tone?roomEsc(tone):'')+'">'+roomEsc(value)+'</div><div class="text-[12px] text-tx-tertiary mt-1">'+roomEsc(sub)+'</div></article>'; }
function getRoomTabFilterValue(label){
  const compact = String(label || '').replace(/\s+/g, '');
  return ({
    '전체':'all', '전체PM':'all', '활성프로젝트':'active', '프로젝트선택':'active', '진행중':'in-progress',
    '승인대기':'approval', '승인':'approval', '컨펌대기':'confirm', '응답필요':'response', '변경요청':'change',
    '완료':'completed', '완료된작업':'completed', '승인완료':'completed', '오래된요청':'old', '이번주':'this-week',
    '반려/보류':'hold', '보류':'hold', 'P1즉시':'p1', '주간리포트':'weekly', '변경영향':'change',
    '산출물':'deliverable', '리스크':'risk', '후속업무':'follow-up', '운영개선':'ops', '자동화후보':'automation',
    '최근응답':'recent', '연결필요':'needs-contact'
  })[compact] || compact.toLowerCase();
}
function roomFilterAttr(tokens){
  const values = Array.from(new Set((tokens || []).filter(Boolean).map(function(v){ return String(v); }))).join(' ');
  return ' data-room-filter-values="'+roomEsc(values || 'all')+'"';
}
function roomFilterTokens(kind, item){
  const tokens = ['all'];
  if (kind === 'project') {
    const code = getProjectPriorityCode(item).toLowerCase();
    const status = String(item?.status || '');
    if (isProjectActive(item)) tokens.push('active');
    if (isProjectInProgress(item)) tokens.push('in-progress');
    if (/승인/.test(status)) tokens.push('approval');
    if (/변경/.test(status)) tokens.push('change');
    if (!isProjectActive(item) || /완료|종료/.test(status)) tokens.push('completed');
    tokens.push(code);
  }
  if (kind === 'action') {
    const label = getActionStatusLabel(item);
    const text = [label, item?.status, item?.kind, item?.title].join(' ');
    if (/승인 대기|client-approval/i.test(text)) tokens.push('approval');
    if (/컨펌 대기|client-confirm-pending/i.test(text)) tokens.push('confirm');
    if (/변경 요청|client-change-request/i.test(text)) tokens.push('change');
    if (/응답 필요|보완 요청|client-response-required/i.test(text)) tokens.push('response');
    if (/([7-9]|\d{2,})일 전/.test(String(item?.relative || ''))) tokens.push('old');
    tokens.push(getActionPriorityCode(item, ORDO_ROOM_DATA.projects || []).toLowerCase());
  }
  if (kind === 'report') {
    const text = [item?.title, item?.type, item?.status, item?.statusLabel].join(' ');
    if (/Week|주간/.test(text)) tokens.push('this-week','weekly');
    if (/승인 대기/.test(text)) tokens.push('approval');
    if (/승인 완료|완료/.test(text)) tokens.push('completed');
    if (/보류|반려/.test(text) || item?.tone === 'warn') tokens.push('hold');
    if (/변경/.test(text)) tokens.push('change');
    if (/산출물/.test(text)) tokens.push('deliverable');
    if (/리스크/.test(text)) tokens.push('risk');
  }
  if (kind === 'pm') {
    if (!/프로젝트 종료/.test(String(item?.status || ''))) tokens.push('active');
    if (/시간|오늘|어제/.test(String(item?.last || ''))) tokens.push('recent');
    if (item?.tone === 'warn' || item?.tone === 'crit' || !/^0건$/.test(String(item?.delayed || ''))) tokens.push('needs-contact');
  }
  if (kind === 'suggestion') {
    const type = String(item?.type || '');
    if (/후속 업무/.test(type)) tokens.push('follow-up');
    if (/운영 개선/.test(type)) tokens.push('ops');
    if (/자동화 후보/.test(type)) tokens.push('automation');
    if (/보류/.test(String(item?.status || '')) || /P4/.test(String(item?.priority || ''))) tokens.push('hold');
  }
  if (kind === 'event') {
    const type = String(item?.type || '');
    if (/승인/.test(type)) tokens.push('approval');
    if (/변경/.test(type)) tokens.push('change');
    if (/산출물/.test(type)) tokens.push('deliverable');
    if (/리스크/.test(type)) tokens.push('risk');
    if (isCompletedActivityEvent(item)) tokens.push('completed');
  }
  return tokens;
}
function roomTabs(labels){ return '<div data-room-tabs class="flex gap-2 overflow-x-auto no-scrollbar pb-1">'+labels.map(function(label, i){ return '<button type="button" data-room-tab data-room-filter="'+roomEsc(getRoomTabFilterValue(label))+'" class="ordo-c-filter-tab whitespace-nowrap h-8 px-3 text-[12px] rounded-full inline-flex items-center justify-center '+(i===0?'active bg-brand-primary text-white font-semibold':'bg-white border border-bd-default text-tx-secondary hover:border-bd-emphasis font-medium')+'">'+roomEsc(label)+'</button>'; }).join('')+'</div>'; }
function roomSwitcher(active){ return '<nav class="flex flex-wrap gap-2" aria-label="페이지 전환">'+ORDO_ROOM_LINKS.map(function(r){ return '<a href="#'+r.id+'" class="h-8 px-3 rounded-full text-[12px] font-semibold inline-flex items-center justify-center '+(r.id===active?'bg-brand-primary text-white':'border border-bd-default hover:bg-bg-secondary text-tx-secondary')+'">'+roomEsc(r.label)+'</a>'; }).join('')+'</nav>'; }
function roomHeader(active, kicker, title, desc, cta){ return '<header class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5"><div class="max-w-[760px]"><p class="text-[11px] font-semibold text-tx-tertiary tracking-wide uppercase">'+roomEsc(kicker)+'</p><h1 class="text-[24px] lg:text-[30px] font-semibold mt-1">'+roomEsc(title)+'</h1><p class="text-[13px] lg:text-[14px] text-tx-secondary mt-2 leading-relaxed">'+roomEsc(desc)+'</p></div>'+(cta?'<a href="'+roomEsc(cta.href)+'" class="h-9 px-3.5 rounded-lg border border-bd-default bg-white hover:bg-bg-secondary inline-flex items-center justify-center gap-1.5 text-[12px] font-semibold shrink-0"><i data-lucide="'+roomEsc(cta.icon)+'" class="w-3.5 h-3.5"></i>'+roomEsc(cta.label)+'</a>':'')+'</header><div class="mb-6">'+roomSwitcher(active)+'</div>'; }
function crossLinks(items){ return '<div class="bg-white border border-bd-default rounded-xl p-4 shadow-subtle"><div class="text-[12px] font-semibold text-tx-primary mb-3">관련 페이지</div><div class="flex flex-wrap gap-2">'+items.map(function(it){ return '<a href="'+roomEsc(it.href)+'" class="h-8 px-3 rounded-lg border border-bd-default hover:bg-bg-secondary text-[12px] font-semibold inline-flex items-center justify-center gap-1.5"><i data-lucide="'+roomEsc(it.icon)+'" class="w-3.5 h-3.5"></i>'+roomEsc(it.label)+'</a>'; }).join('')+'</div></div>'; }
function roomWrap(id, html){ var mount = document.querySelector('[data-room-shell="'+id+'"]'); if (mount) mount.innerHTML = '<div class="max-w-[1200px] mx-auto px-4 lg:px-6 py-6 lg:py-8">'+html+'</div>'; }
function progressBar(n){ return '<div class="progress-track"><div class="progress-fill" style="width:'+Number(n||0)+'%"></div></div>'; }
window.ORDO_ROOM_UI = {
  roomEsc,
  roomTone,
  roomDot,
  roomLabel,
  roomBadge,
  roomMetric,
  getRoomTabFilterValue,
  roomFilterAttr,
  roomFilterTokens,
  roomTabs,
  roomSwitcher,
  roomHeader,
  crossLinks,
  roomWrap,
  progressBar,
};