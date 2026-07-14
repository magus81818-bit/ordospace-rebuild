/* ============================================================
   [이 파일은] 앱 전체의 "창고" — 시연용 샘플 데이터를 전역 변수에 적재합니다.
                화면(screens)이 그리는 모든 카드·프로젝트·사람·승인·작업 내역의 원천.
   [언제 실행] 페이지 로드 시 config·session 다음, lifecycle·components 이전에 실행.
   [주요 등장인물]
     - window.ORDO_MODULE_CARDS : 핵심 데이터 — ModuleCard 12장 (카드의 일생 챕터 04 참고)
     - ORDO_MODULE_PEOPLE      : 작업자 이름표 (worker-001 → 박개발)
     - REPORT_DATA / CHANGE_DATA : 클라이언트 승인함 화면의 데이터
     - DOC_DATA                : 문서함 화면의 데이터
     - INTAKE_DATA             : admin 의뢰 접수 큐 데이터
     - PROJECT_DATA            : admin 프로젝트 관리 데이터
     - PARTNER_DATA / WORKERS  : admin 인력 관리 데이터
     - WK_TASK_DATA / WK_SUB_DATA : worker 화면의 작업·제출 데이터
   [연결] ← 없음 (순수 데이터, 아무것도 호출하지 않음)
          → lifecycle 가 ORDO_MODULE_CARDS 를 읽고, 각 화면이 자기 역할의 데이터를 읽음
   [다음 읽을 파일] app/ui/components/base.ui.js (이 데이터를 화면에 그리는 부품 공장)
   [수정할 때 주의] ORDO_MODULE_CARDS 의 필드 구조를 바꾸면 lifecycle 서비스의
                     검증 로직과 서버(api/_schema)도 같이 바꿔야 합니다.
   ============================================================ */
// Keeps large mock datasets outside app/main.js while preserving the original
// global names used by the static prototype. This file must load before main.js.

/* ── 클라이언트 승인함 데이터: 승인 요청·주간 리포트·이슈·변경 요청 ── */
// 클라이언트 화면의 "승인함(approvals)" 탭에 표시되는 항목들.
// type: approval(승인 요청), report(주간 리포트), info(참고용 알림)
const REPORT_DATA = {
  '1': { type:'approval', subtype:'document',
    title:'요구사항 명세서 v2.1 — 결제 모듈', project:'(주)테크컴퍼스 ERP 개편',
    submitter:'이지원 PM', submittedAt:'2시간 전', deadline:'승인 기한 4/18 18:00 · 18h 남음 (긴급)',
    critical:true, prevVersion:'v2.0',
    changeSummary:'결제 게이트웨이 연동 구조를 단일 벤더 → 복수 벤더 라우팅 방식으로 변경',
    impact:{ schedule:'+3일', cost:'+15%', quality:'중립', deps:['재무 모듈 결제 연동','배송 모듈 환불 처리']},
    reason:'단일 벤더 장애 시 결제 중단 리스크를 제거하고, 벤더 협상력 확보를 위해 복수 라우팅 구조를 도입합니다.',
    linked:[{name:'요구사항 명세서 v2.0', meta:'승인됨 · 4월 10일'},{name:'PG 벤더 비교 분석 v0.3', meta:'초안 · 3일 전'}],
    history:[{date:'4월 10일', who:'김대표', result:'승인', target:'v2.0'},{date:'4월 5일', who:'김대표', result:'반려', target:'v1.3', comment:'세무 코드 체계 미반영'}]
  },
  '2': { type:'report', title:'Week 5 주간 리포트', project:'고객 포털 리뉴얼',
    submitter:'박준호 PM', submittedAt:'어제 발행', weekNo:5,
    goals:[{text:'IA 구조안 v3 확정', done:true},{text:'핵심 5개 화면 와이어프레임 완료', done:true},{text:'디자인 시스템 토큰 초안 리뷰', done:false}],
    completed:['IA 3depth 구조 확정','메인/검색/상세/마이/문의 와이어프레임 완료','레거시 데이터 이관 범위 정의'],
    progressing:[{name:'디자인 시스템 토큰 정의', pct:60},{name:'접근성 체크리스트 작성', pct:30}],
    risks:[{name:'모바일 비율 높은 일부 화면 레이아웃 전면 재검토 필요', level:'Medium', plan:'다음 주 초 UX 리뷰 세션 진행'}],
    nextWeek:['디자인 시안 v1 발행','고객 리뷰 세션 (4/24)','컴포넌트 라이브러리 구조 확정'],
    clientTodo:['디자인 방향 A/B 중 선호 방향 회신','모바일 우선 여부 재확인']
  },
  '3': { type:'approval', subtype:'change',
    title:'범위 확장 요청 — 결제 수단 추가', project:'물류 관리 시스템',
    submitter:'최유진 PM', submittedAt:'3일 전', deadline:'승인 기한 4/20 18:00 · 2d 남음',
    critical:false, prevVersion:'범위 정의서 v1.1',
    changeSummary:'거래처 결제 수단에 기업 간 외상 거래(B2B Net 30) 옵션을 추가합니다.',
    impact:{ schedule:'+5일', cost:'+22%', quality:'상향', deps:['정산 모듈','채권 리포트']},
    reason:'최근 영업팀 요청으로 주요 거래처 3곳이 Net 30 결제 조건을 요구하고 있으며, 이를 지원하지 못할 경우 계약 이탈 리스크가 있습니다.',
    linked:[{name:'범위 정의서 v1.1', meta:'승인됨'},{name:'영업팀 요청서', meta:'첨부'}],
    history:[{date:'4월 2일', who:'김대표', result:'승인', target:'범위 정의서 v1.1'}]
  },
  '4': { type:'approval', subtype:'document',
    title:'입고 프로세스 산출물 v1.2', project:'물류 관리 시스템',
    submitter:'최유진 PM', submittedAt:'어제 제출', deadline:'승인 기한 4/20 18:00 · 2d 남음',
    critical:false, prevVersion:'v1.1',
    changeSummary:'입고 검수 단계에 이중 확인 프로세스 추가 및 예외 처리 흐름 정교화',
    impact:{ schedule:'0일', cost:'0%', quality:'상향', deps:['재고 모듈']},
    reason:'입고 누락 이슈 재발 방지를 위해 검수자·감독자 이중 확인 단계를 추가했습니다.',
    linked:[{name:'입고 프로세스 산출물 v1.1', meta:'승인됨'}],
    history:[{date:'4월 8일', who:'김대표', result:'승인', target:'v1.1'}]
  },
  '5': { type:'info', title:'IA 구조안 v2 — 보류 중', project:'고객 포털 리뉴얼',
    body:'당신이 5일 전 보류 처리한 항목입니다. 박준호 PM이 추가 검토 후 v3로 재제출 예정.'},
  '6': { type:'report', title:'Week 3 주간 리포트', project:'(주)테크컴퍼스 ERP 개편',
    submitter:'이지원 PM', submittedAt:'2일 전 발행', weekNo:3,
    goals:[{text:'요구사항 명세서 v1.0 확정', done:true},{text:'PG 벤더 후보 3개 추림', done:true}],
    completed:['요구사항 워크숍 완료','재무/인사 모듈 범위 확정'],
    progressing:[{name:'결제 모듈 설계', pct:45}],
    risks:[], nextWeek:['결제 모듈 설계 완료','인사 DB 스키마 v1'], clientTodo:['세무 코드 체계 회신']
  },
  '7': { type:'info', title:'디자인 시안 v3 — 승인 완료', project:'고객 포털 리뉴얼', body:'어제 승인된 항목입니다.'},
  '8': { type:'approval', subtype:'schedule',
    title:'일정 연장 요청 — 결제 모듈 +3일', project:'(주)테크컴퍼스 ERP 개편',
    submitter:'이지원 PM', submittedAt:'오늘 제출', deadline:'승인 기한 4/18 10:00 · 12h 32m 남음',
    critical:true, prevVersion:'일정표 v3',
    changeSummary:'결제 모듈 설계 완료일을 4/21 → 4/24로 3일 연장합니다.',
    impact:{ schedule:'+3일', cost:'0%', quality:'중립', deps:['UAT 시작','통합테스트']},
    reason:'PG 벤더 B의 기술문서 회신 지연으로 인해 설계 검증 시간이 추가로 필요합니다.',
    linked:[{name:'일정표 v3', meta:'승인됨'}],
    history:[{date:'3월 28일', who:'김대표', result:'승인', target:'일정표 v3'}]
  }
};

