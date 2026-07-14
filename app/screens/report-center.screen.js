/* ============================================================
   [이 파일은] 리포트 센터 화면 — 관리자가 프로젝트 종합 보고서를 열람하는 곳.
                KPI 요약, 마일스톤 현황, 리스크 목록을 렌더합니다.
   [언제 실행] 라우터가 #admin-reports 해시를 만나면 호출.
   [주요 등장인물]
     - renderReportDashboard : 보고서 KPI + 차트 영역 렌더
   [연결] ← hash-router.js
   [다음 읽을 파일] app/screens/documents.screen.js
   [수정할 때 주의] 시연용 정적 데이터. 서버 연동 없음.
   ============================================================ */
function badge(text, tone){
  const tones = {
    crit: 'bg-st-critbg border-st-critbd text-st-critfg',
    warn: 'bg-st-warnbg border-st-warnbd text-st-warnfg',
    pend: 'bg-st-pendbg border-st-pendbd text-st-pendfg',
    ok:   'bg-st-okbg border-st-okbd text-st-okfg',
    rej:  'bg-st-rejbg border-st-rejbd text-st-rejfg',
  }[tone] || 'bg-bg-tertiary border-bd-default text-tx-secondary';
  return `<span class="inline-flex items-center gap-1 h-6 px-2 rounded-md border ${tones} text-[11px] font-semibold">${text}</span>`;
}

/* ============== 리포트 상세 렌더 ============== */
const detailBody = document.getElementById('detailBody');
const detailPane = document.getElementById('reportDetailPane');
const listPane   = document.getElementById('reportListPane');
const approvalBar = document.getElementById('approvalActionBar');
const reportBar   = document.getElementById('reportActionBar');

function selectReport(id, autoOpenDetail){
  const d = REPORT_DATA[id]; if (!d) return;
  document.querySelectorAll('.report-item').forEach(b => {
    if (b.getAttribute('data-item') === id) b.classList.add('border-brand-primary','bg-bg-secondary');
    else b.classList.remove('border-brand-primary','bg-bg-secondary');
  });
  document.getElementById('detailMobileTitle').textContent = d.title;

  if (d.type === 'approval') renderApproval(d);
  else if (d.type === 'report') renderReport(d);
  else renderInfo(d);

  approvalBar.classList.toggle('hidden', d.type !== 'approval');
  reportBar.classList.toggle('hidden', d.type !== 'report');

  if (autoOpenDetail || !window.matchMedia('(min-width:1024px)').matches) {
    listPane.classList.add('hidden');
    listPane.classList.remove('lg:block');
    detailPane.classList.remove('hidden');
  }
  refreshIcons();
  detailPane.scrollTo?.({top:0, behavior:'instant'});
}

