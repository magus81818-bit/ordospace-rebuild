/* ============================================================
   [이 파일은] room.data.js 의 데이터를 조회·집계·정렬하는 "사서" 역할.
                화면이 데이터를 직접 뒤지지 않고, 이 파일의 함수를 통해 물어봅니다.
                (나중에 실서버가 붙으면, 이 파일만 API 호출로 교체하면 됩니다)
   [언제 실행] 페이지 로드 시 room.data.js 바로 뒤에 실행.
   [주요 등장인물]
     - getProjectRoomMetrics   : 프로젝트 개수/상태 요약 숫자
     - getActionRoomMetrics    : 대기 조치 개수/긴급도 요약
     - getSortedPendingActions : 대기 조치를 우선순위→긴급도→날짜 순으로 정렬
     - getDashboardPendingActionCards : 대시보드에 표시할 상위 N건
     - formatRelativeKo        : 날짜를 "2시간 전", "어제" 같은 한국어로 변환
   [연결] ← client-workspace.screen.js 의 dashboard/project 렌더 함수들이 호출
          → room.data.js 의 ORDO_ROOM_DATA 를 읽음
   [다음 읽을 파일] app/screens/client-workspace.screen.js (이 데이터를 화면에 그리는 곳)
   [수정할 때 주의] ORDO_DEMO_NOW(2026-04-28 12:00) 가 시연 기준 시각.
                     실서버 전환 시 new Date() 로 교체해야 합니다.
   ============================================================ */