/* ── 이슈/변경 요청 데이터 ── */
// 클라이언트 승인함의 "이슈·변경 요청" 탭에 표시.
// kind: 'issue'(버그/문제) 또는 'change'(범위·일정 변경 요청)
const CHANGE_DATA = {
  // 이슈
  'IS-0089': { kind:'issue', title:'로그인 시 간헐적 타임아웃 발생',
    status:'신규', statusTone:'pend', severity:'중요', severityTone:'crit',
    project:'(주)테크컴퍼스 ERP 개편', requester:'김대표', assignee:'이지원 PM', createdAt:'2시간 전',
    repro:'하루 10회 중 1~2회 로그인 직후 403 응답. 세션 만료 처리 흐름에서 발생.',
    impact:'일부 사용자 ERP 접근 불가. 재로그인 시 정상화.',
    attachments:[{name:'timeout-log.txt', size:'42KB'},{name:'screenshot.png', size:'128KB'}],
    comments:[
      {who:'이지원 PM', at:'1시간 전', body:'재현 시도 중입니다. 로그 확보 부탁드립니다.'},
      {who:'김대표', at:'2시간 전', body:'프로덕션에서 오늘 오전 2건 발생했습니다.'}
    ],
    history:[{at:'2시간 전', who:'김대표', text:'이슈 등록'}]
  },
  'IS-0087': { kind:'issue', title:'PDF 리포트 포맷 깨짐',
    status:'처리 중', statusTone:'warn', severity:'보통', severityTone:'rej',
    project:'고객 포털 리뉴얼', requester:'박준호 PM', assignee:'박준호 PM', createdAt:'3일 전',
    repro:'한글 폰트 미포함으로 페이지 하단 텍스트가 잘림.',
    impact:'주간 리포트 PDF 가독성 저하.',
    attachments:[{name:'broken.pdf', size:'1.1MB'}],
    comments:[{who:'박준호 PM', at:'어제', body:'폰트 임베딩 파이프라인 수정 중.'}],
    history:[{at:'어제', who:'박준호 PM', text:'처리 중으로 상태 변경'},{at:'3일 전', who:'박준호 PM', text:'이슈 등록'}]
  },
  'IS-0085': { kind:'issue', title:'메일 발송 지연',
    status:'해결', statusTone:'ok', severity:'낮음', severityTone:'rej',
    project:'물류 관리 시스템', requester:'최유진 PM', assignee:'최유진 PM', createdAt:'1주일 전',
    repro:'SMTP 큐가 5분 이상 적재되는 현상.',
    impact:'알림 메일 수신 지연 최대 10분.',
    attachments:[],
    comments:[{who:'최유진 PM', at:'3일 전', body:'SMTP 큐 워커 수 조정하여 해결.'}],
    history:[{at:'3일 전', who:'최유진 PM', text:'해결 처리'},{at:'1주일 전', who:'최유진 PM', text:'이슈 등록'}]
  },
  // 변경 요청
  'CH-0124': { kind:'change', title:'결제 수단 PayPal 추가 요청',
    status:'확인 필요', statusTone:'pend', severity:'중요', severityTone:'crit',
    project:'(주)테크컴퍼스 ERP 개편', requester:'이지원 PM', assignee:'김대표', createdAt:'어제',
    reason:'해외 거래처 요청으로 PayPal 결제 수단 추가.',
    proposal:'체크아웃 흐름에 PayPal 옵션을 추가하고 환불 케이스 대응 정책 수립.',
    impact:{ schedule:'+5일', cost:'+20%', quality:'중립', deps:['결제 모듈','정산 모듈','환불 정책'] },
    attachments:[{name:'paypal-spec.pdf', size:'640KB'}],
    comments:[{who:'이지원 PM', at:'어제', body:'영향 분석 완료. 김대표님 검토 부탁드립니다.'}],
    history:[{at:'어제', who:'이지원 PM', text:'확인 필요로 상태 변경'},{at:'2일 전', who:'이지원 PM', text:'변경 요청 등록'}]
  },
  'CH-0122': { kind:'change', title:'PM 대시보드 추가 그래프 요구',
    status:'영향 분석 중', statusTone:'warn', severity:'보통', severityTone:'rej',
    project:'고객 포털 리뉴얼', requester:'박준호 PM', assignee:'박준호 PM', createdAt:'2일 전',
    reason:'운영팀 KPI 가시성 개선 요청.',
              proposal:'PM 대시보드에 전환율·이탈률 그래프 2종 추가.',
    impact:{ schedule:'+2일', cost:'+5%', quality:'상향', deps:['대시보드 컴포넌트']},
    attachments:[],
    comments:[],
    history:[{at:'2일 전', who:'박준호 PM', text:'변경 요청 등록'}]
  },
  'CH-0120': { kind:'change', title:'사용자 역할 1개 추가 — "감사자" 역할',
    status:'승인', statusTone:'ok', severity:'낮음', severityTone:'rej',
    project:'물류 관리 시스템', requester:'최유진 PM', assignee:'김대표', createdAt:'5일 전',
    reason:'감사 대응을 위한 읽기 전용 역할 필요.',
    proposal:'감사자 역할을 추가하고 권한 매트릭스 업데이트.',
    impact:{ schedule:'+1일', cost:'0%', quality:'상향', deps:['권한 매트릭스']},
    attachments:[],
    comments:[{who:'김대표', at:'4일 전', body:'승인합니다.'}],
    history:[{at:'4일 전', who:'김대표', text:'승인으로 상태 변경'},{at:'5일 전', who:'최유진 PM', text:'변경 요청 등록'}]
  }
};

