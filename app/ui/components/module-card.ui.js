/* ============================================================
   [이 파일은] "모듈 카드 목록 아이템" 팩토리 — 목록에 보이는 카드 한 장의 HTML을 찍어냄.
                admin/worker/client 3개 화면이 이 하나의 팩토리를 공유합니다.
   [언제 실행] 카드 목록이 렌더될 때마다 (화면 전환·데이터 변경 시).
   [주요 등장인물]
     - ModuleCardListItem : 카드 객체 + 옵션 → 카드 한 줄 HTML
   [연결] ← admin/worker/client 화면의 목록 렌더 함수
          → status.ui.js(moduleTone·statusBadgeHtml·moduleDot), base.ui.js(escapeHtml)
          → workspace.data.js(ORDO_MODULE_PEOPLE), workspace.ui.js(moduleDays)
   [다음 읽을 파일] app/ui/components/detail.ui.js (카드 상세 패널 부품들)
   [수정할 때 주의] opts의 조합이 화면마다 다릅니다 (tag/dataAttr/selected 등).
                    클래스 목록은 Tailwind 빌드 안전을 위해 완전한 리터럴로 유지할 것.
   ============================================================ */

// 【팩토리】 모듈 카드 목록 아이템.
// 원래 4곳에 복사되어 있던 카드 렌더 코드를 하나로 통합한 것.
// opts로 화면별 차이를 흡수:
//   tone       — 색조 (기본값: moduleTone 자동 계산)
//   tag        — 'button'(목록) 또는 'article'(대시보드/타임라인)
//   interactive — article에 클릭 가능 속성 부여 (client 타임라인용)
//   dataAttr   — 카드 ID를 저장할 HTML 속성명 (예: 'data-admin-card-id')
//   selected   — 선택된 카드의 강조 스타일 적용 여부
//   metaParts  — 배지 아래 메타 라인 [spec, dial]
//   truncateFooterLeft — 하단 텍스트 말줄임 여부 (admin 목록용)

function ModuleCardListItem(card, opts){
  const o = opts || {};
  const esc = window.ORDO_UI_COMPONENTS.escapeHtml;
  const t = o.tone || moduleTone(card);
  const person = ORDO_MODULE_PEOPLE[card.assignedTo || 'unassigned'] || ORDO_MODULE_PEOPLE.unassigned;
  const qc = card.qcChecklist || [];
  const pass = qc.filter(function(x){ return x.passed; }).length;
  const d = moduleDays(card.dueDate);
  const due = d == null ? 'D-?' : (d < 0 ? 'D+' + Math.abs(d) : 'D-' + d);
  const meta = (o.metaParts || [card.spec, card.dial]).map(esc).join(' · ');
  const dataAttr = o.dataAttr ? ' ' + o.dataAttr + '="' + esc(card.id) + '"' : '';

  let open, close;
  if ((o.tag || 'button') === 'button') {
    const stateCls = o.selected ? 'border-brand-primary bg-bg-secondary' : 'border-bd-default bg-white';
    open = '<button type="button"' + dataAttr + ' class="w-full text-left ordo-c-module-card action-card group relative border ' + stateCls + ' rounded-xl pl-5 pr-4 py-4 hover:border-bd-emphasis shadow-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50">';
    close = '</button>';
  } else if (o.interactive) {
    open = '<article' + dataAttr + ' role="button" tabindex="0" class="ordo-c-module-card action-card group relative bg-white border border-bd-default rounded-xl pl-5 pr-4 py-4 hover:border-bd-emphasis shadow-subtle cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50">';
    close = '</article>';
  } else {
    open = '<article class="ordo-c-module-card action-card group relative bg-white border border-bd-default rounded-xl pl-5 pr-4 py-4 hover:border-bd-emphasis shadow-subtle">';
    close = '</article>';
  }

  const footerLeftOpen = o.truncateFooterLeft ? '<span class="truncate">' : '<span>';

  return open
    + '<span class="bar-l ' + moduleDot(t) + '"></span>'
    + '<div class="flex items-center gap-2 mb-1 flex-wrap">' + statusBadgeHtml(card.status, t) + '<span class="text-[12px] text-tx-tertiary truncate">' + meta + '</span></div>'
    + '<h3 class="text-[14px] text-tx-primary font-semibold leading-snug">' + esc(card.module) + '</h3>'
    + '<div class="flex items-center justify-between gap-2 mt-2 text-[12px] text-tx-secondary">' + footerLeftOpen + esc(person.name) + ' · MH ' + esc(card.mhActual) + '/' + esc(card.mhEstimate) + ' · ' + esc(due) + '</span><span class="text-tx-tertiary whitespace-nowrap">QC ' + pass + '/' + qc.length + ' · 📎' + ((card.attachments || []).length) + ' · 💬' + ((card.comments || []).length) + '</span></div>'
    + close;
}

window.ORDO_UI_COMPONENTS = Object.assign(window.ORDO_UI_COMPONENTS || {}, {
  ModuleCardListItem
});