function getProjectPriorityCode(project){
  return project?.priorityCode || String(project?.priority || '').match(/P[1-4]/)?.[0] || 'P4';
}
function isProjectActive(project){
  const status = String(project?.status || '').trim().toLowerCase();
  return !/(완료|종료|archive|archived|closed|done)/i.test(status);
}
function isProjectInProgress(project){
  return String(project?.status || '').trim() === '진행 중';
}
function getRoomProjectById(projectId, projects){
  const list = projects || ORDO_ROOM_DATA.projects || [];
  return list.find(function(p){ return p.projectId === projectId || p.id === projectId; }) || null;
}
function getActionStatusLabel(action){
  const status = action?.statusLabel || action?.status || '';
  if (ORDO_ACTION_STATUS_CODE[status]) return status;
  const codeMatch = Object.keys(ORDO_ACTION_STATUS_CODE).find(function(label){ return ORDO_ACTION_STATUS_CODE[label] === status; });
  return codeMatch || String(status || '');
}
function isActionDone(action){
  const text = [getActionStatusLabel(action), action?.status, action?.kind, action?.title].join(' ');
  return /(완료|종료|closed|resolved|done|delivered|uploaded|approved)/i.test(text) &&
    !/(승인 대기|컨펌 대기|변경 요청|응답 필요|보완 요청|client-approval|client-confirm-pending|client-change-request|client-response-required)/i.test(text);
}
function isActionInformational(action){
  const label = getActionStatusLabel(action);
  const status = String(action?.status || '');
  const text = [label, status, action?.kind, action?.title].join(' ');
  const explicitPending = /(승인 대기|컨펌 대기|변경 요청|응답 필요|보완 요청|client response required|client-approval|client-confirm-pending|client-change-request|client-response-required)/i.test(text);
  if (explicitPending) return false;
  if (action?.tone === 'ok') return true;
  return /(산출물 확인|확인|정보|참고|client-deliverable-review)/i.test(text);
}
function isPendingAction(action){
  if (!action || isActionDone(action) || isActionInformational(action)) return false;
  const label = getActionStatusLabel(action);
  const status = String(action.status || '');
  const text = [label, status, action.kind, action.title].join(' ');
  return /(승인 대기|컨펌 대기|변경 요청|응답 필요|보완 요청|client response required|client-approval|client-confirm-pending|client-change-request|client-response-required)/i.test(text);
}
function getProjectPendingActionsCount(project, actions){
  const projectId = project?.projectId || project?.id;
  return (actions || ORDO_ROOM_DATA.actions || []).filter(function(action){
    return isPendingAction(action) && action.projectId === projectId;
  }).length;
}
function getProjectOpenRisksCount(project){
  const explicit = Number(project?.openRisksCount);
  if (Number.isFinite(explicit)) return explicit;
  return getProjectPriorityCode(project) === 'P1' ? 1 : 0;
}
function getActionPriorityCode(action, projects){
  const direct = action?.priorityCode || String(action?.priority || '').match(/P[1-4]/)?.[0];
  if (direct) return direct;
  return getProjectPriorityCode(getRoomProjectById(action?.projectId, projects));
}
function getProjectRoomMetrics(projects){
  const list = projects || ORDO_ROOM_DATA.projects || [];
  const actions = ORDO_ROOM_DATA.actions || [];
  return {
    totalProjects: list.length,
    activeProjects: list.filter(isProjectActive).length,
    inProgressProjects: list.filter(isProjectInProgress).length,
    p1ImmediateProjects: list.filter(function(p){ return getProjectPriorityCode(p) === 'P1'; }).length,
    projectsWithPendingActions: list.filter(function(p){ return getProjectPendingActionsCount(p, actions) > 0; }).length
  };
}
function getActionRoomMetrics(actions, projects){
  const list = actions || ORDO_ROOM_DATA.actions || [];
  const projectList = projects || ORDO_ROOM_DATA.projects || [];
  const pendingActions = list.filter(isPendingAction);
  const approvalPendingActions = pendingActions.filter(function(action){
    return /승인 대기|client-approval/i.test([getActionStatusLabel(action), action.status].join(' '));
  });
  const p1ImmediateActions = pendingActions.filter(function(action){ return getActionPriorityCode(action, projectList) === 'P1'; });
  const oldPendingActions = pendingActions.filter(function(action){ return /([7-9]|\d{2,})일 전/.test(String(action.relative || '')); });
  return {
    pendingActions: pendingActions.length,
    approvalPendingActions: approvalPendingActions.length,
    p1ImmediateActions: p1ImmediateActions.length,
    informationalActions: list.filter(isActionInformational).length,
    oldPendingActions: oldPendingActions.length
  };
}
const ORDO_DEMO_NOW = new Date('2026-04-28T12:00:00+09:00');
function parseRoomDate(value){
  const raw = String(value || '');
  const m = raw.match(/(\d{1,2})월\s*(\d{1,2})일(?:\s*(\d{1,2}):(\d{2}))?/);
  if (!m) return 0;
  return new Date(ORDO_DEMO_NOW.getFullYear(), Number(m[1]) - 1, Number(m[2]), Number(m[3] || 0), Number(m[4] || 0)).getTime();
}
function parseDemoDate(value){
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  const raw = String(value || '').trim();
  if (!raw) return null;
  const direct = new Date(raw);
  if (!Number.isNaN(direct.getTime())) return direct;
  const stamp = parseRoomDate(raw);
  return stamp ? new Date(stamp) : null;
}
function formatRelativeKo(isoOrDate, options){
  options = options || {};
  const date = parseDemoDate(isoOrDate);
  if (!date) return '';
  const diff = ORDO_DEMO_NOW.getTime() - date.getTime();
  const abs = Math.abs(diff);
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;
  if (diff < 0) {
    const daysUntil = Math.ceil(abs / day);
    return daysUntil <= 1 ? '예정' : 'D-' + daysUntil;
  }
  if (options.showHours !== false && abs < hour) return '방금 전';
  if (options.showHours !== false && abs < day) return Math.max(1, Math.floor(abs / hour)) + '시간 전';
  if (abs < day * 2) return '어제';
  return Math.floor(abs / day) + '일 전';
}
function formatRequestedLabel(isoOrDate){
  const relative = formatRelativeKo(isoOrDate);
  return relative ? relative + ' 요청' : '';
}
function formatUpdatedLabel(isoOrDate){
  return formatRelativeKo(isoOrDate);
}
function getSortedPendingActions(actions, projects){
  const projectList = projects || ORDO_ROOM_DATA.projects || [];
  const priorityRank = { P1: 0, P2: 1, P3: 2, P4: 3 };
  const toneRank = { crit: 0, warn: 1, pend: 2, ok: 3 };
  return (actions || ORDO_ROOM_DATA.actions || []).filter(isPendingAction).slice().sort(function(a, b){
    const priorityDelta = (priorityRank[getActionPriorityCode(a, projectList)] ?? 9) - (priorityRank[getActionPriorityCode(b, projectList)] ?? 9);
    if (priorityDelta) return priorityDelta;
    const toneDelta = (toneRank[a.tone] ?? 9) - (toneRank[b.tone] ?? 9);
    if (toneDelta) return toneDelta;
    return (parseRoomDate(a.requestedAt || a.requested) || 0) - (parseRoomDate(b.requestedAt || b.requested) || 0);
  });
}
function getDashboardPendingActionCards(limit){
  return getSortedPendingActions(ORDO_ROOM_DATA.actions || [], ORDO_ROOM_DATA.projects || []).slice(0, limit || 3);
}
function getReportWeekNumber(report){
  const match = String(report?.title || '').match(/Week\s*(\d+)/i);
  return match ? Number(match[1]) : 0;
}
function getDashboardReports(limit){
  return (ORDO_ROOM_DATA.reports || []).slice().sort(function(a, b){
    const weekDelta = getReportWeekNumber(b) - getReportWeekNumber(a);
    if (weekDelta) return weekDelta;
    return (parseRoomDate(b.publishedAt || b.published) || 0) - (parseRoomDate(a.publishedAt || a.published) || 0);
  }).slice(0, limit || 2);
}
function formatReportDateLabel(report){
  return (report?.statusLabel || report?.status || '리포트') + ' · ' + (report?.publishedAt || report?.published || '일정 확인');
}
window.ORDO_ROOM_REPO = {
  getProjectPriorityCode,
  isProjectActive,
  isProjectInProgress,
  getRoomProjectById,
  getActionStatusLabel,
  isActionDone,
  isActionInformational,
  isPendingAction,
  getProjectPendingActionsCount,
  getProjectOpenRisksCount,
  getActionPriorityCode,
  getProjectRoomMetrics,
  getActionRoomMetrics,
  ORDO_DEMO_NOW,
  parseRoomDate,
  parseDemoDate,
  formatRelativeKo,
  formatRequestedLabel,
  formatUpdatedLabel,
  getSortedPendingActions,
  getDashboardPendingActionCards,
  getReportWeekNumber,
  getDashboardReports,
  formatReportDateLabel,
};