/* ── 문서함 데이터 ── */
// 클라이언트 프로젝트 화면의 문서 목록. 버전 이력과 연결 문서 포함.
const DOC_DATA = {
  '1': { name:'요구사항 명세서', ver:'v2.1', type:'PDF', cls:'ft-pdf',
    cat:'요구사항', project:'(주)테크컴퍼스 ERP 개편', size:'2.1MB',
    uploader:'이지원 PM', uploadedAt:'2일 전', milestone:'요구사항 정의',
    status:'승인됨', statusTone:'ok',
    versions:[
      {v:'v2.1', status:'승인됨', statusTone:'ok', by:'김대표', at:'2일 전', note:'결제 모듈 구조 반영 확인'},
      {v:'v2.0', status:'반려', statusTone:'crit', by:'김대표', at:'4일 전', note:'요구사항 2번 항목 보강 필요'},
      {v:'v1.2', status:'승인됨', statusTone:'ok', by:'김대표', at:'1주일 전', note:''},
      {v:'v1.0', status:'초안', statusTone:'rej', by:'이지원 PM', at:'2주일 전', note:''}
    ],
    linked:[
      {kind:'approval', name:'요구사항 명세서 v2.1 — 결제 모듈 승인', href:'#approvals'},
      {kind:'change', name:'#CH-0124 결제 수단 PayPal 추가', href:'#approvals?section=changes'}
    ]
  },
  '2': { name:'결제 모듈 설계도', ver:'v0.3', type:'FIG', cls:'ft-fig',
    cat:'디자인', project:'(주)테크컴퍼스 ERP 개편', size:'—',
    uploader:'이지원 PM', uploadedAt:'5시간 전', milestone:'결제 모듈 설계',
    status:'검토 중', statusTone:'warn',
    versions:[{v:'v0.3', status:'검토 중', statusTone:'warn', by:'이지원 PM', at:'5시간 전', note:'PG 3개 라우팅 반영'}],
    linked:[]
  },
  '3': { name:'Week 5 주간 리포트', ver:'v1.0', type:'PDF', cls:'ft-pdf',
    cat:'회의록', project:'고객 포털 리뉴얼', size:'1.2MB',
    uploader:'박준호 PM', uploadedAt:'어제', milestone:'디자인 단계',
    status:'완료', statusTone:'ok',
    versions:[{v:'v1.0', status:'완료', statusTone:'ok', by:'박준호 PM', at:'어제', note:''}],
    linked:[{kind:'report', name:'Week 5 주간 리포트', href:'#approvals'}]
  },
  '4': { name:'데이터 마이그레이션 계획', ver:'v0.5', type:'XLS', cls:'ft-xls',
    cat:'개발', project:'물류 관리 시스템', size:'420KB',
    uploader:'최유진 PM', uploadedAt:'1주일 전', milestone:'마이그레이션 준비',
    status:'반려됨', statusTone:'crit',
    versions:[
      {v:'v0.5', status:'반려됨', statusTone:'crit', by:'김대표', at:'1주일 전', note:'다운타임 계획 보완 필요'},
      {v:'v0.3', status:'초안', statusTone:'rej', by:'최유진 PM', at:'2주일 전', note:''}
    ],
    linked:[]
  },
  '5': { name:'킥오프 회의록', ver:'v1.0', type:'DOC', cls:'ft-doc',
    cat:'회의록', project:'(주)테크컴퍼스 ERP 개편', size:'180KB',
    uploader:'이지원 PM', uploadedAt:'2주일 전', milestone:'준비 단계',
    status:'승인됨', statusTone:'ok',
    versions:[{v:'v1.0', status:'승인됨', statusTone:'ok', by:'김대표', at:'2주일 전', note:''}],
    linked:[]
  },
  '6': { name:'UI 스타일 가이드', ver:'v1.3', type:'FIG', cls:'ft-fig',
    cat:'디자인', project:'고객 포털 리뉴얼', size:'—',
    uploader:'박준호 PM', uploadedAt:'3주일 전', milestone:'디자인 기준 수립',
    status:'승인됨', statusTone:'ok',
    versions:[{v:'v1.3', status:'승인됨', statusTone:'ok', by:'김대표', at:'3주일 전', note:''}],
    linked:[]
  }
};

/* ── admin 의뢰 접수 큐 ── */
// admin-home 화면의 "의뢰 접수함". 외부 클라이언트로부터 들어온 프로젝트 문의.
const INTAKE_DATA = [
  { id:'IN-2041', urgency:'crit', company:'(주)테크컴퍼스', title:'CRM 고도화 — 세일즈포스 연동',
    period:'3개월', budget:'1.5억', elapsed:'접수 3시간 경과', status:'신규',
    contact:'김대표 · ceo@techcompus.co.kr',
    summary:'기존 레거시 CRM에서 세일즈포스 라이선스로 이관. 데이터 마이그레이션 + 영업 BPM 재설계.',
    attachments:['요구사항 초안.pdf','ROI 분석.xlsx'],
    requirements:['기존 CRM 5년치 데이터 마이그레이션','영업팀 BPM 재설계','세일즈포스 권한 체계 수립','모바일 영업 앱 대응'] },
  { id:'IN-2040', urgency:'crit', company:'(주)블루로지', title:'WMS — 창고 3개 확장 프로젝트',
    period:'4개월', budget:'2.2억', elapsed:'접수 26시간 경과 (SLA 위반)', status:'신규',
    contact:'안상무 · ahn@bluelogi.kr',
    summary:'분당·오산·평택 창고 3개소 동시 WMS 도입. 실시간 재고 가시성 확보가 최대 목표.',
    attachments:['창고 Layout.pdf','현행 프로세스 분석.docx'],
    requirements:['창고 3개소 동시 구축','실시간 재고 가시성','본사 ERP와 2-way 연동','RF 스캐너 30대 연동'] },
  { id:'IN-2039', urgency:'warn', company:'(주)그린핀테크', title:'모바일 송금 앱 MVP',
    period:'5개월', budget:'3.0억', elapsed:'접수 1일 12시간 경과', status:'신규',
    contact:'정CTO · cto@greenfin.io',
    summary:'간편 송금 + 환전 기능의 MVP. 금융감독원 마이데이터 사업자 등록 완료.',
    attachments:['서비스 기획서 v0.8.pdf'],
    requirements:['iOS/Android 동시 런칭','FIDO 생체 인증','트랜잭션 감사 로그','7일 내 보안 감사 대응'] },
  { id:'IN-2038', urgency:'warn', company:'(주)휴먼센트릭', title:'HR 분석 대시보드',
    period:'2개월', budget:'0.8억', elapsed:'접수 2일 경과', status:'검토중',
    contact:'최이사 · choi@humancentric.com',
    summary:'HR 데이터 기반 이직 예측 + 조직 건강도 대시보드.',
    attachments:['요구사항서.pdf','샘플 데이터.xlsx'],
    requirements:['데이터 가명처리','Looker/Metabase 중 택1','월 단위 자동 집계','경영진 모바일 뷰'] },
  { id:'IN-2037', urgency:'ok', company:'(주)코어바이오', title:'임상시험 문서 관리 시스템',
    period:'6개월', budget:'4.5억', elapsed:'접수 3일 경과', status:'검토중',
    contact:'박본부장 · park@corebio.co',
    summary:'GxP 규제 준수 문서 관리 시스템. 21 CFR Part 11 준수 필요.',
    attachments:['규제 체크리스트.pdf','현행 시스템 분석서.pdf'],
    requirements:['21 CFR Part 11 준수','전자서명 기반 승인 워크플로','감사 추적 로그 10년 보관','검증(IQ/OQ/PQ) 문서 산출'] },
  { id:'IN-2036', urgency:'ok', company:'(주)이커머스탑', title:'상품 추천 엔진 고도화',
    period:'3개월', budget:'1.2억', elapsed:'접수 4일 경과', status:'견적발송',
    contact:'한팀장 · han@ectop.kr',
    summary:'기존 룰 기반 추천을 ML 기반으로 교체. 개인화 구매 전환율 +20% 목표.',
    attachments:['견적 요청서.pdf'],
    requirements:['실시간 추천 (<200ms)','A/B 테스트 프레임워크','Cold-start 대응','월 5천만 이벤트 처리'] }
];

