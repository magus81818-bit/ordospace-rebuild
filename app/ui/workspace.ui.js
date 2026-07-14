/* ============================================================
   [이 파일은] 워크스페이스(ModuleCard) 화면의 "렌더링 도우미" 모음.
                SLA 포맷, 카드 HTML 조립, 날짜 계산 등 화면 레이어가 공통으로 쓰는 함수 제공.
   [언제 실행] 페이지 로드 시 (index.html에서 components 뒤에 로드)
   [주요 등장인물]
     - formatSLA: 승인 기한을 "6/10 14:00 · 2d 남음" 형태로 포맷
     - moduleCard: 카드 1장의 HTML을 조립하는 레거시 팩토리 (components/module-card.ui.js 이전 버전)
     - moduleDays: 마감일까지 남은 일수 계산 (데모 기준일 2026-06-08 사용)
     - moduleTodayText: 데모용 "오늘" 날짜 반환
   [연결]
     ← app/screens/*.screen.js 에서 호출
     → app/ui/components/ (escapeHtml, MetricCard 등 위임)
   [다음 읽을 파일] app/ui/room.ui.js
   [수정할 때 주의] moduleTodayText()의 반환값이 데모 기준일 — 실제 운영 시 Date.now()로 교체 필요.
                    moduleCard()는 레거시 팩토리로, 새 화면은 ModuleCardListItem 사용 권장.
   ============================================================ */

/* WORKSPACE UI HELPERS */
function formatSLA(deadline){
  try {
    const d = (deadline instanceof Date) ? deadline : new Date(deadline);
    if (isNaN(d.getTime())) return String(deadline);
    const mo = d.getMonth()+1, dy = d.getDate();
    const hh = String(d.getHours()).padStart(2,'0'), mm = String(d.getMinutes()).padStart(2,'0');
    const diffMs = d.getTime() - Date.now();
    let remain;
    if (diffMs <= 0) {
      const over = Math.abs(diffMs);
      const hOver = Math.floor(over/36e5);
      remain = hOver >= 24 ? `${Math.floor(hOver/24)}d 초과` : `${hOver}h 초과`;
    } else {
      const h = Math.floor(diffMs/36e5), m = Math.floor((diffMs%36e5)/6e4);
      if (h >= 24) remain = `${Math.floor(h/24)}d 남음`;
      else remain = `${h}h ${m}m 남음`;
    }
    return `승인 기한 ${mo}/${dy} ${hh}:${mm} · ${remain}`;
  } catch(e){ return String(deadline); }
}

/* ================================================================
   [Route Reset] ModuleCard 기반 신규 라우트 렌더
   ================================================================ */

function moduleEsc(v){return window.ORDO_UI_COMPONENTS.escapeHtml(v);}
function moduleDays(d){if(!d)return null;const base=new Date(moduleTodayText()+'T00:00:00+09:00'),x=new Date(d+'T00:00:00+09:00');return Number.isNaN(x.getTime())?null:Math.ceil((x-base)/86400000);}
// Demo base date for due-date comparisons (D-day, overdue, "due today").
// Real timestamps (comments/logs) still use todayDateText()/nowDisplayText().
function moduleTodayText(){return '2026-06-08';}
/* moduleTone/moduleLabel/moduleToneClass/moduleDot moved to app/ui/components/status.ui.js (loaded earlier). */
function moduleMetric(label,value,sub,cls){return window.ORDO_UI_COMPONENTS.MetricCard(label,value,sub,cls);}
function moduleCard(c){const t=moduleTone(c),p=ORDO_MODULE_PEOPLE[c.assignedTo||'unassigned']||ORDO_MODULE_PEOPLE.unassigned,q=c.qcChecklist||[],pass=q.filter(x=>x.passed).length,d=moduleDays(c.dueDate),due=d==null?'D-?':(d<0?'D+'+Math.abs(d):'D-'+d);return '<article class="ordo-c-module-card action-card group relative bg-white border border-bd-default rounded-xl pl-5 pr-4 py-4 hover:border-bd-emphasis shadow-subtle"><span class="bar-l '+moduleDot(t)+'"></span><div class="flex items-center gap-2 mb-1 flex-wrap"><span class="ordo-c-status-badge inline-flex items-center gap-1.5 h-6 px-2 rounded-md border text-[11px] font-semibold '+moduleToneClass(t)+'"><span class="dot '+moduleDot(t)+'"></span>'+moduleEsc(moduleLabel(c.status))+'</span><span class="text-[12px] text-tx-tertiary truncate">'+moduleEsc(c.spec)+' · '+moduleEsc(c.dial)+'</span></div><h3 class="text-[14px] text-tx-primary font-semibold leading-snug">'+moduleEsc(c.module)+'</h3><div class="flex items-center justify-between gap-2 mt-2 text-[12px] text-tx-secondary"><span>'+moduleEsc(p.name)+' · MH '+moduleEsc(c.mhActual)+'/'+moduleEsc(c.mhEstimate)+' · '+moduleEsc(due)+'</span><span class="text-tx-tertiary whitespace-nowrap">QC '+pass+'/'+q.length+' · 📎'+((c.attachments||[]).length)+' · 💬'+((c.comments||[]).length)+'</span></div></article>';}
function moduleCards(){return Array.isArray(window.ORDO_MODULE_CARDS)?window.ORDO_MODULE_CARDS:[];}
function setHtml(id,html){const el=document.getElementById(id);if(el)el.innerHTML=html;}

/* Client workspace screen renderers moved to app/screens/client-workspace.screen.js */

/* WORKSPACE TOAST HELPER */
function ordoToast(msg, tone){
  const el = document.createElement('div');
  const bg = tone==='crit'?'#EF4444':(tone==='ok'?'#10B981':'#1F2937');
  el.style.cssText = `position:fixed;left:50%;bottom:100px;transform:translateX(-50%);background:${bg};color:#fff;padding:10px 16px;border-radius:10px;font-size:13px;font-weight:600;z-index:140;box-shadow:0 10px 25px rgba(0,0,0,0.2);max-width:90vw;`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(()=>{ el.style.transition='opacity .3s'; el.style.opacity='0'; setTimeout(()=>el.remove(),300); }, 2600);
}
window.ordoToast = ordoToast;
