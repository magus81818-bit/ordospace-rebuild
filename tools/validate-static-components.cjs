/* ============================================================
   [이 파일은] 부품 공장(components)의 "품질 검사관" — 브라우저 없이 Node.js VM에서
                팩토리 35종의 안전성과 정확성을 자동 검증합니다.
   [언제 실행] npm run static:validate-components (코드 수정 후 반드시)
   [검증 항목]
     - 네임스페이스에 35종이 모두 등록되었는가
     - 19개 팩토리 출력에서 XSS 위험 문자가 이스케이프되었는가
     - 마커 클래스(ordo-c-status-badge, ordo-c-kpi-card 등)가 보존되었는가
     - 화면(screens)이 ModuleCard 마크업을 직접 생성하거나 card.status를 직접 변경하지 않는가
   [작동 원리] VM에서 components를 순서대로 로드 → XSS 페이로드로 팩토리 호출 →
                출력에 '<script>'가 남아있으면 실패.
   [수정할 때 주의] 팩토리를 추가/삭제하면 expected 배열과 XSS 테스트 케이스도 갱신.
   ============================================================ */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const repoRoot = path.resolve(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function createContext() {
  const context = { console, Date, JSON, Number, Object, String, Array, Math, window: {} };
  context.globalThis = context;
  context.window.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
  vm.createContext(context);
  vm.runInContext(read('app/data/workspace.data.js'), context, { filename: 'workspace.data.js' });
  [
    'app/ui/components/base.ui.js',
    'app/ui/components/status.ui.js',
    'app/ui/components/metric.ui.js',
    'app/ui/components/module-card.ui.js',
    'app/ui/components/detail.ui.js',
    'app/ui/components/form.ui.js',
    'app/ui/components/sheet.ui.js'
  ].forEach((file) => vm.runInContext(read(file), context, { filename: path.basename(file) }));
  // moduleDays/moduleTodayText live in workspace.ui.js (demo base date); extract just those.
  const wsSrc = read('app/ui/workspace.ui.js');
  vm.runInContext(wsSrc.match(/function moduleTodayText\(.*?\n/s)[0], context, { filename: 'moduleTodayText.js' });
  vm.runInContext(wsSrc.match(/function moduleDays\(.*?\n/s)[0], context, { filename: 'moduleDays.js' });
  return context;
}

const XSS = '<script>alert(1)</script>"&\'';

function expectEscaped(name, html) {
  assert(typeof html === 'string' && html.length > 0, name + ' should return html');
  assert(!html.includes('<script>'), name + ' must escape dynamic text (raw <script> leaked)');
  assert(html.includes('&lt;script&gt;'), name + ' must render the escaped payload');
}

function run() {
  const context = createContext();
  const checks = [];
  const C = context.window.ORDO_UI_COMPONENTS;
  assert(C, 'ORDO_UI_COMPONENTS namespace missing');

  const expected = [
    'escapeHtml', 'cx', 'fallbackText', 'safePct', 'todayDateText', 'nowDisplayText',
    'dateRank', 'displayDate', 'routeParams',
    'StatusBadge', 'PriorityBar', 'moduleTone', 'moduleLabel', 'moduleToneClass', 'moduleDot', 'statusBadgeHtml',
    'MetricCard', 'ProgressTrack', 'EmptyState', 'Notice', 'progressTrackHtml',
    'ModuleCardListItem',
    'DetailHeader', 'MetaGrid', 'QcList', 'WorkLogList', 'AttachmentList', 'AttachmentPreviewItem',
    'CommentList', 'DetailSection', 'ActionToolbar',
    'FormField', 'CheckboxRow', 'OptionList', 'SheetController'
  ];
  const missing = expected.filter((name) => typeof C[name] !== 'function' && typeof C[name] !== 'object');
  assert(missing.length === 0, 'namespace missing entries: ' + missing.join(', '));
  checks.push('namespace exposes ' + expected.length + ' entries');

  const xssCard = {
    id: 'mc-xss', projectId: 'proj-001', module: XSS, spec: XSS, dial: XSS, chain: 'design',
    status: 'pending', assignedTo: null, mhActual: XSS, mhEstimate: XSS, dueDate: '2026-06-09',
    gateRef: XSS, specCode: XSS, qcChecklist: [{ label: XSS, passed: false }],
    attachments: [{ name: XSS, url: XSS, date: XSS }],
    comments: [{ author: XSS, text: XSS, date: '2026-06-01' }],
    workLogs: [{ date: '2026-06-01', text: XSS }]
  };
  const run = vm.runInContext.bind(vm);
  const escCases = context.window.__escCases = {};
  vm.runInContext(`
    (function(){
      const C = window.ORDO_UI_COMPONENTS;
      const card = ${JSON.stringify(xssCard)};
      window.__escCases = {
        StatusBadge: C.StatusBadge(card.module, 'ok'),
        MetricCard: C.MetricCard(card.module, card.module, card.module),
        ProgressTrack: C.ProgressTrack(card.module, 1, 2, card.module),
        EmptyState: C.EmptyState(card.module),
        Notice: C.Notice(card.module, 'warn'),
        ModuleCardListItem: C.ModuleCardListItem(card, { dataAttr: 'data-x', metaParts: [card.spec, card.gateRef] }),
        DetailHeader: C.DetailHeader(card, { topText: card.specCode, subText: card.dial, badgeHtml: '' }),
        MetaGrid: C.MetaGrid([[card.module, card.module]]),
        QcList: C.QcList(card.qcChecklist),
        QcListEditable: C.QcList(card.qcChecklist, { editable: true }),
        WorkLogList: C.WorkLogList(card.workLogs),
        AttachmentList: C.AttachmentList(card.attachments),
        AttachmentPreview: C.AttachmentList(card.attachments, { preview: true }),
        CommentList: C.CommentList(card.comments),
        DetailSection: C.DetailSection(card.module, ''),
        ActionToolbar: C.ActionToolbar([{ attr: 'data-x', value: card.module, label: card.module, icon: 'send' }]),
        FormField: C.FormField(card.module, ''),
        CheckboxRow: C.CheckboxRow({ attr: 'data-x', value: card.module, checked: true, title: card.module, subtitle: card.module, trailing: card.module }),
        OptionList: C.OptionList([{ value: card.module, label: card.module }], { placeholder: card.module })
      };
    })()
  `, context);
  Object.entries(context.window.__escCases).forEach(([name, html]) => expectEscaped(name, html));
  checks.push('escaping verified for ' + Object.keys(context.window.__escCases).length + ' factory outputs');

  const markers = vm.runInContext(`
    (function(){
      const C = window.ORDO_UI_COMPONENTS;
      const card = window.ORDO_MODULE_CARDS[0];
      return {
        badge: C.StatusBadge('ok', 'ok'),
        metric: C.MetricCard('a', 'b', 'c'),
        progress: C.ProgressTrack('a', 1, 2),
        item: C.ModuleCardListItem(card, { dataAttr: 'data-x' }),
        emptyPanel: C.EmptyState('a'),
        emptyDetail: C.EmptyState('a', { variant: 'detail' }),
        toolbarWrap: C.ActionToolbar([], {}),
        toolbarStack: C.ActionToolbar([], { layout: 'stack' })
      };
    })()
  `, context);
  assert(markers.badge.includes('ordo-c-status-badge'), 'StatusBadge marker class missing');
  assert(markers.metric.includes('ordo-c-kpi-card'), 'MetricCard marker class missing');
  assert(markers.progress.includes('progress-track') && markers.progress.includes('progress-fill'), 'ProgressTrack classes missing');
  assert(markers.item.includes('ordo-c-module-card') && markers.item.includes('bar-l'), 'ModuleCardListItem marker classes missing');
  assert(markers.emptyPanel.includes('border-dashed'), 'EmptyState panel classes missing');
  assert(markers.emptyDetail.includes('min-h-[420px]'), 'EmptyState detail classes missing');
  assert(markers.toolbarWrap.includes('flex-wrap justify-end'), 'ActionToolbar wrap layout missing');
  assert(markers.toolbarStack.includes('flex-col sm:flex-row'), 'ActionToolbar stack layout missing');
  checks.push('marker classes preserved (badge/metric/progress/card/empty/toolbar)');

  // Screens must not emit ModuleCard markup themselves or mutate card.status directly.
  // (workspace.ui.js moduleCard is the documented remaining copy, pending the F2/F3 decision.)
  const screenFiles = [
    'app/screens/admin-workspace.screen.js',
    'app/screens/worker-workspace.screen.js',
    'app/screens/client-workspace.screen.js'
  ];
  screenFiles.forEach((file) => {
    const src = read(file);
    assert(!src.includes('ordo-c-module-card'), file + ' should not build ModuleCard markup inline');
    const directStatus = src.match(/\.status\s*=[^=]/g) || [];
    assert(directStatus.length === 0, file + ' should not mutate card.status directly: ' + directStatus.join(' | '));
  });
  checks.push('workspace screens: no inline ModuleCard markup, no direct status mutation');

  console.log(JSON.stringify({ ok: true, checked: checks }, null, 2));
}

run();