/* ── admin 승인 큐 ── */
// admin-home 화면의 승인/SLA 추적. 관리자가 직접 처리해야 하는 승인 건들.
const ADM_APPR_DATA = [
  { id:'AP-0108', type:'SLA 위반', tone:'warn', client:'(주)테크컴퍼스', project:'ERP 개편',
    title:'요구사항 명세서 v2.1 — 결제 모듈 구조 변경', pm:'이지원 PM', submitted:'2시간 전 제출', wait:'3일 초과', sla:'72h' },
  { id:'AP-0107', type:'SLA 위반', tone:'warn', client:'(주)블루로지', project:'물류 관리 시스템',
    title:'범위 확장 요청 — 결제 수단 추가', pm:'최유진 PM', submitted:'3일 전 제출', wait:'2일 초과', sla:'48h' },
  { id:'AP-0106', type:'승인 대기', tone:'crit', client:'(주)테크컴퍼스', project:'ERP 개편',
    title:'일정 연장 요청 — 결제 모듈 +3일', pm:'이지원 PM', submitted:'오늘 제출', wait:'18h 남음' },
  { id:'AP-0105', type:'승인 대기', tone:'crit', client:'(주)코어바이오', project:'임상시험 관리',
    title:'산출물 승인 — GxP 문서 v1.2', pm:'김민재 PM', submitted:'어제 제출', wait:'30h 남음' },
  { id:'AP-0104', type:'리포트', tone:'pend', client:'(주)블루로지', project:'고객 포털 리뉴얼',
    title:'Week 5 주간 리포트', pm:'박준호 PM', submitted:'어제 발행', wait:'대기 없음' },
  { id:'AP-0103', type:'리포트', tone:'pend', client:'(주)그린핀테크', project:'송금 앱 MVP',
    title:'Week 3 주간 리포트', pm:'박준호 PM', submitted:'2일 전 발행', wait:'대기 없음' },
  { id:'AP-0102', type:'변경', tone:'warn', client:'(주)테크컴퍼스', project:'ERP 개편',
    title:'PG 벤더 추가 — KG이니시스 라우팅', pm:'이지원 PM', submitted:'4일 전 제출', wait:'24h 남음' }
];

/* ── admin 프로젝트 목록 ── */
// admin-projects 화면의 전체 프로젝트 파이프라인.
// stage: proposal(제안) → contract(계약) → execution(실행) → qa(검수) → closed(종료)
const PROJECT_DATA = [
  // 제안
  { id:'P-041', stage:'proposal', title:'(주)코어바이오 임상시험 DMS', client:'(주)코어바이오', pm:'정시윤', health:'ok', progress:5, next:'견적 검토 (4/22)', amount:'4.5억', updated:'2시간 전' },
  { id:'P-040', stage:'proposal', title:'(주)휴먼센트릭 HR 분석', client:'(주)휴먼센트릭', pm:'김민재', health:'ok', progress:10, next:'범위 확정 회의 (4/21)', amount:'0.8억', updated:'어제' },
  { id:'P-039', stage:'proposal', title:'(주)이커머스탑 추천 엔진', client:'(주)이커머스탑', pm:'박준호', health:'warn', progress:15, next:'견적 재제출 (4/23)', amount:'1.2억', updated:'3일 전' },
  // 계약
  { id:'P-038', stage:'contract', title:'(주)그린핀테크 송금 앱 MVP', client:'(주)그린핀테크', pm:'이지원', health:'ok', progress:25, next:'계약 서명 (4/25)', amount:'3.0억', updated:'어제' },
  { id:'P-037', stage:'contract', title:'(주)스마트팩토리 MES 연동', client:'(주)스마트팩토리', pm:'최유진', health:'warn', progress:20, next:'법무 검토 (4/24)', amount:'2.8억', updated:'2일 전' },
  // 실행 (8건 — 3건은 위험 포함)
  { id:'P-032', stage:'execution', title:'(주)테크컴퍼스 ERP 개편', client:'(주)테크컴퍼스', pm:'이지원', health:'crit', progress:62, next:'결제모듈 설계 완료 (4/24)', amount:'5.2억', updated:'30분 전' },
  { id:'P-031', stage:'execution', title:'고객 포털 리뉴얼', client:'(주)리테일킹', pm:'박준호', health:'crit', progress:38, next:'시안 재확정 (4/28)', amount:'1.8억', updated:'1시간 전' },
  { id:'P-030', stage:'execution', title:'(주)블루로지 물류 UAT', client:'(주)블루로지', pm:'최유진', health:'crit', progress:82, next:'UAT 재개 (4/22)', amount:'2.2억', updated:'오늘' },
  { id:'P-029', stage:'execution', title:'(주)알파뱅크 오픈뱅킹 연동', client:'(주)알파뱅크', pm:'김민재', health:'warn', progress:55, next:'API 계약 검토', amount:'3.5억', updated:'어제' },
  { id:'P-028', stage:'execution', title:'(주)헬스플러스 건강앱', client:'(주)헬스플러스', pm:'정시윤', health:'warn', progress:45, next:'1차 데모 (4/25)', amount:'1.5억', updated:'어제' },
  { id:'P-027', stage:'execution', title:'(주)에듀클래스 LMS', client:'(주)에듀클래스', pm:'박준호', health:'ok', progress:70, next:'QA 시작', amount:'1.1억', updated:'어제' },
  { id:'P-026', stage:'execution', title:'(주)푸드테크 주문 시스템', client:'(주)푸드테크', pm:'이지원', health:'ok', progress:60, next:'API 완성', amount:'0.9억', updated:'2일 전' },
  { id:'P-025', stage:'execution', title:'(주)리걸파트너 계약 자동화', client:'(주)리걸파트너', pm:'최유진', health:'ok', progress:50, next:'템플릿 엔진 PoC', amount:'1.4억', updated:'3일 전' },
  // 검수
  { id:'P-022', stage:'qa', title:'(주)트래블루 예약 시스템', client:'(주)트래블루', pm:'박준호', health:'ok', progress:92, next:'최종 인수 (4/26)', amount:'2.1억', updated:'어제' },
  { id:'P-021', stage:'qa', title:'(주)미디어캐스트 CMS', client:'(주)미디어캐스트', pm:'김민재', health:'ok', progress:95, next:'라이브 전환 (4/30)', amount:'1.3억', updated:'어제' },
  { id:'P-020', stage:'qa', title:'(주)서플라이맥스 SCM', client:'(주)서플라이맥스', pm:'최유진', health:'warn', progress:88, next:'버그 수정 재검토', amount:'3.2억', updated:'오늘' },
  // 종료
  { id:'P-015', stage:'closed', title:'(주)페이먼트허브 정산 개편', client:'(주)페이먼트허브', pm:'이지원', health:'ok', progress:100, next:'완료 (3/28)', amount:'4.0억', updated:'3주 전' },
  { id:'P-014', stage:'closed', title:'(주)콘텐츠렌즈 영상 플랫폼', client:'(주)콘텐츠렌즈', pm:'박준호', health:'ok', progress:100, next:'완료 (3/15)', amount:'2.5억', updated:'1개월 전' },
  { id:'P-013', stage:'closed', title:'(주)스마트시티 IoT 대시보드', client:'(주)스마트시티', pm:'정시윤', health:'ok', progress:100, next:'완료 (2/28)', amount:'1.7억', updated:'2개월 전' },
  { id:'P-012', stage:'closed', title:'(주)애드테크 DSP 플랫폼', client:'(주)애드테크', pm:'김민재', health:'ok', progress:100, next:'완료 (2/20)', amount:'2.3억', updated:'2개월 전' },
  { id:'P-011', stage:'closed', title:'(주)펫케어 앱 v2', client:'(주)펫케어', pm:'최유진', health:'ok', progress:100, next:'완료 (1/30)', amount:'0.8억', updated:'3개월 전' },
  { id:'P-010', stage:'closed', title:'(주)부동산테크 매물 검색', client:'(주)부동산테크', pm:'박준호', health:'ok', progress:100, next:'완료 (1/15)', amount:'1.2억', updated:'3개월 전' }
];

