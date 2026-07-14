/* ============================================================
   [이 파일은] ModuleCard(작업 카드)의 상태 변경 규칙과 저장을 담당하는 "심판"
                카드 상태를 바꾸는 유일하게 허용된 통로입니다.
                화면(screens)은 카드를 직접 고치지 않고 반드시 이 파일의 함수를 부릅니다.
   [언제 실행] 페이지가 열릴 때 한 번 로드되어 저장된 카드를 되살리고(hydrate),
                이후에는 버튼을 누를 때마다 화면이 이 파일의 함수를 호출합니다.
   [주요 등장인물]
     - STATUSES           : 카드가 가질 수 있는 상태 목록 (대기→진행→검토→승인대기→승인)
     - submitWorkerReview : 작업자가 "리뷰 요청" 버튼을 눌렀을 때
     - sendAdminToClient  : 관리자가 "Client 전달" 버튼을 눌렀을 때
     - approveClient      : 클라이언트가 "승인" 버튼을 눌렀을 때
     - requestRevision    : 관리자/클라이언트가 "수정 요청" 버튼을 눌렀을 때
     - persist            : 바뀐 내용을 브라우저(localStorage)와 서버에 저장
     - hydrate / hydrateRemote : 저장된 카드를 앱 시작 시 되살리기 (로컬/서버)
   [연결] ← admin/worker/client 워크스페이스 화면 3개가 호출
          → localStorage 와 서버 API(/api/module-cards)에 저장
   [다음 읽을 파일] app/screens/worker-workspace.screen.js (이 규칙을 실제로 쓰는 화면)
   [수정할 때 주의] 상태 이름(pending, review...)을 바꾸면 서버 검증
                     (api/_lib/module-card-repository.cjs)도 같이 바꿔야 합니다.
   ============================================================ */
