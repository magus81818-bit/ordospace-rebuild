/* ============================================================
   [이 파일은] 백엔드 카드 ↔ 기존 프론트 카드 모양을 이어주는 "번역기"(순수 함수).
                두 모델의 필드가 달라서(백엔드 lean, 프론트 mock-rich) 표시용으로 매핑하고,
                Slice 3(액션)을 위해 서버 원본 id 를 _serverId/_serverProjectId 로 보존합니다.
   [언제 실행] backend.sync 가 목록을 받은 직후 호출.
   [연결] ← module-card-backend.sync.js 가 사용 / → 아무것도 호출 안 함(순수)
   [수정할 때 주의] 상태 매핑은 백엔드 CardStatus enum 기준.
                     프론트 상태(pending/in_progress/review/done/approved/revision)와 1:1 아님(손실 매핑).
   ============================================================ */
window.ORDO_MODULE_CARD_ADAPTER = (function(){
  // 백엔드 CardStatus → 프론트 status (QC_READY 는 프론트에 없어 in_progress 로 근사)
  var STATUS_MAP = {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    QC_READY: 'in_progress',
    ADMIN_REVIEW: 'review',
    CLIENT_REVIEW: 'done',       // 프론트 'done' = "클라이언트 승인 대기"
    APPROVED: 'approved',
    REVISION_REQUESTED: 'revision'
  };

  function mapStatus(s){ return STATUS_MAP[s] || 'pending'; }

  function toYmd(v){
    if (!v) return '';
    var d = new Date(v);
    if (isNaN(d.getTime())) return '';
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  }

  // 백엔드 qcStatus(단일값)를 프론트 화면의 체크리스트 1항목으로 근사 표시
  function qcChecklistFrom(card){
    return [{ label: 'QC: ' + (card.qcStatus || 'PENDING'), passed: card.qcStatus === 'PASSED' }];
  }

  function toFrontendCard(card){
    var assignedKey = (card.assignedToId != null) ? ('srv-user-' + card.assignedToId) : null;
    return {
      id: 'srv-' + card.id,
      _serverId: card.id,
      projectId: 'proj-' + card.projectId,
      _serverProjectId: card.projectId,
      _serverStatus: card.status,
      spec: card.module || '',
      specCode: '',
      dial: '',
      module: card.title || card.module || '(제목 없음)',
      description: card.description || '',
      chain: 'dev',
      step: 3,
      gateRef: '',
      status: mapStatus(card.status),
      assignedTo: assignedKey,
      assignedBy: 'admin-001',
      progress: (typeof card.progress === 'number') ? card.progress : 0,
      qcStatus: card.qcStatus || 'PENDING',
      mhEstimate: '',
      mhActual: 0,
      createdAt: toYmd(card.createdAt),
      dueDate: toYmd(card.dueDate),
      revisionCount: card.revisionCount || 0,
      attachments: [],
      comments: [],
      workLogs: [],
      qcChecklist: qcChecklistFrom(card),
      _projectName: card.project && card.project.name,
      _assignedUsername: card.assignedTo && card.assignedTo.username
    };
  }

  function toFrontendCards(list){
    return Array.isArray(list) ? list.map(toFrontendCard) : [];
  }

  // 서버 담당자(username)를 화면 이름표(people 맵) 항목으로
  function peopleFrom(list){
    var people = {};
    (Array.isArray(list) ? list : []).forEach(function(card){
      if (card.assignedToId != null) {
        people['srv-user-' + card.assignedToId] = {
          name: (card.assignedTo && card.assignedTo.username) || ('사용자 ' + card.assignedToId),
          role: 'Worker', load: '', tone: 'ok'
        };
      }
    });
    return people;
  }

  return {
    STATUS_MAP: STATUS_MAP,
    mapStatus: mapStatus,
    toFrontendCard: toFrontendCard,
    toFrontendCards: toFrontendCards,
    peopleFrom: peopleFrom
  };
})();
