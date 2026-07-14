/* ============================================================
   [이 파일은] 관리자(admin) 화면 전체를 담당하는 "무대 감독".
                의뢰 접수(intake), 프로젝트 보드, 파트너 관리, 인력 히트맵,
                감사 로그, 그리고 ModuleCard 목록/상세 — 6개 화면을 이 한 파일이 그립니다.
   [언제 실행] 라우터가 #admin-* 해시를 만나면 해당 render 함수를 호출.
   [주요 등장인물]
     - renderIntakeList / selectIntake  : 의뢰 접수 목록 + 상세
     - renderProjectBoard / renderProjectTable : 프로젝트 칸반 + 테이블
     - renderPartnerTable  : 파트너(작업자) 명단
     - renderHeatmap       : 인력 배정 히트맵 (8명×5일)
     - renderAdminAuditTimeline : 감사 로그 타임라인
     - renderAdminCards / renderAdminCardDetail : ModuleCard 목록/상세
   [연결] ← hash-router.js 의 renderModuleRouteScreens
          → lifecycle 서비스(상태 변경), ui/components(팩토리), workspace.data.js(데이터)
   [다음 읽을 파일] app/screens/worker-workspace.screen.js
   [수정할 때 주의] renderAdminCards/renderAdminCardDetail 은 lifecycle 서비스만으로
                    상태를 바꿉니다. card.status를 직접 대입하면 저장·기록이 누락됩니다.
   ============================================================ */

/* ── 【섹션 1】 의뢰 접수(Intake) — 클라이언트 의뢰를 관리자가 검토하는 화면 ── */
function renderIntakeList(){
  const wrap = document.getElementById('intakeList');
  if (!wrap) return;
  wrap.innerHTML = INTAKE_DATA.map(it => {
    const toneBar = {crit:'bg-st-critfg', warn:'bg-st-warnfg', ok:'bg-st-okfg'}[it.urgency];
    const statusBadge = it.status === '신규'
      ? `<span class="inline-flex items-center gap-1 h-5 px-1.5 rounded bg-st-critbg border border-st-critbd text-st-critfg text-[10px] font-semibold ordo-c-status-badge">신규</span>`
      : `<span class="inline-flex items-center gap-1 h-5 px-1.5 rounded bg-st-pendbg border border-st-pendbd text-st-pendfg text-[10px] font-semibold ordo-c-status-badge">${it.status}</span>`;
    const elapsedCls = it.elapsed.includes('SLA 위반') ? 'text-st-critfg font-semibold' : 'text-tx-secondary';
    return `<button data-intake="${it.id}" class="intake-item w-full text-left relative bg-white border border-bd-default rounded-xl pl-5 pr-4 py-4 hover:border-bd-emphasis transition block">
      <span class="bar-l ${toneBar}"></span>
      <div class="flex items-center gap-2 mb-1.5 flex-wrap">
        ${statusBadge}
        <span class="text-[11px] text-tx-tertiary truncate">${it.company}</span>
      </div>
      <div class="text-[14px] font-semibold leading-snug">${it.title}</div>
      <div class="text-[11px] text-tx-secondary mt-1.5">예상 규모: ${it.period} · ${it.budget}</div>
      <div class="flex items-center justify-between mt-2">
        <span class="text-[11px] ${elapsedCls}">${it.elapsed}</span>
        <i data-lucide="chevron-right" class="w-4 h-4 text-tx-tertiary"></i>
      </div>
    </button>`;
  }).join('');
  refreshIcons();
  wrap.querySelectorAll('.intake-item').forEach(b => {
    b.addEventListener('click', () => selectIntake(b.getAttribute('data-intake'), window.matchMedia('(min-width:1024px)').matches));
  });
}

function selectIntake(id, autoOpenDetail){
  const d = INTAKE_DATA.find(x => x.id === id); if (!d) return;
  document.querySelectorAll('.intake-item').forEach(b => {
    b.classList.toggle('border-brand-primary', b.getAttribute('data-intake') === id);
    b.classList.toggle('bg-bg-secondary', b.getAttribute('data-intake') === id);
  });
  const mt = document.getElementById('intakeDetailMobileTitle'); if (mt) mt.textContent = d.title;

  const body = document.getElementById('intakeDetailBody');
  body.innerHTML = `
    <div class="max-w-3xl mx-auto">
      <div class="flex items-center gap-2 flex-wrap mb-3">
        <span class="inline-flex items-center gap-1 h-6 px-2 rounded bg-bg-tertiary border border-bd-default text-[11px] font-mono text-tx-secondary">${d.id}</span>
        <span class="inline-flex items-center gap-1.5 h-6 px-2 rounded-md bg-st-critbg border border-st-critbd text-st-critfg text-[11px] font-semibold ordo-c-status-badge"><span class="dot bg-st-critfg"></span>${d.status}</span>
        <span class="text-[12px] text-tx-tertiary">· ${d.elapsed}</span>
      </div>
      <h1 class="text-[22px] lg:text-[26px] font-semibold leading-tight">${d.title}</h1>
      <div class="text-[13px] text-tx-secondary mt-1">${d.company} · ${d.contact}</div>

      <!-- 의뢰서 요약 -->
      <section class="mt-6 bg-white border border-bd-default rounded-xl p-5 shadow-subtle">
        <h2 class="text-[14px] font-semibold mb-3">의뢰서 요약</h2>
        <dl class="grid grid-cols-2 lg:grid-cols-4 gap-3 text-[13px]">
          <div><dt class="text-[11px] text-tx-tertiary">예상 기간</dt><dd class="font-semibold mt-0.5">${d.period}</dd></div>
          <div><dt class="text-[11px] text-tx-tertiary">예상 예산</dt><dd class="font-semibold mt-0.5 tabular">${d.budget}</dd></div>
          <div><dt class="text-[11px] text-tx-tertiary">회사</dt><dd class="font-semibold mt-0.5 truncate">${d.company}</dd></div>
          <div><dt class="text-[11px] text-tx-tertiary">담당자</dt><dd class="font-semibold mt-0.5 truncate">${d.contact.split(' · ')[0]}</dd></div>
        </dl>
        <div class="mt-4 pt-4 border-t border-bd-default">
          <div class="text-[11px] text-tx-tertiary mb-1">범위·목적</div>
          <p class="text-[13px] leading-relaxed">${d.summary}</p>
        </div>
      </section>

      <!-- 첨부 문서 -->
      <section class="mt-4 bg-white border border-bd-default rounded-xl p-5 shadow-subtle">
        <h2 class="text-[14px] font-semibold mb-3">첨부 문서</h2>
        <ul class="space-y-2">
          ${d.attachments.map(a => `<li class="flex items-center gap-2 p-2 rounded-lg border border-bd-default hover:bg-bg-secondary">
            <i data-lucide="file-text" class="w-4 h-4 text-tx-secondary"></i>
            <span class="text-[13px] truncate flex-1">${a}</span>
            <button class="text-[11px] text-tx-secondary hover:text-tx-primary">다운로드</button>
          </li>`).join('')}
        </ul>
      </section>

      <!-- 초기 요구사항 -->
      <section class="mt-4 bg-white border border-bd-default rounded-xl p-5 shadow-subtle">
        <h2 class="text-[14px] font-semibold mb-3">클라이언트 초기 요구사항</h2>
        <ul class="space-y-2 text-[13px]">
          ${d.requirements.map(r => `<li class="flex items-start gap-2"><i data-lucide="check" class="w-4 h-4 text-st-okfg mt-0.5 shrink-0"></i><span>${r}</span></li>`).join('')}
        </ul>
      </section>

      <!-- 의뢰 히스토리 (감사 Timeline) -->
      <section class="mt-4 bg-white border border-bd-default rounded-xl p-5 shadow-subtle">
        <h2 class="text-[14px] font-semibold mb-3">접수 경과</h2>
        <ol class="ordo-c-timeline space-y-3 border-l-2 border-bd-default pl-5 ml-1">
          <li class="relative">
            <span class="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-st-okfg"></span>
            <div class="text-[13px] font-semibold">의뢰 접수</div>
            <div class="text-[11px] text-tx-tertiary">${d.elapsed} · 자동 알림 발송됨</div>
          </li>
          <li class="relative">
            <span class="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-brand-primary ring-4 ring-brand-primary/15"></span>
            <div class="text-[13px] font-semibold">PM 검토 중</div>
            <div class="text-[11px] text-tx-tertiary">지금 · 본인 열람 중</div>
          </li>
          <li class="relative">
            <span class="absolute -left-[27px] top-1.5 w-3 h-3 rounded-full border-2 border-bd-emphasis bg-white"></span>
            <div class="text-[13px] text-tx-secondary">PM 지정 → 견적 / 거절</div>
            <div class="text-[11px] text-tx-tertiary">예정 · SLA 24h 이내</div>
          </li>
        </ol>
      </section>
    </div>
  `;
  refreshIcons();
  window._currentIntakeId = id;

  const listPane = document.getElementById('intakeListPane');
  const detailPane = document.getElementById('intakeDetailPane');
  if (autoOpenDetail || !window.matchMedia('(min-width:1024px)').matches) {
    listPane?.classList.add('hidden');
    detailPane?.classList.remove('hidden');
  }
  detailPane?.scrollTo?.({top:0, behavior:'instant'});
}

// intake 바인딩
document.getElementById('intakeDetailBack')?.addEventListener('click', () => {
  document.getElementById('intakeListPane')?.classList.remove('hidden');
  document.getElementById('intakeDetailPane')?.classList.add('hidden');
});
document.getElementById('btnIntakeAssignPM')?.addEventListener('click', () => {
  document.getElementById('pmAssignModal')?.classList.remove('hidden');
  refreshIcons();
});
document.getElementById('pmAssignModal')?.addEventListener('click', (e) => {
  if (e.target.matches('[data-close-pm-modal]')) {
    document.getElementById('pmAssignModal')?.classList.add('hidden');
  }
});
document.querySelectorAll('.pm-pick').forEach(b => {
  b.addEventListener('click', () => {
    const pm = b.getAttribute('data-pm');
    document.getElementById('pmAssignModal')?.classList.add('hidden');
    alert(`${pm} PM을 배정했습니다. 검토 착수 알림을 클라이언트에 발송합니다.`);
  });
});
document.getElementById('btnIntakeQuote')?.addEventListener('click', () => {
  alert('견적 제출 단계로 전환했습니다. 클라이언트 대시보드에 견적 카드가 노출됩니다.');
});
document.getElementById('btnIntakeReject')?.addEventListener('click', () => {
  document.getElementById('intakeRejectSheet')?.classList.remove('hidden');
  setTimeout(() => document.querySelector('#intakeRejectSheet .sheet')?.classList.add('open'), 10);
});
document.getElementById('intakeRejectSheet')?.addEventListener('click', (e) => {
  if (e.target.matches('[data-close-reject-sheet]')) {
    document.querySelector('#intakeRejectSheet .sheet')?.classList.remove('open');
    setTimeout(() => document.getElementById('intakeRejectSheet')?.classList.add('hidden'), 200);
  }
});
document.getElementById('intakeRejectSubmit')?.addEventListener('click', () => {
  document.querySelector('#intakeRejectSheet .sheet')?.classList.remove('open');
  setTimeout(() => document.getElementById('intakeRejectSheet')?.classList.add('hidden'), 200);
  alert('의뢰 거절 메시지를 클라이언트에 발송했습니다.');
});

// Intake filter chip activation.
document.querySelectorAll('.intake-filter').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const siblings = btn.parentElement.querySelectorAll('.intake-filter');
    siblings.forEach(b => {
      b.classList.remove('bg-brand-primary','text-white','active');
      b.classList.add('bg-white','border','border-bd-default','text-tx-secondary');
    });
    btn.classList.add('bg-brand-primary','text-white','active');
    btn.classList.remove('bg-white','border','border-bd-default','text-tx-secondary');
  });
});