// 전체를 (function(){ ... })() 로 감싼 이유: 내부 변수들이 바깥 세상(전역)을
// 어지럽히지 않게 하는 "방음벽"입니다. 밖에서 쓸 것만 맨 아래에서 골라 내보냅니다.
(function(){
  /* ── 기본 설정: 저장 위치와 상태 이름표 ── */
  const STORAGE_KEY = 'ordospace.static.moduleCards.v1'; // 브라우저 저장 서랍(localStorage)의 열쇠 이름
  const REMOTE_API_PATH = '/api/module-cards';           // 서버 우체국 주소
  // 카드가 가질 수 있는 상태 목록. 이 목록에 없는 상태는 존재할 수 없습니다.
  const STATUSES = {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    REVIEW: 'review',
    CLIENT_REVIEW: 'done', // 주의: 저장되는 값은 'done'이지만 실제 의미는 "클라이언트 승인 대기"
    APPROVED: 'approved',
    REVISION: 'revision'
  };
  const VALID_STATUSES = Object.values(STATUSES);
  // 서버와의 통신 상태 게시판. "지금 저장 중인지, 마지막 저장이 언제였는지" 등을
  // 기록해 두고, 관심 있는 화면이 있으면 이벤트로 알려줍니다.
  const remoteState = {
    enabled: false,
    syncing: false,
    saving: false,
    pendingSave: false,
    lastError: '',
    lastStatus: 'local-cache',
    lastSyncedAt: '',
    lastSavedAt: ''
  };
  let remoteSaveTimer = 0;        // "0.4초 뒤 저장" 예약 타이머의 번호표
  let remoteSaveInFlight = false; // 지금 서버로 저장을 보내는 중인지 (중복 발송 방지)

  /* ── 작은 도우미들: 여러 곳에서 반복해서 쓰는 짧은 함수 ── */

  // 현재 카드 전체 목록. 원본은 전역 변수 window.ORDO_MODULE_CARDS 한 곳뿐입니다.
  function cards(){
    return Array.isArray(window.ORDO_MODULE_CARDS) ? window.ORDO_MODULE_CARDS : [];
  }

  // 깊은 복사: 원본과 완전히 분리된 사본을 만듭니다 (사본을 고쳐도 원본이 안 바뀜).
  function clone(value){
    return JSON.parse(JSON.stringify(value));
  }

  // 오늘 날짜를 '2026-07-03' 형식으로. 화면 쪽 공용 함수가 있으면 그것을 재사용합니다.
  function today(){
    if (typeof window.todayDateText === 'function') return window.todayDateText();
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  // 지금 시각을 '2026-07-03 14:05' 형식으로. 코멘트/기록의 타임스탬프에 사용.
  function nowText(){
    if (typeof window.nowDisplayText === 'function') return window.nowDisplayText();
    const d = new Date();
    return today() + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  // 사람 명단(작업자 이름표)과 프로젝트 정보. 데이터 파일이 아직 안 실렸어도
  // 앱이 죽지 않도록 빈 값으로 대비합니다.
  function modulePeople(){
    if (typeof ORDO_MODULE_PEOPLE !== 'undefined') return ORDO_MODULE_PEOPLE;
    return window.ORDO_MODULE_PEOPLE || {};
  }

  function projectMeta(){
    if (typeof ORDO_CLIENT_PROJECT_META !== 'undefined') return ORDO_CLIENT_PROJECT_META;
    return window.ORDO_CLIENT_PROJECT_META || {};
  }

  /* ── 정규화: 어디서 온 카드든 "안전한 모양"으로 다듬기 ── */

  // 카드 한 장을 검사해서 빠진 칸을 채웁니다. 예: 코멘트 목록이 없으면 빈 목록으로,
  // 모르는 상태값이면 '대기'로. 서버/저장소에서 온 데이터를 그대로 믿지 않기 위한 안전망.
  function normalizeCard(card){
    const next = Object.assign({}, card);
    if (!VALID_STATUSES.includes(next.status)) next.status = STATUSES.PENDING;
    next.attachments = Array.isArray(next.attachments) ? next.attachments : [];
    next.comments = Array.isArray(next.comments) ? next.comments : [];
    next.qcChecklist = Array.isArray(next.qcChecklist) ? next.qcChecklist : [];
    next.workLogs = Array.isArray(next.workLogs) ? next.workLogs : [];
    next.revisionCount = Number.isFinite(Number(next.revisionCount)) ? Number(next.revisionCount) : 0;
    return next;
  }

  // 카드 목록 전체를 다듬되, 한 장이라도 필수 정보(id/프로젝트/제목)가 없으면
  // 목록 전체를 불합격(null) 처리합니다 — 반쯤 깨진 데이터로 앱을 돌리지 않기 위해.
  function normalizeCards(list){
    if (!Array.isArray(list)) return null;
    const normalized = list.map(normalizeCard);
    return normalized.every(function(card){ return card && card.id && card.projectId && card.module; }) ? normalized : null;
  }

  /* ── 서버 통신 준비: 쓸 수 있는지 확인하고, 상태를 방송하기 ── */

  // 서버 저장을 시도해도 되는 환경인지 확인. 파일로 직접 열었거나(file:)
  // 테스트가 원격을 꺼둔 경우(ORDO_DISABLE_...)에는 로컬 저장만 사용합니다.
  function canUseRemote(){
    return Boolean(
      typeof window.fetch === 'function' &&
      window.location &&
      window.location.protocol !== 'file:' &&
      !window.ORDO_DISABLE_MODULE_CARD_REMOTE
    );
  }

  // "저장 상태가 바뀌었어요"를 창문 밖으로 방송(이벤트 발송)합니다.
  // 듣는 사람이 없어도 무해하고, 관심 있는 화면만 골라서 반응합니다.
  function publishRemoteState(eventName, extra){
    if (typeof window.dispatchEvent !== 'function' || typeof window.CustomEvent !== 'function') return;
    window.dispatchEvent(new CustomEvent(eventName, {
      detail: Object.assign({ apiPath: REMOTE_API_PATH }, remoteState, extra || {})
    }));
  }

  // 게시판(remoteState)에 새 내용을 덮어쓰고 곧바로 방송합니다.
  function setRemoteState(patch){
    Object.assign(remoteState, patch || {});
    publishRemoteState('ordo:module-cards-backend-state');
  }

  // 지금 서버 통신 상태를 한 뭉치로 돌려줍니다 (QA/디버깅용 조회 창구).
  function backendInfo(){
    return Object.assign({ apiPath: REMOTE_API_PATH, canUseRemote: canUseRemote() }, remoteState);
  }

  // 주소창의 해시(#admin-cards?...)에서 화면 이름만 뽑아냅니다.
  function currentRouteId(){
    return (window.location && window.location.hash ? window.location.hash : '#dashboard')
      .replace('#', '')
      .split('?')[0] || 'dashboard';
  }

  // 서버에서 새 카드를 받아온 뒤 "지금 보고 있는 화면"을 다시 그리게 합니다.
  // (다른 화면들은 나중에 들어갈 때 라우터가 알아서 다시 그림)
  function rerenderWorkspaceScreens(){
    if (typeof window.renderModuleRouteScreens === 'function') {
      window.renderModuleRouteScreens(currentRouteId());
    } else if (typeof renderModuleRouteScreens === 'function') {
      renderModuleRouteScreens(currentRouteId());
    }
  }

  /* ── 로컬 저장(localStorage): 새로고침을 버티는 1차 저장소 ── */

  // 브라우저 서랍에서 저장본을 꺼내 다듬어서 돌려줍니다. 없거나 깨졌으면 null.
  function readStoredCards(){
    try {
      const raw = window.localStorage && window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return normalizeCards(parsed && parsed.cards);
    } catch (error) {
      return null;
    }
  }

  // 앱 시작 시 카드 목록을 되살립니다. 우선순위: ① 브라우저 저장본 → ② 시드(샘플) 데이터.
  // (서버 저장본은 조금 뒤 hydrateRemote 가 따로 확인해서 도착하면 덮어씁니다)
  function hydrate(){
    const stored = readStoredCards();
    if (stored) window.ORDO_MODULE_CARDS = stored;
    else window.ORDO_MODULE_CARDS = normalizeCards(cards()) || cards();
  }

  // 다듬어진 카드 목록을 브라우저 서랍에 저장. 저장 시각도 함께 기록합니다.
  function persistLocal(normalized){
    try {
      window.localStorage && window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        version: 1,
        savedAt: new Date().toISOString(),
        cards: normalized
      }));
      return true;
    } catch (error) {
      return false;
    }
  }

  /* ── 서버 저장/불러오기: 새로고침을 넘어 다른 기기에서도 보이게 하는 2차 저장소 ── */

  // 서버 저장을 "예약"합니다. 즉시 보내지 않고 0.4초 기다리는 이유:
  // 사용자가 체크박스를 연달아 누를 때 매번 서버를 두드리지 않고 마지막 한 번만 보내기 위해.
  function scheduleRemoteSave(cardsSnapshot){
    if (!canUseRemote()) return;
    const normalized = normalizeCards(cardsSnapshot || cards()) || [];
    const snapshot = clone(normalized);
    if (remoteSaveTimer) window.clearTimeout(remoteSaveTimer);
    remoteSaveTimer = window.setTimeout(function(){
      remoteSaveTimer = 0;
      saveRemoteNow(snapshot);
    }, 400); // 0.4초 안에 또 변경되면 타이머가 리셋됨 (디바운스)
  }

  // 서버로 카드 "전체"를 지금 즉시 보냅니다 (PUT /api/module-cards).
  // 이미 발송 중이면 겹쳐 보내지 않고 "끝나면 한 번 더"라고 메모만 해둡니다(pendingSave).
  // 실패해도 앱은 멈추지 않습니다 — 로컬 저장이 이미 되어 있으므로.
  async function saveRemoteNow(cardsSnapshot){
    if (remoteSaveTimer) {
      window.clearTimeout(remoteSaveTimer);
      remoteSaveTimer = 0;
    }

    if (!canUseRemote()) {
      setRemoteState({ enabled: false, lastStatus: 'local-cache' });
      return { ok: false, skipped: true, reason: 'remote-unavailable' };
    }

    if (remoteSaveInFlight) {
      setRemoteState({ enabled: true, pendingSave: true });
      return { ok: false, skipped: true, reason: 'save-in-flight' };
    }

    const normalized = normalizeCards(cardsSnapshot || cards()) || [];
    remoteSaveInFlight = true;
    setRemoteState({ enabled: true, saving: true, lastError: '', lastStatus: 'saving' });

    try {
      const response = await window.fetch(REMOTE_API_PATH, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ cards: normalized })
      });
      const payload = await response.json().catch(function(){ return {}; });
      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || ('ModuleCard API save failed with ' + response.status));
      }
      setRemoteState({
        saving: false,
        lastError: '',
        lastStatus: 'saved',
        lastSavedAt: new Date().toISOString()
      });
      publishRemoteState('ordo:module-cards-saved', { saved: payload.saved || normalized.length });
      return { ok: true, saved: payload.saved || normalized.length };
    } catch (error) {
      setRemoteState({
        saving: false,
        lastError: error.message || 'ModuleCard API save failed.',
        lastStatus: 'save-failed'
      });
      return { ok: false, error: error };
    } finally {
      remoteSaveInFlight = false;
      if (remoteState.pendingSave) {
        setRemoteState({ pendingSave: false });
        scheduleRemoteSave(cards());
      }
    }
  }

  // 앱 시작 직후 서버에 "저장본 있나요?"라고 물어봅니다 (GET /api/module-cards).
  //  - 서버에 카드가 있으면: 그걸 정본으로 삼아 화면을 다시 그림
  //  - 서버가 비어 있고 내 쪽에 카드가 있으면: 내 카드를 올려서 서버를 채움(seeding)
  //  - 서버가 죽어 있으면: 로컬 저장만으로 계속 동작 (상태 게시판에 실패 기록)
  async function hydrateRemote(){
    if (!canUseRemote()) {
      setRemoteState({ enabled: false, lastStatus: 'local-cache' });
      return { ok: false, skipped: true, reason: 'remote-unavailable' };
    }

    setRemoteState({ enabled: true, syncing: true, lastError: '', lastStatus: 'loading' });

    try {
      const response = await window.fetch(REMOTE_API_PATH, {
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      });
      const payload = await response.json().catch(function(){ return {}; });
      if (!response.ok || !payload.ok) {
        const message = payload.message || ('ModuleCard API load failed with ' + response.status);
        setRemoteState({
          syncing: false,
          lastError: message,
          lastStatus: response.status === 503 ? 'needs-database' : 'load-failed'
        });
        return { ok: false, status: response.status, payload: payload };
      }

      const normalized = normalizeCards(payload.cards);
      if (!normalized) throw new Error('ModuleCard API returned invalid cards.');

      if (!normalized.length && cards().length) {
        setRemoteState({ syncing: false, lastStatus: 'seeding' });
        return saveRemoteNow(cards());
      }

      window.ORDO_MODULE_CARDS = normalized;
      persist({ remote: false });
      setRemoteState({
        syncing: false,
        lastError: '',
        lastStatus: 'synced',
        lastSyncedAt: new Date().toISOString()
      });
      rerenderWorkspaceScreens();
      publishRemoteState('ordo:module-cards-synced', { cards: normalized.length });
      return { ok: true, cards: normalized };
    } catch (error) {
      setRemoteState({
        syncing: false,
        lastError: error.message || 'ModuleCard API load failed.',
        lastStatus: 'load-failed'
      });
      return { ok: false, error: error };
    }
  }

  // 【가장 자주 불리는 함수】 "지금 상태를 저장해줘".
  // ① 로컬(localStorage)에는 항상 즉시 저장 ② 서버 저장은 0.4초 뒤로 예약.
  // 아래 모든 상태 변경 함수들이 마지막에 이 함수를 부릅니다.
  function persist(options){
    const normalized = normalizeCards(cards()) || [];
    const saved = persistLocal(normalized);
    if (!options || options.remote !== false) scheduleRemoteSave(normalized);
    return saved;
  }

  // 브라우저 저장본을 지웁니다 (다음 새로고침에서 시드 데이터부터 다시 시작). QA용.
  function reset(){
    try {
      window.localStorage && window.localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      return false;
    }
  }

  // 저장 서랍 상태 요약 (몇 장 저장돼 있는지 등). QA/디버깅용 조회 창구.
  function storageInfo(){
    const stored = readStoredCards();
    return {
      key: STORAGE_KEY,
      persistedCards: stored ? stored.length : 0,
      liveCards: cards().length,
      hasStorage: !!stored
    };
  }

  // 탭을 닫거나 다른 창으로 숨길 때 자동으로 한 번 더 저장 — "깜빡하고 안 눌러도" 안전하게.
  function bindAutoPersist(){
    if (window.__ordoModuleLifecycleAutoPersistBound) return;
    window.__ordoModuleLifecycleAutoPersistBound = true;
    if (typeof window.addEventListener === 'function') {
      window.addEventListener('pagehide', persist);
      window.addEventListener('beforeunload', persist);
    }
    if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
      document.addEventListener('visibilitychange', function(){
        if (document.visibilityState === 'hidden') persist();
      });
    }
  }

  /* ── 기록 남기기: 누가 언제 무엇을 했는지 자동으로 적어두기 ── */

  // 역할(admin/worker/client)을 사람 이름으로 바꿔줍니다. 기록에 "누가"를 적기 위해.
  function actorName(role, workerId){
    if (role === 'worker') {
      const person = modulePeople()[workerId];
      return (person && person.name) || 'Worker';
    }
    if (role === 'client') return 'Client';
    return projectMeta().pm || 'Admin';
  }

  // 대기/수정요청 상태의 카드에 손을 대는 순간 자동으로 '진행중'으로 올려줍니다.
  // (QC 체크·기록 추가가 곧 "일을 시작했다"는 뜻이므로)
  function ensureStarted(card){
    if ([STATUSES.PENDING, STATUSES.REVISION].includes(card.status)) {
      card.status = STATUSES.IN_PROGRESS;
      card.startedAt = card.startedAt || today();
    }
  }

  // 카드에 코멘트 한 줄 추가 (빈 내용이면 무시). 저장은 부르는 쪽 책임.
  function addComment(card, role, text, author){
    const body = String(text || '').trim();
    if (!body) return null;
    card.comments = Array.isArray(card.comments) ? card.comments : [];
    const comment = { role: role, author: author || actorName(role, card.assignedTo), text: body, date: nowText() };
    card.comments.push(comment);
    return comment;
  }

  // 상태에 어울리는 색상 등급(tone)을 고릅니다: 승인=초록, 수정요청=노랑, 나머지=파랑.
  function timelineTone(status){
    if (status === STATUSES.APPROVED) return 'ok';
    if (status === STATUSES.REVISION) return 'warn';
    if (status === STATUSES.CLIENT_REVIEW) return 'pend';
    return 'pend';
  }

  // 프로젝트 타임라인(클라이언트에게도 보이는 연대기)에 사건 한 줄을 추가합니다.
  function addTimeline(card, options){
    window.ORDO_TIMELINE_EVENTS = window.ORDO_TIMELINE_EVENTS || [];
    window.ORDO_TIMELINE_EVENTS.push({
      eventType: options.eventType,
      time: nowText(),
      occurredAt: new Date().toISOString(),
      actor: options.actor,
      visibility: options.visibility || 'internal',
      milestoneId: 'm3',
      target: card.id,
      title: options.title,
      summary: options.summary,
      tone: options.tone || timelineTone(card.status)
    });
  }

  // 감사 로그(관리자의 admin-audit 화면에 보이는 장부)에도 같은 사건을 남깁니다.
  function addAudit(card, options){
    if (typeof AUDIT_DATA === 'undefined' || !Array.isArray(AUDIT_DATA)) return;
    AUDIT_DATA.unshift({
      time: nowText(),
      actor: options.actorInfo || { initial: 'O', name: options.actor || 'ORDO', role: options.role || 'System' },
      action: options.action,
      icon: options.icon || 'activity',
      tone: options.tone || timelineTone(card.status),
      desc: options.desc,
      target: card.id,
      targetLabel: card.spec + ' / ' + card.module,
      change: options.change || null,
      auditAt: new Date().toISOString()
    });
  }

  // 상태 변경 한 건을 타임라인 + 감사 로그 두 군데에 한꺼번에 기록하는 묶음 함수.
  function recordStatusChange(card, fromStatus, toStatus, options){
    const actor = options.actor || actorName(options.role || 'admin', card.assignedTo);
    addTimeline(card, {
      eventType: options.eventType,
      actor: actor,
      visibility: options.visibility,
      title: options.title,
      summary: options.summary,
      tone: options.tone
    });
    addAudit(card, {
      actor: actor,
      actorInfo: options.actorInfo,
      role: options.role,
      action: options.eventType,
      icon: options.icon,
      tone: options.tone,
      desc: options.summary,
      change: { from: fromStatus, to: toStatus }
    });
  }

  /* ── 작업자(worker)의 행동과 규칙 ── */

  // QC 체크리스트가 "하나 이상 있고, 전부 체크됐는지" 확인. 리뷰 요청의 자격 조건.
  function qcComplete(card){
    const list = Array.isArray(card.qcChecklist) ? card.qcChecklist : [];
    return list.length > 0 && list.every(function(item){ return !!item.passed; });
  }

  // 이 작업자가 이 카드를 리뷰 요청할 수 있는가? (내 카드 + QC 완료 + 진행 가능한 상태)
  function canWorkerSubmit(card, workerId){
    return Boolean(card && card.assignedTo === workerId && qcComplete(card) && [STATUSES.IN_PROGRESS, STATUSES.REVISION, STATUSES.PENDING].includes(card.status));
  }

  // [버튼: worker 상세의 QC 체크박스] 체크 상태를 바꾸고 즉시 저장.
  function updateQc(card, index, passed){
    if (!card || !Array.isArray(card.qcChecklist) || !card.qcChecklist[index]) return false;
    ensureStarted(card);
    card.qcChecklist[index].passed = !!passed;
    persist();
    return true;
  }

  // [버튼: worker "작업 기록 추가"] 오늘 한 일을 한 줄 남기고 저장.
  function addWorkLog(card, text, workerId){
    if (!card) return null;
    ensureStarted(card);
    card.workLogs = Array.isArray(card.workLogs) ? card.workLogs : [];
    const log = { date: nowText(), text: String(text || '').trim(), actor: actorName('worker', workerId) };
    if (!log.text) return null;
    card.workLogs.push(log);
    persist();
    return log;
  }

  // [버튼: worker "파일 첨부"] 산출물 이름을 기록 (프로토타입이라 실제 업로드는 없음).
  function addAttachment(card, name){
    if (!card) return null;
    ensureStarted(card);
    card.attachments = Array.isArray(card.attachments) ? card.attachments : [];
    const attachment = { name: String(name || '').trim(), url: '#', size: '-', date: today() };
    if (!attachment.name) return null;
    card.attachments.push(attachment);
    persist();
    return attachment;
  }

  /* ── 상태 전이: 카드의 일생을 움직이는 핵심 규칙 ──
     그림으로 보면:  대기 ─(작업 시작)→ 진행중 ─(리뷰 요청)→ 검토중
                    ─(Client 전달)→ 승인대기 ─(승인)→ 승인완료
                    어느 단계에서든 (수정 요청)→ 수정요청 → 다시 진행중
     각 함수 첫 줄의 if 가 "자격 검사(가드)"입니다 — 조건이 안 맞으면
     에러를 던지고, 화면 쪽이 그 메시지를 alert 로 보여줍니다. ── */

  // [버튼: worker "리뷰 요청"] 검토중(review)으로 전환.
  // 가드: 내 카드 + QC 전부 체크 완료여야만 통과.
  function submitWorkerReview(card, workerId, note){
    if (!canWorkerSubmit(card, workerId)) throw new Error('QC checklist must be complete before review request.');
    const from = card.status;
    const author = actorName('worker', workerId);
    card.status = STATUSES.REVIEW;
    card.reviewRequestedAt = nowText();
    addComment(card, 'worker', note || 'Review requested for PM.', author);
    recordStatusChange(card, from, card.status, {
      role: 'worker',
      actor: author,
      actorInfo: { initial: author.slice(0, 1), name: author, role: 'Worker' },
      eventType: 'card.review_requested',
      icon: 'send',
      title: 'Review requested',
      summary: card.module + ' moved to PM review.',
      tone: 'pend'
    });
    persist();
    return card;
  }

  // 관리자가 클라이언트에게 넘길 수 있는 상태인가? (검토중일 때만)
  function canAdminSendToClient(card){
    return Boolean(card && card.status === STATUSES.REVIEW);
  }

  // [버튼: admin "Client 전달"] 승인대기(done)로 전환 + 클라이언트에게 알림을 꽂아줌.
  function sendAdminToClient(card, note){
    if (!canAdminSendToClient(card)) throw new Error('Only PM review cards can be sent to client approval.');
    const from = card.status;
    const actor = actorName('admin');
    card.status = STATUSES.CLIENT_REVIEW;
    card.completedAt = nowText();
    addComment(card, 'admin', note || 'Client review requested.', actor);
    window.ORDO_NOTIFICATIONS = window.ORDO_NOTIFICATIONS || {};
    window.ORDO_NOTIFICATIONS.client = window.ORDO_NOTIFICATIONS.client || [];
    window.ORDO_NOTIFICATIONS.client.unshift({
      icon: 'file-check-2',
      title: card.module + ' approval request',
      sub: card.spec + ' · just now',
      category: 'approval_request',
      tone: 'pend',
      unread: true
    });
    recordStatusChange(card, from, card.status, {
      role: 'PM',
      actor: actor,
      actorInfo: { initial: actor.slice(0, 1), name: actor, role: 'PM' },
      eventType: 'card.sent_to_client',
      icon: 'send',
      visibility: 'public',
      title: 'Sent to client',
      summary: card.module + ' moved to client approval.',
      tone: 'pend'
    });
    persist();
    return card;
  }

  // [버튼: admin/client "수정 요청"] 수정요청(revision)으로 전환 + 사유 코멘트 필수.
  // 가드: 클라이언트는 자기 승인대기 카드에만 수정 요청 가능. revisionCount 도 1 올림.
  function requestRevision(card, options){
    const note = String((options && options.note) || '').trim();
    if (!note) throw new Error('Revision note is required.');
    const role = (options && options.role) || 'admin';
    if (role === 'client' && card.status !== STATUSES.CLIENT_REVIEW) throw new Error('Only client review cards can receive client revision requests.');
    const from = card.status;
    const actor = actorName(role, card.assignedTo);
    card.status = STATUSES.REVISION;
    card.revisionCount = (Number(card.revisionCount) || 0) + 1;
    addComment(card, role, note, actor);
    recordStatusChange(card, from, card.status, {
      role: role === 'client' ? 'Client' : 'PM',
      actor: actor,
      actorInfo: { initial: actor.slice(0, 1), name: actor, role: role === 'client' ? 'Client' : 'PM' },
      eventType: 'card.revision_requested',
      icon: 'rotate-ccw',
      visibility: role === 'client' ? 'public' : 'internal',
      title: 'Revision requested',
      summary: card.module + ' revision requested.',
      tone: 'warn'
    });
    persist();
    return card;
  }

  // [버튼: client "승인"] 최종 상태인 승인완료(approved)로 전환.
  // 가드: 승인대기(done) 카드만 승인 가능 — 건너뛰기 방지.
  function approveClient(card, note){
    if (!card || card.status !== STATUSES.CLIENT_REVIEW) throw new Error('Only client review cards can be approved.');
    const from = card.status;
    const actor = actorName('client');
    card.status = STATUSES.APPROVED;
    card.approvedAt = nowText();
    if (note) addComment(card, 'client', note, actor);
    recordStatusChange(card, from, card.status, {
      role: 'Client',
      actor: actor,
      actorInfo: { initial: 'C', name: actor, role: 'Client' },
      eventType: 'card.approved',
      icon: 'check-circle-2',
      visibility: 'public',
      title: 'Approved',
      summary: card.module + ' approved by client.',
      tone: 'ok'
    });
    persist();
    return card;
  }

  // [버튼: 각 화면의 "+ 코멘트"] 상태 변경 없이 코멘트만 달고 저장.
  function addFreeComment(card, role, text, author){
    const comment = addComment(card, role, text, author || actorName(role, card && card.assignedTo));
    if (comment) persist();
    return comment;
  }

  // [버튼: admin "Worker 재할당"] 담당자를 바꾸고 감사 로그에 남김.
  function reassign(card, workerId){
    if (!card) return null;
    const from = card.assignedTo || 'unassigned';
    card.assignedTo = workerId || null;
    card.assignedBy = 'admin-001';
    if (card.assignedTo && card.status === STATUSES.PENDING) card.assignedAt = nowText();
    addAudit(card, {
      actor: actorName('admin'),
      role: 'PM',
      action: 'card.assigned',
      icon: 'user-check',
      tone: 'ok',
      desc: card.module + ' assignment changed.',
      change: { from: from, to: card.assignedTo || 'unassigned' }
    });
    persist();
    return card;
  }

  /* ── 카드 생성과 관리(admin) ── */

  // 비어 있는 다음 카드 번호(mc-013, mc-014...)를 찾아줍니다.
  function nextModuleCardId(){
    let n = cards().length + 1;
    let id = 'mc-' + String(n).padStart(3, '0');
    while (cards().some(function(card){ return card.id === id; })) {
      n += 1;
      id = 'mc-' + String(n).padStart(3, '0');
    }
    return id;
  }

  // 템플릿의 QC 목록을 복사해서 새 카드에 넣어줍니다 (원본 템플릿 보호).
  function cloneChecklist(list){
    return Array.isArray(list) ? list.map(function(item){
      return { label: item.label, passed: !!item.passed };
    }) : [];
  }

  // [버튼: admin "일괄 생성"] 선택한 템플릿들로 새 카드를 만들어 목록에 추가하고 저장.
  function createAdminCards(templates, options){
    const selected = Array.isArray(templates) ? templates.filter(Boolean) : [];
    if (!selected.length) return [];

    const config = options || {};
    const created = selected.map(function(template){
      const card = {
        id: nextModuleCardId(),
        projectId: config.projectId || 'proj-001',
        spec: template.spec,
        specCode: template.specCode,
        dial: template.dial,
        module: template.module,
        chain: template.chain,
        step: template.step,
        gateRef: template.gateRef,
        status: STATUSES.PENDING,
        assignedTo: config.assignedTo || null,
        assignedBy: 'admin-001',
        mhEstimate: template.mhEstimate,
        mhActual: 0,
        createdAt: today(),
        dueDate: config.dueDate || '',
        attachments: [],
        comments: [],
        workLogs: [],
        qcChecklist: cloneChecklist(template.qcChecklist)
      };
      cards().push(card);
      addAudit(card, {
        actor: actorName('admin'),
        role: 'PM',
        action: 'card.created',
        icon: 'plus-circle',
        tone: 'pend',
        desc: card.module + ' created from admin bulk create.'
      });
      return card;
    });

    persist();
    return created;
  }

  // [버튼: admin "마감 변경"] YYYY-MM-DD 형식일 때만 마감일을 바꿔줍니다.
  function setDueDate(card, dueDate){
    if (!card || !/^\d{4}-\d{2}-\d{2}$/.test(String(dueDate || '').trim())) return false;
    card.dueDate = String(dueDate).trim();
    persist();
    return true;
  }

  // [버튼: admin "완료 처리"] 승인대기(done)로 전환. 'Client 전달'과 같은 가드를 씁니다
  // — 검토중(review) 카드만 통과. (작업자/검토 단계를 건너뛰는 우회를 막기 위해)
  function markDone(card){
    if (!canAdminSendToClient(card)) throw new Error('Only PM review cards can be marked done.');
    const from = card.status;
    card.status = STATUSES.CLIENT_REVIEW;
    card.completedAt = nowText();
    recordStatusChange(card, from, card.status, {
      role: 'PM',
      actor: actorName('admin'),
      eventType: 'card.done',
      icon: 'check-circle-2',
      visibility: 'public',
      title: 'Ready for approval',
      summary: card.module + ' moved to client approval.',
      tone: 'pend'
    });
    persist();
    return card;
  }

  /* ── 시동 걸기: 이 파일이 로드되는 순간 아래 네 줄이 순서대로 실행됩니다 ── */
  hydrate();          // ① 브라우저 저장본(없으면 시드)으로 카드 목록 준비
  bindAutoPersist();  // ② 탭 닫힘/숨김 때 자동 저장 예약
  // ③ 바깥 세상에 공개할 함수들. 화면은 window.ORDO_MODULE_CARD_LIFECYCLE.함수명 으로 사용.
  window.ORDO_MODULE_CARD_LIFECYCLE = {
    STATUSES,
    STORAGE_KEY,
    REMOTE_API_PATH,
    addAttachment,
    addFreeComment,
    addWorkLog,
    approveClient,
    canAdminSendToClient,
    canWorkerSubmit,
    backendInfo,
    createAdminCards,
    hydrateRemote,
    markDone,
    persist,
    qcComplete,
    reassign,
    requestRevision,
    reset,
    sendAdminToClient,
    saveRemoteNow,
    setDueDate,
    storageInfo,
    submitWorkerReview,
    updateQc
  };
  hydrateRemote();    // ④ 서버에 저장본이 있는지 물어보기 (도착하면 화면 갱신)
})();
