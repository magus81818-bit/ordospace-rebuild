/* ============================================================
   [이 파일은] 앱 전체가 공유하는 "설정표" — 역할·화면·메뉴·라벨의 목록.
                로직(동작)은 없고 상수(데이터)만 있습니다.
   [언제 실행] 페이지 로드 시 가장 먼저 (다른 모든 파일이 이 값을 읽으므로 1번 타자)
   [주요 등장인물]
     - ROLES / SCREENS   : 존재하는 역할 3개와 화면 19개의 공식 명단
     - AUTH_OFF          : 로그인 전에도 볼 수 있는 화면들 (사이드바 없이 표시)
     - ROLE_HOME         : 역할별 "내 홈"이 어느 화면인지
     - TITLES / CRUMBS   : 화면 제목과 브레드크럼(경로 표시) 문구
     - MENU / MTAB_MENU  : 사이드바와 모바일 하단 탭의 메뉴 구성
     - ROLE_CTA          : 상단바 큰 버튼(역할별 1개)의 내용
   [연결] ← 라우터·쉘·화면 전부가 이 상수들을 읽음 / → 없음 (아무것도 의존 안 함)
   [다음 읽을 파일] app/services/session.service.js (역할을 기억하는 장치)
   [수정할 때 주의] SCREENS 에 이름을 추가해도 index.html 에 같은 id 의
                     <section> 이 없으면 화면이 뜨지 않습니다. 둘은 세트입니다.
   ============================================================ */
/* ============== 역할 목록 ============== */
const ROLES = ['admin','client','worker'];

/* ============== 화면/라우팅 상수 ============== */
const SCREENS = [
  // 공용
  'landing','auth','terms','privacy','support','select-workspace','forbidden-403','components-gallery',
  // Client
  'dashboard','project','approvals','profile',
  // Worker
  'worker-home','worker-cards',
  // Admin
  'admin-home','admin-projects','admin-cards','admin-team','admin-audit'
];
const AUTH_OFF = new Set(['landing','auth','terms','privacy','support','select-workspace']); // 로그인 전 화면들 — 사이드바/상단바(쉘) 없이 표시
const ROLE_HOME = { admin: 'admin-home', client: 'dashboard', worker: 'worker-home' };

const TITLES = {
  'landing':'ORDOSPACE','auth':'로그인',
  'terms':'이용약관','privacy':'개인정보처리방침','support':'고객지원',
  'select-workspace':'역할 전환','forbidden-403':'접근 불가','components-gallery':'컴포넌트 갤러리',
  'dashboard':'홈','project':'프로젝트','approvals':'승인함','profile':'알림 · 마이',
  'worker-home':'작업자 홈','worker-cards':'내 작업',
  'admin-home':'PM 홈','admin-projects':'프로젝트 관리','admin-cards':'Module 관리',
  'admin-team':'인력','admin-audit':'감사 로그'
};
const CRUMBS = {
  'terms':'정책 › 이용약관','privacy':'정책 › 개인정보처리방침','support':'정책 › 고객지원',
  'dashboard':'홈','project':'프로젝트','approvals':'홈 › 승인함','profile':'마이페이지',
  'worker-home':'작업자 홈','worker-cards':'내 작업',
  'admin-home':'PM 홈','admin-projects':'프로젝트 관리','admin-cards':'Module 관리',
  'admin-team':'인력','admin-audit':'감사 로그'
};
const ROUTE_BREADCRUMBS = {
  dashboard:['홈'], project:['프로젝트'], approvals:['홈','승인함'], profile:['마이페이지'],
  'worker-home':['작업자 홈'], 'worker-cards':['내 작업'],
  'admin-home':['PM 홈'], 'admin-projects':['프로젝트 관리'], 'admin-cards':['Module 관리'],
  'admin-team':['인력'], 'admin-audit':['감사 로그']
};

/* ============== 사이드바 메뉴 정의 (role별) ============== */
// 주의: badge 의 숫자('3','2','5')는 하드코딩된 시연용 샘플입니다.
// 실제 카드 개수와 연동되지 않습니다 (연동은 후속 개선 항목 F6).
const MENU = {
  client: [
    { to:'dashboard',  icon:'home',          label:'홈' },
    { to:'project',    icon:'folder-kanban',  label:'프로젝트' },
    { to:'approvals',  icon:'check-circle',   label:'승인함', badge:{text:'3',tone:'warn'} },
    { to:'profile',    icon:'bell',           label:'알림', badge:{text:'2',tone:'pend'}, profileTab:'notif' },
  ],
  worker: [
    { to:'worker-home',  icon:'home',         label:'홈' },
    { to:'worker-cards', icon:'list-checks',  label:'내 작업', badge:{text:'2',tone:'crit'} },
    { to:'profile',      icon:'bell',         label:'알림', profileTab:'notif' },
  ],
  admin: [
    { to:'admin-home',     icon:'home',          label:'홈' },
    { to:'admin-projects', icon:'folder-kanban',  label:'프로젝트' },
    { to:'admin-cards',    icon:'layers',         label:'Module 관리', badge:{text:'5',tone:'warn'} },
    { to:'admin-team',     icon:'users',          label:'인력' },
    { to:'admin-audit',    icon:'scroll-text',    label:'감사 로그' },
  ],
};