/* ── 【섹션 2】 프로젝트 감독 — 칸반 보드와 테이블 뷰로 전체 프로젝트 현황 파악 ── */


function healthVisual(h){
  return ({
    ok:   { bar:'bg-st-okfg',   badge:'bg-st-okbg border-st-okbd text-st-okfg',     dot:'bg-st-okfg',   label:'정상', fill:'#10B981' },
    warn: { bar:'bg-st-warnfg', badge:'bg-st-warnbg border-st-warnbd text-st-warnfg', dot:'bg-st-warnfg', label:'주의', fill:'#F59E0B' },
    crit: { bar:'bg-st-critfg', badge:'bg-st-critbg border-st-critbd text-st-critfg', dot:'bg-st-critfg', label:'위험', fill:'#EF4444' },
  })[h] || { bar:'bg-bd-default', badge:'bg-bg-tertiary border-bd-default text-tx-secondary', dot:'bg-bd-emphasis', label:'-', fill:'#1F2937' };
}

function renderProjectBoard(){
  const cols = { proposal:'col-proposal', contract:'col-contract', execution:'col-execution', qa:'col-qa', closed:'col-closed' };
  Object.keys(cols).forEach(k => {
    const el = document.getElementById(cols[k]);
    if (!el) return;
    const items = PROJECT_DATA.filter(p => p.stage === k);
    el.innerHTML = items.map(p => {
      const hv = healthVisual(p.health);
      return `<a href="#admin-projects" class="prj-card relative block bg-white border border-bd-default rounded-lg pl-4 pr-3 py-3 hover:border-bd-emphasis shadow-subtle">
        <span class="bar-l ${hv.bar}"></span>
        <div class="flex items-center gap-1.5 mb-1.5">
          <span class="inline-flex items-center gap-1 h-5 px-1.5 rounded border ${hv.badge} text-[10px] font-semibold ordo-c-status-badge">
            <span class="dot ${hv.dot}"></span>${hv.label}
          </span>
          <span class="text-[10px] font-mono text-tx-tertiary ml-auto">${p.id}</span>
        </div>
        <div class="text-[13px] font-semibold leading-snug truncate">${p.title}</div>
        <div class="text-[11px] text-tx-tertiary mt-0.5 truncate">${p.client}</div>
        <div class="mt-2.5">
          <div class="flex items-center justify-between text-[10px] text-tx-secondary mb-1">
            <span class="truncate">${p.pm} PM</span>
            <span class="tabular font-semibold text-tx-primary shrink-0 ml-2">${p.progress}%</span>
          </div>
          <div class="progress-track ordo-c-progress-track" style="height:4px;"><div class="progress-fill" style="width:${p.progress}%; background:${hv.fill};"></div></div>
        </div>
        <div class="flex items-center justify-between mt-2.5 pt-2 border-t border-bd-default text-[10px]">
          <span class="text-tx-tertiary truncate">${p.next}</span>
          <span class="tabular font-semibold shrink-0 ml-2">${p.amount}</span>
        </div>
      </a>`;
    }).join('') || `<div class="text-[11px] text-tx-tertiary text-center py-6">항목 없음</div>`;
  });
  refreshIcons();
}

function renderProjectTable(){
  const tbody = document.getElementById('prjTableBody');
  if (!tbody) return;
  const stageLabel = { proposal:'제안', contract:'계약', execution:'실행', qa:'검수', closed:'종료' };
  tbody.innerHTML = PROJECT_DATA.map(p => {
    const hv = healthVisual(p.health);
    return `<tr class="hover:bg-bg-secondary cursor-pointer" onclick="location.hash='admin-projects'">
      <td class="px-4 py-3 font-semibold whitespace-nowrap">
        <span class="inline-block w-1 h-4 align-middle mr-2 rounded ${hv.bar}"></span>
        <span class="align-middle">${p.title}</span>
      </td>
      <td class="px-4 py-3 text-tx-secondary whitespace-nowrap">${p.client}</td>
      <td class="px-4 py-3 text-tx-secondary whitespace-nowrap">${p.pm}</td>
      <td class="px-4 py-3 text-tx-secondary whitespace-nowrap">${stageLabel[p.stage]}</td>
      <td class="px-4 py-3 whitespace-nowrap">
        <span class="inline-flex items-center gap-1 h-5 px-1.5 rounded border ${hv.badge} text-[10px] font-semibold ordo-c-status-badge">
          <span class="dot ${hv.dot}"></span>${hv.label}
        </span>
      </td>
      <td class="px-4 py-3 whitespace-nowrap">
        <div class="flex items-center gap-2 min-w-[120px]">
          <div class="progress-track ordo-c-progress-track flex-1" style="height:5px;"><div class="progress-fill" style="width:${p.progress}%; background:${hv.fill};"></div></div>
          <span class="tabular text-[12px] font-semibold">${p.progress}%</span>
        </div>
      </td>
      <td class="px-4 py-3 text-tx-secondary whitespace-nowrap text-[12px]">${p.next}</td>
      <td class="px-4 py-3 text-right font-semibold tabular whitespace-nowrap">${p.amount}</td>
      <td class="px-4 py-3 text-tx-tertiary whitespace-nowrap text-[12px]">${p.updated}</td>
    </tr>`;
  }).join('');
}

document.addEventListener('click', (e) => {
  if (e.target.closest('#prjViewBoard')) {
    document.getElementById('prjBoardView')?.classList.remove('hidden');
    document.getElementById('prjTableView')?.classList.add('hidden');
    document.getElementById('prjViewBoard')?.classList.add('bg-white','shadow-subtle');
    document.getElementById('prjViewBoard')?.classList.remove('text-tx-secondary');
    document.getElementById('prjViewTable')?.classList.remove('bg-white','shadow-subtle');
    document.getElementById('prjViewTable')?.classList.add('text-tx-secondary');
  }
  if (e.target.closest('#prjViewTable')) {
    document.getElementById('prjBoardView')?.classList.add('hidden');
    document.getElementById('prjTableView')?.classList.remove('hidden');
    document.getElementById('prjViewTable')?.classList.add('bg-white','shadow-subtle');
    document.getElementById('prjViewTable')?.classList.remove('text-tx-secondary');
    document.getElementById('prjViewBoard')?.classList.remove('bg-white','shadow-subtle');
    document.getElementById('prjViewBoard')?.classList.add('text-tx-secondary');
  }
});

/* ── 【섹션 3】 파트너 관리 — 작업자 명단·초대·상태 변경 ── */


function statusVisual(s){
  return ({
    active:    { label:'활성',     cls:'bg-st-okbg text-st-okfg border-st-okbd',     dot:'bg-st-okfg' },
    pending:   { label:'대기',     cls:'bg-st-pendbg text-st-pendfg border-st-pendbd', dot:'bg-st-pendfg' },
    leave:     { label:'휴직',     cls:'bg-st-rejbg text-st-rejfg border-st-rejbd',   dot:'bg-st-rejfg' },
    blacklist: { label:'블랙리스트', cls:'bg-st-critbg text-st-critfg border-st-critbd', dot:'bg-st-critfg' }
  })[s] || { label:'-', cls:'bg-bg-tertiary', dot:'bg-bd-emphasis' };
}

function renderPartnerTable(){
  const tbody = document.getElementById('partnerTableBody');
  if (!tbody) return;
  tbody.innerHTML = PARTNER_DATA.map(p => {
    const sv = statusVisual(p.status);
    const utilColor = p.util >= 95 ? '#EF4444' : (p.util >= 80 ? '#F59E0B' : '#10B981');
    const rating = p.rating ? `<span class="tabular">${p.rating.toFixed(1)}</span><span class="text-tx-tertiary text-[11px]">/5.0</span>` : '<span class="text-tx-tertiary">–</span>';
    const actionMain = p.status === 'pending'
      ? `<button onclick="alert('${p.name}에게 초대 메일을 재발송했습니다.')" class="h-7 px-2.5 text-[11px] font-semibold rounded-md border border-bd-default hover:bg-bg-secondary">초대 재발송</button>`
      : (p.status === 'active'
        ? `<button onclick="if(confirm('${p.name} 작업자를 휴직 처리할까요?')) alert('${p.name}의 상태가 휴직으로 전환되었습니다.')" class="h-7 px-2.5 text-[11px] font-semibold rounded-md border border-bd-default hover:bg-bg-secondary">휴직 전환</button>`
        : `<button onclick="alert('${p.name} 상세 화면으로 이동')" class="h-7 px-2.5 text-[11px] font-semibold rounded-md border border-bd-default hover:bg-bg-secondary">복귀 요청</button>`);
    return `<tr class="hover:bg-bg-secondary">
      <td class="px-4 py-3 whitespace-nowrap">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-full bg-bg-tertiary border border-bd-default flex items-center justify-center text-[12px] font-semibold shrink-0">${p.initial}</div>
          <div>
            <div class="text-[13px] font-semibold">${p.name}</div>
            <div class="text-[11px] text-tx-tertiary font-mono">${p.id}</div>
          </div>
        </div>
      </td>
      <td class="px-4 py-3 text-tx-secondary whitespace-nowrap">${p.role}</td>
      <td class="px-4 py-3">
        <div class="flex flex-wrap gap-1 max-w-[260px]">
          ${p.skills.map(s => `<span class="inline-flex items-center h-5 px-1.5 rounded bg-bg-tertiary border border-bd-default text-[10px] font-medium text-tx-secondary">${s}</span>`).join('')}
        </div>
      </td>
      <td class="px-4 py-3 whitespace-nowrap">
        ${p.util > 0 ? `<div class="flex items-center gap-2 w-32">
          <div class="progress-track ordo-c-progress-track flex-1" style="height:5px;"><div class="progress-fill" style="width:${p.util}%; background:${utilColor};"></div></div>
          <span class="tabular text-[11px] font-semibold w-8 text-right">${p.util}%</span>
        </div>` : '<span class="text-[11px] text-tx-tertiary">–</span>'}
      </td>
      <td class="px-4 py-3 whitespace-nowrap">
        <span class="inline-flex items-center gap-1 h-5 px-1.5 rounded border ${sv.cls} text-[10px] font-semibold ordo-c-status-badge">
          <span class="dot ${sv.dot}"></span>${sv.label}
        </span>
      </td>
      <td class="px-4 py-3 text-right font-semibold whitespace-nowrap">${rating}</td>
      <td class="px-4 py-3 text-right tabular whitespace-nowrap">${p.projects}</td>
      <td class="px-4 py-3 whitespace-nowrap text-right">
        <div class="inline-flex items-center gap-1">
          ${actionMain}
          <button onclick="window.openPartnerDetailSheet && window.openPartnerDetailSheet('${p.name.replace(/'/g,"\\'")}')" class="h-7 px-2.5 text-[11px] font-semibold rounded-md bg-brand-primary text-white hover:bg-brand-hover">상세</button>
        </div>
      </td>
    </tr>`;
  }).join('');
  refreshIcons();
}

