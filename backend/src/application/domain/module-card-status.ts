import { CardStatus, QcStatus, Role } from "../../generated/prisma/client.js";

export type CardActionType =
  | "assign"
  | "update"
  | "submit"
  | "sendToClient"
  | "approve"
  | "requestRevision";

export interface TransitionRule {
  role: Role; // 이 행위를 할 수 있는 역할
  from: CardStatus[]; // 허용 시작 상태 ("assign"은 신규 생성이라 빈 배열)
}

// 라이프사이클의 '법률': 누가, 어떤 상태에서 이 행위를 할 수 있는가
export const TRANSITIONS: Record<CardActionType, TransitionRule> = {
  assign: { role: "ADMIN", from: [] },
  update: {
    role: "WORKER",
    from: ["PENDING", "IN_PROGRESS", "REVISION_REQUESTED"],
  },
  submit: { role: "WORKER", from: ["QC_READY"] },
  sendToClient: { role: "ADMIN", from: ["ADMIN_REVIEW"] },
  approve: { role: "CLIENT", from: ["CLIENT_REVIEW"] },
  requestRevision: { role: "CLIENT", from: ["CLIENT_REVIEW"] },
};

// 행위 후의 목표 상태 (update는 입력값에 따라 갈리므로 제외)
export const nextStatusOf = (
  action: Exclude<CardActionType, "update">,
): CardStatus => {
  switch (action) {
    case "assign":
      return "PENDING";
    case "submit":
      return "ADMIN_REVIEW";
    case "sendToClient":
      return "CLIENT_REVIEW";
    case "approve":
      return "APPROVED";
    case "requestRevision":
      return "REVISION_REQUESTED";
  }
};

// worker 업데이트의 목표 상태: 진행률 100 + QC 통과일 때만 제출 가능(QC_READY)
export const resolveWorkerUpdateStatus = (
  progress: number,
  qcStatus: QcStatus,
): CardStatus => {
  return progress >= 100 && qcStatus === "PASSED" ? "QC_READY" : "IN_PROGRESS";
};

// 역할과 현재 상태로 이 행위가 합법인지 순수 판정 (예외는 서비스가 던진다)
export const canPerform = (
  action: CardActionType,
  actorRole: Role,
  currentStatus: CardStatus,
): boolean => {
  const rule = TRANSITIONS[action];
  if (rule.role !== actorRole) return false;
  if (action === "assign") return true; // 신규 생성은 시작 상태가 없음
  return rule.from.includes(currentStatus);
};
