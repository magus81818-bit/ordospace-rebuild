/* ============================================================
   [이 파일은] 카드 상세 패널의 "부품 세트" — 헤더, 메타 격자, QC 리스트,
                작업 로그, 첨부파일, 코멘트, 섹션 래퍼, 액션 툴바를 찍어냄.
                admin/worker/client 3개 화면의 상세 패널이 이 부품들을 조합합니다.
   [언제 실행] 카드를 선택(클릭)해서 상세 패널이 열릴 때마다.
   [주요 등장인물]
     - DetailHeader      : 카드 제목 + 상태 배지 → 상단 헤더 HTML
     - MetaGrid          : [라벨, 값] 쌍 → 격자형 정보 카드들
     - QcList            : QC 체크리스트 → 체크/미체크 목록 (편집 가능 모드 포함)
     - WorkLogList       : 작업 기록 배열 → 시간순 로그 목록
     - AttachmentList    : 첨부 파일 배열 → 파일 목록 (미리보기 모드 포함)
     - CommentList       : 코멘트 배열 → 시간순 대화 목록
     - DetailSection     : 제목 + 본문 HTML → 테두리가 있는 섹션 박스
     - ActionToolbar     : 버튼 정의 배열 → 하단 액션 버튼 줄
   [연결] ← admin/worker/client 상세 패널 렌더 함수
          → base.ui.js(escapeHtml·displayDate·dateRank), status.ui.js(statusBadgeHtml)
   [다음 읽을 파일] app/ui/components/form.ui.js (폼 입력 부품)
   [수정할 때 주의] ORDO_ACTION_BUTTON_CLASSES는 Tailwind 빌드 대상 — 동적 조합 금지.
                    QcList의 editable 모드는 worker 화면 전용 (checkbox 이벤트 연결 필요).
   ============================================================ */

// 【팩토리】 상세 헤더: 카드 제목 + 상태 배지 + 부제를 한 줄 헤더로.
// opts.topText: 배지 위 작은 글씨, opts.subText: 제목 아래 설명, opts.badgeHtml: 커스텀 배지.
function DetailHeader(card, opts){
  const o = opts || {};
  const esc = window.ORDO_UI_COMPONENTS.escapeHtml;
  const badge = o.badgeHtml || statusBadgeHtml(card.status);
  const sub = o.subText ? '<p class="text-[13px] text-tx-secondary mt-2">' + esc(o.subText) + '</p>' : '';
  return '<div class="flex items-start justify-between gap-3"><div><p class="text-[11px] text-tx-tertiary">' + esc(o.topText || '') + '</p><h2 class="text-[20px] lg:text-[22px] font-semibold mt-1">' + esc(card.module) + '</h2>' + sub + '</div>' + badge + '</div>';
}

// 【팩토리】 메타 격자: [라벨, 값] 쌍 배열 → 2~3열 정보 타일.
// 카드 상세에서 "담당자 / MH / 마감일 / 스펙" 같은 요약 정보를 보여줌.
function MetaGrid(pairs, opts){
  const o = opts || {};
  const esc = window.ORDO_UI_COMPONENTS.escapeHtml;
  const wrapCls = o.margin === 'bottom'
    ? 'grid grid-cols-2 lg:grid-cols-3 gap-3 mb-5'
    : 'grid grid-cols-2 lg:grid-cols-3 gap-3 mt-5';
  const tiles = (pairs || []).map(function(pair){
    return '<div class="rounded-xl border border-bd-default bg-bg-secondary p-3"><dt class="text-[11px] text-tx-tertiary">' + esc(pair[0]) + '</dt><dd class="text-[13px] font-semibold mt-1">' + esc(pair[1]) + '</dd></div>';
  }).join('');
  return '<dl class="' + wrapCls + '">' + tiles + '</dl>';
}

// 【팩토리】 QC 체크리스트: 항목 배열 → 체크/미체크 표시 목록.
// opts.editable=true 이면 checkbox 입력 폼 (worker 화면), 아니면 읽기 전용 (admin/client).
function QcList(items, opts){
  const o = opts || {};
  const esc = window.ORDO_UI_COMPONENTS.escapeHtml;
  const list = Array.isArray(items) ? items : [];
  const empty = '<li class="py-2 text-[13px] text-tx-tertiary">' + esc(o.emptyText || '등록된 QC 체크리스트가 없습니다.') + '</li>';
  if (o.editable) {
    const attr = o.inputAttr || 'data-worker-qc-index';
    return list.map(function(item, i){
      return '<label class="flex items-center justify-between gap-3 py-2 text-[13px]"><span>' + esc(item.label) + '</span><input type="checkbox" ' + attr + '="' + i + '" ' + (item.passed ? 'checked' : '') + ' class="w-4 h-4 rounded border-bd-default text-brand-primary"></label>';
    }).join('') || '<div class="py-2 text-[13px] text-tx-tertiary">' + esc(o.emptyText || '등록된 QC 체크리스트가 없습니다.') + '</div>';
  }
  const checkedLabel = o.checkedLabel || '체크';
  return list.map(function(item){
    return '<li class="flex items-center justify-between gap-3 py-2 text-[13px]"><span>' + esc(item.label) + '</span><span class="text-[11px] font-semibold ' + (item.passed ? 'text-st-okfg' : 'text-st-critfg') + '">' + (item.passed ? checkedLabel : '미체크') + '</span></li>';
  }).join('') || empty;
}