function renderApproval(d){
  const sub = ({document:'문서 승인', change:'범위 변경', schedule:'일정 변경', artifact:'산출물 승인'})[d.subtype] || '승인';
  detailBody.innerHTML = `
    <header class="mb-5">
      <div class="flex flex-wrap items-center gap-2 mb-2">
        ${badge(sub, d.critical ? 'crit' : 'pend')}
        <a href="#project" class="text-[12px] text-tx-secondary hover:text-tx-primary">${d.project}</a>
      </div>
      <h1 class="text-[22px] lg:text-[28px] font-semibold leading-tight">${d.title}</h1>
      <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-[12px] text-tx-secondary">
        <span>제출자 · <span class="text-tx-primary font-medium">${d.submitter}</span></span>
        <span>제출일 · ${d.submittedAt}</span>
        <span class="${d.critical ? 'text-st-critfg font-semibold' : ''}">검토 기한 · ${d.deadline}</span>
      </div>
    </header>
    <section class="bg-white border border-bd-default rounded-xl p-5 shadow-subtle mb-5">
      <div class="flex items-center justify-between mb-2">
        <div class="text-[12px] font-semibold text-tx-secondary">승인 대상 요약</div>
        <a href="#project" class="text-[12px] text-tx-secondary hover:text-tx-primary">이전 버전 (${d.prevVersion})</a>
      </div>
      <div class="text-[14px] text-tx-primary leading-relaxed">${d.changeSummary}</div>
    </section>
    <section class="bg-white border border-bd-default rounded-xl p-5 shadow-subtle mb-5">
      <h3 class="text-[15px] font-semibold mb-3">영향 분석</h3>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div class="p-3 rounded-lg border border-bd-default">
          <div class="text-[11px] text-tx-secondary">일정 영향</div>
          <div class="text-[18px] font-semibold tabular mt-0.5">${d.impact.schedule}</div>
        </div>
        <div class="p-3 rounded-lg border border-bd-default">
          <div class="text-[11px] text-tx-secondary">비용 영향</div>
          <div class="text-[18px] font-semibold tabular mt-0.5">${d.impact.cost}</div>
        </div>
        <div class="p-3 rounded-lg border border-bd-default">
          <div class="text-[11px] text-tx-secondary">품질 영향</div>
          <div class="mt-1">${badge(d.impact.quality, d.impact.quality==='상향'?'ok':(d.impact.quality==='하향'?'crit':'rej'))}</div>
        </div>
        <div class="p-3 rounded-lg border border-bd-default col-span-2 lg:col-span-1">
          <div class="text-[11px] text-tx-secondary">의존성</div>
          <div class="text-[12px] text-tx-primary mt-1 leading-snug">${d.impact.deps.map(x=>`· ${x}`).join('<br>')}</div>
        </div>
      </div>
      <div class="mt-4 pt-4 border-t border-bd-default">
        <div class="text-[12px] font-semibold text-tx-secondary mb-1">변경 이유</div>
        <p class="text-[14px] text-tx-primary leading-relaxed">${d.reason}</p>
      </div>
    </section>
    <section class="bg-white border border-bd-default rounded-xl shadow-subtle mb-5 overflow-hidden">
      <div class="flex items-center justify-between px-5 py-3 border-b border-bd-default">
        <div class="text-[13px] font-semibold">문서 프리뷰</div>
        <label class="inline-flex items-center gap-2 text-[12px] text-tx-secondary cursor-pointer">
          <input id="diffToggle" type="checkbox" class="w-4 h-4 accent-brand-primary">이전 버전과 비교
        </label>
      </div>
      <div id="previewView" class="p-5">
        <div class="preview-ph rounded-lg h-72 lg:h-96 border border-bd-default flex items-center justify-center text-[12px] text-tx-tertiary">
          <div class="text-center">
            <i data-lucide="file-text" class="w-6 h-6 mx-auto mb-2"></i>
            ${d.prevVersion} → ${d.title} (프리뷰)
          </div>
        </div>
      </div>
      <div id="diffView" class="p-5 hidden">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-3 text-[12px] leading-relaxed">
          <div>
            <div class="text-[11px] text-tx-tertiary mb-1">이전 (${d.prevVersion})</div>
            <div class="rounded-lg border border-bd-default overflow-hidden">
              <div class="px-3 py-2 diff-del">· 결제 게이트웨이: 단일 벤더(A)</div>
              <div class="px-3 py-2">· 이중 실패 시 수동 전환</div>
            </div>
          </div>
          <div>
            <div class="text-[11px] text-tx-tertiary mb-1">현재</div>
            <div class="rounded-lg border border-bd-default overflow-hidden">
              <div class="px-3 py-2 diff-add">· 결제 게이트웨이: A(주) / B(백업) / C(백업)</div>
              <div class="px-3 py-2">· 이중 실패 시 수동 전환</div>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section class="bg-white border border-bd-default rounded-xl shadow-subtle mb-5">
      <div class="px-5 py-3 border-b border-bd-default text-[13px] font-semibold">관련 문서</div>
      <ul class="divide-y divide-bd-default">
        ${d.linked.map(x => `
          <li class="flex items-center gap-3 px-5 py-3">
            <i data-lucide="file-text" class="w-4 h-4 text-tx-secondary"></i>
            <div class="flex-1 min-w-0">
              <div class="text-[13px] font-medium truncate">${x.name}</div>
              <div class="text-[11px] text-tx-tertiary">${x.meta}</div>
            </div>
            <a href="#project" aria-label="문서로 이동"><i data-lucide="external-link" class="w-4 h-4 text-tx-tertiary"></i></a>
          </li>`).join('')}
      </ul>
    </section>
    <section>
      <h3 class="text-[15px] font-semibold mb-3">승인 히스토리</h3>
      <div class="bg-white border border-bd-default rounded-xl shadow-subtle divide-y divide-bd-default">
        ${d.history.map(h => `
          <div class="p-4 flex items-start gap-3">
            <div class="w-7 h-7 rounded-full ${h.result==='승인'?'bg-st-okbg border-st-okbd':'bg-st-critbg border-st-critbd'} border flex items-center justify-center shrink-0">
              <i data-lucide="${h.result==='승인'?'check':'x'}" class="w-3.5 h-3.5 ${h.result==='승인'?'text-st-okfg':'text-st-critfg'}"></i>
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-[11px] text-tx-tertiary">${h.date} · ${h.who}</div>
              <div class="text-[13px] font-medium">${h.target} — ${h.result}</div>
              ${h.comment ? `<div class="text-[12px] text-tx-secondary mt-0.5">"${h.comment}"</div>` : ''}
            </div>
          </div>`).join('')}
      </div>
    </section>
  `;
  const tog = document.getElementById('diffToggle');
  tog?.addEventListener('change', () => {
    document.getElementById('previewView').classList.toggle('hidden', tog.checked);
    document.getElementById('diffView').classList.toggle('hidden', !tog.checked);
  });
}