// 파트너 초대 바텀시트
document.getElementById('btnInvitePartner')?.addEventListener('click', () => {
  document.getElementById('invitePartnerSheet')?.classList.remove('hidden');
  setTimeout(() => document.querySelector('#invitePartnerSheet .sheet')?.classList.add('open'), 10);
  refreshIcons();
});
document.getElementById('invitePartnerSheet')?.addEventListener('click', (e) => {
  if (e.target.matches('[data-close-invite]')) {
    document.querySelector('#invitePartnerSheet .sheet')?.classList.remove('open');
    setTimeout(() => document.getElementById('invitePartnerSheet')?.classList.add('hidden'), 200);
  }
});
document.getElementById('invitePartnerSubmit')?.addEventListener('click', () => {
  document.querySelector('#invitePartnerSheet .sheet')?.classList.remove('open');
  setTimeout(() => document.getElementById('invitePartnerSheet')?.classList.add('hidden'), 200);
  alert('초대 메일을 발송했습니다. 온보딩 대기 목록에 추가됩니다.');
});

/* ── 【섹션 4】 인력 배정 히트맵 — 작업자×요일 격자로 과배정/유휴 시각화 ── */


// 8명 × 5일 = 40셀. 요구사항: 유휴 15% (6셀), 과배정 17% (7셀), 적정 68% (27셀)
// 각 셀: [hours, project]


function cellVisual(h){
  if (h === 0) return { bg:'bg-bg-tertiary', border:'border-bd-default', text:'text-tx-tertiary', label:'–' };
  if (h <= 6)  return { bg:'bg-st-okbg',      border:'border-st-okbd',    text:'text-st-okfg',     label:h+'h' };
  if (h <= 8)  return { bg:'',                border:'',                  text:'',                 label:h+'h', custom:'background:#D1FAE5;border:1px solid #6EE7B7;color:#047857;' };
  if (h <= 9)  return { bg:'bg-st-warnbg',    border:'border-st-warnbd',  text:'text-st-warnfg',   label:h+'h' };
  return         { bg:'bg-st-critbg',    border:'border-st-critbd',  text:'text-st-critfg',   label:h+'h' };
}

function renderHeatmap(){
  const tbody = document.getElementById('heatmapBody');
  if (!tbody) return;
  tbody.innerHTML = WORKERS.map((w, wi) => {
    const row = HEATMAP_DATA[wi];
    const total = row.reduce((s, c) => s + c[0], 0);
    const totalColor = total >= 46 ? 'text-st-critfg' : (total >= 41 ? 'text-st-warnfg' : (total === 0 ? 'text-tx-tertiary' : 'text-tx-primary'));
    const cells = row.map((c, di) => {
      const v = cellVisual(c[0]);
      const inlineStyle = v.custom ? `style="${v.custom}"` : '';
      const title = c[0] > 0 ? `${w.name} · ${c[1]} · ${c[0]}h` : `${w.name} · 유휴`;
      return `<td class="px-2 py-2 text-center">
        <button class="heat-cell w-full h-12 rounded-md border text-[12px] font-semibold flex flex-col items-center justify-center transition hover:scale-[1.03] ${v.bg} ${v.border} ${v.text}" ${inlineStyle}
          data-worker="${w.name}" data-worker-initial="${w.initial}" data-day="${di}" data-hours="${c[0]}" data-project="${c[1]}" title="${title}">
          <span>${v.label}</span>
          ${c[1] ? `<span class="text-[9px] font-medium opacity-80 truncate w-full px-1">${c[1]}</span>` : ''}
        </button>
      </td>`;
    }).join('');
    return `<tr class="hover:bg-bg-secondary">
      <td class="px-4 py-2 whitespace-nowrap sticky left-0 bg-white z-10 border-r border-bd-default">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-full bg-bg-tertiary border border-bd-default flex items-center justify-center text-[12px] font-semibold">${w.initial}</div>
          <div>
            <div class="text-[13px] font-semibold">${w.name}</div>
            <div class="text-[10px] text-tx-tertiary">${w.role}</div>
          </div>
        </div>
      </td>
      ${cells}
      <td class="px-4 py-2 text-right font-semibold tabular whitespace-nowrap ${totalColor}">${total}h</td>
    </tr>`;
  }).join('');

  // 셀 클릭 → 재배정 모달
  tbody.querySelectorAll('.heat-cell').forEach(btn => {
    btn.addEventListener('click', () => {
      const DAYS = ['월 4/20','화 4/21','수 4/22','목 4/23','금 4/24'];
      document.getElementById('reassignWorkerName').textContent = btn.dataset.worker;
      document.getElementById('reassignWorkerInitial').textContent = btn.dataset.workerInitial;
      document.getElementById('reassignSlot').textContent = DAYS[parseInt(btn.dataset.day)];
      const cur = parseInt(btn.dataset.hours) || 0;
      document.getElementById('reassignCurrent').textContent = cur + 'h';
      const range = document.getElementById('reassignHoursRange');
      range.value = cur;
      document.getElementById('reassignHoursLabel').textContent = cur + 'h';
      document.getElementById('reassignWarn').classList.toggle('hidden', cur < 10);
      document.getElementById('reassignModal').classList.remove('hidden');
      refreshIcons();
    });
  });
}

document.addEventListener('input', (e) => {
  if (e.target.id === 'reassignHoursRange') {
    const v = parseInt(e.target.value);
    document.getElementById('reassignHoursLabel').textContent = v + 'h';
    document.getElementById('reassignWarn').classList.toggle('hidden', v < 10);
  }
});
document.getElementById('reassignModal')?.addEventListener('click', (e) => {
  if (e.target.matches('[data-close-reassign]')) {
    document.getElementById('reassignModal')?.classList.add('hidden');
  }
});
document.getElementById('reassignSubmit')?.addEventListener('click', () => {
  document.getElementById('reassignModal')?.classList.add('hidden');
  alert('배정이 저장되었습니다. 작업자에게 변경 알림이 발송됩니다.');
});

/* ── 【섹션 5】 감사 로그(Audit) — "누가 언제 무엇을 했는가" 타임라인 ── */


(function seedModuleCardAuditEvents(){
  const moduleAuditEvents = [
    {eventType:'card.created', time:'6월 1일 09:00', occurredAt:'2026-06-01T09:00:00+09:00', actor:'이매니저 PM', visibility:'internal', milestoneId:'m2', target:'mc-004', title:'ModuleCard 생성', summary:'UI Design / 커스텀 디자인 ModuleCard가 생성되었습니다.', tone:'pend'},
    {eventType:'card.assigned', time:'6월 1일 10:20', occurredAt:'2026-06-01T10:20:00+09:00', actor:'이매니저 PM', visibility:'internal', milestoneId:'m2', target:'mc-004', title:'담당자 배정', summary:'커스텀 디자인 ModuleCard가 이디자인에게 배정되었습니다.', tone:'ok'},
    {eventType:'card.review_requested', time:'6월 8일 10:00', occurredAt:'2026-06-08T10:00:00+09:00', actor:'박개발', visibility:'internal', milestoneId:'m3', target:'mc-011', title:'리뷰 요청', summary:'TOTP 2FA ModuleCard가 PM 리뷰 상태로 전환되었습니다.', tone:'pend'},
    {eventType:'card.revision_requested', time:'6월 8일 10:40', occurredAt:'2026-06-08T10:40:00+09:00', actor:'이매니저 PM', visibility:'internal', milestoneId:'m3', target:'mc-011', title:'수정 요청', summary:'만료 테스트와 에러 핸들링 QC 보강이 요청되었습니다.', tone:'warn'},
    {eventType:'card.done', time:'6월 7일 18:10', occurredAt:'2026-06-07T18:10:00+09:00', actor:'이디자인', visibility:'public', milestoneId:'m3', target:'mc-004', title:'작업 완료', summary:'커스텀 디자인 산출물이 승인 대기 상태로 제출되었습니다.', tone:'pend'},
    {eventType:'card.approved', time:'6월 5일 14:30', occurredAt:'2026-06-05T14:30:00+09:00', actor:'클라이언트', visibility:'public', milestoneId:'m3', target:'mc-009', title:'Module 승인', summary:'브랜드 가이드북 ModuleCard가 승인 처리되었습니다.', tone:'ok'},
    {eventType:'gate.passed', time:'6월 5일 17:00', occurredAt:'2026-06-05T17:00:00+09:00', actor:'시스템', visibility:'public', milestoneId:'m3', target:'gate-design-lock', title:'Gate 통과', summary:'Design Lock Gate 기준 산출물이 통과 처리되었습니다.', tone:'ok'}
  ];
  window.ORDO_TIMELINE_EVENTS = (window.ORDO_TIMELINE_EVENTS || []).concat(moduleAuditEvents);
  AUDIT_DATA.unshift(
    {time:'6월 5일 17:00', actor:{initial:'시',name:'시스템',role:'자동'}, action:'gate.passed', icon:'milestone', tone:'ok', desc:'Design Lock Gate 통과', target:'gate-design-lock', targetLabel:'Gate 2: Design Lock', change:{from:'미통과',to:'통과'}, auditAt:'2026-06-05T17:00:00+09:00'},
    {time:'6월 5일 14:30', actor:{initial:'클',name:'클라이언트',role:'Client'}, action:'card.approved', icon:'check-circle-2', tone:'ok', desc:'브랜드 가이드북 ModuleCard 승인', target:'mc-009', targetLabel:'Brand / 풀 가이드북', change:{from:'done',to:'approved'}, auditAt:'2026-06-05T14:30:00+09:00'},
    {time:'6월 7일 18:10', actor:{initial:'이',name:'이디자인',role:'Worker'}, action:'card.done', icon:'upload', tone:'pend', desc:'커스텀 디자인 산출물 제출', target:'mc-004', targetLabel:'UI Design / 커스텀 디자인', change:{from:'in_progress',to:'done'}, auditAt:'2026-06-07T18:10:00+09:00'},
    {time:'6월 8일 10:40', actor:{initial:'이',name:'이매니저',role:'PM'}, action:'card.revision_requested', icon:'rotate-ccw', tone:'warn', desc:'TOTP 2FA QC 보강 요청', target:'mc-011', targetLabel:'Auth / TOTP 2FA', change:{from:'review',to:'revision'}, auditAt:'2026-06-08T10:40:00+09:00'},
    {time:'6월 8일 10:00', actor:{initial:'박',name:'박개발',role:'Worker'}, action:'card.review_requested', icon:'send', tone:'pend', desc:'TOTP 2FA 리뷰 요청', target:'mc-011', targetLabel:'Auth / TOTP 2FA', change:{from:'in_progress',to:'review'}, auditAt:'2026-06-08T10:00:00+09:00'},
    {time:'6월 1일 10:20', actor:{initial:'이',name:'이매니저',role:'PM'}, action:'card.assigned', icon:'user-check', tone:'ok', desc:'커스텀 디자인 ModuleCard 담당자 배정', target:'mc-004', targetLabel:'UI Design / 커스텀 디자인', change:{from:'미배정',to:'이디자인'}, auditAt:'2026-06-01T10:20:00+09:00'},
    {time:'6월 1일 09:00', actor:{initial:'이',name:'이매니저',role:'PM'}, action:'card.created', icon:'plus-circle', tone:'pend', desc:'커스텀 디자인 ModuleCard 생성', target:'mc-004', targetLabel:'UI Design / 커스텀 디자인', change:null, auditAt:'2026-06-01T09:00:00+09:00'}
  );
})();

