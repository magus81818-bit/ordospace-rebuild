/* ============================================================
   [이 파일은] 시트(모달) 열기/닫기 컨트롤러.
                index.html에 미리 숨겨둔 오버레이 패널(시트)을 열고 닫는 동작만 담당.
                시트의 HTML 껍데기는 index.html에 정적으로 존재하고,
                이 파일은 "문을 여닫는 손잡이" 역할만 합니다.
   [언제 실행] admin 화면에서 "일괄 생성" 버튼을 눌러 시트를 열 때.
   [주요 등장인물]
     - SheetController(id) : DOM id를 받아 { open, close, bindClose } 객체를 반환
   [연결] ← admin-workspace.screen.js (일괄 생성 시트 열기/닫기)
          → 없음 (순수 DOM 조작, 외부 팩토리 미사용)
   [다음 읽을 파일] app/ui/workspace.ui.js (카드 목록 전체를 조립하는 상위 함수)
   [수정할 때 주의] open/close는 hidden 클래스 + aria-hidden 속성을 동시에 토글.
                    접근성(스크린 리더)을 위해 aria-hidden을 빠뜨리면 안 됩니다.
   ============================================================ */

// 【팩토리】 시트 컨트롤러: DOM id를 받아 open/close/bindClose 메서드가 있는 객체 반환.
// open()  — hidden 제거 + aria-hidden="false" → 시트 표시
// close() — hidden 추가 + aria-hidden="true"  → 시트 숨김
// bindClose(selector, handler) — 닫기 버튼에 클릭 핸들러 연결
function SheetController(id){
  function el(){ return document.getElementById(id); }
  return {
    open: function(){
      const sheet = el();
      if (!sheet) return false;
      sheet.classList.remove('hidden');
      sheet.setAttribute('aria-hidden', 'false');
      return true;
    },
    close: function(){
      const sheet = el();
      if (!sheet) return false;
      sheet.classList.add('hidden');
      sheet.setAttribute('aria-hidden', 'true');
      return true;
    },
    bindClose: function(selector, handler){
      document.querySelectorAll(selector).forEach(function(btn){
        btn.onclick = handler;
      });
    }
  };
}

window.ORDO_UI_COMPONENTS = Object.assign(window.ORDO_UI_COMPONENTS || {}, {
  SheetController
});