function renderReport(d){
  detailBody.innerHTML = `
    <header class="mb-5">
      <div class="flex flex-wrap items-center gap-2 mb-2">
        ${badge('주간 리포트','pend')}
        <a href="#project" class="text-[12px] text-tx-secondary hover:text-tx-primary">${d.project}</a>
      </div>
      <h1 class="text-[22px] lg:text-[28px] font-semibold leading-tight">${d.title}</h1>
      <div class="text-[12px] text-tx-secondary mt-2">Week ${d.weekNo} · ${d.submitter} · ${d.submittedAt}</div>
    </header>
    <section class="bg-white border border-bd-default rounded-xl p-5 shadow-subtle mb-4">
      <h3 class="text-[14px] font-semibold mb-3">1. 이번 주 목표</h3>
      <ul class="space-y-2">
        ${d.goals.map(g => `
          <li class="flex items-start gap-2 text-[14px] ${g.done?'text-tx-primary':'text-tx-secondary'}">
            <i data-lucide="${g.done?'check-circle-2':'circle'}" class="w-4 h-4 ${g.done?'text-st-okfg':'text-tx-tertiary'} mt-0.5 shrink-0"></i>
            ${g.text}
          </li>`).join('')}
      </ul>
    </section>
    <section class="bg-white border border-bd-default rounded-xl p-5 shadow-subtle mb-4">
      <h3 class="text-[14px] font-semibold mb-3">2. 완료된 작업</h3>
      <ul class="space-y-1.5 text-[14px]">
        ${d.completed.map(x => `<li class="flex gap-2"><i data-lucide="check" class="w-4 h-4 text-st-okfg shrink-0 mt-0.5"></i>${x}</li>`).join('')}
      </ul>
    </section>
    <section class="bg-white border border-bd-default rounded-xl p-5 shadow-subtle mb-4">
      <h3 class="text-[14px] font-semibold mb-3">3. 진행 중 작업</h3>
      <div class="space-y-3">
        ${d.progressing.map(p => `
          <div>
            <div class="flex items-center justify-between text-[13px] mb-1">
              <span>${p.name}</span><span class="tabular text-tx-secondary">${p.pct}%</span>
            </div>
            <div class="progress-track"><div class="progress-fill" style="width:${p.pct}%"></div></div>
          </div>`).join('')}
      </div>
    </section>
    <section class="bg-white border border-bd-default rounded-xl p-5 shadow-subtle mb-4">
      <h3 class="text-[14px] font-semibold mb-3">4. 이슈 및 리스크</h3>
      ${d.risks.length ? d.risks.map(r => `
        <div class="p-3 rounded-lg border border-bd-default mb-2 last:mb-0">
          <div class="flex items-start justify-between gap-2">
            <div class="text-[13px] font-medium">${r.name}</div>
            ${badge(r.level, r.level==='High'?'crit':(r.level==='Medium'?'warn':'pend'))}
          </div>
          <div class="text-[12px] text-tx-secondary mt-1">대응: ${r.plan}</div>
        </div>`).join('') : `<div class="text-[13px] text-tx-tertiary">이번 주 신규 리스크 없음</div>`}
    </section>
    <section class="bg-white border border-bd-default rounded-xl p-5 shadow-subtle mb-4">
      <h3 class="text-[14px] font-semibold mb-3">5. 다음 주 계획</h3>
      <ul class="space-y-1.5 text-[14px] text-tx-primary">
        ${d.nextWeek.map(x => `<li class="flex gap-2"><i data-lucide="arrow-right" class="w-4 h-4 text-tx-tertiary mt-0.5"></i>${x}</li>`).join('')}
      </ul>
    </section>
    <section class="rounded-xl p-5 mb-4 bg-st-pendbg border border-st-pendbd">
      <div class="flex items-center gap-2 mb-2">
        <i data-lucide="user-check" class="w-4 h-4 text-st-pendfg"></i>
        <h3 class="text-[14px] font-semibold">6. 고객 확인 필요 항목</h3>
      </div>
      <ul class="space-y-1.5 text-[14px] text-tx-primary">
        ${d.clientTodo.map(x => `<li class="flex gap-2"><span class="dot bg-st-pendfg mt-2 shrink-0"></span>${x}</li>`).join('')}
      </ul>
    </section>
  `;
}