const ORDO_AUDIT_AT_BY_TARGET = {
  'AP-0108':'2026-04-28T11:58:00+09:00',
  'AP-0091':'2026-04-28T11:28:00+09:00',
  'IN-2040':'2026-04-28T11:00:00+09:00',
  'DOC-2104':'2026-04-28T10:00:00+09:00',
  'IN-2041':'2026-04-28T07:00:00+09:00',
  'AP-0089':'2026-04-28T09:12:00+09:00',
  'Q-2039':'2026-04-27T18:45:00+09:00',
  'C-2038':'2026-04-27T15:30:00+09:00',
  'P-030':'2026-04-27T11:00:00+09:00',
  'W-101':'2026-04-26T12:00:00+09:00',
  'W-401':'2026-04-25T12:00:00+09:00',
  'AP-0083':'2026-04-24T12:00:00+09:00',
  'U-anshim':'2026-04-23T12:00:00+09:00'
};
const ORDO_AUDIT_AT_BY_KEY = {
  'IN-2041|PM 배정':'2026-04-28T09:00:00+09:00',
  'IN-2041|의뢰 접수':'2026-04-28T07:00:00+09:00'
};
AUDIT_DATA.forEach(e => { e.auditAt = e.auditAt || ORDO_AUDIT_AT_BY_KEY[e.target + '|' + e.action] || ORDO_AUDIT_AT_BY_TARGET[e.target] || null; });

function auditToneColor(t){
  return ({
    ok:   'bg-st-okfg',
    warn: 'bg-st-warnfg',
    crit: 'bg-st-critfg',
    pend: 'bg-st-pendfg',
    rej:  'bg-st-rejfg'
  })[t] || 'bg-brand-primary';
}
function auditToneBadge(t){
  return ({
    ok:   'bg-st-okbg text-st-okfg border-st-okbd',
    warn: 'bg-st-warnbg text-st-warnfg border-st-warnbd',
    crit: 'bg-st-critbg text-st-critfg border-st-critbd',
    pend: 'bg-st-pendbg text-st-pendfg border-st-pendbd',
    rej:  'bg-st-rejbg text-st-rejfg border-st-rejbd'
  })[t] || 'bg-bg-tertiary';
}
function getAuditTargetHref(e){
  const id = String(e?.target || '');
  if (/^AP-/.test(id)) return '#admin-cards?approvalId=' + encodeURIComponent(id);
  if (/^IN-/.test(id)) return '#admin-cards?intakeId=' + encodeURIComponent(id);
  if (/^Q-/.test(id)) return '#admin-cards?quoteId=' + encodeURIComponent(id);
  if (/^DOC-/.test(id)) return '#project?docId=' + encodeURIComponent(id);
  if (/^P-/.test(id) || /^PRJ-/.test(id)) return '#admin-projects?projectId=' + encodeURIComponent(id);
  if (/^C-/.test(id) || /^CT-/.test(id)) return '#admin-projects?contractId=' + encodeURIComponent(id);
  if (/^W-/.test(id) || /^U-/.test(id)) return '#admin-team?subjectId=' + encodeURIComponent(id);
  return '';
}
function renderAuditTarget(e){
  const href = getAuditTargetHref(e);
  const label = `${e.targetLabel} <span class="font-mono ml-1">(${e.target})</span>`;
  if (!href) return `<span class="text-tx-secondary">${label}</span>`;
  return `<a href="${href}" class="text-tx-secondary hover:text-tx-primary underline underline-offset-2">${label}</a>`;
}

function renderAuditTimeline(){
  const ol = document.getElementById('auditTimeline');
  if (!ol) return;
  ol.innerHTML = AUDIT_DATA.map(e => {
    const dotColor = auditToneColor(e.tone);
    const badgeCls = auditToneBadge(e.tone);
    const changeBlock = e.change ? `
      <div class="mt-2 flex items-center gap-1.5 text-[11px] text-tx-secondary flex-wrap">
        <span class="inline-flex items-center h-5 px-2 rounded bg-bg-tertiary border border-bd-default font-mono">${e.change.from}</span>
        <i data-lucide="arrow-right" class="w-3 h-3 text-tx-tertiary"></i>
        <span class="inline-flex items-center h-5 px-2 rounded ${badgeCls} border font-mono font-semibold">${e.change.to}</span>
      </div>` : '';
    return `<li class="relative">
      <span class="absolute -left-[29px] lg:-left-[38px] top-1 w-3.5 h-3.5 rounded-full ${dotColor} ring-4 ring-white"></span>
      <div class="flex items-start justify-between gap-3 flex-wrap">
        <div class="flex items-center gap-2 flex-wrap">
          <div class="w-7 h-7 rounded-full bg-bg-tertiary border border-bd-default flex items-center justify-center text-[11px] font-semibold">${e.actor.initial}</div>
          <div>
            <span class="text-[13px] font-semibold">${e.actor.name}</span>
            <span class="text-[11px] text-tx-tertiary ml-1">· ${e.actor.role}</span>
          </div>
          <span class="inline-flex items-center gap-1 h-5 px-1.5 rounded border ${badgeCls} text-[10px] font-semibold ordo-c-status-badge">
            <i data-lucide="${e.icon}" class="w-3 h-3"></i>${e.action}
          </span>
        </div>
        <div class="text-[11px] text-tx-tertiary whitespace-nowrap">${formatUpdatedLabel(e.auditAt) || e.time}</div>
      </div>
      <div class="mt-1.5 text-[13px] text-tx-primary leading-relaxed">${e.desc}</div>
      <div class="mt-1 text-[11px] text-tx-tertiary">
        대상: ${renderAuditTarget(e)}
      </div>
      ${changeBlock}
    </li>`;
  }).join('');
  refreshIcons();
}

document.getElementById('auditCsvExport')?.addEventListener('click', () => {
  window.ordoToast?.('CSV 내보내기 요청을 접수했습니다 — 암호화 ZIP으로 이메일 전송됩니다','ok');
});

// 현재 화면이 admin 화면이면 즉시 렌더