const ROLE_PROFILE = {
  admin:  { initial:'이', name:'이대표', sub:'ORDO PM · 운영', roleLabel:'관리자' },
  client: { initial:'김', name:'김대표', sub:'대표이사 · 클라이언트', roleLabel:'클라이언트' },
  worker: { initial:'박', name:'박작업자', sub:'백엔드 파트너 · 작업자', roleLabel:'작업자' }
};

/* [v2.1.0 — T8] 모바일 하단 탭바 메뉴 (역할별 4~5 항목) */
const MTAB_MENU = {
  client: [
    { to:'dashboard',  icon:'home',          label:'홈' },
    { to:'project',    icon:'folder-kanban', label:'프로젝트' },
    { to:'approvals',  icon:'check-circle',  label:'승인함', badge:'3', badgeTone:'warn' },
    { to:'profile',    icon:'bell',          label:'알림', matchExtra:'profile-notif', profileTab:'notif' },
    { to:'profile',    icon:'menu',          label:'더보기', goMy:true, matchExtra:'profile-my', profileTab:'my' },
  ],
  worker: [
    { to:'worker-home',  icon:'home',        label:'홈' },
    { to:'worker-cards', icon:'list-checks', label:'내 작업', badge:'2', badgeTone:'crit' },
    { to:'profile',      icon:'bell',        label:'알림', matchExtra:'profile-notif', profileTab:'notif' },
    { to:'profile',      icon:'menu',        label:'더보기', goMy:true, matchExtra:'profile-my', profileTab:'my' },
  ],
  admin: [
    { to:'admin-home',     icon:'home',         label:'홈' },
    { to:'admin-cards',    icon:'layers',        label:'Module', badge:'5', badgeTone:'warn' },
    { to:'admin-projects', icon:'folder-kanban', label:'프로젝트' },
    { to:'profile',        icon:'bell',          label:'알림', matchExtra:'profile-notif', profileTab:'notif' },
    { to:'profile',        icon:'menu',          label:'더보기', goMy:true, matchExtra:'profile-my', profileTab:'my' },
  ],
};

/* [v2.1.0 — T8] 탑바 Primary CTA (역할별 1버튼) */
const ROLE_CTA = {
  admin:  { label:'Module 관리', icon:'layers', href:'#admin-cards', aria:'Module 관리 열기' },
  client: { label:'승인 검토',  icon:'file-check-2', href:'#approvals', aria:'승인함 열기' },
  worker: { label:'내 작업',   icon:'list-checks', href:'#worker-cards', aria:'내 작업 열기' }
};

/* [v2.1.0 — T8] 알림 샘플 — 역할별 4~5건 */
window.ORDO_NOTIFICATIONS = window.ORDO_NOTIFICATIONS || {
  admin: [
    { icon:'inbox',          title:'(주)헬로푸드 신규 의뢰 접수',       sub:'의뢰 접수함 · 12분 전',   category:'intake',       tone:'crit', unread:true },
    { icon:'alert-triangle', title:'결제 모듈 SLA 4h 초과 (에스컬)',  sub:'ERP 개편 · 30분 전',      category:'escalation',   tone:'crit', unread:true },
    { icon:'user-plus',      title:'파트너 온보딩 심사 대기 3건',       sub:'파트너 · 1시간 전',       category:'partner_onboarding', tone:'warn' },
    { icon:'file-signature', title:'계약 만료 14일 전 알림',            sub:'(주)블루로지 · 오늘',      category:'contract_expiry', tone:'warn' },
    { icon:'info',           title:'워크스페이스 정책이 업데이트되었습니다', sub:'시스템 · 1주일 전',  category:'system' }
  ],
  client: [
    { icon:'file-check-2',   title:'요구사항 명세서 v2.1 승인 요청',    sub:'ERP 개편 · 2시간 전',     category:'approval_request', tone:'pend', unread:true },
    { icon:'git-pull-request', title:'범위 확장 요청 영향 분석 완료',    sub:'물류 시스템 · 2일 전',    category:'change_request',   tone:'warn' },
    { icon:'file-text',      title:'Week 5 주간 리포트 발행',           sub:'고객 포털 · 어제',         category:'submission' },
    { icon:'alert-octagon',  title:'로그인 타임아웃 이슈 등록',          sub:'ERP 개편 · 3일 전',       category:'submission',       tone:'crit' },
    { icon:'info',           title:'워크스페이스 정책이 업데이트되었습니다', sub:'시스템 · 1주일 전', category:'system' }
  ],
  worker: [
    { icon:'user-check',     title:'결제 모듈 API 연동 작업 배정',       sub:'ERP 개편 · 오늘',         category:'assignment',   tone:'pend', unread:true },
    { icon:'message-square', title:'이지원 PM의 피드백 도착',           sub:'결제 API 설계서 · 1시간 전', category:'submission_feedback', tone:'warn' },
    { icon:'unlock',         title:'블로커 해제: 결제 API 명세 확정',   sub:'ERP 개편 · 어제',         category:'blocker_response', tone:'ok' },
    { icon:'file-text',      title:'반려: IA 구조안 v2 재작업 요청',    sub:'고객 포털 · 2일 전',      category:'submission_feedback', tone:'crit' },
    { icon:'info',           title:'워크스페이스 정책이 업데이트되었습니다', sub:'시스템 · 1주일 전', category:'system' }
  ]
};