// 【팩토리】 작업 로그 목록: 날짜+내용 배열 → 시간순 기록 리스트.
function WorkLogList(logs, opts){
  const o = opts || {};
  const esc = window.ORDO_UI_COMPONENTS.escapeHtml;
  const displayDate = window.ORDO_UI_COMPONENTS.displayDate;
  const list = Array.isArray(logs) ? logs : [];
  return list.map(function(log){
    const text = log.text || ((log.hours || 0) + 'h 기록');
    return '<li class="py-2 text-[13px]"><div class="text-[11px] text-tx-tertiary">' + esc(displayDate(log.date)) + '</div><div class="text-tx-secondary mt-0.5">' + esc(text) + '</div></li>';
  }).join('') || '<li class="py-2 text-[13px] text-tx-tertiary">' + esc(o.emptyText || '작업 기록이 없습니다.') + '</li>';
}

// 【팩토리】 첨부 파일 미리보기 아이템: 이미지면 인라인 표시, 아니면 다운로드 링크.
function AttachmentPreviewItem(file){
  const esc = window.ORDO_UI_COMPONENTS.escapeHtml;
  const name = file?.name || 'file';
  const url = file?.url || '#';
  const date = file?.date || '-';
  const isImage = /\.(png|jpe?g|webp|gif|svg)$/i.test(name) || /\.(png|jpe?g|webp|gif|svg)(\?|$)/i.test(url);
  if (isImage && url !== '#') return '<figure class="rounded-xl border border-bd-default overflow-hidden bg-bg-secondary"><img src="' + esc(url) + '" alt="' + esc(name) + '" class="w-full max-h-[240px] object-contain bg-white"><figcaption class="px-3 py-2 text-[12px] text-tx-secondary flex items-center justify-between gap-2"><span>' + esc(name) + '</span><span>' + esc(date) + '</span></figcaption></figure>';
  return '<a href="' + esc(url) + '" download class="flex items-center justify-between gap-3 rounded-lg border border-bd-default bg-bg-secondary px-3 py-2 text-[13px] hover:bg-white"><span>📎 ' + esc(name) + '</span><span class="text-[11px] text-tx-tertiary">' + esc(date) + ' · 다운로드</span></a>';
}

// 【팩토리】 첨부 파일 목록: 파일 배열 → 링크 리스트.
// opts.preview=true 이면 이미지 인라인 표시 모드 (client 승인 패널용).
function AttachmentList(files, opts){
  const o = opts || {};
  const esc = window.ORDO_UI_COMPONENTS.escapeHtml;
  const list = Array.isArray(files) ? files : [];
  if (o.preview) {
    return list.map(AttachmentPreviewItem).join('')
      || '<div class="rounded-lg border border-dashed border-bd-default bg-bg-secondary p-4 text-[13px] text-tx-tertiary">' + esc(o.emptyText || '등록된 산출물이 없습니다.') + '</div>';
  }
  return list.map(function(a){
    return '<a href="' + esc(a.url || '#') + '" class="flex items-center justify-between gap-3 py-2 text-[13px] hover:text-brand-primary"><span>📎 ' + esc(a.name) + '</span><span class="text-[11px] text-tx-tertiary">' + esc(a.date || '-') + '</span></a>';
  }).join('') || '<div class="py-2 text-[13px] text-tx-tertiary">' + esc(o.emptyText || '첨부 산출물이 없습니다.') + '</div>';
}

// 【팩토리】 코멘트 목록: 코멘트 배열 → 시간순 대화 스레드.
// 날짜 오름차순 정렬 (오래된 것 위, 최신 아래).
function CommentList(comments, opts){
  const o = opts || {};
  const esc = window.ORDO_UI_COMPONENTS.escapeHtml;
  const dateRank = window.ORDO_UI_COMPONENTS.dateRank;
  const displayDate = window.ORDO_UI_COMPONENTS.displayDate;
  const list = Array.isArray(comments) ? comments : [];
  return list.slice().sort(function(a, b){ return dateRank(a.date) - dateRank(b.date); }).map(function(cm){
    return '<article class="py-3"><div class="flex items-center justify-between gap-3 text-[11px] text-tx-tertiary"><span>' + esc(cm.author || cm.role || 'comment') + '</span><span>' + esc(displayDate(cm.date)) + '</span></div><p class="text-[13px] text-tx-secondary mt-1 leading-relaxed">' + esc(cm.text) + '</p></article>';
  }).join('') || '<div class="py-3 text-[13px] text-tx-tertiary">' + esc(o.emptyText || '코멘트가 없습니다.') + '</div>';
}

