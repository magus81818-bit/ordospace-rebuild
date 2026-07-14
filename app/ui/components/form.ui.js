/* ============================================================
   [이 파일은] 폼(입력 양식) 부품 — 라벨+입력칸, 체크박스 행, 드롭다운 옵션 목록을 찍어냄.
                admin 일괄 생성 시트에서 카드를 여러 장 한꺼번에 만들 때 사용.
   [언제 실행] 일괄 생성 시트가 열릴 때 모듈 선택 목록을 동적으로 생성.
   [주요 등장인물]
     - FormField     : 라벨 + 입력 컨트롤 HTML → 감싼 필드 블록
     - CheckboxRow   : 체크박스 + 제목 + 부제 + 후행 텍스트 → 선택 행
     - OptionList    : 아이템 배열 → <option> 태그 문자열
   [연결] ← admin-workspace.screen.js 의 일괄 생성 렌더
          → base.ui.js(escapeHtml)
   [다음 읽을 파일] app/ui/components/sheet.ui.js (시트/모달 열기·닫기 컨트롤러)
   [수정할 때 주의] ORDO_FORM_CONTROL_CLASSES 는 input/select 공용 스타일.
                    index.html의 정적 마크업과 일관성 유지 필요.
   ============================================================ */

// 【팩토리】 폼 필드: 라벨 텍스트 + 컨트롤 HTML → 감싼 블록.
// 컨트롤(input/select)의 HTML은 호출자가 직접 만들어 넘깁니다.
function FormField(label, controlHtml){
  const esc = window.ORDO_UI_COMPONENTS.escapeHtml;
  return '<label class="block"><span class="text-[12px] font-semibold text-tx-secondary">' + esc(label) + '</span>' + controlHtml + '</label>';
}

// input/select 공용 스타일 클래스. 일괄 생성 시트의 모든 입력칸이 이 스타일을 공유.
const ORDO_FORM_CONTROL_CLASSES = 'mt-1 h-10 w-full rounded-lg border border-bd-default bg-white px-3 text-[13px]';

// 【팩토리】 체크박스 행: 일괄 생성에서 모듈을 선택할 때 한 줄을 구성.
// opts: { attr(속성명), value(값), checked(체크 여부), title, subtitle, trailing(우측 텍스트) }
function CheckboxRow(opts){
  const o = opts || {};
  const esc = window.ORDO_UI_COMPONENTS.escapeHtml;
  return '<label class="flex items-center gap-3 px-4 py-3 hover:bg-bg-secondary">'
    + '<input type="checkbox" ' + o.attr + '="' + esc(o.value) + '" ' + (o.checked ? 'checked' : '') + ' class="w-4 h-4 rounded border-bd-default text-brand-primary">'
    + '<span class="min-w-0 flex-1">'
    + '<span class="block text-[13px] font-semibold text-tx-primary truncate">' + esc(o.title) + '</span>'
    + '<span class="block text-[11px] text-tx-tertiary">' + esc(o.subtitle) + '</span>'
    + '</span>'
    + '<span class="text-[12px] text-tx-secondary whitespace-nowrap">' + esc(o.trailing) + '</span>'
    + '</label>';
}

// 【팩토리】 옵션 목록: 드롭다운(select)의 <option> 태그들을 문자열로 생성.
// opts.placeholder: 선택 안 했을 때 보이는 안내 문구 (예: "담당자 선택").
function OptionList(items, opts){
  const o = opts || {};
  const esc = window.ORDO_UI_COMPONENTS.escapeHtml;
  const head = o.placeholder != null ? '<option value="">' + esc(o.placeholder) + '</option>' : '';
  return head + (items || []).map(function(it){
    return '<option value="' + esc(it.value) + '">' + esc(it.label) + '</option>';
  }).join('');
}

window.ORDO_UI_COMPONENTS = Object.assign(window.ORDO_UI_COMPONENTS || {}, {
  FormField,
  CheckboxRow,
  OptionList
});