/* ADMIN MODULECARD ROUTES */
let _adminProjectView = 'board';
let _adminProjectSelectedId = 'proj-001';
let _adminProjectDetailTab = 'timeline';
let _adminTeamTab = 'partners';
function adminTodayText(){return '2026-06-08';}
function adminDateTime(v){if(!v)return 0;const s=String(v);const raw=/^\d{4}-\d{2}-\d{2}$/.test(s)?s+'T00:00:00+09:00':s;const t=Date.parse(raw);return Number.isFinite(t)?t:0;}
function adminHoursSince(v){const base=Date.parse(adminTodayText()+'T12:00:00+09:00'),t=adminDateTime(v);return t?Math.max(0,Math.floor((base-t)/3600000)):0;}
function adminMhActual(v){const n=Number(v);if(Number.isFinite(n))return n;const m=String(v||'').match(/\d+(?:\.\d+)?/);return m?Number(m[0]):0;}
function adminMhCap(v){const nums=String(v||'').match(/\d+(?:\.\d+)?/g);return nums?Number(nums[nums.length-1]):0;}
function adminBadge(label,tone){return '<span class="ordo-c-status-badge inline-flex items-center gap-1.5 h-6 px-2 rounded-md border text-[11px] font-semibold '+moduleToneClass(tone)+'"><span class="dot '+moduleDot(tone)+'"></span>'+moduleEsc(label)+'</span>';}
function adminProjectCards(projectId){return moduleCards().filter(function(c){return c.projectId===projectId;});}
function adminProjectProgress(project){const cards=adminProjectCards(project.id);if(cards.length){const approved=cards.filter(function(c){return c.status==='approved';}).length;return {approved:approved,total:cards.length,pct:safePct(approved,cards.length)};}const total=project.total||10,approved=project.approved||Math.round((project.progress||0)/10);return {approved:approved,total:total,pct:safePct(approved,total)};}
function adminRemainingDays(project){if(project.id==='proj-001'){const open=adminProjectCards(project.id).filter(function(c){return !['done','approved'].includes(c.status)&&c.dueDate;}).map(function(c){return moduleDays(c.dueDate);}).filter(function(v){return v!==null;}).sort(function(a,b){return a-b;});return open.length?open[0]:0;}return project.remainingDays;}
function adminProjects(){const live=adminProjectCards('proj-001');const prog=adminProjectProgress({id:'proj-001'});return [
{id:'proj-001',name:ORDO_CLIENT_PROJECT_META.name,client:'○○커머스',pm:ORDO_CLIENT_PROJECT_META.pm,stage:'execution',step:'Step 3: 제작',gate:'Design Lock',contractMh:ORDO_CLIENT_PROJECT_META.contractMh,status:'진행',tone:'pend',summary:'Client ModuleCard 기반 실시간 프로젝트',progress:prog.pct,total:live.length,approved:live.filter(function(c){return c.status==='approved';}).length,remainingDays:adminRemainingDays({id:'proj-001'})},
{id:'proj-002',name:'고객 포털 고도화',client:'테크컴퍼스',pm:'박준호 PM',stage:'proposal',step:'Step 1: 스코핑',gate:'Proposal Fit',contractMh:320,status:'검토',tone:'warn',summary:'IA 재정의와 디자인 벤더 투입 검토',progress:25,total:8,approved:2,remainingDays:12},
{id:'proj-003',name:'정산 자동화 MVP',client:'그린핀테크',pm:'정시윤 PM',stage:'contract',step:'Step 2: 계약',gate:'Contract Lock',contractMh:260,status:'계약',tone:'pend',summary:'정산 정책 범위 확정 대기',progress:40,total:10,approved:4,remainingDays:9},
{id:'proj-004',name:'물류 UAT 안정화',client:'블루로지',pm:'최유진 PM',stage:'qa',step:'Step 4: 납품검수',gate:'Release Gate',contractMh:180,status:'위험',tone:'crit',summary:'테스트 환경 안정화와 결함 재검증 필요',progress:82,total:11,approved:9,remainingDays:-2},
{id:'proj-005',name:'문서 아카이브 전환',client:'코어바이오',pm:'김민재 PM',stage:'closed',step:'Step 4: 납품',gate:'Closeout',contractMh:140,status:'완료',tone:'ok',summary:'인수인계와 읽기 전용 전환 완료',progress:100,total:6,approved:6,remainingDays:0}
];}
function adminProjectStatusLabel(p){const remain=adminRemainingDays(p);if(p.tone==='crit'||remain<0)return '위험';if(p.tone==='warn')return '주의';if(p.tone==='ok')return '완료';return '진행';}
function adminProjectSummaryRows(){return adminProjects().slice(0,3);}
function adminActionCard(title,count,sub,tone,icon,href){return '<a href="'+moduleEsc(href||'#admin-cards')+'" class="action-card group relative bg-white border border-bd-default rounded-xl pl-5 pr-4 py-4 hover:border-bd-emphasis transition shadow-subtle block ordo-c-action-card"><span class="bar-l '+moduleDot(tone)+'"></span><div class="flex items-center gap-2 mb-2">'+adminBadge(title,tone)+'<span class="text-[12px] text-tx-tertiary">즉시 조치</span></div><div class="flex items-end justify-between gap-3"><div><p class="text-[24px] font-semibold tabular">'+moduleEsc(count)+'<span class="text-[13px] text-tx-secondary font-medium ml-0.5">건</span></p><p class="text-[12px] text-tx-secondary mt-1 leading-relaxed">'+moduleEsc(sub)+'</p></div><i data-lucide="'+moduleEsc(icon||'chevron-right')+'" class="w-4 h-4 text-tx-tertiary group-hover:text-tx-primary"></i></div></a>';}
function renderAdminHome(){const cards=moduleCards(),todayMs=adminDateTime(adminTodayText());const open=function(c){return !['done','approved'].includes(c.status);};const overdue=cards.filter(function(c){return c.dueDate&&adminDateTime(c.dueDate)<todayMs&&open(c);});const reviewBacklog=cards.filter(function(c){return c.status==='review'&&adminHoursSince(c.reviewRequestedAt||c.startedAt||c.createdAt)>=48;});const review3d=cards.filter(function(c){return c.status==='review'&&adminHoursSince(c.reviewRequestedAt||c.startedAt||c.createdAt)>=72;});const mhRows=cards.map(function(c){const cap=adminMhCap(c.mhEstimate),actual=adminMhActual(c.mhActual);return {card:c,cap:cap,actual:actual,ratio:cap?actual/cap:0};});const mhActual=mhRows.reduce(function(s,r){return s+r.actual;},0);const mhCap=mhRows.reduce(function(s,r){return s+r.cap;},0);const overburn=mhRows.filter(function(r){return r.cap&&r.ratio>1.5;}).map(function(r){return r.card;});const byProject={};cards.forEach(function(c){if(!c.projectId)return;byProject[c.projectId]=byProject[c.projectId]||[];byProject[c.projectId].push(c);});const activeProjects=Object.keys(byProject).filter(function(id){return byProject[id].some(open);}).length;setHtml('adminHomeKpis',moduleMetric('마감 초과',overdue.length+'건','dueDate < 기준일 · 완료/승인 제외',overdue.length?'text-st-critfg':'')+moduleMetric('리뷰 적체',reviewBacklog.length+'건','review 상태 48h+ 경과',reviewBacklog.length?'text-st-warnfg':'')+moduleMetric('MH 소진율',safePct(mhActual,mhCap)+'%','Σ 실제 MH / Σ estimate 상한')+moduleMetric('진행 프로젝트',activeProjects+'건','ModuleCard가 남아 있는 프로젝트'));const today=document.getElementById('adminHomeToday');if(today)today.textContent=adminTodayText()+' 기준';const actions=[];if(overdue.length)actions.push(adminActionCard('마감 초과',overdue.length,overdue[0].spec+' · '+overdue[0].module+' 포함', 'crit','alarm-clock','#admin-cards?filter=overdue'));if(overburn.length)actions.push(adminActionCard('MH 150% 초과',overburn.length,overburn[0].spec+' · '+overburn[0].module+' 포함', 'crit','gauge','#admin-cards'));if(review3d.length)actions.push(adminActionCard('리뷰 3일+ 적체',review3d.length,review3d[0].spec+' · '+review3d[0].module+' 리뷰 대기', 'warn','message-square-warning','#admin-cards?filter=review'));setHtml('adminHomeActions',actions.slice(0,3).join('')||'<div class="lg:col-span-3 rounded-xl border border-dashed border-bd-default bg-bg-secondary p-6 text-[13px] font-semibold text-st-okfg">즉시 조치가 필요한 ModuleCard가 없습니다.</div>');setHtml('adminHomeProjectRows',adminProjectSummaryRows().map(function(p){const prog=adminProjectProgress(p),remain=adminRemainingDays(p),tone=remain<0?'crit':p.tone;return '<tr data-admin-home-project="'+moduleEsc(p.id)+'" class="hover:bg-bg-secondary cursor-pointer"><td class="px-4 py-3"><div class="font-semibold text-tx-primary">'+moduleEsc(p.name)+'</div><div class="text-[11px] text-tx-tertiary mt-0.5">'+moduleEsc(p.pm)+' · '+moduleEsc(p.client)+'</div></td><td class="px-4 py-3 text-tx-secondary">'+moduleEsc(p.step)+'</td><td class="px-4 py-3"><div class="flex items-center gap-2"><div class="progress-track ordo-c-progress-track flex-1" style="height:6px;"><div class="progress-fill" style="width:'+prog.pct+'%"></div></div><span class="text-[12px] tabular font-semibold w-10 text-right">'+prog.pct+'%</span></div></td><td class="px-4 py-3 text-right tabular font-semibold '+(remain<0?'text-st-critfg':'text-tx-primary')+'">'+(remain<0?'D+'+Math.abs(remain):'D-'+remain)+'</td><td class="px-4 py-3">'+adminBadge(adminProjectStatusLabel(p),tone)+'</td></tr>';}).join(''));document.querySelectorAll('[data-admin-home-project]').forEach(function(row){row.onclick=function(){location.hash='#admin-projects?projectId='+encodeURIComponent(row.getAttribute('data-admin-home-project'));if(typeof navigate==='function')navigate(location.hash);};});const people=Object.entries(ORDO_MODULE_PEOPLE).filter(function(x){return x[0]!=='unassigned';}).slice(0,3);setHtml('adminHomeResourceRows',people.map(function(entry){const id=entry[0],p=entry[1],mine=cards.filter(function(c){return c.assignedTo===id;}),progress=mine.filter(function(c){return ['in_progress','review','revision'].includes(c.status);}).length,pending=mine.filter(function(c){return c.status==='pending';}).length,weekly=mine.reduce(function(sum,c){return sum+(c.workLogs||[]).reduce(function(s,l){return s+adminMhActual(l.hours||l.text);},0);},0)||mine.reduce(function(sum,c){return sum+adminMhActual(c.mhActual);},0);return '<button type="button" data-admin-home-worker="'+moduleEsc(id)+'" class="w-full px-4 lg:px-5 py-4 text-left hover:bg-bg-secondary"><div class="flex items-center justify-between gap-3"><div class="flex items-center gap-3 min-w-0"><div class="w-9 h-9 rounded-full bg-bg-tertiary border border-bd-default flex items-center justify-center text-[12px] font-semibold shrink-0">'+moduleEsc(p.name.slice(0,1))+'</div><div class="min-w-0"><div class="text-[13px] font-semibold truncate">'+moduleEsc(p.name)+'</div><div class="text-[11px] text-tx-tertiary truncate">'+moduleEsc(p.role)+'</div></div></div><div class="grid grid-cols-3 gap-3 text-right text-[12px] shrink-0"><span><b class="tabular">'+progress+'</b><em class="block not-italic text-[10px] text-tx-tertiary">진행</em></span><span><b class="tabular">'+pending+'</b><em class="block not-italic text-[10px] text-tx-tertiary">대기</em></span><span><b class="tabular">'+weekly+'</b><em class="block not-italic text-[10px] text-tx-tertiary">MH</em></span></div></div></button>';}).join(''));document.querySelectorAll('[data-admin-home-worker]').forEach(function(btn){btn.onclick=function(){location.hash='#admin-team?worker='+encodeURIComponent(btn.getAttribute('data-admin-home-worker'));if(typeof navigate==='function')navigate(location.hash);};});if(window.refreshIcons)window.refreshIcons();else if(window.lucide)window.lucide.createIcons();}
function adminProjectCardHtml(p){const prog=adminProjectProgress(p),remain=adminRemainingDays(p),tone=remain<0?'crit':p.tone;return '<button type="button" data-admin-project-card="'+moduleEsc(p.id)+'" class="w-full text-left bg-white border '+(p.id===_adminProjectSelectedId?'border-brand-primary':'border-bd-default')+' rounded-xl p-4 shadow-subtle hover:border-bd-emphasis transition"><div class="flex items-start justify-between gap-3"><div class="min-w-0"><h3 class="text-[14px] font-semibold leading-snug truncate">'+moduleEsc(p.name)+'</h3><p class="text-[11px] text-tx-tertiary mt-1 truncate">'+moduleEsc(p.pm)+' · '+moduleEsc(p.client)+'</p></div>'+adminBadge(adminProjectStatusLabel(p),tone)+'</div><p class="text-[12px] text-tx-secondary mt-3 leading-relaxed">'+moduleEsc(p.summary)+'</p><div class="mt-4">'+progressTrackHtml('Module 진행률',prog.approved,prog.total,'approved / total 기준')+'</div><div class="mt-3 flex items-center justify-between text-[11px] text-tx-tertiary"><span>'+moduleEsc(p.step)+'</span><span class="tabular '+(remain<0?'text-st-critfg font-semibold':'')+'">'+(remain<0?'D+'+Math.abs(remain):'D-'+remain)+'</span></div></button>';}
function renderAdminProjects(){const projects=adminProjects();const requested=new URLSearchParams((location.hash.split('?')[1]||'')).get('projectId');if(requested&&projects.some(function(p){return p.id===requested;}))_adminProjectSelectedId=requested;document.querySelectorAll('[data-admin-project-view]').forEach(function(btn){const active=btn.getAttribute('data-admin-project-view')===_adminProjectView;btn.classList.toggle('bg-white',active);btn.classList.toggle('shadow-subtle',active);btn.classList.toggle('text-tx-secondary',!active);btn.onclick=function(){_adminProjectView=btn.getAttribute('data-admin-project-view');renderAdminProjects();};});document.getElementById('adminProjectBoardView')?.classList.toggle('hidden',_adminProjectView!=='board');document.getElementById('adminProjectTableView')?.classList.toggle('hidden',_adminProjectView!=='table');const columns=[['proposal','제안','pend'],['contract','계약','warn'],['execution','실행','pend'],['qa','검수','ok'],['closed','종료','default']];setHtml('adminProjectBoard',columns.map(function(col){const list=projects.filter(function(p){return p.stage===col[0];});return '<section class="bg-bg-tertiary/60 border border-bd-default rounded-xl p-3"><div class="flex items-center justify-between mb-3 px-1"><div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full '+moduleDot(col[2])+'"></span><h2 class="text-[13px] font-semibold">'+moduleEsc(col[1])+'</h2><span class="text-[11px] text-tx-tertiary tabular">('+list.length+')</span></div></div><div class="space-y-2">'+(list.map(adminProjectCardHtml).join('')||'<div class="rounded-lg border border-dashed border-bd-default bg-white/60 p-4 text-[12px] text-tx-tertiary">해당 단계 프로젝트 없음</div>')+'</div></section>';}).join(''));setHtml('adminProjectTableBody',projects.map(function(p){const prog=adminProjectProgress(p),remain=adminRemainingDays(p),tone=remain<0?'crit':p.tone;return '<tr data-admin-project-row="'+moduleEsc(p.id)+'" class="hover:bg-bg-secondary cursor-pointer"><td class="px-4 py-3"><div class="font-semibold">'+moduleEsc(p.name)+'</div><div class="text-[11px] text-tx-tertiary mt-0.5">'+moduleEsc(p.client)+'</div></td><td class="px-4 py-3 text-tx-secondary">'+moduleEsc(p.pm)+'</td><td class="px-4 py-3 text-tx-secondary">'+moduleEsc(p.step)+'</td><td class="px-4 py-3"><div class="flex items-center gap-2"><div class="progress-track ordo-c-progress-track flex-1" style="height:6px;"><div class="progress-fill" style="width:'+prog.pct+'%"></div></div><span class="text-[12px] font-semibold tabular w-10 text-right">'+prog.pct+'%</span></div></td><td class="px-4 py-3 text-right tabular font-semibold '+(remain<0?'text-st-critfg':'')+'">'+(remain<0?'D+'+Math.abs(remain):'D-'+remain)+'</td><td class="px-4 py-3">'+adminBadge(adminProjectStatusLabel(p),tone)+'</td><td class="px-4 py-3 text-tx-secondary">'+moduleEsc(p.gate)+'</td><td class="px-4 py-3 text-right tabular">'+moduleEsc(p.contractMh)+'</td></tr>';}).join(''));document.querySelectorAll('[data-admin-project-card], [data-admin-project-row]').forEach(function(el){el.onclick=function(){_adminProjectSelectedId=el.getAttribute('data-admin-project-card')||el.getAttribute('data-admin-project-row');_adminProjectDetailTab='timeline';renderAdminProjects();document.getElementById('adminProjectDetail')?.scrollIntoView({block:'nearest'});};});renderAdminProjectDetail(projects.find(function(p){return p.id===_adminProjectSelectedId;})||projects[0]);if(window.refreshIcons)window.refreshIcons();else if(window.lucide)window.lucide.createIcons();}
function adminProjectTimelineHtml(p){if(p.id!=='proj-001')return '<div class="rounded-xl border border-dashed border-bd-default bg-bg-secondary p-6 text-[13px] text-tx-secondary">샘플 프로젝트입니다. 상세 ModuleCard는 proj-001 기준 화면에서 확인합니다.</div>';const cards=adminProjectCards(p.id).slice().sort(function(a,b){return (Number(a.step||0)-Number(b.step||0))||(dateRank(a.createdAt)-dateRank(b.createdAt));});const steps=[...new Set(cards.map(function(c){return c.step||3;}))];const design=cards.filter(function(c){return c.chain==='design';});const gatePassed=design.length&&design.every(function(c){return c.status==='approved';});return steps.map(function(step){const group=cards.filter(function(c){return (c.step||3)===step;});return '<section><div class="flex items-center gap-3 mb-3"><span class="text-[13px] font-semibold text-tx-primary whitespace-nowrap">Step '+moduleEsc(step)+': '+moduleEsc(ORDO_STEP_LABELS[step]||'제작')+'</span><span class="h-px bg-bd-default flex-1"></span></div><div class="grid grid-cols-1 lg:grid-cols-2 gap-3">'+group.map(moduleCard).join('')+'</div><div class="flex items-center gap-3 mt-5"><span class="h-px bg-bd-default flex-1"></span><span class="text-[12px] font-semibold text-tx-secondary whitespace-nowrap">Gate 2: Design Lock</span><span class="text-[12px] font-semibold '+(gatePassed?'text-st-okfg':'text-st-warnfg')+'">'+(gatePassed?'통과':'미통과')+'</span><span class="h-px bg-bd-default flex-1"></span></div></section>';}).join('');}
function adminScopedPlaceholder(title,body){return '<section data-role-scope="admin" class="rounded-xl border border-bd-default bg-white p-5 shadow-subtle"><h3 class="text-[15px] font-semibold">'+moduleEsc(title)+'</h3><p class="text-[13px] text-tx-secondary mt-2 leading-relaxed">'+moduleEsc(body)+'</p></section>';}
function adminProjectDetailTabs(){return [['timeline','타임라인'],['finance','재무'],['resource','투입'],['contract','계약']];}
function adminProjectDetailBodyHtml(p){return _adminProjectDetailTab==='timeline'?adminProjectTimelineHtml(p):_adminProjectDetailTab==='finance'?adminScopedPlaceholder('재무',p.name+'의 계약 MH, 소진 MH, 추가비 정산 위험을 확인하는 관리자 전용 영역입니다.'): _adminProjectDetailTab==='resource'?adminScopedPlaceholder('투입',p.name+'의 PM/Worker 배정, 가동률, 병목을 확인하는 관리자 전용 영역입니다.'):adminScopedPlaceholder('계약',p.name+'의 계약 범위, 변경 요청, Gate 조건을 확인하는 관리자 전용 영역입니다.');}
function adminProjectDetailHeaderHtml(p){return '<div class="px-4 lg:px-5 py-4 border-b border-bd-default flex items-start justify-between gap-3 flex-wrap"><div><p class="text-[11px] text-tx-tertiary">'+moduleEsc(p.client)+' \u00B7 '+moduleEsc(p.pm)+' \u00B7 \uACC4\uC57D MH '+moduleEsc(p.contractMh)+'</p><h2 class="text-[20px] lg:text-[22px] font-semibold mt-1">'+moduleEsc(p.name)+'</h2></div>'+adminBadge(adminProjectStatusLabel(p),p.tone)+'</div>';}
function adminProjectDetailTabButtonHtml(tab){const active=tab[0]===_adminProjectDetailTab;return '<button type="button" data-admin-project-detail-tab="'+tab[0]+'" class="h-9 px-3 text-[13px] font-semibold border-b-2 whitespace-nowrap '+(active?'border-brand-primary text-tx-primary':'border-transparent text-tx-tertiary hover:text-tx-primary')+'">'+tab[1]+'</button>';}
function bindAdminProjectDetailTabs(p){document.querySelectorAll('[data-admin-project-detail-tab]').forEach(function(btn){btn.onclick=function(){_adminProjectDetailTab=btn.getAttribute('data-admin-project-detail-tab');renderAdminProjectDetail(p);if(window.refreshIcons)window.refreshIcons();else if(window.lucide)window.lucide.createIcons();};});}
function renderAdminProjectDetail(p){if(!p)return;const tabs=adminProjectDetailTabs();const body=adminProjectDetailBodyHtml(p);setHtml('adminProjectDetail','<article class="bg-white border border-bd-default rounded-xl shadow-subtle overflow-hidden">'+adminProjectDetailHeaderHtml(p)+'<div class="px-4 lg:px-5 pt-4 flex items-center gap-1 border-b border-bd-default overflow-x-auto">'+tabs.map(adminProjectDetailTabButtonHtml).join('')+'</div><div class="p-4 lg:p-5">'+body+'</div></article>');bindAdminProjectDetailTabs(p);}
function adminWorkerMappedId(worker){return ({'W-101':'worker-001','W-102':'worker-002','W-103':'worker-003'})[worker.id]||'';}
function renderAdminTeamHeatmap(){const tbody=document.getElementById('heatmapBody');if(!tbody||typeof WORKERS==='undefined')return;tbody.innerHTML=WORKERS.map(function(w,wi){const row=(typeof HEATMAP_DATA!=='undefined'&&HEATMAP_DATA[wi])||[[0,''],[0,''],[0,''],[0,''],[0,'']];const total=row.reduce(function(s,c){return s+c[0];},0);const mapped=adminWorkerMappedId(w),count=mapped?moduleCards().filter(function(c){return c.assignedTo===mapped;}).length:0;const totalColor=total>=46?'text-st-critfg':(total>=41?'text-st-warnfg':(total===0?'text-tx-tertiary':'text-tx-primary'));const cells=row.map(function(c,di){const v=typeof cellVisual==='function'?cellVisual(c[0]):{bg:'bg-bg-tertiary',border:'border-bd-default',text:'text-tx-tertiary',label:c[0]+'h'};const inlineStyle=v.custom?'style="'+v.custom+'"':'';return '<td class="px-2 py-2 text-center"><button class="heat-cell w-full h-12 rounded-md border text-[12px] font-semibold flex flex-col items-center justify-center transition hover:scale-[1.03] '+(v.bg||'')+' '+(v.border||'')+' '+(v.text||'')+'" '+inlineStyle+' data-worker="'+moduleEsc(w.name)+'" data-worker-initial="'+moduleEsc(w.initial)+'" data-day="'+di+'" data-hours="'+c[0]+'" data-project="'+moduleEsc(c[1]||'')+'"><span>'+moduleEsc(v.label)+'</span>'+(c[1]?'<span class="text-[9px] font-medium opacity-80 truncate w-full px-1">'+moduleEsc(c[1])+'</span>':'')+'</button></td>';}).join('');return '<tr class="hover:bg-bg-secondary"><td class="px-4 py-2 whitespace-nowrap sticky left-0 bg-white z-10 border-r border-bd-default"><div class="flex items-center gap-2.5"><div class="w-8 h-8 rounded-full bg-bg-tertiary border border-bd-default flex items-center justify-center text-[12px] font-semibold">'+moduleEsc(w.initial)+'</div><div><div class="text-[13px] font-semibold">'+moduleEsc(w.name)+'</div><div class="text-[10px] text-tx-tertiary">'+moduleEsc(w.role)+' · Module '+count+'건</div></div></div></td>'+cells+'<td class="px-4 py-2 text-right font-semibold tabular whitespace-nowrap '+totalColor+'">'+total+'h</td></tr>';}).join('');tbody.querySelectorAll('.heat-cell').forEach(function(btn){btn.addEventListener('click',function(){const days=['월 6/8','화 6/9','수 6/10','목 6/11','금 6/12'];const cur=parseInt(btn.dataset.hours,10)||0;const ids=['reassignWorkerName','reassignWorkerInitial','reassignSlot','reassignCurrent','reassignHoursLabel'];if(!ids.every(function(id){return document.getElementById(id);}))return;document.getElementById('reassignWorkerName').textContent=btn.dataset.worker;document.getElementById('reassignWorkerInitial').textContent=btn.dataset.workerInitial;document.getElementById('reassignSlot').textContent=days[parseInt(btn.dataset.day,10)]||'';document.getElementById('reassignCurrent').textContent=cur+'h';const range=document.getElementById('reassignHoursRange');if(range)range.value=cur;document.getElementById('reassignHoursLabel').textContent=cur+'h';document.getElementById('reassignWarn')?.classList.toggle('hidden',cur<10);document.getElementById('reassignModal')?.classList.remove('hidden');if(window.refreshIcons)window.refreshIcons();else if(window.lucide)window.lucide.createIcons();});});}
function renderAdminTeam(){const partners=typeof PARTNER_DATA!=='undefined'?PARTNER_DATA:[];setHtml('adminTeamPartnerKpis',moduleMetric('활성','28','가동 가능 파트너')+moduleMetric('대기','3','초대/검증 대기','text-st-pendfg')+moduleMetric('이번 달','5','신규 온보딩'));const allCells=typeof HEATMAP_DATA!=='undefined'?HEATMAP_DATA.flat():[];const over=allCells.filter(function(c){return c[0]>=10;}).length,idle=allCells.filter(function(c){return c[0]===0;}).length;setHtml('adminTeamHeatmapKpis',moduleMetric('Worker','8명','월~금 히트맵')+moduleMetric('과배정',over+'칸','10h 이상','text-st-critfg')+moduleMetric('유휴',idle+'칸','0h 슬롯','text-tx-secondary')+moduleMetric('Module',moduleCards().filter(function(c){return c.assignedTo;}).length+'건','담당자 지정'));document.querySelectorAll('[data-admin-team-tab]').forEach(function(btn){const active=btn.getAttribute('data-admin-team-tab')===_adminTeamTab;btn.classList.toggle('bg-white',active);btn.classList.toggle('shadow-subtle',active);btn.classList.toggle('text-tx-secondary',!active);btn.onclick=function(){_adminTeamTab=btn.getAttribute('data-admin-team-tab');renderAdminTeam();};});document.querySelectorAll('[data-admin-team-panel]').forEach(function(panel){panel.classList.toggle('hidden',panel.getAttribute('data-admin-team-panel')!==_adminTeamTab);});if(typeof renderPartnerTable==='function')renderPartnerTable();renderAdminTeamHeatmap();if(window.refreshIcons)window.refreshIcons();else if(window.lucide)window.lucide.createIcons();}