/* ── admin 파트너(작업자) 인력풀 ── */
// admin-team 화면의 파트너 목록. status: active/pending(심사 중)/leave(휴직)/blacklist
const PARTNER_DATA = [
  { id:'W-101', name:'박개발', initial:'박', role:'백엔드 개발자',     skills:['Node.js','PostgreSQL','AWS'],    util:90, status:'active',  rating:4.8, projects:12 },
  { id:'W-102', name:'김디자인', initial:'김', role:'UX/UI 디자이너',   skills:['Figma','Design System','UX Research'], util:75, status:'active',  rating:4.7, projects:18 },
  { id:'W-103', name:'이프론트', initial:'이', role:'프론트엔드 개발자', skills:['React','TypeScript','Next.js'], util:85, status:'active',  rating:4.9, projects:15 },
  { id:'W-104', name:'최큐에이', initial:'최', role:'QA 엔지니어',       skills:['Selenium','Cypress','Postman'],  util:60, status:'active',  rating:4.5, projects:20 },
  { id:'W-105', name:'정데브옵스', initial:'정', role:'DevOps 엔지니어', skills:['Kubernetes','Terraform','GitOps'], util:70, status:'active',  rating:4.6, projects:9 },
  { id:'W-106', name:'한풀스택', initial:'한', role:'풀스택 개발자',     skills:['Vue','Go','MongoDB'],          util:95, status:'active',  rating:4.7, projects:14 },
  { id:'W-107', name:'윤데이터', initial:'윤', role:'데이터 엔지니어',   skills:['Airflow','Spark','BigQuery'],   util:50, status:'active',  rating:4.4, projects:6 },
  { id:'W-108', name:'강모바일', initial:'강', role:'모바일 개발자',     skills:['iOS','Swift','Flutter'],        util:80, status:'active',  rating:4.8, projects:11 },
  { id:'W-201', name:'신입백엔드', initial:'신', role:'백엔드 개발자',   skills:['Java','Spring','MySQL'],        util:0,  status:'pending', rating:null, projects:0 },
  { id:'W-202', name:'김디자인주니어', initial:'김', role:'UX/UI 디자이너', skills:['Figma','프로토타이핑'],       util:0,  status:'pending', rating:null, projects:0 },
  { id:'W-203', name:'박QA경력', initial:'박', role:'QA 엔지니어',       skills:['Playwright','성능 테스트'],     util:0,  status:'pending', rating:null, projects:0 },
  { id:'W-301', name:'조휴직자', initial:'조', role:'프론트엔드 개발자', skills:['React','Vue'],                 util:0,  status:'leave',   rating:4.5, projects:8 },
  { id:'W-401', name:'노블랙', initial:'노', role:'백엔드 개발자',       skills:['Python'],                       util:0,  status:'blacklist', rating:2.1, projects:2 }
];

/* ── 작업자 명단 (간소 버전) ── */
// admin 히트맵 등에서 이름표로 사용하는 축약 데이터.
const WORKERS = [
  { id:'W-101', name:'박개발',   role:'BE',    initial:'박' },
  { id:'W-102', name:'김디자인', role:'UX/UI', initial:'김' },
  { id:'W-103', name:'이프론트', role:'FE',    initial:'이' },
  { id:'W-104', name:'최큐에이', role:'QA',    initial:'최' },
  { id:'W-105', name:'정데브옵스', role:'DevOps', initial:'정' },
  { id:'W-106', name:'한풀스택', role:'Full',  initial:'한' },
  { id:'W-107', name:'윤데이터', role:'Data',  initial:'윤' },
  { id:'W-108', name:'강모바일', role:'Mobile',initial:'강' }
];

/* ── 작업자 주간 히트맵 ── */
// admin-team 화면의 과배정 시각화. [시간, 프로젝트명] 쌍 × 5일(월~금).
const HEATMAP_DATA = [
  // 박개발 (백엔드) - 과배정
  [[8,'ERP'],   [9,'ERP'],   [10,'ERP'],  [9,'ERP'],   [8,'ERP']],     // 44h 경계
  // 김디자인
  [[7,'포털'], [6,'포털'], [8,'포털'], [0,''],      [6,'헬스앱']],     // 27h 적정
  // 이프론트 - 과배정
  [[9,'포털'], [10,'포털'],[10,'포털'],[9,'포털'],  [8,'포털']],      // 46h 과배정
  // 최큐에이 - 유휴 많음
  [[0,''],      [4,'MES'], [6,'MES'], [0,''],      [5,'물류']],      // 15h 적정 (유휴 2셀)
  // 정데브옵스
  [[6,'ERP'],  [8,'송금'], [7,'송금'], [6,'송금'],  [0,'']],           // 27h 적정 (유휴 1셀)
  // 한풀스택 - 과배정
  [[10,'물류'],[9,'물류'], [10,'물류'],[10,'물류'], [8,'물류']],      // 47h 과배정
  // 윤데이터 - 유휴 많음
  [[4,'LMS'], [0,''],       [3,'LMS'], [0,''],      [0,'']],           // 7h 적정 (유휴 3셀)
  // 강모바일
  [[7,'송금'], [8,'송금'], [9,'송금'], [8,'송금'],  [8,'송금']]       // 40h 적정
];

/* ── admin 감사 로그 타임라인 ── */
// admin-audit 화면의 시간순 활동 내역. 누가 무엇을 언제 바꿨는지.
const AUDIT_DATA = [
  { time:'방금 전',      actor:{initial:'이', name:'이대표',     role:'PM'},       action:'독촉',      icon:'megaphone',     tone:'pend',
    desc:'(주)테크컴퍼스 결재권자에게 독촉 메시지 발송',  target:'AP-0108',   targetLabel:'요구사항 명세서 v2.1', change:null },
  { time:'32분 전',      actor:{initial:'김', name:'김대표',     role:'클라이언트'}, action:'승인',     icon:'check-circle-2',tone:'ok',
    desc:'입고 프로세스 산출물 v1.2 승인',              target:'AP-0091',   targetLabel:'물류 관리 시스템',  change:{from:'검토 중',to:'승인 완료'} },
  { time:'1시간 전',     actor:{initial:'시', name:'시스템',     role:'자동'},     action:'상태 전환', icon:'refresh-cw',    tone:'pend',
    desc:'의뢰 IN-2040 SLA 24h 초과 · 긴급 플래그 자동 부여', target:'IN-2040', targetLabel:'(주)블루로지 WMS 확장', change:{from:'신규',to:'SLA 위반'} },
  { time:'2시간 전',     actor:{initial:'이', name:'이지원',     role:'PM'},       action:'제출',     icon:'upload',        tone:'pend',
    desc:'요구사항 명세서 v2.1 제출 (승인 요청)',        target:'DOC-2104',  targetLabel:'ERP 개편',         change:{from:'v2.0 승인',to:'v2.1 제출'} },
  { time:'3시간 전',     actor:{initial:'이', name:'이대표',     role:'PM'},       action:'PM 배정',  icon:'user-check',    tone:'ok',
    desc:'IN-2041 의뢰에 이지원 PM 배정 (가동률 고려)', target:'IN-2041',   targetLabel:'(주)테크컴퍼스 CRM 고도화', change:{from:'미배정',to:'이지원 PM'} },
  { time:'5시간 전',     actor:{initial:'시', name:'시스템',     role:'자동'},     action:'의뢰 접수', icon:'inbox',        tone:'pend',
    desc:'(주)테크컴퍼스 CRM 고도화 의뢰 접수',         target:'IN-2041',   targetLabel:'(주)테크컴퍼스', change:null },
  { time:'오늘 09:12',   actor:{initial:'박', name:'박준호',     role:'PM'},       action:'반려',     icon:'x-circle',      tone:'crit',
    desc:'디자인 시안 v2 반려 · 모바일 우선 기준 미충족', target:'AP-0089',   targetLabel:'고객 포털 리뉴얼', change:{from:'승인 대기',to:'반려'} },
  { time:'어제 18:45',   actor:{initial:'이', name:'이대표',     role:'PM'},       action:'견적 발송', icon:'send',          tone:'ok',
    desc:'(주)이커머스탑 추천 엔진 견적 송부',          target:'Q-2039',    targetLabel:'(주)이커머스탑',  change:null },
  { time:'어제 15:30',   actor:{initial:'이', name:'이대표',     role:'PM'},       action:'계약 체결', icon:'file-signature',tone:'ok',
    desc:'(주)그린핀테크 송금 앱 MVP 계약 체결 (3.0억)',  target:'C-2038',    targetLabel:'(주)그린핀테크',  change:{from:'계약 대기',to:'계약 체결'} },
  { time:'어제 11:00',   actor:{initial:'최', name:'최유진',     role:'PM'},       action:'상태 전환', icon:'refresh-cw',    tone:'warn',
    desc:'물류 UAT 건강도 "주의 → 위험" 전환 (테스트 환경 불안정)', target:'P-030', targetLabel:'(주)블루로지', change:{from:'주의',to:'위험'} },
  { time:'2일 전',       actor:{initial:'이', name:'이대표',     role:'PM'},       action:'권한 변경', icon:'shield',        tone:'warn',
    desc:'박개발 작업자의 물류 프로젝트 문서 접근 권한 부여', target:'W-101', targetLabel:'박개발 · 물류 PJ', change:{from:'읽기',to:'편집'} },
  { time:'3일 전',       actor:{initial:'노', name:'노블랙',     role:'작업자'},   action:'로그인',   icon:'log-in',        tone:'crit',
    desc:'블랙리스트 계정 로그인 시도 차단',              target:'W-401',    targetLabel:'노블랙',          change:null },
  { time:'4일 전',       actor:{initial:'김', name:'김대표',     role:'클라이언트'}, action:'승인',    icon:'check-circle-2',tone:'ok',
    desc:'범위 정의서 v1.1 승인',                        target:'AP-0083',   targetLabel:'물류 관리 시스템', change:{from:'승인 대기',to:'승인 완료'} },
  { time:'5일 전',       actor:{initial:'안', name:'안상무',     role:'클라이언트'}, action:'로그인', icon:'log-in',        tone:'pend',
    desc:'(주)블루로지 안상무 SSO 로그인',               target:'U-anshim',  targetLabel:'블루로지',        change:null }
];

