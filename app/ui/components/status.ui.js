/* ============================================================
   [이 파일은] 카드의 "색조(tone)" 규칙과 상태 배지를 만드는 팩토리.
                카드 상태(status)와 마감일(dueDate)을 보고 "어떤 색으로 표시할지" 결정합니다.
                색조는 5가지: crit(위험/빨강), warn(경고/노랑), pend(대기/파랑),
                ok(정상/초록), rej(비활성/회색).
   [언제 실행] 화면이 카드를 그릴 때마다 (매 렌더 시 moduleTone 호출).
   [주요 등장인물]
     - moduleTone      : 카드 → 색조 결정 (핵심 규칙)
     - moduleLabel     : status 코드 → 한국어 라벨 ('approved' → '승인완료')
     - StatusBadge     : 라벨+색조를 받아 뱃지 HTML 문자열을 찍어냄
     - PriorityBar     : 목록 왼쪽의 색 막대
   [연결] ← 모든 화면의 카드 렌더 함수 + ModuleCardListItem 팩토리
          → base.ui.js 의 escapeHtml, workspace.ui.js 의 moduleDays
   [다음 읽을 파일] app/ui/components/metric.ui.js (KPI 숫자와 진행률 바)
   [수정할 때 주의] 색조 판정 순서가 우선순위입니다 — crit 조건이 먼저 걸리면
                     아래 조건은 무시됨. 조건 순서를 바꾸면 UI 색이 달라집니다.
   ============================================================ */

// 카드의 색조를 결정하는 핵심 규칙:
//  ① revision/rejected 이거나 마감 초과 → crit(위험)
//  ② 마감 2일 이내 → warn(경고)
//  ③ review/in_progress → pend(진행 중)
//  ④ done/approved → ok(정상)
//  ⑤ 배정됨 → rej(비활성), 미배정 → crit(위험)
function moduleTone(c){const st=String(c?.status||''),d=moduleDays(c?.dueDate);if(/revision|rejected/.test(st)||(d!=null&&d<0&&!/done|approved/.test(st)))return'crit';if(d!=null&&d<=2&&!/done|approved/.test(st))return'warn';if(/review|in_progress/.test(st))return'pend';if(/done|approved/.test(st))return'ok';return c?.assignedTo?'rej':'crit';}
// 상태 코드 → 사람이 읽는 한국어 라벨 변환.
function moduleLabel(st){return({approved:'승인완료',done:'완료',in_progress:'진행중',pending:'대기',review:'검토중',revision:'수정요청'})[st]||st||'대기';}
// 색조 → Tailwind CSS 클래스 변환. 배지/카드 배경색을 결정.
function moduleToneClass(t){return({crit:'bg-st-critbg border-st-critbd text-st-critfg',warn:'bg-st-warnbg border-st-warnbd text-st-warnfg',pend:'bg-st-pendbg border-st-pendbd text-st-pendfg',ok:'bg-st-okbg border-st-okbd text-st-okfg',rej:'bg-st-rejbg border-st-rejbd text-st-rejfg'})[t]||'bg-bg-tertiary border-bd-default text-tx-secondary';}
// 색조 → 작은 동그라미(dot) 색 클래스. 배지 왼쪽의 색 점.
function moduleDot(t){return({crit:'bg-st-critfg',warn:'bg-st-warnfg',pend:'bg-st-pendfg',ok:'bg-st-okfg',rej:'bg-st-rejfg'})[t]||'bg-tx-tertiary';}

// 【팩토리】 상태 배지 HTML 생성. 라벨 텍스트 + 색 점 + 배경색.
// 예: StatusBadge('승인완료', 'ok') → 초록 배경의 배지 HTML 문자열
function StatusBadge(label, tone){
  return '<span class="ordo-c-status-badge inline-flex items-center gap-1.5 h-6 px-2 rounded-md border text-[11px] font-semibold ' + moduleToneClass(tone) + '"><span class="dot ' + moduleDot(tone) + '"></span>' + window.ORDO_UI_COMPONENTS.escapeHtml(label) + '</span>';
}

// 【팩토리】 목록 카드 왼쪽의 색 막대(priority bar). 긴급도를 시각적으로 표현.
function PriorityBar(tone){
  return '<span class="bar-l ' + moduleDot(tone) + '"></span>';
}

// Compat wrapper: keeps the existing statusBadgeHtml(status, tone) signature used by all screens.
function statusBadgeHtml(status, tone){
  return StatusBadge(moduleLabel(status), tone || moduleTone({ status: status }));
}

window.ORDO_UI_COMPONENTS = Object.assign(window.ORDO_UI_COMPONENTS || {}, {
  StatusBadge,
  PriorityBar,
  moduleTone,
  moduleLabel,
  moduleToneClass,
  moduleDot,
  statusBadgeHtml
});