let _adminCardFilter = 'all';
let _adminCardProjectFilter = 'all';
let _adminCardWorkerFilter = 'all';
let _adminCardChainFilter = 'all';
let _adminSelectedCardId = null;
let _adminCardRouteKey = '';
const ADMIN_CARD_FILTER_IDS = ['all','review','overdue','in_progress','pending','done'];
// Apply #admin-cards?filter= deep links once per hash change (same pattern as worker cards).
function syncAdminCardRouteState(){
  if (_adminCardRouteKey === location.hash) return;
  const f = routeParams().get('filter');
  if (f && ADMIN_CARD_FILTER_IDS.includes(f)) _adminCardFilter = f;
  _adminCardRouteKey = location.hash;
}
function adminCardIsOpen(c){return !['done','approved'].includes(c.status);}
function adminCardIsOverdue(c){return c.dueDate&&adminDateTime(c.dueDate)<adminDateTime(adminTodayText())&&adminCardIsOpen(c);}
function adminCardStatusFilters(cards){return [
  {id:'all',label:'전체',count:cards.length,tone:'default'},
  {id:'review',label:'리뷰요청',count:cards.filter(function(c){return c.status==='review';}).length,tone:'warn'},
  {id:'overdue',label:'마감초과',count:cards.filter(adminCardIsOverdue).length,tone:'crit'},
  {id:'in_progress',label:'진행중',count:cards.filter(function(c){return c.status==='in_progress';}).length,tone:'pend'},
  {id:'pending',label:'대기',count:cards.filter(function(c){return c.status==='pending';}).length,tone:'default'},
  {id:'done',label:'완료',count:cards.filter(function(c){return ['done','approved'].includes(c.status);}).length,tone:'ok'}
];}
function adminFilterCards(cards){return adminSortCards(cards.filter(function(c){if(_adminCardFilter==='review'&&c.status!=='review')return false;if(_adminCardFilter==='overdue'&&!adminCardIsOverdue(c))return false;if(_adminCardFilter==='in_progress'&&c.status!=='in_progress')return false;if(_adminCardFilter==='pending'&&c.status!=='pending')return false;if(_adminCardFilter==='done'&&!['done','approved'].includes(c.status))return false;if(_adminCardProjectFilter!=='all'&&c.projectId!==_adminCardProjectFilter)return false;if(_adminCardWorkerFilter==='unassigned'&&c.assignedTo)return false;if(_adminCardWorkerFilter!=='all'&&_adminCardWorkerFilter!=='unassigned'&&c.assignedTo!==_adminCardWorkerFilter)return false;if(_adminCardChainFilter!=='all'&&c.chain!==_adminCardChainFilter)return false;return true;}));}
function adminSortCards(cards){return cards.slice().sort(function(a,b){return (adminDateTime(a.dueDate||'2999-12-31')-adminDateTime(b.dueDate||'2999-12-31'))||(dateRank(b.createdAt)-dateRank(a.createdAt));});}
function adminFilterPillHtml(item){const active=item.id===_adminCardFilter,tone=item.tone==='crit'?'crit':(item.tone==='warn'?'warn':(item.tone==='ok'?'ok':'default'));const activeCls=active?'bg-brand-primary text-white border-brand-primary':(tone==='crit'?'bg-st-critbg text-st-critfg border-st-critbd':tone==='warn'?'bg-st-warnbg text-st-warnfg border-st-warnbd':tone==='ok'?'bg-st-okbg text-st-okfg border-st-okbd':'bg-white text-tx-secondary border-bd-default');return '<button type="button" data-admin-card-filter="'+item.id+'" class="h-8 px-3 rounded-full border text-[12px] font-semibold inline-flex items-center gap-1.5 '+activeCls+'">'+moduleEsc(item.label)+'<span class="tabular">'+item.count+'</span></button>';}
function adminSelectOptionsHtml(type,cards){if(type==='project'){const ids=[...new Set(cards.map(function(c){return c.projectId;}).filter(Boolean))];return '<option value="all">프로젝트: 전체</option>'+ids.map(function(id){const p=adminProjects().find(function(x){return x.id===id;});return '<option value="'+moduleEsc(id)+'">'+moduleEsc(p?p.name:id)+'</option>';}).join('');}if(type==='worker'){const people=Object.entries(ORDO_MODULE_PEOPLE).filter(function(x){return x[0]!=='unassigned';});return '<option value="all">Worker: 전체</option><option value="unassigned">미배정</option>'+people.map(function(entry){return '<option value="'+moduleEsc(entry[0])+'">'+moduleEsc(entry[1].name)+'</option>';}).join('');}return '<option value="all">Chain: 전체</option>'+['design','dev','ops'].map(function(chain){return '<option value="'+chain+'">'+moduleEsc(ORDO_CHAIN_LABELS[chain]||chain)+'</option>';}).join('');}
function adminCardListItemHtml(c,selected){
  // Screen logic keeps the overdue-tone decision; markup comes from the shared factory.
  return window.ORDO_UI_COMPONENTS.ModuleCardListItem(c, {
    tone: adminCardIsOverdue(c) ? 'crit' : moduleTone(c),
    dataAttr: 'data-admin-card-id',
    selected: selected,
    metaParts: [c.spec, c.gateRef || '-'],
    truncateFooterLeft: true
  });
}