/* ── worker 작업 목록 ── */
// worker-cards 화면의 "내 작업" 카드들. status: Todo/Doing/Review/Blocked/Done
const WK_TASK_DATA = [
  { id:'WT-301', priority:'crit', status:'Doing', project:'ERP 개편', title:'결제 모듈 API 스펙 v2.1 작성',
    due:'오늘 18:00', dueTag:'today', attachments:3,
    requirement:'PG 벤더 A/B/C 각각의 승인·실패·타임아웃 시나리오를 API 스펙으로 정의한다. 실패 시 자동 전환 정책 포함.',
    files:[{name:'PG 벤더 비교 v0.3.pdf', ft:'pdf'},{name:'API 스펙 템플릿.docx', ft:'doc'},{name:'시퀀스 다이어그램 초안.png', ft:'png'}],
    discussion:[
      {who:'이지원 PM', role:'PM', when:'오늘 10:14', msg:'실패 시 자동 전환 조건 명확히 부탁드립니다. 3초 타임아웃 기준 맞나요?'},
      {who:'나', role:'작업자', when:'오늘 11:02', msg:'3초 기준 맞고, 추가로 벤더별 retry 전략 포함했습니다.'}
    ] },
  { id:'WT-302', priority:'crit', status:'Review', project:'고객 포털', title:'IA 구조안 v3 보완',
    due:'오늘 20:00', dueTag:'today', attachments:2,
    requirement:'v2 반려 사유(모바일 비율 반영)를 반영해 3depth 구조 → 2depth로 단축.',
    files:[{name:'IA v2 피드백.pdf', ft:'pdf'},{name:'IA v3 초안.fig', ft:'fig'}],
    discussion:[{who:'박준호 PM', role:'PM', when:'어제 17:20', msg:'모바일 우선 정책으로 가겠습니다. depth 축소 확인 부탁드려요.'}] },
  { id:'WT-303', priority:'warn', status:'Todo', project:'물류 시스템', title:'입고 프로세스 테스트 케이스 작성',
    due:'오늘 23:59', dueTag:'today', attachments:1,
    requirement:'이중 확인 검수 로직에 대한 positive/negative/edge case 각 5건 이상.',
    files:[{name:'입고 프로세스 v1.2.docx', ft:'doc'}],
    discussion:[] },
  { id:'WT-304', priority:'normal', status:'Todo', project:'ERP 개편', title:'재무 모듈 ERD 초안',
    due:'4/21 18:00', dueTag:'week', attachments:0,
    requirement:'재무 모듈 엔티티 15개 기준 ERD 초안 작성.', files:[], discussion:[] },
  { id:'WT-305', priority:'normal', status:'Blocked', project:'고객 포털', title:'마이페이지 API 연동',
    due:'4/22 18:00', dueTag:'blocker', attachments:0,
    requirement:'백엔드 API 스펙 확정 대기. PM 통해 스펙 받은 뒤 착수.',
    files:[], discussion:[{who:'박준호 PM', role:'PM', when:'2일 전', msg:'백엔드 파트너 응답 지연 중입니다. 4/19까지 확정하겠습니다.'}] },
  { id:'WT-306', priority:'normal', status:'Blocked', project:'물류 시스템', title:'출고 화면 디자인 적용',
    due:'4/23 18:00', dueTag:'blocker', attachments:0,
    requirement:'디자이너 시안 수신 후 Figma → HTML 퍼블리싱.',
    files:[], discussion:[] },
  { id:'WT-307', priority:'normal', status:'Doing', project:'ERP 개편', title:'재고 모듈 유닛 테스트',
    due:'4/19 18:00', dueTag:'week', attachments:1, requirement:'유닛 테스트 커버리지 80% 목표.', files:[], discussion:[] },
  { id:'WT-201', priority:'normal', status:'Done', project:'ERP 개편', title:'요구사항 워크숍 정리',
    due:'4/10 완료', dueTag:'done', attachments:2, requirement:'(완료)', files:[], discussion:[] },
  { id:'WT-202', priority:'normal', status:'Done', project:'고객 포털', title:'IA 구조안 v1 작성',
    due:'4/08 완료', dueTag:'done', attachments:1, requirement:'(완료)', files:[], discussion:[] },
  { id:'WT-203', priority:'normal', status:'Done', project:'물류 시스템', title:'현행 시스템 분석',
    due:'4/05 완료', dueTag:'done', attachments:3, requirement:'(완료)', files:[], discussion:[] },
  { id:'WT-204', priority:'normal', status:'Done', project:'ERP 개편', title:'PG 벤더 후보 조사',
    due:'4/03 완료', dueTag:'done', attachments:2, requirement:'(완료)', files:[], discussion:[] },
  { id:'WT-205', priority:'normal', status:'Done', project:'고객 포털', title:'레거시 데이터 이관 범위 정의',
    due:'4/01 완료', dueTag:'done', attachments:1, requirement:'(완료)', files:[], discussion:[] },
];