// 【팩토리】 섹션 래퍼: 제목 + 본문 HTML → 테두리·패딩이 있는 섹션 박스.
// opts.headerActionHtml: 제목 옆 버튼(예: "+추가"), opts.titleTag: h3/h4 선택.
function DetailSection(title, bodyHtml, opts){
  const o = opts || {};
  const esc = window.ORDO_UI_COMPONENTS.escapeHtml;
  // Margin variants match the existing screens: admin comment header uses mb-1,
  // worker action headers use mb-2; plain titles default to mb-2 (worker comments use mb-1).
  const headerRowCls = o.headerMargin === 'mb-2'
    ? 'flex items-center justify-between gap-3 mb-2'
    : 'flex items-center justify-between gap-3 mb-1';
  const titleCls = o.titleMargin === 'mb-1'
    ? 'text-[13px] font-semibold mb-1'
    : (o.titleMargin === 'mb-3' ? 'text-[13px] font-semibold mb-3' : 'text-[13px] font-semibold mb-2');
  const tag = o.titleTag || 'h3'; // client modal sections use h4
  const header = o.headerActionHtml
    ? '<div class="' + headerRowCls + '"><' + tag + ' class="text-[13px] font-semibold">' + esc(title) + '</' + tag + '>' + o.headerActionHtml + '</div>'
    : '<' + tag + ' class="' + titleCls + '">' + esc(title) + '</' + tag + '>';
  const sectionCls = o.className ? 'rounded-xl border border-bd-default p-4 ' + o.className : 'rounded-xl border border-bd-default p-4';
  return '<section class="' + sectionCls + '">' + header + bodyHtml + '</section>';
}

// 액션 버튼 스타일 맵. layout별(wrap/stack) × variant별(default/warn/primary) = 6종.
// Tailwind 빌드 안전을 위해 모든 조합을 리터럴로 정의.
const ORDO_ACTION_BUTTON_CLASSES = {
  wrap: {
    default: 'h-10 px-4 rounded-lg border border-bd-default hover:bg-bg-secondary text-[13px] font-semibold inline-flex items-center gap-1.5',
    warn: 'h-10 px-4 rounded-lg border border-st-warnbd bg-st-warnbg text-st-warnfg hover:bg-bg-secondary text-[13px] font-semibold inline-flex items-center gap-1.5',
    primary: 'h-10 px-4 rounded-lg bg-brand-primary text-white hover:bg-brand-hover text-[13px] font-semibold inline-flex items-center gap-1.5'
  },
  stack: {
    default: 'h-10 px-4 rounded-lg border border-bd-default hover:bg-bg-secondary text-[13px] font-semibold inline-flex items-center justify-center gap-1.5',
    warn: 'h-10 px-4 rounded-lg border border-st-warnbd bg-st-warnbg text-st-warnfg hover:bg-bg-secondary text-[13px] font-semibold inline-flex items-center justify-center gap-1.5',
    primary: 'h-10 px-4 rounded-lg bg-brand-primary hover:bg-brand-hover text-white text-[13px] font-semibold inline-flex items-center justify-center gap-1.5'
  }
};
const ORDO_ACTION_TOOLBAR_CLASSES = {
  wrap: 'mt-5 flex flex-wrap justify-end gap-2',
  stack: 'mt-5 flex flex-col sm:flex-row sm:justify-end gap-2'
};

// 【팩토리】 액션 툴바: 버튼 정의 배열 → 하단 버튼 줄.
// opts.layout: 'wrap'(admin — 한 줄에 감싸기) 또는 'stack'(worker/client — 세로→가로 반응형).
// 각 버튼: { label, variant('default'|'warn'|'primary'), icon, attr, value }
function ActionToolbar(buttons, opts){
  const o = opts || {};
  const esc = window.ORDO_UI_COMPONENTS.escapeHtml;
  const layout = o.layout === 'stack' ? 'stack' : 'wrap';
  const items = (buttons || []).map(function(btn){
    const cls = ORDO_ACTION_BUTTON_CLASSES[layout][btn.variant || 'default'] || ORDO_ACTION_BUTTON_CLASSES[layout].default;
    const attr = btn.attr ? ' ' + btn.attr + '="' + esc(btn.value) + '"' : '';
    const icon = btn.icon ? '<i data-lucide="' + esc(btn.icon) + '" class="w-4 h-4"></i>' : '';
    return '<button type="button"' + attr + ' class="' + cls + '">' + icon + esc(btn.label) + '</button>';
  }).join('');
  return '<div class="' + ORDO_ACTION_TOOLBAR_CLASSES[layout] + '">' + items + '</div>';
}

window.ORDO_UI_COMPONENTS = Object.assign(window.ORDO_UI_COMPONENTS || {}, {
  DetailHeader,
  MetaGrid,
  QcList,
  WorkLogList,
  AttachmentList,
  AttachmentPreviewItem,
  CommentList,
  DetailSection,
  ActionToolbar
});