function renderInfo(d){
  detailBody.innerHTML = `
    <header class="mb-5">
      <div class="text-[12px] text-tx-secondary mb-1">${d.project}</div>
      <h1 class="text-[22px] lg:text-[28px] font-semibold leading-tight">${d.title}</h1>
    </header>
    <div class="bg-white border border-bd-default rounded-xl p-6 shadow-subtle text-[14px] text-tx-primary leading-relaxed">
      ${d.body || '추가 정보가 없습니다.'}
    </div>
  `;
}

document.querySelectorAll('.report-item').forEach(b => {
  b.addEventListener('click', () => selectReport(b.getAttribute('data-item'), true));
});
document.getElementById('detailBack')?.addEventListener('click', () => {
  detailPane.classList.add('hidden');
  listPane.classList.remove('hidden');
  listPane.classList.add('lg:block');
});

/* ============== Bottom Sheet (반려/보류) ============== */
const sheet = document.getElementById('sheetRoot');
const sheetPanel = document.getElementById('sheetPanel');
const sheetTitle = document.getElementById('sheetTitle');
function openReportDecisionSheet(kind){
  sheetTitle.textContent = kind === 'reject' ? '반려 사유' : '보류 사유';
  sheet.classList.remove('hidden');
  sheet.setAttribute('aria-hidden','false');
  requestAnimationFrame(() => sheetPanel.classList.add('open'));
}
function closeReportDecisionSheet(){
  sheetPanel.classList.remove('open');
  setTimeout(() => { sheet.classList.add('hidden'); sheet.setAttribute('aria-hidden','true'); }, 220);
}
let decisionConfirmLastFocus = null;
function ensureDecisionConfirm(){
  let modal = document.getElementById('decisionConfirmModal');
  if (modal) return modal;
  modal = document.createElement('div');
  modal.id = 'decisionConfirmModal';
  modal.className = 'fixed inset-0 z-[80] hidden items-center justify-center bg-black/50 px-4';
  modal.setAttribute('role','dialog');
  modal.setAttribute('aria-modal','true');
  modal.setAttribute('aria-labelledby','decisionConfirmTitle');
  modal.setAttribute('aria-describedby','decisionConfirmMessage');
  modal.setAttribute('data-confirm-backdrop','');
  modal.innerHTML = `
    <div class="w-full max-w-sm rounded-2xl border border-bd-default bg-white p-5 shadow-elevated">
      <div class="flex items-start gap-3">
        <div id="decisionConfirmIcon" class="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-st-warnbg text-st-warnfg">
          <i data-lucide="circle-alert" class="w-5 h-5"></i>
        </div>
        <div class="min-w-0">
          <h2 id="decisionConfirmTitle" class="text-[17px] font-semibold text-tx-primary"></h2>
          <p id="decisionConfirmMessage" class="mt-1 text-[13px] leading-relaxed text-tx-secondary"></p>
        </div>
      </div>
      <div class="mt-5 grid grid-cols-2 gap-2">
        <button type="button" data-confirm-cancel class="h-10 rounded-lg border border-bd-default bg-white text-[13px] font-semibold text-tx-primary hover:bg-bg-secondary">취소</button>
        <button type="button" data-confirm-ok class="h-10 rounded-lg text-[13px] font-semibold text-white">확인</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener('click', (e) => {
    if (e.target.matches('[data-confirm-backdrop], [data-confirm-cancel]')) closeDecisionConfirm();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeDecisionConfirm();
  });
  if (window.refreshIcons) window.refreshIcons(); else if (window.lucide) window.lucide.createIcons();
  return modal;
}
function closeDecisionConfirm(){
  const modal = document.getElementById('decisionConfirmModal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  document.body.style.overflow = '';
  if (decisionConfirmLastFocus) {
    decisionConfirmLastFocus.focus?.();
    decisionConfirmLastFocus = null;
  }
}
function openDecisionConfirm({ title, message, tone = 'crit', onConfirm }){
  const modal = ensureDecisionConfirm();
  decisionConfirmLastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  modal.querySelector('#decisionConfirmTitle').textContent = title;
  modal.querySelector('#decisionConfirmMessage').textContent = message;
  const icon = modal.querySelector('#decisionConfirmIcon');
  const confirmBtn = modal.querySelector('[data-confirm-ok]');
  const toneClass = tone === 'ok'
    ? 'bg-st-okfg hover:brightness-95'
    : 'bg-st-critfg hover:brightness-95';
  const iconClass = tone === 'ok'
    ? 'mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-st-okbg text-st-okfg'
    : 'mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-st-critbg text-st-critfg';
  icon.className = iconClass;
  confirmBtn.className = `h-10 rounded-lg text-[13px] font-semibold text-white ${toneClass}`;
  confirmBtn.onclick = () => {
    closeDecisionConfirm();
    onConfirm?.();
  };
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => confirmBtn.focus());
  if (window.refreshIcons) window.refreshIcons(); else if (window.lucide) window.lucide.createIcons();
}
function completeReportApprove(){
  const btn = document.getElementById('btnApprove');
  if (!btn) return;
  const orig = btn.innerHTML;
  btn.innerHTML = '<i data-lucide="check-circle-2" class="w-4 h-4"></i>승인 완료';
  refreshIcons();
  setTimeout(()=> { btn.innerHTML = orig; refreshIcons(); }, 1400);
}
document.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', () => openReportDecisionSheet(b.dataset.act)));
document.getElementById('btnApprove')?.addEventListener('click', () => {
  openDecisionConfirm({
    title: '승인하시겠습니까?',
    message: '확인하면 이 리포트가 승인 처리되고 승인 기록에 남습니다.',
    tone: 'ok',
    onConfirm: completeReportApprove
  });
});
document.getElementById('btnReject')?.addEventListener('click', () => {
  openDecisionConfirm({
    title: '반려하시겠습니까?',
    message: '확인하면 반려 사유 입력 단계로 이동합니다.',
    tone: 'crit',
    onConfirm: () => openReportDecisionSheet('reject')
  });
});
sheet?.addEventListener('click', (e) => { if (e.target.matches('[data-close-sheet]')) closeReportDecisionSheet(); });
document.getElementById('sheetSubmit')?.addEventListener('click', closeReportDecisionSheet);

/* ============================================================
   [R3] 이슈 · 변경 센터
   ============================================================ */