/* ── worker 산출물 제출 내역 ── */
// worker-cards 화면의 "제출함" 탭. status: submitting/reviewing/approved/rejected
const WK_SUB_DATA = [
  { id:'WS-501', status:'submitting', title:'재무 모듈 ERD v0.5', version:'v0.5', submittedAt:'오늘 09:12', remaining:'' ,
    files:['ERD v0.5.pdf','엔티티 정의.docx'], comment:'초안 검토 요청드립니다.',
    feedback:null, history:[{v:'v0.5', date:'오늘 09:12', who:'나', what:'최초 제출', state:'current'}] },
  { id:'WS-502', status:'submitting', title:'마이페이지 화면 설계 v1.0', version:'v1.0', submittedAt:'어제 17:40', remaining:'',
    files:['설계서 v1.0.pdf'], comment:'',
    feedback:null, history:[{v:'v1.0', date:'어제 17:40', who:'나', what:'최초 제출', state:'current'}] },
  { id:'WS-503', status:'reviewing', title:'결제 모듈 API 스펙 v2.0', version:'v2.0', submittedAt:'3시간 전', remaining:'검토 기한 18h 32m 남음',
    files:['API 스펙 v2.0.pdf'], comment:'PG 벤더 3곳 스펙 통합',
    feedback:null, history:[{v:'v2.0', date:'3시간 전', who:'나', what:'제출 (검토중)', state:'current'},{v:'v1.3', date:'2일 전', who:'나', what:'반려 → 수정', state:'done'}] },
  { id:'WS-504', status:'reviewing', title:'IA 구조안 v3 초안', version:'v3.0', submittedAt:'어제 11:00', remaining:'검토 기한 1d 6h 남음',
    files:['IA v3 초안.fig'], comment:'3depth → 2depth 단축',
    feedback:null, history:[{v:'v3.0', date:'어제', who:'나', what:'제출 (검토중)', state:'current'}] },
  { id:'WS-505', status:'reviewing', title:'입고 프로세스 TC 초안', version:'v0.3', submittedAt:'2일 전', remaining:'검토 기한 4h 남음',
    files:['TC 초안.xlsx'], comment:'negative case 5건 포함',
    feedback:null, history:[{v:'v0.3', date:'2일 전', who:'나', what:'제출 (검토중)', state:'current'}] },
  { id:'WS-506', status:'approved', title:'요구사항 워크숍 정리', version:'v1.2', submittedAt:'4/10 승인', remaining:'',
    files:['워크숍 노트.pdf'], comment:'',
    feedback:{by:'김대표', when:'4/10', msg:'좋습니다. 이대로 진행.'},
    history:[{v:'v1.2', date:'4/10', who:'김대표', what:'승인', state:'done'},{v:'v1.1', date:'4/09', who:'나', what:'재제출', state:'done'},{v:'v1.0', date:'4/07', who:'나', what:'최초 제출', state:'done'}] },
  { id:'WS-507', status:'rejected', title:'요구사항 명세서 v2.0 — 결제 모듈', version:'v2.0', submittedAt:'4/05 반려', remaining:'',
    files:['명세서 v2.0.pdf'], comment:'',
    feedback:{by:'김대표', when:'4/05', msg:'세무 코드 체계가 누락되었습니다. 해당 섹션 추가 후 재제출 바랍니다.'},
    history:[{v:'v2.0', date:'4/05', who:'김대표', what:'반려', state:'current'},{v:'v1.3', date:'4/02', who:'나', what:'최초 제출', state:'done'}] },
];

/* ── 역할 간 공유 저장소 (빈 배열로 초기화 — 나중에 lifecycle 이 채움) ── */
window.ORDO_INTAKES = window.ORDO_INTAKES || [];
window.ORDO_PROJECTS = window.ORDO_PROJECTS || [];
window.ORDO_SUBMISSIONS = window.ORDO_SUBMISSIONS || [];

/* ── 【핵심 데이터】 ModuleCard 12장 ── */
// 이 앱의 심장. 모든 역할(admin/worker/client)이 이 배열의 카드를 읽고 고칩니다.
// 카드 한 장의 필드 설명은 docs/CODE_GUIDE_02_데이터_사전.md 에 표로 정리되어 있습니다.
// lifecycle 서비스가 부팅 시 이 배열을 localStorage/서버 데이터로 덮어씁니다(hydrate).
window.ORDO_MODULE_CARDS = [
  {id:'mc-001',projectId:'proj-001',spec:'Auth',specCode:'dev.auth',dial:'인증 방식',module:'이메일+비밀번호',chain:'dev',step:3,gateRef:'Build Complete',status:'approved',assignedTo:'worker-001',assignedBy:'admin-001',mhEstimate:'32~40',mhActual:28,createdAt:'2026-06-01',startedAt:'2026-06-02',dueDate:'2026-06-05',completedAt:'2026-06-04',approvedAt:'2026-06-05',attachments:[{name:'auth-email.ts',url:'#',size:'16KB',date:'2026-06-04'}],comments:[{role:'admin',author:'이매니저',text:'비밀번호 8자 규칙 추가',date:'2026-06-03'}],qcChecklist:[{label:'회원가입 유효성',passed:true},{label:'JWT 발급/갱신',passed:true},{label:'비번 찾기 이메일',passed:true},{label:'이메일 인증 플로우',passed:true},{label:'에러 핸들링',passed:true}]},
  {id:'mc-002',projectId:'proj-001',spec:'Auth',specCode:'dev.auth',dial:'인증 방식',module:'소셜—Google',chain:'dev',step:3,gateRef:'Build Complete',status:'approved',assignedTo:'worker-001',assignedBy:'admin-001',mhEstimate:'8~12',mhActual:8,createdAt:'2026-06-01',startedAt:'2026-06-02',dueDate:'2026-06-04',completedAt:'2026-06-03',approvedAt:'2026-06-04',attachments:[],comments:[],qcChecklist:[{label:'OAuth 플로우',passed:true},{label:'토큰 갱신',passed:true},{label:'에러 핸들링',passed:true}]},
  {id:'mc-003',projectId:'proj-001',spec:'Auth',specCode:'dev.auth',dial:'인증 방식',module:'소셜—Kakao',chain:'dev',step:3,gateRef:'Build Complete',status:'approved',assignedTo:'worker-001',assignedBy:'admin-001',mhEstimate:'8~12',mhActual:7,createdAt:'2026-06-01',startedAt:'2026-06-03',dueDate:'2026-06-05',completedAt:'2026-06-04',approvedAt:'2026-06-05',attachments:[],comments:[],qcChecklist:[{label:'OAuth 플로우',passed:true},{label:'토큰 갱신',passed:true}]},
  {id:'mc-004',projectId:'proj-001',spec:'UI Design',specCode:'design.ui',dial:'비주얼 디자인',module:'커스텀 디자인',chain:'design',step:3,gateRef:'Design Lock',status:'done',assignedTo:'worker-002',assignedBy:'admin-001',mhEstimate:'80~140',mhActual:96,createdAt:'2026-06-01',startedAt:'2026-06-01',dueDate:'2026-06-08',completedAt:'2026-06-07',attachments:[{name:'main-ui-v2.fig',url:'#',size:'4.2MB',date:'2026-06-07'}],comments:[{role:'admin',author:'이매니저',text:'헤더 여백 조정 반영됨',date:'2026-06-07'}],qcChecklist:[{label:'전 페이지 시안',passed:true},{label:'반응형 확인',passed:true},{label:'디자인 토큰 적용',passed:true},{label:'접근성 대비',passed:false}]},
  {id:'mc-005',projectId:'proj-001',spec:'Data Schema',specCode:'dev.data',dial:'데이터 모델',module:'관계형',chain:'dev',step:3,gateRef:'Build Complete',status:'in_progress',assignedTo:'worker-001',assignedBy:'admin-001',mhEstimate:'기반',mhActual:12,createdAt:'2026-06-03',startedAt:'2026-06-04',dueDate:'2026-06-10',attachments:[],comments:[],qcChecklist:[{label:'ERD 작성',passed:true},{label:'마이그레이션',passed:false},{label:'시드 데이터',passed:false}]},
  {id:'mc-006',projectId:'proj-001',spec:'Frontend',specCode:'dev.frontend',dial:'렌더링 아키텍처',module:'SPA (React)',chain:'dev',step:3,gateRef:'Build Complete',status:'pending',assignedTo:'worker-003',assignedBy:'admin-001',mhEstimate:'기반',mhActual:0,createdAt:'2026-06-03',dueDate:'2026-06-15',attachments:[],comments:[],qcChecklist:[]},
  {id:'mc-007',projectId:'proj-001',spec:'Frontend',specCode:'dev.frontend',dial:'페이지/화면',module:'대시보드',chain:'dev',step:3,gateRef:'Build Complete',status:'pending',assignedTo:'worker-003',assignedBy:'admin-001',mhEstimate:'16~24',mhActual:0,createdAt:'2026-06-03',dueDate:'2026-06-18',attachments:[],comments:[],qcChecklist:[]},
  {id:'mc-008',projectId:'proj-001',spec:'Search',specCode:'dev.search',dial:'검색 기능',module:'키워드 검색',chain:'dev',step:3,gateRef:'Build Complete',status:'pending',assignedTo:null,assignedBy:'admin-001',mhEstimate:'8~12',mhActual:0,createdAt:'2026-06-03',dueDate:'2026-06-20',attachments:[],comments:[],qcChecklist:[]},
  {id:'mc-009',projectId:'proj-001',spec:'Brand',specCode:'design.brand',dial:'브랜드 가이드북',module:'풀 가이드북',chain:'design',step:3,gateRef:'Design Lock',status:'approved',assignedTo:'worker-002',assignedBy:'admin-001',mhEstimate:'32~48',mhActual:36,createdAt:'2026-06-01',startedAt:'2026-06-01',dueDate:'2026-06-05',completedAt:'2026-06-04',approvedAt:'2026-06-05',attachments:[{name:'brand-guide-v1.pdf',url:'#',size:'8.5MB',date:'2026-06-04'}],comments:[],qcChecklist:[{label:'로고 가이드',passed:true},{label:'컬러 시스템',passed:true},{label:'타이포 규칙',passed:true}]},
  {id:'mc-010',projectId:'proj-001',spec:'UX Design',specCode:'design.ux',dial:'정보 구조',module:'기본 사이트맵',chain:'design',step:3,gateRef:'Design Lock',status:'approved',assignedTo:'worker-002',assignedBy:'admin-001',mhEstimate:'8~12',mhActual:10,createdAt:'2026-06-01',startedAt:'2026-06-01',dueDate:'2026-06-03',completedAt:'2026-06-02',approvedAt:'2026-06-03',attachments:[{name:'sitemap-v1.pdf',url:'#',size:'1.2MB',date:'2026-06-02'}],comments:[],qcChecklist:[{label:'IA 구조',passed:true},{label:'네비게이션',passed:true}]},
  {id:'mc-011',projectId:'proj-001',spec:'Auth',specCode:'dev.auth',dial:'보안 강화',module:'TOTP 2FA',chain:'dev',step:3,gateRef:'Build Complete',status:'review',assignedTo:'worker-001',assignedBy:'admin-001',mhEstimate:'20~28',mhActual:22,createdAt:'2026-06-05',startedAt:'2026-06-05',dueDate:'2026-06-09',attachments:[{name:'2fa-setup.ts',url:'#',size:'8KB',date:'2026-06-08'}],comments:[{role:'worker',author:'박개발',text:'TOTP 구현 완료, 리뷰 부탁드립니다',date:'2026-06-08'}],qcChecklist:[{label:'코드 생성',passed:true},{label:'복구 코드',passed:true},{label:'만료 테스트',passed:false},{label:'다기기 테스트',passed:false},{label:'에러 핸들링',passed:false}]},
  {id:'mc-012',projectId:'proj-001',spec:'Infra',specCode:'ops.infra',dial:'CI/CD',module:'GitHub Actions',chain:'ops',step:3,gateRef:'Build Complete',status:'pending',assignedTo:null,assignedBy:'admin-001',mhEstimate:'8~16',mhActual:0,createdAt:'2026-06-03',dueDate:'2026-06-22',attachments:[],comments:[],qcChecklist:[]}
];

