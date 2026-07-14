/* ============================================================
   [이 파일은] KPI 숫자·진행률 바·빈 상태 안내·알림 박스를 찍어내는 팩토리 모음.
                화면 상단의 "총 카드 12장 / 승인 4장" 같은 요약 카드가 이 파일에서 나옵니다.
   [언제 실행] 화면이 렌더될 때마다 필요한 팩토리를 호출.
   [주요 등장인물]
     - MetricCard     : 숫자+라벨+부제 → KPI 카드 HTML
     - ProgressTrack  : 라벨+승인수/전체수 → 진행률 바 HTML
     - EmptyState     : 메시지 → "비어 있음" 안내 HTML (5가지 변형)
     - Notice         : 메시지+색조 → 색깔 안내 박스 HTML
   [연결] ← admin/worker/client 화면 3개가 모두 사용
          → base.ui.js 의 escapeHtml·safePct, status.ui.js 의 moduleToneClass
   [다음 읽을 파일] app/ui/components/module-card.ui.js (카드 목록 아이템 팩토리)
   [수정할 때 주의] ORDO_EMPTY_STATE_VARIANTS 의 클래스 목록은 Tailwind 빌드가
                     스캔하는 대상입니다. 클래스를 조건부 조합하면 빌드에서 누락됩니다.
   ============================================================ */

// 【팩토리】 KPI 카드: 라벨("총 카드"), 값("12"), 부제("전체 모듈 수") → 카드 HTML.
function MetricCard(label, value, sub, cls){
  const esc = window.ORDO_UI_COMPONENTS.escapeHtml;
  return '<article class="bg-white border border-bd-default rounded-xl p-4 shadow-subtle ordo-c-kpi-card"><div class="text-[11px] text-tx-tertiary font-medium">' + esc(label) + '</div><div class="text-[24px] lg:text-[28px] font-semibold tabular mt-1 ' + (cls || '') + '">' + esc(value) + '</div><div class="text-[12px] text-tx-tertiary mt-1">' + esc(sub) + '</div></article>';
}

// 【팩토리】 진행률 바: 승인 수 / 전체 수를 퍼센트 바로 시각화.
function ProgressTrack(label, approved, total, caption){
  const esc = window.ORDO_UI_COMPONENTS.escapeHtml;
  const pct = window.ORDO_UI_COMPONENTS.safePct(approved, total);
  return '<div><div class="flex items-center justify-between gap-3 mb-1.5 text-[12px]"><span class="font-semibold text-tx-primary">' + esc(label) + '</span><span class="tabular text-tx-secondary">' + approved + '/' + total + ' · ' + pct + '%</span></div><div class="progress-track"><div class="progress-fill" style="width:' + pct + '%"></div></div>' + (caption ? '<p class="text-[11px] text-tx-tertiary mt-1.5">' + esc(caption) + '</p>' : '') + '</div>';
}

// 빈 상태 변형(variant) 5가지. 화면 맥락에 따라 다른 크기/스타일을 적용.
// 클래스 목록이 "완전한 리터럴"인 이유: Tailwind 가 파일을 스캔할 때 문자열 조합은
// 인식하지 못하기 때문. 조건부로 만들면 빌드에서 스타일이 빠집니다.
const ORDO_EMPTY_STATE_VARIANTS = {
  // dashed info panel (dashboard/home sections)
  panel: 'rounded-xl border border-dashed border-bd-default bg-bg-secondary p-5 text-[13px] text-tx-secondary',
  // plain centered list placeholder (list panes)
  inline: 'p-6 text-center text-[13px] text-tx-secondary',
  // full-height detail placeholder (worker/client detail panes)
  detail: 'h-full min-h-[420px] flex items-center justify-center rounded-xl border border-dashed border-bd-default bg-bg-secondary text-[13px] font-semibold text-tx-secondary',
  // full-height detail placeholder, admin cards detail pane
  'detail-lg': 'h-full min-h-[520px] flex items-center justify-center rounded-xl border border-dashed border-bd-default bg-bg-secondary text-[13px] font-semibold text-tx-secondary',
  // full-height detail placeholder with emphasised text (client approvals "all clear")
  'detail-emphasis': 'h-full min-h-[420px] flex items-center justify-center rounded-xl border border-dashed border-bd-default bg-bg-secondary text-[14px] font-semibold text-tx-secondary'
};

// 【팩토리】 빈 상태 안내: 목록이 비었을 때 사용자에게 보여줄 안내 문구.
// opts.variant: 'panel'(대시보드), 'inline'(목록), 'detail'(상세), 'detail-lg', 'detail-emphasis'
function EmptyState(message, opts){
  const o = opts || {};
  const esc = window.ORDO_UI_COMPONENTS.escapeHtml;
  const classes = ORDO_EMPTY_STATE_VARIANTS[o.variant] || ORDO_EMPTY_STATE_VARIANTS.panel;
  return '<div class="' + classes + (o.className ? ' ' + o.className : '') + '">' + esc(message) + '</div>';
}

// 【팩토리】 알림 박스: 색조 배경의 한 줄 안내 (예: PM 코멘트 강조).
// 화면 하단 토스트(ordoToast)와는 별개 — 이건 HTML에 삽입되는 정적 박스.
function Notice(message, tone){
  const esc = window.ORDO_UI_COMPONENTS.escapeHtml;
  return '<div class="rounded-lg border px-3 py-2 text-[12px] ' + moduleToneClass(tone) + '">' + esc(message) + '</div>';
}

// Compat wrapper: keeps the existing progressTrackHtml(label, approved, total, caption) global.
function progressTrackHtml(label, approved, total, caption){
  return ProgressTrack(label, approved, total, caption);
}

window.ORDO_UI_COMPONENTS = Object.assign(window.ORDO_UI_COMPONENTS || {}, {
  MetricCard,
  ProgressTrack,
  EmptyState,
  Notice,
  progressTrackHtml
});