function adminCardEmptyDetailHtml(){
  return window.ORDO_UI_COMPONENTS.EmptyState('표시할 ModuleCard가 없습니다.', { variant: 'detail-lg' });
}

function adminCardQcItemsHtml(c){
  return window.ORDO_UI_COMPONENTS.QcList(c.qcChecklist);
}

function adminCardWorkLogItemsHtml(c){
  return window.ORDO_UI_COMPONENTS.WorkLogList(c.workLogs);
}

function adminCardAttachmentItemsHtml(c){
  return window.ORDO_UI_COMPONENTS.AttachmentList(c.attachments);
}

function adminCardCommentItemsHtml(c){
  return window.ORDO_UI_COMPONENTS.CommentList(c.comments);
}


function adminCardHeaderHtml(c){
  // Fixes the corrupted "?" separator that used to render between specCode and gateRef.
  return window.ORDO_UI_COMPONENTS.DetailHeader(c, {
    topText: (c.specCode || '-') + ' · ' + (c.gateRef || '-'),
    subText: (c.dial || '-') + ' · 마감 ' + (c.dueDate || '-') + ' · MH ' + c.mhActual + '/' + c.mhEstimate,
    badgeHtml: statusBadgeHtml(c.status, adminCardIsOverdue(c) ? 'crit' : null)
  });
}

/* adminCardMetaTileHtml merged into MetaGrid (app/ui/components/detail.ui.js). */

function adminCardMetaGridHtml(c, person){
  const chain = ORDO_CHAIN_LABELS[c.chain] || c.chain || '-';
  return window.ORDO_UI_COMPONENTS.MetaGrid([
    ['담당 Worker', person.name],
    ['PM', ORDO_CLIENT_PROJECT_META.pm],
    ['Chain', chain],
    ['Step', 'Step ' + (c.step || '-')],
    ['마감', c.dueDate || '-'],
    ['Gate', c.gateRef || '-']
  ]);
}

function adminCardRecipeHtml(){
  return `
    <details class="mt-5 rounded-xl border border-bd-default bg-bg-secondary p-4" open>
      <summary class="cursor-pointer text-[13px] font-semibold">Recipe</summary>
      <p class="text-[13px] text-tx-secondary mt-3 leading-relaxed">도구: Claude Code → Cursor │ 공정: 스키마→API→UI→테스트 │ <a href="#" class="text-brand-primary font-semibold">전체 보기</a></p>
    </details>
  `;
}


function adminCardSectionsHtml(qc, logs, files, comments){
  const C = window.ORDO_UI_COMPONENTS;
  const commentAction = '<button type="button" data-admin-card-action="comment" class="text-[12px] font-semibold text-tx-secondary hover:text-tx-primary">+ 코멘트</button>';
  return '<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">'
    + C.DetailSection('QC 체크리스트', '<ul class="divide-y divide-bd-default">' + qc + '</ul>')
    + C.DetailSection('작업 기록', '<ul class="divide-y divide-bd-default">' + logs + '</ul>')
    + C.DetailSection('산출물', '<div class="divide-y divide-bd-default">' + files + '</div>')
    + C.DetailSection('코멘트', '<div class="divide-y divide-bd-default">' + comments + '</div>', { headerActionHtml: commentAction })
    + '</div>';
}

function adminCardActionButtonsHtml(){
  return window.ORDO_UI_COMPONENTS.ActionToolbar([
    { attr: 'data-admin-card-action', value: 'reassign', icon: 'user-cog', label: 'Worker 재할당' },
    { attr: 'data-admin-card-action', value: 'due', icon: 'calendar-clock', label: '마감 변경' },
    { attr: 'data-admin-card-action', value: 'done', icon: 'check-circle-2', label: '완료 처리' },
    { attr: 'data-admin-card-action', value: 'revision', icon: 'rotate-ccw', label: '수정 요청', variant: 'warn' },
    { attr: 'data-admin-card-action', value: 'client', icon: 'send', label: 'Client 전달', variant: 'primary' }
  ]);
}

function adminCardDetailHtml(c){
  if (!c) return adminCardEmptyDetailHtml();

  const p = ORDO_MODULE_PEOPLE[c.assignedTo || 'unassigned'] || ORDO_MODULE_PEOPLE.unassigned;
  const qc = adminCardQcItemsHtml(c);
  const logs = adminCardWorkLogItemsHtml(c);
  const files = adminCardAttachmentItemsHtml(c);
  const comments = adminCardCommentItemsHtml(c);

  return `
    ${adminCardHeaderHtml(c)}
    ${adminCardMetaGridHtml(c, p)}
    ${adminCardRecipeHtml()}
    ${adminCardSectionsHtml(qc, logs, files, comments)}
    ${adminCardActionButtonsHtml()}
  `;
}

function adminGateReadyGroup(){const cards=moduleCards(),selected=cards.find(function(c){return c.id===_adminSelectedCardId;});const groups={};cards.forEach(function(c){if(!c.projectId||!c.gateRef)return;const key=c.projectId+'|'+c.gateRef;groups[key]=groups[key]||[];groups[key].push(c);});const keys=Object.keys(groups);const preferred=selected?[selected.projectId+'|'+selected.gateRef]:[];return preferred.concat(keys).filter(Boolean).map(function(key){const list=groups[key]||[],parts=key.split('|'),projectId=parts[0],gateRef=parts.slice(1).join('|');return {key:key,projectId:projectId,gateRef:gateRef,cards:list,approved:list.filter(function(c){return c.status==='approved';}).length,total:list.length};}).find(function(g){return g.total>0&&g.approved===g.total&&!adminIsGatePassed(g.projectId,g.gateRef);})||null;}
function adminIsGatePassed(projectId,gateRef){const p=(window.ORDO_PROJECTS||[]).find(function(x){return x.id===projectId;});return !!(p&&p.gates&&p.gates[gateRef]&&p.gates[gateRef].status==='passed');}
function renderAdminGateBanner(){const g=adminGateReadyGroup();if(!g){setHtml('adminGateBanner','');return;}setHtml('adminGateBanner','<article class="rounded-xl border border-st-okbd bg-st-okbg p-4 shadow-subtle flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3"><div class="flex items-start gap-3"><div class="w-9 h-9 rounded-full bg-st-okfg text-white flex items-center justify-center shrink-0"><i data-lucide="check" class="w-4 h-4"></i></div><div><h2 class="text-[15px] font-semibold text-st-okfg">'+moduleEsc(g.gateRef)+' 통과 가능</h2><p class="text-[12px] text-tx-secondary mt-1">연결 카드 '+g.approved+'/'+g.total+' approved</p></div></div><button type="button" data-admin-gate-pass="'+moduleEsc(g.key)+'" class="h-10 px-4 rounded-lg bg-brand-primary text-white hover:bg-brand-hover text-[13px] font-semibold inline-flex items-center justify-center gap-1.5"><i data-lucide="milestone" class="w-4 h-4"></i>Gate 통과 처리</button></article>');document.querySelector('[data-admin-gate-pass]')?.addEventListener('click',function(){if(!confirm(g.gateRef+' Gate를 통과 처리할까요?'))return;let project=(window.ORDO_PROJECTS||[]).find(function(p){return p.id===g.projectId;});if(!project){project={id:g.projectId,gates:{}};window.ORDO_PROJECTS.push(project);}project.gates=project.gates||{};project.gates[g.gateRef]={status:'passed',passedAt:nowDisplayText(),approved:g.approved,total:g.total};window.ORDO_TIMELINE_EVENTS=window.ORDO_TIMELINE_EVENTS||[];window.ORDO_TIMELINE_EVENTS.push({eventType:'gate.passed',time:nowDisplayText(),occurredAt:new Date().toISOString(),actor:'이매니저 PM',visibility:'public',milestoneId:'m3',target:'gate-'+g.gateRef.toLowerCase().replace(/\s+/g,'-'),title:'Gate 통과',summary:g.gateRef+' Gate가 PM에 의해 통과 처리되었습니다.',tone:'ok'});renderAdminCards();renderAdminProjects();window.ordoToast?.('Gate 통과 처리되었습니다','ok');});if(window.refreshIcons)window.refreshIcons();else if(window.lucide)window.lucide.createIcons();}
/* Legacy direct-mutation adminAfterCardMutation/bindAdminCardActions removed in round 7.
   The lifecycle-service versions below are now the only implementations. */