/* ── 작업자 이름표 (ModuleCard 전용) ── */
// 카드의 assignedTo 값('worker-001')을 화면에서 사람 이름으로 바꿀 때 사용.
const ORDO_MODULE_PEOPLE = {'worker-001':{name:'박개발',role:'Backend',load:'집중 투입',tone:'warn'},'worker-002':{name:'이디자인',role:'Design',load:'검수 대기',tone:'ok'},'worker-003':{name:'최프론트',role:'Frontend',load:'배정 예정',tone:'pend'},unassigned:{name:'미배정',role:'대기',load:'배정 필요',tone:'crit'}};

/* Worker weekly MH data */
const ORDO_WORKER_WEEKLY_MH = {'worker-001':{logged:28,target:40}};

/* ── 카드 일괄 생성 템플릿 ── */
// admin 의 "일괄 생성" 기능에서 선택 가능한 표준 카드 양식.
const SAMPLE_MODULES = [
  {spec:'Auth',specCode:'dev.auth',dial:'인증 방식',module:'이메일+비밀번호',chain:'dev',step:3,gateRef:'Build Complete',mhEstimate:'32~40',qcChecklist:[{label:'회원가입 유효성',passed:false},{label:'JWT 발급/갱신',passed:false},{label:'비번 찾기',passed:false},{label:'이메일 인증',passed:false},{label:'에러 핸들링',passed:false}]},
  {spec:'Auth',specCode:'dev.auth',dial:'인증 방식',module:'소셜—Google',chain:'dev',step:3,gateRef:'Build Complete',mhEstimate:'8~12',qcChecklist:[{label:'OAuth 플로우',passed:false},{label:'토큰 갱신',passed:false},{label:'에러 핸들링',passed:false}]},
  {spec:'Auth',specCode:'dev.auth',dial:'인증 방식',module:'소셜—Kakao',chain:'dev',step:3,gateRef:'Build Complete',mhEstimate:'8~12',qcChecklist:[{label:'OAuth 플로우',passed:false},{label:'토큰 갱신',passed:false}]},
  {spec:'UI Design',specCode:'design.ui',dial:'비주얼 디자인',module:'커스텀 디자인',chain:'design',step:3,gateRef:'Design Lock',mhEstimate:'80~140',qcChecklist:[{label:'전 페이지 시안',passed:false},{label:'반응형',passed:false},{label:'토큰 적용',passed:false},{label:'접근성 대비',passed:false}]},
  {spec:'Frontend',specCode:'dev.frontend',dial:'렌더링 아키텍처',module:'SPA (React)',chain:'dev',step:3,gateRef:'Build Complete',mhEstimate:'기반',qcChecklist:[]},
  {spec:'Frontend',specCode:'dev.frontend',dial:'페이지/화면',module:'대시보드',chain:'dev',step:3,gateRef:'Build Complete',mhEstimate:'16~24',qcChecklist:[]},
  {spec:'Data Schema',specCode:'dev.data',dial:'데이터 모델',module:'관계형',chain:'dev',step:3,gateRef:'Build Complete',mhEstimate:'기반',qcChecklist:[{label:'ERD',passed:false},{label:'마이그레이션',passed:false},{label:'시드 데이터',passed:false}]},
  {spec:'Search',specCode:'dev.search',dial:'검색 기능',module:'키워드 검색',chain:'dev',step:3,gateRef:'Build Complete',mhEstimate:'8~12',qcChecklist:[]},
  {spec:'Brand',specCode:'design.brand',dial:'브랜드 가이드북',module:'풀 가이드북',chain:'design',step:3,gateRef:'Design Lock',mhEstimate:'32~48',qcChecklist:[{label:'로고 가이드',passed:false},{label:'컬러 시스템',passed:false},{label:'타이포 규칙',passed:false}]},
  {spec:'Infra',specCode:'ops.infra',dial:'CI/CD',module:'GitHub Actions',chain:'ops',step:3,gateRef:'Build Complete',mhEstimate:'8~16',qcChecklist:[]}
];