function adminAfterCardMutation(message,tone){
  window.ORDO_MODULE_CARD_LIFECYCLE?.persist();
  // Re-render only the active route. Other module screens re-render on entry because
  // the router calls renderModuleRouteScreens for every module route navigation.
  const route = (location.hash || '').replace('#','').split('?')[0] || 'admin-cards';
  if (typeof renderModuleRouteScreens === 'function') renderModuleRouteScreens(route);
  if (message) window.ordoToast?.(message, tone || 'ok');
}

function bindAdminCardActions(card){
  const lifecycle = window.ORDO_MODULE_CARD_LIFECYCLE;
  document.querySelectorAll('[data-admin-card-action]').forEach(function(btn){
    btn.onclick = function(){
      const action = btn.getAttribute('data-admin-card-action');
      try {
        if(action==='comment'){
          const text=prompt('PM 코멘트를 입력하세요.');
          if(!text||!text.trim())return;
          lifecycle?.addFreeComment(card,'admin',text.trim(),ORDO_CLIENT_PROJECT_META.pm);
          adminAfterCardMutation('코멘트가 추가되었습니다','ok');
        }
        if(action==='reassign'){
          const people=Object.entries(ORDO_MODULE_PEOPLE).filter(function(x){return x[0]!=='unassigned';});
          const input=prompt('Worker ID를 입력하세요: '+people.map(function(x){return x[0]+'('+x[1].name+')';}).join(', ')+' / unassigned');
          if(!input)return;
          const value=input.trim();
          let workerId=value==='unassigned'?null:value;
          if(workerId&&!ORDO_MODULE_PEOPLE[workerId]){
            const found=people.find(function(x){return x[1].name===value;});
            workerId=found?found[0]:null;
          }
          if(value!=='unassigned'&&!workerId){alert('일치하는 Worker가 없습니다.');return;}
          lifecycle?.reassign(card,workerId);
          adminAfterCardMutation('Worker 배정이 변경되었습니다','ok');
        }
        if(action==='due'){
          const next=prompt('새 마감일을 YYYY-MM-DD 형식으로 입력하세요.',card.dueDate||adminTodayText());
          if(!next)return;
          if(!lifecycle?.setDueDate(card,next.trim())){alert('YYYY-MM-DD 형식으로 입력하세요.');return;}
          adminAfterCardMutation('마감일이 변경되었습니다','ok');
        }
        if(action==='done'){
          lifecycle?.markDone(card);
          adminAfterCardMutation('Client 승인 대기 카드로 전환되었습니다.','ok');
        }
        if(action==='revision'){
          const text=prompt('수정 요청 코멘트를 입력하세요.');
          if(!text||!text.trim())return;
          lifecycle?.requestRevision(card,{role:'admin',note:text.trim()});
          adminAfterCardMutation('수정 요청으로 전환되었습니다','warn');
        }
        if(action==='client'){
          lifecycle?.sendAdminToClient(card,'Client 전달: 승인 검토 요청');
          adminAfterCardMutation('Client에게 전달되었습니다','ok');
        }
      } catch(error) {
        alert(error.message || '처리할 수 없는 상태입니다.');
      }
    };
  });
};

function resolveAdminActiveCard(cards, filtered){
  const params = routeParams();
  const routeCard = params.get('card');
  if (routeCard && cards.some(function(c){ return c.id === routeCard; })) _adminSelectedCardId = routeCard;
  if (!_adminSelectedCardId || !filtered.some(function(c){ return c.id === _adminSelectedCardId; })) {
    _adminSelectedCardId = (filtered[0] || cards[0] || {}).id || null;
  }
  const active = filtered.find(function(c){ return c.id === _adminSelectedCardId; })
    || cards.find(function(c){ return c.id === _adminSelectedCardId; })
    || filtered[0]
    || cards[0]
    || null;
  if (active) _adminSelectedCardId = active.id;
  return active;
}

function syncAdminCardSelect(select, optionsHtml, selectedValue){
  if (!select) return;
  select.innerHTML = optionsHtml;
  select.value = [...select.options].some(function(o){ return o.value === selectedValue; }) ? selectedValue : 'all';
}

function renderAdminCardControls(cards){
  setHtml('adminCardFilterPills', adminCardStatusFilters(cards).map(adminFilterPillHtml).join(''));
  const projectSel = document.getElementById('adminCardProjectFilter');
  const workerSel = document.getElementById('adminCardWorkerFilter');
  const chainSel = document.getElementById('adminCardChainFilter');
  syncAdminCardSelect(projectSel, adminSelectOptionsHtml('project', cards), _adminCardProjectFilter);
  syncAdminCardSelect(workerSel, adminSelectOptionsHtml('worker', cards), _adminCardWorkerFilter);
  syncAdminCardSelect(chainSel, adminSelectOptionsHtml('chain', cards), _adminCardChainFilter);
  return { projectSel: projectSel, workerSel: workerSel, chainSel: chainSel };
}

function renderAdminCardList(filtered){
  const count = document.getElementById('adminCardListCount');
  if (count) count.textContent = filtered.length + '\uAC74';
  const empty = window.ORDO_UI_COMPONENTS.EmptyState('\uC870\uAC74\uC5D0 \uB9DE\uB294 ModuleCard\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.', { variant: 'inline' });
  setHtml('adminCardList', filtered.map(function(c){
    return '<div class="p-3">' + adminCardListItemHtml(c, c.id === _adminSelectedCardId) + '</div>';
  }).join('') || empty);
}

function bindAdminCardFilterControls(selects){
  document.querySelectorAll('[data-admin-card-filter]').forEach(function(btn){
    btn.onclick = function(){
      _adminCardFilter = btn.getAttribute('data-admin-card-filter') || 'all';
      _adminSelectedCardId = null;
      renderAdminCards();
    };
  });
  if (selects.projectSel) selects.projectSel.onchange = function(){
    _adminCardProjectFilter = selects.projectSel.value || 'all';
    _adminSelectedCardId = null;
    renderAdminCards();
  };
  if (selects.workerSel) selects.workerSel.onchange = function(){
    _adminCardWorkerFilter = selects.workerSel.value || 'all';
    _adminSelectedCardId = null;
    renderAdminCards();
  };
  if (selects.chainSel) selects.chainSel.onchange = function(){
    _adminCardChainFilter = selects.chainSel.value || 'all';
    _adminSelectedCardId = null;
    renderAdminCards();
  };
}

function bindAdminCardListControls(){
  document.querySelectorAll('[data-admin-card-id]').forEach(function(btn){
    btn.onclick = function(){
      _adminSelectedCardId = btn.getAttribute('data-admin-card-id');
      renderAdminCards();
    };
  });
}

function bindAdminBulkCreateOpen(){
  const openBtn = document.getElementById('adminBulkCreateOpen');
  if (openBtn) openBtn.onclick = openAdminBulkCreate;
}

function renderAdminCards(){
  syncAdminCardRouteState();
  const cards = moduleCards();
  const filtered = adminFilterCards(cards);
  const active = resolveAdminActiveCard(cards, filtered);
  const selects = renderAdminCardControls(cards);

  renderAdminCardList(filtered);
  setHtml('adminCardDetail', adminCardDetailHtml(active));
  renderAdminGateBanner();
  bindAdminCardFilterControls(selects);
  bindAdminCardListControls();
  bindAdminBulkCreateOpen();
  if (active) bindAdminCardActions(active);
  if (window.refreshIcons) window.refreshIcons();
  else if (window.lucide) window.lucide.createIcons();
}
function renderAdminBulkCreate(){
  const C = window.ORDO_UI_COMPONENTS;
  setHtml('adminBulkModuleList', SAMPLE_MODULES.map(function(m, i){
    return C.CheckboxRow({
      attr: 'data-admin-bulk-module',
      value: i,
      checked: true,
      title: m.spec + ' · ' + m.module,
      subtitle: m.dial + ' · ' + (ORDO_CHAIN_LABELS[m.chain] || m.chain) + ' · ' + m.gateRef,
      trailing: 'MH: ' + m.mhEstimate
    });
  }).join(''));

  const worker = document.getElementById('adminBulkWorker');
  if (worker) worker.innerHTML = C.OptionList(
    Object.entries(ORDO_MODULE_PEOPLE)
      .filter(function(x){ return x[0] !== 'unassigned'; })
      .map(function(entry){ return { value: entry[0], label: entry[1].name }; }),
    { placeholder: 'Worker 선택 안 함' }
  );

  document.querySelectorAll('[data-admin-bulk-module]').forEach(function(input){ input.onchange = updateAdminBulkCount; });
  const toggleAll = document.getElementById('adminBulkToggleAll');
  if (toggleAll) toggleAll.onclick = function(){
    const boxes = [...document.querySelectorAll('[data-admin-bulk-module]')];
    const shouldCheck = boxes.some(function(box){ return !box.checked; });
    boxes.forEach(function(box){ box.checked = shouldCheck; });
    updateAdminBulkCount();
  };
  const submit = document.getElementById('adminBulkCreateSubmit');
  if (submit) submit.onclick = submitAdminBulkCreate;
  updateAdminBulkCount();
  if (window.refreshIcons) window.refreshIcons();
  else if (window.lucide) window.lucide.createIcons();
}
function updateAdminBulkCount(){const n=document.querySelectorAll('[data-admin-bulk-module]:checked').length;const btn=document.getElementById('adminBulkCreateSubmit');if(btn)btn.textContent='일괄 생성 ('+n+'건)';}
const _adminBulkSheet = window.ORDO_UI_COMPONENTS.SheetController('adminBulkCreateSheet');
function openAdminBulkCreate(){
  renderAdminBulkCreate();
  _adminBulkSheet.open();
  _adminBulkSheet.bindClose('[data-close-admin-bulk]', closeAdminBulkCreate);
}
function closeAdminBulkCreate(){
  _adminBulkSheet.close();
}
/* Legacy direct-mutation submitAdminBulkCreate (and its adminNextModuleCardId helper)
   removed in round 7 — lifecycle.createAdminCards is the only creation path. */
function submitAdminBulkCreate(){
  const selected = [...document.querySelectorAll('[data-admin-bulk-module]:checked')]
    .map(function(input){ return SAMPLE_MODULES[Number(input.getAttribute('data-admin-bulk-module'))]; })
    .filter(Boolean);
  if (!selected.length) {
    alert('생성할 Module을 선택하세요.');
    return;
  }

  const projectId = document.getElementById('adminBulkProject')?.value || 'proj-001';
  const worker = document.getElementById('adminBulkWorker')?.value || null;
  const due = document.getElementById('adminBulkDueDate')?.value || '';
  const created = window.ORDO_MODULE_CARD_LIFECYCLE.createAdminCards(selected, {
    projectId: projectId,
    assignedTo: worker || null,
    dueDate: due
  });

  closeAdminBulkCreate();
  _adminSelectedCardId = created[created.length - 1]?.id || _adminSelectedCardId;
  adminAfterCardMutation(created.length + '건의 ModuleCard가 생성되었습니다', 'ok');
}

function renderAdminCardsScreen(){renderAdminCards();}
function renderAdminTeamScreen(){renderAdminTeam();}
